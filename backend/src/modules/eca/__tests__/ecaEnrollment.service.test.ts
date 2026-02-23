/**
 * ECA Enrollment Service Unit Tests
 * 
 * Tests enrollment business logic including:
 * - Student enrollment with capacity checking
 * - Multiple ECA enrollment support
 * - Participation and attendance tracking
 * - Enrollment validation
 * 
 * Requirements: 11.3, 11.4
 */

import ecaEnrollmentService from '../ecaEnrollment.service';
import ecaEnrollmentRepository from '../ecaEnrollment.repository';
import ECA from '@models/ECA.model';

// Mock dependencies
jest.mock('../ecaEnrollment.repository');
jest.mock('@models/ECA.model');
jest.mock('@utils/logger');
jest.mock('@utils/auditLogger');

describe('ECAEnrollmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('enrollStudent', () => {
    it('should successfully enroll a student in an ECA', async () => {
      // Arrange
      const enrollmentData = {
        ecaId: 1,
        studentId: 100,
        enrollmentDate: new Date('2024-01-15')
      };

      const mockEca = {
        ecaId: 1,
        name: 'Debate Club',
        status: 'active',
        capacity: 30,
        currentEnrollment: 15,
        hasCapacity: jest.fn().mockReturnValue(true),
        incrementEnrollment: jest.fn().mockResolvedValue(undefined)
      };

      const mockEnrollment = {
        enrollmentId: 1,
        ecaId: 1,
        studentId: 100,
        enrollmentDate: new Date('2024-01-15'),
        status: 'active',
        attendanceCount: 0,
        totalSessions: 0
      };

      (ECA.findByPk as jest.Mock).mockResolvedValue(mockEca);
      (ecaEnrollmentRepository.isStudentEnrolled as jest.Mock).mockResolvedValue(false);
      (ecaEnrollmentRepository.create as jest.Mock).mockResolvedValue(mockEnrollment);

      // Act
      const result = await ecaEnrollmentService.enrollStudent(enrollmentData);

      // Assert
      expect(ECA.findByPk).toHaveBeenCalledWith(1);
      expect(mockEca.hasCapacity).toHaveBeenCalled();
      expect(ecaEnrollmentRepository.isStudentEnrolled).toHaveBeenCalledWith(1, 100);
      expect(ecaEnrollmentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ecaId: 1,
          studentId: 100,
          status: 'active',
          attendanceCount: 0,
          totalSessions: 0
        }),
        undefined,
        undefined
      );
      expect(mockEca.incrementEnrollment).toHaveBeenCalled();
      expect(result).toEqual(mockEnrollment);
    });

    it('should throw error if ECA does not exist', async () => {
      // Arrange
      const enrollmentData = {
        ecaId: 999,
        studentId: 100
      };

      (ECA.findByPk as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        ecaEnrollmentService.enrollStudent(enrollmentData)
      ).rejects.toThrow('ECA with ID 999 not found');
    });

    it('should throw error if ECA is not active', async () => {
      // Arrange
      const enrollmentData = {
        ecaId: 1,
        studentId: 100
      };

      const mockEca = {
        ecaId: 1,
        name: 'Debate Club',
        status: 'inactive'
      };

      (ECA.findByPk as jest.Mock).mockResolvedValue(mockEca);

      // Act & Assert
      await expect(
        ecaEnrollmentService.enrollStudent(enrollmentData)
      ).rejects.toThrow('ECA "Debate Club" is not active for enrollment');
    });

    it('should throw error if student is already enrolled (Requirement 11.3)', async () => {
      // Arrange
      const enrollmentData = {
        ecaId: 1,
        studentId: 100
      };

      const mockEca = {
        ecaId: 1,
        name: 'Debate Club',
        status: 'active'
      };

      (ECA.findByPk as jest.Mock).mockResolvedValue(mockEca);
      (ecaEnrollmentRepository.isStudentEnrolled as jest.Mock).mockResolvedValue(true);

      // Act & Assert
      await expect(
        ecaEnrollmentService.enrollStudent(enrollmentData)
      ).rejects.toThrow('Student is already enrolled in ECA "Debate Club"');
    });

    it('should throw error if ECA has reached capacity (Requirement 11.3)', async () => {
      // Arrange
      const enrollmentData = {
        ecaId: 1,
        studentId: 100
      };

      const mockEca = {
        ecaId: 1,
        name: 'Debate Club',
        status: 'active',
        capacity: 30,
        currentEnrollment: 30,
        hasCapacity: jest.fn().mockReturnValue(false)
      };

      (ECA.findByPk as jest.Mock).mockResolvedValue(mockEca);
      (ecaEnrollmentRepository.isStudentEnrolled as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(
        ecaEnrollmentService.enrollStudent(enrollmentData)
      ).rejects.toThrow('ECA "Debate Club" has reached its capacity of 30 students');
    });

    it('should allow enrollment in multiple ECAs (Requirement 11.3)', async () => {
      // Arrange
      const enrollmentData1 = { ecaId: 1, studentId: 100 };
      const enrollmentData2 = { ecaId: 2, studentId: 100 };

      const mockEca1 = {
        ecaId: 1,
        name: 'Debate Club',
        status: 'active',
        hasCapacity: jest.fn().mockReturnValue(true),
        incrementEnrollment: jest.fn().mockResolvedValue(undefined)
      };

      const mockEca2 = {
        ecaId: 2,
        name: 'Music Club',
        status: 'active',
        hasCapacity: jest.fn().mockReturnValue(true),
        incrementEnrollment: jest.fn().mockResolvedValue(undefined)
      };

      const mockEnrollment1 = {
        enrollmentId: 1,
        ecaId: 1,
        studentId: 100,
        status: 'active'
      };

      const mockEnrollment2 = {
        enrollmentId: 2,
        ecaId: 2,
        studentId: 100,
        status: 'active'
      };

      (ECA.findByPk as jest.Mock)
        .mockResolvedValueOnce(mockEca1)
        .mockResolvedValueOnce(mockEca2);
      (ecaEnrollmentRepository.isStudentEnrolled as jest.Mock).mockResolvedValue(false);
      (ecaEnrollmentRepository.create as jest.Mock)
        .mockResolvedValueOnce(mockEnrollment1)
        .mockResolvedValueOnce(mockEnrollment2);

      // Act
      const result1 = await ecaEnrollmentService.enrollStudent(enrollmentData1);
      const result2 = await ecaEnrollmentService.enrollStudent(enrollmentData2);

      // Assert
      expect(result1.ecaId).toBe(1);
      expect(result2.ecaId).toBe(2);
      expect(result1.studentId).toBe(100);
      expect(result2.studentId).toBe(100);
    });
  });

  describe('withdrawStudent', () => {
    it('should successfully withdraw a student from an ECA', async () => {
      // Arrange
      const enrollmentId = 1;
      const remarks = 'Student requested withdrawal';

      const mockEnrollment = {
        enrollmentId: 1,
        ecaId: 1,
        studentId: 100,
        status: 'active'
      };

      const mockUpdatedEnrollment = {
        ...mockEnrollment,
        status: 'withdrawn',
        remarks
      };

      const mockEca = {
        ecaId: 1,
        decrementEnrollment: jest.fn().mockResolvedValue(undefined)
      };

      (ecaEnrollmentRepository.findById as jest.Mock).mockResolvedValue(mockEnrollment);
      (ecaEnrollmentRepository.withdraw as jest.Mock).mockResolvedValue(
        mockUpdatedEnrollment
      );
      (ECA.findByPk as jest.Mock).mockResolvedValue(mockEca);

      // Act
      const result = await ecaEnrollmentService.withdrawStudent(enrollmentId, remarks);

      // Assert
      expect(ecaEnrollmentRepository.findById).toHaveBeenCalledWith(1);
      expect(ecaEnrollmentRepository.withdraw).toHaveBeenCalledWith(
        1,
        remarks,
        undefined,
        undefined
      );
      expect(mockEca.decrementEnrollment).toHaveBeenCalled();
      expect(result.status).toBe('withdrawn');
    });

    it('should throw error if enrollment not found', async () => {
      // Arrange
      (ecaEnrollmentRepository.findById as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        ecaEnrollmentService.withdrawStudent(999)
      ).rejects.toThrow('Enrollment with ID 999 not found');
    });

    it('should throw error if enrollment is already withdrawn', async () => {
      // Arrange
      const mockEnrollment = {
        enrollmentId: 1,
        status: 'withdrawn'
      };

      (ecaEnrollmentRepository.findById as jest.Mock).mockResolvedValue(mockEnrollment);

      // Act & Assert
      await expect(
        ecaEnrollmentService.withdrawStudent(1)
      ).rejects.toThrow('Enrollment is already withdrawn');
    });

    it('should throw error if enrollment is completed', async () => {
      // Arrange
      const mockEnrollment = {
        enrollmentId: 1,
        status: 'completed'
      };

      (ecaEnrollmentRepository.findById as jest.Mock).mockResolvedValue(mockEnrollment);

      // Act & Assert
      await expect(
        ecaEnrollmentService.withdrawStudent(1)
      ).rejects.toThrow('Cannot withdraw a completed enrollment');
    });
  });

  describe('markAttendance', () => {
    it('should successfully mark student as present (Requirement 11.4)', async () => {
      // Arrange
      const enrollmentId = 1;
      const present = true;

      const mockEnrollment = {
        enrollmentId: 1,
        ecaId: 1,
        studentId: 100,
        status: 'active',
        attendanceCount: 5,
        totalSessions: 8
      };

      const mockUpdatedEnrollment = {
        ...mockEnrollment,
        attendanceCount: 6,
        totalSessions: 9,
        getAttendancePercentage: jest.fn().mockReturnValue(66.67)
      };

      (ecaEnrollmentRepository.findById as jest.Mock).mockResolvedValue(mockEnrollment);
      (ecaEnrollmentRepository.markAttendance as jest.Mock).mockResolvedValue(
        mockUpdatedEnrollment
      );

      // Act
      const result = await ecaEnrollmentService.markAttendance(enrollmentId, present);

      // Assert
      expect(ecaEnrollmentRepository.findById).toHaveBeenCalledWith(1);
      expect(ecaEnrollmentRepository.markAttendance).toHaveBeenCalledWith(1, true);
      expect(result.attendanceCount).toBe(6);
      expect(result.totalSessions).toBe(9);
    });

    it('should successfully mark student as absent (Requirement 11.4)', async () => {
      // Arrange
      const enrollmentId = 1;
      const present = false;

      const mockEnrollment = {
        enrollmentId: 1,
        status: 'active',
        attendanceCount: 5,
        totalSessions: 8
      };

      const mockUpdatedEnrollment = {
        ...mockEnrollment,
        attendanceCount: 5,
        totalSessions: 9,
        getAttendancePercentage: jest.fn().mockReturnValue(55.56)
      };

      (ecaEnrollmentRepository.findById as jest.Mock).mockResolvedValue(mockEnrollment);
      (ecaEnrollmentRepository.markAttendance as jest.Mock).mockResolvedValue(
        mockUpdatedEnrollment
      );

      // Act
      const result = await ecaEnrollmentService.markAttendance(enrollmentId, present);

      // Assert
      expect(ecaEnrollmentRepository.markAttendance).toHaveBeenCalledWith(1, false);
      expect(result.attendanceCount).toBe(5);
      expect(result.totalSessions).toBe(9);
    });

    it('should throw error if enrollment not found', async () => {
      // Arrange
      (ecaEnrollmentRepository.findById as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        ecaEnrollmentService.markAttendance(999, true)
      ).rejects.toThrow('Enrollment with ID 999 not found');
    });

    it('should throw error if enrollment is not active', async () => {
      // Arrange
      const mockEnrollment = {
        enrollmentId: 1,
        status: 'withdrawn'
      };

      (ecaEnrollmentRepository.findById as jest.Mock).mockResolvedValue(mockEnrollment);

      // Act & Assert
      await expect(
        ecaEnrollmentService.markAttendance(1, true)
      ).rejects.toThrow('Cannot mark attendance for withdrawn enrollment');
    });
  });

  describe('bulkMarkAttendance', () => {
    it('should mark attendance for multiple students', async () => {
      // Arrange
      const attendanceData = [
        { enrollmentId: 1, present: true },
        { enrollmentId: 2, present: false },
        { enrollmentId: 3, present: true }
      ];

      const mockEnrollments = [
        { enrollmentId: 1, status: 'active' },
        { enrollmentId: 2, status: 'active' },
        { enrollmentId: 3, status: 'active' }
      ];

      const mockUpdatedEnrollments = [
        { 
          enrollmentId: 1, 
          attendanceCount: 6, 
          totalSessions: 9,
          getAttendancePercentage: jest.fn().mockReturnValue(66.67)
        },
        { 
          enrollmentId: 2, 
          attendanceCount: 5, 
          totalSessions: 9,
          getAttendancePercentage: jest.fn().mockReturnValue(55.56)
        },
        { 
          enrollmentId: 3, 
          attendanceCount: 7, 
          totalSessions: 9,
          getAttendancePercentage: jest.fn().mockReturnValue(77.78)
        }
      ];

      (ecaEnrollmentRepository.findById as jest.Mock)
        .mockResolvedValueOnce(mockEnrollments[0])
        .mockResolvedValueOnce(mockEnrollments[1])
        .mockResolvedValueOnce(mockEnrollments[2]);

      (ecaEnrollmentRepository.markAttendance as jest.Mock)
        .mockResolvedValueOnce(mockUpdatedEnrollments[0])
        .mockResolvedValueOnce(mockUpdatedEnrollments[1])
        .mockResolvedValueOnce(mockUpdatedEnrollments[2]);

      // Act
      const result = await ecaEnrollmentService.bulkMarkAttendance(attendanceData);

      // Assert
      expect(result).toHaveLength(3);
      expect(ecaEnrollmentRepository.markAttendance).toHaveBeenCalledTimes(3);
    });

    it('should continue processing even if one enrollment fails', async () => {
      // Arrange
      const attendanceData = [
        { enrollmentId: 1, present: true },
        { enrollmentId: 999, present: false }, // This will fail
        { enrollmentId: 3, present: true }
      ];

      const mockUpdatedEnrollments = [
        { 
          enrollmentId: 1,
          getAttendancePercentage: jest.fn().mockReturnValue(80)
        },
        { 
          enrollmentId: 3,
          getAttendancePercentage: jest.fn().mockReturnValue(75)
        }
      ];

      (ecaEnrollmentRepository.findById as jest.Mock)
        .mockResolvedValueOnce({ enrollmentId: 1, status: 'active' })
        .mockResolvedValueOnce(null) // Not found
        .mockResolvedValueOnce({ enrollmentId: 3, status: 'active' });

      (ecaEnrollmentRepository.markAttendance as jest.Mock)
        .mockResolvedValueOnce(mockUpdatedEnrollments[0])
        .mockResolvedValueOnce(mockUpdatedEnrollments[1]);

      // Act
      const result = await ecaEnrollmentService.bulkMarkAttendance(attendanceData);

      // Assert
      expect(result).toHaveLength(2); // Only 2 successful
    });
  });

  describe('getStudentEnrollments', () => {
    it('should return all enrollments for a student (Requirement 11.3)', async () => {
      // Arrange
      const studentId = 100;
      const mockEnrollments = [
        { enrollmentId: 1, ecaId: 1, studentId: 100, status: 'active' },
        { enrollmentId: 2, ecaId: 2, studentId: 100, status: 'active' },
        { enrollmentId: 3, ecaId: 3, studentId: 100, status: 'completed' }
      ];

      (ecaEnrollmentRepository.findByStudent as jest.Mock).mockResolvedValue(
        mockEnrollments
      );

      // Act
      const result = await ecaEnrollmentService.getStudentEnrollments(studentId);

      // Assert
      expect(ecaEnrollmentRepository.findByStudent).toHaveBeenCalledWith(
        100,
        undefined
      );
      expect(result).toHaveLength(3);
      expect(result[0].studentId).toBe(100);
    });

    it('should filter enrollments by status', async () => {
      // Arrange
      const studentId = 100;
      const mockEnrollments = [
        { enrollmentId: 1, ecaId: 1, studentId: 100, status: 'active' },
        { enrollmentId: 2, ecaId: 2, studentId: 100, status: 'active' }
      ];

      (ecaEnrollmentRepository.findByStudent as jest.Mock).mockResolvedValue(
        mockEnrollments
      );

      // Act
      const result = await ecaEnrollmentService.getStudentEnrollments(
        studentId,
        'active'
      );

      // Assert
      expect(ecaEnrollmentRepository.findByStudent).toHaveBeenCalledWith(100, 'active');
      expect(result).toHaveLength(2);
      expect(result.every(e => e.status === 'active')).toBe(true);
    });
  });

  describe('getStudentParticipationSummary', () => {
    it('should return participation summary with attendance tracking (Requirement 11.4)', async () => {
      // Arrange
      const studentId = 100;
      const mockSummary = {
        totalEnrollments: 3,
        activeEnrollments: 2,
        completedEnrollments: 1,
        averageAttendance: 75.5,
        ecas: [
          {
            ecaId: 1,
            ecaName: 'Debate Club',
            status: 'active',
            attendancePercentage: 80
          },
          {
            ecaId: 2,
            ecaName: 'Music Club',
            status: 'active',
            attendancePercentage: 71
          }
        ]
      };

      (ecaEnrollmentRepository.getStudentParticipationSummary as jest.Mock).mockResolvedValue(
        mockSummary
      );

      // Act
      const result = await ecaEnrollmentService.getStudentParticipationSummary(studentId);

      // Assert
      expect(ecaEnrollmentRepository.getStudentParticipationSummary).toHaveBeenCalledWith(
        100
      );
      expect(result.totalEnrollments).toBe(3);
      expect(result.activeEnrollments).toBe(2);
      expect(result.averageAttendance).toBe(75.5);
      expect(result.ecas).toHaveLength(2);
    });
  });

  describe('canEnroll', () => {
    it('should return true if student can enroll', async () => {
      // Arrange
      const mockEca = {
        ecaId: 1,
        status: 'active',
        hasCapacity: jest.fn().mockReturnValue(true)
      };

      (ECA.findByPk as jest.Mock).mockResolvedValue(mockEca);
      (ecaEnrollmentRepository.isStudentEnrolled as jest.Mock).mockResolvedValue(false);

      // Act
      const result = await ecaEnrollmentService.canEnroll(1, 100);

      // Assert
      expect(result.canEnroll).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should return false if ECA not found', async () => {
      // Arrange
      (ECA.findByPk as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await ecaEnrollmentService.canEnroll(999, 100);

      // Assert
      expect(result.canEnroll).toBe(false);
      expect(result.message).toBe('ECA not found');
    });

    it('should return false if ECA is not active', async () => {
      // Arrange
      const mockEca = {
        ecaId: 1,
        status: 'inactive'
      };

      (ECA.findByPk as jest.Mock).mockResolvedValue(mockEca);

      // Act
      const result = await ecaEnrollmentService.canEnroll(1, 100);

      // Assert
      expect(result.canEnroll).toBe(false);
      expect(result.message).toBe('ECA is not active');
    });

    it('should return false if student is already enrolled', async () => {
      // Arrange
      const mockEca = {
        ecaId: 1,
        status: 'active'
      };

      (ECA.findByPk as jest.Mock).mockResolvedValue(mockEca);
      (ecaEnrollmentRepository.isStudentEnrolled as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await ecaEnrollmentService.canEnroll(1, 100);

      // Assert
      expect(result.canEnroll).toBe(false);
      expect(result.message).toBe('Student is already enrolled');
    });

    it('should return false if ECA has reached capacity', async () => {
      // Arrange
      const mockEca = {
        ecaId: 1,
        status: 'active',
        capacity: 30,
        hasCapacity: jest.fn().mockReturnValue(false)
      };

      (ECA.findByPk as jest.Mock).mockResolvedValue(mockEca);
      (ecaEnrollmentRepository.isStudentEnrolled as jest.Mock).mockResolvedValue(false);

      // Act
      const result = await ecaEnrollmentService.canEnroll(1, 100);

      // Assert
      expect(result.canEnroll).toBe(false);
      expect(result.message).toBe('ECA has reached capacity (30)');
    });
  });

  describe('completeEnrollment', () => {
    it('should successfully complete an enrollment', async () => {
      // Arrange
      const enrollmentId = 1;

      const mockEnrollment = {
        enrollmentId: 1,
        ecaId: 1,
        studentId: 100,
        status: 'active'
      };

      const mockUpdatedEnrollment = {
        ...mockEnrollment,
        status: 'completed'
      };

      const mockEca = {
        ecaId: 1,
        decrementEnrollment: jest.fn().mockResolvedValue(undefined)
      };

      (ecaEnrollmentRepository.findById as jest.Mock).mockResolvedValue(mockEnrollment);
      (ecaEnrollmentRepository.update as jest.Mock).mockResolvedValue(
        mockUpdatedEnrollment
      );
      (ECA.findByPk as jest.Mock).mockResolvedValue(mockEca);

      // Act
      const result = await ecaEnrollmentService.completeEnrollment(enrollmentId);

      // Assert
      expect(ecaEnrollmentRepository.update).toHaveBeenCalledWith(
        1,
        { status: 'completed' },
        undefined,
        undefined
      );
      expect(mockEca.decrementEnrollment).toHaveBeenCalled();
      expect(result.status).toBe('completed');
    });

    it('should throw error if enrollment is not active', async () => {
      // Arrange
      const mockEnrollment = {
        enrollmentId: 1,
        status: 'withdrawn'
      };

      (ecaEnrollmentRepository.findById as jest.Mock).mockResolvedValue(mockEnrollment);

      // Act & Assert
      await expect(
        ecaEnrollmentService.completeEnrollment(1)
      ).rejects.toThrow('Cannot complete enrollment with status: withdrawn');
    });
  });
});
