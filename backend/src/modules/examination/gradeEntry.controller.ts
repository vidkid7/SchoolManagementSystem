import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import gradeEntryService from './gradeEntry.service';
import { GradeEntryInput, BulkGradeEntryInput, WeightedGradeInput } from './gradeEntry.service';

/**
 * Grade Entry Controller
 * Handles HTTP requests for grade entry operations
 * 
 * Requirements: 7.6, 7.9, N1.1
 */
class GradeEntryController {
  /**
   * Create a single grade entry
   * POST /api/v1/grades
   */
  async createGradeEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const input: GradeEntryInput = {
        examId: req.body.examId,
        studentId: req.body.studentId,
        theoryMarks: req.body.theoryMarks,
        practicalMarks: req.body.practicalMarks,
        totalMarks: req.body.totalMarks,
        remarks: req.body.remarks,
        enteredBy: req.user?.userId || 0 // From auth middleware
      };

      const grade = await gradeEntryService.createGradeEntry(input);

      res.status(201).json({
        success: true,
        data: grade,
        message: 'Grade entry created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a grade entry
   * PUT /api/v1/grades/:gradeId
   */
  async updateGradeEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const gradeId = parseInt(req.params.gradeId);
      const updates: Partial<GradeEntryInput> = {
        theoryMarks: req.body.theoryMarks,
        practicalMarks: req.body.practicalMarks,
        totalMarks: req.body.totalMarks,
        remarks: req.body.remarks
      };

      const grade = await gradeEntryService.updateGradeEntry(gradeId, updates);

      res.status(200).json({
        success: true,
        data: grade,
        message: 'Grade entry updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk grade entry
   * POST /api/v1/grades/bulk
   */
  async bulkGradeEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const input: BulkGradeEntryInput = {
        examId: req.body.examId,
        grades: req.body.grades,
        enteredBy: req.user?.userId || 0
      };

      const results = [];
      const errors_list = [];

      for (const gradeData of input.grades) {
        try {
          const gradeInput: GradeEntryInput = {
            examId: input.examId,
            studentId: gradeData.studentId,
            theoryMarks: gradeData.theoryMarks,
            practicalMarks: gradeData.practicalMarks,
            totalMarks: gradeData.totalMarks,
            remarks: gradeData.remarks,
            enteredBy: input.enteredBy
          };

          const grade = await gradeEntryService.createGradeEntry(gradeInput);
          results.push(grade);
        } catch (error) {
          errors_list.push({
            studentId: gradeData.studentId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.status(201).json({
        success: true,
        data: {
          successCount: results.length,
          failureCount: errors_list.length,
          grades: results,
          errors: errors_list
        },
        message: `Bulk grade entry completed: ${results.length} successful, ${errors_list.length} failed`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk import from Excel
   * POST /api/v1/grades/import/excel
   */
  async bulkImportExcel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      // Check if file is uploaded
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: {
            code: 'FILE_REQUIRED',
            message: 'Excel file is required'
          }
        });
        return;
      }

      const examId = parseInt(req.body.examId);
      const enteredBy = req.user?.userId || 0;

      const result = await gradeEntryService.bulkImportFromExcel(
        examId,
        req.file.buffer,
        enteredBy
      );

      res.status(201).json({
        success: result.success,
        data: result,
        message: `Excel import completed: ${result.successCount} successful, ${result.failureCount} failed`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate weighted grades
   * POST /api/v1/grades/weighted
   */
  async calculateWeightedGrades(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const input: WeightedGradeInput = {
        examId: 0, // Not used in weighted calculation
        studentId: req.body.studentId,
        assessments: req.body.assessments
      };

      const result = await gradeEntryService.calculateWeightedGrades(input);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Weighted grades calculated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get grade by ID
   * GET /api/v1/grades/:gradeId
   */
  async getGradeById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const gradeId = parseInt(req.params.gradeId);
      const grade = await gradeEntryService.getGradeById(gradeId);

      if (!grade) {
        res.status(404).json({
          success: false,
          error: {
            code: 'GRADE_NOT_FOUND',
            message: `Grade with ID ${gradeId} not found`
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: grade
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get grades by exam
   * GET /api/v1/grades/exam/:examId
   */
  async getGradesByExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const examId = parseInt(req.params.examId);
      const grades = await gradeEntryService.getGradesByExam(examId);

      res.status(200).json({
        success: true,
        data: grades,
        meta: {
          total: grades.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get grades by student
   * GET /api/v1/grades/student/:studentId
   */
  async getGradesByStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const studentId = parseInt(req.params.studentId);
      const grades = await gradeEntryService.getGradesByStudent(studentId);

      res.status(200).json({
        success: true,
        data: grades,
        meta: {
          total: grades.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get grade by student and exam
   * GET /api/v1/grades/student-exam
   */
  async getGradeByStudentAndExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const studentId = parseInt(req.query.studentId as string);
      const examId = parseInt(req.query.examId as string);
      const grade = await gradeEntryService.getGradeByStudentAndExam(studentId, examId);

      if (!grade) {
        res.status(404).json({
          success: false,
          error: {
            code: 'GRADE_NOT_FOUND',
            message: `Grade not found for student ${studentId} in exam ${examId}`
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: grade
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete grade
   * DELETE /api/v1/grades/:gradeId
   */
  async deleteGrade(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const gradeId = parseInt(req.params.gradeId);
      const deleted = await gradeEntryService.deleteGrade(gradeId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: {
            code: 'GRADE_NOT_FOUND',
            message: `Grade with ID ${gradeId} not found`
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Grade deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get exam statistics
   * GET /api/v1/grades/exam/:examId/statistics
   */
  async getExamStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const examId = parseInt(req.params.examId);
      const statistics = await gradeEntryService.getExamStatistics(examId);

      res.status(200).json({
        success: true,
        data: statistics
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new GradeEntryController();
