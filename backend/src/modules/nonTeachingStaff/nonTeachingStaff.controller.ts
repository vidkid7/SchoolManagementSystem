import { Request, Response } from 'express';
import User, { UserRole } from '@models/User.model';
import { logger } from '@utils/logger';

// In-memory stores for non-teaching staff data
const taskAssignments: Map<number, any> = new Map();
const workSchedules: Map<string, any> = new Map(); // userId_date -> schedule
let nextTaskId = 1;

class NonTeachingStaffController {
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const user = await User.findByPk(userId, {
        attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'phoneNumber', 'role', 'status']
      });

      res.status(200).json({
        success: true,
        data: {
          profile: user,
          role: UserRole.NON_TEACHING_STAFF,
          quickLinks: [
            { label: 'Communication', path: '/communication/messages' },
            { label: 'Announcements', path: '/communication/announcements' },
            { label: 'Calendar', path: '/calendar' },
            { label: 'Documents', path: '/documents' }
          ]
        }
      });
    } catch (error: any) {
      logger.error('Non-teaching staff dashboard error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'STAFF_DASHBOARD_ERROR', message: error.message || 'Failed to load dashboard' }
      });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const user = await User.findByPk(userId, {
        attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'phoneNumber', 'role', 'status', 'createdAt']
      });

      if (!user) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
        return;
      }

      res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      logger.error('Non-teaching staff profile error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'PROFILE_ERROR', message: error.message || 'Failed to load profile' }
      });
    }
  }

  // ─────────────────── TASK MANAGEMENT ───────────────────

  async getTasks(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { status } = req.query;
      let tasks = Array.from(taskAssignments.values()).filter(t => t.assignedTo === userId);
      if (status) tasks = tasks.filter(t => t.status === String(status));
      res.status(200).json({ success: true, data: { tasks, total: tasks.length } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'TASK_LIST_ERROR', message: error.message } });
    }
  }

  async getAllTasks(_req: Request, res: Response): Promise<void> {
    try {
      const tasks = Array.from(taskAssignments.values());
      res.status(200).json({ success: true, data: { tasks, total: tasks.length } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'TASK_LIST_ERROR', message: error.message } });
    }
  }

  async createTask(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, assignedTo, dueDate, priority, category } = req.body;
      if (!title || !assignedTo) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'title and assignedTo are required' } });
        return;
      }
      const task = {
        id: nextTaskId++, title, description: description ?? '',
        assignedTo: Number(assignedTo), assignedBy: req.user?.userId,
        dueDate: dueDate ?? null, priority: priority ?? 'medium',
        category: category ?? 'general', status: 'pending',
        createdAt: new Date().toISOString()
      };
      taskAssignments.set(task.id, task);
      res.status(201).json({ success: true, data: task });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'TASK_CREATE_ERROR', message: error.message } });
    }
  }

  async updateTaskStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.taskId);
      const task = taskAssignments.get(id);
      if (!task) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } }); return; }
      const { status, completionNote } = req.body;
      const updated = { ...task, status: status ?? task.status, completionNote: completionNote ?? task.completionNote, updatedAt: new Date().toISOString() };
      taskAssignments.set(id, updated);
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'TASK_UPDATE_ERROR', message: error.message } });
    }
  }

  // ─────────────────── WORK SCHEDULE ───────────────────

  async getSchedule(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { week } = req.query; // ISO week start date
      const schedules = Array.from(workSchedules.values()).filter(s => {
        if (s.userId !== userId) return false;
        if (week) return s.date >= String(week) && s.date < String(week) + 'Z';
        return true;
      });
      res.status(200).json({ success: true, data: { schedules, total: schedules.length } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'SCHEDULE_GET_ERROR', message: error.message } });
    }
  }

  async setSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { userId, date, shiftStart, shiftEnd, location, notes } = req.body;
      if (!userId || !date) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'userId and date are required' } });
        return;
      }
      const key = `${userId}_${date}`;
      const schedule = { userId: Number(userId), date, shiftStart: shiftStart ?? '08:00', shiftEnd: shiftEnd ?? '17:00', location: location ?? '', notes: notes ?? '', updatedBy: req.user?.userId, updatedAt: new Date().toISOString() };
      workSchedules.set(key, schedule);
      res.status(200).json({ success: true, data: schedule });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'SCHEDULE_SET_ERROR', message: error.message } });
    }
  }
}

export default new NonTeachingStaffController();
