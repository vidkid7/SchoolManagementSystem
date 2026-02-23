/**
 * Sports Achievement Repository Tests
 * 
 * Tests database operations for sports achievements
 * 
 * Requirements: 12.7, 12.8, 12.9
 */

import sportsAchievementRepository from '../sportsAchievement.repository';
import SportsAchievement from '@models/SportsAchievement.model';
import Sport from '@models/Sport.model';
import Tournament from '@models/Tournament.model';
import Team from '@models/Team.model';

// Mock the models
jest.mock('@models/SportsAchievement.model');
jest.mock('@models/Sport.model');
jest.mock('@models/Tournament.model');
jest.mock('@models/Team.model');
jest.mock('@utils/logger');

describe('SportsAchievementRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new sports achievement', async () => {
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

      (SportsAchievement.create as jest.Mock).mockResolvedValue(mockAchievement);

      const result = await sportsAchievementRepository.create(achievementData);

      expect(SportsAchievement.create).toHaveBeenCalledWith(achievementData);
      expect(result).toEqual(mockAchievement);
    });

    it('should handle creation errors', async () => {
      const achievementData = {
        sportId: 1,
        studentId: 100,
        title: 'Test Achievement',
        type: 'medal' as const,
        level: 'school' as const,
        achievementDate: new Date()
      };

      (SportsAchievement.create as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        sportsAchievementRepository.create(achievementData)
      ).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should find achievement by ID with associations', async () => {
      const mockAchievement = {
        achievementId: 1,
        sportId: 1,
        studentId: 100,
        title: 'Test Achievement',
        type: 'medal',
        level: 'district',
        medal: 'gold'
      };

      (SportsAchievement.findByPk as jest.Mock).mockResolvedValue(mockAchievement);

      const result = await sportsAchievementRepository.findById(1);

      expect(SportsAchievement.findByPk).toHaveBeenCalledWith(1, {
        include: [
          {
            model: Sport,
            as: 'sport',
            attributes: ['sportId', 'name', 'nameNp', 'category']
          },
          {
            model: Tournament,
            as: 'tournament',
            attributes: ['tournamentId', 'name', 'nameNp', 'type', 'startDate', 'endDate']
          },
          {
            model: Team,
            as: 'team',
            attributes: ['teamId', 'name', 'nameNp']
          }
        ]
      });
      expect(result).toEqual(mockAchievement);
    });

    it('should return null if achievement not found', async () => {
      (SportsAchievement.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await sportsAchievementRepository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all achievements without filters', async () => {
      const mockAchievements = [
        { achievementId: 1, title: 'Achievement 1' },
        { achievementId: 2, title: 'Achievement 2' }
      ];

      (SportsAchievement.findAll as jest.Mock).mockResolvedValue(mockAchievements);

      const result = await sportsAchievementRepository.findAll();

      expect(SportsAchievement.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockAchievements);
    });

    it('should find achievements with student filter', async () => {
      const mockAchievements = [
        { achievementId: 1, studentId: 100, title: 'Achievement 1' }
      ];

      (SportsAchievement.findAll as jest.Mock).mockResolvedValue(mockAchievements);

      const result = await sportsAchievementRepository.findAll({ studentId: 100 });

      expect(SportsAchievement.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ studentId: 100 })
        })
      );
      expect(result).toEqual(mockAchievements);
    });

    it('should find achievements with multiple filters', async () => {
      const mockAchievements = [
        {
          achievementId: 1,
          studentId: 100,
          sportId: 1,
          type: 'medal',
          level: 'district'
        }
      ];

      (SportsAchievement.findAll as jest.Mock).mockResolvedValue(mockAchievements);

      const result = await sportsAchievementRepository.findAll({
        studentId: 100,
        sportId: 1,
        type: 'medal',
        level: 'district'
      });

      expect(SportsAchievement.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            studentId: 100,
            sportId: 1,
            type: 'medal',
            level: 'district'
          })
        })
      );
      expect(result).toEqual(mockAchievements);
    });

    it('should find achievements with date range filter', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const mockAchievements = [
        { achievementId: 1, achievementDate: new Date('2024-06-15') }
      ];

      (SportsAchievement.findAll as jest.Mock).mockResolvedValue(mockAchievements);

      const result = await sportsAchievementRepository.findAll({
        startDate,
        endDate
      });

      expect(SportsAchievement.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            achievementDate: expect.any(Object)
          })
        })
      );
      expect(result).toEqual(mockAchievements);
    });
  });

  describe('findByStudentId', () => {
    it('should find all achievements for a student', async () => {
      const mockAchievements = [
        { achievementId: 1, studentId: 100, title: 'Achievement 1' },
        { achievementId: 2, studentId: 100, title: 'Achievement 2' }
      ];

      (SportsAchievement.findAll as jest.Mock).mockResolvedValue(mockAchievements);

      const result = await sportsAchievementRepository.findByStudentId(100);

      expect(result).toEqual(mockAchievements);
      expect(result).toHaveLength(2);
    });
  });

  describe('getSchoolRecords', () => {
    it('should get all school records', async () => {
      const mockRecords = [
        {
          achievementId: 1,
          sportId: 1,
          studentId: 100,
          type: 'record',
          recordType: '100m Sprint',
          recordValue: '10.5s',
          achievementDate: new Date('2024-01-15'),
          sport: { sportId: 1, name: 'Athletics' }
        }
      ];

      (SportsAchievement.findAll as jest.Mock).mockResolvedValue(mockRecords);

      const result = await sportsAchievementRepository.getSchoolRecords();

      expect(SportsAchievement.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'record'
          })
        })
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        sportId: 1,
        sportName: 'Athletics',
        recordType: '100m Sprint',
        recordValue: '10.5s'
      });
    });

    it('should get school records filtered by sport', async () => {
      const mockRecords = [
        {
          achievementId: 1,
          sportId: 1,
          type: 'record',
          recordType: '100m Sprint',
          recordValue: '10.5s',
          sport: { sportId: 1, name: 'Athletics' }
        }
      ];

      (SportsAchievement.findAll as jest.Mock).mockResolvedValue(mockRecords);

      const result = await sportsAchievementRepository.getSchoolRecords(1);

      expect(SportsAchievement.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'record',
            sportId: 1
          })
        })
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('getMedalCountByStudent', () => {
    it('should count medals by type for a student', async () => {
      const mockAchievements = [
        { medal: 'gold' },
        { medal: 'gold' },
        { medal: 'silver' },
        { medal: 'bronze' }
      ];

      (SportsAchievement.findAll as jest.Mock).mockResolvedValue(mockAchievements);

      const result = await sportsAchievementRepository.getMedalCountByStudent(100);

      expect(result).toEqual({
        gold: 2,
        silver: 1,
        bronze: 1,
        total: 4
      });
    });

    it('should return zero counts if no medals', async () => {
      (SportsAchievement.findAll as jest.Mock).mockResolvedValue([]);

      const result = await sportsAchievementRepository.getMedalCountByStudent(100);

      expect(result).toEqual({
        gold: 0,
        silver: 0,
        bronze: 0,
        total: 0
      });
    });
  });

  describe('getAchievementStatsBySport', () => {
    it('should calculate achievement statistics for a sport', async () => {
      const mockAchievements = [
        { type: 'medal', level: 'district', medal: 'gold' },
        { type: 'medal', level: 'national', medal: 'silver' },
        { type: 'record', level: 'school' },
        { type: 'trophy', level: 'district' }
      ];

      (SportsAchievement.findAll as jest.Mock).mockResolvedValue(mockAchievements);

      const result = await sportsAchievementRepository.getAchievementStatsBySport(1);

      expect(result).toEqual({
        totalAchievements: 4,
        byType: {
          medal: 2,
          record: 1,
          trophy: 1
        },
        byLevel: {
          district: 2,
          national: 1,
          school: 1
        },
        medalCount: {
          gold: 1,
          silver: 1,
          bronze: 0
        },
        recordCount: 1
      });
    });
  });

  describe('update', () => {
    it('should update an achievement', async () => {
      const mockAchievement = {
        achievementId: 1,
        title: 'Old Title',
        update: jest.fn().mockResolvedValue(true)
      };

      (SportsAchievement.findByPk as jest.Mock).mockResolvedValue(mockAchievement);

      const updates = { title: 'New Title', description: 'Updated description' };
      const result = await sportsAchievementRepository.update(1, updates);

      expect(mockAchievement.update).toHaveBeenCalledWith(updates);
      expect(result).toEqual(mockAchievement);
    });

    it('should throw error if achievement not found', async () => {
      (SportsAchievement.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(
        sportsAchievementRepository.update(999, { title: 'New Title' })
      ).rejects.toThrow('Achievement with ID 999 not found');
    });
  });

  describe('delete', () => {
    it('should delete an achievement', async () => {
      const mockAchievement = {
        achievementId: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };

      (SportsAchievement.findByPk as jest.Mock).mockResolvedValue(mockAchievement);

      const result = await sportsAchievementRepository.delete(1);

      expect(mockAchievement.destroy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should throw error if achievement not found', async () => {
      (SportsAchievement.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(
        sportsAchievementRepository.delete(999)
      ).rejects.toThrow('Achievement with ID 999 not found');
    });
  });

  describe('count', () => {
    it('should count achievements without filters', async () => {
      (SportsAchievement.count as jest.Mock).mockResolvedValue(10);

      const result = await sportsAchievementRepository.count();

      expect(SportsAchievement.count).toHaveBeenCalledWith({ where: {} });
      expect(result).toBe(10);
    });

    it('should count achievements with filters', async () => {
      (SportsAchievement.count as jest.Mock).mockResolvedValue(5);

      const result = await sportsAchievementRepository.count({
        studentId: 100,
        type: 'medal'
      });

      expect(SportsAchievement.count).toHaveBeenCalledWith({
        where: { studentId: 100, type: 'medal' }
      });
      expect(result).toBe(5);
    });
  });
});
