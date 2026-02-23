/**
 * Sport Model Tests
 * 
 * Tests for Sport model functionality
 * 
 * Requirements: 12.1
 */

import { Sequelize } from 'sequelize';
import { Sport, initSport } from '../Sport.model';

describe('Sport Model', () => {
  let sequelize: Sequelize;

  beforeAll(() => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    initSport(sequelize);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Model Definition', () => {
    it('should define Sport model with correct attributes', () => {
      expect(Sport.name).toBe('Sport');
      
      const attributes = Sport.getAttributes();
      expect(attributes).toHaveProperty('sportId');
      expect(attributes).toHaveProperty('name');
      expect(attributes).toHaveProperty('nameNp');
      expect(attributes).toHaveProperty('category');
      expect(attributes).toHaveProperty('description');
      expect(attributes).toHaveProperty('descriptionNp');
      expect(attributes).toHaveProperty('coordinatorId');
      expect(attributes).toHaveProperty('academicYearId');
      expect(attributes).toHaveProperty('status');
    });

    it('should have correct category enum values', () => {
      const categoryAttr = Sport.getAttributes().category;
      expect(categoryAttr.type.toString({})).toContain('ENUM');
    });

    it('should have correct status enum values', () => {
      const statusAttr = Sport.getAttributes().status;
      expect(statusAttr.type.toString({})).toContain('ENUM');
    });
  });

  describe('Category Helper Methods', () => {
    it('should correctly identify team sports', () => {
      const sport = Sport.build({
        name: 'Football',
        category: 'team',
        coordinatorId: 1,
        academicYearId: 1,
      });

      expect(sport.isTeamSport()).toBe(true);
      expect(sport.isIndividualSport()).toBe(false);
      expect(sport.isTraditionalSport()).toBe(false);
    });

    it('should correctly identify individual sports', () => {
      const sport = Sport.build({
        name: 'Athletics',
        category: 'individual',
        coordinatorId: 1,
        academicYearId: 1,
      });

      expect(sport.isTeamSport()).toBe(false);
      expect(sport.isIndividualSport()).toBe(true);
      expect(sport.isTraditionalSport()).toBe(false);
    });

    it('should correctly identify traditional sports', () => {
      const sport = Sport.build({
        name: 'Kabaddi',
        category: 'traditional',
        coordinatorId: 1,
        academicYearId: 1,
      });

      expect(sport.isTeamSport()).toBe(false);
      expect(sport.isIndividualSport()).toBe(false);
      expect(sport.isTraditionalSport()).toBe(true);
    });
  });

  describe('toJSON Method', () => {
    it('should return correct JSON representation', () => {
      const sport = Sport.build({
        sportId: 1,
        name: 'Cricket',
        nameNp: 'क्रिकेट',
        category: 'team',
        description: 'Team sport',
        coordinatorId: 1,
        academicYearId: 1,
        status: 'active',
      });

      const json = sport.toJSON();
      
      expect(json).toHaveProperty('sportId', 1);
      expect(json).toHaveProperty('name', 'Cricket');
      expect(json).toHaveProperty('nameNp', 'क्रिकेट');
      expect(json).toHaveProperty('category', 'team');
      expect(json).toHaveProperty('isTeamSport', true);
      expect(json).toHaveProperty('isIndividualSport', false);
      expect(json).toHaveProperty('isTraditionalSport', false);
    });

    it('should include helper method results in JSON', () => {
      const sport = Sport.build({
        name: 'Table Tennis',
        category: 'individual',
        coordinatorId: 1,
        academicYearId: 1,
      });

      const json = sport.toJSON();
      
      expect(json).toHaveProperty('isTeamSport');
      expect(json).toHaveProperty('isIndividualSport');
      expect(json).toHaveProperty('isTraditionalSport');
    });
  });

  describe('Default Values', () => {
    it('should set default status to active', () => {
      const sport = Sport.build({
        name: 'Basketball',
        category: 'team',
        coordinatorId: 1,
        academicYearId: 1,
      });

      expect(sport.status).toBe('active');
    });
  });

  describe('Bilingual Support', () => {
    it('should support Nepali names', () => {
      const sport = Sport.build({
        name: 'Dandi Biyo',
        nameNp: 'डन्डी बियो',
        category: 'traditional',
        coordinatorId: 1,
        academicYearId: 1,
      });

      expect(sport.name).toBe('Dandi Biyo');
      expect(sport.nameNp).toBe('डन्डी बियो');
    });

    it('should support Nepali descriptions', () => {
      const sport = Sport.build({
        name: 'Volleyball',
        description: 'Team sport played with a ball',
        descriptionNp: 'बलसँग खेलिने टोली खेल',
        category: 'team',
        coordinatorId: 1,
        academicYearId: 1,
      });

      expect(sport.description).toBe('Team sport played with a ball');
      expect(sport.descriptionNp).toBe('बलसँग खेलिने टोली खेल');
    });
  });
});
