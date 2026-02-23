import leaveApplicationService from '../leaveApplication.service';
import LeaveApplicationRepository from '../leaveApplication.repository';
import AttendanceRepository from '../attendance.repository';
import LeaveApplication, { LeaveStatus } from '@models/LeaveApplication.model';
import { AttendanceStatus } from '@models/AttendanceRecord.model';
import Student from '@models/Student.model';
import smsService from '@services/sms.service';

// Mock dependencies
jest.mock('../leaveApplication.repository');
jest.mock('../attendance.repository');
jest.mock('@models/Student.model');
jest.mock('@services/sms.service');

describe('LeaveApplicationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('applyForLeave', () => {
    it('should create a leave application successfully', async () => {
      const leaveData = {
        studentId: 1,
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-12'),
        reason: 'Family emergency requiring immediate attention'
      };

      const mockLeave = {
        leaveId: 1,
        ...leaveData,
        appliedBy: 100,
        appliedAt: new Date(),
        status: LeaveStatus.PENDING
      } as LeaveApplication;

      (LeaveApplicationRepository.findOverlapping as jest.Mock).mockResolvedValue([]);
      (LeaveApplicationRepository.create as jest.Mock).mockResolvedValue(mockLeave);
      (smsService.sendBulkSMS as jest.Mock).mockResolvedValue([]);

      const result = await leaveApplicationService.applyForLeave(leaveData, 100);

      expect(result).toEqual(mockLeave);
      expect(LeaveApplicationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 1,
          status: LeaveStatus.PENDING,
          appliedBy: 100
        }),
        100,
        undefined
      );
    });

    it('should throw error if end date is before start date', async () => {
      const leaveData = {
        studentId: 1,
        startDate: new Date('2024-01-12'),
        endDate: new Date('2024-01-10'),
        reason: 'Family emergency'
      };

      await expect(
        leaveApplicationService.applyForLeave(leaveData, 100)
      ).rejects.toThrow('End date must be after or equal to start date');
    });

    it('should throw error if overlapping approved leave exists', async () => {
      const leaveData = {
        studentId: 1,
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-12'),
        reason: 'Family emergency'
      };

      const mockOverlapping = [
        { leaveId: 2, status: LeaveStatus.APPROVED }
      ] as LeaveApplication[];

      (LeaveApplicationRepository.findOverlapping as jest.Mock).mockResolvedValue(
        mockOverlapping
      );

      await expect(
        leaveApplicationService.applyForLeave(leaveData, 100)
      ).rejects.toThrow('There is already an approved leave application for this date range');
    });
  });

  describe('approveLeave', () => {
    it('should approve leave and mark attendance as excused', async () => {
      const mockLeave = {
        leaveId: 1,
        studentId: 1,
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-12'),
        status: LeaveStatus.PENDING,
        isPending: () => true,
        isApproved: () => false
      } as unknown as LeaveApplication;

      const mockUpdatedLeave = {
        ...mockLeave,
        status: LeaveStatus.APPROVED,
        approvedBy: 200,
        approvedAt: new Date(),
        isApproved: () => true
      } as unknown as LeaveApplication;

      const mockStudent = {
        studentId: 1,
        currentClassId: 10,
        getFullNameEn: () => 'John Doe',
        fatherPhone: '9841234567'
      } as unknown as Student;

      (LeaveApplicationRepository.findById as jest.Mock).mockResolvedValue(mockLeave);
      (LeaveApplicationRepository.update as jest.Mock).mockResolvedValue(mockUpdatedLeave);
      (Student.findByPk as jest.Mock).mockResolvedValue(mockStudent);
      (AttendanceRepository.findByStudentAndDate as jest.Mock).mockResolvedValue(null);
      (AttendanceRepository.create as jest.Mock).mockResolvedValue({});
      (smsService.sendSMS as jest.Mock).mockResolvedValue({ success: true });

      const result = await leaveApplicationService.approveLeave(1, 200);

      expect(result.status).toBe(LeaveStatus.APPROVED);
      expect(LeaveApplicationRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: LeaveStatus.APPROVED,
          approvedBy: 200
        }),
        200,
        undefined
      );

      // Should create 3 attendance records (Jan 10, 11, 12)
      expect(AttendanceRepository.create).toHaveBeenCalledTimes(3);
      expect(AttendanceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 1,
          status: AttendanceStatus.EXCUSED
        }),
        200,
        undefined
      );
    });

    it('should throw error if leave not found', async () => {
      (LeaveApplicationRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        leaveApplicationService.approveLeave(999, 200)
      ).rejects.toThrow('Leave application with ID 999 not found');
    });

    it('should throw error if leave is not pending', async () => {
      const mockLeave = {
        leaveId: 1,
        status: LeaveStatus.APPROVED,
        isPending: () => false
      } as unknown as LeaveApplication;

      (LeaveApplicationRepository.findById as jest.Mock).mockResolvedValue(mockLeave);

      await expect(
        leaveApplicationService.approveLeave(1, 200)
      ).rejects.toThrow('Leave application is already approved');
    });

    it('should update existing attendance records to excused', async () => {
      const mockLeave = {
        leaveId: 1,
        studentId: 1,
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-10'),
        status: LeaveStatus.PENDING,
        approvedBy: 200,
        reason: 'Medical',
        isPending: () => true,
        isApproved: () => false
      } as unknown as LeaveApplication;

      const mockUpdatedLeave = {
        ...mockLeave,
        status: LeaveStatus.APPROVED,
        isApproved: () => true
      } as unknown as LeaveApplication;

      const mockStudent = {
        studentId: 1,
        currentClassId: 10,
        getFullNameEn: () => 'John Doe',
        fatherPhone: '9841234567'
      } as unknown as Student;

      const mockExistingAttendance = {
        attendanceId: 100,
        studentId: 1,
        status: AttendanceStatus.ABSENT
      };

      (LeaveApplicationRepository.findById as jest.Mock).mockResolvedValue(mockLeave);
      (LeaveApplicationRepository.update as jest.Mock).mockResolvedValue(mockUpdatedLeave);
      (Student.findByPk as jest.Mock).mockResolvedValue(mockStudent);
      (AttendanceRepository.findByStudentAndDate as jest.Mock).mockResolvedValue(
        mockExistingAttendance
      );
      (AttendanceRepository.update as jest.Mock).mockResolvedValue({});
      (smsService.sendSMS as jest.Mock).mockResolvedValue({ success: true });

      await leaveApplicationService.approveLeave(1, 200);

      expect(AttendanceRepository.update).toHaveBeenCalledWith(
        100,
        expect.objectContaining({
          status: AttendanceStatus.EXCUSED,
          remarks: 'Leave approved: Medical'
        }),
        200,
        undefined
      );
    });
  });

  describe('rejectLeave', () => {
    it('should reject leave with reason', async () => {
      const mockLeave = {
        leaveId: 1,
        studentId: 1,
        status: LeaveStatus.PENDING,
        isPending: () => true
      } as unknown as LeaveApplication;

      const mockUpdatedLeave = {
        ...mockLeave,
        status: LeaveStatus.REJECTED,
        rejectionReason: 'Insufficient documentation'
      } as unknown as LeaveApplication;

      const mockStudent = {
        studentId: 1,
        getFullNameEn: () => 'John Doe',
        fatherPhone: '9841234567'
      } as unknown as Student;

      (LeaveApplicationRepository.findById as jest.Mock).mockResolvedValue(mockLeave);
      (LeaveApplicationRepository.update as jest.Mock).mockResolvedValue(mockUpdatedLeave);
      (Student.findByPk as jest.Mock).mockResolvedValue(mockStudent);
      (smsService.sendSMS as jest.Mock).mockResolvedValue({ success: true });

      const result = await leaveApplicationService.rejectLeave(
        1,
        200,
        'Insufficient documentation'
      );

      expect(result.status).toBe(LeaveStatus.REJECTED);
      expect(LeaveApplicationRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: LeaveStatus.REJECTED,
          rejectionReason: 'Insufficient documentation'
        }),
        200,
        undefined
      );
    });

    it('should throw error if rejection reason is empty', async () => {
      const mockLeave = {
        leaveId: 1,
        status: LeaveStatus.PENDING,
        isPending: () => true
      } as unknown as LeaveApplication;

      (LeaveApplicationRepository.findById as jest.Mock).mockResolvedValue(mockLeave);

      await expect(
        leaveApplicationService.rejectLeave(1, 200, '')
      ).rejects.toThrow('Rejection reason is required');
    });
  });

  describe('getPendingLeaves', () => {
    it('should return pending leave applications', async () => {
      const mockLeaves = [
        { leaveId: 1, status: LeaveStatus.PENDING },
        { leaveId: 2, status: LeaveStatus.PENDING }
      ] as LeaveApplication[];

      (LeaveApplicationRepository.findPending as jest.Mock).mockResolvedValue(mockLeaves);

      const result = await leaveApplicationService.getPendingLeaves();

      expect(result).toEqual(mockLeaves);
      expect(LeaveApplicationRepository.findPending).toHaveBeenCalledWith(undefined, 100);
    });

    it('should filter by student ID', async () => {
      const mockLeaves = [
        { leaveId: 1, studentId: 1, status: LeaveStatus.PENDING }
      ] as LeaveApplication[];

      (LeaveApplicationRepository.findPending as jest.Mock).mockResolvedValue(mockLeaves);

      const result = await leaveApplicationService.getPendingLeaves(1);

      expect(result).toEqual(mockLeaves);
      expect(LeaveApplicationRepository.findPending).toHaveBeenCalledWith(1, 100);
    });
  });

  describe('cancelLeave', () => {
    it('should cancel pending leave application', async () => {
      const mockLeave = {
        leaveId: 1,
        status: LeaveStatus.PENDING,
        canCancel: () => true
      } as unknown as LeaveApplication;

      (LeaveApplicationRepository.findById as jest.Mock).mockResolvedValue(mockLeave);
      (LeaveApplicationRepository.delete as jest.Mock).mockResolvedValue(true);

      const result = await leaveApplicationService.cancelLeave(1, 100);

      expect(result).toBe(true);
      expect(LeaveApplicationRepository.delete).toHaveBeenCalledWith(1, 100, undefined);
    });

    it('should throw error if leave is not pending', async () => {
      const mockLeave = {
        leaveId: 1,
        status: LeaveStatus.APPROVED,
        canCancel: () => false
      } as unknown as LeaveApplication;

      (LeaveApplicationRepository.findById as jest.Mock).mockResolvedValue(mockLeave);

      await expect(
        leaveApplicationService.cancelLeave(1, 100)
      ).rejects.toThrow('Only pending leave applications can be cancelled');
    });
  });

  describe('getLeaveStatistics', () => {
    it('should return leave statistics for student', async () => {
      const mockCounts = {
        pending: 1,
        approved: 3,
        rejected: 1,
        total: 5
      };

      const mockApprovedLeaves = [
        {
          leaveId: 1,
          startDate: new Date('2024-01-10'),
          endDate: new Date('2024-01-12'),
          getDurationInDays: () => 3
        },
        {
          leaveId: 2,
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-01'),
          getDurationInDays: () => 1
        }
      ] as unknown as LeaveApplication[];

      (LeaveApplicationRepository.countByStatusForStudent as jest.Mock).mockResolvedValue(
        mockCounts
      );
      (LeaveApplicationRepository.findByStudent as jest.Mock).mockResolvedValue(
        mockApprovedLeaves
      );

      const result = await leaveApplicationService.getLeaveStatistics(1);

      expect(result).toEqual({
        studentId: 1,
        pending: 1,
        approved: 3,
        rejected: 1,
        total: 5,
        totalApprovedDays: 4
      });
    });
  });
});
