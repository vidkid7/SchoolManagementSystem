/**
 * Sports Achievement Repository
 * Database operations for sports achievements
 * 
 * Requirements: 12.7, 12.8, 12.9
 */

import SportsAchievement, { SportsAchievementCreationAttributes } from '@models/SportsAchievement.model';
import Sport from '@models/Sport.model';
import Tournament from '@models/Tournament.model';
import Team from '@models/Team.model';
import { Op } from 'sequelize';
import { logger } from '@utils/logger';

export interface AchievementFilters {
  studentId?: number;
  sportId?: number;
  teamId?: number;
  tournamentId?: number;
  type?: string;
  level?: string;
  medal?: string;
  academicYearId?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface SchoolRecord {
  sportId: number;
  sportName: string;
  recordType: string;
  recordValue: string;
  studentId: number;
  studentName: string;
  achievementDate: Date;
  achievementDateBS?: string;
}

class SportsAchievementRepository {
  /**
   * Create a new sports achievement
   * Requirements: 12.7
   * 
   * @param achievementData - Achievement data
   * @returns Created achievement
   */
  async create(achievementData: SportsAchievementCreationAttributes): Promise<SportsAchievement> {
    try {
      const achievement = await SportsAchievement.create(achievementData);
      
      logger.info('Sports achievement created', {
        achievementId: achievement.achievementId,
        studentId: achievement.studentId,
        type: achievement.type,
        level: achievement.level
      });

      return achievement;
    } catch (error) {
      logger.error('Error creating sports achievement', { error, achievementData });
      throw error;
    }
  }

  /**
   * Find achievement by ID
   * 
   * @param achievementId - Achievement ID
   * @returns Achievement or null
   */
  async findById(achievementId: number): Promise<SportsAchievement | null> {
    try {
      return await SportsAchievement.findByPk(achievementId, {
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
    } catch (error) {
      logger.error('Error finding achievement by ID', { error, achievementId });
      throw error;
    }
  }

  /**
   * Find all achievements with filters
   * Requirements: 12.7, 12.9
   * 
   * @param filters - Filter criteria
   * @returns Array of achievements
   */
  async findAll(filters: AchievementFilters = {}): Promise<SportsAchievement[]> {
    try {
      const where: any = {};

      if (filters.studentId) where.studentId = filters.studentId;
      if (filters.sportId) where.sportId = filters.sportId;
      if (filters.teamId) where.teamId = filters.teamId;
      if (filters.tournamentId) where.tournamentId = filters.tournamentId;
      if (filters.type) where.type = filters.type;
      if (filters.level) where.level = filters.level;
      if (filters.medal) where.medal = filters.medal;

      if (filters.startDate || filters.endDate) {
        where.achievementDate = {};
        if (filters.startDate) where.achievementDate[Op.gte] = filters.startDate;
        if (filters.endDate) where.achievementDate[Op.lte] = filters.endDate;
      }

      return await SportsAchievement.findAll({
        where,
        include: [
          {
            model: Sport,
            as: 'sport',
            attributes: ['sportId', 'name', 'nameNp', 'category']
          },
          {
            model: Tournament,
            as: 'tournament',
            attributes: ['tournamentId', 'name', 'nameNp', 'type']
          },
          {
            model: Team,
            as: 'team',
            attributes: ['teamId', 'name', 'nameNp']
          }
        ],
        order: [['achievementDate', 'DESC']]
      });
    } catch (error) {
      logger.error('Error finding achievements', { error, filters });
      throw error;
    }
  }

  /**
   * Find achievements by student ID
   * Requirements: 12.11
   * 
   * @param studentId - Student ID
   * @returns Array of student achievements
   */
  async findByStudentId(studentId: number): Promise<SportsAchievement[]> {
    return this.findAll({ studentId });
  }

  /**
   * Find achievements by sport ID
   * 
   * @param sportId - Sport ID
   * @returns Array of sport achievements
   */
  async findBySportId(sportId: number): Promise<SportsAchievement[]> {
    return this.findAll({ sportId });
  }

  /**
   * Find achievements by tournament ID
   * 
   * @param tournamentId - Tournament ID
   * @returns Array of tournament achievements
   */
  async findByTournamentId(tournamentId: number): Promise<SportsAchievement[]> {
    return this.findAll({ tournamentId });
  }

  /**
   * Get school records (best performances)
   * Requirements: 12.9
   * 
   * @param sportId - Optional sport ID to filter
   * @returns Array of school records
   */
  async getSchoolRecords(sportId?: number): Promise<SchoolRecord[]> {
    try {
      const where: any = {
        type: 'record',
        recordType: { [Op.ne]: null },
        recordValue: { [Op.ne]: null }
      };

      if (sportId) {
        where.sportId = sportId;
      }

      const records = await SportsAchievement.findAll({
        where,
        include: [
          {
            model: Sport,
            as: 'sport',
            attributes: ['sportId', 'name', 'nameNp']
          }
        ],
        order: [['achievementDate', 'DESC']]
      });

      // Format as school records
      return records.map(record => {
        const sport = (record as any).sport;
        return {
          sportId: record.sportId,
          sportName: sport?.name || 'Unknown',
          recordType: record.recordType!,
          recordValue: record.recordValue!,
          studentId: record.studentId,
          studentName: '', // Will be populated by service layer
          achievementDate: record.achievementDate,
          achievementDateBS: record.achievementDateBS
        };
      });
    } catch (error) {
      logger.error('Error getting school records', { error, sportId });
      throw error;
    }
  }

  /**
   * Get medal count by student
   * 
   * @param studentId - Student ID
   * @returns Medal counts by type
   */
  async getMedalCountByStudent(studentId: number): Promise<{
    gold: number;
    silver: number;
    bronze: number;
    total: number;
  }> {
    try {
      const achievements = await SportsAchievement.findAll({
        where: {
          studentId,
          type: 'medal',
          medal: { [Op.not]: null } as any
        }
      });

      const counts = {
        gold: 0,
        silver: 0,
        bronze: 0,
        total: 0
      };

      achievements.forEach(achievement => {
        if (achievement.medal === 'gold') counts.gold++;
        else if (achievement.medal === 'silver') counts.silver++;
        else if (achievement.medal === 'bronze') counts.bronze++;
        counts.total++;
      });

      return counts;
    } catch (error) {
      logger.error('Error getting medal count', { error, studentId });
      throw error;
    }
  }

  /**
   * Get achievement statistics by sport
   * 
   * @param sportId - Sport ID
   * @returns Achievement statistics
   */
  async getAchievementStatsBySport(sportId: number): Promise<{
    totalAchievements: number;
    byType: Record<string, number>;
    byLevel: Record<string, number>;
    medalCount: { gold: number; silver: number; bronze: number };
    recordCount: number;
  }> {
    try {
      const achievements = await SportsAchievement.findAll({
        where: { sportId }
      });

      const stats = {
        totalAchievements: achievements.length,
        byType: {} as Record<string, number>,
        byLevel: {} as Record<string, number>,
        medalCount: { gold: 0, silver: 0, bronze: 0 },
        recordCount: 0
      };

      achievements.forEach(achievement => {
        // Count by type
        stats.byType[achievement.type] = (stats.byType[achievement.type] || 0) + 1;

        // Count by level
        stats.byLevel[achievement.level] = (stats.byLevel[achievement.level] || 0) + 1;

        // Count medals
        if (achievement.type === 'medal' && achievement.medal) {
          stats.medalCount[achievement.medal]++;
        }

        // Count records
        if (achievement.type === 'record') {
          stats.recordCount++;
        }
      });

      return stats;
    } catch (error) {
      logger.error('Error getting achievement stats', { error, sportId });
      throw error;
    }
  }

  /**
   * Update achievement
   * 
   * @param achievementId - Achievement ID
   * @param updates - Fields to update
   * @returns Updated achievement
   */
  async update(
    achievementId: number,
    updates: Partial<SportsAchievementCreationAttributes>
  ): Promise<SportsAchievement> {
    try {
      const achievement = await SportsAchievement.findByPk(achievementId);

      if (!achievement) {
        throw new Error(`Achievement with ID ${achievementId} not found`);
      }

      await achievement.update(updates);

      logger.info('Sports achievement updated', {
        achievementId,
        updates
      });

      return achievement;
    } catch (error) {
      logger.error('Error updating achievement', { error, achievementId, updates });
      throw error;
    }
  }

  /**
   * Delete achievement
   * 
   * @param achievementId - Achievement ID
   * @returns True if deleted
   */
  async delete(achievementId: number): Promise<boolean> {
    try {
      const achievement = await SportsAchievement.findByPk(achievementId);

      if (!achievement) {
        throw new Error(`Achievement with ID ${achievementId} not found`);
      }

      await achievement.destroy();

      logger.info('Sports achievement deleted', { achievementId });

      return true;
    } catch (error) {
      logger.error('Error deleting achievement', { error, achievementId });
      throw error;
    }
  }

  /**
   * Count achievements by filters
   * 
   * @param filters - Filter criteria
   * @returns Count of achievements
   */
  async count(filters: AchievementFilters = {}): Promise<number> {
    try {
      const where: any = {};

      if (filters.studentId) where.studentId = filters.studentId;
      if (filters.sportId) where.sportId = filters.sportId;
      if (filters.type) where.type = filters.type;
      if (filters.level) where.level = filters.level;

      return await SportsAchievement.count({ where });
    } catch (error) {
      logger.error('Error counting achievements', { error, filters });
      throw error;
    }
  }
}

export default new SportsAchievementRepository();
