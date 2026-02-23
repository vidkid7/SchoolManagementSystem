/**
 * ECA Achievement Model Tests
 * 
 * Tests for ECA achievement model functionality
 * 
 * Requirements: 11.7, 11.8, 11.9
 */

import { ECAAchievement } from '../ECAAchievement.model';

describe('ECAAchievement Model', () => {
  describe('isHighLevel', () => {
    it('should return true for national level', () => {
      const achievement = ECAAchievement.build({
        ecaId: 1,
        studentId: 1,
        title: 'National Debate Champion',
        type: 'award',
        level: 'national',
        achievementDate: new Date(),
      });

      expect(achievement.isHighLevel()).toBe(true);
    });

    it('should return true for international level', () => {
      const achievement = ECAAchievement.build({
        ecaId: 1,
        studentId: 1,
        title: 'International Science Fair',
        type: 'award',
        level: 'international',
        achievementDate: new Date(),
      });

      expect(achievement.isHighLevel()).toBe(true);
    });

    it('should return false for school level', () => {
      const achievement = ECAAchievement.build({
        ecaId: 1,
        studentId: 1,
        title: 'School Quiz Winner',
        type: 'award',
        level: 'school',
        achievementDate: new Date(),
      });

      expect(achievement.isHighLevel()).toBe(false);
    });
  });

  describe('getDisplayTitle', () => {
    it('should return title with position when position is set', () => {
      const achievement = ECAAchievement.build({
        ecaId: 1,
        studentId: 1,
        title: 'Debate Competition',
        type: 'position',
        level: 'school',
        position: '1st Place',
        achievementDate: new Date(),
      });

      expect(achievement.getDisplayTitle()).toBe('Debate Competition - 1st Place');
    });

    it('should return only title when position is not set', () => {
      const achievement = ECAAchievement.build({
        ecaId: 1,
        studentId: 1,
        title: 'Best Participant Award',
        type: 'award',
        level: 'school',
        achievementDate: new Date(),
      });

      expect(achievement.getDisplayTitle()).toBe('Best Participant Award');
    });
  });

  describe('toJSON', () => {
    it('should include all achievement attributes', () => {
      const achievementDate = new Date('2024-03-20');
      const achievement = ECAAchievement.build({
        achievementId: 1,
        ecaId: 1,
        studentId: 1,
        eventId: 1,
        title: 'National Debate Champion',
        titleNp: 'राष्ट्रिय वाद-विवाद च्याम्पियन',
        type: 'award',
        level: 'national',
        position: '1st Place',
        description: 'Won national debate championship',
        achievementDate,
        achievementDateBS: '2080-12-07',
        certificateUrl: 'cert.pdf',
        photoUrl: 'photo.jpg',
        remarks: 'Outstanding performance',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const json = achievement.toJSON() as any;

      expect(json.achievementId).toBe(1);
      expect(json.ecaId).toBe(1);
      expect(json.studentId).toBe(1);
      expect(json.title).toBe('National Debate Champion');
      expect(json.displayTitle).toBe('National Debate Champion - 1st Place');
      expect(json.type).toBe('award');
      expect(json.level).toBe('national');
      expect(json.isHighLevel).toBe(true);
    });
  });

  describe('achievement types', () => {
    it('should support all achievement types', () => {
      const types: Array<'award' | 'medal' | 'certificate' | 'recognition' | 'position'> = [
        'award',
        'medal',
        'certificate',
        'recognition',
        'position',
      ];

      types.forEach((type) => {
        const achievement = ECAAchievement.build({
          ecaId: 1,
          studentId: 1,
          title: `${type} Achievement`,
          type,
          level: 'school',
          achievementDate: new Date(),
        });

        expect(achievement.type).toBe(type);
      });
    });
  });

  describe('achievement levels', () => {
    it('should support all five levels', () => {
      const levels: Array<'school' | 'district' | 'regional' | 'national' | 'international'> = [
        'school',
        'district',
        'regional',
        'national',
        'international',
      ];

      levels.forEach((level) => {
        const achievement = ECAAchievement.build({
          ecaId: 1,
          studentId: 1,
          title: `${level} Achievement`,
          type: 'award',
          level,
          achievementDate: new Date(),
        });

        expect(achievement.level).toBe(level);
      });
    });
  });
});
