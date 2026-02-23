import ExamSchedule from '../ExamSchedule.model';
import sequelize from '@config/database';

describe('ExamSchedule Model', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  afterEach(async () => {
    await ExamSchedule.destroy({ where: {}, force: true });
  });

  describe('Model Creation', () => {
    it('should create an exam schedule with all required fields', async () => {
      const scheduleData = {
        examId: 1,
        subjectId: 1,
        date: new Date('2025-05-15'),
        startTime: '09:00',
        endTime: '12:00',
        roomNumber: 'Hall A',
        invigilators: [1, 2, 3]
      };

      const schedule = await ExamSchedule.create(scheduleData);

      expect(schedule.examScheduleId).toBeDefined();
      expect(schedule.examId).toBe(scheduleData.examId);
      expect(schedule.subjectId).toBe(scheduleData.subjectId);
      expect(schedule.date).toEqual(scheduleData.date);
      expect(schedule.startTime).toBe(scheduleData.startTime);
      expect(schedule.endTime).toBe(scheduleData.endTime);
      expect(schedule.roomNumber).toBe(scheduleData.roomNumber);
      expect(schedule.invigilators).toEqual(scheduleData.invigilators);
    });

    it('should create schedule without optional fields', async () => {
      const schedule = await ExamSchedule.create({
        examId: 1,
        subjectId: 1,
        date: new Date('2025-05-15'),
        startTime: '09:00',
        endTime: '12:00'
      });

      expect(schedule.roomNumber).toBeUndefined();
      expect(schedule.invigilators).toEqual([]);
    });

    it('should support room assignments', async () => {
      const schedule = await ExamSchedule.create({
        examId: 1,
        subjectId: 1,
        date: new Date('2025-05-15'),
        startTime: '09:00',
        endTime: '12:00',
        roomNumber: 'Room 101'
      });

      expect(schedule.roomNumber).toBe('Room 101');
    });

    it('should support multiple invigilators', async () => {
      const schedule = await ExamSchedule.create({
        examId: 1,
        subjectId: 1,
        date: new Date('2025-05-15'),
        startTime: '09:00',
        endTime: '12:00',
        invigilators: [1, 2, 3, 4]
      });

      expect(schedule.invigilators).toEqual([1, 2, 3, 4]);
      expect(schedule.getInvigilatorCount()).toBe(4);
    });
  });

  describe('Validation', () => {
    it('should validate time format (HH:mm)', async () => {
      const invalidTimes = ['9:00', '09:0', '25:00', '09:60', 'invalid'];

      for (const time of invalidTimes) {
        await expect(
          ExamSchedule.create({
            examId: 1,
            subjectId: 1,
            date: new Date('2025-05-15'),
            startTime: time,
            endTime: '12:00'
          })
        ).rejects.toThrow();
      }
    });

    it('should validate start time is before end time', async () => {
      await expect(
        ExamSchedule.create({
          examId: 1,
          subjectId: 1,
          date: new Date('2025-05-15'),
          startTime: '12:00',
          endTime: '09:00' // End before start
        })
      ).rejects.toThrow('Start time must be before end time');
    });

    it('should reject when start time equals end time', async () => {
      await expect(
        ExamSchedule.create({
          examId: 1,
          subjectId: 1,
          date: new Date('2025-05-15'),
          startTime: '09:00',
          endTime: '09:00' // Same time
        })
      ).rejects.toThrow('Start time must be before end time');
    });
  });

  describe('Instance Methods', () => {
    let schedule: ExamSchedule;

    beforeEach(async () => {
      schedule = await ExamSchedule.create({
        examId: 1,
        subjectId: 1,
        date: new Date('2025-05-15'),
        startTime: '09:00',
        endTime: '12:00',
        roomNumber: 'Hall A',
        invigilators: [1, 2, 3]
      });
    });

    it('should calculate duration in minutes', () => {
      expect(schedule.getDurationMinutes()).toBe(180); // 3 hours

      schedule.startTime = '10:30';
      schedule.endTime = '12:45';
      expect(schedule.getDurationMinutes()).toBe(135); // 2 hours 15 minutes
    });

    it('should detect overlapping schedules', async () => {
      const schedule2 = await ExamSchedule.create({
        examId: 2,
        subjectId: 2,
        date: new Date('2025-05-15'),
        startTime: '10:00',
        endTime: '13:00'
      });

      expect(schedule.overlaps(schedule2)).toBe(true);
      expect(schedule2.overlaps(schedule)).toBe(true);
    });

    it('should not detect overlap for different dates', async () => {
      const schedule2 = await ExamSchedule.create({
        examId: 2,
        subjectId: 2,
        date: new Date('2025-05-16'), // Different date
        startTime: '10:00',
        endTime: '13:00'
      });

      expect(schedule.overlaps(schedule2)).toBe(false);
    });

    it('should not detect overlap for non-overlapping times', async () => {
      const schedule2 = await ExamSchedule.create({
        examId: 2,
        subjectId: 2,
        date: new Date('2025-05-15'),
        startTime: '13:00',
        endTime: '15:00'
      });

      expect(schedule.overlaps(schedule2)).toBe(false);
    });

    it('should detect adjacent schedules as non-overlapping', async () => {
      const schedule2 = await ExamSchedule.create({
        examId: 2,
        subjectId: 2,
        date: new Date('2025-05-15'),
        startTime: '12:00', // Starts when first ends
        endTime: '15:00'
      });

      expect(schedule.overlaps(schedule2)).toBe(false);
    });

    it('should check if teacher is assigned as invigilator', () => {
      expect(schedule.hasInvigilator(1)).toBe(true);
      expect(schedule.hasInvigilator(2)).toBe(true);
      expect(schedule.hasInvigilator(3)).toBe(true);
      expect(schedule.hasInvigilator(4)).toBe(false);
    });

    it('should get invigilator count', () => {
      expect(schedule.getInvigilatorCount()).toBe(3);

      schedule.invigilators = [];
      expect(schedule.getInvigilatorCount()).toBe(0);
    });

    it('should add invigilator', () => {
      schedule.addInvigilator(4);
      expect(schedule.invigilators).toContain(4);
      expect(schedule.getInvigilatorCount()).toBe(4);

      // Should not add duplicate
      schedule.addInvigilator(4);
      expect(schedule.getInvigilatorCount()).toBe(4);
    });

    it('should remove invigilator', () => {
      schedule.removeInvigilator(2);
      expect(schedule.invigilators).not.toContain(2);
      expect(schedule.getInvigilatorCount()).toBe(2);

      // Should handle removing non-existent invigilator
      schedule.removeInvigilator(99);
      expect(schedule.getInvigilatorCount()).toBe(2);
    });

    it('should validate time format', () => {
      expect(ExamSchedule.isValidTimeFormat('09:00')).toBe(true);
      expect(ExamSchedule.isValidTimeFormat('23:59')).toBe(true);
      expect(ExamSchedule.isValidTimeFormat('00:00')).toBe(true);
      expect(ExamSchedule.isValidTimeFormat('9:00')).toBe(false);
      expect(ExamSchedule.isValidTimeFormat('09:0')).toBe(false);
      expect(ExamSchedule.isValidTimeFormat('25:00')).toBe(false);
      expect(ExamSchedule.isValidTimeFormat('09:60')).toBe(false);
      expect(ExamSchedule.isValidTimeFormat('invalid')).toBe(false);
    });

    it('should validate time order', () => {
      expect(schedule.validateTimeOrder()).toBe(true);

      schedule.startTime = '15:00';
      schedule.endTime = '12:00';
      expect(schedule.validateTimeOrder()).toBe(false);

      schedule.startTime = '12:00';
      schedule.endTime = '12:00';
      expect(schedule.validateTimeOrder()).toBe(false);
    });
  });

  describe('Soft Delete', () => {
    it('should soft delete an exam schedule', async () => {
      const schedule = await ExamSchedule.create({
        examId: 1,
        subjectId: 1,
        date: new Date('2025-05-15'),
        startTime: '09:00',
        endTime: '12:00'
      });

      await schedule.destroy();

      const foundSchedule = await ExamSchedule.findByPk(schedule.examScheduleId);
      expect(foundSchedule).toBeNull();

      const deletedSchedule = await ExamSchedule.findByPk(schedule.examScheduleId, { paranoid: false });
      expect(deletedSchedule).not.toBeNull();
      expect(deletedSchedule!.deletedAt).not.toBeNull();
    });
  });
});
