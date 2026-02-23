import AttendanceService from '../attendance.service';
import AttendanceRepository from '../attendance.repository';
import { AttendanceStatus, SyncStatus } from '@models/AttendanceRecord.model';
import Student from '@models/Student.model';
import User from '@models/User.model';
import smsService from '@services/sms.service';

// Mock the repository and models
jest.mock('../attendance.repository');
jest.mock('@models/Student.model');
jest.mock('@models/User.model');
jest.mock('@services/sms.service');

describe('AttendanceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('markAttendance', () => {
    it('should create new attendance record when none exists', async () => {
      const attendanceData = {
        studentId: 1,
        classId: 1,
        date: new Date('2024-01-15'),
        status: AttendanceStatus.PRESENT,
        periodNumber: 1
      };

      const mockCreated = {
        attendanceId: 1,
        ...attendanceData,
        markedBy: 1,
        markedAt: new Date(),
        syncStatus: SyncStatus.SYNCED
      };

      (AttendanceRepository.findByStudentAndDate as jest.Mock).mockResolvedValue(null);
      (AttendanceRepository.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await AttendanceService.markAttendance(attendanceData, 1);

      expect(AttendanceRepository.findByStudentAndDate).toHaveBeenCalledWith(
        1,
        attendanceData.date,
        1
      );
      expect(AttendanceRepository.create).toHaveBeenCalled();
      expect(result).toEqual(mockCreated);
    });

    it('should update existing attendance within 24-hour window', async () => {
      const attendanceData = {
        studentId: 1,
        classId: 1,
        date: new Date('2024-01-15'),
        status: AttendanceStatus.ABSENT,
        periodNumber: 1
      };

      const existingAttendance = {
        attendanceId: 1,
        studentId: 1,
        classId: 1,
        date: new Date('2024-01-15'),
        status: AttendanceStatus.PRESENT,
        periodNumber: 1,
        markedBy: 1,
        markedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        syncStatus: SyncStatus.SYNCED
      };

      const mockUpdated = {
        ...existingAttendance,
        status: AttendanceStatus.ABSENT
      };

      (AttendanceRepository.findByStudentAndDate as jest.Mock).mockResolvedValue(
        existingAttendance
      );
      (AttendanceRepository.update as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await AttendanceService.markAttendance(attendanceData, 1);

      expect(AttendanceRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: AttendanceStatus.ABSENT
        }),
        1,
        undefined
      );
      expect(result).toEqual(mockUpdated);
    });

    it('should throw error when trying to correct attendance after 24 hours', async () => {
      const attendanceData = {
        studentId: 1,
        classId: 1,
        date: new Date('2024-01-15'),
        status: AttendanceStatus.ABSENT,
        periodNumber: 1
      };

      const existingAttendance = {
        attendanceId: 1,
        studentId: 1,
        classId: 1,
        date: new Date('2024-01-15'),
        status: AttendanceStatus.PRESENT,
        periodNumber: 1,
        markedBy: 1,
        markedAt: new Date(Date.now() - 1000 * 60 * 60 * 25), // 25 hours ago
        syncStatus: SyncStatus.SYNCED
      };

      (AttendanceRepository.findByStudentAndDate as jest.Mock).mockResolvedValue(
        existingAttendance
      );

      await expect(
        AttendanceService.markAttendance(attendanceData, 1)
      ).rejects.toThrow('Attendance correction is only allowed within 24 hours');

      expect(AttendanceRepository.update).not.toHaveBeenCalled();
    });

    it('should handle day-wise attendance (no period number)', async () => {
      const attendanceData = {
        studentId: 1,
        classId: 1,
        date: new Date('2024-01-15'),
        status: AttendanceStatus.PRESENT
      };

      const mockCreated = {
        attendanceId: 1,
        ...attendanceData,
        periodNumber: undefined,
        markedBy: 1,
        markedAt: new Date(),
        syncStatus: SyncStatus.SYNCED
      };

      (AttendanceRepository.findByStudentAndDate as jest.Mock).mockResolvedValue(null);
      (AttendanceRepository.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await AttendanceService.markAttendance(attendanceData, 1);

      expect(AttendanceRepository.findByStudentAndDate).toHaveBeenCalledWith(
        1,
        attendanceData.date,
        undefined
      );
      expect(result.periodNumber).toBeUndefined();
    });
  });

  describe('markAllPresent', () => {
    it('should create attendance records for all students', async () => {
      const classId = 1;
      const studentIds = [1, 2, 3];
      const date = new Date('2024-01-15');
      const userId = 1;

      const mockCreated = studentIds.map((id) => ({
        attendanceId: id,
        studentId: id,
        classId,
        date,
        status: AttendanceStatus.PRESENT,
        markedBy: userId,
        markedAt: new Date(),
        syncStatus: SyncStatus.SYNCED
      }));

      (AttendanceRepository.findByClassAndDate as jest.Mock).mockResolvedValue([]);
      (AttendanceRepository.bulkCreate as jest.Mock).mockResolvedValue(mockCreated);

      const result = await AttendanceService.markAllPresent(
        classId,
        studentIds,
        date,
        undefined,
        undefined,
        userId
      );

      expect(AttendanceRepository.findByClassAndDate).toHaveBeenCalledWith(
        classId,
        date,
        undefined
      );
      expect(AttendanceRepository.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            studentId: 1,
            status: AttendanceStatus.PRESENT
          }),
          expect.objectContaining({
            studentId: 2,
            status: AttendanceStatus.PRESENT
          }),
          expect.objectContaining({
            studentId: 3,
            status: AttendanceStatus.PRESENT
          })
        ]),
        userId,
        undefined
      );
      expect(result).toHaveLength(3);
    });

    it('should create exactly N records for N students', async () => {
      const classId = 1;
      const studentIds = [1, 2, 3, 4, 5];
      const date = new Date('2024-01-15');
      const userId = 1;

      const mockCreated = studentIds.map((id) => ({
        attendanceId: id,
        studentId: id,
        classId,
        date,
        status: AttendanceStatus.PRESENT,
        markedBy: userId,
        markedAt: new Date(),
        syncStatus: SyncStatus.SYNCED
      }));

      (AttendanceRepository.findByClassAndDate as jest.Mock).mockResolvedValue([]);
      (AttendanceRepository.bulkCreate as jest.Mock).mockResolvedValue(mockCreated);

      const result = await AttendanceService.markAllPresent(
        classId,
        studentIds,
        date,
        undefined,
        undefined,
        userId
      );

      expect(result).toHaveLength(studentIds.length);
      expect(AttendanceRepository.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining(
          studentIds.map((id) =>
            expect.objectContaining({
              studentId: id,
              status: AttendanceStatus.PRESENT
            })
          )
        ),
        userId,
        undefined
      );
    });

    it('should update existing records within 24-hour window', async () => {
      const classId = 1;
      const studentIds = [1, 2, 3];
      const date = new Date('2024-01-15');
      const userId = 1;

      const existingRecords = [
        {
          attendanceId: 1,
          studentId: 1,
          classId,
          date,
          status: AttendanceStatus.ABSENT,
          markedBy: 1,
          markedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
          syncStatus: SyncStatus.SYNCED
        }
      ];

      const mockUpdated = {
        ...existingRecords[0],
        status: AttendanceStatus.PRESENT
      };

      const mockCreated = [
        {
          attendanceId: 2,
          studentId: 2,
          classId,
          date,
          status: AttendanceStatus.PRESENT,
          markedBy: userId,
          markedAt: new Date(),
          syncStatus: SyncStatus.SYNCED
        },
        {
          attendanceId: 3,
          studentId: 3,
          classId,
          date,
          status: AttendanceStatus.PRESENT,
          markedBy: userId,
          markedAt: new Date(),
          syncStatus: SyncStatus.SYNCED
        }
      ];

      (AttendanceRepository.findByClassAndDate as jest.Mock).mockResolvedValue(
        existingRecords
      );
      (AttendanceRepository.bulkCreate as jest.Mock).mockResolvedValue(mockCreated);
      (AttendanceRepository.update as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await AttendanceService.markAllPresent(
        classId,
        studentIds,
        date,
        undefined,
        undefined,
        userId
      );

      expect(AttendanceRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: AttendanceStatus.PRESENT
        }),
        userId,
        undefined
      );
      expect(AttendanceRepository.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ studentId: 2 }),
          expect.objectContaining({ studentId: 3 })
        ]),
        userId,
        undefined
      );
      expect(result).toHaveLength(3);
    });

    it('should skip updating records outside 24-hour window', async () => {
      const classId = 1;
      const studentIds = [1, 2];
      const date = new Date('2024-01-15');
      const userId = 1;

      const existingRecords = [
        {
          attendanceId: 1,
          studentId: 1,
          classId,
          date,
          status: AttendanceStatus.ABSENT,
          markedBy: 1,
          markedAt: new Date(Date.now() - 1000 * 60 * 60 * 25), // 25 hours ago
          syncStatus: SyncStatus.SYNCED
        }
      ];

      const mockCreated = [
        {
          attendanceId: 2,
          studentId: 2,
          classId,
          date,
          status: AttendanceStatus.PRESENT,
          markedBy: userId,
          markedAt: new Date(),
          syncStatus: SyncStatus.SYNCED
        }
      ];

      (AttendanceRepository.findByClassAndDate as jest.Mock).mockResolvedValue(
        existingRecords
      );
      (AttendanceRepository.bulkCreate as jest.Mock).mockResolvedValue(mockCreated);

      const result = await AttendanceService.markAllPresent(
        classId,
        studentIds,
        date,
        undefined,
        undefined,
        userId
      );

      expect(AttendanceRepository.update).not.toHaveBeenCalled();
      expect(result).toHaveLength(1); // Only new record created
    });

    it('should throw error when no students provided', async () => {
      await expect(
        AttendanceService.markAllPresent(1, [], new Date(), undefined, undefined, 1)
      ).rejects.toThrow('No students provided for marking attendance');
    });

    it('should handle period-wise attendance', async () => {
      const classId = 1;
      const studentIds = [1, 2];
      const date = new Date('2024-01-15');
      const periodNumber = 3;
      const userId = 1;

      const mockCreated = studentIds.map((id) => ({
        attendanceId: id,
        studentId: id,
        classId,
        date,
        status: AttendanceStatus.PRESENT,
        periodNumber,
        markedBy: userId,
        markedAt: new Date(),
        syncStatus: SyncStatus.SYNCED
      }));

      (AttendanceRepository.findByClassAndDate as jest.Mock).mockResolvedValue([]);
      (AttendanceRepository.bulkCreate as jest.Mock).mockResolvedValue(mockCreated);

      const result = await AttendanceService.markAllPresent(
        classId,
        studentIds,
        date,
        undefined,
        periodNumber,
        userId
      );

      expect(AttendanceRepository.findByClassAndDate).toHaveBeenCalledWith(
        classId,
        date,
        periodNumber
      );
      expect(result.every((r) => r.periodNumber === periodNumber)).toBe(true);
    });
  });

  describe('canCorrectAttendance', () => {
    it('should return true for attendance marked within 24 hours', () => {
      const markedAt = new Date(Date.now() - 1000 * 60 * 60 * 12); // 12 hours ago
      expect(AttendanceService.canCorrectAttendance(markedAt)).toBe(true);
    });

    it('should return true for attendance marked exactly 24 hours ago', () => {
      const markedAt = new Date(Date.now() - 1000 * 60 * 60 * 24); // 24 hours ago
      expect(AttendanceService.canCorrectAttendance(markedAt)).toBe(true);
    });

    it('should return false for attendance marked more than 24 hours ago', () => {
      const markedAt = new Date(Date.now() - 1000 * 60 * 60 * 25); // 25 hours ago
      expect(AttendanceService.canCorrectAttendance(markedAt)).toBe(false);
    });

    it('should return true for attendance marked just now', () => {
      const markedAt = new Date();
      expect(AttendanceService.canCorrectAttendance(markedAt)).toBe(true);
    });
  });

  describe('hasDuplicateAttendance', () => {
    it('should return true when duplicate exists', async () => {
      (AttendanceRepository.attendanceExists as jest.Mock).mockResolvedValue(true);

      const result = await AttendanceService.hasDuplicateAttendance(
        1,
        new Date('2024-01-15'),
        1
      );

      expect(result).toBe(true);
      expect(AttendanceRepository.attendanceExists).toHaveBeenCalledWith(
        1,
        new Date('2024-01-15'),
        1,
        undefined
      );
    });

    it('should return false when no duplicate exists', async () => {
      (AttendanceRepository.attendanceExists as jest.Mock).mockResolvedValue(false);

      const result = await AttendanceService.hasDuplicateAttendance(
        1,
        new Date('2024-01-15'),
        1
      );

      expect(result).toBe(false);
    });

    it('should exclude specific attendance ID when checking', async () => {
      (AttendanceRepository.attendanceExists as jest.Mock).mockResolvedValue(false);

      await AttendanceService.hasDuplicateAttendance(
        1,
        new Date('2024-01-15'),
        1,
        5
      );

      expect(AttendanceRepository.attendanceExists).toHaveBeenCalledWith(
        1,
        new Date('2024-01-15'),
        1,
        5
      );
    });
  });

  describe('getAttendanceSummary', () => {
    it('should return attendance summary with correct calculations', async () => {
      const studentId = 1;
      const counts = {
        present: 15,
        absent: 3,
        late: 2,
        excused: 1,
        total: 21
      };

      (AttendanceRepository.countByStatusForStudent as jest.Mock).mockResolvedValue(counts);
      (AttendanceRepository.calculateAttendancePercentage as jest.Mock).mockResolvedValue(
        80.95
      );

      const result = await AttendanceService.getAttendanceSummary(studentId);

      expect(result).toEqual({
        studentId: 1,
        totalDays: 21,
        presentDays: 15,
        absentDays: 3,
        lateDays: 2,
        excusedDays: 1,
        attendancePercentage: 80.95
      });
    });

    it('should handle date range filters', async () => {
      const studentId = 1;
      const dateFrom = new Date('2024-01-01');
      const dateTo = new Date('2024-01-31');

      (AttendanceRepository.countByStatusForStudent as jest.Mock).mockResolvedValue({
        present: 10,
        absent: 2,
        late: 1,
        excused: 0,
        total: 13
      });
      (AttendanceRepository.calculateAttendancePercentage as jest.Mock).mockResolvedValue(
        84.62
      );

      await AttendanceService.getAttendanceSummary(studentId, dateFrom, dateTo);

      expect(AttendanceRepository.countByStatusForStudent).toHaveBeenCalledWith(
        studentId,
        dateFrom,
        dateTo
      );
      expect(AttendanceRepository.calculateAttendancePercentage).toHaveBeenCalledWith(
        studentId,
        dateFrom,
        dateTo
      );
    });
  });

  describe('deleteAttendance', () => {
    it('should delete attendance within 24-hour window', async () => {
      const attendanceId = 1;
      const userId = 1;

      const mockAttendance = {
        attendanceId: 1,
        studentId: 1,
        classId: 1,
        date: new Date('2024-01-15'),
        status: AttendanceStatus.PRESENT,
        markedBy: 1,
        markedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        syncStatus: SyncStatus.SYNCED
      };

      (AttendanceRepository.findById as jest.Mock).mockResolvedValue(mockAttendance);
      (AttendanceRepository.delete as jest.Mock).mockResolvedValue(true);

      const result = await AttendanceService.deleteAttendance(attendanceId, userId);

      expect(result).toBe(true);
      expect(AttendanceRepository.delete).toHaveBeenCalledWith(
        attendanceId,
        userId,
        undefined
      );
    });

    it('should throw error when deleting after 24 hours', async () => {
      const attendanceId = 1;
      const userId = 1;

      const mockAttendance = {
        attendanceId: 1,
        studentId: 1,
        classId: 1,
        date: new Date('2024-01-15'),
        status: AttendanceStatus.PRESENT,
        markedBy: 1,
        markedAt: new Date(Date.now() - 1000 * 60 * 60 * 25), // 25 hours ago
        syncStatus: SyncStatus.SYNCED
      };

      (AttendanceRepository.findById as jest.Mock).mockResolvedValue(mockAttendance);

      await expect(
        AttendanceService.deleteAttendance(attendanceId, userId)
      ).rejects.toThrow('Attendance deletion is only allowed within 24 hours');

      expect(AttendanceRepository.delete).not.toHaveBeenCalled();
    });

    it('should return false when attendance not found', async () => {
      (AttendanceRepository.findById as jest.Mock).mockResolvedValue(null);

      const result = await AttendanceService.deleteAttendance(1, 1);

      expect(result).toBe(false);
      expect(AttendanceRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('calculateAttendancePercentage', () => {
    it('should calculate attendance percentage correctly', async () => {
      const studentId = 1;
      const percentage = 85.5;

      (AttendanceRepository.calculateAttendancePercentage as jest.Mock).mockResolvedValue(
        percentage
      );

      const result = await AttendanceService.calculateAttendancePercentage(studentId);

      expect(result).toBe(percentage);
      expect(AttendanceRepository.calculateAttendancePercentage).toHaveBeenCalledWith(
        studentId,
        undefined,
        undefined
      );
    });

    it('should handle date range filters', async () => {
      const studentId = 1;
      const dateFrom = new Date('2024-01-01');
      const dateTo = new Date('2024-01-31');
      const percentage = 90.0;

      (AttendanceRepository.calculateAttendancePercentage as jest.Mock).mockResolvedValue(
        percentage
      );

      const result = await AttendanceService.calculateAttendancePercentage(
        studentId,
        dateFrom,
        dateTo
      );

      expect(result).toBe(percentage);
      expect(AttendanceRepository.calculateAttendancePercentage).toHaveBeenCalledWith(
        studentId,
        dateFrom,
        dateTo
      );
    });
  });

  describe('checkAndAlertLowAttendance', () => {
    it('should not send alerts when attendance is above 75%', async () => {
      const studentId = 1;
      const percentage = 80.0;

      (AttendanceRepository.calculateAttendancePercentage as jest.Mock).mockResolvedValue(
        percentage
      );

      const result = await AttendanceService.checkAndAlertLowAttendance(studentId);

      expect(result).toEqual({
        studentId,
        attendancePercentage: percentage,
        belowThreshold: false,
        alertSent: false
      });
      expect(Student.findByPk).not.toHaveBeenCalled();
      expect(smsService.sendLowAttendanceAlert).not.toHaveBeenCalled();
    });

    it('should send alerts to parent when attendance is below 75%', async () => {
      const studentId = 1;
      const percentage = 70.0;

      const mockStudent = {
        studentId: 1,
        studentCode: 'STU-2024-001',
        fatherPhone: '9812345678',
        motherPhone: '9887654321',
        getFullNameEn: jest.fn().mockReturnValue('John Doe')
      };

      (AttendanceRepository.calculateAttendancePercentage as jest.Mock).mockResolvedValue(
        percentage
      );
      (Student.findByPk as jest.Mock).mockResolvedValue(mockStudent);
      (smsService.sendLowAttendanceAlert as jest.Mock).mockResolvedValue({
        success: true,
        messageId: 'SMS-123'
      });
      (User.findAll as jest.Mock).mockResolvedValue([]);

      const result = await AttendanceService.checkAndAlertLowAttendance(studentId);

      expect(result.belowThreshold).toBe(true);
      expect(result.alertSent).toBe(true);
      expect(result.alertDetails?.parentNotified).toBe(true);
      expect(smsService.sendLowAttendanceAlert).toHaveBeenCalledWith(
        '9812345678',
        'John Doe',
        percentage
      );
    });

    it('should send alerts to admin when attendance is below 75%', async () => {
      const studentId = 1;
      const percentage = 65.0;

      const mockStudent = {
        studentId: 1,
        studentCode: 'STU-2024-001',
        fatherPhone: '9812345678',
        getFullNameEn: jest.fn().mockReturnValue('Jane Smith')
      };

      const mockAdmins = [
        {
          userId: 1,
          username: 'admin1',
          phoneNumber: '9811111111',
          role: 'school_admin'
        },
        {
          userId: 2,
          username: 'admin2',
          phoneNumber: '9822222222',
          role: 'school_admin'
        }
      ];

      (AttendanceRepository.calculateAttendancePercentage as jest.Mock).mockResolvedValue(
        percentage
      );
      (Student.findByPk as jest.Mock).mockResolvedValue(mockStudent);
      (smsService.sendLowAttendanceAlert as jest.Mock).mockResolvedValue({
        success: true,
        messageId: 'SMS-123'
      });
      (User.findAll as jest.Mock).mockResolvedValue(mockAdmins);
      (smsService.sendBulkSMS as jest.Mock).mockResolvedValue([
        { success: true, messageId: 'SMS-124' },
        { success: true, messageId: 'SMS-125' }
      ]);

      const result = await AttendanceService.checkAndAlertLowAttendance(studentId);

      expect(result.belowThreshold).toBe(true);
      expect(result.alertSent).toBe(true);
      expect(result.alertDetails?.adminNotified).toBe(true);
      expect(smsService.sendBulkSMS).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            recipient: '9811111111',
            message: expect.stringContaining('Low Attendance Alert')
          }),
          expect.objectContaining({
            recipient: '9822222222',
            message: expect.stringContaining('Low Attendance Alert')
          })
        ])
      );
    });

    it('should handle missing parent phone number', async () => {
      const studentId = 1;
      const percentage = 70.0;

      const mockStudent = {
        studentId: 1,
        studentCode: 'STU-2024-001',
        fatherPhone: null,
        motherPhone: null,
        getFullNameEn: jest.fn().mockReturnValue('John Doe')
      };

      (AttendanceRepository.calculateAttendancePercentage as jest.Mock).mockResolvedValue(
        percentage
      );
      (Student.findByPk as jest.Mock).mockResolvedValue(mockStudent);
      (User.findAll as jest.Mock).mockResolvedValue([]);

      const result = await AttendanceService.checkAndAlertLowAttendance(studentId);

      expect(result.belowThreshold).toBe(true);
      expect(result.alertDetails?.parentNotified).toBe(false);
      expect(smsService.sendLowAttendanceAlert).not.toHaveBeenCalled();
    });

    it('should throw error when student not found', async () => {
      const studentId = 999;
      const percentage = 70.0;

      (AttendanceRepository.calculateAttendancePercentage as jest.Mock).mockResolvedValue(
        percentage
      );
      (Student.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(
        AttendanceService.checkAndAlertLowAttendance(studentId)
      ).rejects.toThrow('Student with ID 999 not found');
    });
  });

  describe('generateAttendanceSummaryReport', () => {
    it('should generate complete attendance summary report', async () => {
      const studentId = 1;

      const mockStudent = {
        studentId: 1,
        getFullNameEn: jest.fn().mockReturnValue('John Doe')
      };

      (AttendanceRepository.countByStatusForStudent as jest.Mock).mockResolvedValue({
        present: 16,
        absent: 2,
        late: 1,
        excused: 1,
        total: 20
      });
      (AttendanceRepository.calculateAttendancePercentage as jest.Mock).mockResolvedValue(
        85.0
      );
      (Student.findByPk as jest.Mock).mockResolvedValue(mockStudent);

      const result = await AttendanceService.generateAttendanceSummaryReport(studentId);

      expect(result.studentId).toBe(studentId);
      expect(result.studentName).toBe('John Doe');
      expect(result.summary.totalDays).toBe(20);
      expect(result.summary.attendancePercentage).toBe(85.0);
      expect(result.status.meetsThreshold).toBe(true);
      expect(result.status.threshold).toBe(75);
      expect(result.status.difference).toBe(10.0);
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it('should indicate when attendance is below threshold', async () => {
      const studentId = 1;

      (AttendanceRepository.countByStatusForStudent as jest.Mock).mockResolvedValue({
        present: 14,
        absent: 6,
        late: 0,
        excused: 0,
        total: 20
      });
      (AttendanceRepository.calculateAttendancePercentage as jest.Mock).mockResolvedValue(
        70.0
      );
      (Student.findByPk as jest.Mock).mockResolvedValue({
        studentId: 1,
        getFullNameEn: jest.fn().mockReturnValue('Jane Smith')
      });

      const result = await AttendanceService.generateAttendanceSummaryReport(studentId);

      expect(result.status.meetsThreshold).toBe(false);
      expect(result.status.difference).toBe(-5.0);
    });

    it('should handle date range filters', async () => {
      const studentId = 1;
      const dateFrom = new Date('2024-01-01');
      const dateTo = new Date('2024-01-31');

      (AttendanceRepository.countByStatusForStudent as jest.Mock).mockResolvedValue({
        present: 10,
        absent: 2,
        late: 1,
        excused: 0,
        total: 13
      });
      (AttendanceRepository.calculateAttendancePercentage as jest.Mock).mockResolvedValue(
        84.62
      );
      (Student.findByPk as jest.Mock).mockResolvedValue({
        studentId: 1,
        getFullNameEn: jest.fn().mockReturnValue('John Doe')
      });

      const result = await AttendanceService.generateAttendanceSummaryReport(
        studentId,
        dateFrom,
        dateTo
      );

      expect(result.dateRange.from).toEqual(dateFrom);
      expect(result.dateRange.to).toEqual(dateTo);
    });
  });

  describe('batchCheckLowAttendance', () => {
    it('should check attendance for multiple students', async () => {
      const studentIds = [1, 2, 3];

      (AttendanceRepository.calculateAttendancePercentage as jest.Mock)
        .mockResolvedValueOnce(80.0)
        .mockResolvedValueOnce(70.0)
        .mockResolvedValueOnce(90.0);

      (Student.findByPk as jest.Mock)
        .mockResolvedValueOnce({
          studentId: 2,
          studentCode: 'STU-002',
          fatherPhone: '9812345678',
          getFullNameEn: jest.fn().mockReturnValue('Student 2')
        });

      (smsService.sendLowAttendanceAlert as jest.Mock).mockResolvedValue({
        success: true,
        messageId: 'SMS-123'
      });

      (User.findAll as jest.Mock).mockResolvedValue([]);

      const results = await AttendanceService.batchCheckLowAttendance(studentIds);

      expect(results).toHaveLength(3);
      expect(results[0].belowThreshold).toBe(false);
      expect(results[1].belowThreshold).toBe(true);
      expect(results[2].belowThreshold).toBe(false);
    });

    it('should continue processing even if one student fails', async () => {
      const studentIds = [1, 2, 3];

      (AttendanceRepository.calculateAttendancePercentage as jest.Mock)
        .mockResolvedValueOnce(80.0)
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce(70.0);

      (Student.findByPk as jest.Mock).mockResolvedValue({
        studentId: 3,
        studentCode: 'STU-003',
        fatherPhone: '9812345678',
        getFullNameEn: jest.fn().mockReturnValue('Student 3')
      });

      (smsService.sendLowAttendanceAlert as jest.Mock).mockResolvedValue({
        success: true,
        messageId: 'SMS-123'
      });

      (User.findAll as jest.Mock).mockResolvedValue([]);

      const results = await AttendanceService.batchCheckLowAttendance(studentIds);

      expect(results).toHaveLength(2); // Only successful ones
      expect(results[0].studentId).toBe(1);
      expect(results[1].studentId).toBe(3);
    });
  });
});
