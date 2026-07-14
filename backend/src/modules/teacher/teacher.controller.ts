import { Request, Response, NextFunction } from 'express';
import { Op, WhereOptions } from 'sequelize';
import teacherService from './teacher.service';
import { logger } from '@utils/logger';
import BehaviorRecord, { BehaviorRecordAttributes } from '@models/BehaviorRecord.model';
import Student from '@models/Student.model';

const emptyDashboardData = {
  schedule: [],
  tasks: [],
  performances: [],
  trend: [],
  stats: {
    classesToday: 0,
    pendingTasks: 0,
    totalStudents: 0,
    avgAttendance: 0,
  },
  notifications: [],
};

function isSchoolAdmin(req: Request): boolean {
  return req.user?.role === 'School_Admin';
}

function canReturnEmptyTeacherData(req: Request): boolean {
  return ['School_Admin', 'Class_Teacher', 'Subject_Teacher', 'Department_Head'].includes(req.user?.role ?? '');
}

function sendEmptyTeacherData(req: Request, res: Response, message: string): boolean {
  if (!canReturnEmptyTeacherData(req)) {
    return false;
  }

  res.status(200).json({
    success: true,
    data: emptyDashboardData,
    message,
  });
  return true;
}

function getStudentName(student?: any, fallbackStudentId?: number): string {
  if (student) {
    const firstName = student.firstNameEn ?? '';
    const lastName = student.lastNameEn ?? '';
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName) {
      return fullName;
    }
  }

  return fallbackStudentId ? `Student #${fallbackStudentId}` : 'Student';
}

function mapBehaviorRecord(record: BehaviorRecord): Record<string, unknown> {
  const raw = record.get({ plain: true }) as any;

  return {
    id: raw.id,
    studentId: raw.studentId,
    studentName: getStudentName(raw.student, raw.studentId),
    type: raw.type,
    category: raw.category,
    description: raw.description,
    actionTaken: raw.actionTaken,
    date: raw.date,
    recordedBy: raw.recorder?.username ?? 'Teacher',
  };
}

export const getDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const staff = await teacherService.getStaffFromUserId(userId);

    if (!staff) {
      if (sendEmptyTeacherData(req, res, 'No staff profile is linked to this admin account')) {
        return;
      }

      res.status(404).json({
        success: false,
        message: 'Staff profile not found for this user',
      });
      return;
    }

    const [schedule, tasks, performances, trend, stats, notifications] = await Promise.all([
      teacherService.getTodaySchedule(staff.staffId),
      teacherService.getPendingTasks(staff.staffId),
      teacherService.getClassPerformance(staff.staffId),
      teacherService.getAttendanceTrend(staff.staffId),
      teacherService.getTeacherStats(staff.staffId),
      teacherService.getNotifications(staff.staffId),
    ]);

    res.status(200).json({
      success: true,
      data: {
        schedule,
        tasks,
        performances,
        trend,
        stats,
        notifications,
      },
      message: 'Teacher dashboard data retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching teacher dashboard:', error);
    next(error);
  }
};

export const getTodaySchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const staff = await teacherService.getStaffFromUserId(userId);

    if (!staff) {
      if (canReturnEmptyTeacherData(req)) {
        res.status(200).json({
          success: true,
          data: [],
          message: 'No staff schedule is linked to this admin account',
        });
        return;
      }

      res.status(404).json({
        success: false,
        message: 'Staff profile not found',
      });
      return;
    }

    const schedule = await teacherService.getTodaySchedule(staff.staffId);

    res.status(200).json({
      success: true,
      data: schedule,
      message: 'Today\'s schedule retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching today\'s schedule:', error);
    next(error);
  }
};

export const getPendingTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const staff = await teacherService.getStaffFromUserId(userId);

    if (!staff) {
      if (canReturnEmptyTeacherData(req)) {
        res.status(200).json({
          success: true,
          data: [],
          message: 'No staff tasks are linked to this admin account',
        });
        return;
      }

      res.status(404).json({
        success: false,
        message: 'Staff profile not found',
      });
      return;
    }

    const tasks = await teacherService.getPendingTasks(staff.staffId);

    res.status(200).json({
      success: true,
      data: tasks,
      message: 'Pending tasks retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching pending tasks:', error);
    next(error);
  }
};

export const getClassPerformance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const staff = await teacherService.getStaffFromUserId(userId);

    if (!staff) {
      if (canReturnEmptyTeacherData(req)) {
        res.status(200).json({
          success: true,
          data: [],
          message: 'No class performance is linked to this admin account',
        });
        return;
      }

      res.status(404).json({
        success: false,
        message: 'Staff profile not found',
      });
      return;
    }

    const performances = await teacherService.getClassPerformance(staff.staffId);

    res.status(200).json({
      success: true,
      data: performances,
      message: 'Class performance retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching class performance:', error);
    next(error);
  }
};

export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const staff = await teacherService.getStaffFromUserId(userId);

    if (!staff) {
      if (canReturnEmptyTeacherData(req)) {
        res.status(200).json({
          success: true,
          data: emptyDashboardData.stats,
          message: 'No teacher stats are linked to this admin account',
        });
        return;
      }

      res.status(404).json({
        success: false,
        message: 'Staff profile not found',
      });
      return;
    }

    const stats = await teacherService.getTeacherStats(staff.staffId);

    res.status(200).json({
      success: true,
      data: stats,
      message: 'Teacher stats retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching teacher stats:', error);
    next(error);
  }
};

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const staff = await teacherService.getStaffFromUserId(userId);

    if (!staff) {
      if (canReturnEmptyTeacherData(req)) {
        res.status(200).json({
          success: true,
          data: [],
          message: 'No teacher notifications are linked to this admin account',
        });
        return;
      }

      res.status(404).json({
        success: false,
        message: 'Staff profile not found',
      });
      return;
    }

    const notifications = await teacherService.getNotifications(staff.staffId);

    res.status(200).json({
      success: true,
      data: notifications,
      message: 'Notifications retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    next(error);
  }
};

export const getMyClass = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const staff = await teacherService.getStaffFromUserId(userId);

    if (!staff) {
      if (canReturnEmptyTeacherData(req)) {
        res.status(200).json({
          success: true,
          data: { classInfo: null, students: [] },
          message: 'No class is linked to this admin account',
        });
        return;
      }

      res.status(404).json({
        success: false,
        message: 'Staff profile not found',
      });
      return;
    }

    const classData = await teacherService.getMyClass(staff.staffId);

    res.status(200).json({
      success: true,
      data: classData,
      message: 'Class data retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching class data:', error);
    next(error);
  }
};

export const getBehaviorRecords = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const staff = await teacherService.getStaffFromUserId(userId);
    const classData = staff ? await teacherService.getMyClass(staff.staffId) : { students: [] };
    const studentIds = new Set<number>((classData.students ?? []).map((student: any) => Number(student.studentId)));
    const where: WhereOptions<BehaviorRecordAttributes> = isSchoolAdmin(req)
      ? {}
      : { studentId: { [Op.in]: Array.from(studentIds) } };
    const records = await BehaviorRecord.findAll({
      where,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['studentId', 'firstNameEn', 'lastNameEn'],
          required: false,
        },
      ],
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      limit: 100,
    });

    res.status(200).json({
      success: true,
      data: records.map(mapBehaviorRecord),
      message: 'Behavior records retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching behavior records:', error);
    next(error);
  }
};

export const createBehaviorRecord = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { studentId, type = 'neutral', category = 'other', description, actionTaken, date } = req.body;

    if (!studentId || !description) {
      res.status(400).json({
        success: false,
        message: 'studentId and description are required',
      });
      return;
    }

    const staff = req.user?.userId ? await teacherService.getStaffFromUserId(req.user.userId) : null;
    const classData = staff ? await teacherService.getMyClass(staff.staffId) : { students: [] };
    const student = (classData.students ?? []).find((item: any) => Number(item.studentId) === Number(studentId));
    const existingStudent = student
      ? student
      : await Student.findByPk(Number(studentId), {
          attributes: ['studentId', 'firstNameEn', 'lastNameEn'],
        });

    if (!student && !isSchoolAdmin(req)) {
      res.status(403).json({
        success: false,
        message: 'Selected student is not in your assigned class',
      });
      return;
    }

    if (!existingStudent) {
      res.status(404).json({
        success: false,
        message: 'Student not found',
      });
      return;
    }

    const record = await BehaviorRecord.create({
      studentId: Number(studentId),
      type,
      category,
      description,
      actionTaken,
      date: date || new Date().toISOString().split('T')[0],
      recordedBy: req.user?.userId,
    });

    res.status(201).json({
      success: true,
      data: {
        ...mapBehaviorRecord(record),
        studentName: getStudentName(existingStudent, Number(studentId)),
        recordedBy: req.user?.username || 'Teacher',
      },
      message: 'Behavior record created successfully',
    });
  } catch (error) {
    logger.error('Error creating behavior record:', error);
    next(error);
  }
};
