/**
 * Team Model Tests
 * 
 * Tests for Team model functionality
 * 
 * Requirements: 12.2, 12.3
 */

import { Sequelize } from 'sequelize';
import { Team, initTeam } from '../Team.model';

describe('Team Model', () => {
  let sequelize: Sequelize;

  beforeAll(() => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    initTeam(sequelize);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Model Definition', () => {
    it('should define Team model with correct attributes', () => {
      expect(Team.name).toBe('Team');
      
      const attributes = Team.getAttributes();
      expect(attributes).toHaveProperty('teamId');
      expect(attributes).toHaveProperty('sportId');
      expect(attributes).toHaveProperty('name');
      expect(attributes).toHaveProperty('nameNp');
      expect(attributes).toHaveProperty('captainId');
      expect(attributes).toHaveProperty('members');
      expect(attributes).toHaveProperty('coachId');
      expect(attributes).toHaveProperty('academicYearId');
      expect(attributes).toHaveProperty('status');
      expect(attributes).toHaveProperty('remarks');
    });
  });

  describe('Member Management', () => {
    it('should add members to team', () => {
      const team = Team.build({
        sportId: 1,
        name: 'School Football Team',
        academicYearId: 1,
        members: [],
      });

      team.addMember(101);
      team.addMember(102);
      team.addMember(103);

      expect(team.members).toHaveLength(3);
      expect(team.members).toContain(101);
      expect(team.members).toContain(102);
      expect(team.members).toContain(103);
    });

    it('should not add duplicate members', () => {
      const team = Team.build({
        sportId: 1,
        name: 'School Cricket Team',
        academicYearId: 1,
        members: [101, 102],
      });

      team.addMember(101);

      expect(team.members).toHaveLength(2);
      expect(team.members.filter(id => id === 101)).toHaveLength(1);
    });

    it('should remove members from team', () => {
      const team = Team.build({
        sportId: 1,
        name: 'School Basketball Team',
        academicYearId: 1,
        members: [101, 102, 103],
      });

      team.removeMember(102);

      expect(team.members).toHaveLength(2);
      expect(team.members).not.toContain(102);
      expect(team.members).toContain(101);
      expect(team.members).toContain(103);
    });

    it('should clear captain when captain is removed from team', () => {
      const team = Team.build({
        sportId: 1,
        name: 'School Volleyball Team',
        academicYearId: 1,
        members: [101, 102, 103],
        captainId: 102,
      });

      team.removeMember(102);

      expect(team.members).not.toContain(102);
      expect(team.captainId).toBeUndefined();
    });

    it('should check if student is a member', () => {
      const team = Team.build({
        sportId: 1,
        name: 'School Badminton Team',
        academicYearId: 1,
        members: [101, 102, 103],
      });

      expect(team.isMember(101)).toBe(true);
      expect(team.isMember(102)).toBe(true);
      expect(team.isMember(999)).toBe(false);
    });

    it('should get correct member count', () => {
      const team = Team.build({
        sportId: 1,
        name: 'School Hockey Team',
        academicYearId: 1,
        members: [101, 102, 103, 104, 105],
      });

      expect(team.getMemberCount()).toBe(5);
    });
  });

  describe('Captain Management', () => {
    it('should set captain from team members', () => {
      const team = Team.build({
        sportId: 1,
        name: 'School Football Team',
        academicYearId: 1,
        members: [101, 102, 103],
      });

      const result = team.setCaptain(102);

      expect(result).toBe(true);
      expect(team.captainId).toBe(102);
    });

    it('should not set captain if not a team member', () => {
      const team = Team.build({
        sportId: 1,
        name: 'School Cricket Team',
        academicYearId: 1,
        members: [101, 102, 103],
      });

      const result = team.setCaptain(999);

      expect(result).toBe(false);
      expect(team.captainId).toBeUndefined();
    });

    it('should check if team has captain', () => {
      const teamWithCaptain = Team.build({
        sportId: 1,
        name: 'Team A',
        academicYearId: 1,
        members: [101, 102],
        captainId: 101,
      });

      const teamWithoutCaptain = Team.build({
        sportId: 1,
        name: 'Team B',
        academicYearId: 1,
        members: [103, 104],
      });

      expect(teamWithCaptain.hasCaptain()).toBe(true);
      expect(teamWithoutCaptain.hasCaptain()).toBe(false);
    });
  });

  describe('toJSON Method', () => {
    it('should return correct JSON representation', () => {
      const team = Team.build({
        teamId: 1,
        sportId: 1,
        name: 'School Football Team',
        nameNp: 'विद्यालय फुटबल टोली',
        captainId: 101,
        members: [101, 102, 103, 104],
        coachId: 5,
        academicYearId: 1,
        status: 'active',
      });

      const json = team.toJSON();
      
      expect(json).toHaveProperty('teamId', 1);
      expect(json).toHaveProperty('name', 'School Football Team');
      expect(json).toHaveProperty('nameNp', 'विद्यालय फुटबल टोली');
      expect(json).toHaveProperty('captainId', 101);
      expect(json).toHaveProperty('members');
      expect(json).toHaveProperty('memberCount', 4);
      expect(json).toHaveProperty('hasCaptain', true);
    });

    it('should include helper method results in JSON', () => {
      const team = Team.build({
        sportId: 1,
        name: 'Test Team',
        academicYearId: 1,
        members: [101, 102],
      });

      const json = team.toJSON();
      
      expect(json).toHaveProperty('memberCount');
      expect(json).toHaveProperty('hasCaptain');
    });
  });

  describe('Default Values', () => {
    it('should set default status to active', () => {
      const team = Team.build({
        sportId: 1,
        name: 'Test Team',
        academicYearId: 1,
      });

      expect(team.status).toBe('active');
    });

    it('should initialize members as empty array', () => {
      const team = Team.build({
        sportId: 1,
        name: 'Test Team',
        academicYearId: 1,
      });

      expect(team.members).toEqual([]);
    });
  });

  describe('Bilingual Support', () => {
    it('should support Nepali team names', () => {
      const team = Team.build({
        sportId: 1,
        name: 'Red Team',
        nameNp: 'रातो टोली',
        academicYearId: 1,
        members: [],
      });

      expect(team.name).toBe('Red Team');
      expect(team.nameNp).toBe('रातो टोली');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty members array', () => {
      const team = Team.build({
        sportId: 1,
        name: 'Empty Team',
        academicYearId: 1,
        members: [],
      });

      expect(team.getMemberCount()).toBe(0);
      expect(team.isMember(101)).toBe(false);
    });

    it('should handle removing non-existent member', () => {
      const team = Team.build({
        sportId: 1,
        name: 'Test Team',
        academicYearId: 1,
        members: [101, 102],
      });

      team.removeMember(999);

      expect(team.members).toHaveLength(2);
      expect(team.members).toContain(101);
      expect(team.members).toContain(102);
    });
  });
});
