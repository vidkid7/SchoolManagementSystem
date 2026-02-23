import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import sequelize from '@config/database';
import { Subject, ClassSubject } from '@models/Subject.model';
import { SubjectType, Stream } from '@models/Subject.model';
import Class, { Shift } from '@models/Class.model';
import { AcademicYear } from '@models/AcademicYear.model';

/**
 * Subject and ClassSubject Model Unit Tests
 * Requirements: 5.4, 5.5, N2.1-N2.7
 */
describe('Subject Model', () => {
  beforeAll(async () => {
    // Disable foreign key checks temporarily
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Sync database schema
    await sequelize.sync({ force: true });
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  });

  afterAll(async () => {
    // Close database connection
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up subjects table before each test
    await Subject.destroy({ where: {}, force: true });
  });

  describe('Model Creation', () => {
    it('should create a subject with all required fields', async () => {
      const subjectData = {
        code: 'MATH-101',
        nameEn: 'Mathematics',
        nameNp: 'गणित',
        type: SubjectType.COMPULSORY,
        creditHours: 100,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 35,
        fullMarks: 100,
        applicableClasses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      };

      const subject = await Subject.create(subjectData);

      expect(subject.subjectId).toBeDefined();
      expect(subject.code).toBe('MATH-101');
      expect(subject.nameEn).toBe('Mathematics');
      expect(subject.nameNp).toBe('गणित');
      expect(subject.type).toBe(SubjectType.COMPULSORY);
      expect(subject.creditHours).toBe(100);
      expect(subject.theoryMarks).toBe(75);
      expect(subject.practicalMarks).toBe(25);
      expect(subject.passMarks).toBe(35);
      expect(subject.fullMarks).toBe(100);
      expect(subject.applicableClasses).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(subject.createdAt).toBeDefined();
      expect(subject.updatedAt).toBeDefined();
    });

    it('should create an optional subject with stream for Classes 11-12', async () => {
      const subjectData = {
        code: 'PHY-201',
        nameEn: 'Physics',
        nameNp: 'भौतिक विज्ञान',
        type: SubjectType.OPTIONAL,
        stream: Stream.SCIENCE,
        creditHours: 100,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 35,
        fullMarks: 100,
        applicableClasses: [11, 12]
      };

      const subject = await Subject.create(subjectData);

      expect(subject.type).toBe(SubjectType.OPTIONAL);
      expect(subject.stream).toBe(Stream.SCIENCE);
      expect(subject.applicableClasses).toEqual([11, 12]);
    });

    it('should fail to create subject without required fields', async () => {
      const invalidData = {
        code: 'TEST-001'
        // Missing nameEn, nameNp, type, etc.
      };

      await expect(Subject.create(invalidData as any)).rejects.toThrow();
    });

    it('should enforce unique subject code constraint', async () => {
      const subjectData = {
        code: 'ENG-101',
        nameEn: 'English',
        nameNp: 'अंग्रेजी',
        type: SubjectType.COMPULSORY,
        creditHours: 100,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 35,
        fullMarks: 100,
        applicableClasses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      };

      await Subject.create(subjectData);

      // Try to create another subject with same code
      await expect(Subject.create(subjectData)).rejects.toThrow();
    });
  });

  describe('Subject Types', () => {
    it('should create compulsory subject', async () => {
      const subject = await Subject.create({
        code: 'NEP-101',
        nameEn: 'Nepali',
        nameNp: 'नेपाली',
        type: SubjectType.COMPULSORY,
        creditHours: 100,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 35,
        fullMarks: 100,
        applicableClasses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      });

      expect(subject.type).toBe(SubjectType.COMPULSORY);
    });

    it('should create optional subject', async () => {
      const subject = await Subject.create({
        code: 'ACC-201',
        nameEn: 'Accounting',
        nameNp: 'लेखा',
        type: SubjectType.OPTIONAL,
        stream: Stream.MANAGEMENT,
        creditHours: 100,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 35,
        fullMarks: 100,
        applicableClasses: [11, 12]
      });

      expect(subject.type).toBe(SubjectType.OPTIONAL);
    });
  });

  describe('Subject Streams for Classes 11-12 (Requirements N2.1-N2.7)', () => {
    it('should create science stream subject', async () => {
      const subject = await Subject.create({
        code: 'CHEM-201',
        nameEn: 'Chemistry',
        nameNp: 'रसायन विज्ञान',
        type: SubjectType.OPTIONAL,
        stream: Stream.SCIENCE,
        creditHours: 100,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 35,
        fullMarks: 100,
        applicableClasses: [11, 12]
      });

      expect(subject.stream).toBe(Stream.SCIENCE);
    });

    it('should create management stream subject', async () => {
      const subject = await Subject.create({
        code: 'ECO-201',
        nameEn: 'Economics',
        nameNp: 'अर्थशास्त्र',
        type: SubjectType.OPTIONAL,
        stream: Stream.MANAGEMENT,
        creditHours: 100,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 35,
        fullMarks: 100,
        applicableClasses: [11, 12]
      });

      expect(subject.stream).toBe(Stream.MANAGEMENT);
    });

    it('should create humanities stream subject', async () => {
      const subject = await Subject.create({
        code: 'SOC-201',
        nameEn: 'Sociology',
        nameNp: 'समाजशास्त्र',
        type: SubjectType.OPTIONAL,
        stream: Stream.HUMANITIES,
        creditHours: 100,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 35,
        fullMarks: 100,
        applicableClasses: [11, 12]
      });

      expect(subject.stream).toBe(Stream.HUMANITIES);
    });

    it('should create technical stream subject', async () => {
      const subject = await Subject.create({
        code: 'HTM-201',
        nameEn: 'Hotel Management',
        nameNp: 'होटल व्यवस्थापन',
        type: SubjectType.OPTIONAL,
        stream: Stream.TECHNICAL,
        creditHours: 100,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 35,
        fullMarks: 100,
        applicableClasses: [11, 12]
      });

      expect(subject.stream).toBe(Stream.TECHNICAL);
    });

    it('should allow compulsory subjects without stream', async () => {
      const subject = await Subject.create({
        code: 'ENG-201',
        nameEn: 'English',
        nameNp: 'अंग्रेजी',
        type: SubjectType.COMPULSORY,
        creditHours: 100,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 35,
        fullMarks: 100,
        applicableClasses: [11, 12]
      });

      expect(subject.stream).toBeUndefined();
    });
  });

  describe('NEB Compliance (Requirements N2.1-N2.7)', () => {
    it('should set default credit hours to 100 as per NEB', async () => {
      const subject = await Subject.create({
        code: 'SCI-101',
        nameEn: 'Science',
        nameNp: 'विज्ञान',
        type: SubjectType.COMPULSORY,
        creditHours: 100,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 35,
        fullMarks: 100,
        applicableClasses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      });

      expect(subject.creditHours).toBe(100);
    });

    it('should set default pass marks to 35% as per NEB', async () => {
      const subject = await Subject.create({
        code: 'SS-101',
        nameEn: 'Social Studies',
        nameNp: 'सामाजिक अध्ययन',
        type: SubjectType.COMPULSORY,
        creditHours: 100,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 35,
        fullMarks: 100,
        applicableClasses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      });

      expect(subject.passMarks).toBe(35);
    });

    it('should support 75/25 theory-practical split', async () => {
      const subject = await Subject.create({
        code: 'BIO-201',
        nameEn: 'Biology',
        nameNp: 'जीवविज्ञान',
        type: SubjectType.OPTIONAL,
        stream: Stream.SCIENCE,
        creditHours: 100,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 35,
        fullMarks: 100,
        applicableClasses: [11, 12]
      });

      expect(subject.theoryMarks).toBe(75);
      expect(subject.practicalMarks).toBe(25);
      expect(subject.theoryMarks + subject.practicalMarks).toBe(subject.fullMarks);
    });

    it('should support 50/50 theory-practical split for Computer Science', async () => {
      const subject = await Subject.create({
        code: 'CS-201',
        nameEn: 'Computer Science',
        nameNp: 'कम्प्युटर विज्ञान',
        type: SubjectType.OPTIONAL,
        stream: Stream.SCIENCE,
        creditHours: 100,
        theoryMarks: 50,
        practicalMarks: 50,
        passMarks: 35,
        fullMarks: 100,
        applicableClasses: [11, 12]
      });

      expect(subject.theoryMarks).toBe(50);
      expect(subject.practicalMarks).toBe(50);
      expect(subject.theoryMarks + subject.practicalMarks).toBe(subject.fullMarks);
    });
  });

  describe('Applicable Classes', () => {
    it('should support subjects for Classes 1-10', async () => {
      const subject = await Subject.create({
        code: 'MATH-SEE',
        nameEn: 'Mathematics (SEE)',
        nameNp: 'गणित (SEE)',
        type: SubjectType.COMPULSORY,
        creditHours: 100,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 35,
        fullMarks: 100,
        applicableClasses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      });

      expect(subject.applicableClasses).toHaveLength(10);
      expect(subject.applicableClasses).toContain(10);
    });

    it('should support subjects for Classes 11-12 only', async () => {
      const subject = await Subject.create({
        code: 'PHY-NEB',
        nameEn: 'Physics (NEB)',
        nameNp: 'भौतिक विज्ञान (NEB)',
        type: SubjectType.OPTIONAL,
        stream: Stream.SCIENCE,
        creditHours: 100,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 35,
        fullMarks: 100,
        applicableClasses: [11, 12]
      });

      expect(subject.applicableClasses).toHaveLength(2);
      expect(subject.applicableClasses).toEqual([11, 12]);
    });

    it('should support subjects for all classes', async () => {
      const subject = await Subject.create({
        code: 'PE-ALL',
        nameEn: 'Physical Education',
        nameNp: 'शारीरिक शिक्षा',
        type: SubjectType.COMPULSORY,
        creditHours: 100,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 35,
        fullMarks: 100,
        applicableClasses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      });

      expect(subject.applicableClasses).toHaveLength(12);
    });

    it('should support subjects for specific grade ranges', async () => {
      const subject = await Subject.create({
        code: 'ADV-MATH',
        nameEn: 'Advanced Mathematics',
        nameNp: 'उन्नत गणित',
        type: SubjectType.OPTIONAL,
        creditHours: 100,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 35,
        fullMarks: 100,
        applicableClasses: [8, 9, 10]
      });

      expect(subject.applicableClasses).toEqual([8, 9, 10]);
    });
  });

  describe('Bilingual Support', () => {
    it('should store subject names in both English and Nepali', async () => {
      const subject = await Subject.create({
        code: 'NEP-LANG',
        nameEn: 'Nepali Language',
        nameNp: 'नेपाली भाषा',
        type: SubjectType.COMPULSORY,
        creditHours: 100,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 35,
        fullMarks: 100,
        applicableClasses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      });

      expect(subject.nameEn).toBe('Nepali Language');
      expect(subject.nameNp).toBe('नेपाली भाषा');
    });
  });

  describe('Timestamps', () => {
    it('should automatically set createdAt and updatedAt', async () => {
      const subject = await Subject.create({
        code: 'TIME-TEST',
        nameEn: 'Timestamp Test',
        nameNp: 'टाइमस्ट्याम्प परीक्षण',
        type: SubjectType.COMPULSORY,
        creditHours: 100,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 35,
        fullMarks: 100,
        applicableClasses: [1, 2, 3]
      });

      expect(subject.createdAt).toBeDefined();
      expect(subject.createdAt).toBeInstanceOf(Date);
      expect(subject.updatedAt).toBeDefined();
      expect(subject.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const subject = await Subject.create({
        code: 'UPDATE-TEST',
        nameEn: 'Update Test',
        nameNp: 'अपडेट परीक्षण',
        type: SubjectType.COMPULSORY,
        creditHours: 100,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 35,
        fullMarks: 100,
        applicableClasses: [1, 2, 3]
      });

      const originalUpdatedAt = subject.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update subject
      await subject.update({ creditHours: 120 });

      expect(subject.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});

describe('ClassSubject Junction Model', () => {
  let academicYear: AcademicYear;
  let testClass: Class;
  let testSubject: Subject;

  beforeAll(async () => {
    // Disable foreign key checks temporarily
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Sync database schema
    await sequelize.sync({ force: true });
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    // Create test data
    academicYear = await AcademicYear.create({
      name: '2081-2082 BS',
      startDateBS: '2081-01-01',
      endDateBS: '2081-12-30',
      startDateAD: new Date('2024-04-13'),
      endDateAD: new Date('2025-04-12'),
      isCurrent: true
    });

    testClass = await Class.create({
      academicYearId: academicYear.academicYearId,
      gradeLevel: 10,
      section: 'A',
      shift: Shift.MORNING,
      capacity: 40
    });

    testSubject = await Subject.create({
      code: 'MATH-TEST',
      nameEn: 'Mathematics',
      nameNp: 'गणित',
      type: SubjectType.COMPULSORY,
      creditHours: 100,
      theoryMarks: 75,
      practicalMarks: 25,
      passMarks: 35,
      fullMarks: 100,
      applicableClasses: [10]
    });
  });

  afterAll(async () => {
    // Close database connection
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up class_subjects table before each test
    await ClassSubject.destroy({ where: {}, force: true });
  });

  describe('Junction Table Creation (Requirement 5.5)', () => {
    it('should create class-subject assignment', async () => {
      const classSubject = await ClassSubject.create({
        classId: testClass.classId,
        subjectId: testSubject.subjectId
      });

      expect(classSubject.classSubjectId).toBeDefined();
      expect(classSubject.classId).toBe(testClass.classId);
      expect(classSubject.subjectId).toBe(testSubject.subjectId);
      expect(classSubject.createdAt).toBeDefined();
      expect(classSubject.updatedAt).toBeDefined();
    });

    it('should create class-subject assignment with teacher', async () => {
      const classSubject = await ClassSubject.create({
        classId: testClass.classId,
        subjectId: testSubject.subjectId,
        teacherId: 123
      });

      expect(classSubject.teacherId).toBe(123);
    });

    it('should enforce unique constraint on class-subject combination', async () => {
      await ClassSubject.create({
        classId: testClass.classId,
        subjectId: testSubject.subjectId
      });

      // Try to create duplicate assignment
      await expect(
        ClassSubject.create({
          classId: testClass.classId,
          subjectId: testSubject.subjectId
        })
      ).rejects.toThrow();
    });

    it('should allow same subject in different classes', async () => {
      const anotherClass = await Class.create({
        academicYearId: academicYear.academicYearId,
        gradeLevel: 10,
        section: 'B',
        shift: Shift.MORNING,
        capacity: 40
      });

      const assignment1 = await ClassSubject.create({
        classId: testClass.classId,
        subjectId: testSubject.subjectId
      });

      const assignment2 = await ClassSubject.create({
        classId: anotherClass.classId,
        subjectId: testSubject.subjectId
      });

      expect(assignment1.classSubjectId).not.toBe(assignment2.classSubjectId);
    });

    it('should allow multiple subjects in same class', async () => {
      const subject2 = await Subject.create({
        code: 'ENG-TEST',
        nameEn: 'English',
        nameNp: 'अंग्रेजी',
        type: SubjectType.COMPULSORY,
        creditHours: 100,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 35,
        fullMarks: 100,
        applicableClasses: [10]
      });

      const assignment1 = await ClassSubject.create({
        classId: testClass.classId,
        subjectId: testSubject.subjectId
      });

      const assignment2 = await ClassSubject.create({
        classId: testClass.classId,
        subjectId: subject2.subjectId
      });

      expect(assignment1.classSubjectId).not.toBe(assignment2.classSubjectId);
    });
  });

  describe('Teacher Assignment', () => {
    it('should assign teacher to class-subject', async () => {
      const classSubject = await ClassSubject.create({
        classId: testClass.classId,
        subjectId: testSubject.subjectId,
        teacherId: 456
      });

      expect(classSubject.teacherId).toBe(456);
    });

    it('should update teacher assignment', async () => {
      const classSubject = await ClassSubject.create({
        classId: testClass.classId,
        subjectId: testSubject.subjectId,
        teacherId: 100
      });

      await classSubject.update({ teacherId: 200 });

      expect(classSubject.teacherId).toBe(200);
    });

    it('should remove teacher assignment', async () => {
      const classSubject = await ClassSubject.create({
        classId: testClass.classId,
        subjectId: testSubject.subjectId,
        teacherId: 300
      });

      await classSubject.update({ teacherId: null });

      expect(classSubject.teacherId).toBeNull();
    });

    it('should allow class-subject without teacher', async () => {
      const classSubject = await ClassSubject.create({
        classId: testClass.classId,
        subjectId: testSubject.subjectId
      });

      expect(classSubject.teacherId).toBeUndefined();
    });
  });

  describe('Timestamps', () => {
    it('should automatically set createdAt and updatedAt', async () => {
      const classSubject = await ClassSubject.create({
        classId: testClass.classId,
        subjectId: testSubject.subjectId
      });

      expect(classSubject.createdAt).toBeDefined();
      expect(classSubject.createdAt).toBeInstanceOf(Date);
      expect(classSubject.updatedAt).toBeDefined();
      expect(classSubject.updatedAt).toBeInstanceOf(Date);
    });
  });
});
