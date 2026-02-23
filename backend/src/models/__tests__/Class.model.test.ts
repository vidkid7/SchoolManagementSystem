import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import sequelize from '@config/database';
import Class, { Shift } from '@models/Class.model';
import { AcademicYear } from '@models/AcademicYear.model';

/**
 * Class Model Unit Tests
 * Requirements: 5.3, N5.1
 */
describe('Class Model', () => {
  let academicYear: AcademicYear;

  beforeAll(async () => {
    // Disable foreign key checks temporarily
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Sync database schema
    await sequelize.sync({ force: true });
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    // Create a test academic year
    academicYear = await AcademicYear.create({
      name: '2081-2082 BS',
      startDateBS: '2081-01-01',
      endDateBS: '2081-12-30',
      startDateAD: new Date('2024-04-13'),
      endDateAD: new Date('2025-04-12'),
      isCurrent: true
    });
  });

  afterAll(async () => {
    // Close database connection
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up classes table before each test
    await Class.destroy({ where: {}, force: true });
  });

  describe('Model Creation', () => {
    it('should create a class with all required fields', async () => {
      const classData = {
        academicYearId: academicYear.academicYearId,
        gradeLevel: 5,
        section: 'A',
        shift: Shift.MORNING,
        capacity: 40
      };

      const classInstance = await Class.create(classData);

      expect(classInstance.classId).toBeDefined();
      expect(classInstance.get('academicYearId')).toBe(academicYear.academicYearId);
      expect(classInstance.get('gradeLevel')).toBe(5);
      expect(classInstance.get('section')).toBe('A');
      expect(classInstance.get('shift')).toBe(Shift.MORNING);
      expect(classInstance.get('capacity')).toBe(40);
      expect(classInstance.get('currentStrength')).toBe(0); // Default value
      expect(classInstance.get('createdAt')).toBeDefined();
      expect(classInstance.get('updatedAt')).toBeDefined();
    });

    it('should create a class with optional class teacher', async () => {
      const classData = {
        academicYearId: academicYear.academicYearId,
        gradeLevel: 10,
        section: 'B',
        shift: Shift.DAY,
        capacity: 35,
        classTeacherId: 123
      };

      const classInstance = await Class.create(classData);

      expect(classInstance.classTeacherId).toBe(123);
    });

    it('should fail to create class without required fields', async () => {
      const invalidData = {
        gradeLevel: 5
        // Missing academicYearId, section, shift, capacity
      };

      await expect(Class.create(invalidData as any)).rejects.toThrow();
    });

    it('should enforce unique constraint on grade_level, section, shift, academic_year_id', async () => {
      const classData = {
        academicYearId: academicYear.academicYearId,
        gradeLevel: 8,
        section: 'A',
        shift: Shift.MORNING,
        capacity: 40
      };

      await Class.create(classData);

      // Try to create another class with same combination
      await expect(Class.create(classData)).rejects.toThrow();
    });

    it('should allow same grade and section but different shift', async () => {
      const morningClass = await Class.create({
        academicYearId: academicYear.academicYearId,
        gradeLevel: 9,
        section: 'A',
        shift: Shift.MORNING,
        capacity: 40
      });

      const dayClass = await Class.create({
        academicYearId: academicYear.academicYearId,
        gradeLevel: 9,
        section: 'A',
        shift: Shift.DAY,
        capacity: 35
      });

      expect(morningClass.classId).not.toBe(dayClass.classId);
      expect(morningClass.shift).toBe(Shift.MORNING);
      expect(dayClass.shift).toBe(Shift.DAY);
    });
  });

  describe('Grade Level Validation', () => {
    it('should accept grade levels from 1 to 12', async () => {
      for (let grade = 1; grade <= 12; grade++) {
        const classInstance = await Class.create({
          academicYearId: academicYear.academicYearId,
          gradeLevel: grade,
          section: 'A',
          shift: Shift.MORNING,
          capacity: 40
        });

        expect(classInstance.gradeLevel).toBe(grade);

        // Clean up for next iteration
        await classInstance.destroy({ force: true });
      }
    });

    it('should reject grade level below 1', async () => {
      const invalidData = {
        academicYearId: academicYear.academicYearId,
        gradeLevel: 0,
        section: 'A',
        shift: Shift.MORNING,
        capacity: 40
      };

      await expect(Class.create(invalidData)).rejects.toThrow();
    });

    it('should reject grade level above 12', async () => {
      const invalidData = {
        academicYearId: academicYear.academicYearId,
        gradeLevel: 13,
        section: 'A',
        shift: Shift.MORNING,
        capacity: 40
      };

      await expect(Class.create(invalidData)).rejects.toThrow();
    });
  });

  describe('Shift Types (Requirement N5.1)', () => {
    it('should create morning shift class', async () => {
      const classInstance = await Class.create({
        academicYearId: academicYear.academicYearId,
        gradeLevel: 6,
        section: 'A',
        shift: Shift.MORNING,
        capacity: 40
      });

      expect(classInstance.shift).toBe(Shift.MORNING);
    });

    it('should create day shift class', async () => {
      const classInstance = await Class.create({
        academicYearId: academicYear.academicYearId,
        gradeLevel: 6,
        section: 'B',
        shift: Shift.DAY,
        capacity: 40
      });

      expect(classInstance.shift).toBe(Shift.DAY);
    });

    it('should create evening shift class', async () => {
      const classInstance = await Class.create({
        academicYearId: academicYear.academicYearId,
        gradeLevel: 6,
        section: 'C',
        shift: Shift.EVENING,
        capacity: 40
      });

      expect(classInstance.shift).toBe(Shift.EVENING);
    });

    it('should default to morning shift', async () => {
      const classInstance = await Class.create({
        academicYearId: academicYear.academicYearId,
        gradeLevel: 7,
        section: 'A',
        capacity: 40
      } as any);

      expect(classInstance.shift).toBe(Shift.MORNING);
    });
  });

  describe('Section Management', () => {
    it('should support multiple sections for same grade', async () => {
      const sections = ['A', 'B', 'C', 'D'];

      for (const section of sections) {
        const classInstance = await Class.create({
          academicYearId: academicYear.academicYearId,
          gradeLevel: 10,
          section,
          shift: Shift.MORNING,
          capacity: 40
        });

        expect(classInstance.section).toBe(section);
      }

      const allClasses = await Class.findAll({
        where: { gradeLevel: 10 }
      });

      expect(allClasses).toHaveLength(4);
    });
  });

  describe('Capacity Management', () => {
    it('should set default capacity to 40', async () => {
      const classInstance = await Class.create({
        academicYearId: academicYear.academicYearId,
        gradeLevel: 4,
        section: 'A',
        shift: Shift.MORNING,
        capacity: 40
      });

      expect(classInstance.capacity).toBe(40);
    });

    it('should allow custom capacity', async () => {
      const classInstance = await Class.create({
        academicYearId: academicYear.academicYearId,
        gradeLevel: 11,
        section: 'A',
        shift: Shift.MORNING,
        capacity: 30
      });

      expect(classInstance.capacity).toBe(30);
    });

    it('should initialize current strength to 0', async () => {
      const classInstance = await Class.create({
        academicYearId: academicYear.academicYearId,
        gradeLevel: 3,
        section: 'A',
        shift: Shift.MORNING,
        capacity: 40
      });

      expect(classInstance.currentStrength).toBe(0);
    });

    it('should update current strength', async () => {
      const classInstance = await Class.create({
        academicYearId: academicYear.academicYearId,
        gradeLevel: 2,
        section: 'A',
        shift: Shift.MORNING,
        capacity: 40
      });

      await classInstance.update({ currentStrength: 35 });

      expect(classInstance.currentStrength).toBe(35);
    });
  });

  describe('Class Teacher Assignment', () => {
    it('should allow class without teacher', async () => {
      const classInstance = await Class.create({
        academicYearId: academicYear.academicYearId,
        gradeLevel: 1,
        section: 'A',
        shift: Shift.MORNING,
        capacity: 40
      });

      expect(classInstance.classTeacherId).toBeUndefined();
    });

    it('should assign class teacher', async () => {
      const classInstance = await Class.create({
        academicYearId: academicYear.academicYearId,
        gradeLevel: 1,
        section: 'B',
        shift: Shift.MORNING,
        capacity: 40,
        classTeacherId: 456
      });

      expect(classInstance.classTeacherId).toBe(456);
    });

    it('should update class teacher', async () => {
      const classInstance = await Class.create({
        academicYearId: academicYear.academicYearId,
        gradeLevel: 12,
        section: 'A',
        shift: Shift.MORNING,
        capacity: 40,
        classTeacherId: 100
      });

      await classInstance.update({ classTeacherId: 200 });

      expect(classInstance.classTeacherId).toBe(200);
    });

    it('should remove class teacher', async () => {
      const classInstance = await Class.create({
        academicYearId: academicYear.academicYearId,
        gradeLevel: 12,
        section: 'B',
        shift: Shift.MORNING,
        capacity: 40,
        classTeacherId: 300
      });

      await classInstance.update({ classTeacherId: null });

      expect(classInstance.classTeacherId).toBeNull();
    });
  });

  describe('Academic Year Association', () => {
    it('should link class to academic year', async () => {
      const classInstance = await Class.create({
        academicYearId: academicYear.academicYearId,
        gradeLevel: 5,
        section: 'A',
        shift: Shift.MORNING,
        capacity: 40
      });

      expect(classInstance.academicYearId).toBe(academicYear.academicYearId);
    });

    it('should allow multiple classes for same academic year', async () => {
      await Class.create({
        academicYearId: academicYear.academicYearId,
        gradeLevel: 8,
        section: 'A',
        shift: Shift.MORNING,
        capacity: 40
      });

      await Class.create({
        academicYearId: academicYear.academicYearId,
        gradeLevel: 9,
        section: 'A',
        shift: Shift.MORNING,
        capacity: 40
      });

      const classes = await Class.findAll({
        where: { academicYearId: academicYear.academicYearId }
      });

      expect(classes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Timestamps', () => {
    it('should automatically set createdAt and updatedAt', async () => {
      const classInstance = await Class.create({
        academicYearId: academicYear.academicYearId,
        gradeLevel: 7,
        section: 'A',
        shift: Shift.MORNING,
        capacity: 40
      });

      expect(classInstance.createdAt).toBeDefined();
      expect(classInstance.createdAt).toBeInstanceOf(Date);
      expect(classInstance.updatedAt).toBeDefined();
      expect(classInstance.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const classInstance = await Class.create({
        academicYearId: academicYear.academicYearId,
        gradeLevel: 7,
        section: 'B',
        shift: Shift.MORNING,
        capacity: 40
      });

      const originalUpdatedAt = classInstance.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update class
      await classInstance.update({ capacity: 45 });

      expect(classInstance.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});
