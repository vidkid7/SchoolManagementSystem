import Grade from '@models/Grade.model';
import Exam from '@models/Exam.model';
import { calculateNEBGrade } from '@services/nebGrading.service';
import { Op } from 'sequelize';

/**
 * Internal Assessment Service
 * Handles internal assessment tracking and final marks calculation
 * combining internal and terminal exams per NEB standards
 * 
 * Requirements: 7.11
 */

/**
 * Internal assessment configuration
 */
export interface InternalAssessmentConfig {
  subjectId: number;
  classId: number;
  termId: number;
  internalWeightage: number; // Percentage (25-50 as per NEB)
  terminalWeightage: number; // Percentage (50-75 as per NEB)
}

/**
 * Final marks calculation input
 */
export interface FinalMarksInput {
  studentId: number;
  subjectId: number;
  classId: number;
  termId: number;
  internalWeightage: number; // Percentage (25-50)
}

/**
 * Final marks result
 */
export interface FinalMarksResult {
  studentId: number;
  subjectId: number;
  classId: number;
  termId: number;
  internalAssessment: {
    examId: number;
    examName: string;
    marks: number;
    fullMarks: number;
    percentage: number;
    weightage: number;
    weightedMarks: number;
  } | null;
  terminalExam: {
    examId: number;
    examName: string;
    marks: number;
    fullMarks: number;
    percentage: number;
    weightage: number;
    weightedMarks: number;
  } | null;
  finalMarks: number;
  finalPercentage: number;
  finalGrade: string;
  finalGradePoint: number;
}

/**
 * Subject internal assessment summary
 */
export interface SubjectAssessmentSummary {
  subjectId: number;
  hasInternalAssessment: boolean;
  hasTerminalExam: boolean;
  internalWeightage: number;
  terminalWeightage: number;
  studentsWithBothGrades: number;
  studentsWithInternalOnly: number;
  studentsWithTerminalOnly: number;
  studentsWithNoGrades: number;
}

class InternalAssessmentService {
  /**
   * Validate internal assessment weightage configuration
   * 
   * Per NEB standards:
   * - Internal assessment: 25-50%
   * - Terminal exam: 50-75%
   * - Total must equal 100%
   * 
   * Requirements: 7.11
   */
  validateWeightageConfig(internalWeightage: number, terminalWeightage: number): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check internal weightage range (25-50%)
    if (internalWeightage < 25 || internalWeightage > 50) {
      errors.push('Internal assessment weightage must be between 25% and 50% as per NEB standards');
    }

    // Check terminal weightage range (50-75%)
    if (terminalWeightage < 50 || terminalWeightage > 75) {
      errors.push('Terminal exam weightage must be between 50% and 75% as per NEB standards');
    }

    // Check total equals 100%
    const total = internalWeightage + terminalWeightage;
    if (Math.abs(total - 100) > 0.01) {
      errors.push(`Internal and terminal weightages must sum to 100%. Current sum: ${total}%`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate final marks combining internal and terminal exams
   * 
   * Formula:
   * Final Marks = (Internal Assessment × Internal Weightage) + (Terminal Exam × Terminal Weightage)
   * 
   * Requirements: 7.11
   */
  async calculateFinalMarks(input: FinalMarksInput): Promise<FinalMarksResult> {
    const { studentId, subjectId, classId, termId, internalWeightage } = input;
    const terminalWeightage = 100 - internalWeightage;

    // Validate weightage configuration
    const validation = this.validateWeightageConfig(internalWeightage, terminalWeightage);
    if (!validation.isValid) {
      throw new Error(`Invalid weightage configuration: ${validation.errors.join(', ')}`);
    }

    // Find internal assessment exam for this subject/class/term
    const internalExam = await Exam.findOne({
      where: {
        subjectId,
        classId,
        termId,
        isInternal: true,
        status: 'completed'
      }
    });

    // Find terminal exam for this subject/class/term
    const terminalExam = await Exam.findOne({
      where: {
        subjectId,
        classId,
        termId,
        isInternal: false,
        type: {
          [Op.in]: ['first_terminal', 'second_terminal', 'final']
        },
        status: 'completed'
      }
    });

    // Get grades for both exams
    let internalGrade = null;
    let terminalGrade = null;

    if (internalExam) {
      internalGrade = await Grade.findOne({
        where: {
          studentId,
          examId: internalExam.examId
        }
      });
    }

    if (terminalExam) {
      terminalGrade = await Grade.findOne({
        where: {
          studentId,
          examId: terminalExam.examId
        }
      });
    }

    // Calculate weighted marks
    let internalWeightedMarks = 0;
    let terminalWeightedMarks = 0;
    let internalPercentage = 0;
    let terminalPercentage = 0;

    const internalAssessmentData = internalExam && internalGrade ? {
      examId: internalExam.examId,
      examName: internalExam.name,
      marks: internalGrade.totalMarks,
      fullMarks: internalExam.fullMarks,
      percentage: (internalGrade.totalMarks / internalExam.fullMarks) * 100,
      weightage: internalWeightage,
      weightedMarks: 0
    } : null;

    const terminalExamData = terminalExam && terminalGrade ? {
      examId: terminalExam.examId,
      examName: terminalExam.name,
      marks: terminalGrade.totalMarks,
      fullMarks: terminalExam.fullMarks,
      percentage: (terminalGrade.totalMarks / terminalExam.fullMarks) * 100,
      weightage: terminalWeightage,
      weightedMarks: 0
    } : null;

    if (internalAssessmentData) {
      internalPercentage = internalAssessmentData.percentage;
      internalWeightedMarks = (internalPercentage * internalWeightage) / 100;
      internalAssessmentData.weightedMarks = internalWeightedMarks;
    }

    if (terminalExamData) {
      terminalPercentage = terminalExamData.percentage;
      terminalWeightedMarks = (terminalPercentage * terminalWeightage) / 100;
      terminalExamData.weightedMarks = terminalWeightedMarks;
    }

    // Calculate final percentage
    const finalPercentage = internalWeightedMarks + terminalWeightedMarks;

    // Calculate NEB grade from final percentage
    const nebGrade = calculateNEBGrade(finalPercentage);

    return {
      studentId,
      subjectId,
      classId,
      termId,
      internalAssessment: internalAssessmentData,
      terminalExam: terminalExamData,
      finalMarks: finalPercentage,
      finalPercentage,
      finalGrade: nebGrade.grade,
      finalGradePoint: nebGrade.gradePoint
    };
  }

  /**
   * Calculate final marks for all students in a class for a subject
   * 
   * Requirements: 7.11
   */
  async calculateFinalMarksForClass(
    subjectId: number,
    classId: number,
    termId: number,
    internalWeightage: number
  ): Promise<FinalMarksResult[]> {
    // Get all students who have grades for either internal or terminal exam
    const internalExam = await Exam.findOne({
      where: {
        subjectId,
        classId,
        termId,
        isInternal: true
      }
    });

    const terminalExam = await Exam.findOne({
      where: {
        subjectId,
        classId,
        termId,
        isInternal: false,
        type: {
          [Op.in]: ['first_terminal', 'second_terminal', 'final']
        }
      }
    });

    if (!internalExam && !terminalExam) {
      return [];
    }

    // Get all unique student IDs who have grades
    const examIds = [];
    if (internalExam) examIds.push(internalExam.examId);
    if (terminalExam) examIds.push(terminalExam.examId);

    const grades = await Grade.findAll({
      where: {
        examId: {
          [Op.in]: examIds
        }
      },
      attributes: ['studentId'],
      group: ['studentId']
    });

    const studentIds = grades.map(g => g.studentId);

    // Calculate final marks for each student
    const results: FinalMarksResult[] = [];
    for (const studentId of studentIds) {
      try {
        const result = await this.calculateFinalMarks({
          studentId,
          subjectId,
          classId,
          termId,
          internalWeightage
        });
        results.push(result);
      } catch (error) {
        // Skip students with errors (e.g., missing grades)
        console.error(`Error calculating final marks for student ${studentId}:`, error);
      }
    }

    return results;
  }

  /**
   * Get internal assessment summary for a subject
   * 
   * Requirements: 7.11
   */
  async getSubjectAssessmentSummary(
    subjectId: number,
    classId: number,
    termId: number
  ): Promise<SubjectAssessmentSummary> {
    // Find internal and terminal exams
    const internalExam = await Exam.findOne({
      where: {
        subjectId,
        classId,
        termId,
        isInternal: true
      }
    });

    const terminalExam = await Exam.findOne({
      where: {
        subjectId,
        classId,
        termId,
        isInternal: false,
        type: {
          [Op.in]: ['first_terminal', 'second_terminal', 'final']
        }
      }
    });

    const hasInternalAssessment = !!internalExam;
    const hasTerminalExam = !!terminalExam;

    // Get weightages from exams
    const internalWeightage = internalExam?.weightage || 0;
    const terminalWeightage = terminalExam?.weightage || 0;

    // Count students with grades
    let studentsWithBothGrades = 0;
    let studentsWithInternalOnly = 0;
    let studentsWithTerminalOnly = 0;

    if (internalExam && terminalExam) {
      // Get all unique student IDs
      const allGrades = await Grade.findAll({
        where: {
          examId: {
            [Op.in]: [internalExam.examId, terminalExam.examId]
          }
        },
        attributes: ['studentId', 'examId']
      });

      const studentGrades = new Map<number, Set<number>>();
      for (const grade of allGrades) {
        if (!studentGrades.has(grade.studentId)) {
          studentGrades.set(grade.studentId, new Set());
        }
        studentGrades.get(grade.studentId)!.add(grade.examId);
      }

      for (const [, examIds] of studentGrades) {
        const hasInternal = examIds.has(internalExam.examId);
        const hasTerminal = examIds.has(terminalExam.examId);

        if (hasInternal && hasTerminal) {
          studentsWithBothGrades++;
        } else if (hasInternal) {
          studentsWithInternalOnly++;
        } else if (hasTerminal) {
          studentsWithTerminalOnly++;
        }
      }
    } else if (internalExam) {
      studentsWithInternalOnly = await Grade.count({
        where: { examId: internalExam.examId }
      });
    } else if (terminalExam) {
      studentsWithTerminalOnly = await Grade.count({
        where: { examId: terminalExam.examId }
      });
    }

    return {
      subjectId,
      hasInternalAssessment,
      hasTerminalExam,
      internalWeightage,
      terminalWeightage,
      studentsWithBothGrades,
      studentsWithInternalOnly,
      studentsWithTerminalOnly,
      studentsWithNoGrades: 0 // Would need class roster to calculate this
    };
  }

  /**
   * Get internal assessment exams for a class/term
   * 
   * Requirements: 7.11
   */
  async getInternalAssessmentExams(
    classId: number,
    termId: number,
    subjectId?: number
  ): Promise<Exam[]> {
    const where: any = {
      classId,
      termId,
      isInternal: true
    };

    if (subjectId) {
      where.subjectId = subjectId;
    }

    return await Exam.findAll({
      where,
      order: [['examDate', 'ASC']]
    });
  }

  /**
   * Get terminal exams for a class/term
   * 
   * Requirements: 7.11
   */
  async getTerminalExams(
    classId: number,
    termId: number,
    subjectId?: number
  ): Promise<Exam[]> {
    const where: any = {
      classId,
      termId,
      isInternal: false,
      type: {
        [Op.in]: ['first_terminal', 'second_terminal', 'final']
      }
    };

    if (subjectId) {
      where.subjectId = subjectId;
    }

    return await Exam.findAll({
      where,
      order: [['examDate', 'ASC']]
    });
  }
}

export default new InternalAssessmentService();
