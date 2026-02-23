/**
 * Tournament Service
 * Business logic for tournament management
 * 
 * Features:
 * - Tournament creation with date, venue, teams
 * - Match schedule creation
 * - Match result recording with scores
 * - Player statistics tracking
 * - Tournament status management
 * 
 * Requirements: 12.5, 12.6
 */

import tournamentRepository from './tournament.repository';
import Sport from '@models/Sport.model';
import Team from '@models/Team.model';
import Tournament, { TournamentCreationAttributes, MatchResult } from '@models/Tournament.model';
import { logger } from '@utils/logger';
import { Request } from 'express';

interface TournamentInput {
  sportId: number;
  name: string;
  nameNp?: string;
  type: 'inter_school' | 'intra_school' | 'district' | 'regional' | 'national';
  description?: string;
  descriptionNp?: string;
  startDate: Date;
  startDateBS?: string;
  endDate: Date;
  endDateBS?: string;
  venue?: string;
  venueNp?: string;
  remarks?: string;
}

interface MatchInput {
  matchId: string;
  date: string;
  dateBS?: string;
  team1Id?: number;
  team2Id?: number;
  participant1Id?: number;
  participant2Id?: number;
  remarks?: string;
}

interface MatchResultInput {
  score1?: string;
  score2?: string;
  winnerId?: number;
  remarks?: string;
}

interface PlayerStats {
  studentId: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  totalScore?: string;
}

interface TournamentFilters {
  sportId?: number;
  type?: 'inter_school' | 'intra_school' | 'district' | 'regional' | 'national';
  status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  startDateFrom?: Date;
  startDateTo?: Date;
  venue?: string;
}

class TournamentService {
  /**
   * Create a new tournament
   * Requirement 12.5: Create tournaments with date, venue, teams
   * 
   * @param tournamentData - Tournament data
   * @param userId - User ID creating the tournament
   * @param req - Express request object
   * @returns Created tournament
   * @throws Error if validation fails
   */
  async createTournament(
    tournamentData: TournamentInput,
    userId?: number,
    req?: Request
  ): Promise<Tournament> {
    try {
      const { sportId, startDate, endDate, ...rest } = tournamentData;

      // 1. Validate sport exists
      const sport = await Sport.findByPk(sportId);
      if (!sport) {
        throw new Error(`Sport with ID ${sportId} not found`);
      }

      // 2. Validate dates
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      if (endDateObj < startDateObj) {
        throw new Error('End date must be after start date');
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      startDateObj.setHours(0, 0, 0, 0);

      if (startDateObj < today) {
        throw new Error('Start date cannot be in the past');
      }

      // 3. Create tournament
      const tournamentCreateData: TournamentCreationAttributes = {
        sportId,
        startDate: startDateObj,
        endDate: endDateObj,
        status: 'scheduled',
        teams: [],
        participants: [],
        schedule: [],
        photos: [],
        videos: [],
        ...rest
      };

      const tournament = await tournamentRepository.create(
        tournamentCreateData,
        userId,
        req
      );

      logger.info('Tournament created successfully', {
        tournamentId: tournament.tournamentId,
        sportId,
        name: tournament.name,
        startDate: tournament.startDate,
        endDate: tournament.endDate
      });

      return tournament;
    } catch (error) {
      logger.error('Error creating tournament', { error, tournamentData });
      throw error;
    }
  }

  /**
   * Add teams to tournament
   * Requirement 12.5: Create tournaments with teams
   * 
   * @param tournamentId - Tournament ID
   * @param teamIds - Array of team IDs
   * @param userId - User ID performing the operation
   * @param req - Express request object
   * @returns Updated tournament
   * @throws Error if tournament or teams not found
   */
  async addTeams(
    tournamentId: number,
    teamIds: number[],
    userId?: number,
    req?: Request
  ): Promise<Tournament> {
    try {
      // 1. Validate tournament exists
      const tournament = await tournamentRepository.findById(tournamentId);
      if (!tournament) {
        throw new Error(`Tournament with ID ${tournamentId} not found`);
      }

      // 2. Validate all teams exist and belong to the same sport
      for (const teamId of teamIds) {
        const team = await Team.findByPk(teamId);
        if (!team) {
          throw new Error(`Team with ID ${teamId} not found`);
        }
        if (team.sportId !== tournament.sportId) {
          throw new Error(`Team ${teamId} does not belong to sport ${tournament.sportId}`);
        }
      }

      // 3. Add each team
      for (const teamId of teamIds) {
        await tournamentRepository.addTeam(tournamentId, teamId, userId, req);
      }

      // 4. Get updated tournament
      const updatedTournament = await tournamentRepository.findById(tournamentId);
      if (!updatedTournament) {
        throw new Error('Failed to retrieve updated tournament');
      }

      logger.info('Teams added to tournament', {
        tournamentId,
        addedCount: teamIds.length,
        totalTeams: updatedTournament.getTeamCount()
      });

      return updatedTournament;
    } catch (error) {
      logger.error('Error adding teams to tournament', {
        error,
        tournamentId,
        teamIds
      });
      throw error;
    }
  }

  /**
   * Add participants to tournament (for individual sports)
   * Requirement 12.5: Create tournaments with participants
   * 
   * @param tournamentId - Tournament ID
   * @param studentIds - Array of student IDs
   * @param userId - User ID performing the operation
   * @param req - Express request object
   * @returns Updated tournament
   * @throws Error if tournament not found
   */
  async addParticipants(
    tournamentId: number,
    studentIds: number[],
    userId?: number,
    req?: Request
  ): Promise<Tournament> {
    try {
      // 1. Validate tournament exists
      const tournament = await tournamentRepository.findById(tournamentId);
      if (!tournament) {
        throw new Error(`Tournament with ID ${tournamentId} not found`);
      }

      // 2. Add each participant
      for (const studentId of studentIds) {
        await tournamentRepository.addParticipant(tournamentId, studentId, userId, req);
      }

      // 3. Get updated tournament
      const updatedTournament = await tournamentRepository.findById(tournamentId);
      if (!updatedTournament) {
        throw new Error('Failed to retrieve updated tournament');
      }

      logger.info('Participants added to tournament', {
        tournamentId,
        addedCount: studentIds.length,
        totalParticipants: updatedTournament.getParticipantCount()
      });

      return updatedTournament;
    } catch (error) {
      logger.error('Error adding participants to tournament', {
        error,
        tournamentId,
        studentIds
      });
      throw error;
    }
  }

  /**
   * Create match schedule
   * Requirement 12.5: Create match schedules
   * 
   * @param tournamentId - Tournament ID
   * @param matches - Array of match details
   * @param userId - User ID performing the operation
   * @param req - Express request object
   * @returns Updated tournament
   * @throws Error if tournament not found or validation fails
   */
  async createMatchSchedule(
    tournamentId: number,
    matches: MatchInput[],
    userId?: number,
    req?: Request
  ): Promise<Tournament> {
    try {
      // 1. Validate tournament exists
      const tournament = await tournamentRepository.findById(tournamentId);
      if (!tournament) {
        throw new Error(`Tournament with ID ${tournamentId} not found`);
      }

      // 2. Validate match dates are within tournament dates
      const tournamentStart = new Date(tournament.startDate);
      const tournamentEnd = new Date(tournament.endDate);

      for (const match of matches) {
        const matchDate = new Date(match.date);
        if (matchDate < tournamentStart || matchDate > tournamentEnd) {
          throw new Error(
            `Match ${match.matchId} date must be between tournament start and end dates`
          );
        }

        // Validate teams/participants exist in tournament
        if (match.team1Id && match.team2Id) {
          if (!tournament.teams?.includes(match.team1Id)) {
            throw new Error(`Team ${match.team1Id} is not part of this tournament`);
          }
          if (!tournament.teams?.includes(match.team2Id)) {
            throw new Error(`Team ${match.team2Id} is not part of this tournament`);
          }
        }

        if (match.participant1Id && match.participant2Id) {
          if (!tournament.participants?.includes(match.participant1Id)) {
            throw new Error(`Participant ${match.participant1Id} is not part of this tournament`);
          }
          if (!tournament.participants?.includes(match.participant2Id)) {
            throw new Error(`Participant ${match.participant2Id} is not part of this tournament`);
          }
        }
      }

      // 3. Add each match to schedule
      for (const match of matches) {
        const matchResult: MatchResult = {
          matchId: match.matchId,
          date: match.date,
          dateBS: match.dateBS,
          team1Id: match.team1Id,
          team2Id: match.team2Id,
          participant1Id: match.participant1Id,
          participant2Id: match.participant2Id,
          remarks: match.remarks
        };

        await tournamentRepository.addMatch(tournamentId, matchResult, userId, req);
      }

      // 4. Get updated tournament
      const updatedTournament = await tournamentRepository.findById(tournamentId);
      if (!updatedTournament) {
        throw new Error('Failed to retrieve updated tournament');
      }

      logger.info('Match schedule created', {
        tournamentId,
        matchCount: matches.length,
        totalMatches: updatedTournament.getMatchCount()
      });

      return updatedTournament;
    } catch (error) {
      logger.error('Error creating match schedule', {
        error,
        tournamentId,
        matches
      });
      throw error;
    }
  }

  /**
   * Record match result
   * Requirement 12.6: Record match results and scores
   * 
   * @param tournamentId - Tournament ID
   * @param matchId - Match ID
   * @param result - Match result data
   * @param userId - User ID performing the operation
   * @param req - Express request object
   * @returns Updated tournament
   * @throws Error if tournament or match not found
   */
  async recordMatchResult(
    tournamentId: number,
    matchId: string,
    result: MatchResultInput,
    userId?: number,
    req?: Request
  ): Promise<Tournament> {
    try {
      // 1. Validate tournament exists
      const tournament = await tournamentRepository.findById(tournamentId);
      if (!tournament) {
        throw new Error(`Tournament with ID ${tournamentId} not found`);
      }

      // 2. Validate match exists in tournament
      const match = tournament.schedule?.find(m => m.matchId === matchId);
      if (!match) {
        throw new Error(`Match with ID ${matchId} not found in tournament`);
      }

      // 3. Validate winner is one of the participants
      if (result.winnerId) {
        const isValidWinner =
          (match.team1Id && match.team1Id === result.winnerId) ||
          (match.team2Id && match.team2Id === result.winnerId) ||
          (match.participant1Id && match.participant1Id === result.winnerId) ||
          (match.participant2Id && match.participant2Id === result.winnerId);

        if (!isValidWinner) {
          throw new Error('Winner must be one of the match participants');
        }
      }

      // 4. Update match result
      const updatedTournament = await tournamentRepository.updateMatchResult(
        tournamentId,
        matchId,
        result,
        userId,
        req
      );

      if (!updatedTournament) {
        throw new Error('Failed to update match result');
      }

      logger.info('Match result recorded', {
        tournamentId,
        matchId,
        winnerId: result.winnerId,
        score1: result.score1,
        score2: result.score2
      });

      return updatedTournament;
    } catch (error) {
      logger.error('Error recording match result', {
        error,
        tournamentId,
        matchId,
        result
      });
      throw error;
    }
  }

  /**
   * Get player statistics for a tournament
   * Requirement 12.6: Track player statistics
   * 
   * @param tournamentId - Tournament ID
   * @returns Array of player statistics
   * @throws Error if tournament not found
   */
  async getPlayerStatistics(tournamentId: number): Promise<PlayerStats[]> {
    try {
      const tournament = await tournamentRepository.findById(tournamentId);
      if (!tournament) {
        throw new Error(`Tournament with ID ${tournamentId} not found`);
      }

      if (!tournament.schedule || tournament.schedule.length === 0) {
        return [];
      }

      // Calculate statistics for each participant
      const statsMap = new Map<number, PlayerStats>();

      for (const match of tournament.schedule) {
        // Process team matches
        if (match.team1Id && match.team2Id) {
          // For team sports, we track team statistics
          this.updateTeamStats(statsMap, match.team1Id, match);
          this.updateTeamStats(statsMap, match.team2Id, match);
        }

        // Process individual matches
        if (match.participant1Id && match.participant2Id) {
          this.updatePlayerStats(statsMap, match.participant1Id, match);
          this.updatePlayerStats(statsMap, match.participant2Id, match);
        }
      }

      const statistics = Array.from(statsMap.values());

      logger.info('Player statistics calculated', {
        tournamentId,
        playerCount: statistics.length
      });

      return statistics;
    } catch (error) {
      logger.error('Error getting player statistics', { error, tournamentId });
      throw error;
    }
  }

  /**
   * Helper method to update player statistics
   * 
   * @param statsMap - Map of player statistics
   * @param playerId - Player ID
   * @param match - Match result
   */
  private updatePlayerStats(
    statsMap: Map<number, PlayerStats>,
    playerId: number,
    match: MatchResult
  ): void {
    if (!statsMap.has(playerId)) {
      statsMap.set(playerId, {
        studentId: playerId,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0
      });
    }

    const stats = statsMap.get(playerId)!;
    stats.matchesPlayed++;

    if (match.winnerId) {
      if (match.winnerId === playerId) {
        stats.wins++;
      } else {
        stats.losses++;
      }
    } else if (match.score1 && match.score2) {
      // If no winner specified but scores are equal, it's a draw
      if (match.score1 === match.score2) {
        stats.draws++;
      }
    }
  }

  /**
   * Helper method to update team statistics
   * 
   * @param statsMap - Map of team statistics
   * @param teamId - Team ID
   * @param match - Match result
   */
  private updateTeamStats(
    statsMap: Map<number, PlayerStats>,
    teamId: number,
    match: MatchResult
  ): void {
    if (!statsMap.has(teamId)) {
      statsMap.set(teamId, {
        studentId: teamId, // Using studentId field for teamId
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0
      });
    }

    const stats = statsMap.get(teamId)!;
    stats.matchesPlayed++;

    if (match.winnerId) {
      if (match.winnerId === teamId) {
        stats.wins++;
      } else {
        stats.losses++;
      }
    } else if (match.score1 && match.score2) {
      if (match.score1 === match.score2) {
        stats.draws++;
      }
    }
  }

  /**
   * Update tournament status
   * 
   * @param tournamentId - Tournament ID
   * @param status - New status
   * @param userId - User ID performing the operation
   * @param req - Express request object
   * @returns Updated tournament
   * @throws Error if tournament not found or invalid status transition
   */
  async updateTournamentStatus(
    tournamentId: number,
    status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled',
    userId?: number,
    req?: Request
  ): Promise<Tournament> {
    try {
      const tournament = await tournamentRepository.findById(tournamentId);
      if (!tournament) {
        throw new Error(`Tournament with ID ${tournamentId} not found`);
      }

      // Validate status transitions
      if (tournament.status === 'completed' && status !== 'completed') {
        throw new Error('Cannot change status of a completed tournament');
      }

      if (tournament.status === 'cancelled' && status !== 'cancelled') {
        throw new Error('Cannot change status of a cancelled tournament');
      }

      const updatedTournament = await tournamentRepository.update(
        tournamentId,
        { status },
        userId,
        req
      );

      if (!updatedTournament) {
        throw new Error('Failed to update tournament status');
      }

      logger.info('Tournament status updated', {
        tournamentId,
        oldStatus: tournament.status,
        newStatus: status
      });

      return updatedTournament;
    } catch (error) {
      logger.error('Error updating tournament status', { error, tournamentId, status });
      throw error;
    }
  }

  /**
   * Upload photos to tournament
   * 
   * @param tournamentId - Tournament ID
   * @param photoUrls - Array of photo URLs
   * @param userId - User ID performing the operation
   * @param req - Express request object
   * @returns Updated tournament
   * @throws Error if tournament not found
   */
  async uploadPhotos(
    tournamentId: number,
    photoUrls: string[],
    userId?: number,
    req?: Request
  ): Promise<Tournament> {
    try {
      const tournament = await tournamentRepository.findById(tournamentId);
      if (!tournament) {
        throw new Error(`Tournament with ID ${tournamentId} not found`);
      }

      for (const photoUrl of photoUrls) {
        await tournamentRepository.addPhoto(tournamentId, photoUrl, userId, req);
      }

      const updatedTournament = await tournamentRepository.findById(tournamentId);
      if (!updatedTournament) {
        throw new Error('Failed to retrieve updated tournament');
      }

      logger.info('Photos uploaded to tournament', {
        tournamentId,
        uploadedCount: photoUrls.length,
        totalPhotos: updatedTournament.photos?.length || 0
      });

      return updatedTournament;
    } catch (error) {
      logger.error('Error uploading photos to tournament', {
        error,
        tournamentId,
        photoUrls
      });
      throw error;
    }
  }

  /**
   * Upload videos to tournament
   * 
   * @param tournamentId - Tournament ID
   * @param videoUrls - Array of video URLs
   * @param userId - User ID performing the operation
   * @param req - Express request object
   * @returns Updated tournament
   * @throws Error if tournament not found
   */
  async uploadVideos(
    tournamentId: number,
    videoUrls: string[],
    userId?: number,
    req?: Request
  ): Promise<Tournament> {
    try {
      const tournament = await tournamentRepository.findById(tournamentId);
      if (!tournament) {
        throw new Error(`Tournament with ID ${tournamentId} not found`);
      }

      for (const videoUrl of videoUrls) {
        await tournamentRepository.addVideo(tournamentId, videoUrl, userId, req);
      }

      const updatedTournament = await tournamentRepository.findById(tournamentId);
      if (!updatedTournament) {
        throw new Error('Failed to retrieve updated tournament');
      }

      logger.info('Videos uploaded to tournament', {
        tournamentId,
        uploadedCount: videoUrls.length,
        totalVideos: updatedTournament.videos?.length || 0
      });

      return updatedTournament;
    } catch (error) {
      logger.error('Error uploading videos to tournament', {
        error,
        tournamentId,
        videoUrls
      });
      throw error;
    }
  }

  /**
   * Update tournament details
   * 
   * @param tournamentId - Tournament ID
   * @param updateData - Data to update
   * @param userId - User ID performing the operation
   * @param req - Express request object
   * @returns Updated tournament
   * @throws Error if tournament not found
   */
  async updateTournament(
    tournamentId: number,
    updateData: Partial<TournamentInput>,
    userId?: number,
    req?: Request
  ): Promise<Tournament> {
    try {
      // Validate dates if being updated
      if (updateData.startDate || updateData.endDate) {
        const tournament = await tournamentRepository.findById(tournamentId);
        if (!tournament) {
          throw new Error(`Tournament with ID ${tournamentId} not found`);
        }

        const startDate = updateData.startDate
          ? new Date(updateData.startDate)
          : new Date(tournament.startDate);
        const endDate = updateData.endDate
          ? new Date(updateData.endDate)
          : new Date(tournament.endDate);

        if (endDate < startDate) {
          throw new Error('End date must be after start date');
        }
      }

      const updatedTournament = await tournamentRepository.update(
        tournamentId,
        updateData,
        userId,
        req
      );

      if (!updatedTournament) {
        throw new Error(`Tournament with ID ${tournamentId} not found`);
      }

      logger.info('Tournament updated successfully', {
        tournamentId,
        updatedFields: Object.keys(updateData)
      });

      return updatedTournament;
    } catch (error) {
      logger.error('Error updating tournament', { error, tournamentId, updateData });
      throw error;
    }
  }

  /**
   * Get tournament by ID
   * 
   * @param tournamentId - Tournament ID
   * @returns Tournament or null
   */
  async getTournamentById(tournamentId: number): Promise<Tournament | null> {
    try {
      return await tournamentRepository.findById(tournamentId);
    } catch (error) {
      logger.error('Error getting tournament by ID', { error, tournamentId });
      throw error;
    }
  }

  /**
   * Get tournaments by sport
   * 
   * @param sportId - Sport ID
   * @param status - Optional status filter
   * @returns Array of tournaments
   */
  async getTournamentsBySport(
    sportId: number,
    status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
  ): Promise<Tournament[]> {
    try {
      return await tournamentRepository.findBySport(sportId, status);
    } catch (error) {
      logger.error('Error getting tournaments by sport', { error, sportId, status });
      throw error;
    }
  }

  /**
   * Get upcoming tournaments
   * 
   * @param limit - Maximum number of tournaments
   * @param sportId - Optional sport ID filter
   * @returns Array of upcoming tournaments
   */
  async getUpcomingTournaments(
    limit: number = 10,
    sportId?: number
  ): Promise<Tournament[]> {
    try {
      return await tournamentRepository.findUpcoming(limit, sportId);
    } catch (error) {
      logger.error('Error getting upcoming tournaments', { error, limit, sportId });
      throw error;
    }
  }

  /**
   * Get tournaments with filters and pagination
   * 
   * @param filters - Optional filters
   * @param page - Page number
   * @param limit - Items per page
   * @returns Tournaments with pagination metadata
   */
  async getTournaments(
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
      return await tournamentRepository.findWithPagination(filters, page, limit);
    } catch (error) {
      logger.error('Error getting tournaments', { error, filters, page, limit });
      throw error;
    }
  }

  /**
   * Get tournament statistics for a sport
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
      return await tournamentRepository.getTournamentStats(sportId);
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
   * @throws Error if tournament not found or cannot be deleted
   */
  async deleteTournament(
    tournamentId: number,
    userId?: number,
    req?: Request
  ): Promise<boolean> {
    try {
      const tournament = await tournamentRepository.findById(tournamentId);
      if (!tournament) {
        throw new Error(`Tournament with ID ${tournamentId} not found`);
      }

      // Don't allow deletion of completed tournaments
      if (tournament.status === 'completed') {
        throw new Error('Cannot delete a completed tournament');
      }

      const deleted = await tournamentRepository.delete(tournamentId, userId, req);

      if (deleted) {
        logger.info('Tournament deleted successfully', { tournamentId });
      }

      return deleted;
    } catch (error) {
      logger.error('Error deleting tournament', { error, tournamentId });
      throw error;
    }
  }
}

export default new TournamentService();
