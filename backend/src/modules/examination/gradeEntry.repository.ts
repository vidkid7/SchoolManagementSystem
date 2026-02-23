import Grade, { GradeAttributes, GradeCreationAttributes, NEBGrade } from '@models/Grade.model';
import { Op } from 'sequelize';

/**
 * Grade Entry Repository
 * Handles database operations for grade entries
 * 
 * Requirements: 7.6, 7.9, N1.1
 */
class GradeEntryRepository {
  /**
   * Create a new grade entry
   */
  async create(gradeData: GradeCreationAttributes): Promise<Grade> {
    return await Grade.create(gradeData);
  }

  /**
   * Bulk create grade entries
   */
  async bulkCreate(gradesData: GradeCreationAttributes[]): Promise<Grade[]> {
    return await Grade.bulkCreate(gradesData);
  }

  /**
   * Find grade by ID
   */
  async findById(gradeId: number): Promise<Grade | null> {
    return await Grade.findByPk(gradeId);
  }

  /**
   * Find all grades with optional filters
   */
  async findAll(filters?: {
    examId?: number;
    studentId?: number;
    grade?: NEBGrade;
    minGradePoint?: number;
    maxGradePoint?: number;
  }): Promise<Grade[]> {
    const where: any = {};

    if (filters) {
      if (filters.examId) where.examId = filters.examId;
      if (filters.studentId) where.studentId = filters.studentId;
      if (filters.grade) where.grade = filters.grade;
      
      if (filters.minGradePoint !== undefined || filters.maxGradePoint !== undefined) {
        where.gradePoint = {};
        if (filters.minGradePoint !== undefined) {
          where.gradePoint[Op.gte] = filters.minGradePoint;
        }
        if (filters.maxGradePoint !== undefined) {
          where.gradePoint[Op.lte] = filters.maxGradePoint;
        }
      }
    }

    return await Grade.findAll({
      where,
      order: [['enteredAt', 'DESC']]
    });
  }

  /**
   * Find grades by exam ID
   */
  async findByExamId(examId: number): Promise<Grade[]> {
    return await Grade.findAll({
      where: { examId },
      order: [['studentId', 'ASC']]
    });
  }

  /**
   * Find grades by student ID
   */
  async findByStudentId(studentId: number): Promise<Grade[]> {
    return await Grade.findAll({
      where: { studentId },
      order: [['enteredAt', 'DESC']]
    });
  }

  /**
   * Find grade by student and exam
   */
  async findByStudentAndExam(studentId: number, examId: number): Promise<Grade | null> {
    return await Grade.findOne({
      where: {
        studentId,
        examId
      }
    });
  }

  /**
   * Find grades by multiple exam IDs
   */
  async findByExamIds(examIds: number[]): Promise<Grade[]> {
    return await Grade.findAll({
      where: {
        examId: {
          [Op.in]: examIds
        }
      },
      order: [['examId', 'ASC'], ['studentId', 'ASC']]
    });
  }

  /**
   * Find grades by student and multiple exams
   */
  async findByStudentAndExams(studentId: number, examIds: number[]): Promise<Grade[]> {
    return await Grade.findAll({
      where: {
        studentId,
        examId: {
          [Op.in]: examIds
        }
      },
      order: [['examId', 'ASC']]
    });
  }

  /**
   * Update grade
   */
  async update(gradeId: number, updateData: Partial<GradeAttributes>): Promise<Grade | null> {
    const grade = await Grade.findByPk(gradeId);
    if (!grade) {
      return null;
    }

    await grade.update(updateData);
    return grade;
  }

  /**
   * Delete grade (soft delete)
   */
  async delete(gradeId: number): Promise<boolean> {
    const grade = await Grade.findByPk(gradeId);
    if (!grade) {
      return false;
    }

    await grade.destroy();
    return true;
  }

  /**
   * Check if grade exists for student and exam
   */
  async exists(studentId: number, examId: number): Promise<boolean> {
    const count = await Grade.count({
      where: {
        studentId,
        examId
      }
    });
    return count > 0;
  }

  /**
   * Count grades by exam
   */
  async countByExam(examId: number): Promise<number> {
    return await Grade.count({
      where: { examId }
    });
  }

  /**
   * Count grades by student
   */
  async countByStudent(studentId: number): Promise<number> {
    return await Grade.count({
      where: { studentId }
    });
  }

  /**
   * Find grades by grade level
   */
  async findByGrade(grade: NEBGrade): Promise<Grade[]> {
    return await Grade.findAll({
      where: { grade },
      order: [['enteredAt', 'DESC']]
    });
  }

  /**
   * Find grades by grade point range
   */
  async findByGradePointRange(minGradePoint: number, maxGradePoint: number): Promise<Grade[]> {
    return await Grade.findAll({
      where: {
        gradePoint: {
          [Op.between]: [minGradePoint, maxGradePoint]
        }
      },
      order: [['gradePoint', 'DESC']]
    });
  }

  /**
   * Find grades entered by a specific user
   */
  async findByEnteredBy(userId: number): Promise<Grade[]> {
    return await Grade.findAll({
      where: { enteredBy: userId },
      order: [['enteredAt', 'DESC']]
    });
  }

  /**
   * Find grades entered within a date range
   */
  async findByEnteredDateRange(startDate: Date, endDate: Date): Promise<Grade[]> {
    return await Grade.findAll({
      where: {
        enteredAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['enteredAt', 'DESC']]
    });
  }

  /**
   * Get average grade point for an exam
   */
  async getAverageGradePoint(examId: number): Promise<number> {
    const grades = await this.findByExamId(examId);
    if (grades.length === 0) return 0;

    const totalGradePoint = grades.reduce((sum, grade) => sum + grade.gradePoint, 0);
    return totalGradePoint / grades.length;
  }

  /**
   * Get average marks for an exam
   */
  async getAverageMarks(examId: number): Promise<number> {
    const grades = await this.findByExamId(examId);
    if (grades.length === 0) return 0;

    const totalMarks = grades.reduce((sum, grade) => sum + grade.totalMarks, 0);
    return totalMarks / grades.length;
  }

  /**
   * Get highest marks for an exam
   */
  async getHighestMarks(examId: number): Promise<number> {
    const grades = await this.findByExamId(examId);
    if (grades.length === 0) return 0;

    return Math.max(...grades.map(grade => grade.totalMarks));
  }

  /**
   * Get lowest marks for an exam
   */
  async getLowestMarks(examId: number): Promise<number> {
    const grades = await this.findByExamId(examId);
    if (grades.length === 0) return 0;

    return Math.min(...grades.map(grade => grade.totalMarks));
  }

  /**
   * Get grade distribution for an exam
   */
  async getGradeDistribution(examId: number): Promise<Record<string, number>> {
    const grades = await this.findByExamId(examId);
    const distribution: Record<string, number> = {};

    for (const grade of grades) {
      const gradeKey = grade.grade;
      distribution[gradeKey] = (distribution[gradeKey] || 0) + 1;
    }

    return distribution;
  }
}

export default new GradeEntryRepository();
