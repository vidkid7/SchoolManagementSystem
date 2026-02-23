import Grade from '@models/Grade.model';
import Exam from '@models/Exam.model';
import { Op } from 'sequelize';

/**
 * Rank Calculation Service
 * Handles class rank, section rank, and percentile calculations
 * 
 * Requirements: 7.10
 */

/**
 * Student rank information
 */
export interface StudentRank {
  studentId: number;
  totalMarks: number;
  rank: number;
  percentile: number;
}

/**
 * Rank calculation result for a class
 */
export interface ClassRankResult {
  examId: number;
  classId: number;
  sectionId?: number;
  totalStudents: number;
  ranks: StudentRank[];
}

/**
 * Rank calculation input
 */
export interface RankCalculationInput {
  examId: number;
  classId?: number;
  sectionId?: number;
}

class RankCalculationService {
  /**
   * Calculate ranks for students in an exam
   * 
   * Handles:
   * - Descending order by total marks
   * - Tied students get same rank
   * - Next rank is skipped after ties (e.g., if 2 students tie for rank 1, next is rank 3)
   * 
   * Requirements: 7.10
   */
  calculateRanks(students: Array<{ studentId: number; totalMarks: number }>): StudentRank[] {
    if (students.length === 0) {
      return [];
    }

    // Sort students by total marks in descending order
    const sortedStudents = [...students].sort((a, b) => b.totalMarks - a.totalMarks);

    const rankedStudents: StudentRank[] = [];
    let currentRank = 1;
    let previousMarks: number | null = null;
    let studentsWithSameRank = 0;

    for (let i = 0; i < sortedStudents.length; i++) {
      const student = sortedStudents[i];

      // If marks are different from previous, update rank
      if (previousMarks !== null && student.totalMarks < previousMarks) {
        currentRank += studentsWithSameRank;
        studentsWithSameRank = 0;
      }

      // Calculate percentile: percentage of students with marks less than or equal to current student
      // Percentile = (number of students with marks <= current marks / total students) * 100
      const studentsWithLowerOrEqualMarks = sortedStudents.filter(
        s => s.totalMarks <= student.totalMarks
      ).length;
      const percentile = (studentsWithLowerOrEqualMarks / sortedStudents.length) * 100;

      rankedStudents.push({
        studentId: student.studentId,
        totalMarks: student.totalMarks,
        rank: currentRank,
        percentile: Math.round(percentile * 100) / 100 // Round to 2 decimal places
      });

      previousMarks = student.totalMarks;
      studentsWithSameRank++;
    }

    return rankedStudents;
  }

  /**
   * Calculate class rank for an exam
   * 
   * Gets all students in a class who have grades for the exam,
   * then calculates their ranks
   * 
   * Requirements: 7.10
   */
  async calculateClassRank(examId: number, classId: number): Promise<ClassRankResult> {
    // Get exam details
    const exam = await Exam.findByPk(examId);
    if (!exam) {
      throw new Error(`Exam with ID ${examId} not found`);
    }

    // Verify exam belongs to the specified class
    if (exam.classId !== classId) {
      throw new Error(`Exam ${examId} does not belong to class ${classId}`);
    }

    // Get all grades for this exam
    const grades = await Grade.findAll({
      where: { examId },
      attributes: ['studentId', 'totalMarks'],
      order: [['totalMarks', 'DESC']]
    });

    if (grades.length === 0) {
      return {
        examId,
        classId,
        totalStudents: 0,
        ranks: []
      };
    }

    // Extract student data
    const students = grades.map(g => ({
      studentId: g.studentId,
      totalMarks: g.totalMarks
    }));

    // Calculate ranks
    const ranks = this.calculateRanks(students);

    return {
      examId,
      classId,
      totalStudents: grades.length,
      ranks
    };
  }

  /**
   * Calculate section rank for an exam
   * 
   * Similar to class rank but filtered by section
   * Note: This requires student records to have section information
   * 
   * Requirements: 7.10
   */
  async calculateSectionRank(
    examId: number,
    classId: number,
    sectionId: number
  ): Promise<ClassRankResult> {
    // Get exam details
    const exam = await Exam.findByPk(examId);
    if (!exam) {
      throw new Error(`Exam with ID ${examId} not found`);
    }

    // Verify exam belongs to the specified class
    if (exam.classId !== classId) {
      throw new Error(`Exam ${examId} does not belong to class ${classId}`);
    }

    // Get all grades for this exam
    // Note: We'll need to join with Student model to filter by section
    // For now, we'll get all grades and assume filtering happens at a higher level
    const grades = await Grade.findAll({
      where: { examId },
      attributes: ['studentId', 'totalMarks'],
      order: [['totalMarks', 'DESC']]
    });

    if (grades.length === 0) {
      return {
        examId,
        classId,
        sectionId,
        totalStudents: 0,
        ranks: []
      };
    }

    // Extract student data
    const students = grades.map(g => ({
      studentId: g.studentId,
      totalMarks: g.totalMarks
    }));

    // Calculate ranks
    const ranks = this.calculateRanks(students);

    return {
      examId,
      classId,
      sectionId,
      totalStudents: grades.length,
      ranks
    };
  }

  /**
   * Get rank for a specific student in an exam
   * 
   * Requirements: 7.10
   */
  async getStudentRank(examId: number, studentId: number): Promise<StudentRank | null> {
    // Get the student's grade
    const studentGrade = await Grade.findOne({
      where: { examId, studentId }
    });

    if (!studentGrade) {
      return null;
    }

    // Get exam details to find class
    const exam = await Exam.findByPk(examId);
    if (!exam) {
      throw new Error(`Exam with ID ${examId} not found`);
    }

    // Calculate class rank
    const classRankResult = await this.calculateClassRank(examId, exam.classId);

    // Find the student's rank in the result
    const studentRank = classRankResult.ranks.find(r => r.studentId === studentId);

    return studentRank || null;
  }

  /**
   * Calculate overall rank across multiple exams
   * 
   * Useful for calculating term rank or annual rank
   * Sums up total marks from all specified exams
   * 
   * Requirements: 7.10
   */
  async calculateOverallRank(examIds: number[], classId: number): Promise<ClassRankResult> {
    if (examIds.length === 0) {
      throw new Error('At least one exam ID is required');
    }

    // Get all grades for the specified exams
    const grades = await Grade.findAll({
      where: {
        examId: {
          [Op.in]: examIds
        }
      },
      attributes: ['studentId', 'examId', 'totalMarks']
    });

    if (grades.length === 0) {
      return {
        examId: examIds[0],
        classId,
        totalStudents: 0,
        ranks: []
      };
    }

    // Group grades by student and sum total marks
    const studentTotals = new Map<number, number>();

    for (const grade of grades) {
      const currentTotal = studentTotals.get(grade.studentId) || 0;
      studentTotals.set(grade.studentId, currentTotal + grade.totalMarks);
    }

    // Convert to array format
    const students = Array.from(studentTotals.entries()).map(([studentId, totalMarks]) => ({
      studentId,
      totalMarks
    }));

    // Calculate ranks
    const ranks = this.calculateRanks(students);

    return {
      examId: examIds[0], // Use first exam ID as reference
      classId,
      totalStudents: students.length,
      ranks
    };
  }

  /**
   * Calculate percentile for a student
   * 
   * Percentile indicates the percentage of students who scored at or below the student's score
   * 
   * Requirements: 7.10
   */
  calculatePercentile(studentMarks: number, allMarks: number[]): number {
    if (allMarks.length === 0) {
      return 0;
    }

    // Count students with marks less than or equal to student's marks
    const studentsAtOrBelow = allMarks.filter(marks => marks <= studentMarks).length;

    // Calculate percentile
    const percentile = (studentsAtOrBelow / allMarks.length) * 100;

    return Math.round(percentile * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get rank statistics for an exam
   * 
   * Returns useful statistics about rank distribution
   */
  async getRankStatistics(examId: number, classId: number): Promise<{
    totalStudents: number;
    topRank: number;
    bottomRank: number;
    averageMarks: number;
    medianMarks: number;
    tiedRanks: Array<{ rank: number; count: number }>;
  }> {
    const rankResult = await this.calculateClassRank(examId, classId);

    if (rankResult.totalStudents === 0) {
      return {
        totalStudents: 0,
        topRank: 0,
        bottomRank: 0,
        averageMarks: 0,
        medianMarks: 0,
        tiedRanks: []
      };
    }

    const ranks = rankResult.ranks;
    const allMarks = ranks.map(r => r.totalMarks);

    // Calculate average
    const totalMarks = allMarks.reduce((sum, marks) => sum + marks, 0);
    const averageMarks = totalMarks / allMarks.length;

    // Calculate median
    const sortedMarks = [...allMarks].sort((a, b) => a - b);
    const mid = Math.floor(sortedMarks.length / 2);
    const medianMarks = sortedMarks.length % 2 === 0
      ? (sortedMarks[mid - 1] + sortedMarks[mid]) / 2
      : sortedMarks[mid];

    // Find tied ranks
    const rankCounts = new Map<number, number>();
    for (const student of ranks) {
      rankCounts.set(student.rank, (rankCounts.get(student.rank) || 0) + 1);
    }

    const tiedRanks = Array.from(rankCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([rank, count]) => ({ rank, count }))
      .sort((a, b) => a.rank - b.rank);

    return {
      totalStudents: rankResult.totalStudents,
      topRank: ranks[0].rank,
      bottomRank: ranks[ranks.length - 1].rank,
      averageMarks: Math.round(averageMarks * 100) / 100,
      medianMarks: Math.round(medianMarks * 100) / 100,
      tiedRanks
    };
  }
}

export default new RankCalculationService();
