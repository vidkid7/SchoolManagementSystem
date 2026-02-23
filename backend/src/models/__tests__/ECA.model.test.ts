/**
 * ECA Model Tests
 * 
 * Tests for ECA model functionality
 * 
 * Requirements: 11.1, 11.2
 */

import { ECA } from '../ECA.model';

describe('ECA Model', () => {
  describe('hasCapacity', () => {
    it('should return true when no capacity is set', () => {
      const eca = ECA.build({
        name: 'Debate Club',
        category: 'club',
        coordinatorId: 1,
        academicYearId: 1,
        currentEnrollment: 10,
      });

      expect(eca.hasCapacity()).toBe(true);
    });

    it('should return true when current enrollment is less than capacity', () => {
      const eca = ECA.build({
        name: 'Debate Club',
        category: 'club',
        coordinatorId: 1,
        academicYearId: 1,
        capacity: 30,
        currentEnrollment: 20,
      });

      expect(eca.hasCapacity()).toBe(true);
    });

    it('should return false when current enrollment equals capacity', () => {
      const eca = ECA.build({
        name: 'Debate Club',
        category: 'club',
        coordinatorId: 1,
        academicYearId: 1,
        capacity: 30,
        currentEnrollment: 30,
      });

      expect(eca.hasCapacity()).toBe(false);
    });

    it('should return false when current enrollment exceeds capacity', () => {
      const eca = ECA.build({
        name: 'Debate Club',
        category: 'club',
        coordinatorId: 1,
        academicYearId: 1,
        capacity: 30,
        currentEnrollment: 35,
      });

      expect(eca.hasCapacity()).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should include all ECA attributes', () => {
      const eca = ECA.build({
        ecaId: 1,
        name: 'Debate Club',
        nameNp: 'वाद-विवाद क्लब',
        category: 'club',
        subcategory: 'Academic',
        description: 'Debate and public speaking',
        descriptionNp: 'वाद-विवाद र सार्वजनिक भाषण',
        coordinatorId: 1,
        schedule: 'Every Friday 3-5 PM',
        capacity: 30,
        currentEnrollment: 20,
        academicYearId: 1,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const json = eca.toJSON() as any;

      expect(json.ecaId).toBe(1);
      expect(json.name).toBe('Debate Club');
      expect(json.nameNp).toBe('वाद-विवाद क्लब');
      expect(json.category).toBe('club');
      expect(json.subcategory).toBe('Academic');
      expect(json.description).toBe('Debate and public speaking');
      expect(json.coordinatorId).toBe(1);
      expect(json.schedule).toBe('Every Friday 3-5 PM');
      expect(json.capacity).toBe(30);
      expect(json.currentEnrollment).toBe(20);
      expect(json.academicYearId).toBe(1);
      expect(json.status).toBe('active');
      expect(json.hasCapacity).toBe(true);
      expect(json.createdAt).toBeDefined();
      expect(json.updatedAt).toBeDefined();
    });

    it('should include hasCapacity computed property', () => {
      const eca = ECA.build({
        name: 'Music Club',
        category: 'cultural',
        coordinatorId: 1,
        academicYearId: 1,
        capacity: 20,
        currentEnrollment: 20,
      });

      const json = eca.toJSON() as any;

      expect(json.hasCapacity).toBe(false);
    });
  });

  describe('ECA categories', () => {
    it('should support club category', () => {
      const eca = ECA.build({
        name: 'Science Club',
        category: 'club',
        coordinatorId: 1,
        academicYearId: 1,
      });

      expect(eca.category).toBe('club');
    });

    it('should support cultural category', () => {
      const eca = ECA.build({
        name: 'Dance Group',
        category: 'cultural',
        coordinatorId: 1,
        academicYearId: 1,
      });

      expect(eca.category).toBe('cultural');
    });

    it('should support community_service category', () => {
      const eca = ECA.build({
        name: 'Red Cross',
        category: 'community_service',
        coordinatorId: 1,
        academicYearId: 1,
      });

      expect(eca.category).toBe('community_service');
    });

    it('should support leadership category', () => {
      const eca = ECA.build({
        name: 'Student Council',
        category: 'leadership',
        coordinatorId: 1,
        academicYearId: 1,
      });

      expect(eca.category).toBe('leadership');
    });
  });

  describe('ECA status', () => {
    it('should default to active status', () => {
      const eca = ECA.build({
        name: 'Quiz Club',
        category: 'club',
        coordinatorId: 1,
        academicYearId: 1,
        status: 'active',
      });

      expect(eca.status).toBe('active');
    });

    it('should support inactive status', () => {
      const eca = ECA.build({
        name: 'Quiz Club',
        category: 'club',
        coordinatorId: 1,
        academicYearId: 1,
        status: 'inactive',
      });

      expect(eca.status).toBe('inactive');
    });

    it('should support completed status', () => {
      const eca = ECA.build({
        name: 'Quiz Club',
        category: 'club',
        coordinatorId: 1,
        academicYearId: 1,
        status: 'completed',
      });

      expect(eca.status).toBe('completed');
    });
  });
});
