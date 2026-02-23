/**
 * Sports Enrollment Repository Unit Tests
 * 
 * Tests for sports enrollment database operations
 * 
 * Requirements: 12.3, 12.4
 */

import sportsEnrollmentRepository from '../sportsEnrollment.repository';
import SportsEnrollment from '@models/SportsEnrollment.model';
import Sport from '@models/Sport.model';
import Team from '@models/Team.model';
import auditLogger from '@utils/auditLogger';

// Mock dependencies
jest.mock('@models/SportsEnrollment.model');
jest.mock('@models/Sport.model');
jest.mock('@models/Team.model');
jest.mock('@utils/logger');
jest.mock('@utils/auditLogger');

describe('SportsEnrollmentRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new sports enrollment', async () => {
      // Arrange
      const enrollmentData = {
        sportId: 1,
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

      (SportsEnrollment.create as jest.Mock).mockResolvedValue(mockEnrollment);
      (auditLogger.logCreate as jest.Mock).mockResolvedValue(undefined);

      // Act
      const result = await sportsEnrollmentRepository.create(enrollmentData, 1);

      // Assert
      expect(SportsEnrollment.create).toHaveBeenCalledWith(enrollmentData);
      expect(auditLogger.logCreate).toHaveBeenCalledWith(
        'sports_enrollment',
        1,
        expect.any(Object),
        1,
        undefined
      );
      expect(result).toEqual(mockEnrollment);
    });
  });

  describe('findById', () => {
    it('should find enrollment by ID', async () => {
      // Arrange
      const enrollmentId = 1;
      const mockEnrollment = {
        enrollmentId: 1,
        sportId: 1,
        studentId: 100
      };

      (SportsEnrollment.findByPk as jest.Mock).mockResolvedValue(mockEnrollment);

      // Act
      const result = await sportsEnrollmentRepository.findById(enrollmentId);

      // Assert
      expect(SportsEnrollment.findByPk).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockEnrollment);
    });

    it('should return null if enrollment not found', async () => {
      // Arrange
      (SportsEnrollment.findByPk as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await sportsEnrollmentRepository.findById(999);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findBySportAndStudent', () => {
    it('should find active enrollment by sport and student', async () => {
      // Arrange
      const sportId = 1;
      const studentId = 100;
      const mockEnrollment = {
        enrollmentId: 1,
        sportId: 1,
        studentId: 100,
        status: 'active'
      };

      (SportsEnrollment.findOne as jest.Mock).mockResolvedValue(mockEnrollment);

      // Act
      const result = await sportsEnrollmentRepository.findBySportAndStudent(sportId, studentId);

      // Assert
      expect(SportsEnrollment.findOne).toHaveBeenCalledWith({
        where: { sportId: 1, studentId: 100, status: 'active' }
      });
      expect(result).toEqual(mockEnrollment);
    });
  });

  describe('findByStudent', () => {
    it('should find all enrollments for a student', async () => {
      // Arrange
      const studentId = 100;
      const mockEnrollments = [
        { enrollmentId: 1, sportId: 1, studentId: 100, status: 'active' },
        { enrollmentId: 2, sportId: 2, studentId: 100, status: 'completed' }
      ];

      (SportsEnrollment.findAll as jest.Mock).mockResolvedValue(mockEnrollments);

      // Act
      const result = await sportsEnrollmentRepository.findByStudent(studentId);

      // Assert
      expect(SportsEnrollment.findAll).toHaveBeenCalledWith({
        where: { studentId: 100 },
        order: [['enrollmentDate', 'DESC']]
      });
      expect(result).toEqual(mockEnrollments);
    });

    it('should filter by status when provided', async () => {
      // Arrange
      const studentId = 100;
      const status = 'active';
      const mockEnrollments = [
        { enrollmentId: 1, sportId: 1, studentId: 100, status: 'active' }
      ];

      (SportsEnrollment.findAll as jest.Mock).mockResolvedValue(mockEnrollments);

      // Act
      const result = await sportsEnrollmentRepository.findByStudent(studentId, status);

      // Assert
      expect(SportsEnrollment.findAll).toHaveBeenCalledWith({
        where: { studentId: 100, status: 'active' },
        order: [['enrollmentDate', 'DESC']]
      });
      expect(result).toEqual(mockEnrollments);
    });
  });

  describe('findBySport', () => {
    it('should find all enrollments for a sport', async () => {
      // Arrange
      const sportId = 1;
      const mockEnrollments = [
        { enrollmentId: 1, sportId: 1, studentId: 100 },
        { enrollmentId: 2, sportId: 1, studentId: 101 }
      ];

      (SportsEnrollment.findAll as jest.Mock).mockResolvedValue(mockEnrollments);

      // Act
      const result = await sportsEnrollmentRepository.findBySport(sportId);

      // Assert
      expect(SportsEnrollment.findAll).toHaveBeenCalledWith({
        where: { sportId: 1 },
        order: [['enrollmentDate', 'ASC']]
      });
      expect(result).toEqual(mockEnrollments);
    });
  });

  describe('findByTeam', () => {
    it('should find all enrollments for a team', async () => {
      // Arrange
      const teamId = 5;
      const mockEnrollments = [
        { enrollmentId: 1, sportId: 1, studentId: 100, teamId: 5 },
        { enrollmentId: 2, sportId: 1, studentId: 101, teamId: 5 }
      ];

      (SportsEnrollment.findAll as jest.Mock).mockResolvedValue(mockEnrollments);

      // Act
      const result = await sportsEnrollmentRepository.findByTeam(teamId);

      // Assert
      expect(SportsEnrollment.findAll).toHaveBeenCalledWith({
        where: { teamId: 5 },
        order: [['enrollmentDate', 'ASC']]
      });
      expect(result).toEqual(mockEnrollments);
    });
  });

  describe('countActiveEnrollments', () => {
    it('should count active enrollments for a sport', async () => {
      // Arrange
      const sportId = 1;
      (SportsEnrollment.count as jest.Mock).mockResolvedValue(15);

      // Act
      const result = await sportsEnrollmentRepository.countActiveEnrollments(sportId);

      // Assert
      expect(SportsEnrollment.count).toHaveBeenCalledWith({
        where: { sportId: 1, status: 'active' }
      });
      expect(result).toBe(15);
    });
  });

  describe('isStudentEnrolled', () => {
    it('should return true if student is enrolled', async () => {
      // Arrange
      const sportId = 1;
      const studentId = 100;
      (SportsEnrollment.count as jest.Mock).mockResolvedValue(1);

      // Act
      const result = await sportsEnrollmentRepository.isStudentEnrolled(sportId, studentId);

      // Assert
      expect(SportsEnrollment.count).toHaveBeenCalledWith({
        where: { sportId: 1, studentId: 100, status: 'active' }
      });
      expect(result).toBe(true);
    });

    it('should return false if student is not enrolled', async () => {
      // Arrange
      const sportId = 1;
      const studentId = 100;
      (SportsEnrollment.count as jest.Mock).mockResolvedValue(0);

      // Act
      const result = await sportsEnrollmentRepository.isStudentEnrolled(sportId, studentId);

      // Assert
      expect(result).toBe(false);
    });

    it('should exclude specific enrollment ID when checking', async () => {
      // Arrange
      const sportId = 1;
      const studentId = 100;
      const excludeEnrollmentId = 5;
      (SportsEnrollment.count as jest.Mock).mockResolvedValue(0);

      // Act
      const result = await sportsEnrollmentRepository.isStudentEnrolled(
        sportId,
        studentId,
        excludeEnrollmentId
      );

      // Assert
      expect(SportsEnrollment.count).toHaveBeenCalled();
      const callArg = (SportsEnrollment.count as jest.Mock).mock.calls[0][0];
      expect(callArg.where.sportId).toBe(1);
      expect(callArg.where.studentId).toBe(100);
      expect(callArg.where.status).toBe('active');
      expect(callArg.where.enrollmentId).toBeDefined();
      expect(result).toBe(false);
    });
  });

  describe('update', () => {
    it('should update enrollment and log audit', async () => {
      // Arrange
      const enrollmentId = 1;
      const updateData = { remarks: 'Updated remarks' };

      const mockEnrollment = {
        enrollmentId: 1,
        sportId: 1,
        studentId: 100,
        remarks: 'Old remarks',
        toJSON: jest.fn()
          .mockReturnValueOnce({ enrollmentId: 1, remarks: 'Old remarks' })
          .mockReturnValueOnce({ enrollmentId: 1, remarks: 'Updated remarks' }),
        update: jest.fn().mockResolvedValue(undefined)
      };

      (SportsEnrollment.findByPk as jest.Mock).mockResolvedValue(mockEnrollment);
      (auditLogger.logUpdate as jest.Mock).mockResolvedValue(undefined);

      // Act
      const result = await sportsEnrollmentRepository.update(enrollmentId, updateData, 1);

      // Assert
      expect(SportsEnrollment.findByPk).toHaveBeenCalledWith(1);
      expect(mockEnrollment.update).toHaveBeenCalledWith(updateData);
      expect(auditLogger.logUpdate).toHaveBeenCalledWith(
        'sports_enrollment',
        1,
        expect.any(Object),
        expect.any(Object),
        1,
        undefined
      );
      expect(result).toEqual(mockEnrollment);
    });

    it('should return null if enrollment not found', async () => {
      // Arrange
      (SportsEnrollment.findByPk as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await sportsEnrollmentRepository.update(999, { remarks: 'Test' });

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('markAttendance', () => {
    it('should mark student as present', async () => {
      // Arrange
      const enrollmentId = 1;
      const present = true;

      const mockEnrollment = {
        enrollmentId: 1,
        attendanceCount: 5,
        totalSessions: 8,
        markAttendance: jest.fn().mockResolvedValue(undefined)
      };

      (SportsEnrollment.findByPk as jest.Mock).mockResolvedValue(mockEnrollment);

      // Act
      const result = await sportsEnrollmentRepository.markAttendance(enrollmentId, present);

      // Assert
      expect(SportsEnrollment.findByPk).toHaveBeenCalledWith(1);
      expect(mockEnrollment.markAttendance).toHaveBeenCalled();
      expect(result).toEqual(mockEnrollment);
    });

    it('should mark student as absent', async () => {
      // Arrange
      const enrollmentId = 1;
      const present = false;

      const mockEnrollment = {
        enrollmentId: 1,
        attendanceCount: 5,
        totalSessions: 8,
        markAbsent: jest.fn().mockResolvedValue(undefined)
      };

      (SportsEnrollment.findByPk as jest.Mock).mockResolvedValue(mockEnrollment);

      // Act
      const result = await sportsEnrollmentRepository.markAttendance(enrollmentId, present);

      // Assert
      expect(mockEnrollment.markAbsent).toHaveBeenCalled();
      expect(result).toEqual(mockEnrollment);
    });

    it('should return null if enrollment not found', async () => {
      // Arrange
      (SportsEnrollment.findByPk as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await sportsEnrollmentRepository.markAttendance(999, true);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findWithPagination', () => {
    it('should return enrollments with pagination metadata', async () => {
      // Arrange
      const filters = { sportId: 1 };
      const page = 2;
      const limit = 10;

      const mockEnrollments = Array(10).fill(null).map((_, i) => ({
        enrollmentId: i + 11,
        sportId: 1,
        studentId: 100 + i
      }));

      (SportsEnrollment.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: mockEnrollments,
        count: 25
      });

      // Act
      const result = await sportsEnrollmentRepository.findWithPagination(filters, page, limit);

      // Assert
      expect(SportsEnrollment.findAndCountAll).toHaveBeenCalledWith({
        where: { sportId: 1 },
        limit: 10,
        offset: 10,
        order: [['enrollmentDate', 'DESC']]
      });
      expect(result.enrollments).toHaveLength(10);
      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3
      });
    });

    it('should enforce maximum limit of 100', async () => {
      // Arrange
      const filters = {};
      const page = 1;
      const limit = 200; // Exceeds max

      (SportsEnrollment.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [],
        count: 0
      });

      // Act
      await sportsEnrollmentRepository.findWithPagination(filters, page, limit);

      // Assert
      expect(SportsEnrollment.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: 100, // Capped at 100
        offset: 0,
        order: [['enrollmentDate', 'DESC']]
      });
    });
  });

  describe('getEnrollmentStats', () => {
    it('should return enrollment statistics', async () => {
      // Arrange
      const sportId = 1;

      const mockEnrollments = [
        {
          enrollmentId: 1,
          totalSessions: 10,
          getAttendancePercentage: jest.fn().mockReturnValue(80)
        },
        {
          enrollmentId: 2,
          totalSessions: 10,
          getAttendancePercentage: jest.fn().mockReturnValue(70)
        },
        {
          enrollmentId: 3,
          totalSessions: 0,
          getAttendancePercentage: jest.fn().mockReturnValue(0)
        }
      ];

      (SportsEnrollment.count as jest.Mock)
        .mockResolvedValueOnce(15) // total
        .mockResolvedValueOnce(10) // active
        .mockResolvedValueOnce(3)  // withdrawn
        .mockResolvedValueOnce(2); // completed

      (SportsEnrollment.findAll as jest.Mock).mockResolvedValue(mockEnrollments);

      // Act
      const result = await sportsEnrollmentRepository.getEnrollmentStats(sportId);

      // Assert
      expect(result).toEqual({
        total: 15,
        active: 10,
        withdrawn: 3,
        completed: 2,
        averageAttendance: 75 // (80 + 70) / 2
      });
    });

    it('should handle zero enrollments with sessions', async () => {
      // Arrange
      const sportId = 1;

      const mockEnrollments = [
        {
          enrollmentId: 1,
          totalSessions: 0,
          getAttendancePercentage: jest.fn().mockReturnValue(0)
        }
      ];

      (SportsEnrollment.count as jest.Mock)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      (SportsEnrollment.findAll as jest.Mock).mockResolvedValue(mockEnrollments);

      // Act
      const result = await sportsEnrollmentRepository.getEnrollmentStats(sportId);

      // Assert
      expect(result.averageAttendance).toBe(0);
    });
  });

  describe('getStudentParticipationSummary', () => {
    it('should return student participation summary with sports details', async () => {
      // Arrange
      const studentId = 100;

      const mockEnrollments = [
        {
          enrollmentId: 1,
          sportId: 1,
          studentId: 100,
          teamId: 5,
          status: 'active',
          totalSessions: 10,
          getAttendancePercentage: jest.fn().mockReturnValue(80),
          sport: { sportId: 1, name: 'Football' },
          team: { teamId: 5, name: 'Team A' }
        },
        {
          enrollmentId: 2,
          sportId: 2,
          studentId: 100,
          teamId: null,
          status: 'active',
          totalSessions: 8,
          getAttendancePercentage: jest.fn().mockReturnValue(75),
          sport: { sportId: 2, name: 'Basketball' },
          team: null
        },
        {
          enrollmentId: 3,
          sportId: 3,
          studentId: 100,
          teamId: null,
          status: 'completed',
          totalSessions: 12,
          getAttendancePercentage: jest.fn().mockReturnValue(90),
          sport: { sportId: 3, name: 'Cricket' },
          team: null
        }
      ];

      (SportsEnrollment.findAll as jest.Mock).mockResolvedValue(mockEnrollments);

      // Act
      const result = await sportsEnrollmentRepository.getStudentParticipationSummary(studentId);

      // Assert
      expect(SportsEnrollment.findAll).toHaveBeenCalledWith({
        where: { studentId: 100 },
        include: expect.arrayContaining([
          expect.objectContaining({ model: Sport, as: 'sport' }),
          expect.objectContaining({ model: Team, as: 'team' })
        ])
      });

      expect(result).toEqual({
        totalEnrollments: 3,
        activeEnrollments: 2,
        completedEnrollments: 1,
        averageAttendance: 81.67, // (80 + 75 + 90) / 3
        sports: [
          {
            sportId: 1,
            sportName: 'Football',
            teamId: 5,
            teamName: 'Team A',
            status: 'active',
            attendancePercentage: 80
          },
          {
            sportId: 2,
            sportName: 'Basketball',
            teamId: null,
            teamName: undefined,
            status: 'active',
            attendancePercentage: 75
          },
          {
            sportId: 3,
            sportName: 'Cricket',
            teamId: null,
            teamName: undefined,
            status: 'completed',
            attendancePercentage: 90
          }
        ]
      });
    });
  });
});
