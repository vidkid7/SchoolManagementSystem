/**
 * ECA Enrollment Repository Unit Tests
 * 
 * Tests database operations for ECA enrollments
 * 
 * Requirements: 11.3, 11.4
 */

import ecaEnrollmentRepository from '../ecaEnrollment.repository';
import ECAEnrollment from '@models/ECAEnrollment.model';

// Mock dependencies
jest.mock('@models/ECAEnrollment.model');
jest.mock('@models/ECA.model');
jest.mock('@utils/logger');
jest.mock('@utils/auditLogger');

describe('ECAEnrollmentRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new enrollment', async () => {
      // Arrange
      const enrollmentData = {
        ecaId: 1,
        studentId: 100,
        enrollmentDate: new Date('2024-01-15'),
        status: 'active' as const,
        attendanceCount: 0,
        totalSessions: 0
      };

      const mockEnrollment = {
        enrollmentId: 1,
        ...enrollmentData,
        toJSON: jest.fn().mockReturnValue({ enrollmentId: 1, ...enrollmentData })
      };

      (ECAEnrollment.create as jest.Mock).mockResolvedValue(mockEnrollment);

      // Act
      const result = await ecaEnrollmentRepository.create(enrollmentData);

      // Assert
      expect(ECAEnrollment.create).toHaveBeenCalledWith(enrollmentData);
      expect(result).toEqual(mockEnrollment);
    });
  });

  describe('findById', () => {
    it('should find enrollment by ID', async () => {
      // Arrange
      const mockEnrollment = {
        enrollmentId: 1,
        ecaId: 1,
        studentId: 100
      };

      (ECAEnrollment.findByPk as jest.Mock).mockResolvedValue(mockEnrollment);

      // Act
      const result = await ecaEnrollmentRepository.findById(1);

      // Assert
      expect(ECAEnrollment.findByPk).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockEnrollment);
    });

    it('should return null if enrollment not found', async () => {
      // Arrange
      (ECAEnrollment.findByPk as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await ecaEnrollmentRepository.findById(999);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByEcaAndStudent', () => {
    it('should find enrollment by ECA and student', async () => {
      // Arrange
      const mockEnrollment = {
        enrollmentId: 1,
        ecaId: 1,
        studentId: 100
      };

      (ECAEnrollment.findOne as jest.Mock).mockResolvedValue(mockEnrollment);

      // Act
      const result = await ecaEnrollmentRepository.findByEcaAndStudent(1, 100);

      // Assert
      expect(ECAEnrollment.findOne).toHaveBeenCalledWith({
        where: { ecaId: 1, studentId: 100 }
      });
      expect(result).toEqual(mockEnrollment);
    });
  });

  describe('findByStudent', () => {
    it('should find all enrollments for a student', async () => {
      // Arrange
      const mockEnrollments = [
        { enrollmentId: 1, ecaId: 1, studentId: 100, status: 'active' },
        { enrollmentId: 2, ecaId: 2, studentId: 100, status: 'active' }
      ];

      (ECAEnrollment.findAll as jest.Mock).mockResolvedValue(mockEnrollments);

      // Act
      const result = await ecaEnrollmentRepository.findByStudent(100);

      // Assert
      expect(ECAEnrollment.findAll).toHaveBeenCalledWith({
        where: { studentId: 100 },
        order: [['enrollmentDate', 'DESC']]
      });
      expect(result).toHaveLength(2);
    });

    it('should filter by status', async () => {
      // Arrange
      const mockEnrollments = [
        { enrollmentId: 1, ecaId: 1, studentId: 100, status: 'active' }
      ];

      (ECAEnrollment.findAll as jest.Mock).mockResolvedValue(mockEnrollments);

      // Act
      const result = await ecaEnrollmentRepository.findByStudent(100, 'active');

      // Assert
      expect(ECAEnrollment.findAll).toHaveBeenCalledWith({
        where: { studentId: 100, status: 'active' },
        order: [['enrollmentDate', 'DESC']]
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findByEca', () => {
    it('should find all enrollments for an ECA', async () => {
      // Arrange
      const mockEnrollments = [
        { enrollmentId: 1, ecaId: 1, studentId: 100, status: 'active' },
        { enrollmentId: 2, ecaId: 1, studentId: 101, status: 'active' }
      ];

      (ECAEnrollment.findAll as jest.Mock).mockResolvedValue(mockEnrollments);

      // Act
      const result = await ecaEnrollmentRepository.findByEca(1);

      // Assert
      expect(ECAEnrollment.findAll).toHaveBeenCalledWith({
        where: { ecaId: 1 },
        order: [['enrollmentDate', 'ASC']]
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('countActiveEnrollments', () => {
    it('should count active enrollments for an ECA', async () => {
      // Arrange
      (ECAEnrollment.count as jest.Mock).mockResolvedValue(15);

      // Act
      const result = await ecaEnrollmentRepository.countActiveEnrollments(1);

      // Assert
      expect(ECAEnrollment.count).toHaveBeenCalledWith({
        where: { ecaId: 1, status: 'active' }
      });
      expect(result).toBe(15);
    });
  });

  describe('countActiveEnrollmentsForStudent', () => {
    it('should count active enrollments for a student', async () => {
      // Arrange
      (ECAEnrollment.count as jest.Mock).mockResolvedValue(3);

      // Act
      const result = await ecaEnrollmentRepository.countActiveEnrollmentsForStudent(100);

      // Assert
      expect(ECAEnrollment.count).toHaveBeenCalledWith({
        where: { studentId: 100, status: 'active' }
      });
      expect(result).toBe(3);
    });
  });

  describe('isStudentEnrolled', () => {
    it('should return true if student is enrolled', async () => {
      // Arrange
      (ECAEnrollment.count as jest.Mock).mockResolvedValue(1);

      // Act
      const result = await ecaEnrollmentRepository.isStudentEnrolled(1, 100);

      // Assert
      expect(ECAEnrollment.count).toHaveBeenCalledWith({
        where: { ecaId: 1, studentId: 100, status: 'active' }
      });
      expect(result).toBe(true);
    });

    it('should return false if student is not enrolled', async () => {
      // Arrange
      (ECAEnrollment.count as jest.Mock).mockResolvedValue(0);

      // Act
      const result = await ecaEnrollmentRepository.isStudentEnrolled(1, 100);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('update', () => {
    it('should update enrollment', async () => {
      // Arrange
      const mockEnrollment = {
        enrollmentId: 1,
        status: 'active',
        remarks: 'Old remarks',
        update: jest.fn().mockResolvedValue(undefined),
        toJSON: jest.fn().mockReturnValue({ enrollmentId: 1, status: 'active' })
      };

      const updateData = { remarks: 'New remarks' };

      (ECAEnrollment.findByPk as jest.Mock).mockResolvedValue(mockEnrollment);

      // Act
      const result = await ecaEnrollmentRepository.update(1, updateData);

      // Assert
      expect(ECAEnrollment.findByPk).toHaveBeenCalledWith(1);
      expect(mockEnrollment.update).toHaveBeenCalledWith(updateData);
      expect(result).toEqual(mockEnrollment);
    });

    it('should return null if enrollment not found', async () => {
      // Arrange
      (ECAEnrollment.findByPk as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await ecaEnrollmentRepository.update(999, { remarks: 'Test' });

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('withdraw', () => {
    it('should withdraw enrollment', async () => {
      // Arrange
      const mockEnrollment = {
        enrollmentId: 1,
        status: 'active',
        update: jest.fn().mockResolvedValue(undefined),
        toJSON: jest.fn().mockReturnValue({ enrollmentId: 1, status: 'withdrawn' })
      };

      (ECAEnrollment.findByPk as jest.Mock).mockResolvedValue(mockEnrollment);

      // Act
      const result = await ecaEnrollmentRepository.withdraw(1, 'Student request');

      // Assert
      expect(mockEnrollment.update).toHaveBeenCalledWith({
        status: 'withdrawn',
        remarks: 'Student request'
      });
      expect(result).toEqual(mockEnrollment);
    });
  });

  describe('markAttendance', () => {
    it('should mark student as present', async () => {
      // Arrange
      const mockEnrollment = {
        enrollmentId: 1,
        attendanceCount: 5,
        totalSessions: 8,
        markAttendance: jest.fn().mockResolvedValue(undefined)
      };

      (ECAEnrollment.findByPk as jest.Mock).mockResolvedValue(mockEnrollment);

      // Act
      const result = await ecaEnrollmentRepository.markAttendance(1, true);

      // Assert
      expect(mockEnrollment.markAttendance).toHaveBeenCalled();
      expect(result).toEqual(mockEnrollment);
    });

    it('should mark student as absent', async () => {
      // Arrange
      const mockEnrollment = {
        enrollmentId: 1,
        attendanceCount: 5,
        totalSessions: 8,
        markAbsent: jest.fn().mockResolvedValue(undefined)
      };

      (ECAEnrollment.findByPk as jest.Mock).mockResolvedValue(mockEnrollment);

      // Act
      const result = await ecaEnrollmentRepository.markAttendance(1, false);

      // Assert
      expect(mockEnrollment.markAbsent).toHaveBeenCalled();
      expect(result).toEqual(mockEnrollment);
    });

    it('should return null if enrollment not found', async () => {
      // Arrange
      (ECAEnrollment.findByPk as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await ecaEnrollmentRepository.markAttendance(999, true);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all enrollments with pagination', async () => {
      // Arrange
      const mockEnrollments = [
        { enrollmentId: 1, ecaId: 1, studentId: 100 },
        { enrollmentId: 2, ecaId: 1, studentId: 101 }
      ];

      (ECAEnrollment.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: mockEnrollments,
        count: 2
      });

      // Act
      const result = await ecaEnrollmentRepository.findAll();

      // Assert
      expect(ECAEnrollment.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: 20,
        offset: 0,
        order: [['enrollmentDate', 'DESC']]
      });
      expect(result.enrollments).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should apply filters', async () => {
      // Arrange
      const filters = {
        ecaId: 1,
        studentId: 100,
        status: 'active' as const
      };

      (ECAEnrollment.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [],
        count: 0
      });

      // Act
      await ecaEnrollmentRepository.findAll(filters);

      // Assert
      expect(ECAEnrollment.findAndCountAll).toHaveBeenCalledWith({
        where: {
          ecaId: 1,
          studentId: 100,
          status: 'active'
        },
        limit: 20,
        offset: 0,
        order: [['enrollmentDate', 'DESC']]
      });
    });
  });

  describe('getEnrollmentStats', () => {
    it('should return enrollment statistics', async () => {
      // Arrange
      const mockEnrollments = [
        {
          totalSessions: 10,
          getAttendancePercentage: jest.fn().mockReturnValue(80)
        },
        {
          totalSessions: 10,
          getAttendancePercentage: jest.fn().mockReturnValue(70)
        }
      ];

      (ECAEnrollment.count as jest.Mock)
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(7) // active
        .mockResolvedValueOnce(2) // withdrawn
        .mockResolvedValueOnce(1); // completed

      (ECAEnrollment.findAll as jest.Mock).mockResolvedValue(mockEnrollments);

      // Act
      const result = await ecaEnrollmentRepository.getEnrollmentStats(1);

      // Assert
      expect(result.total).toBe(10);
      expect(result.active).toBe(7);
      expect(result.withdrawn).toBe(2);
      expect(result.completed).toBe(1);
      expect(result.averageAttendance).toBe(75); // (80 + 70) / 2
    });
  });

  describe('getStudentParticipationSummary', () => {
    it('should return student participation summary', async () => {
      // Arrange
      const mockEnrollments = [
        {
          enrollmentId: 1,
          ecaId: 1,
          studentId: 100,
          status: 'active',
          totalSessions: 10,
          getAttendancePercentage: jest.fn().mockReturnValue(80),
          eca: { ecaId: 1, name: 'Debate Club' }
        },
        {
          enrollmentId: 2,
          ecaId: 2,
          studentId: 100,
          status: 'completed',
          totalSessions: 10,
          getAttendancePercentage: jest.fn().mockReturnValue(90),
          eca: { ecaId: 2, name: 'Music Club' }
        }
      ];

      (ECAEnrollment.findAll as jest.Mock).mockResolvedValue(mockEnrollments);

      // Act
      const result = await ecaEnrollmentRepository.getStudentParticipationSummary(100);

      // Assert
      expect(result.totalEnrollments).toBe(2);
      expect(result.activeEnrollments).toBe(1);
      expect(result.completedEnrollments).toBe(1);
      expect(result.averageAttendance).toBe(85); // (80 + 90) / 2
      expect(result.ecas).toHaveLength(2);
      expect(result.ecas[0].ecaName).toBe('Debate Club');
    });
  });
});
