/**
 * Tournament Model Tests
 * 
 * Tests for Tournament model functionality
 * 
 * Requirements: 12.5, 12.6, 12.10
 */

import { Sequelize } from 'sequelize';
import { Tournament, initTournament, MatchResult } from '../Tournament.model';

describe('Tournament Model', () => {
  let sequelize: Sequelize;

  beforeAll(() => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    initTournament(sequelize);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Model Definition', () => {
    it('should define Tournament model with correct attributes', () => {
      expect(Tournament.name).toBe('Tournament');
      
      const attributes = Tournament.getAttributes();
      expect(attributes).toHaveProperty('tournamentId');
      expect(attributes).toHaveProperty('sportId');
      expect(attributes).toHaveProperty('name');
      expect(attributes).toHaveProperty('nameNp');
      expect(attributes).toHaveProperty('type');
      expect(attributes).toHaveProperty('startDate');
      expect(attributes).toHaveProperty('endDate');
      expect(attributes).toHaveProperty('venue');
      expect(attributes).toHaveProperty('teams');
      expect(attributes).toHaveProperty('participants');
      expect(attributes).toHaveProperty('schedule');
      expect(attributes).toHaveProperty('status');
    });
  });

  describe('Team Management', () => {
    it('should add teams to tournament', () => {
      const tournament = Tournament.build({
        sportId: 1,
        name: 'Inter-School Football Championship',
        type: 'inter_school',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-20'),
        teams: [],
      });

      tournament.addTeam(1);
      tournament.addTeam(2);
      tournament.addTeam(3);

      expect(tournament.teams).toHaveLength(3);
      expect(tournament.teams).toContain(1);
      expect(tournament.teams).toContain(2);
      expect(tournament.teams).toContain(3);
    });

    it('should not add duplicate teams', () => {
      const tournament = Tournament.build({
        sportId: 1,
        name: 'Cricket Tournament',
        type: 'intra_school',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-05'),
        teams: [1, 2],
      });

      tournament.addTeam(1);

      expect(tournament.teams).toHaveLength(2);
      expect(tournament.teams?.filter(id => id === 1)).toHaveLength(1);
    });

    it('should remove teams from tournament', () => {
      const tournament = Tournament.build({
        sportId: 1,
        name: 'Basketball League',
        type: 'intra_school',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-03-10'),
        teams: [1, 2, 3, 4],
      });

      tournament.removeTeam(2);

      expect(tournament.teams).toHaveLength(3);
      expect(tournament.teams).not.toContain(2);
    });

    it('should get correct team count', () => {
      const tournament = Tournament.build({
        sportId: 1,
        name: 'Volleyball Championship',
        type: 'district',
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-04-05'),
        teams: [1, 2, 3, 4, 5, 6],
      });

      expect(tournament.getTeamCount()).toBe(6);
    });
  });

  describe('Participant Management', () => {
    it('should add participants to tournament', () => {
      const tournament = Tournament.build({
        sportId: 2,
        name: 'Athletics Meet',
        type: 'intra_school',
        startDate: new Date('2024-05-01'),
        endDate: new Date('2024-05-03'),
        participants: [],
      });

      tournament.addParticipant(101);
      tournament.addParticipant(102);
      tournament.addParticipant(103);

      expect(tournament.participants).toHaveLength(3);
      expect(tournament.participants).toContain(101);
    });

    it('should not add duplicate participants', () => {
      const tournament = Tournament.build({
        sportId: 2,
        name: 'Table Tennis Championship',
        type: 'inter_school',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-02'),
        participants: [101, 102],
      });

      tournament.addParticipant(101);

      expect(tournament.participants).toHaveLength(2);
    });

    it('should remove participants from tournament', () => {
      const tournament = Tournament.build({
        sportId: 2,
        name: 'Badminton Tournament',
        type: 'district',
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-07-03'),
        participants: [101, 102, 103],
      });

      tournament.removeParticipant(102);

      expect(tournament.participants).toHaveLength(2);
      expect(tournament.participants).not.toContain(102);
    });

    it('should get correct participant count', () => {
      const tournament = Tournament.build({
        sportId: 2,
        name: 'Swimming Competition',
        type: 'regional',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2024-08-02'),
        participants: [101, 102, 103, 104, 105],
      });

      expect(tournament.getParticipantCount()).toBe(5);
    });
  });

  describe('Match Schedule Management', () => {
    it('should add matches to schedule', () => {
      const tournament = Tournament.build({
        sportId: 1,
        name: 'Football Tournament',
        type: 'intra_school',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2024-09-05'),
        schedule: [],
      });

      const match1: MatchResult = {
        matchId: 'M1',
        date: '2024-09-01',
        team1Id: 1,
        team2Id: 2,
      };

      const match2: MatchResult = {
        matchId: 'M2',
        date: '2024-09-02',
        team1Id: 3,
        team2Id: 4,
      };

      tournament.addMatch(match1);
      tournament.addMatch(match2);

      expect(tournament.schedule).toHaveLength(2);
      expect(tournament.schedule![0].matchId).toBe('M1');
      expect(tournament.schedule![1].matchId).toBe('M2');
    });

    it('should update match results', () => {
      const tournament = Tournament.build({
        sportId: 1,
        name: 'Cricket League',
        type: 'inter_school',
        startDate: new Date('2024-10-01'),
        endDate: new Date('2024-10-10'),
        schedule: [
          {
            matchId: 'M1',
            date: '2024-10-01',
            team1Id: 1,
            team2Id: 2,
          },
        ],
      });

      const result = tournament.updateMatchResult('M1', {
        score1: '150/8',
        score2: '145/10',
        winnerId: 1,
      });

      expect(result).toBe(true);
      expect(tournament.schedule![0].score1).toBe('150/8');
      expect(tournament.schedule![0].score2).toBe('145/10');
      expect(tournament.schedule![0].winnerId).toBe(1);
    });

    it('should return false when updating non-existent match', () => {
      const tournament = Tournament.build({
        sportId: 1,
        name: 'Test Tournament',
        type: 'intra_school',
        startDate: new Date('2024-11-01'),
        endDate: new Date('2024-11-05'),
        schedule: [],
      });

      const result = tournament.updateMatchResult('M999', {
        score1: '100',
        score2: '90',
      });

      expect(result).toBe(false);
    });

    it('should get correct match count', () => {
      const tournament = Tournament.build({
        sportId: 1,
        name: 'Basketball Championship',
        type: 'district',
        startDate: new Date('2024-12-01'),
        endDate: new Date('2024-12-10'),
        schedule: [
          { matchId: 'M1', date: '2024-12-01' },
          { matchId: 'M2', date: '2024-12-02' },
          { matchId: 'M3', date: '2024-12-03' },
        ],
      });

      expect(tournament.getMatchCount()).toBe(3);
    });
  });

  describe('Media Management', () => {
    it('should add photos to tournament', () => {
      const tournament = Tournament.build({
        sportId: 1,
        name: 'Test Tournament',
        type: 'intra_school',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        photos: [],
      });

      tournament.addPhoto('/uploads/photo1.jpg');
      tournament.addPhoto('/uploads/photo2.jpg');

      expect(tournament.photos).toHaveLength(2);
      expect(tournament.photos).toContain('/uploads/photo1.jpg');
    });

    it('should add videos to tournament', () => {
      const tournament = Tournament.build({
        sportId: 1,
        name: 'Test Tournament',
        type: 'intra_school',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        videos: [],
      });

      tournament.addVideo('/uploads/video1.mp4');
      tournament.addVideo('/uploads/video2.mp4');

      expect(tournament.videos).toHaveLength(2);
      expect(tournament.videos).toContain('/uploads/video1.mp4');
    });
  });

  describe('Tournament Type Identification', () => {
    it('should identify team tournaments', () => {
      const tournament = Tournament.build({
        sportId: 1,
        name: 'Football League',
        type: 'inter_school',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-10'),
        teams: [1, 2, 3],
      });

      expect(tournament.isTeamTournament()).toBe(true);
      expect(tournament.isIndividualTournament()).toBe(false);
    });

    it('should identify individual tournaments', () => {
      const tournament = Tournament.build({
        sportId: 2,
        name: 'Athletics Championship',
        type: 'district',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-03'),
        participants: [101, 102, 103],
      });

      expect(tournament.isTeamTournament()).toBe(false);
      expect(tournament.isIndividualTournament()).toBe(true);
    });
  });

  describe('toJSON Method', () => {
    it('should return correct JSON representation', () => {
      const tournament = Tournament.build({
        tournamentId: 1,
        sportId: 1,
        name: 'Inter-School Football Championship',
        nameNp: 'अन्तर-विद्यालय फुटबल च्याम्पियनशिप',
        type: 'inter_school',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-20'),
        venue: 'School Ground',
        teams: [1, 2, 3, 4],
        status: 'scheduled',
      });

      const json = tournament.toJSON();
      
      expect(json).toHaveProperty('tournamentId', 1);
      expect(json).toHaveProperty('name', 'Inter-School Football Championship');
      expect(json).toHaveProperty('teamCount', 4);
      expect(json).toHaveProperty('isTeamTournament', true);
      expect(json).toHaveProperty('isIndividualTournament', false);
    });
  });

  describe('Default Values', () => {
    it('should set default status to scheduled', () => {
      const tournament = Tournament.build({
        sportId: 1,
        name: 'Test Tournament',
        type: 'intra_school',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
      });

      expect(tournament.status).toBe('scheduled');
    });
  });

  describe('Bilingual Support', () => {
    it('should support Nepali tournament names and venues', () => {
      const tournament = Tournament.build({
        sportId: 1,
        name: 'National Football Championship',
        nameNp: 'राष्ट्रिय फुटबल च्याम्पियनशिप',
        type: 'national',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-10'),
        venue: 'Dasharath Stadium',
        venueNp: 'दशरथ रंगशाला',
      });

      expect(tournament.name).toBe('National Football Championship');
      expect(tournament.nameNp).toBe('राष्ट्रिय फुटबल च्याम्पियनशिप');
      expect(tournament.venue).toBe('Dasharath Stadium');
      expect(tournament.venueNp).toBe('दशरथ रंगशाला');
    });
  });
});
