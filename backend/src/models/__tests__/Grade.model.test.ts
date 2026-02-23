import Grade, { NEBGrade } from '../Grade.model';
import sequelize from '@config/database';

describe('Grade Model', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  afterEach(async () => {
    await Grade.destroy({ where: {}, force: true });
  });

  describe('Model Creation', () => {
    it('should create a grade with all required fields', async () => {
      const gradeData = {
        examId: 1,
        studentId: 1,
        theoryMarks: 68.5,
        practicalMarks: 22.0,
        totalMarks: 90.5,
        grade: NEBGrade.A_PLUS,
        gradePoint: 4.0,
        remarks: 'Excellent performance',
        enteredBy: 1
      };

      const grade = await Grade.create(gradeData);

      expect(grade.gradeId).toBeDefined();
      expect(grade.examId).toBe(gradeData.examId);
      expect(grade.studentId).toBe(gradeData.studentId);
      expect(Number(grade.theoryMarks)).toBe(gradeData.theoryMarks);
      expect(Number(grade.practicalMarks)).toBe(gradeData.practicalMarks);
      expect(Number(grade.totalMarks)).toBe(gradeData.totalMarks);
      expect(grade.grade).toBe(gradeData.grade);
      expect(Number(grade.gradePoint)).toBe(gradeData.gradePoint);
      expect(grade.remarks).toBe(gradeData.remarks);
      expect(grade.enteredBy).toBe(gradeData.enteredBy);
      expect(grade.enteredAt).toBeDefined();
    });

    it('should support all NEB grades', async () => {
      const nebGrades = [
        { grade: NEBGrade.A_PLUS, point: 4.0, marks: 92 },
        { grade: NEBGrade.A, point: 3.6, marks: 85 },
        { grade: NEBGrade.B_PLUS, point: 3.2, marks: 75 },
        { grade: NEBGrade.B, point: 2.8, marks: 65 },
        { grade: NEBGrade.C_PLUS, point: 2.4, marks: 55 },
        { grade: NEBGrade.C, point: 2.0, marks: 45 },
        { grade: NEBGrade.D, point: 1.6, marks: 37 },
        { grade: NEBGrade.NG, point: 0.0, marks: 30 }
      ];

      for (const { grade, point, marks } of nebGrades) {
        const gradeRecord = await Grade.create({
          examId: 1,
          studentId: Math.floor(Math.random() * 1000) + 1, // Random student ID to avoid unique constraint
          totalMarks: marks,
          grade,
          gradePoint: point,
          enteredBy: 1
        });

        expect(gradeRecord.grade).toBe(grade);
        expect(Number(gradeRecord.gradePoint)).toBe(point);
      }
    });

    it('should create grade with theory and practical marks', async () => {
      const grade = await Grade.create({
        examId: 1,
        studentId: 1,
        theoryMarks: 68.5,
        practicalMarks: 22.0,
        totalMarks: 90.5,
        grade: NEBGrade.A_PLUS,
        gradePoint: 4.0,
        enteredBy: 1
      });

      expect(Number(grade.theoryMarks)).toBe(68.5);
      expect(Number(grade.practicalMarks)).toBe(22.0);
      expect(Number(grade.totalMarks)).toBe(90.5);
    });

    it('should create grade with only total marks (no theory/practical split)', async () => {
      const grade = await Grade.create({
        examId: 1,
        studentId: 1,
        totalMarks: 85,
        grade: NEBGrade.A,
        gradePoint: 3.6,
        enteredBy: 1
      });

      expect(grade.theoryMarks).toBeUndefined();
      expect(grade.practicalMarks).toBeUndefined();
      expect(Number(grade.totalMarks)).toBe(85);
    });
  });

  describe('Validation', () => {
    it('should validate that theory + practical = total marks', async () => {
      const gradeData = {
        examId: 1,
        studentId: 1,
        theoryMarks: 60,
        practicalMarks: 20,
        totalMarks: 85, // Should be 80
        grade: NEBGrade.A,
        gradePoint: 3.6,
        enteredBy: 1
      };

      await expect(Grade.create(gradeData)).rejects.toThrow(
        'Theory marks + Practical marks must equal Total marks'
      );
    });

    it('should allow small floating point differences in marks', async () => {
      const grade = await Grade.create({
        examId: 1,
        studentId: 1,
        theoryMarks: 68.33,
        practicalMarks: 21.67,
        totalMarks: 90.00, // 68.33 + 21.67 = 90.00
        grade: NEBGrade.A_PLUS,
        gradePoint: 4.0,
        enteredBy: 1
      });

      expect(grade).toBeDefined();
    });

    it('should validate grade point is between 0.0 and 4.0', async () => {
      const gradeData = {
        examId: 1,
        studentId: 1,
        totalMarks: 85,
        grade: NEBGrade.A,
        gradePoint: 5.0, // Invalid
        enteredBy: 1
      };

      await expect(Grade.create(gradeData)).rejects.toThrow();
    });

    it('should prevent duplicate grades for same student and exam', async () => {
      const gradeData = {
        examId: 1,
        studentId: 1,
        totalMarks: 85,
        grade: NEBGrade.A,
        gradePoint: 3.6,
        enteredBy: 1
      };

      await Grade.create(gradeData);

      // Try to create duplicate
      await expect(Grade.create(gradeData)).rejects.toThrow();
    });
  });

  describe('Instance Methods', () => {
    let grade: Grade;

    beforeEach(async () => {
      grade = await Grade.create({
        examId: 1,
        studentId: 1,
        theoryMarks: 68.5,
        practicalMarks: 22.0,
        totalMarks: 90.5,
        grade: NEBGrade.A_PLUS,
        gradePoint: 4.0,
        enteredBy: 1
      });
    });

    it('should check if student passed', () => {
      expect(grade.isPassed(35)).toBe(true);
      expect(grade.isPassed(95)).toBe(false);
    });

    it('should check if grade is NG (Not Graded)', () => {
      expect(grade.isNotGraded()).toBe(false);

      grade.grade = NEBGrade.NG;
      expect(grade.isNotGraded()).toBe(true);
    });

    it('should calculate percentage', () => {
      expect(grade.getPercentage(100)).toBe(90.5);
      expect(grade.getPercentage(75)).toBeCloseTo(120.67, 1);
      expect(grade.getPercentage(0)).toBe(0);
    });

    it('should get grade description', () => {
      const descriptions: Record<NEBGrade, string> = {
        [NEBGrade.A_PLUS]: 'Outstanding',
        [NEBGrade.A]: 'Excellent',
        [NEBGrade.B_PLUS]: 'Very Good',
        [NEBGrade.B]: 'Good',
        [NEBGrade.C_PLUS]: 'Satisfactory',
        [NEBGrade.C]: 'Acceptable',
        [NEBGrade.D]: 'Basic',
        [NEBGrade.NG]: 'Not Graded'
      };

      for (const [gradeValue, description] of Object.entries(descriptions)) {
        grade.grade = gradeValue as NEBGrade;
        expect(grade.getGradeDescription()).toBe(description);
      }
    });

    it('should check if student has distinction', () => {
      grade.grade = NEBGrade.A_PLUS;
      expect(grade.hasDistinction()).toBe(true);

      grade.grade = NEBGrade.A;
      expect(grade.hasDistinction()).toBe(true);

      grade.grade = NEBGrade.B_PLUS;
      expect(grade.hasDistinction()).toBe(false);
    });

    it('should validate marks are within bounds', () => {
      expect(grade.validateMarks(100, 75, 25)).toBe(true);
      expect(grade.validateMarks(80, 75, 25)).toBe(false); // Total exceeds full marks
      expect(grade.validateMarks(100, 60, 25)).toBe(false); // Theory exceeds theory full marks
      expect(grade.validateMarks(100, 75, 20)).toBe(false); // Practical exceeds practical full marks
    });

    it('should validate marks without theory/practical split', () => {
      const simpleGrade = new Grade({
        examId: 1,
        studentId: 2,
        totalMarks: 85,
        grade: NEBGrade.A,
        gradePoint: 3.6,
        enteredBy: 1
      });

      expect(simpleGrade.validateMarks(100)).toBe(true);
      expect(simpleGrade.validateMarks(80)).toBe(false);
    });
  });

  describe('Soft Delete', () => {
    it('should soft delete a grade', async () => {
      const grade = await Grade.create({
        examId: 1,
        studentId: 1,
        totalMarks: 85,
        grade: NEBGrade.A,
        gradePoint: 3.6,
        enteredBy: 1
      });

      await grade.destroy();

      const foundGrade = await Grade.findByPk(grade.gradeId);
      expect(foundGrade).toBeNull();

      const deletedGrade = await Grade.findByPk(grade.gradeId, { paranoid: false });
      expect(deletedGrade).not.toBeNull();
      expect(deletedGrade!.deletedAt).not.toBeNull();
    });
  });
});
