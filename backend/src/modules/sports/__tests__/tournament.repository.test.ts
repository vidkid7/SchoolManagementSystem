/**
 * Tournament Repository Tests
 * 
 * Tests for tournament data access layer
 * 
 * Requirements: 12.5, 12.6
 */

import tournamentRepository from '../tournament.repository';
import Tournament from '@models/Tournament.model';
import Sport from '@models/Sport.model';
import Team from '@models/Team.model';
import { sequelize } from '@config/database';

describe('Tournament Repository', () => {
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

  describe('create', () => {
    it('should create a tournament with all required fields', async () => {
      const tournamentData = {
        sportId: testSport.sportId,
        name: 'Inter-School Football Championship',
        type: 'inter_school' as const,
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-03-15'),
        venue: 'School Ground',
        status: 'scheduled' as const,
        teams: [],
        participants: [],
        schedule: []
      };

      const tournament = await tournamentRepository.create(tournamentData);

      expect(tournament).toBeDefined();
      expect(tournament.tournamentId).toBeDefined();
      expect(tournament.name).toBe(tournamentData.name);
      expect(tournament.sportId).toBe(testSport.sportId);
      expect(tournament.type).toBe('inter_school');
      expect(tournament.status).toBe('scheduled');
      expect(tournament.venue).toBe('School Ground');
    });

    it('should create tournament with Nepali fields', async () => {
      const tournamentData = {
        sportId: testSport.sportId,
        name: 'Football Tournament',
        nameNp: 'फुटबल प्रतियोगिता',
        type: 'intra_school' as const,
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-03-15'),
        venueNp: 'विद्यालय मैदान',
        status: 'scheduled' as const,
        teams: [],
        participants: [],
        schedule: []
      };

      const tournament = await tournamentRepository.create(tournamentData);

      expect(tournament.nameNp).toBe('फुटबल प्रतियोगिता');
      expect(tournament.venueNp).toBe('विद्यालय मैदान');
    });
  });

  describe('findById', () => {
    it('should find tournament by ID', async () => {
      const created = await tournamentRepository.create({
        sportId: testSport.sportId,
        name: 'Test Tournament',
        type: 'intra_school',
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-03-15'),
        status: 'scheduled',
        teams: [],
        participants: [],
        schedule: []
      });

      const found = await tournamentRepository.findById(created.tournamentId);

      expect(found).toBeDefined();
      expect(found?.tournamentId).toBe(created.tournamentId);
      expect(found?.name).toBe('Test Tournament');
    });

    it('should return null for non-existent tournament', async () => {
      const found = await tournamentRepository.findById(99999);
      expect(found).toBeNull();
    });
  });

  describe('findBySport', () => {
    it('should find all tournaments for a sport', async () => {
      await tournamentRepository.create({
        sportId: testSport.sportId,
        name: 'Tournament 1',
        type: 'intra_school',
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-03-15'),
        status: 'scheduled',
        teams: [],
        participants: [],
        schedule: []
      });

      await tournamentRepository.create({
        sportId: testSport.sportId,
        name: 'Tournament 2',
        type: 'inter_school',
        startDate: new Date('2025-04-01'),
        endDate: new Date('2025-04-15'),
        status: 'ongoing',
        teams: [],
        participants: [],
        schedule: []
      });

      const tournaments = await tournamentRepository.findBySport(testSport.sportId);

      expect(tournaments).toHaveLength(2);
      expect(tournaments[0].sportId).toBe(testSport.sportId);
    });

    it('should filter tournaments by status', async () => {
      await tournamentRepository.create({
        sportId: testSport.sportId,
        name: 'Scheduled Tournament',
        type: 'intra_school',
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-03-15'),
        status: 'scheduled',
        teams: [],
        participants: [],
        schedule: []
      });

      await tournamentRepository.create({
        sportId: testSport.sportId,
        name: 'Ongoing Tournament',
        type: 'inter_school',
        startDate: new Date('2025-04-01'),
        endDate: new Date('2025-04-15'),
        status: 'ongoing',
        teams: [],
        participants: [],
        schedule: []
      });

      const scheduled = await tournamentRepository.findBySport(
        testSport.sportId,
        'scheduled'
      );

      expect(scheduled).toHaveLength(1);
      expect(scheduled[0].status).toBe('scheduled');
    });
  });

  describe('addTeam', () => {
    it('should add team to tournament', async () => {
      const tournament = await tournamentRepository.create({
        sportId: testSport.sportId,
        name: 'Test Tournament',
        type: 'intra_school',
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-03-15'),
        status: 'scheduled',
        teams: [],
        participants: [],
        schedule: []
      });

      const updated = await tournamentRepository.addTeam(
        tournament.tournamentId,
        testTeam1.teamId
      );

      expect(updated).toBeDefined();
      expect(updated?.teams).toContain(testTeam1.teamId);
      expect(updated?.getTeamCount()).toBe(1);
    });

    it('should not add duplicate teams', async () => {
      const tournament = await tournamentRepository.create({
        sportId: testSport.sportId,
        name: 'Test Tournament',
        type: 'intra_school',
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-03-15'),
        status: 'scheduled',
        teams: [],
        participants: [],
        schedule: []
      });

      await tournamentRepository.addTeam(tournament.tournamentId, testTeam1.teamId);
      const updated = await tournamentRepository.addTeam(
        tournament.tournamentId,
        testTeam1.teamId
      );

      expect(updated?.getTeamCount()).toBe(1);
    });
  });

  describe('addParticipant', () => {
    it('should add participant to tournament', async () => {
      const tournament = await tournamentRepository.create({
        sportId: testSport.sportId,
        name: 'Test Tournament',
        type: 'intra_school',
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-03-15'),
        status: 'scheduled',
        teams: [],
        participants: [],
        schedule: []
      });

      const updated = await tournamentRepository.addParticipant(
        tournament.tournamentId,
        101
      );

      expect(updated).toBeDefined();
      expect(updated?.participants).toContain(101);
      expect(updated?.getParticipantCount()).toBe(1);
    });
  });

  describe('addMatch', () => {
    it('should add match to tournament schedule', async () => {
      const tournament = await tournamentRepository.create({
        sportId: testSport.sportId,
        name: 'Test Tournament',
        type: 'intra_school',
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-03-15'),
        status: 'scheduled',
        teams: [testTeam1.teamId, testTeam2.teamId],
        participants: [],
        schedule: []
      });

      const match = {
        matchId: 'M001',
        date: '2025-03-05',
        team1Id: testTeam1.teamId,
        team2Id: testTeam2.teamId
      };

      const updated = await tournamentRepository.addMatch(
        tournament.tournamentId,
        match
      );

      expect(updated).toBeDefined();
      expect(updated?.schedule).toHaveLength(1);
      expect(updated?.schedule?.[0].matchId).toBe('M001');
      expect(updated?.getMatchCount()).toBe(1);
    });
  });

  describe('updateMatchResult', () => {
    it('should update match result with scores and winner', async () => {
      const tournament = await tournamentRepository.create({
        sportId: testSport.sportId,
        name: 'Test Tournament',
        type: 'intra_school',
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-03-15'),
        status: 'scheduled',
        teams: [testTeam1.teamId, testTeam2.teamId],
        participants: [],
        schedule: [
          {
            matchId: 'M001',
            date: '2025-03-05',
            team1Id: testTeam1.teamId,
            team2Id: testTeam2.teamId
          }
        ]
      });

      const result = {
        score1: '3',
        score2: '1',
        winnerId: testTeam1.teamId,
        remarks: 'Great match'
      };

      const updated = await tournamentRepository.updateMatchResult(
        tournament.tournamentId,
        'M001',
        result
      );

      expect(updated).toBeDefined();
      expect(updated?.schedule?.[0].score1).toBe('3');
      expect(updated?.schedule?.[0].score2).toBe('1');
      expect(updated?.schedule?.[0].winnerId).toBe(testTeam1.teamId);
      expect(updated?.schedule?.[0].remarks).toBe('Great match');
    });

    it('should throw error for non-existent match', async () => {
      const tournament = await tournamentRepository.create({
        sportId: testSport.sportId,
        name: 'Test Tournament',
        type: 'intra_school',
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-03-15'),
        status: 'scheduled',
        teams: [],
        participants: [],
        schedule: []
      });

      await expect(
        tournamentRepository.updateMatchResult(tournament.tournamentId, 'M999', {
          score1: '1',
          score2: '0'
        })
      ).rejects.toThrow('Match with ID M999 not found');
    });
  });

  describe('findUpcoming', () => {
    it('should find upcoming tournaments', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      await tournamentRepository.create({
        sportId: testSport.sportId,
        name: 'Upcoming Tournament',
        type: 'intra_school',
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 14 * 24 * 60 * 60 * 1000),
        status: 'scheduled',
        teams: [],
        participants: [],
        schedule: []
      });

      const upcoming = await tournamentRepository.findUpcoming(10);

      expect(upcoming.length).toBeGreaterThan(0);
      expect(upcoming[0].name).toBe('Upcoming Tournament');
    });
  });

  describe('findWithPagination', () => {
    it('should return paginated tournaments', async () => {
      // Create multiple tournaments
      for (let i = 1; i <= 5; i++) {
        await tournamentRepository.create({
          sportId: testSport.sportId,
          name: `Tournament ${i}`,
          type: 'intra_school',
          startDate: new Date('2025-03-01'),
          endDate: new Date('2025-03-15'),
          status: 'scheduled',
          teams: [],
          participants: [],
          schedule: []
        });
      }

      const result = await tournamentRepository.findWithPagination({}, 1, 3);

      expect(result.tournaments).toHaveLength(3);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(3);
      expect(result.pagination.total).toBe(5);
      expect(result.pagination.totalPages).toBe(2);
    });

    it('should filter tournaments by type', async () => {
      await tournamentRepository.create({
        sportId: testSport.sportId,
        name: 'Inter-School Tournament',
        type: 'inter_school',
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-03-15'),
        status: 'scheduled',
        teams: [],
        participants: [],
        schedule: []
      });

      await tournamentRepository.create({
        sportId: testSport.sportId,
        name: 'Intra-School Tournament',
        type: 'intra_school',
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-03-15'),
        status: 'scheduled',
        teams: [],
        participants: [],
        schedule: []
      });

      const result = await tournamentRepository.findWithPagination(
        { type: 'inter_school' },
        1,
        10
      );

      expect(result.tournaments).toHaveLength(1);
      expect(result.tournaments[0].type).toBe('inter_school');
    });
  });

  describe('getTournamentStats', () => {
    it('should calculate tournament statistics', async () => {
      await tournamentRepository.create({
        sportId: testSport.sportId,
        name: 'Tournament 1',
        type: 'intra_school',
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-03-15'),
        status: 'scheduled',
        teams: [],
        participants: [],
        schedule: [
          { matchId: 'M1', date: '2025-03-05' },
          { matchId: 'M2', date: '2025-03-06' }
        ]
      });

      await tournamentRepository.create({
        sportId: testSport.sportId,
        name: 'Tournament 2',
        type: 'inter_school',
        startDate: new Date('2025-04-01'),
        endDate: new Date('2025-04-15'),
        status: 'ongoing',
        teams: [],
        participants: [],
        schedule: [{ matchId: 'M3', date: '2025-04-05' }]
      });

      const stats = await tournamentRepository.getTournamentStats(testSport.sportId);

      expect(stats.total).toBe(2);
      expect(stats.scheduled).toBe(1);
      expect(stats.ongoing).toBe(1);
      expect(stats.totalMatches).toBe(3);
      expect(stats.averageMatches).toBe(1.5);
    });
  });

  describe('update', () => {
    it('should update tournament details', async () => {
      const tournament = await tournamentRepository.create({
        sportId: testSport.sportId,
        name: 'Original Name',
        type: 'intra_school',
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-03-15'),
        status: 'scheduled',
        teams: [],
        participants: [],
        schedule: []
      });

      const updated = await tournamentRepository.update(tournament.tournamentId, {
        name: 'Updated Name',
        venue: 'New Venue'
      });

      expect(updated?.name).toBe('Updated Name');
      expect(updated?.venue).toBe('New Venue');
    });
  });

  describe('delete', () => {
    it('should delete tournament', async () => {
      const tournament = await tournamentRepository.create({
        sportId: testSport.sportId,
        name: 'Test Tournament',
        type: 'intra_school',
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-03-15'),
        status: 'scheduled',
        teams: [],
        participants: [],
        schedule: []
      });

      const deleted = await tournamentRepository.delete(tournament.tournamentId);

      expect(deleted).toBe(true);

      const found = await tournamentRepository.findById(tournament.tournamentId);
      expect(found).toBeNull();
    });
  });
});
