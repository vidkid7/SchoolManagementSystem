import { Op } from 'sequelize';
import { UserRole } from '@models/User.model';
import User from '@models/User.model';
import StaffTask, { StaffTaskPriority, StaffTaskStatus } from '@models/StaffTask.model';
import StaffWorkSchedule from '@models/StaffWorkSchedule.model';

export interface CreateTaskInput {
  title: string;
  description?: string;
  assignedTo: number;
  dueDate?: string | null;
  priority?: StaffTaskPriority;
  category?: string;
}

export interface ScheduleInput {
  userId: number;
  date: string;
  shiftStart?: string;
  shiftEnd?: string;
  location?: string;
  notes?: string;
}

function httpError(message: string, statusCode: number): Error & { statusCode: number } {
  return Object.assign(new Error(message), { statusCode });
}

function validDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function weekBounds(week?: string): [string, string] {
  let start: Date;
  if (week) {
    if (!validDateOnly(week)) throw httpError('Week must be a valid YYYY-MM-DD date', 400);
    start = new Date(`${week}T00:00:00.000Z`);
  } else {
    start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const daysSinceMonday = (start.getUTCDay() + 6) % 7;
    start.setUTCDate(start.getUTCDate() - daysSinceMonday);
  }
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
}

class StaffPortalService {
  listTasks(userId: number, status?: string): Promise<StaffTask[]> {
    const where: Record<string, unknown> = { assignedTo: userId };
    if (status) where.status = status;
    return StaffTask.findAll({ where, order: [['dueDate', 'ASC'], ['createdAt', 'DESC']] });
  }

  listAllTasks(): Promise<StaffTask[]> {
    return StaffTask.findAll({ order: [['createdAt', 'DESC']] });
  }

  async createTask(assignedBy: number, input: CreateTaskInput): Promise<StaffTask> {
    const assigner = await User.findByPk(assignedBy, { attributes: ['userId', 'role', 'schoolConfigId'] });
    if (!assigner || assigner.role !== UserRole.SCHOOL_ADMIN) throw httpError('Only a School Admin can assign staff tasks', 403);
    const assignee = await User.findOne({
      where: { userId: input.assignedTo, schoolConfigId: assigner.schoolConfigId, role: UserRole.NON_TEACHING_STAFF },
      attributes: ['userId'],
    });
    if (!assignee) {
      throw httpError('Assigned user must have a non-teaching staff account', 400);
    }
    if (input.dueDate && !validDateOnly(input.dueDate)) throw httpError('Due date must be a valid YYYY-MM-DD date', 400);
    return StaffTask.create({
      title: input.title.trim(),
      description: input.description?.trim() ?? '',
      assignedTo: input.assignedTo,
      assignedBy,
      dueDate: input.dueDate ? new Date(`${input.dueDate}T00:00:00.000Z`) : null,
      priority: input.priority ?? 'medium',
      category: input.category?.trim() || 'general',
      status: 'pending',
    });
  }

  async updateTaskStatus(taskId: number, userId: number, isAdmin: boolean, status: StaffTaskStatus, completionNote?: string): Promise<StaffTask | null> {
    const where: Record<string, unknown> = { id: taskId };
    if (!isAdmin) where.assignedTo = userId;
    const task = await StaffTask.findOne({ where });
    if (!task) return null;
    await task.update({ status, ...(completionNote === undefined ? {} : { completionNote: completionNote.trim() }) });
    return task;
  }

  async listSchedule(userId: number, week?: string): Promise<Array<Record<string, unknown>>> {
    const [startDate, endDate] = weekBounds(week);
    const schedules = await StaffWorkSchedule.findAll({
      where: { userId, date: { [Op.between]: [startDate, endDate] } },
      order: [['date', 'ASC']],
    });
    return schedules.map(schedule => {
      const date = String(schedule.date).slice(0, 10);
      const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
      const day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][weekday];
      return {
        id: schedule.id,
        date,
        day,
        startTime: schedule.shiftStart.slice(0, 5),
        endTime: schedule.shiftEnd.slice(0, 5),
        location: schedule.location,
        duties: schedule.notes,
      };
    });
  }

  async setSchedule(updatedBy: number, input: ScheduleInput): Promise<StaffWorkSchedule> {
    const updater = await User.findByPk(updatedBy, { attributes: ['userId', 'role', 'schoolConfigId'] });
    if (!updater || updater.role !== UserRole.SCHOOL_ADMIN) throw httpError('Only a School Admin can set staff schedules', 403);
    const user = await User.findOne({
      where: { userId: input.userId, schoolConfigId: updater.schoolConfigId, role: UserRole.NON_TEACHING_STAFF },
      attributes: ['userId'],
    });
    if (!user) {
      throw httpError('Schedule target must have a non-teaching staff account', 400);
    }
    if (!validDateOnly(input.date)) throw httpError('Schedule date must be a valid YYYY-MM-DD date', 400);
    const existing = await StaffWorkSchedule.findOne({ where: { userId: input.userId, date: input.date } });
    const shiftStart = input.shiftStart ?? existing?.shiftStart ?? '08:00';
    const shiftEnd = input.shiftEnd ?? existing?.shiftEnd ?? '17:00';
    if (shiftEnd <= shiftStart) throw httpError('Shift end must be later than shift start', 400);
    const values = {
      userId: input.userId,
      date: input.date,
      shiftStart,
      shiftEnd,
      location: input.location?.trim() ?? '',
      notes: input.notes?.trim() ?? '',
      updatedBy,
    };
    if (existing) {
      await existing.update(values);
      return existing;
    }
    return StaffWorkSchedule.create(values);
  }
}

export default new StaffPortalService();
