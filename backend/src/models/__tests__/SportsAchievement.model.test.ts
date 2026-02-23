/**
 * Sports Achievement Model Tests
 * 
 * Tests for SportsAchievement model functionality
 * 
 * Requirements: 12.7, 12.8, 12.9, 12.11
 */

import { Sequelize } from 'sequelize';
import { SportsAchievement, initSportsAchievement } from '../SportsAchievement.model';

describe('SportsAchievement Model', () => {
  let sequelize: Sequelize;

  beforeAll(() => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    initSportsAchievement(sequelize);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Model Definition', () => {
    it('should define SportsAchievement model with correct attributes', () => {
      expect(SportsAchievement.name).toBe('SportsAchievement');
      
      const attributes = SportsAchievement.getAttributes();
      expect(attributes).toHaveProperty('achievementId');
      expect(attributes).toHaveProperty('sportId');
      expect(attributes).toHaveProperty('studentId');
      expect(attributes).toHaveProperty('teamId');
      expect(attributes).toHaveProperty('tournamentId');
      expect(attributes).toHaveProperty('title');
      expect(attributes).toHaveProperty('type');
      expect(attributes).toHaveProperty('level');
      expect(attributes).toHaveProperty('position');
      expect(attributes).toHaveProperty('medal');
      expect(attributes).toHaveProperty('recordType');
      expect(attributes).toHaveProperty('recordValue');
    });
  });

  describe('Level Identification', () => {
    it('should identify high-level achievements', () => {
      const nationalAchievement = SportsAchievement.build({
        sportId: 1,
        studentId: 101,
        title: 'National Football Championship',
        type: 'medal',
        level: 'national',
        achievementDate: new Date('2024-01-15'),
      });

      const internationalAchievement = SportsAchievement.build({
        sportId: 1,
        studentId: 102,
        title: 'SAFF Championship',
        type: 'medal',
        level: 'international',
        achievementDate: new Date('2024-02-20'),
      });

      expect(nationalAchievement.isHighLevel()).toBe(true);
      expect(internationalAchievement.isHighLevel()).toBe(true);
    });

    it('should identify non-high-level achievements', () => {
      const schoolAchievement = SportsAchievement.build({
        sportId: 1,
        studentId: 101,
        title: 'School Football Tournament',
        type: 'medal',
        level: 'school',
        achievementDate: new Date('2024-01-15'),
      });

      const districtAchievement = SportsAchievement.build({
        sportId: 1,
        studentId: 102,
        title: 'District Championship',
        type: 'medal',
        level: 'district',
        achievementDate: new Date('2024-02-20'),
      });

      expect(schoolAchievement.isHighLevel()).toBe(false);
      expect(districtAchievement.isHighLevel()).toBe(false);
    });
  });

  describe('Medal Identification', () => {
    it('should identify medal achievements', () => {
      const goldMedal = SportsAchievement.build({
        sportId: 1,
        studentId: 101,
        title: '100m Sprint',
        type: 'medal',
        level: 'national',
        medal: 'gold',
        achievementDate: new Date('2024-01-15'),
      });

      expect(goldMedal.isMedal()).toBe(true);
    });

    it('should not identify non-medal achievements as medals', () => {
      const certificate = SportsAchievement.build({
        sportId: 1,
        studentId: 101,
        title: 'Participation Certificate',
        type: 'certificate',
        level: 'school',
        achievementDate: new Date('2024-01-15'),
      });

      expect(certificate.isMedal()).toBe(false);
    });
  });

  describe('Record Identification', () => {
    it('should identify record achievements', () => {
      const record = SportsAchievement.build({
        sportId: 2,
        studentId: 101,
        title: 'School Record',
        type: 'record',
        level: 'school',
        recordType: '100m Sprint',
        recordValue: '10.5 seconds',
        achievementDate: new Date('2024-01-15'),
      });

      expect(record.isRecord()).toBe(true);
    });

    it('should not identify non-record achievements as records', () => {
      const medal = SportsAchievement.build({
        sportId: 1,
        studentId: 101,
        title: 'Gold Medal',
        type: 'medal',
        level: 'national',
        medal: 'gold',
        achievementDate: new Date('2024-01-15'),
      });

      expect(medal.isRecord()).toBe(false);
    });
  });

  describe('Team vs Individual Achievement', () => {
    it('should identify team achievements', () => {
      const teamAchievement = SportsAchievement.build({
        sportId: 1,
        studentId: 101,
        teamId: 5,
        title: 'Football Championship',
        type: 'trophy',
        level: 'inter_school',
        achievementDate: new Date('2024-01-15'),
      });

      expect(teamAchievement.isTeamAchievement()).toBe(true);
      expect(teamAchievement.isIndividualAchievement()).toBe(false);
    });

    it('should identify individual achievements', () => {
      const individualAchievement = SportsAchievement.build({
        sportId: 2,
        studentId: 101,
        title: '100m Sprint Gold',
        type: 'medal',
        level: 'national',
        medal: 'gold',
        achievementDate: new Date('2024-01-15'),
      });

      expect(individualAchievement.isTeamAchievement()).toBe(false);
      expect(individualAchievement.isIndividualAchievement()).toBe(true);
    });
  });

  describe('Display Title Generation', () => {
    it('should generate display title with medal', () => {
      const achievement = SportsAchievement.build({
        sportId: 2,
        studentId: 101,
        title: '100m Sprint',
        type: 'medal',
        level: 'national',
        medal: 'gold',
        achievementDate: new Date('2024-01-15'),
      });

      expect(achievement.getDisplayTitle()).toBe('Gold Medal - 100m Sprint');
    });

    it('should generate display title with position', () => {
      const achievement = SportsAchievement.build({
        sportId: 1,
        studentId: 101,
        title: 'Football Tournament',
        type: 'rank',
        level: 'district',
        position: '1st Place',
        achievementDate: new Date('2024-01-15'),
      });

      expect(achievement.getDisplayTitle()).toBe('Football Tournament - 1st Place');
    });

    it('should generate display title with record details', () => {
      const achievement = SportsAchievement.build({
        sportId: 2,
        studentId: 101,
        title: 'School Record',
        type: 'record',
        level: 'school',
        recordType: '100m Sprint',
        recordValue: '10.5 seconds',
        achievementDate: new Date('2024-01-15'),
      });

      expect(achievement.getDisplayTitle()).toBe('School Record (100m Sprint: 10.5 seconds)');
    });

    it('should generate simple display title without extras', () => {
      const achievement = SportsAchievement.build({
        sportId: 1,
        studentId: 101,
        title: 'Participation Certificate',
        type: 'certificate',
        level: 'school',
        achievementDate: new Date('2024-01-15'),
      });

      expect(achievement.getDisplayTitle()).toBe('Participation Certificate');
    });
  });

  describe('Medal Points Calculation', () => {
    it('should calculate correct points for gold medal', () => {
      const achievement = SportsAchievement.build({
        sportId: 1,
        studentId: 101,
        title: 'Championship',
        type: 'medal',
        level: 'national',
        medal: 'gold',
        achievementDate: new Date('2024-01-15'),
      });

      expect(achievement.getMedalPoints()).toBe(3);
    });

    it('should calculate correct points for silver medal', () => {
      const achievement = SportsAchievement.build({
        sportId: 1,
        studentId: 101,
        title: 'Championship',
        type: 'medal',
        level: 'national',
        medal: 'silver',
        achievementDate: new Date('2024-01-15'),
      });

      expect(achievement.getMedalPoints()).toBe(2);
    });

    it('should calculate correct points for bronze medal', () => {
      const achievement = SportsAchievement.build({
        sportId: 1,
        studentId: 101,
        title: 'Championship',
        type: 'medal',
        level: 'national',
        medal: 'bronze',
        achievementDate: new Date('2024-01-15'),
      });

      expect(achievement.getMedalPoints()).toBe(1);
    });

    it('should return 0 points for non-medal achievements', () => {
      const achievement = SportsAchievement.build({
        sportId: 1,
        studentId: 101,
        title: 'Certificate',
        type: 'certificate',
        level: 'school',
        achievementDate: new Date('2024-01-15'),
      });

      expect(achievement.getMedalPoints()).toBe(0);
    });
  });

  describe('toJSON Method', () => {
    it('should return correct JSON representation', () => {
      const achievement = SportsAchievement.build({
        achievementId: 1,
        sportId: 1,
        studentId: 101,
        teamId: 5,
        tournamentId: 10,
        title: 'Football Championship',
        titleNp: 'फुटबल च्याम्पियनशिप',
        type: 'trophy',
        level: 'inter_school',
        position: '1st Place',
        achievementDate: new Date('2024-01-15'),
      });

      const json = achievement.toJSON();
      
      expect(json).toHaveProperty('achievementId', 1);
      expect(json).toHaveProperty('title', 'Football Championship');
      expect(json).toHaveProperty('titleNp', 'फुटबल च्याम्पियनशिप');
      expect(json).toHaveProperty('displayTitle');
      expect(json).toHaveProperty('isHighLevel');
      expect(json).toHaveProperty('isMedal');
      expect(json).toHaveProperty('isRecord');
      expect(json).toHaveProperty('isTeamAchievement');
      expect(json).toHaveProperty('isIndividualAchievement');
      expect(json).toHaveProperty('medalPoints');
    });

    it('should include all helper method results in JSON', () => {
      const achievement = SportsAchievement.build({
        sportId: 2,
        studentId: 101,
        title: '100m Sprint Gold',
        type: 'medal',
        level: 'national',
        medal: 'gold',
        achievementDate: new Date('2024-01-15'),
      });

      const json = achievement.toJSON();
      
      expect(json).toHaveProperty('displayTitle');
      expect(json).toHaveProperty('isHighLevel', true);
      expect(json).toHaveProperty('isMedal', true);
      expect(json).toHaveProperty('isRecord', false);
      expect(json).toHaveProperty('medalPoints', 3);
    });
  });

  describe('Bilingual Support', () => {
    it('should support Nepali achievement titles', () => {
      const achievement = SportsAchievement.build({
        sportId: 1,
        studentId: 101,
        title: 'National Football Championship',
        titleNp: 'राष्ट्रिय फुटबल च्याम्पियनशिप',
        type: 'medal',
        level: 'national',
        medal: 'gold',
        achievementDate: new Date('2024-01-15'),
      });

      expect(achievement.title).toBe('National Football Championship');
      expect(achievement.titleNp).toBe('राष्ट्रिय फुटबल च्याम्पियनशिप');
    });

    it('should support Nepali descriptions', () => {
      const achievement = SportsAchievement.build({
        sportId: 1,
        studentId: 101,
        title: 'Gold Medal',
        description: 'Won gold medal in 100m sprint',
        descriptionNp: '१०० मिटर दौडमा स्वर्ण पदक जित्नुभयो',
        type: 'medal',
        level: 'national',
        medal: 'gold',
        achievementDate: new Date('2024-01-15'),
      });

      expect(achievement.description).toBe('Won gold medal in 100m sprint');
      expect(achievement.descriptionNp).toBe('१०० मिटर दौडमा स्वर्ण पदक जित्नुभयो');
    });
  });

  describe('Record Details', () => {
    it('should store record type and value', () => {
      const achievement = SportsAchievement.build({
        sportId: 2,
        studentId: 101,
        title: 'School Record',
        type: 'record',
        level: 'school',
        recordType: 'Long Jump',
        recordValue: '7.5 meters',
        achievementDate: new Date('2024-01-15'),
      });

      expect(achievement.recordType).toBe('Long Jump');
      expect(achievement.recordValue).toBe('7.5 meters');
    });
  });
});
