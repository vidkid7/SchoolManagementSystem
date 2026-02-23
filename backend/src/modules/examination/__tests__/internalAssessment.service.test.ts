import internalAssessmentService from '../internalAssessment.service';
import Exam, { ExamType, ExamStatus } from '@models/Exam.model';
import Grade, { NEBGrade } from '@models/Grade.model';
import sequelize from '@config/database';

/**
 * Internal Assessment Service Tests
 * 
 * Tests internal assessment tracking and final marks calculation
 * combining internal and terminal exams per NEB standards
 * 
 * Requirements: 7.11
 */

describe('InternalAssessmentService', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up before each test
    await Grade.destroy({ where: {}, force: true });
    await Exam.destroy({ where: {}, force: true });
  });

  describe('validateWeightageConfig', () => {
    it('should accept valid weightage configuration (30% internal, 70% terminal)', () => {
      const result = internalAssessmentService.validateWeightageConfig(30, 70);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid weightage configuration (25% internal, 75% terminal)', () => {
      const result = internalAssessmentService.validateWeightageConfig(25, 75);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid weightage configuration (50% internal, 50% terminal)', () => {
      const result = internalAssessmentService.validateWeightageConfig(50, 50);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject internal weightage below 25%', () => {
      const result = internalAssessmentService.validateWeightageConfig(20, 80);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Internal assessment weightage must be between 25% and 50% as per NEB standards');
    });

    it('should reject internal weightage above 50%', () => {
      const result = internalAssessmentService.validateWeightageConfig(60, 40);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Internal assessment weightage must be between 25% and 50% as per NEB standards');
    });

    it('should reject terminal weightage below 50%', () => {
      const result = internalAssessmentService.validateWeightageConfig(60, 40);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Terminal exam weightage must be between 50% and 75% as per NEB standards');
    });

    it('should reject terminal weightage above 75%', () => {
      const result = internalAssessmentService.validateWeightageConfig(20, 80);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Terminal exam weightage must be between 50% and 75% as per NEB standards');
    });

    it('should reject weightages that do not sum to 100%', () => {
      const result = internalAssessmentService.validateWeightageConfig(30, 60);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Internal and terminal weightages must sum to 100%. Current sum: 90%');
    });
  });

  describe('calculateFinalMarks', () => {
    it('should calculate final marks combining internal (30%) and terminal (70%) exams', async () => {
      // Create internal assessment exam
      const internalExam = await Exam.create({
        name: 'Internal Assessment',
        type: ExamType.UNIT_TEST,
        subjectId: 1,
        classId: 1,
        academicYearId: 1,
        termId: 1,
        examDate: new Date('2024-01-15'),
        duration: 60,
        fullMarks: 100,
        passMarks: 35,
        theoryMarks: 100,
        practicalMarks: 0,
        weightage: 30,
        isInternal: true,
        status: ExamStatus.COMPLETED
      });

      // Create terminal exam
      const terminalExam = await Exam.create({
        name: 'First Terminal Exam',
        type: ExamType.FIRST_TERMINAL,
        subjectId: 1,
        classId: 1,
        academicYearId: 1,
        termId: 1,
        examDate: new Date('2024-02-15'),
        duration: 180,
        fullMarks: 100,
        passMarks: 35,
        theoryMarks: 75,
        practicalMarks: 25,
        weightage: 70,
        isInternal: false,
        status: ExamStatus.COMPLETED
      });

      // Create grades
      // Internal: 80/100 = 80%
      await Grade.create({
        examId: internalExam.examId,
        studentId: 1,
        totalMarks: 80,
        grade: NEBGrade.A,
        gradePoint: 3.6,
        enteredBy: 1,
        enteredAt: new Date()
      });

      // Terminal: 70/100 = 70%
      await Grade.create({
        examId: terminalExam.examId,
        studentId: 1,
        totalMarks: 70,
        grade: NEBGrade.B_PLUS,
        gradePoint: 3.2,
        enteredBy: 1,
        enteredAt: new Date()
      });

      // Calculate final marks
      // Final = (80% × 30%) + (70% × 70%) = 24% + 49% = 73%
      const result = await internalAssessmentService.calculateFinalMarks({
        studentId: 1,
        subjectId: 1,
        classId: 1,
        termId: 1,
        internalWeightage: 30
      });

      expect(result.studentId).toBe(1);
      expect(result.subjectId).toBe(1);
      expect(result.internalAssessment).not.toBeNull();
      expect(result.terminalExam).not.toBeNull();
      
      // Check internal assessment data
      expect(result.internalAssessment!.marks).toBe(80);
      expect(result.internalAssessment!.percentage).toBe(80);
      expect(result.internalAssessment!.weightage).toBe(30);
      expect(result.internalAssessment!.weightedMarks).toBe(24);

      // Check terminal exam data
      expect(result.terminalExam!.marks).toBe(70);
      expect(result.terminalExam!.percentage).toBe(70);
      expect(result.terminalExam!.weightage).toBe(70);
      expect(result.terminalExam!.weightedMarks).toBe(49);

      // Check final marks
      expect(result.finalPercentage).toBe(73);
      expect(result.finalGrade).toBe('B+'); // 73% = B+
      expect(result.finalGradePoint).toBe(3.2);
    });

    it('should calculate final marks with 25% internal and 75% terminal', async () => {
      // Create internal assessment exam
      const internalExam = await Exam.create({
        name: 'Internal Assessment',
        type: ExamType.UNIT_TEST,
        subjectId: 1,
        classId: 1,
        academicYearId: 1,
        termId: 1,
        examDate: new Date('2024-01-15'),
        duration: 60,
        fullMarks: 100,
        passMarks: 35,
        theoryMarks: 100,
        practicalMarks: 0,
        weightage: 25,
        isInternal: true,
        status: ExamStatus.COMPLETED
      });

      // Create terminal exam
      const terminalExam = await Exam.create({
        name: 'First Terminal Exam',
        type: ExamType.FIRST_TERMINAL,
        subjectId: 1,
        classId: 1,
        academicYearId: 1,
        termId: 1,
        examDate: new Date('2024-02-15'),
        duration: 180,
        fullMarks: 100,
        passMarks: 35,
        theoryMarks: 75,
        practicalMarks: 25,
        weightage: 75,
        isInternal: false,
        status: ExamStatus.COMPLETED
      });

      // Create grades
      // Internal: 90/100 = 90%
      await Grade.create({
        examId: internalExam.examId,
        studentId: 1,
        totalMarks: 90,
        grade: NEBGrade.A_PLUS,
        gradePoint: 4.0,
        enteredBy: 1,
        enteredAt: new Date()
      });

      // Terminal: 80/100 = 80%
      await Grade.create({
        examId: terminalExam.examId,
        studentId: 1,
        totalMarks: 80,
        grade: NEBGrade.A,
        gradePoint: 3.6,
        enteredBy: 1,
        enteredAt: new Date()
      });

      // Calculate final marks
      // Final = (90% × 25%) + (80% × 75%) = 22.5% + 60% = 82.5%
      const result = await internalAssessmentService.calculateFinalMarks({
        studentId: 1,
        subjectId: 1,
        classId: 1,
        termId: 1,
        internalWeightage: 25
      });

      expect(result.finalPercentage).toBe(82.5);
      expect(result.finalGrade).toBe('A'); // 82.5% = A
      expect(result.finalGradePoint).toBe(3.6);
    });

    it('should handle case with only internal assessment grade', async () => {
      // Create internal assessment exam
      const internalExam = await Exam.create({
        name: 'Internal Assessment',
        type: ExamType.UNIT_TEST,
        subjectId: 1,
        classId: 1,
        academicYearId: 1,
        termId: 1,
        examDate: new Date('2024-01-15'),
        duration: 60,
        fullMarks: 100,
        passMarks: 35,
        theoryMarks: 100,
        practicalMarks: 0,
        weightage: 30,
        isInternal: true,
        status: ExamStatus.COMPLETED
      });

      // Create terminal exam (but no grade)
      await Exam.create({
        name: 'First Terminal Exam',
        type: ExamType.FIRST_TERMINAL,
        subjectId: 1,
        classId: 1,
        academicYearId: 1,
        termId: 1,
        examDate: new Date('2024-02-15'),
        duration: 180,
        fullMarks: 100,
        passMarks: 35,
        theoryMarks: 75,
        practicalMarks: 25,
        weightage: 70,
        isInternal: false,
        status: ExamStatus.COMPLETED
      });

      // Create only internal grade
      await Grade.create({
        examId: internalExam.examId,
        studentId: 1,
        totalMarks: 85,
        grade: NEBGrade.A,
        gradePoint: 3.6,
        enteredBy: 1,
        enteredAt: new Date()
      });

      const result = await internalAssessmentService.calculateFinalMarks({
        studentId: 1,
        subjectId: 1,
        classId: 1,
        termId: 1,
        internalWeightage: 30
      });

      expect(result.internalAssessment).not.toBeNull();
      expect(result.terminalExam).toBeNull();
      // Final = (85% × 30%) + (0% × 70%) = 25.5%
      expect(result.finalPercentage).toBe(25.5);
    });

    it('should handle case with only terminal exam grade', async () => {
      // Create internal assessment exam (but no grade)
      await Exam.create({
        name: 'Internal Assessment',
        type: ExamType.UNIT_TEST,
        subjectId: 1,
        classId: 1,
        academicYearId: 1,
        termId: 1,
        examDate: new Date('2024-01-15'),
        duration: 60,
        fullMarks: 100,
        passMarks: 35,
        theoryMarks: 100,
        practicalMarks: 0,
        weightage: 30,
        isInternal: true,
        status: ExamStatus.COMPLETED
      });

      // Create terminal exam
      const terminalExam = await Exam.create({
        name: 'First Terminal Exam',
        type: ExamType.FIRST_TERMINAL,
        subjectId: 1,
        classId: 1,
        academicYearId: 1,
        termId: 1,
        examDate: new Date('2024-02-15'),
        duration: 180,
        fullMarks: 100,
        passMarks: 35,
        theoryMarks: 75,
        practicalMarks: 25,
        weightage: 70,
        isInternal: false,
        status: ExamStatus.COMPLETED
      });

      // Create only terminal grade
      await Grade.create({
        examId: terminalExam.examId,
        studentId: 1,
        totalMarks: 75,
        grade: NEBGrade.B_PLUS,
        gradePoint: 3.2,
        enteredBy: 1,
        enteredAt: new Date()
      });

      const result = await internalAssessmentService.calculateFinalMarks({
        studentId: 1,
        subjectId: 1,
        classId: 1,
        termId: 1,
        internalWeightage: 30
      });

      expect(result.internalAssessment).toBeNull();
      expect(result.terminalExam).not.toBeNull();
      // Final = (0% × 30%) + (75% × 70%) = 52.5%
      expect(result.finalPercentage).toBe(52.5);
    });

    it('should throw error for invalid weightage configuration', async () => {
      await expect(
        internalAssessmentService.calculateFinalMarks({
          studentId: 1,
          subjectId: 1,
          classId: 1,
          termId: 1,
          internalWeightage: 60 // Invalid: above 50%
        })
      ).rejects.toThrow('Invalid weightage configuration');
    });
  });

  describe('getSubjectAssessmentSummary', () => {
    it('should return summary with both internal and terminal exams', async () => {
      // Create internal assessment exam
      const internalExam = await Exam.create({
        name: 'Internal Assessment',
        type: ExamType.UNIT_TEST,
        subjectId: 1,
        classId: 1,
        academicYearId: 1,
        termId: 1,
        examDate: new Date('2024-01-15'),
        duration: 60,
        fullMarks: 100,
        passMarks: 35,
        theoryMarks: 100,
        practicalMarks: 0,
        weightage: 30,
        isInternal: true,
        status: ExamStatus.COMPLETED
      });

      // Create terminal exam
      const terminalExam = await Exam.create({
        name: 'First Terminal Exam',
        type: ExamType.FIRST_TERMINAL,
        subjectId: 1,
        classId: 1,
        academicYearId: 1,
        termId: 1,
        examDate: new Date('2024-02-15'),
        duration: 180,
        fullMarks: 100,
        passMarks: 35,
        theoryMarks: 75,
        practicalMarks: 25,
        weightage: 70,
        isInternal: false,
        status: ExamStatus.COMPLETED
      });

      // Create grades for 3 students
      // Student 1: both grades
      await Grade.create({
        examId: internalExam.examId,
        studentId: 1,
        totalMarks: 80,
        grade: NEBGrade.A,
        gradePoint: 3.6,
        enteredBy: 1,
        enteredAt: new Date()
      });
      await Grade.create({
        examId: terminalExam.examId,
        studentId: 1,
        totalMarks: 75,
        grade: NEBGrade.B_PLUS,
        gradePoint: 3.2,
        enteredBy: 1,
        enteredAt: new Date()
      });

      // Student 2: only internal
      await Grade.create({
        examId: internalExam.examId,
        studentId: 2,
        totalMarks: 70,
        grade: NEBGrade.B_PLUS,
        gradePoint: 3.2,
        enteredBy: 1,
        enteredAt: new Date()
      });

      // Student 3: only terminal
      await Grade.create({
        examId: terminalExam.examId,
        studentId: 3,
        totalMarks: 65,
        grade: NEBGrade.B,
        gradePoint: 2.8,
        enteredBy: 1,
        enteredAt: new Date()
      });

      const summary = await internalAssessmentService.getSubjectAssessmentSummary(1, 1, 1);

      expect(summary.subjectId).toBe(1);
      expect(summary.hasInternalAssessment).toBe(true);
      expect(summary.hasTerminalExam).toBe(true);
      expect(summary.internalWeightage).toBe(30);
      expect(summary.terminalWeightage).toBe(70);
      expect(summary.studentsWithBothGrades).toBe(1);
      expect(summary.studentsWithInternalOnly).toBe(1);
      expect(summary.studentsWithTerminalOnly).toBe(1);
    });

    it('should return summary with only internal assessment', async () => {
      const internalExam = await Exam.create({
        name: 'Internal Assessment',
        type: ExamType.UNIT_TEST,
        subjectId: 1,
        classId: 1,
        academicYearId: 1,
        termId: 1,
        examDate: new Date('2024-01-15'),
        duration: 60,
        fullMarks: 100,
        passMarks: 35,
        theoryMarks: 100,
        practicalMarks: 0,
        weightage: 30,
        isInternal: true,
        status: ExamStatus.COMPLETED
      });

      await Grade.create({
        examId: internalExam.examId,
        studentId: 1,
        totalMarks: 80,
        grade: NEBGrade.A,
        gradePoint: 3.6,
        enteredBy: 1,
        enteredAt: new Date()
      });

      const summary = await internalAssessmentService.getSubjectAssessmentSummary(1, 1, 1);

      expect(summary.hasInternalAssessment).toBe(true);
      expect(summary.hasTerminalExam).toBe(false);
      expect(summary.studentsWithInternalOnly).toBe(1);
      expect(summary.studentsWithTerminalOnly).toBe(0);
      expect(summary.studentsWithBothGrades).toBe(0);
    });
  });

  describe('getInternalAssessmentExams', () => {
    it('should return only internal assessment exams', async () => {
      await Exam.create({
        name: 'Internal Assessment',
        type: ExamType.UNIT_TEST,
        subjectId: 1,
        classId: 1,
        academicYearId: 1,
        termId: 1,
        examDate: new Date('2024-01-15'),
        duration: 60,
        fullMarks: 100,
        passMarks: 35,
        theoryMarks: 100,
        practicalMarks: 0,
        weightage: 30,
        isInternal: true,
        status: ExamStatus.COMPLETED
      });

      await Exam.create({
        name: 'Terminal Exam',
        type: ExamType.FIRST_TERMINAL,
        subjectId: 1,
        classId: 1,
        academicYearId: 1,
        termId: 1,
        examDate: new Date('2024-02-15'),
        duration: 180,
        fullMarks: 100,
        passMarks: 35,
        theoryMarks: 75,
        practicalMarks: 25,
        weightage: 70,
        isInternal: false,
        status: ExamStatus.COMPLETED
      });

      const exams = await internalAssessmentService.getInternalAssessmentExams(1, 1);

      expect(exams).toHaveLength(1);
      expect(exams[0].isInternal).toBe(true);
      expect(exams[0].name).toBe('Internal Assessment');
    });
  });

  describe('getTerminalExams', () => {
    it('should return only terminal exams', async () => {
      await Exam.create({
        name: 'Internal Assessment',
        type: ExamType.UNIT_TEST,
        subjectId: 1,
        classId: 1,
        academicYearId: 1,
        termId: 1,
        examDate: new Date('2024-01-15'),
        duration: 60,
        fullMarks: 100,
        passMarks: 35,
        theoryMarks: 100,
        practicalMarks: 0,
        weightage: 30,
        isInternal: true,
        status: ExamStatus.COMPLETED
      });

      await Exam.create({
        name: 'Terminal Exam',
        type: ExamType.FIRST_TERMINAL,
        subjectId: 1,
        classId: 1,
        academicYearId: 1,
        termId: 1,
        examDate: new Date('2024-02-15'),
        duration: 180,
        fullMarks: 100,
        passMarks: 35,
        theoryMarks: 75,
        practicalMarks: 25,
        weightage: 70,
        isInternal: false,
        status: ExamStatus.COMPLETED
      });

      const exams = await internalAssessmentService.getTerminalExams(1, 1);

      expect(exams).toHaveLength(1);
      expect(exams[0].isInternal).toBe(false);
      expect(exams[0].name).toBe('Terminal Exam');
    });
  });
});
