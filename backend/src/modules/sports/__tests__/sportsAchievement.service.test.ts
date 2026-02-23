/**
 * Sports Achievement Service Tests
 * 
 * Tests business logic for sports achievement tracking
 * 
 * Requirements: 12.7, 12.8, 12.9, 12.10, 12.11
 */

import sportsAchievementService from '../sportsAchievement.service';
import sportsAchievementRepository from '../sportsAchievement.repository';
import SportsEnrollment from '@models/SportsEnrollment.model';
import Tournament from '@models/Tournament.model';

// Mock dependencies
jest.mock('../sportsAchievement.repository');
jest.mock('@models/SportsEnrollment.model');
jest.mock('@models/Tournament.model');
jest.mock('@utils/logger');

describe('SportsAchievementService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recordAchievement', () => {
    it('should record a medal achievement', async () => {
      const achievementData = {
        sportId: 1,
        studentId: 100,
        title: '100m Sprint Champion',
        type: 'medal' as const,
        level: 'district' as const,
        medal: 'gold' as const,
        achievementDate: new Date('2024-01-15')
      };

      const mockAchievement = {
        achievementId: 1,
        ...achievementData
      };

      (sportsAchievementRepository.create as jest.Mock).mockResolvedValue(mockAchievement);

      const result = await sportsAchievementService.recordAchievement(achievementData);

      expect(sportsAchievementRepository.create).toHaveBeenCalledWith(achievementData);
      expect(result).toEqual(mockAchievement);
    });

    it('should record a record achievement', async () => {
      const achievementData = {
        sportId: 1,
        studentId: 100,
        title: 'School Record - 100m Sprint',
        type: 'record' as const,
        level: 'school' as const,
        recordType: '100m Sprint',
        recordValue: '10.5s',
        achievementDate: new Date('2024-01-15')
      };

      const mockAchievement = {
        achievementId: 1,
        ...achievementData
      };

      (sportsAchievementRepository.create as jest.Mock).mockResolvedValue(mockAchievement);

      const result = await sportsAchievementService.recordAchievement(achievementData);

      expect(result).toEqual(mockAchievement);
    });

    it('should throw error for medal achievement without medal type', async () => {
      const achievementData = {
        sportId: 1,
        studentId: 100,
        title: 'Test Medal',
        type: 'medal' as const,
        level: 'school' as const,
        achievementDate: new Date()
      };

      await expect(
        sportsAchievementService.recordAchievement(achievementData)
      ).rejects.toThrow('Medal achievements must specify medal type');
    });

    it('should throw error for record achievement without record details', async () => {
      const achievementData = {
        sportId: 1,
        studentId: 100,
        title: 'Test Record',
        type: 'record' as const,
        level: 'school' as const,
        achievementDate: new Date()
      };

      await expect(
        sportsAchievementService.recordAchievement(achievementData)
      ).rejects.toThrow('Record achievements must specify recordType and recordValue');
    });

    it('should throw error for rank achievement without position', async () => {
      const achievementData = {
        sportId: 1,
        studentId: 100,
        title: 'Test Rank',
        type: 'rank' as const,
        level: 'school' as const,
        achievementDate: new Date()
      };

      await expect(
        sportsAchievementService.recordAchievement(achievementData)
      ).rejects.toThrow('Rank achievements must specify position');
    });
  });

  describe('getAchievementById', () => {
    it('should get achievement by ID', async () => {
      const mockAchievement = {
        achievementId: 1,
        title: 'Test Achievement'
      };

      (sportsAchievementRepository.findById as jest.Mock).mockResolvedValue(mockAchievement);

      const result = await sportsAchievementService.getAchievementById(1);

      expect(sportsAchievementRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockAchievement);
    });
  });

  describe('getStudentAchievements', () => {
    it('should get all achievements for a student', async () => {
      const mockAchievements = [
        { achievementId: 1, studentId: 100, title: 'Achievement 1' },
        { achievementId: 2, studentId: 100, title: 'Achievement 2' }
      ];

      (sportsAchievementRepository.findByStudentId as jest.Mock).mockResolvedValue(
        mockAchievements
      );

      const result = await sportsAchievementService.getStudentAchievements(100);

      expect(sportsAchievementRepository.findByStudentId).toHaveBeenCalledWith(100);
      expect(result).toEqual(mockAchievements);
    });
  });

  describe('getSchoolRecords', () => {
    it('should get all school records', async () => {
      const mockRecords = [
        {
          sportId: 1,
          sportName: 'Athletics',
          recordType: '100m Sprint',
          recordValue: '10.5s',
          studentId: 100,
          studentName: '',
          achievementDate: new Date('2024-01-15')
        }
      ];

      (sportsAchievementRepository.getSchoolRecords as jest.Mock).mockResolvedValue(
        mockRecords
      );

      const result = await sportsAchievementService.getSchoolRecords();

      expect(sportsAchievementRepository.getSchoolRecords).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockRecords);
    });

    it('should get school records filtered by sport', async () => {
      const mockRecords = [
        {
          sportId: 1,
          sportName: 'Athletics',
          recordType: '100m Sprint',
          recordValue: '10.5s',
          studentId: 100,
          studentName: '',
          achievementDate: new Date('2024-01-15')
        }
      ];

      (sportsAchievementRepository.getSchoolRecords as jest.Mock).mockResolvedValue(
        mockRecords
      );

      const result = await sportsAchievementService.getSchoolRecords(1);

      expect(sportsAchievementRepository.getSchoolRecords).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockRecords);
    });
  });

  describe('generateParticipationCertificateData', () => {
    it('should generate participation certificate data', async () => {
      const mockEnrollment = {
        enrollmentId: 1,
        studentId: 100,
        sportId: 1,
        enrollmentDate: new Date('2024-01-01'),
        status: 'completed',
        totalSessions: 20,
        attendedSessions: 18,
        updatedAt: new Date('2024-06-01'),
        remarks: 'Excellent participation',
        getAttendancePercentage: jest.fn().mockReturnValue(90),
        sport: {
          sportId: 1,
          name: 'Football',
          category: 'team',
          academicYearId: 1
        }
      };

      (SportsEnrollment.findByPk as jest.Mock).mockResolvedValue(mockEnrollment);

      const result = await sportsAchievementService.generateParticipationCertificateData(
        1,
        'John Doe'
      );

      expect(result).toMatchObject({
        studentId: 100,
        studentName: 'John Doe',
        sportId: 1,
        sportName: 'Football',
        sportCategory: 'Team Sport',
        attendancePercentage: 90,
        totalSessions: 20
      });
    });

    it('should throw error if enrollment not found', async () => {
      (SportsEnrollment.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(
        sportsAchievementService.generateParticipationCertificateData(999, 'John Doe')
      ).rejects.toThrow('Enrollment with ID 999 not found');
    });

    it('should throw error for withdrawn enrollment', async () => {
      const mockEnrollment = {
        enrollmentId: 1,
        status: 'withdrawn',
        sport: { sportId: 1, name: 'Football' }
      };

      (SportsEnrollment.findByPk as jest.Mock).mockResolvedValue(mockEnrollment);

      await expect(
        sportsAchievementService.generateParticipationCertificateData(1, 'John Doe')
      ).rejects.toThrow('Cannot generate certificate for withdrawn enrollment');
    });
  });

  describe('generateAchievementCertificateData', () => {
    it('should generate achievement certificate data', async () => {
      const mockAchievement = {
        achievementId: 1,
        studentId: 100,
        sportId: 1,
        title: '100m Sprint Champion',
        type: 'medal',
        level: 'district',
        medal: 'gold',
        position: '1st',
        achievementDate: new Date('2024-01-15'),
        achievementDateBS: '2080-10-01',
        description: 'Won gold medal in district championship',
        sport: {
          sportId: 1,
          name: 'Athletics'
        },
        tournament: {
          tournamentId: 1,
          name: 'District Championship 2024'
        }
      };

      (sportsAchievementRepository.findById as jest.Mock).mockResolvedValue(mockAchievement);

      const result = await sportsAchievementService.generateAchievementCertificateData(
        1,
        'John Doe'
      );

      expect(result).toMatchObject({
        studentId: 100,
        studentName: 'John Doe',
        achievementId: 1,
        sportId: 1,
        sportName: 'Athletics',
        achievementTitle: '100m Sprint Champion',
        achievementType: 'Medal',
        achievementLevel: 'District Level',
        medal: 'gold',
        tournamentName: 'District Championship 2024'
      });
    });

    it('should throw error if achievement not found', async () => {
      (sportsAchievementRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        sportsAchievementService.generateAchievementCertificateData(999, 'John Doe')
      ).rejects.toThrow('Achievement with ID 999 not found');
    });
  });

  describe('getStudentSportsForCV', () => {
    it('should generate student sports CV data', async () => {
      const mockEnrollments = [
        {
          enrollmentId: 1,
          studentId: 100,
          enrollmentDate: new Date('2024-01-01'),
          updatedAt: new Date('2024-06-01'),
          status: 'completed',
          getAttendancePercentage: jest.fn().mockReturnValue(90),
          sport: {
            name: 'Football',
            category: 'team'
          }
        }
      ];

      const mockAchievements = [
        {
          achievementId: 1,
          studentId: 100,
          title: 'Gold Medal',
          type: 'medal',
          level: 'national',
          medal: 'gold',
          achievementDate: new Date('2024-03-15'),
          isHighLevel: jest.fn().mockReturnValue(true),
          isRecord: jest.fn().mockReturnValue(false),
          getDisplayTitle: jest.fn().mockReturnValue('Gold Medal - 100m Sprint'),
          sport: {
            name: 'Athletics'
          }
        }
      ];

      (SportsEnrollment.findAll as jest.Mock).mockResolvedValue(mockEnrollments);
      (sportsAchievementRepository.findByStudentId as jest.Mock).mockResolvedValue(
        mockAchievements
      );
      (sportsAchievementRepository.getMedalCountByStudent as jest.Mock).mockResolvedValue({
        gold: 1,
        silver: 0,
        bronze: 0,
        total: 1
      });

      const result = await sportsAchievementService.getStudentSportsForCV(100);

      expect(result).toMatchObject({
        studentId: 100,
        summary: {
          totalSports: 1,
          totalAchievements: 1,
          highLevelAchievements: 1,
          medalCount: {
            gold: 1,
            silver: 0,
            bronze: 0,
            total: 1
          },
          recordsSet: 0,
          averageAttendance: 90
        }
      });
      expect(result.participations).toHaveLength(1);
      expect(result.achievements).toHaveLength(1);
    });

    it('should handle student with no sports participation', async () => {
      (SportsEnrollment.findAll as jest.Mock).mockResolvedValue([]);
      (sportsAchievementRepository.findByStudentId as jest.Mock).mockResolvedValue([]);
      (sportsAchievementRepository.getMedalCountByStudent as jest.Mock).mockResolvedValue({
        gold: 0,
        silver: 0,
        bronze: 0,
        total: 0
      });

      const result = await sportsAchievementService.getStudentSportsForCV(100);

      expect(result.summary).toMatchObject({
        totalSports: 0,
        totalAchievements: 0,
        highLevelAchievements: 0,
        recordsSet: 0,
        averageAttendance: 0
      });
    });
  });

  describe('isEligibleForParticipationCertificate', () => {
    it('should return eligible for valid enrollment', async () => {
      const mockEnrollment = {
        enrollmentId: 1,
        status: 'completed',
        totalSessions: 10,
        getAttendancePercentage: jest.fn().mockReturnValue(80)
      };

      (SportsEnrollment.findByPk as jest.Mock).mockResolvedValue(mockEnrollment);

      const result = await sportsAchievementService.isEligibleForParticipationCertificate(1);

      expect(result).toEqual({ eligible: true });
    });

    it('should return not eligible for withdrawn enrollment', async () => {
      const mockEnrollment = {
        enrollmentId: 1,
        status: 'withdrawn'
      };

      (SportsEnrollment.findByPk as jest.Mock).mockResolvedValue(mockEnrollment);

      const result = await sportsAchievementService.isEligibleForParticipationCertificate(1);

      expect(result).toEqual({
        eligible: false,
        message: 'Enrollment was withdrawn'
      });
    });

    it('should return not eligible for low attendance', async () => {
      const mockEnrollment = {
        enrollmentId: 1,
        status: 'active',
        totalSessions: 10,
        getAttendancePercentage: jest.fn().mockReturnValue(40)
      };

      (SportsEnrollment.findByPk as jest.Mock).mockResolvedValue(mockEnrollment);

      const result = await sportsAchievementService.isEligibleForParticipationCertificate(1);

      expect(result).toMatchObject({
        eligible: false,
        message: expect.stringContaining('Insufficient attendance')
      });
    });

    it('should return not eligible for insufficient sessions', async () => {
      const mockEnrollment = {
        enrollmentId: 1,
        status: 'active',
        totalSessions: 3,
        getAttendancePercentage: jest.fn().mockReturnValue(80)
      };

      (SportsEnrollment.findByPk as jest.Mock).mockResolvedValue(mockEnrollment);

      const result = await sportsAchievementService.isEligibleForParticipationCertificate(1);

      expect(result).toMatchObject({
        eligible: false,
        message: expect.stringContaining('Insufficient sessions')
      });
    });
  });

  describe('uploadTournamentPhoto', () => {
    it('should upload tournament photo', async () => {
      const mockTournament = {
        tournamentId: 1,
        photos: [],
        addPhoto: jest.fn(),
        save: jest.fn().mockResolvedValue(true)
      };

      (Tournament.findByPk as jest.Mock).mockResolvedValue(mockTournament);

      const result = await sportsAchievementService.uploadTournamentPhoto(
        1,
        'https://example.com/photo.jpg'
      );

      expect(mockTournament.addPhoto).toHaveBeenCalledWith('https://example.com/photo.jpg');
      expect(mockTournament.save).toHaveBeenCalled();
      expect(result).toEqual(mockTournament);
    });

    it('should throw error if tournament not found', async () => {
      (Tournament.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(
        sportsAchievementService.uploadTournamentPhoto(999, 'https://example.com/photo.jpg')
      ).rejects.toThrow('Tournament with ID 999 not found');
    });
  });

  describe('uploadTournamentVideo', () => {
    it('should upload tournament video', async () => {
      const mockTournament = {
        tournamentId: 1,
        videos: [],
        addVideo: jest.fn(),
        save: jest.fn().mockResolvedValue(true)
      };

      (Tournament.findByPk as jest.Mock).mockResolvedValue(mockTournament);

      const result = await sportsAchievementService.uploadTournamentVideo(
        1,
        'https://example.com/video.mp4'
      );

      expect(mockTournament.addVideo).toHaveBeenCalledWith('https://example.com/video.mp4');
      expect(mockTournament.save).toHaveBeenCalled();
      expect(result).toEqual(mockTournament);
    });

    it('should throw error if tournament not found', async () => {
      (Tournament.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(
        sportsAchievementService.uploadTournamentVideo(999, 'https://example.com/video.mp4')
      ).rejects.toThrow('Tournament with ID 999 not found');
    });
  });

  describe('updateAchievement', () => {
    it('should update achievement', async () => {
      const mockAchievement = {
        achievementId: 1,
        title: 'Old Title'
      };

      (sportsAchievementRepository.update as jest.Mock).mockResolvedValue(mockAchievement);

      const result = await sportsAchievementService.updateAchievement(1, {
        title: 'New Title'
      });

      expect(sportsAchievementRepository.update).toHaveBeenCalledWith(1, {
        title: 'New Title'
      });
      expect(result).toEqual(mockAchievement);
    });

    it('should validate updates when changing type', async () => {
      await expect(
        sportsAchievementService.updateAchievement(1, {
          type: 'medal' as const
          // Missing medal field
        })
      ).rejects.toThrow('Medal achievements must specify medal type');
    });
  });

  describe('deleteAchievement', () => {
    it('should delete achievement', async () => {
      (sportsAchievementRepository.delete as jest.Mock).mockResolvedValue(true);

      const result = await sportsAchievementService.deleteAchievement(1);

      expect(sportsAchievementRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });
  });

  describe('getSportAchievementStats', () => {
    it('should get achievement statistics for a sport', async () => {
      const mockStats = {
        totalAchievements: 10,
        byType: { medal: 5, record: 3, trophy: 2 },
        byLevel: { school: 4, district: 4, national: 2 },
        medalCount: { gold: 2, silver: 2, bronze: 1 },
        recordCount: 3
      };

      (sportsAchievementRepository.getAchievementStatsBySport as jest.Mock).mockResolvedValue(
        mockStats
      );

      const result = await sportsAchievementService.getSportAchievementStats(1);

      expect(sportsAchievementRepository.getAchievementStatsBySport).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockStats);
    });
  });
});
