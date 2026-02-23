/**
 * ECA Certificate Service Tests
 * 
 * Tests for ECA certificate generation functionality
 * 
 * Requirements: 11.8, 11.9
 */

import ecaCertificateService from '../ecaCertificate.service';
import ECAEnrollment from '@models/ECAEnrollment.model';
import ECAAchievement from '@models/ECAAchievement.model';

// Mock the models
jest.mock('@models/ECAEnrollment.model');
jest.mock('@models/ECAAchievement.model');
jest.mock('@models/ECA.model');

describe('ECACertificateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateParticipationCertificateData', () => {
    it('should generate participation certificate data for completed enrollment', async () => {
      // Arrange
      const mockEnrollment = {
        enrollmentId: 1,
        ecaId: 1,
        studentId: 100,
        enrollmentDate: new Date('2024-01-01'),
        status: 'completed',
        attendanceCount: 18,
        totalSessions: 20,
        updatedAt: new Date('2024-06-01'),
        remarks: 'Excellent participation',
        getAttendancePercentage: jest.fn().mockReturnValue(90),
        eca: {
          ecaId: 1,
          name: 'Debate Club',
          category: 'club',
          academicYearId: 1
        }
      };

      (ECAEnrollment.findByPk as jest.Mock).mockResolvedValue(mockEnrollment);

      // Act
      const result = await ecaCertificateService.generateParticipationCertificateData(
        1,
        'John Doe'
      );

      // Assert
      expect(result).toEqual({
        studentId: 100,
        studentName: 'John Doe',
        ecaId: 1,
        ecaName: 'Debate Club',
        ecaCategory: 'Club',
        enrollmentDate: mockEnrollment.enrollmentDate,
        completionDate: mockEnrollment.updatedAt,
        attendancePercentage: 90,
        totalSessions: 20,
        academicYear: 'Academic Year 1',
        remarks: 'Excellent participation'
      });

      expect(ECAEnrollment.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('should throw error for withdrawn enrollment', async () => {
      // Arrange
      const mockEnrollment = {
        enrollmentId: 1,
        status: 'withdrawn',
        eca: { ecaId: 1, name: 'Debate Club' }
      };

      (ECAEnrollment.findByPk as jest.Mock).mockResolvedValue(mockEnrollment);

      // Act & Assert
      await expect(
        ecaCertificateService.generateParticipationCertificateData(1, 'John Doe')
      ).rejects.toThrow('Cannot generate certificate for withdrawn enrollment');
    });

    it('should throw error if enrollment not found', async () => {
      // Arrange
      (ECAEnrollment.findByPk as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        ecaCertificateService.generateParticipationCertificateData(999, 'John Doe')
      ).rejects.toThrow('Enrollment with ID 999 not found');
    });

    it('should handle active enrollment without completion date', async () => {
      // Arrange
      const mockEnrollment = {
        enrollmentId: 1,
        ecaId: 1,
        studentId: 100,
        enrollmentDate: new Date('2024-01-01'),
        status: 'active',
        attendanceCount: 15,
        totalSessions: 18,
        updatedAt: new Date('2024-06-01'),
        getAttendancePercentage: jest.fn().mockReturnValue(83),
        eca: {
          ecaId: 1,
          name: 'Music Club',
          category: 'cultural',
          academicYearId: 1
        }
      };

      (ECAEnrollment.findByPk as jest.Mock).mockResolvedValue(mockEnrollment);

      // Act
      const result = await ecaCertificateService.generateParticipationCertificateData(
        1,
        'Jane Smith'
      );

      // Assert
      expect(result.completionDate).toBeUndefined();
      expect(result.ecaCategory).toBe('Cultural Activity');
    });
  });

  describe('generateAchievementCertificateData', () => {
    it('should generate achievement certificate data', async () => {
      // Arrange
      const mockAchievement = {
        achievementId: 1,
        ecaId: 1,
        studentId: 100,
        title: 'First Place',
        type: 'medal',
        level: 'national',
        position: '1st',
        achievementDate: new Date('2024-05-15'),
        achievementDateBS: '2081-02-01',
        description: 'Won national debate competition',
        eca: {
          ecaId: 1,
          name: 'Debate Club'
        }
      };

      (ECAAchievement.findByPk as jest.Mock).mockResolvedValue(mockAchievement);

      // Act
      const result = await ecaCertificateService.generateAchievementCertificateData(
        1,
        'John Doe'
      );

      // Assert
      expect(result).toEqual({
        studentId: 100,
        studentName: 'John Doe',
        achievementId: 1,
        ecaId: 1,
        ecaName: 'Debate Club',
        achievementTitle: 'First Place',
        achievementType: 'Medal',
        achievementLevel: 'National Level',
        position: '1st',
        achievementDate: mockAchievement.achievementDate,
        achievementDateBS: '2081-02-01',
        description: 'Won national debate competition'
      });

      expect(ECAAchievement.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('should throw error if achievement not found', async () => {
      // Arrange
      (ECAAchievement.findByPk as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        ecaCertificateService.generateAchievementCertificateData(999, 'John Doe')
      ).rejects.toThrow('Achievement with ID 999 not found');
    });

    it('should handle achievement without position', async () => {
      // Arrange
      const mockAchievement = {
        achievementId: 2,
        ecaId: 2,
        studentId: 101,
        title: 'Participation Award',
        type: 'certificate',
        level: 'school',
        position: undefined,
        achievementDate: new Date('2024-03-20'),
        eca: {
          ecaId: 2,
          name: 'Art Club'
        }
      };

      (ECAAchievement.findByPk as jest.Mock).mockResolvedValue(mockAchievement);

      // Act
      const result = await ecaCertificateService.generateAchievementCertificateData(
        2,
        'Jane Smith'
      );

      // Assert
      expect(result.position).toBeUndefined();
      expect(result.achievementType).toBe('Certificate');
      expect(result.achievementLevel).toBe('School Level');
    });
  });

  describe('getStudentParticipationCertificates', () => {
    it('should get all participation certificates for a student', async () => {
      // Arrange
      const mockEnrollments = [
        {
          enrollmentId: 1,
          ecaId: 1,
          studentId: 100,
          enrollmentDate: new Date('2024-01-01'),
          status: 'completed',
          attendanceCount: 18,
          totalSessions: 20,
          updatedAt: new Date('2024-06-01'),
          getAttendancePercentage: jest.fn().mockReturnValue(90),
          eca: {
            ecaId: 1,
            name: 'Debate Club',
            category: 'club',
            academicYearId: 1
          }
        },
        {
          enrollmentId: 2,
          ecaId: 2,
          studentId: 100,
          enrollmentDate: new Date('2024-02-01'),
          status: 'completed',
          attendanceCount: 15,
          totalSessions: 16,
          updatedAt: new Date('2024-06-15'),
          getAttendancePercentage: jest.fn().mockReturnValue(94),
          eca: {
            ecaId: 2,
            name: 'Music Club',
            category: 'cultural',
            academicYearId: 1
          }
        }
      ];

      (ECAEnrollment.findAll as jest.Mock).mockResolvedValue(mockEnrollments);
      (ECAEnrollment.findByPk as jest.Mock)
        .mockResolvedValueOnce(mockEnrollments[0])
        .mockResolvedValueOnce(mockEnrollments[1]);

      // Act
      const result = await ecaCertificateService.getStudentParticipationCertificates(
        100,
        'John Doe'
      );

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].ecaName).toBe('Debate Club');
      expect(result[1].ecaName).toBe('Music Club');
      expect(ECAEnrollment.findAll).toHaveBeenCalledWith({
        where: { studentId: 100, status: 'completed' },
        include: expect.any(Array)
      });
    });

    it('should return empty array if no completed enrollments', async () => {
      // Arrange
      (ECAEnrollment.findAll as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await ecaCertificateService.getStudentParticipationCertificates(
        100,
        'John Doe'
      );

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getStudentAchievementCertificates', () => {
    it('should get all achievement certificates for a student', async () => {
      // Arrange
      const mockAchievements = [
        {
          achievementId: 1,
          ecaId: 1,
          studentId: 100,
          title: 'First Place',
          type: 'medal',
          level: 'national',
          position: '1st',
          achievementDate: new Date('2024-05-15'),
          eca: { ecaId: 1, name: 'Debate Club' }
        },
        {
          achievementId: 2,
          ecaId: 2,
          studentId: 100,
          title: 'Best Performer',
          type: 'award',
          level: 'school',
          achievementDate: new Date('2024-04-10'),
          eca: { ecaId: 2, name: 'Music Club' }
        }
      ];

      (ECAAchievement.findAll as jest.Mock).mockResolvedValue(mockAchievements);
      (ECAAchievement.findByPk as jest.Mock)
        .mockResolvedValueOnce(mockAchievements[0])
        .mockResolvedValueOnce(mockAchievements[1]);

      // Act
      const result = await ecaCertificateService.getStudentAchievementCertificates(
        100,
        'John Doe'
      );

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].achievementTitle).toBe('First Place');
      expect(result[1].achievementTitle).toBe('Best Performer');
    });
  });

  describe('getStudentECAForCV', () => {
    it('should aggregate ECA data for student CV', async () => {
      // Arrange
      const mockEnrollments = [
        {
          enrollmentId: 1,
          ecaId: 1,
          studentId: 100,
          enrollmentDate: new Date('2024-01-01'),
          status: 'completed',
          attendanceCount: 18,
          totalSessions: 20,
          updatedAt: new Date('2024-06-01'),
          getAttendancePercentage: jest.fn().mockReturnValue(90),
          eca: { name: 'Debate Club', category: 'club' }
        },
        {
          enrollmentId: 2,
          ecaId: 2,
          studentId: 100,
          enrollmentDate: new Date('2024-02-01'),
          status: 'active',
          attendanceCount: 12,
          totalSessions: 15,
          updatedAt: new Date('2024-06-15'),
          getAttendancePercentage: jest.fn().mockReturnValue(80),
          eca: { name: 'Music Club', category: 'cultural' }
        }
      ];

      const mockAchievements = [
        {
          achievementId: 1,
          studentId: 100,
          title: 'First Place',
          type: 'medal',
          level: 'national',
          position: '1st',
          achievementDate: new Date('2024-05-15'),
          isHighLevel: jest.fn().mockReturnValue(true),
          getDisplayTitle: jest.fn().mockReturnValue('First Place - 1st'),
          eca: { name: 'Debate Club' }
        }
      ];

      (ECAEnrollment.findAll as jest.Mock).mockResolvedValue(mockEnrollments);
      (ECAAchievement.findAll as jest.Mock).mockResolvedValue(mockAchievements);

      // Act
      const result = await ecaCertificateService.getStudentECAForCV(100);

      // Assert
      expect(result.studentId).toBe(100);
      expect(result.participations).toHaveLength(2);
      expect(result.achievements).toHaveLength(1);
      expect(result.summary).toEqual({
        totalECAs: 2,
        totalAchievements: 1,
        highLevelAchievements: 1,
        averageAttendance: 85 // (90 + 80) / 2
      });
    });

    it('should handle student with no ECA participation', async () => {
      // Arrange
      (ECAEnrollment.findAll as jest.Mock).mockResolvedValue([]);
      (ECAAchievement.findAll as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await ecaCertificateService.getStudentECAForCV(100);

      // Assert
      expect(result.participations).toEqual([]);
      expect(result.achievements).toEqual([]);
      expect(result.summary).toEqual({
        totalECAs: 0,
        totalAchievements: 0,
        highLevelAchievements: 0,
        averageAttendance: 0
      });
    });
  });

  describe('isEligibleForParticipationCertificate', () => {
    it('should return eligible for valid enrollment', async () => {
      // Arrange
      const mockEnrollment = {
        enrollmentId: 1,
        status: 'completed',
        attendanceCount: 15,
        totalSessions: 20,
        getAttendancePercentage: jest.fn().mockReturnValue(75)
      };

      (ECAEnrollment.findByPk as jest.Mock).mockResolvedValue(mockEnrollment);

      // Act
      const result = await ecaCertificateService.isEligibleForParticipationCertificate(1);

      // Assert
      expect(result.eligible).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should return not eligible for withdrawn enrollment', async () => {
      // Arrange
      const mockEnrollment = {
        enrollmentId: 1,
        status: 'withdrawn',
        getAttendancePercentage: jest.fn().mockReturnValue(80)
      };

      (ECAEnrollment.findByPk as jest.Mock).mockResolvedValue(mockEnrollment);

      // Act
      const result = await ecaCertificateService.isEligibleForParticipationCertificate(1);

      // Assert
      expect(result.eligible).toBe(false);
      expect(result.message).toBe('Enrollment was withdrawn');
    });

    it('should return not eligible for low attendance', async () => {
      // Arrange
      const mockEnrollment = {
        enrollmentId: 1,
        status: 'completed',
        attendanceCount: 8,
        totalSessions: 20,
        getAttendancePercentage: jest.fn().mockReturnValue(40)
      };

      (ECAEnrollment.findByPk as jest.Mock).mockResolvedValue(mockEnrollment);

      // Act
      const result = await ecaCertificateService.isEligibleForParticipationCertificate(1);

      // Assert
      expect(result.eligible).toBe(false);
      expect(result.message).toContain('Insufficient attendance (40%)');
    });

    it('should return not eligible for insufficient sessions', async () => {
      // Arrange
      const mockEnrollment = {
        enrollmentId: 1,
        status: 'completed',
        attendanceCount: 3,
        totalSessions: 4,
        getAttendancePercentage: jest.fn().mockReturnValue(75)
      };

      (ECAEnrollment.findByPk as jest.Mock).mockResolvedValue(mockEnrollment);

      // Act
      const result = await ecaCertificateService.isEligibleForParticipationCertificate(1);

      // Assert
      expect(result.eligible).toBe(false);
      expect(result.message).toContain('Insufficient sessions (4)');
    });
  });

  describe('getECACertificateStats', () => {
    it('should calculate certificate statistics for an ECA', async () => {
      // Arrange
      const mockEnrollments = [
        {
          enrollmentId: 1,
          ecaId: 1,
          attendanceCount: 18,
          totalSessions: 20,
          getAttendancePercentage: jest.fn().mockReturnValue(90)
        },
        {
          enrollmentId: 2,
          ecaId: 1,
          attendanceCount: 8,
          totalSessions: 20,
          getAttendancePercentage: jest.fn().mockReturnValue(40)
        }
      ];

      const mockAchievements = [
        { achievementId: 1, ecaId: 1, level: 'national' },
        { achievementId: 2, ecaId: 1, level: 'school' },
        { achievementId: 3, ecaId: 1, level: 'national' }
      ];

      (ECAEnrollment.findAll as jest.Mock).mockResolvedValue(mockEnrollments);
      (ECAAchievement.findAll as jest.Mock).mockResolvedValue(mockAchievements);

      // Mock eligibility checks
      (ECAEnrollment.findByPk as jest.Mock)
        .mockResolvedValueOnce({
          ...mockEnrollments[0],
          status: 'completed',
          totalSessions: 20
        })
        .mockResolvedValueOnce({
          ...mockEnrollments[1],
          status: 'completed',
          totalSessions: 20
        });

      // Act
      const result = await ecaCertificateService.getECACertificateStats(1);

      // Assert
      expect(result.totalParticipants).toBe(2);
      expect(result.totalAchievements).toBe(3);
      expect(result.achievementsByLevel).toEqual({
        national: 2,
        school: 1
      });
    });
  });
});
