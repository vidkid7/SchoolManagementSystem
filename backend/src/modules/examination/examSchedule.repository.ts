import ExamSchedule, { ExamScheduleAttributes, ExamScheduleCreationAttributes } from '@models/ExamSchedule.model';
import Exam from '@models/Exam.model';
import { Op } from 'sequelize';

/**
 * ExamSchedule Repository
 * Handles database operations for exam schedules
 * 
 * Requirements: 7.3, 7.4
 */
class ExamScheduleRepository {
  /**
   * Create a new exam schedule
   */
  async create(scheduleData: ExamScheduleCreationAttributes): Promise<ExamSchedule> {
    return await ExamSchedule.create(scheduleData);
  }

  /**
   * Find exam schedule by ID
   */
  async findById(examScheduleId: number): Promise<ExamSchedule | null> {
    return await ExamSchedule.findByPk(examScheduleId, {
      include: [
        {
          model: Exam,
          as: 'exam'
        }
      ]
    });
  }

  /**
   * Find all exam schedules for a specific exam
   */
  async findByExamId(examId: number): Promise<ExamSchedule[]> {
    return await ExamSchedule.findAll({
      where: { examId },
      order: [['date', 'ASC'], ['startTime', 'ASC']]
    });
  }

  /**
   * Find all exam schedules for a specific date
   */
  async findByDate(date: Date): Promise<ExamSchedule[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await ExamSchedule.findAll({
      where: {
        date: {
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      include: [
        {
          model: Exam,
          as: 'exam'
        }
      ],
      order: [['startTime', 'ASC']]
    });
  }

  /**
   * Find all exam schedules within a date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<ExamSchedule[]> {
    return await ExamSchedule.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: Exam,
          as: 'exam'
        }
      ],
      order: [['date', 'ASC'], ['startTime', 'ASC']]
    });
  }

  /**
   * Find all exam schedules for a specific room
   */
  async findByRoom(roomNumber: string, date?: Date): Promise<ExamSchedule[]> {
    const where: any = { roomNumber };
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.date = {
        [Op.between]: [startOfDay, endOfDay]
      };
    }

    return await ExamSchedule.findAll({
      where,
      order: [['date', 'ASC'], ['startTime', 'ASC']]
    });
  }

  /**
   * Find all exam schedules where a teacher is an invigilator
   */
  async findByInvigilator(teacherId: number, date?: Date): Promise<ExamSchedule[]> {
    const where: any = {
      invigilators: {
        [Op.contains]: [teacherId]
      }
    };
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.date = {
        [Op.between]: [startOfDay, endOfDay]
      };
    }

    return await ExamSchedule.findAll({
      where,
      include: [
        {
          model: Exam,
          as: 'exam'
        }
      ],
      order: [['date', 'ASC'], ['startTime', 'ASC']]
    });
  }

  /**
   * Find overlapping exam schedules for a given date and time range
   */
  async findOverlapping(
    date: Date,
    startTime: string,
    endTime: string,
    excludeScheduleId?: number
  ): Promise<ExamSchedule[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const where: any = {
      date: {
        [Op.between]: [startOfDay, endOfDay]
      }
    };

    if (excludeScheduleId) {
      where.examScheduleId = {
        [Op.ne]: excludeScheduleId
      };
    }

    const schedules = await ExamSchedule.findAll({
      where,
      include: [
        {
          model: Exam,
          as: 'exam'
        }
      ]
    });

    // Filter for time overlap
    return schedules.filter(schedule => {
      const toMinutes = (time: string): number => {
        const [hour, min] = time.split(':').map(Number);
        return hour * 60 + min;
      };

      const scheduleStart = toMinutes(schedule.startTime);
      const scheduleEnd = toMinutes(schedule.endTime);
      const newStart = toMinutes(startTime);
      const newEnd = toMinutes(endTime);

      // Check if time ranges overlap
      return (
        (newStart < scheduleEnd && newEnd > scheduleStart) ||
        (scheduleStart < newEnd && scheduleEnd > newStart)
      );
    });
  }

  /**
   * Update exam schedule
   */
  async update(
    examScheduleId: number,
    updateData: Partial<ExamScheduleAttributes>
  ): Promise<ExamSchedule | null> {
    const schedule = await ExamSchedule.findByPk(examScheduleId);
    if (!schedule) {
      return null;
    }

    await schedule.update(updateData);
    return schedule;
  }

  /**
   * Delete exam schedule (soft delete)
   */
  async delete(examScheduleId: number): Promise<boolean> {
    const schedule = await ExamSchedule.findByPk(examScheduleId);
    if (!schedule) {
      return false;
    }

    await schedule.destroy();
    return true;
  }

  /**
   * Get all exam schedules for a class (via exams)
   */
  async findByClassId(classId: number, dateRange?: { start: Date; end: Date }): Promise<ExamSchedule[]> {
    const where: any = {};
    
    if (dateRange) {
      where.date = {
        [Op.between]: [dateRange.start, dateRange.end]
      };
    }

    return await ExamSchedule.findAll({
      where,
      include: [
        {
          model: Exam,
          as: 'exam',
          where: { classId },
          required: true
        }
      ],
      order: [['date', 'ASC'], ['startTime', 'ASC']]
    });
  }

  /**
   * Bulk create exam schedules
   */
  async bulkCreate(schedules: ExamScheduleCreationAttributes[]): Promise<ExamSchedule[]> {
    return await ExamSchedule.bulkCreate(schedules);
  }
}

export default new ExamScheduleRepository();
