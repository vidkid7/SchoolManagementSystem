/**
 * Tournament Service Tests
 * 
 * Tests for tournament business logic
 * 
 * Requirements: 12.5, 12.6
 */

import tournamentService from '../tournament.service';
import Sport from '@models/Sport.model';
import Team from '@models/Team.model';
import Tournament from '@models/Tournament.model';
import { sequelize } from '@config/database';

describe('Tournament Service', () => {
  let testSport: Sport;
  let testTeam1: Team;
  let testTeam2: Team;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create test sport
    testSport = await Sport.create({
      name: 'Football',
      nameNp: 'फुटबल',
      category: 'team',
      coordinatorId: 1,
      academicYearId: 1,
      status: 'active'
    });

    // Create test teams
    testTeam1 = await Team.create({
      sportId: testSport.sportId,
      name: 'Team A',
      members: [1, 2, 3],
      academicYearId: 1,
      status: 'active'
    });

    testTeam2 = await Team.create({
      sportId: testSport.sportId,
      name: 'Team B',
      members: [4, 5, 6],
      academicYearId: 1,
      status: 'active'
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  afterEach(async () => {
    await Tournament.destroy({ where: {}, force: true });
  });

  describe('createTournament', () => {
    it('should create tournament with valid data', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const endDate = new Date(futureDate);
      endDate.setDate(endDate.getDate() + 14);

      const tournamentData = {
        sportId: testSport.sportId,
        name: 'Inter-School Football Championship',
        type: 'inter_school' as const,
        startDate: futureDate,
        endDate: endDate,
        venue: 'School Ground'
      };

      const tournament = await tournamentService.createTournament(tournamentData);

      expect(tournament).toBeDefined();
      expect(tournament.name).toBe(tournamentData.name);
      expect(tournament.sportId).toBe(testSport.sportId);
      expect(tournament.status).toBe('scheduled');
    });

    it('should throw error if sport does not exist', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const tournamentData = {
        sportId: 99999,
        name: 'Test Tournament',
        type: 'intra_school' as const,
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 14 * 24 * 60 * 60 * 1000)
      };

      await expect(
        tournamentService.createTournament(tournamentData)
      ).rejects.toThrow('Sport with ID 99999 not found');
    });

    it('should throw error if end date is before start date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const pastDate = new Date(futureDate);
      pastDate.setDate(pastDate.getDate() - 5);

      const tournamentData = {
        sportId: testSport.sportId,
        name: 'Test Tournament',
        type: 'intra_school' as const,
        startDate: futureDate,
        endDate: pastDate
      };

      await expect(
        tournamentService.createTournament(tournamentData)
      ).rejects.toThrow('End date must be after start date');
    });

    it('should throw error if start date is in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const tournamentData = {
        sportId: testSport.sportId,
        name: 'Test Tournament',
        type: 'intra_school' as const,
        startDate: pastDate,
        endDate: new Date()
      };

      await expect(
        tournamentService.createTournament(tournamentData)
      ).rejects.toThrow('Start date cannot be in the past');
    });
  });

  describe('addTeams', () => {
    let tournament: Tournament;

    beforeEach(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      tournament = await tournamentService.createTournament({
        sportId: testSport.sportId,
        name: 'Test Tournament',
        type: 'intra_school',
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 14 * 24 * 60 * 60 * 1000)
      });
    });

    it('should add teams to tournament', async () => {
      const updated = await tournamentService.addTeams(tournament.tournamentId, [
        testTeam1.teamId,
        testTeam2.teamId
      ]);

      expect(updated.teams).toContain(testTeam1.teamId);
      expect(updated.teams).toContain(testTeam2.teamId);
      expect(updated.getTeamCount()).toBe(2);
    });

    it('should throw error if tournament does not exist', async () => {
      await expect(
        tournamentService.addTeams(99999, [testTeam1.teamId])
      ).rejects.toThrow('Tournament with ID 99999 not found');
    });

    it('should throw error if team does not exist', async () => {
      await expect(
        tournamentService.addTeams(tournament.tournamentId, [99999])
      ).rejects.toThrow('Team with ID 99999 not found');
    });

    it('should throw error if team belongs to different sport', async () => {
      // Create a different sport
      const otherSport = await Sport.create({
        name: 'Basketball',
        category: 'team',
        coordinatorId: 1,
        academicYearId: 1,
        status: 'active'
      });

      const otherTeam = await Team.create({
        sportId: otherSport.sportId,
        name: 'Basketball Team',
        members: [7, 8, 9],
        academicYearId: 1,
        status: 'active'
      });

      await expect(
        tournamentService.addTeams(tournament.tournamentId, [otherTeam.teamId])
      ).rejects.toThrow(`Team ${otherTeam.teamId} does not belong to sport`);
    });
  });

  describe('addParticipants', () => {
    let tournament: Tournament;

    beforeEach(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      tournament = await tournamentService.createTournament({
        sportId: testSport.sportId,
        name: 'Test Tournament',
        type: 'intra_school',
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 14 * 24 * 60 * 60 * 1000)
      });
    });

    it('should add participants to tournament', async () => {
      const updated = await tournamentService.addParticipants(
        tournament.tournamentId,
        [101, 102, 103]
      );

      expect(updated.participants).toContain(101);
      expect(updated.participants).toContain(102);
      expect(updated.participants).toContain(103);
      expect(updated.getParticipantCount()).toBe(3);
    });
  });

  describe('createMatchSchedule', () => {
    let tournament: Tournament;

    beforeEach(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      tournament = await tournamentService.createTournament({
        sportId: testSport.sportId,
        name: 'Test Tournament',
        type: 'intra_school',
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 14 * 24 * 60 * 60 * 1000)
      });

      await tournamentService.addTeams(tournament.tournamentId, [
        testTeam1.teamId,
        testTeam2.teamId
      ]);
    });

    it('should create match schedule', async () => {
      const matchDate = new Date(tournament.startDate);
      matchDate.setDate(matchDate.getDate() + 2);

      const matches = [
        {
          matchId: 'M001',
          date: matchDate.toISOString().split('T')[0],
          team1Id: testTeam1.teamId,
          team2Id: testTeam2.teamId
        }
      ];

      const updated = await tournamentService.createMatchSchedule(
        tournament.tournamentId,
        matches
      );

      expect(updated.schedule).toHaveLength(1);
      expect(updated.schedule?.[0].matchId).toBe('M001');
      expect(updated.schedule?.[0].team1Id).toBe(testTeam1.teamId);
      expect(updated.schedule?.[0].team2Id).toBe(testTeam2.teamId);
    });

    it('should throw error if match date is outside tournament dates', async () => {
      const beforeStart = new Date(tournament.startDate);
      beforeStart.setDate(beforeStart.getDate() - 1);

      const matches = [
        {
          matchId: 'M001',
          date: beforeStart.toISOString().split('T')[0],
          team1Id: testTeam1.teamId,
          team2Id: testTeam2.teamId
        }
      ];

      await expect(
        tournamentService.createMatchSchedule(tournament.tournamentId, matches)
      ).rejects.toThrow('must be between tournament start and end dates');
    });

    it('should throw error if team is not part of tournament', async () => {
      const matchDate = new Date(tournament.startDate);
      matchDate.setDate(matchDate.getDate() + 2);

      const otherTeam = await Team.create({
        sportId: testSport.sportId,
        name: 'Team C',
        members: [10, 11, 12],
        academicYearId: 1,
        status: 'active'
      });

      const matches = [
        {
          matchId: 'M001',
          date: matchDate.toISOString().split('T')[0],
          team1Id: testTeam1.teamId,
          team2Id: otherTeam.teamId
        }
      ];

      await expect(
        tournamentService.createMatchSchedule(tournament.tournamentId, matches)
      ).rejects.toThrow('is not part of this tournament');
    });
  });

  describe('recordMatchResult', () => {
    let tournament: Tournament;

    beforeEach(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      tournament = await tournamentService.createTournament({
        sportId: testSport.sportId,
        name: 'Test Tournament',
        type: 'intra_school',
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 14 * 24 * 60 * 60 * 1000)
      });

      await tournamentService.addTeams(tournament.tournamentId, [
        testTeam1.teamId,
        testTeam2.teamId
      ]);

      const matchDate = new Date(tournament.startDate);
      matchDate.setDate(matchDate.getDate() + 2);

      await tournamentService.createMatchSchedule(tournament.tournamentId, [
        {
          matchId: 'M001',
          date: matchDate.toISOString().split('T')[0],
          team1Id: testTeam1.teamId,
          team2Id: testTeam2.teamId
        }
      ]);
    });

    it('should record match result with scores and winner', async () => {
      const result = {
        score1: '3',
        score2: '1',
        winnerId: testTeam1.teamId,
        remarks: 'Great match'
      };

      const updated = await tournamentService.recordMatchResult(
        tournament.tournamentId,
        'M001',
        result
      );

      expect(updated.schedule?.[0].score1).toBe('3');
      expect(updated.schedule?.[0].score2).toBe('1');
      expect(updated.schedule?.[0].winnerId).toBe(testTeam1.teamId);
      expect(updated.schedule?.[0].remarks).toBe('Great match');
    });

    it('should throw error if match does not exist', async () => {
      await expect(
        tournamentService.recordMatchResult(tournament.tournamentId, 'M999', {
          score1: '1',
          score2: '0'
        })
      ).rejects.toThrow('Match with ID M999 not found');
    });

    it('should throw error if winner is not a participant', async () => {
      await expect(
        tournamentService.recordMatchResult(tournament.tournamentId, 'M001', {
          score1: '3',
          score2: '1',
          winnerId: 99999
        })
      ).rejects.toThrow('Winner must be one of the match participants');
    });
  });

  describe('getPlayerStatistics', () => {
    let tournament: Tournament;

    beforeEach(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      tournament = await tournamentService.createTournament({
        sportId: testSport.sportId,
        name: 'Test Tournament',
        type: 'intra_school',
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 14 * 24 * 60 * 60 * 1000)
      });

      await tournamentService.addTeams(tournament.tournamentId, [
        testTeam1.teamId,
        testTeam2.teamId
      ]);

      const matchDate = new Date(tournament.startDate);
      matchDate.setDate(matchDate.getDate() + 2);

      await tournamentService.createMatchSchedule(tournament.tournamentId, [
        {
          matchId: 'M001',
          date: matchDate.toISOString().split('T')[0],
          team1Id: testTeam1.teamId,
          team2Id: testTeam2.teamId
        },
        {
          matchId: 'M002',
          date: matchDate.toISOString().split('T')[0],
          team1Id: testTeam1.teamId,
          team2Id: testTeam2.teamId
        }
      ]);

      // Record results
      await tournamentService.recordMatchResult(tournament.tournamentId, 'M001', {
        score1: '3',
        score2: '1',
        winnerId: testTeam1.teamId
      });

      await tournamentService.recordMatchResult(tournament.tournamentId, 'M002', {
        score1: '2',
        score2: '2'
      });
    });

    it('should calculate player statistics correctly', async () => {
      const stats = await tournamentService.getPlayerStatistics(
        tournament.tournamentId
      );

      expect(stats).toHaveLength(2);

      const team1Stats = stats.find(s => s.studentId === testTeam1.teamId);
      const team2Stats = stats.find(s => s.studentId === testTeam2.teamId);

      expect(team1Stats).toBeDefined();
      expect(team1Stats?.matchesPlayed).toBe(2);
      expect(team1Stats?.wins).toBe(1);
      expect(team1Stats?.draws).toBe(1);
      expect(team1Stats?.losses).toBe(0);

      expect(team2Stats).toBeDefined();
      expect(team2Stats?.matchesPlayed).toBe(2);
      expect(team2Stats?.wins).toBe(0);
      expect(team2Stats?.draws).toBe(1);
      expect(team2Stats?.losses).toBe(1);
    });

    it('should return empty array if no matches', async () => {
      const newTournament = await tournamentService.createTournament({
        sportId: testSport.sportId,
        name: 'New Tournament',
        type: 'intra_school',
        startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000)
      });

      const stats = await tournamentService.getPlayerStatistics(
        newTournament.tournamentId
      );

      expect(stats).toHaveLength(0);
    });
  });

  describe('updateTournamentStatus', () => {
    let tournament: Tournament;

    beforeEach(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      tournament = await tournamentService.createTournament({
        sportId: testSport.sportId,
        name: 'Test Tournament',
        type: 'intra_school',
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 14 * 24 * 60 * 60 * 1000)
      });
    });

    it('should update tournament status', async () => {
      const updated = await tournamentService.updateTournamentStatus(
        tournament.tournamentId,
        'ongoing'
      );

      expect(updated.status).toBe('ongoing');
    });

    it('should not allow changing status of completed tournament', async () => {
      await tournamentService.updateTournamentStatus(
        tournament.tournamentId,
        'completed'
      );

      await expect(
        tournamentService.updateTournamentStatus(tournament.tournamentId, 'ongoing')
      ).rejects.toThrow('Cannot change status of a completed tournament');
    });

    it('should not allow changing status of cancelled tournament', async () => {
      await tournamentService.updateTournamentStatus(
        tournament.tournamentId,
        'cancelled'
      );

      await expect(
        tournamentService.updateTournamentStatus(tournament.tournamentId, 'ongoing')
      ).rejects.toThrow('Cannot change status of a cancelled tournament');
    });
  });

  describe('uploadPhotos', () => {
    let tournament: Tournament;

    beforeEach(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      tournament = await tournamentService.createTournament({
        sportId: testSport.sportId,
        name: 'Test Tournament',
        type: 'intra_school',
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 14 * 24 * 60 * 60 * 1000)
      });
    });

    it('should upload photos to tournament', async () => {
      const photoUrls = [
        'https://example.com/photo1.jpg',
        'https://example.com/photo2.jpg'
      ];

      const updated = await tournamentService.uploadPhotos(
        tournament.tournamentId,
        photoUrls
      );

      expect(updated.photos).toHaveLength(2);
      expect(updated.photos).toContain(photoUrls[0]);
      expect(updated.photos).toContain(photoUrls[1]);
    });
  });

  describe('uploadVideos', () => {
    let tournament: Tournament;

    beforeEach(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      tournament = await tournamentService.createTournament({
        sportId: testSport.sportId,
        name: 'Test Tournament',
        type: 'intra_school',
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 14 * 24 * 60 * 60 * 1000)
      });
    });

    it('should upload videos to tournament', async () => {
      const videoUrls = ['https://example.com/video1.mp4'];

      const updated = await tournamentService.uploadVideos(
        tournament.tournamentId,
        videoUrls
      );

      expect(updated.videos).toHaveLength(1);
      expect(updated.videos).toContain(videoUrls[0]);
    });
  });

  describe('deleteTournament', () => {
    it('should delete tournament', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const tournament = await tournamentService.createTournament({
        sportId: testSport.sportId,
        name: 'Test Tournament',
        type: 'intra_school',
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 14 * 24 * 60 * 60 * 1000)
      });

      const deleted = await tournamentService.deleteTournament(
        tournament.tournamentId
      );

      expect(deleted).toBe(true);

      const found = await tournamentService.getTournamentById(
        tournament.tournamentId
      );
      expect(found).toBeNull();
    });

    it('should not allow deletion of completed tournament', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const tournament = await tournamentService.createTournament({
        sportId: testSport.sportId,
        name: 'Test Tournament',
        type: 'intra_school',
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 14 * 24 * 60 * 60 * 1000)
      });

      await tournamentService.updateTournamentStatus(
        tournament.tournamentId,
        'completed'
      );

      await expect(
        tournamentService.deleteTournament(tournament.tournamentId)
      ).rejects.toThrow('Cannot delete a completed tournament');
    });
  });
});
