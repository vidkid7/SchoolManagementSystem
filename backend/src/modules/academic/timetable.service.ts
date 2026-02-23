import { Timetable, Period } from '@models/Timetable.model';
import { Subject } from '@models/Subject.model';
import Staff from '@models/Staff.model';
import { WhereOptions, Op } from 'sequelize';
import { logger } from '@utils/logger';
import { ValidationError } from '@middleware/errorHandler';

/**
 * Timetable Service
 * Handles timetable creation, period management, and teacher conflict validation
 * Requirements: 5.6, 5.7
 */
class TimetableService {
  /**
   * Create a new timetable for a class and day
   */
  async createTimetable(data: {
    classId: number;
    academicYearId: number;
    dayOfWeek: number;
  }): Promise<Timetable> {
    this.validateDayOfWeek(data.dayOfWeek);
    
    // Check if timetable already exists
    const existing = await Timetable.findOne({
      where: { classId: data.classId, academicYearId: data.academicYearId, dayOfWeek: data.dayOfWeek }
    });
    
    if (existing) {
      logger.info('Timetable already exists, returning existing', { timetableId: existing.timetableId, classId: data.classId, dayOfWeek: data.dayOfWeek });
      return existing;
    }
    
    const timetable = await Timetable.create(data);
    
    // If timetableId is null, fetch the record from database
    if (!timetable.timetableId) {
      const created = await Timetable.findOne({
        where: { classId: data.classId, academicYearId: data.academicYearId, dayOfWeek: data.dayOfWeek },
        order: [['createdAt', 'DESC']]
      });
      if (created) {
        logger.info('Timetable created and fetched', { timetableId: created.timetableId, classId: data.classId, dayOfWeek: data.dayOfWeek });
        return created;
      }
    }
    
    logger.info('Timetable created', { timetableId: timetable.timetableId, classId: data.classId, dayOfWeek: data.dayOfWeek });
    return timetable;
  }

  /**
   * Add a period to a timetable with teacher conflict validation
   */
  async addPeriod(timetableId: number, data: {
    periodNumber: number;
    startTime: string;
    endTime: string;
    subjectId?: number;
    teacherId?: number;
    roomNumber?: string;
  }): Promise<Period> {
    this.validateTimeFormat(data.startTime, data.endTime);
    await this.checkPeriodExists(timetableId, data.periodNumber);
    
    if (data.teacherId) {
      await this.validateTeacherAvailability(timetableId, data);
    }

    const period = await Period.create({ ...data, timetableId });
    logger.info('Period added to timetable', { periodId: period.periodId, timetableId, periodNumber: data.periodNumber });
    return period;
  }

  /**
   * Get timetable for a class with all periods
   */
  async getClassTimetable(classId: number, academicYearId?: number): Promise<Timetable[]> {
    const where: WhereOptions<Timetable> = { classId };
    if (academicYearId) where.academicYearId = academicYearId;

    return Timetable.findAll({
      where,
      include: [
        {
          model: Period,
          as: 'periods',
          include: [
            { model: Subject, as: 'subject', attributes: ['subjectId', 'code', 'nameEn', 'nameNp'] },
            { model: Staff, as: 'teacher', attributes: ['staffId', 'firstNameEn', 'middleNameEn', 'lastNameEn'] }
          ]
        }
      ],
      order: [['dayOfWeek', 'ASC'], [{ model: Period, as: 'periods' }, 'periodNumber', 'ASC']]
    });
  }

  /**
   * Get teacher's timetable
   */
  async getTeacherTimetable(teacherId: number, academicYearId?: number): Promise<Period[]> {
    const where: WhereOptions<Period> = { teacherId };
    const include: object[] = [
      { model: Timetable, as: 'timetable', attributes: ['timetableId', 'classId', 'dayOfWeek', 'academicYearId'] },
      { model: Subject, as: 'subject', attributes: ['subjectId', 'code', 'nameEn', 'nameNp'] }
    ];

    if (academicYearId) {
      (include[0] as { where?: object }).where = { academicYearId };
    }

    return Period.findAll({
      where,
      include,
      order: [[{ model: Timetable, as: 'timetable' }, 'dayOfWeek', 'ASC'], ['periodNumber', 'ASC']]
    });
  }

  /**
   * Update a period
   */
  async updatePeriod(
    periodId: number,
    data: Partial<{
      periodNumber: number;
      startTime: string;
      endTime: string;
      subjectId?: number;
      teacherId?: number;
      roomNumber?: string;
    }>
  ): Promise<Period | null> {
    const period = await Period.findByPk(periodId, { include: [{ model: Timetable, as: 'timetable' }] });
    if (!period) return null;

    this.validateTimeUpdate(data, period);
    await this.validateTeacherConflictUpdate(period, data);

    await period.update(data);
    logger.info('Period updated', { periodId, updatedFields: Object.keys(data) });
    return period;
  }

  /**
   * Delete a period
   */
  async deletePeriod(periodId: number): Promise<boolean> {
    const period = await Period.findByPk(periodId);
    if (!period) return false;

    await period.destroy();
    logger.info('Period deleted', { periodId });
    return true;
  }

  /**
   * Update a timetable
   */
  async updateTimetable(
    timetableId: number,
    data: Partial<{ classId: number; academicYearId: number; dayOfWeek: number }>
  ): Promise<Timetable | null> {
    const timetable = await Timetable.findByPk(timetableId);
    if (!timetable) return null;

    if (data.dayOfWeek !== undefined) {
      this.validateDayOfWeek(data.dayOfWeek);
    }

    await timetable.update(data);
    logger.info('Timetable updated', { timetableId, updatedFields: Object.keys(data) });
    return timetable;
  }

  /**
   * Delete a timetable
   */
  async deleteTimetable(timetableId: number): Promise<boolean> {
    const timetable = await Timetable.findByPk(timetableId);
    if (!timetable) return false;

    await timetable.destroy();
    logger.info('Timetable deleted', { timetableId });
    return true;
  }

  /**
   * Check if teacher has a conflict at the specified time
   */
  async checkTeacherConflict(
    teacherId: number,
    dayOfWeek: number,
    academicYearId: number,
    startTime: string,
    endTime: string,
    excludePeriodId?: number
  ): Promise<boolean> {
    const where: WhereOptions<Period> = {
      teacherId,
      startTime: { [Op.lt]: endTime },
      endTime: { [Op.gt]: startTime }
    };
    if (excludePeriodId) where.periodId = { [Op.ne]: excludePeriodId };

    const periods = await Period.findAll({
      where,
      include: [{ model: Timetable, as: 'timetable', where: { dayOfWeek, academicYearId } }]
    });

    return periods.length > 0;
  }

  /**
   * Bulk create periods for a timetable
   */
  async bulkCreatePeriods(
    timetableId: number,
    periods: Array<{
      periodNumber: number;
      startTime: string;
      endTime: string;
      subjectId?: number;
      teacherId?: number;
      roomNumber?: string;
    }>
  ): Promise<Period[]> {
    const timetable = await Timetable.findByPk(timetableId);
    if (!timetable) throw new ValidationError('Timetable not found');

    this.validateAllPeriods(periods, timetable);

    const createdPeriods = await Period.bulkCreate(periods.map(p => ({ ...p, timetableId })));
    logger.info('Bulk periods created', { timetableId, count: createdPeriods.length });
    return createdPeriods;
  }

  // ============ Private Helper Methods ============

  private validateDayOfWeek(dayOfWeek: number): void {
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      throw new ValidationError('Day of week must be between 0 (Sunday) and 6 (Saturday)');
    }
  }

  private validateTimeFormat(startTime: string, endTime: string): void {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      throw new ValidationError('Time must be in HH:mm format (e.g., 09:00)');
    }
    if (startTime >= endTime) {
      throw new ValidationError('Start time must be before end time');
    }
  }

  private async checkTimetableExists(classId: number, academicYearId: number, dayOfWeek: number): Promise<void> {
    const existing = await Timetable.findOne({ where: { classId, academicYearId, dayOfWeek } });
    if (existing) {
      throw new ValidationError('Timetable already exists for this class, academic year, and day');
    }
  }

  private async checkPeriodExists(timetableId: number, periodNumber: number): Promise<void> {
    const existingPeriod = await Period.findOne({ where: { timetableId, periodNumber } });
    if (existingPeriod) {
      throw new ValidationError(`Period ${periodNumber} already exists for this timetable`);
    }
  }

  private async validateTeacherAvailability(timetableId: number, data: { teacherId?: number; startTime: string; endTime: string }): Promise<void> {
    if (!data.teacherId) return; // Skip validation if no teacher assigned
    
    const timetable = await Timetable.findByPk(timetableId);
    if (!timetable) throw new ValidationError('Timetable not found');

    const hasConflict = await this.checkTeacherConflict(
      data.teacherId,
      timetable.dayOfWeek,
      timetable.academicYearId,
      data.startTime,
      data.endTime
    );

    if (hasConflict) {
      throw new ValidationError(`Teacher has a conflicting period on this day at ${data.startTime}-${data.endTime}`);
    }
  }

  private validateTimeUpdate(data: Partial<{ startTime: string; endTime: string }>, period: Period): void {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (data.startTime && !timeRegex.test(data.startTime)) {
      throw new ValidationError('Start time must be in HH:mm format');
    }
    if (data.endTime && !timeRegex.test(data.endTime)) {
      throw new ValidationError('End time must be in HH:mm format');
    }
    const startTime = data.startTime || period.startTime;
    const endTime = data.endTime || period.endTime;
    if (startTime >= endTime) {
      throw new ValidationError('Start time must be before end time');
    }
  }

  private async validateTeacherConflictUpdate(period: Period & { timetable?: Timetable }, data: Partial<{ teacherId: number; startTime: string; endTime: string }>): Promise<void> {
    if (data.teacherId && data.teacherId !== period.teacherId) {
      const timetable = period.get('timetable') as Timetable;
      const startTime = data.startTime || period.startTime;
      const endTime = data.endTime || period.endTime;
      const hasConflict = await this.checkTeacherConflict(
        data.teacherId,
        timetable.dayOfWeek,
        timetable.academicYearId,
        startTime,
        endTime,
        period.periodId
      );
      if (hasConflict) {
        throw new ValidationError(`Teacher has a conflicting period on this day at ${startTime}-${endTime}`);
      }
    }
  }

  private validateAllPeriods(periods: Array<{ periodNumber: number; startTime: string; endTime: string; teacherId?: number }>, timetable: Timetable): void {
    for (const periodData of periods) {
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(periodData.startTime) || !timeRegex.test(periodData.endTime)) {
        throw new ValidationError(`Invalid time format for period ${periodData.periodNumber}`);
      }
      if (periodData.startTime >= periodData.endTime) {
        throw new ValidationError(`Start time must be before end time for period ${periodData.periodNumber}`);
      }
      if (periodData.teacherId) {
        this.validateTeacherPeriodConflict(periodData, timetable);
      }
    }
  }

  private async validateTeacherPeriodConflict(periodData: { periodNumber: number; startTime: string; endTime: string; teacherId?: number }, timetable: Timetable): Promise<void> {
    const hasConflict = await this.checkTeacherConflict(
      periodData.teacherId!,
      timetable.dayOfWeek,
      timetable.academicYearId,
      periodData.startTime,
      periodData.endTime
    );
    if (hasConflict) {
      throw new ValidationError(`Teacher conflict for period ${periodData.periodNumber} at ${periodData.startTime}-${periodData.endTime}`);
    }
  }
}

export default new TimetableService();