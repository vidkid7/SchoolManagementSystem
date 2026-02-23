/**
 * Tournament Repository
 * Data access layer for tournament management
 * 
 * Features:
 * - CRUD operations for tournaments
 * - Match schedule management
 * - Match result recording
 * - Player statistics tracking
 * - Tournament filtering and search
 * 
 * Requirements: 12.5, 12.6
 */

import Tournament, { TournamentCreationAttributes, MatchResult } from '@models/Tournament.model';
import { Op } from 'sequelize';
import { logger } from '@utils/logger';
import { Request } from 'express';

interface TournamentFilters {
  sportId?: number;
  type?: 'inter_school' | 'intra_school' | 'district' | 'regional' | 'national';
  status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  startDateFrom?: Date;
  startDateTo?: Date;
  venue?: string;
}

class TournamentRepository {
  /**
   * Create a new tournament
   * Requirement 12.5: Create tournaments with date, venue, teams
   * 
   * @param data - Tournament data
   * @param userId - User ID creating the tournament
   * @param req - Express request object
   * @returns Created tournament
   */
  async create(
    data: TournamentCreationAttributes,
    userId?: number,
    req?: Request
  ): Promise<Tournament> {
    try {
      const tournament = await Tournament.create(data);

      logger.info('Tournament created', {
        tournamentId: tournament.tournamentId,
        name: tournament.name,
        sportId: tournament.sportId,
        userId,
        ip: req?.ip
      });

      return tournament;
    } catch (error) {
      logger.error('Error creating tournament', { error, data });
      throw error;
    }
  }

  /**
   * Find tournament by ID
   * 
   * @param tournamentId - Tournament ID
   * @returns Tournament or null
   */
  async findById(tournamentId: number): Promise<Tournament | null> {
    try {
      return await Tournament.findByPk(tournamentId);
    } catch (error) {
      logger.error('Error finding tournament by ID', { error, tournamentId });
      throw error;
    }
  }

  /**
   * Find tournaments by sport
   * 
   * @param sportId - Sport ID
   * @param status - Optional status filter
   * @returns Array of tournaments
   */
  async findBySport(
    sportId: number,
    status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
  ): Promise<Tournament[]> {
    try {
      const where: any = { sportId };
      if (status) {
        where.status = status;
      }

      return await Tournament.findAll({
        where,
        order: [['startDate', 'DESC']]
      });
    } catch (error) {
      logger.error('Error finding tournaments by sport', { error, sportId, status });
      throw error;
    }
  }

  /**
   * Find upcoming tournaments
   * 
   * @param limit - Maximum number of tournaments
   * @param sportId - Optional sport ID filter
   * @returns Array of upcoming tournaments
   */
  async findUpcoming(limit: number = 10, sportId?: number): Promise<Tournament[]> {
    try {
      const where: any = {
        startDate: { [Op.gte]: new Date() },
        status: { [Op.in]: ['scheduled', 'ongoing'] }
      };

      if (sportId) {
        where.sportId = sportId;
      }

      return await Tournament.findAll({
        where,
        order: [['startDate', 'ASC']],
        limit
      });
    } catch (error) {
      logger.error('Error finding upcoming tournaments', { error, limit, sportId });
      throw error;
    }
  }

  /**
   * Find tournaments by date range
   * 
   * @param startDate - Start date
   * @param endDate - End date
   * @param sportId - Optional sport ID filter
   * @returns Array of tournaments
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    sportId?: number
  ): Promise<Tournament[]> {
    try {
      const where: any = {
        startDate: { [Op.gte]: startDate },
        endDate: { [Op.lte]: endDate }
      };

      if (sportId) {
        where.sportId = sportId;
      }

      return await Tournament.findAll({
        where,
        order: [['startDate', 'ASC']]
      });
    } catch (error) {
      logger.error('Error finding tournaments by date range', {
        error,
        startDate,
        endDate,
        sportId
      });
      throw error;
    }
  }

  /**
   * Find tournaments by team
   * 
   * @param teamId - Team ID
   * @returns Array of tournaments
   */
  async findByTeam(teamId: number): Promise<Tournament[]> {
    try {
      return await Tournament.findAll({
        where: {
          teams: { [Op.contains]: [teamId] }
        },
        order: [['startDate', 'DESC']]
      });
    } catch (error) {
      logger.error('Error finding tournaments by team', { error, teamId });
      throw error;
    }
  }

  /**
   * Find tournaments by participant
   * 
   * @param studentId - Student ID
   * @returns Array of tournaments
   */
  async findByParticipant(studentId: number): Promise<Tournament[]> {
    try {
      return await Tournament.findAll({
        where: {
          participants: { [Op.contains]: [studentId] }
        },
        order: [['startDate', 'DESC']]
      });
    } catch (error) {
      logger.error('Error finding tournaments by participant', { error, studentId });
      throw error;
    }
  }

  /**
   * Find tournaments with filters and pagination
   * 
   * @param filters - Optional filters
   * @param page - Page number
   * @param limit - Items per page
   * @returns Tournaments with pagination metadata
   */
  async findWithPagination(
    filters?: TournamentFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    tournaments: Tournament[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const where: any = {};

      if (filters) {
        if (filters.sportId) where.sportId = filters.sportId;
        if (filters.type) where.type = filters.type;
        if (filters.status) where.status = filters.status;
        if (filters.venue) where.venue = { [Op.like]: `%${filters.venue}%` };

        if (filters.startDateFrom || filters.startDateTo) {
          where.startDate = {};
          if (filters.startDateFrom) where.startDate[Op.gte] = filters.startDateFrom;
          if (filters.startDateTo) where.startDate[Op.lte] = filters.startDateTo;
        }
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await Tournament.findAndCountAll({
        where,
        order: [['startDate', 'DESC']],
        limit,
        offset
      });

      return {
        tournaments: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Error finding tournaments with pagination', {
        error,
        filters,
        page,
        limit
      });
      throw error;
    }
  }

  /**
   * Update tournament
   * 
   * @param tournamentId - Tournament ID
   * @param data - Data to update
   * @param userId - User ID performing the operation
   * @param req - Express request object
   * @returns Updated tournament or null
   */
  async update(
    tournamentId: number,
    data: Partial<TournamentCreationAttributes>,
    userId?: number,
    req?: Request
  ): Promise<Tournament | null> {
    try {
      const tournament = await Tournament.findByPk(tournamentId);
      if (!tournament) {
        return null;
      }

      await tournament.update(data);

      logger.info('Tournament updated', {
        tournamentId,
        updatedFields: Object.keys(data),
        userId,
        ip: req?.ip
      });

      return tournament;
    } catch (error) {
      logger.error('Error updating tournament', { error, tournamentId, data });
      throw error;
    }
  }

  /**
   * Add team to tournament
   * Requirement 12.5: Create tournaments with teams
   * 
   * @param tournamentId - Tournament ID
   * @param teamId - Team ID
   * @param userId - User ID performing the operation
   * @param req - Express request object
   * @returns Updated tournament or null
   */
  async addTeam(
    tournamentId: number,
    teamId: number,
    userId?: number,
    req?: Request
  ): Promise<Tournament | null> {
    try {
      const tournament = await Tournament.findByPk(tournamentId);
      if (!tournament) {
        return null;
      }

      tournament.addTeam(teamId);
      await tournament.save();

      logger.info('Team added to tournament', {
        tournamentId,
        teamId,
        totalTeams: tournament.getTeamCount(),
        userId,
        ip: req?.ip
      });

      return tournament;
    } catch (error) {
      logger.error('Error adding team to tournament', { error, tournamentId, teamId });
      throw error;
    }
  }

  /**
   * Remove team from tournament
   * 
   * @param tournamentId - Tournament ID
   * @param teamId - Team ID
   * @param userId - User ID performing the operation
   * @param req - Express request object
   * @returns Updated tournament or null
   */
  async removeTeam(
    tournamentId: number,
    teamId: number,
    userId?: number,
    req?: Request
  ): Promise<Tournament | null> {
    try {
      const tournament = await Tournament.findByPk(tournamentId);
      if (!tournament) {
        return null;
      }

      tournament.removeTeam(teamId);
      await tournament.save();

      logger.info('Team removed from tournament', {
        tournamentId,
        teamId,
        remainingTeams: tournament.getTeamCount(),
        userId,
        ip: req?.ip
      });

      return tournament;
    } catch (error) {
      logger.error('Error removing team from tournament', { error, tournamentId, teamId });
      throw error;
    }
  }

  /**
   * Add participant to tournament
   * Requirement 12.5: Create tournaments with participants
   * 
   * @param tournamentId - Tournament ID
   * @param studentId - Student ID
   * @param userId - User ID performing the operation
   * @param req - Express request object
   * @returns Updated tournament or null
   */
  async addParticipant(
    tournamentId: number,
    studentId: number,
    userId?: number,
    req?: Request
  ): Promise<Tournament | null> {
    try {
      const tournament = await Tournament.findByPk(tournamentId);
      if (!tournament) {
        return null;
      }

      tournament.addParticipant(studentId);
      await tournament.save();

      logger.info('Participant added to tournament', {
        tournamentId,
        studentId,
        totalParticipants: tournament.getParticipantCount(),
        userId,
        ip: req?.ip
      });

      return tournament;
    } catch (error) {
      logger.error('Error adding participant to tournament', {
        error,
        tournamentId,
        studentId
      });
      throw error;
    }
  }

  /**
   * Remove participant from tournament
   * 
   * @param tournamentId - Tournament ID
   * @param studentId - Student ID
   * @param userId - User ID performing the operation
   * @param req - Express request object
   * @returns Updated tournament or null
   */
  async removeParticipant(
    tournamentId: number,
    studentId: number,
    userId?: number,
    req?: Request
  ): Promise<Tournament | null> {
    try {
      const tournament = await Tournament.findByPk(tournamentId);
      if (!tournament) {
        return null;
      }

      tournament.removeParticipant(studentId);
      await tournament.save();

      logger.info('Participant removed from tournament', {
        tournamentId,
        studentId,
        remainingParticipants: tournament.getParticipantCount(),
        userId,
        ip: req?.ip
      });

      return tournament;
    } catch (error) {
      logger.error('Error removing participant from tournament', {
        error,
        tournamentId,
        studentId
      });
      throw error;
    }
  }

  /**
   * Add match to tournament schedule
   * Requirement 12.5: Create match schedules
   * 
   * @param tournamentId - Tournament ID
   * @param match - Match details
   * @param userId - User ID performing the operation
   * @param req - Express request object
   * @returns Updated tournament or null
   */
  async addMatch(
    tournamentId: number,
    match: MatchResult,
    userId?: number,
    req?: Request
  ): Promise<Tournament | null> {
    try {
      const tournament = await Tournament.findByPk(tournamentId);
      if (!tournament) {
        return null;
      }

      tournament.addMatch(match);
      await tournament.save();

      logger.info('Match added to tournament schedule', {
        tournamentId,
        matchId: match.matchId,
        totalMatches: tournament.getMatchCount(),
        userId,
        ip: req?.ip
      });

      return tournament;
    } catch (error) {
      logger.error('Error adding match to tournament', { error, tournamentId, match });
      throw error;
    }
  }

  /**
   * Update match result
   * Requirement 12.6: Record match results and scores
   * 
   * @param tournamentId - Tournament ID
   * @param matchId - Match ID
   * @param result - Match result data
   * @param userId - User ID performing the operation
   * @param req - Express request object
   * @returns Updated tournament or null
   */
  async updateMatchResult(
    tournamentId: number,
    matchId: string,
    result: Partial<MatchResult>,
    userId?: number,
    req?: Request
  ): Promise<Tournament | null> {
    try {
      const tournament = await Tournament.findByPk(tournamentId);
      if (!tournament) {
        return null;
      }

      const updated = tournament.updateMatchResult(matchId, result);
      if (!updated) {
        throw new Error(`Match with ID ${matchId} not found in tournament`);
      }

      await tournament.save();

      logger.info('Match result updated', {
        tournamentId,
        matchId,
        result,
        userId,
        ip: req?.ip
      });

      return tournament;
    } catch (error) {
      logger.error('Error updating match result', {
        error,
        tournamentId,
        matchId,
        result
      });
      throw error;
    }
  }

  /**
   * Add photo to tournament
   * Requirement 12.10: Upload tournament photos
   * 
   * @param tournamentId - Tournament ID
   * @param photoUrl - Photo URL
   * @param userId - User ID performing the operation
   * @param req - Express request object
   * @returns Updated tournament or null
   */
  async addPhoto(
    tournamentId: number,
    photoUrl: string,
    userId?: number,
    req?: Request
  ): Promise<Tournament | null> {
    try {
      const tournament = await Tournament.findByPk(tournamentId);
      if (!tournament) {
        return null;
      }

      tournament.addPhoto(photoUrl);
      await tournament.save();

      logger.info('Photo added to tournament', {
        tournamentId,
        photoUrl,
        totalPhotos: tournament.photos?.length || 0,
        userId,
        ip: req?.ip
      });

      return tournament;
    } catch (error) {
      logger.error('Error adding photo to tournament', { error, tournamentId, photoUrl });
      throw error;
    }
  }

  /**
   * Add video to tournament
   * Requirement 12.10: Upload tournament videos
   * 
   * @param tournamentId - Tournament ID
   * @param videoUrl - Video URL
   * @param userId - User ID performing the operation
   * @param req - Express request object
   * @returns Updated tournament or null
   */
  async addVideo(
    tournamentId: number,
    videoUrl: string,
    userId?: number,
    req?: Request
  ): Promise<Tournament | null> {
    try {
      const tournament = await Tournament.findByPk(tournamentId);
      if (!tournament) {
        return null;
      }

      tournament.addVideo(videoUrl);
      await tournament.save();

      logger.info('Video added to tournament', {
        tournamentId,
        videoUrl,
        totalVideos: tournament.videos?.length || 0,
        userId,
        ip: req?.ip
      });

      return tournament;
    } catch (error) {
      logger.error('Error adding video to tournament', { error, tournamentId, videoUrl });
      throw error;
    }
  }

  /**
   * Get tournament statistics
   * 
   * @param sportId - Sport ID
   * @returns Tournament statistics
   */
  async getTournamentStats(sportId: number): Promise<{
    total: number;
    scheduled: number;
    ongoing: number;
    completed: number;
    cancelled: number;
    totalMatches: number;
    averageMatches: number;
  }> {
    try {
      const tournaments = await Tournament.findAll({
        where: { sportId }
      });

      const stats = {
        total: tournaments.length,
        scheduled: tournaments.filter(t => t.status === 'scheduled').length,
        ongoing: tournaments.filter(t => t.status === 'ongoing').length,
        completed: tournaments.filter(t => t.status === 'completed').length,
        cancelled: tournaments.filter(t => t.status === 'cancelled').length,
        totalMatches: tournaments.reduce((sum, t) => sum + t.getMatchCount(), 0),
        averageMatches: 0
      };

      stats.averageMatches = stats.total > 0 ? stats.totalMatches / stats.total : 0;

      return stats;
    } catch (error) {
      logger.error('Error getting tournament stats', { error, sportId });
      throw error;
    }
  }

  /**
   * Delete tournament
   * 
   * @param tournamentId - Tournament ID
   * @param userId - User ID performing the operation
   * @param req - Express request object
   * @returns True if deleted
   */
  async delete(
    tournamentId: number,
    userId?: number,
    req?: Request
  ): Promise<boolean> {
    try {
      const tournament = await Tournament.findByPk(tournamentId);
      if (!tournament) {
        return false;
      }

      await tournament.destroy();

      logger.info('Tournament deleted', {
        tournamentId,
        userId,
        ip: req?.ip
      });

      return true;
    } catch (error) {
      logger.error('Error deleting tournament', { error, tournamentId });
      throw error;
    }
  }
}

export default new TournamentRepository();
