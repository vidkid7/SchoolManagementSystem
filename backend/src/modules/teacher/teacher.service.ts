import { Op } from 'sequelize';
import Staff from '@models/Staff.model';
import StaffAssignment from '@models/StaffAssignment.model';
import Class from '@models/Class.model';
import Student from '@models/Student.model';
import AttendanceRecord from '@models/AttendanceRecord.model';
import { Period, Timetable } from '@models/Timetable.model';
import { StudentStatus } from '@models/Student.model';

interface ScheduleItem {
  period: number;
  time: string;
  subject: string;
  class: string;
  room: string;
  status: string;
}

interface PendingTask {
  type: string;
  title: string;
  priority: string;
  count: number;
}

interface ClassPerformance {
  class: string;
  attendance: number;
  avgGrade: number;
  assignments: number;
}

interface AttendanceTrend {
  week: string;
  rate: number;
}

interface TeacherStats {
  classesToday: number;
  pendingTasks: number;
  totalStudents: number;
  avgAttendance: number;
}

interface Notification {
  icon: string;
  text: string;
  time: string;
}

type ClassSummary = Pick<Class, 'gradeLevel' | 'section'>;
type AssignmentWithClass = StaffAssignment & { class?: ClassSummary };
type PeriodWithTimetable = Period & { timetable?: Pick<Timetable, 'classId'> };

class TeacherService {
  async getStaffFromUserId(userId: number): Promise<Staff | null> {
    return Staff.findOne({
      where: { userId },
    });
  }

  async getTodaySchedule(staffId: number): Promise<ScheduleItem[]> {
    const today = new Date();
    const dayOfWeek = today.getDay();

    const assignments = await StaffAssignment.findAll({
      where: {
        staffId,
        isActive: true,
      },
      include: [
        {
          model: Class,
          as: 'class',
          attributes: ['className', 'section'],
        },
      ],
    });

    const classLabelMap = new Map<number, string>();
    for (const assignment of assignments as AssignmentWithClass[]) {
      if (assignment.classId && assignment.class) {
        classLabelMap.set(
          assignment.classId,
          `${assignment.class.gradeLevel} ${assignment.class.section || ''}`.trim()
        );
      }
    }

    const periods = await Period.findAll({
      where: {
        teacherId: staffId,
      },
      include: [
        {
          model: Timetable,
          as: 'timetable',
          where: { dayOfWeek: dayOfWeek },
        },
      ],
      order: [['periodNumber', 'ASC']],
    });

    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();

    return (periods as PeriodWithTimetable[]).map((tt, index) => {
      const periodStart = this.parseTime(tt.startTime);
      let status = 'upcoming';

      if (periodStart) {
        if (currentHour > periodStart.hour || (currentHour === periodStart.hour && currentMinute >= periodStart.minute)) {
          const periodEnd = this.parseTime(tt.endTime);
          if (periodEnd && (currentHour < periodEnd.hour || (currentHour === periodEnd.hour && currentMinute < periodEnd.minute))) {
            status = 'ongoing';
          } else {
            status = 'completed';
          }
        }
      }

      return {
        period: tt.periodNumber || index + 1,
        time: tt.startTime && tt.endTime ? `${tt.startTime} - ${tt.endTime}` : 'N/A',
        subject: 'N/A',
        class: tt.timetable?.classId ? (classLabelMap.get(tt.timetable.classId) || 'N/A') : 'N/A',
        room: tt.roomNumber || 'N/A',
        status,
      };
    });
  }

  async getPendingTasks(staffId: number): Promise<PendingTask[]> {
    const tasks: PendingTask[] = [];

    const assignments = await StaffAssignment.findAll({
      where: { staffId, isActive: true },
      include: [{ model: Class, as: 'class' }],
    });

    const classIds = assignments.filter((a) => a.assignmentType === 'class_teacher').map((a) => a.classId);

    if (classIds.length > 0) {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      for (const classId of classIds) {
        if (!classId) continue;

        const studentsInClass = await Student.count({
          where: { currentClassId: classId, status: StudentStatus.ACTIVE },
        });

        const markedToday = await AttendanceRecord.count({
          where: {
            classId,
            date: startOfDay,
          },
          distinct: true,
          col: 'studentId',
        });

        if (markedToday < studentsInClass) {
          const classInfo = await Class.findByPk(classId);
          tasks.push({
            type: 'attendance',
            title: `Mark attendance for Grade ${classInfo?.gradeLevel || ''} ${classInfo?.section || ''}`.trim(),
            priority: 'high',
            count: studentsInClass - markedToday,
          });
        }
      }
    }

    tasks.push({
      type: 'grading',
      title: 'Review pending assignments',
      priority: 'medium',
      count: 0,
    });

    tasks.push({
      type: 'lesson',
      title: 'Prepare lesson plans for tomorrow',
      priority: 'low',
      count: 1,
    });

    return tasks;
  }

  async getClassPerformance(staffId: number): Promise<ClassPerformance[]> {
    const assignments = await StaffAssignment.findAll({
      where: { staffId, isActive: true },
      include: [{ model: Class, as: 'class' }],
    });

    const performances: ClassPerformance[] = [];

    for (const assignment of assignments as AssignmentWithClass[]) {
      if (!assignment.classId || !assignment.class) continue;

      const students = await Student.findAll({
        where: { currentClassId: assignment.classId, status: StudentStatus.ACTIVE },
        attributes: ['studentId'],
      });

      const studentIds = students.map((s) => s.studentId);

      if (studentIds.length === 0) continue;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const attendanceRecords = await AttendanceRecord.count({
        where: {
          studentId: { [Op.in]: studentIds },
          date: { [Op.gte]: thirtyDaysAgo },
          status: { [Op.in]: ['present', 'late'] },
        },
      });

      const totalRecords = await AttendanceRecord.count({
        where: {
          studentId: { [Op.in]: studentIds },
          date: { [Op.gte]: thirtyDaysAgo },
        },
      });

      const attendanceRate = totalRecords > 0 ? Math.round((attendanceRecords / totalRecords) * 100) : 0;

      performances.push({
        class: `${assignment.class.gradeLevel} ${assignment.class.section || ''}`.trim(),
        attendance: attendanceRate,
        avgGrade: 3.5,
        assignments: 85,
      });
    }

    return performances;
  }

  async getAttendanceTrend(staffId: number): Promise<AttendanceTrend[]> {
    const trend: AttendanceTrend[] = [];

    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const assignments = await StaffAssignment.findAll({
        where: { staffId, isActive: true },
      });

      const classIds = assignments.map((a) => a.classId).filter(Boolean) as number[];

      if (classIds.length === 0) {
        trend.push({ week: `Week ${4 - i}`, rate: 0 });
        continue;
      }

      const students = await Student.findAll({
        where: { currentClassId: { [Op.in]: classIds }, status: StudentStatus.ACTIVE },
        attributes: ['studentId'],
      });

      const studentIds = students.map((s) => s.studentId);

      const present = await AttendanceRecord.count({
        where: {
          studentId: { [Op.in]: studentIds },
          date: { [Op.gte]: weekStart, [Op.lte]: weekEnd },
          status: { [Op.in]: ['present', 'late'] },
        },
      });

      const total = await AttendanceRecord.count({
        where: {
          studentId: { [Op.in]: studentIds },
          date: { [Op.gte]: weekStart, [Op.lte]: weekEnd },
        },
      });

      trend.push({
        week: `Week ${4 - i}`,
        rate: total > 0 ? Math.round((present / total) * 100) : 0,
      });
    }

    return trend;
  }

  async getTeacherStats(staffId: number): Promise<TeacherStats> {
    const [schedule, tasks, performances] = await Promise.all([
      this.getTodaySchedule(staffId),
      this.getPendingTasks(staffId),
      this.getClassPerformance(staffId),
    ]);

    const assignments = await StaffAssignment.findAll({
      where: { staffId, isActive: true },
    });

    const classIds = [...new Set(assignments.map((a) => a.classId).filter(Boolean))];

    let totalStudents = 0;
    for (const classId of classIds) {
      const count = await Student.count({
        where: { currentClassId: classId, status: StudentStatus.ACTIVE },
      });
      totalStudents += count;
    }

    const avgAttendance =
      performances.length > 0
        ? Math.round(performances.reduce((sum, p) => sum + p.attendance, 0) / performances.length)
        : 0;

    return {
      classesToday: schedule.length,
      pendingTasks: tasks.length,
      totalStudents,
      avgAttendance,
    };
  }

  async getNotifications(staffId: number): Promise<Notification[]> {
    const notifications: Notification[] = [];

    const tasks = await this.getPendingTasks(staffId);
    const highPriorityTasks = tasks.filter((t) => t.priority === 'high');

    if (highPriorityTasks.length > 0) {
      notifications.push({
        icon: 'warning',
        text: `${highPriorityTasks.length} high priority task(s) pending`,
        time: 'Just now',
      });
    }

    const performances = await this.getClassPerformance(staffId);
    const lowAttendance = performances.filter((p) => p.attendance < 75);

    if (lowAttendance.length > 0) {
      notifications.push({
        icon: 'warning',
        text: `Low attendance in ${lowAttendance.map((p) => p.class).join(', ')}`,
        time: '1 hour ago',
      });
    }

    notifications.push({
      icon: 'event',
      text: 'Staff meeting scheduled for tomorrow',
      time: '2 hours ago',
    });

    return notifications;
  }

  private parseTime(timeStr: string | undefined): { hour: number; minute: number } | null {
    if (!timeStr) return null;

    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!match) return null;

    return {
      hour: parseInt(match[1], 10),
      minute: parseInt(match[2], 10),
    };
  }
}

export default new TeacherService();
