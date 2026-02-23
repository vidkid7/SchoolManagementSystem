import AttendanceRecord, { AttendanceStatus, SyncStatus } from '@models/AttendanceRecord.model';
import attendanceRepository from '../attendance.repository';
import sequelize from '@config/database';

/**
 * Unit tests for Attendance Repository
 * Tests CRUD operations, filtering, and offline sync functionality
 * 
 * Requirements: 6.1, 6.2, 6.14, 28.1
 */

describe('AttendanceRepository', () => {
  beforeAll(async () => {
    // Disable foreign key checks for testing
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    // Create only the attendance table
    await AttendanceRecord.sync({ force: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await AttendanceRecord.destroy({ where: {}, force: true });
  });

  describe('create', () => {
    it('should create a new attendance record', async () => {
      const attendanceData = {
        studentId: 1,
        classId: 1,
        date: new Date('2024-01-15'),
        dateBS: '2080-10-01',
        status: AttendanceStatus.PRESENT,
        markedBy: 1,
        markedAt: new Date(),
        syncStatus: SyncStatus.SYNCED
      };

      const attendance = await attendanceRepository.create(attendanceData);

      expect(attendance).toBeDefined();
      expect(attendance.studentId).toBe(1);
      expect(attendance.classId).toBe(1);
      expect(attendance.status).toBe(AttendanceStatus.PRESENT);
      expect(attendance.syncStatus).toBe(SyncStatus.SYNCED);
    });

    it('should create attendance with period number for period-wise attendance', async () => {
      const attendanceData = {
        studentId: 1,
        classId: 1,
        date: new Date('2024-01-15'),
        status: AttendanceStatus.PRESENT,
        periodNumber: 3,
        markedBy: 1,
        markedAt: new Date()
      };

      const attendance = await attendanceRepository.create(attendanceData);

      expect(attendance.periodNumber).toBe(3);
      expect(attendance.isPeriodWise()).toBe(true);
      expect(attendance.isDayWise()).toBe(false);
    });

    it('should create attendance without period number for day-wise attendance', async () => {
      const attendanceData = {
        studentId: 1,
        classId: 1,
        date: new Date('2024-01-15'),
        status: AttendanceStatus.PRESENT,
        markedBy: 1,
        markedAt: new Date()
      };

      const attendance = await attendanceRepository.create(attendanceData);

      expect(attendance.periodNumber).toBeUndefined();
      expect(attendance.isDayWise()).toBe(true);
      expect(attendance.isPeriodWise()).toBe(false);
    });

    it('should default syncStatus to SYNCED if not provided', async () => {
      const attendanceData = {
        studentId: 1,
        classId: 1,
        date: new Date('2024-01-15'),
        status: AttendanceStatus.PRESENT,
        markedBy: 1,
        markedAt: new Date()
      };

      const attendance = await attendanceRepository.create(attendanceData);

      expect(attendance.syncStatus).toBe(SyncStatus.SYNCED);
    });

    it('should create attendance with PENDING sync status for offline support', async () => {
      const attendanceData = {
        studentId: 1,
        classId: 1,
        date: new Date('2024-01-15'),
        status: AttendanceStatus.PRESENT,
        markedBy: 1,
        markedAt: new Date(),
        syncStatus: SyncStatus.PENDING
      };

      const attendance = await attendanceRepository.create(attendanceData);

      expect(attendance.syncStatus).toBe(SyncStatus.PENDING);
      expect(attendance.isPendingSync()).toBe(true);
    });
  });

  describe('findById', () => {
    it('should find attendance record by ID', async () => {
      const created = await attendanceRepository.create({
        studentId: 1,
        classId: 1,
        date: new Date('2024-01-15'),
        status: AttendanceStatus.PRESENT,
        markedBy: 1,
        markedAt: new Date()
      });

      const found = await attendanceRepository.findById(created.attendanceId);

      expect(found).toBeDefined();
      expect(found?.attendanceId).toBe(created.attendanceId);
    });

    it('should return null for non-existent ID', async () => {
      const found = await attendanceRepository.findById(99999);
      expect(found).toBeNull();
    });
  });

  describe('findByStudentAndDate', () => {
    it('should find attendance for student on specific date', async () => {
      const date = new Date('2024-01-15');
      await attendanceRepository.create({
        studentId: 1,
        classId: 1,
        date,
        status: AttendanceStatus.PRESENT,
        markedBy: 1,
        markedAt: new Date()
      });

      const found = await attendanceRepository.findByStudentAndDate(1, date);

      expect(found).toBeDefined();
      expect(found?.studentId).toBe(1);
    });

    it('should find period-wise attendance with period number', async () => {
      const date = new Date('2024-01-15');
      await attendanceRepository.create({
        studentId: 1,
        classId: 1,
        date,
        status: AttendanceStatus.PRESENT,
        periodNumber: 2,
        markedBy: 1,
        markedAt: new Date()
      });

      const found = await attendanceRepository.findByStudentAndDate(1, date, 2);

      expect(found).toBeDefined();
      expect(found?.periodNumber).toBe(2);
    });

    it('should return null if no attendance found', async () => {
      const found = await attendanceRepository.findByStudentAndDate(
        1,
        new Date('2024-01-15')
      );
      expect(found).toBeNull();
    });
  });

  describe('findByClassAndDate', () => {
    it('should find all attendance records for a class on specific date', async () => {
      const date = new Date('2024-01-15');
      await attendanceRepository.create({
        studentId: 1,
        classId: 1,
        date,
        status: AttendanceStatus.PRESENT,
        markedBy: 1,
        markedAt: new Date()
      });
      await attendanceRepository.create({
        studentId: 2,
        classId: 1,
        date,
        status: AttendanceStatus.ABSENT,
        markedBy: 1,
        markedAt: new Date()
      });

      const records = await attendanceRepository.findByClassAndDate(1, date);

      expect(records).toHaveLength(2);
      expect(records[0].classId).toBe(1);
      expect(records[1].classId).toBe(1);
    });

    it('should filter by period number for period-wise attendance', async () => {
      const date = new Date('2024-01-15');
      await attendanceRepository.create({
        studentId: 1,
        classId: 1,
        date,
        status: AttendanceStatus.PRESENT,
        periodNumber: 1,
        markedBy: 1,
        markedAt: new Date()
      });
      await attendanceRepository.create({
        studentId: 1,
        classId: 1,
        date,
        status: AttendanceStatus.PRESENT,
        periodNumber: 2,
        markedBy: 1,
        markedAt: new Date()
      });

      const records = await attendanceRepository.findByClassAndDate(1, date, 1);

      expect(records).toHaveLength(1);
      expect(records[0].periodNumber).toBe(1);
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple attendance records at once', async () => {
      const date = new Date('2024-01-15');
      const recordsData = [
        {
          studentId: 1,
          classId: 1,
          date,
          status: AttendanceStatus.PRESENT,
          markedBy: 1,
          markedAt: new Date()
        },
        {
          studentId: 2,
          classId: 1,
          date,
          status: AttendanceStatus.PRESENT,
          markedBy: 1,
          markedAt: new Date()
        },
        {
          studentId: 3,
          classId: 1,
          date,
          status: AttendanceStatus.ABSENT,
          markedBy: 1,
          markedAt: new Date()
        }
      ];

      const records = await attendanceRepository.bulkCreate(recordsData);

      expect(records).toHaveLength(3);
      expect(records[0].studentId).toBe(1);
      expect(records[1].studentId).toBe(2);
      expect(records[2].studentId).toBe(3);
    });
  });

  describe('update', () => {
    it('should update attendance record', async () => {
      const created = await attendanceRepository.create({
        studentId: 1,
        classId: 1,
        date: new Date('2024-01-15'),
        status: AttendanceStatus.PRESENT,
        markedBy: 1,
        markedAt: new Date()
      });

      const updated = await attendanceRepository.update(created.attendanceId, {
        status: AttendanceStatus.LATE,
        remarks: 'Arrived 10 minutes late'
      });

      expect(updated).toBeDefined();
      expect(updated?.status).toBe(AttendanceStatus.LATE);
      expect(updated?.remarks).toBe('Arrived 10 minutes late');
    });

    it('should return null for non-existent ID', async () => {
      const updated = await attendanceRepository.update(99999, {
        status: AttendanceStatus.LATE
      });
      expect(updated).toBeNull();
    });
  });

  describe('countByStatusForStudent', () => {
    it('should count attendance by status for a student', async () => {
      const studentId = 1;
      await attendanceRepository.create({
        studentId,
        classId: 1,
        date: new Date('2024-01-15'),
        status: AttendanceStatus.PRESENT,
        markedBy: 1,
        markedAt: new Date()
      });
      await attendanceRepository.create({
        studentId,
        classId: 1,
        date: new Date('2024-01-16'),
        status: AttendanceStatus.PRESENT,
        markedBy: 1,
        markedAt: new Date()
      });
      await attendanceRepository.create({
        studentId,
        classId: 1,
        date: new Date('2024-01-17'),
        status: AttendanceStatus.ABSENT,
        markedBy: 1,
        markedAt: new Date()
      });
      await attendanceRepository.create({
        studentId,
        classId: 1,
        date: new Date('2024-01-18'),
        status: AttendanceStatus.LATE,
        markedBy: 1,
        markedAt: new Date()
      });

      const counts = await attendanceRepository.countByStatusForStudent(studentId);

      expect(counts.present).toBe(2);
      expect(counts.absent).toBe(1);
      expect(counts.late).toBe(1);
      expect(counts.excused).toBe(0);
      expect(counts.total).toBe(4);
    });
  });

  describe('calculateAttendancePercentage', () => {
    it('should calculate attendance percentage correctly', async () => {
      const studentId = 1;
      // 3 present + 1 late = 4 present out of 5 total = 80%
      await attendanceRepository.create({
        studentId,
        classId: 1,
        date: new Date('2024-01-15'),
        status: AttendanceStatus.PRESENT,
        markedBy: 1,
        markedAt: new Date()
      });
      await attendanceRepository.create({
        studentId,
        classId: 1,
        date: new Date('2024-01-16'),
        status: AttendanceStatus.PRESENT,
        markedBy: 1,
        markedAt: new Date()
      });
      await attendanceRepository.create({
        studentId,
        classId: 1,
        date: new Date('2024-01-17'),
        status: AttendanceStatus.PRESENT,
        markedBy: 1,
        markedAt: new Date()
      });
      await attendanceRepository.create({
        studentId,
        classId: 1,
        date: new Date('2024-01-18'),
        status: AttendanceStatus.LATE,
        markedBy: 1,
        markedAt: new Date()
      });
      await attendanceRepository.create({
        studentId,
        classId: 1,
        date: new Date('2024-01-19'),
        status: AttendanceStatus.ABSENT,
        markedBy: 1,
        markedAt: new Date()
      });

      const percentage = await attendanceRepository.calculateAttendancePercentage(studentId);

      expect(percentage).toBe(80);
    });

    it('should return 0 for student with no attendance records', async () => {
      const percentage = await attendanceRepository.calculateAttendancePercentage(999);
      expect(percentage).toBe(0);
    });

    it('should count late as present in percentage calculation', async () => {
      const studentId = 1;
      // 1 late out of 1 total = 100%
      await attendanceRepository.create({
        studentId,
        classId: 1,
        date: new Date('2024-01-15'),
        status: AttendanceStatus.LATE,
        markedBy: 1,
        markedAt: new Date()
      });

      const percentage = await attendanceRepository.calculateAttendancePercentage(studentId);

      expect(percentage).toBe(100);
    });
  });

  describe('Offline Sync Support', () => {
    describe('findPendingSync', () => {
      it('should find records with pending sync status', async () => {
        await attendanceRepository.create({
          studentId: 1,
          classId: 1,
          date: new Date('2024-01-15'),
          status: AttendanceStatus.PRESENT,
          markedBy: 1,
          markedAt: new Date(),
          syncStatus: SyncStatus.PENDING
        });
        await attendanceRepository.create({
          studentId: 2,
          classId: 1,
          date: new Date('2024-01-15'),
          status: AttendanceStatus.PRESENT,
          markedBy: 1,
          markedAt: new Date(),
          syncStatus: SyncStatus.SYNCED
        });

        const pending = await attendanceRepository.findPendingSync();

        expect(pending).toHaveLength(1);
        expect(pending[0].syncStatus).toBe(SyncStatus.PENDING);
      });
    });

    describe('findErrorSync', () => {
      it('should find records with error sync status', async () => {
        await attendanceRepository.create({
          studentId: 1,
          classId: 1,
          date: new Date('2024-01-15'),
          status: AttendanceStatus.PRESENT,
          markedBy: 1,
          markedAt: new Date(),
          syncStatus: SyncStatus.ERROR
        });

        const errors = await attendanceRepository.findErrorSync();

        expect(errors).toHaveLength(1);
        expect(errors[0].syncStatus).toBe(SyncStatus.ERROR);
      });
    });

    describe('updateSyncStatus', () => {
      it('should update sync status of a record', async () => {
        const created = await attendanceRepository.create({
          studentId: 1,
          classId: 1,
          date: new Date('2024-01-15'),
          status: AttendanceStatus.PRESENT,
          markedBy: 1,
          markedAt: new Date(),
          syncStatus: SyncStatus.PENDING
        });

        const updated = await attendanceRepository.updateSyncStatus(
          created.attendanceId,
          SyncStatus.SYNCED
        );

        expect(updated).toBeDefined();
        expect(updated?.syncStatus).toBe(SyncStatus.SYNCED);
        expect(updated?.isSynced()).toBe(true);
      });
    });

    describe('bulkUpdateSyncStatus', () => {
      it('should update sync status for multiple records', async () => {
        const record1 = await attendanceRepository.create({
          studentId: 1,
          classId: 1,
          date: new Date('2024-01-15'),
          status: AttendanceStatus.PRESENT,
          markedBy: 1,
          markedAt: new Date(),
          syncStatus: SyncStatus.PENDING
        });
        const record2 = await attendanceRepository.create({
          studentId: 2,
          classId: 1,
          date: new Date('2024-01-15'),
          status: AttendanceStatus.PRESENT,
          markedBy: 1,
          markedAt: new Date(),
          syncStatus: SyncStatus.PENDING
        });

        const count = await attendanceRepository.bulkUpdateSyncStatus(
          [record1.attendanceId, record2.attendanceId],
          SyncStatus.SYNCED
        );

        expect(count).toBe(2);

        const updated1 = await attendanceRepository.findById(record1.attendanceId);
        const updated2 = await attendanceRepository.findById(record2.attendanceId);
        expect(updated1?.syncStatus).toBe(SyncStatus.SYNCED);
        expect(updated2?.syncStatus).toBe(SyncStatus.SYNCED);
      });
    });
  });

  describe('attendanceExists', () => {
    it('should return true if attendance exists for student on date', async () => {
      const date = new Date('2024-01-15');
      await attendanceRepository.create({
        studentId: 1,
        classId: 1,
        date,
        status: AttendanceStatus.PRESENT,
        markedBy: 1,
        markedAt: new Date()
      });

      const exists = await attendanceRepository.attendanceExists(1, date);

      expect(exists).toBe(true);
    });

    it('should return false if attendance does not exist', async () => {
      const exists = await attendanceRepository.attendanceExists(1, new Date('2024-01-15'));
      expect(exists).toBe(false);
    });

    it('should check period-wise attendance existence', async () => {
      const date = new Date('2024-01-15');
      await attendanceRepository.create({
        studentId: 1,
        classId: 1,
        date,
        status: AttendanceStatus.PRESENT,
        periodNumber: 1,
        markedBy: 1,
        markedAt: new Date()
      });

      const exists = await attendanceRepository.attendanceExists(1, date, 1);
      const notExists = await attendanceRepository.attendanceExists(1, date, 2);

      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });
  });

  describe('Model Helper Methods', () => {
    it('should correctly identify present status', async () => {
      const present = await attendanceRepository.create({
        studentId: 1,
        classId: 1,
        date: new Date('2024-01-15'),
        status: AttendanceStatus.PRESENT,
        markedBy: 1,
        markedAt: new Date()
      });

      expect(present.isPresent()).toBe(true);
      expect(present.isAbsent()).toBe(false);
    });

    it('should correctly identify late as present', async () => {
      const late = await attendanceRepository.create({
        studentId: 1,
        classId: 1,
        date: new Date('2024-01-15'),
        status: AttendanceStatus.LATE,
        markedBy: 1,
        markedAt: new Date()
      });

      expect(late.isPresent()).toBe(true);
      expect(late.isAbsent()).toBe(false);
    });

    it('should correctly identify absent status', async () => {
      const absent = await attendanceRepository.create({
        studentId: 1,
        classId: 1,
        date: new Date('2024-01-15'),
        status: AttendanceStatus.ABSENT,
        markedBy: 1,
        markedAt: new Date()
      });

      expect(absent.isAbsent()).toBe(true);
      expect(absent.isPresent()).toBe(false);
    });

    it('should correctly identify excused status', async () => {
      const excused = await attendanceRepository.create({
        studentId: 1,
        classId: 1,
        date: new Date('2024-01-15'),
        status: AttendanceStatus.EXCUSED,
        markedBy: 1,
        markedAt: new Date()
      });

      expect(excused.isExcused()).toBe(true);
    });
  });
});
