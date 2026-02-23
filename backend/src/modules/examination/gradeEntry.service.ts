import Grade, { GradeCreationAttributes, NEBGrade } from '@models/Grade.model';
import Exam from '@models/Exam.model';
import { calculateNEBGrade } from '@services/nebGrading.service';
import { Op } from 'sequelize';
import * as XLSX from 'xlsx';

/**
 * Grade Entry Service
 * Handles grade entry, validation, bulk import, and weighted grade calculations
 * 
 * Requirements: 7.6, 7.9, N1.1
 */

/**
 * Grade entry input data
 */
export interface GradeEntryInput {
  examId: number;
  studentId: number;
  theoryMarks?: number;
  practicalMarks?: number;
  totalMarks?: number;
  remarks?: string;
  enteredBy: number;
}

/**
 * Bulk grade entry input
 */
export interface BulkGradeEntryInput {
  examId: number;
  grades: Array<{
    studentId: number;
    theoryMarks?: number;
    practicalMarks?: number;
    totalMarks?: number;
    remarks?: string;
  }>;
  enteredBy: number;
}

/**
 * Grade entry validation result
 */
export interface GradeValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Weighted grade calculation input
 */
export interface WeightedGradeInput {
  examId: number;
  studentId: number;
  assessments: Array<{
    examId: number;
    weightage: number; // Percentage (0-100)
  }>;
}

/**
 * Weighted grade result
 */
export interface WeightedGradeResult {
  studentId: number;
  totalWeightedMarks: number;
  totalWeightedPercentage: number;
  grade: string;
  gradePoint: number;
  assessments: Array<{
    examId: number;
    marks: number;
    weightage: number;
    weightedMarks: number;
  }>;
}

/**
 * Excel import result
 */
export interface ExcelImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  failureCount: number;
  errors: Array<{
    row: number;
    studentId?: number;
    error: string;
  }>;
  importedGrades: Grade[];
}

class GradeEntryService {
  /**
   * Validate grade entry data
   * 
   * Validates:
   * - Marks are within valid range (0 to full marks)
   * - Theory + practical = total (if both provided)
   * - Exam exists
   * - No duplicate grade entry for same student and exam
   * 
   * Requirements: 7.6
   */
  async validateGradeEntry(input: GradeEntryInput): Promise<GradeValidationResult> {
    const errors: string[] = [];

    // Validate exam exists
    const exam = await Exam.findByPk(input.examId);
    if (!exam) {
      errors.push(`Exam with ID ${input.examId} not found`);
      return { isValid: false, errors };
    }

    // Check for duplicate grade entry
    const existingGrade = await Grade.findOne({
      where: {
        examId: input.examId,
        studentId: input.studentId
      }
    });

    if (existingGrade) {
      errors.push(`Grade already exists for student ${input.studentId} in exam ${input.examId}`);
    }

    // Validate marks based on exam configuration
    const hasTheory = exam.theoryMarks > 0;
    const hasPractical = exam.practicalMarks > 0;

    // If exam has both theory and practical, both must be provided
    if (hasTheory && hasPractical) {
      if (input.theoryMarks === undefined || input.practicalMarks === undefined) {
        errors.push('Both theory and practical marks are required for this exam');
      } else {
        // Validate theory marks range
        if (input.theoryMarks < 0 || input.theoryMarks > exam.theoryMarks) {
          errors.push(`Theory marks must be between 0 and ${exam.theoryMarks}`);
        }

        // Validate practical marks range
        if (input.practicalMarks < 0 || input.practicalMarks > exam.practicalMarks) {
          errors.push(`Practical marks must be between 0 and ${exam.practicalMarks}`);
        }

        // Calculate total from theory + practical
        const calculatedTotal = input.theoryMarks + input.practicalMarks;
        
        // If totalMarks is provided, it should match the sum
        if (input.totalMarks !== undefined && Math.abs(input.totalMarks - calculatedTotal) > 0.01) {
          errors.push(`Total marks (${input.totalMarks}) does not match theory + practical (${calculatedTotal})`);
        }
      }
    } else if (hasTheory && !hasPractical) {
      // Theory only exam
      if (input.theoryMarks === undefined) {
        errors.push('Theory marks are required for this exam');
      } else if (input.theoryMarks < 0 || input.theoryMarks > exam.theoryMarks) {
        errors.push(`Theory marks must be between 0 and ${exam.theoryMarks}`);
      }
    } else if (!hasTheory && hasPractical) {
      // Practical only exam
      if (input.practicalMarks === undefined) {
        errors.push('Practical marks are required for this exam');
      } else if (input.practicalMarks < 0 || input.practicalMarks > exam.practicalMarks) {
        errors.push(`Practical marks must be between 0 and ${exam.practicalMarks}`);
      }
    } else {
      // Total marks only
      if (input.totalMarks === undefined) {
        errors.push('Total marks are required for this exam');
      } else if (input.totalMarks < 0 || input.totalMarks > exam.fullMarks) {
        errors.push(`Total marks must be between 0 and ${exam.fullMarks}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create grade entry with validation
   * 
   * Automatically calculates:
   * - Total marks from theory + practical (if both provided)
   * - NEB grade from total marks percentage
   * - Grade point from NEB grade
   * 
   * Requirements: 7.6, N1.1
   */
  async createGradeEntry(input: GradeEntryInput): Promise<Grade> {
    // Validate input
    const validation = await this.validateGradeEntry(input);
    if (!validation.isValid) {
      throw new Error(`Grade entry validation failed: ${validation.errors.join(', ')}`);
    }

    // Get exam details
    const exam = await Exam.findByPk(input.examId);
    if (!exam) {
      throw new Error(`Exam with ID ${input.examId} not found`);
    }

    // Calculate total marks if not provided
    let totalMarks = input.totalMarks;
    if (totalMarks === undefined) {
      if (input.theoryMarks !== undefined && input.practicalMarks !== undefined) {
        totalMarks = input.theoryMarks + input.practicalMarks;
      } else if (input.theoryMarks !== undefined) {
        totalMarks = input.theoryMarks;
      } else if (input.practicalMarks !== undefined) {
        totalMarks = input.practicalMarks;
      } else {
        throw new Error('Unable to calculate total marks');
      }
    }

    // Calculate percentage based on full marks
    const percentage = (totalMarks / exam.fullMarks) * 100;

    // Calculate NEB grade and grade point
    const nebGrade = calculateNEBGrade(percentage);

    // Create grade entry
    const gradeData: GradeCreationAttributes = {
      examId: input.examId,
      studentId: input.studentId,
      theoryMarks: input.theoryMarks,
      practicalMarks: input.practicalMarks,
      totalMarks,
      grade: nebGrade.grade as NEBGrade,
      gradePoint: nebGrade.gradePoint,
      remarks: input.remarks,
      enteredBy: input.enteredBy,
      enteredAt: new Date()
    };

    const grade = await Grade.create(gradeData);
    return grade;
  }

  /**
   * Update existing grade entry
   * 
   * Recalculates NEB grade and grade point if marks are updated
   * 
   * Requirements: 7.6, N1.1
   */
  async updateGradeEntry(
    gradeId: number,
    updates: Partial<GradeEntryInput>
  ): Promise<Grade> {
    const grade = await Grade.findByPk(gradeId);
    if (!grade) {
      throw new Error(`Grade with ID ${gradeId} not found`);
    }

    const exam = await Exam.findByPk(grade.examId);
    if (!exam) {
      throw new Error(`Exam with ID ${grade.examId} not found`);
    }

    // Prepare update data
    const updateData: Partial<GradeCreationAttributes> = {};

    // Update marks if provided
    if (updates.theoryMarks !== undefined) {
      if (updates.theoryMarks < 0 || updates.theoryMarks > exam.theoryMarks) {
        throw new Error(`Theory marks must be between 0 and ${exam.theoryMarks}`);
      }
      updateData.theoryMarks = updates.theoryMarks;
    }

    if (updates.practicalMarks !== undefined) {
      if (updates.practicalMarks < 0 || updates.practicalMarks > exam.practicalMarks) {
        throw new Error(`Practical marks must be between 0 and ${exam.practicalMarks}`);
      }
      updateData.practicalMarks = updates.practicalMarks;
    }

    // Recalculate total marks if theory or practical changed
    if (updates.theoryMarks !== undefined || updates.practicalMarks !== undefined) {
      const theoryMarks = updates.theoryMarks ?? grade.theoryMarks ?? 0;
      const practicalMarks = updates.practicalMarks ?? grade.practicalMarks ?? 0;
      updateData.totalMarks = theoryMarks + practicalMarks;

      // Recalculate NEB grade and grade point
      const percentage = (updateData.totalMarks / exam.fullMarks) * 100;
      const nebGrade = calculateNEBGrade(percentage);
      updateData.grade = nebGrade.grade as NEBGrade;
      updateData.gradePoint = nebGrade.gradePoint;
    }

    if (updates.remarks !== undefined) {
      updateData.remarks = updates.remarks;
    }

    // Update grade
    await grade.update(updateData);
    return grade;
  }

  /**
   * Bulk grade import from Excel
   * 
   * Expected Excel format:
   * - Column A: Student ID
   * - Column B: Theory Marks (optional)
   * - Column C: Practical Marks (optional)
   * - Column D: Total Marks (optional)
   * - Column E: Remarks (optional)
   * 
   * Requirements: 7.9
   */
  async bulkImportFromExcel(
    examId: number,
    fileBuffer: Buffer,
    enteredBy: number
  ): Promise<ExcelImportResult> {
    const result: ExcelImportResult = {
      success: false,
      totalRows: 0,
      successCount: 0,
      failureCount: 0,
      errors: [],
      importedGrades: []
    };

    try {
      // Parse Excel file
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON - use raw option to get array of arrays
      const data = XLSX.utils.sheet_to_json(worksheet, { raw: false }) as any[];

      // Skip if no data
      if (data.length === 0) {
        return result;
      }

      result.totalRows = data.length;

      // Get exam details for validation
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        throw new Error(`Exam with ID ${examId} not found`);
      }

      // Process each row
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2; // +2 because Excel is 1-indexed and we may have header

        try {
          // Skip empty rows
          if (!row || Object.keys(row).length === 0) {
            continue;
          }

          // Extract data from row (assuming columns: Student ID, Theory Marks, Practical Marks, Total Marks, Remarks)
          const studentId = parseInt(row['Student ID'] || row['StudentID'] || row['student_id']);
          const theoryMarks = row['Theory Marks'] || row['TheoryMarks'] || row['theory_marks'];
          const practicalMarks = row['Practical Marks'] || row['PracticalMarks'] || row['practical_marks'];
          const totalMarks = row['Total Marks'] || row['TotalMarks'] || row['total_marks'];
          const remarks = row['Remarks'] || row['remarks'];

          // Validate student ID
          if (isNaN(studentId)) {
            result.errors.push({
              row: rowNumber,
              error: 'Invalid student ID'
            });
            result.failureCount++;
            continue;
          }

          // Parse marks
          const parsedTheoryMarks = theoryMarks !== undefined && theoryMarks !== '' ? parseFloat(theoryMarks) : undefined;
          const parsedPracticalMarks = practicalMarks !== undefined && practicalMarks !== '' ? parseFloat(practicalMarks) : undefined;
          const parsedTotalMarks = totalMarks !== undefined && totalMarks !== '' ? parseFloat(totalMarks) : undefined;

          // Create grade entry
          const gradeInput: GradeEntryInput = {
            examId,
            studentId,
            theoryMarks: parsedTheoryMarks,
            practicalMarks: parsedPracticalMarks,
            totalMarks: parsedTotalMarks,
            remarks: remarks ? String(remarks) : undefined,
            enteredBy
          };

          const grade = await this.createGradeEntry(gradeInput);
          result.importedGrades.push(grade);
          result.successCount++;
        } catch (error) {
          result.errors.push({
            row: rowNumber,
            studentId: row['Student ID'] || row['StudentID'] || row['student_id'],
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          result.failureCount++;
        }
      }

      result.success = result.successCount > 0;
      return result;
    } catch (error) {
      throw new Error(`Excel import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate weighted grades across multiple assessments
   * 
   * Example: Final grade = 30% Unit Test + 70% Terminal Exam
   * 
   * Requirements: 7.6
   */
  async calculateWeightedGrades(input: WeightedGradeInput): Promise<WeightedGradeResult> {
    const { studentId, assessments } = input;

    // Validate weightages sum to 100
    const totalWeightage = assessments.reduce((sum, a) => sum + a.weightage, 0);
    if (Math.abs(totalWeightage - 100) > 0.01) {
      throw new Error(`Weightages must sum to 100. Current sum: ${totalWeightage}`);
    }

    // Fetch grades for all assessments
    const examIds = assessments.map(a => a.examId);
    const grades = await Grade.findAll({
      where: {
        studentId,
        examId: {
          [Op.in]: examIds
        }
      },
      include: [
        {
          model: Exam,
          as: 'exam',
          attributes: ['examId', 'fullMarks']
        }
      ]
    });

    // Check if all grades are available
    if (grades.length !== assessments.length) {
      const foundExamIds = grades.map(g => g.examId);
      const missingExamIds = examIds.filter(id => !foundExamIds.includes(id));
      throw new Error(`Missing grades for exams: ${missingExamIds.join(', ')}`);
    }

    // Calculate weighted marks
    let totalWeightedMarks = 0;
    const assessmentResults = [];

    for (const assessment of assessments) {
      const grade = grades.find(g => g.examId === assessment.examId);
      if (!grade) {
        throw new Error(`Grade not found for exam ${assessment.examId}`);
      }

      const exam = await Exam.findByPk(assessment.examId);
      if (!exam) {
        throw new Error(`Exam not found: ${assessment.examId}`);
      }

      // Calculate percentage for this assessment
      const percentage = (grade.totalMarks / exam.fullMarks) * 100;

      // Apply weightage
      const weightedMarks = (percentage * assessment.weightage) / 100;
      totalWeightedMarks += weightedMarks;

      assessmentResults.push({
        examId: assessment.examId,
        marks: grade.totalMarks,
        weightage: assessment.weightage,
        weightedMarks
      });
    }

    // Calculate final NEB grade from weighted percentage
    const nebGrade = calculateNEBGrade(totalWeightedMarks);

    return {
      studentId,
      totalWeightedMarks,
      totalWeightedPercentage: totalWeightedMarks,
      grade: nebGrade.grade,
      gradePoint: nebGrade.gradePoint,
      assessments: assessmentResults
    };
  }

  /**
   * Get grade by ID
   */
  async getGradeById(gradeId: number): Promise<Grade | null> {
    return await Grade.findByPk(gradeId);
  }

  /**
   * Get grades for an exam
   */
  async getGradesByExam(examId: number): Promise<Grade[]> {
    return await Grade.findAll({
      where: { examId },
      order: [['studentId', 'ASC']]
    });
  }

  /**
   * Get grades for a student
   */
  async getGradesByStudent(studentId: number): Promise<Grade[]> {
    return await Grade.findAll({
      where: { studentId },
      order: [['enteredAt', 'DESC']]
    });
  }

  /**
   * Get grade for specific student and exam
   */
  async getGradeByStudentAndExam(studentId: number, examId: number): Promise<Grade | null> {
    return await Grade.findOne({
      where: {
        studentId,
        examId
      }
    });
  }

  /**
   * Delete grade entry (soft delete)
   */
  async deleteGrade(gradeId: number): Promise<boolean> {
    const grade = await Grade.findByPk(gradeId);
    if (!grade) {
      return false;
    }

    await grade.destroy();
    return true;
  }

  /**
   * Get grade statistics for an exam
   */
  async getExamStatistics(examId: number): Promise<{
    totalStudents: number;
    averageMarks: number;
    highestMarks: number;
    lowestMarks: number;
    passCount: number;
    failCount: number;
    passPercentage: number;
    gradeDistribution: Record<string, number>;
  }> {
    const grades = await this.getGradesByExam(examId);
    const exam = await Exam.findByPk(examId);

    if (!exam) {
      throw new Error(`Exam with ID ${examId} not found`);
    }

    const totalStudents = grades.length;
    if (totalStudents === 0) {
      return {
        totalStudents: 0,
        averageMarks: 0,
        highestMarks: 0,
        lowestMarks: 0,
        passCount: 0,
        failCount: 0,
        passPercentage: 0,
        gradeDistribution: {}
      };
    }

    const totalMarks = grades.reduce((sum, g) => sum + g.totalMarks, 0);
    const averageMarks = totalMarks / totalStudents;
    const highestMarks = Math.max(...grades.map(g => g.totalMarks));
    const lowestMarks = Math.min(...grades.map(g => g.totalMarks));

    const passCount = grades.filter(g => g.totalMarks >= exam.passMarks).length;
    const failCount = totalStudents - passCount;
    const passPercentage = (passCount / totalStudents) * 100;

    // Grade distribution
    const gradeDistribution: Record<string, number> = {};
    for (const grade of grades) {
      const gradeKey = grade.grade;
      gradeDistribution[gradeKey] = (gradeDistribution[gradeKey] || 0) + 1;
    }

    return {
      totalStudents,
      averageMarks: Math.round(averageMarks * 100) / 100,
      highestMarks,
      lowestMarks,
      passCount,
      failCount,
      passPercentage: Math.round(passPercentage * 100) / 100,
      gradeDistribution
    };
  }
}

export default new GradeEntryService();
