import Exam, { ExamType, ExamStatus } from '../Exam.model';
import sequelize from '@config/database';

describe('Exam Model', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  afterEach(async () => {
    await Exam.destroy({ where: {}, force: true });
  });

  describe('Model Creation', () => {
    it('should create an exam with all required fields', async () => {
      const examData = {
        name: 'First Terminal Exam - Mathematics',
        type: ExamType.FIRST_TERMINAL,
        subjectId: 1,
        classId: 1,
        academicYearId: 1,
        termId: 1,
        examDate: new Date('2025-05-15'),
        duration: 180, // 3 hours
        fullMarks: 100,
        passMarks: 35,
        theoryMarks: 75,
        practicalMarks: 25,
        weightage: 100.00,
        status: ExamStatus.SCHEDULED
      };

      const exam = await Exam.create(examData);

      expect(exam.examId).toBeDefined();
      expect(exam.name).toBe(examData.name);
      expect(exam.type).toBe(examData.type);
      expect(exam.subjectId).toBe(examData.subjectId);
      expect(exam.classId).toBe(examData.classId);
      expect(exam.duration).toBe(examData.duration);
      expect(exam.fullMarks).toBe(examData.fullMarks);
      expect(exam.passMarks).toBe(examData.passMarks);
      expect(exam.theoryMarks).toBe(examData.theoryMarks);
      expect(exam.practicalMarks).toBe(examData.practicalMarks);
      expect(exam.status).toBe(examData.status);
    });

    it('should create an exam with default values', async () => {
      const examData = {
        name: 'Unit Test 1',
        type: ExamType.UNIT_TEST,
        subjectId: 1,
        classId: 1,
        academicYearId: 1,
        termId: 1,
        examDate: new Date('2025-05-15'),
        duration: 60
      };

      const exam = await Exam.create(examData);

      expect(exam.fullMarks).toBe(100); // Default
      expect(exam.passMarks).toBe(35); // Default
      expect(exam.theoryMarks).toBe(75); // Default
      expect(exam.practicalMarks).toBe(25); // Default
      expect(exam.weightage).toBe(100.00); // Default
      expect(exam.status).toBe(ExamStatus.SCHEDULED); // Default
    });

    it('should support all exam types', async () => {
      const examTypes = [
        ExamType.UNIT_TEST,
        ExamType.FIRST_TERMINAL,
        ExamType.SECOND_TERMINAL,
        ExamType.FINAL,
        ExamType.PRACTICAL,
        ExamType.PROJECT
      ];

      for (const type of examTypes) {
        const exam = await Exam.create({
          name: `Test ${type}`,
          type,
          subjectId: 1,
          classId: 1,
          academicYearId: 1,
          termId: 1,
          examDate: new Date('2025-05-15'),
          duration: 60
        });

        expect(exam.type).toBe(type);
      }
    });

    it('should support theory/practical marks split (75/25)', async () => {
      const exam = await Exam.create({
        name: 'Science Exam',
        type: ExamType.FIRST_TERMINAL,
        subjectId: 1,
        classId: 1,
        academicYearId: 1,
        termId: 1,
        examDate: new Date('2025-05-15'),
        duration: 180,
        fullMarks: 100,
        theoryMarks: 75,
        practicalMarks: 25
      });

      expect(exam.theoryMarks).toBe(75);
      expect(exam.practicalMarks).toBe(25);
      expect(exam.getTheoryPercentage()).toBe(75);
      expect(exam.getPracticalPercentage()).toBe(25);
    });

    it('should support theory/practical marks split (50/50)', async () => {
      const exam = await Exam.create({
        name: 'Computer Science Exam',
        type: ExamType.FIRST_TERMINAL,
        subjectId: 1,
        classId: 1,
        academicYearId: 1,
        termId: 1,
        examDate: new Date('2025-05-15'),
        duration: 180,
        fullMarks: 100,
        theoryMarks: 50,
        practicalMarks: 50
      });

      expect(exam.theoryMarks).toBe(50);
      expect(exam.practicalMarks).toBe(50);
      expect(exam.getTheoryPercentage()).toBe(50);
      expect(exam.getPracticalPercentage()).toBe(50);
    });
  });

  describe('Validation', () => {
    it('should validate that theory + practical = full marks', async () => {
      const examData = {
        name: 'Invalid Exam',
        type: ExamType.UNIT_TEST,
        subjectId: 1,
        classId: 1,
        academicYearId: 1,
        termId: 1,
        examDate: new Date('2025-05-15'),
        duration: 60,
        fullMarks: 100,
        theoryMarks: 60,
        practicalMarks: 30 // 60 + 30 = 90, not 100
      };

      await expect(Exam.create(examData)).rejects.toThrow(
        'Theory marks + Practical marks must equal Full marks'
      );
    });

    it('should validate that pass marks < full marks', async () => {
      const examData = {
        name: 'Invalid Exam',
        type: ExamType.UNIT_TEST,
        subjectId: 1,
        classId: 1,
        academicYearId: 1,
        termId: 1,
        examDate: new Date('2025-05-15'),
        duration: 60,
        fullMarks: 100,
        passMarks: 100, // Pass marks cannot equal full marks
        theoryMarks: 75,
        practicalMarks: 25
      };

      await expect(Exam.create(examData)).rejects.toThrow(
        'Pass marks must be less than Full marks'
      );
    });

    it('should validate duration is positive', async () => {
      const examData = {
        name: 'Invalid Exam',
        type: ExamType.UNIT_TEST,
        subjectId: 1,
        classId: 1,
        academicYearId: 1,
        termId: 1,
        examDate: new Date('2025-05-15'),
        duration: 0 // Invalid
      };

      await expect(Exam.create(examData)).rejects.toThrow();
    });
  });

  describe('Instance Methods', () => {
    let exam: Exam;

    beforeEach(async () => {
      exam = await Exam.create({
        name: 'Test Exam',
        type: ExamType.FIRST_TERMINAL,
        subjectId: 1,
        classId: 1,
        academicYearId: 1,
        termId: 1,
        examDate: new Date('2025-05-15'),
        duration: 180,
        fullMarks: 100,
        theoryMarks: 75,
        practicalMarks: 25
      });
    });

    it('should check if exam has practical component', () => {
      expect(exam.hasPractical()).toBe(true);

      exam.practicalMarks = 0;
      expect(exam.hasPractical()).toBe(false);
    });

    it('should check exam status', () => {
      exam.status = ExamStatus.SCHEDULED;
      expect(exam.isScheduled()).toBe(true);
      expect(exam.isOngoing()).toBe(false);
      expect(exam.isCompleted()).toBe(false);

      exam.status = ExamStatus.ONGOING;
      expect(exam.isScheduled()).toBe(false);
      expect(exam.isOngoing()).toBe(true);
      expect(exam.isCompleted()).toBe(false);

      exam.status = ExamStatus.COMPLETED;
      expect(exam.isScheduled()).toBe(false);
      expect(exam.isOngoing()).toBe(false);
      expect(exam.isCompleted()).toBe(true);
    });

    it('should validate marks distribution', () => {
      expect(exam.validateMarksDistribution()).toBe(true);

      exam.theoryMarks = 60;
      expect(exam.validateMarksDistribution()).toBe(false);
    });

    it('should calculate theory and practical percentages', () => {
      expect(exam.getTheoryPercentage()).toBe(75);
      expect(exam.getPracticalPercentage()).toBe(25);

      exam.fullMarks = 0;
      expect(exam.getTheoryPercentage()).toBe(0);
      expect(exam.getPracticalPercentage()).toBe(0);
    });
  });

  describe('Soft Delete', () => {
    it('should soft delete an exam', async () => {
      const exam = await Exam.create({
        name: 'Test Exam',
        type: ExamType.UNIT_TEST,
        subjectId: 1,
        classId: 1,
        academicYearId: 1,
        termId: 1,
        examDate: new Date('2025-05-15'),
        duration: 60
      });

      await exam.destroy();

      const foundExam = await Exam.findByPk(exam.examId);
      expect(foundExam).toBeNull();

      const deletedExam = await Exam.findByPk(exam.examId, { paranoid: false });
      expect(deletedExam).not.toBeNull();
      expect(deletedExam!.deletedAt).not.toBeNull();
    });
  });
});
