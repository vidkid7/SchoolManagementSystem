import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import examService, { ExamInput, ExamFilters } from './exam.service';
import examScheduleService from './examSchedule.service';
import gradeEntryService, { GradeEntryInput } from './gradeEntry.service';
import { ExamScheduleCreationAttributes } from '@models/ExamSchedule.model';
import { SchoolInfo, ReportCardOptions } from './reportCard.service';

/**
 * Exam Controller
 * Handles HTTP requests for examination management
 * 
 * Requirements: 7.1-7.12
 */
class ExamController {
  /**
   * Get all exams with filters
   * GET /api/v1/exams
   * 
   * Requirements: 7.1
   */
  async getExams(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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

      const filters: ExamFilters = {
        classId: req.query.classId ? parseInt(req.query.classId as string) : undefined,
        subjectId: req.query.subjectId ? parseInt(req.query.subjectId as string) : undefined,
        academicYearId: req.query.academicYearId ? parseInt(req.query.academicYearId as string) : undefined,
        termId: req.query.termId ? parseInt(req.query.termId as string) : undefined,
        type: req.query.type as any,
        status: req.query.status as any,
        isInternal: req.query.isInternal ? req.query.isInternal === 'true' : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20
      };

      const result = await examService.getExams(filters);

      res.status(200).json({
        success: true,
        data: result.exams,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new exam
   * POST /api/v1/exams
   * 
   * Requirements: 7.1
   */
  async createExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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

      const input: ExamInput = {
        name: req.body.name,
        type: req.body.type,
        subjectId: req.body.subjectId,
        classId: req.body.classId,
        academicYearId: req.body.academicYearId,
        termId: req.body.termId,
        examDate: new Date(req.body.examDate),
        duration: req.body.duration,
        fullMarks: req.body.fullMarks,
        passMarks: req.body.passMarks,
        theoryMarks: req.body.theoryMarks,
        practicalMarks: req.body.practicalMarks,
        weightage: req.body.weightage,
        isInternal: req.body.isInternal
      };

      const exam = await examService.createExam(input);

      res.status(201).json({
        success: true,
        data: exam,
        message: 'Exam created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get exam by ID
   * GET /api/v1/exams/:examId
   * 
   * Requirements: 7.1
   */
  async getExamById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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
      const exam = await examService.getExamById(examId);

      if (!exam) {
        res.status(404).json({
          success: false,
          error: {
            code: 'EXAM_NOT_FOUND',
            message: `Exam with ID ${examId} not found`
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: exam
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update exam
   * PUT /api/v1/exams/:examId
   * 
   * Requirements: 7.1
   */
  async updateExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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
      const updates: Partial<ExamInput> = {};

      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.type !== undefined) updates.type = req.body.type;
      if (req.body.examDate !== undefined) updates.examDate = new Date(req.body.examDate);
      if (req.body.duration !== undefined) updates.duration = req.body.duration;
      if (req.body.fullMarks !== undefined) updates.fullMarks = req.body.fullMarks;
      if (req.body.passMarks !== undefined) updates.passMarks = req.body.passMarks;
      if (req.body.theoryMarks !== undefined) updates.theoryMarks = req.body.theoryMarks;
      if (req.body.practicalMarks !== undefined) updates.practicalMarks = req.body.practicalMarks;
      if (req.body.weightage !== undefined) updates.weightage = req.body.weightage;
      if (req.body.isInternal !== undefined) updates.isInternal = req.body.isInternal;

      const exam = await examService.updateExam(examId, updates);

      res.status(200).json({
        success: true,
        data: exam,
        message: 'Exam updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete exam
   * DELETE /api/v1/exams/:examId
   * 
   * Requirements: 7.1
   */
  async deleteExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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
      const deleted = await examService.deleteExam(examId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: {
            code: 'EXAM_NOT_FOUND',
            message: `Exam with ID ${examId} not found`
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Exam deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create exam schedule
   * POST /api/v1/exams/:examId/schedule
   * 
   * Requirements: 7.3, 7.4
   */
  async createExamSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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

      const scheduleData: ExamScheduleCreationAttributes = {
        examId,
        subjectId: req.body.subjectId,
        date: new Date(req.body.date),
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        roomNumber: req.body.roomNumber,
        invigilators: req.body.invigilators
      };

      const result = await examScheduleService.createSchedule(scheduleData);

      if (result.errors.length > 0) {
        res.status(409).json({
          success: false,
          error: {
            code: 'SCHEDULE_CONFLICT',
            message: 'Schedule conflicts detected',
            details: result.errors
          }
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: result.schedule,
        message: 'Exam schedule created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get exam schedule
   * GET /api/v1/exams/:examId/schedule
   * 
   * Requirements: 7.3
   */
  async getExamSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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
      const schedules = await examScheduleService.getSchedulesByExamId(examId);

      res.status(200).json({
        success: true,
        data: schedules
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Enter grades for an exam
   * POST /api/v1/exams/:examId/grades
   * 
   * Requirements: 7.6
   */
  async enterGrades(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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

      const input: GradeEntryInput = {
        examId,
        studentId: req.body.studentId,
        theoryMarks: req.body.theoryMarks,
        practicalMarks: req.body.practicalMarks,
        totalMarks: req.body.totalMarks,
        remarks: req.body.remarks,
        enteredBy: req.user?.userId || 0
      };

      const grade = await gradeEntryService.createGradeEntry(input);

      res.status(201).json({
        success: true,
        data: grade,
        message: 'Grade entered successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk grade import
   * POST /api/v1/exams/:examId/grades/bulk
   * 
   * Requirements: 7.9
   */
  async bulkGradeImport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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
      const grades = req.body.grades;
      const enteredBy = req.user?.userId || 0;

      const results = [];
      const errorsList = [];

      for (const gradeData of grades) {
        try {
          const input: GradeEntryInput = {
            examId,
            studentId: gradeData.studentId,
            theoryMarks: gradeData.theoryMarks,
            practicalMarks: gradeData.practicalMarks,
            totalMarks: gradeData.totalMarks,
            remarks: gradeData.remarks,
            enteredBy
          };

          const grade = await gradeEntryService.createGradeEntry(input);
          results.push(grade);
        } catch (error) {
          errorsList.push({
            studentId: gradeData.studentId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.status(201).json({
        success: true,
        data: {
          successCount: results.length,
          failureCount: errorsList.length,
          grades: results,
          errors: errorsList
        },
        message: `Bulk grade import completed: ${results.length} successful, ${errorsList.length} failed`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get student grades for an exam
   * GET /api/v1/exams/:examId/grades/:studentId
   * 
   * Requirements: 7.6
   */
  async getStudentGrades(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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
      const studentId = parseInt(req.params.studentId);

      const grade = await examService.getStudentGrades(examId, studentId);

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
   * Generate report card
   * GET /api/v1/exams/report-card/:studentId
   * 
   * Requirements: 7.7, N1.9
   */
  async generateReportCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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
      const termId = parseInt(req.query.termId as string);
      const academicYearId = parseInt(req.query.academicYearId as string);

      // School info from environment variables
      const schoolInfo: SchoolInfo = {
        nameEn: process.env.DEFAULT_SCHOOL_NAME || 'School Management System',
        nameNp: process.env.DEFAULT_SCHOOL_NAME_NP,
        addressEn: process.env.DEFAULT_SCHOOL_ADDRESS || 'Kathmandu, Nepal',
        addressNp: process.env.DEFAULT_SCHOOL_ADDRESS_NP,
        phone: process.env.DEFAULT_SCHOOL_PHONE || '',
        email: process.env.DEFAULT_SCHOOL_EMAIL || '',
        website: process.env.DEFAULT_SCHOOL_WEBSITE,
        logoPath: process.env.SCHOOL_LOGO_PATH
      };

      const options: ReportCardOptions = {
        language: (req.query.language as any) || 'bilingual',
        format: (req.query.format as any) || 'ledger',
        includeSchoolSeal: true,
        includePrincipalSignature: true,
        includeClassTeacherSignature: true
      };

      const pdfBuffer = await examService.generateReportCard(
        studentId,
        termId,
        academicYearId,
        schoolInfo,
        options
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=report_card_${studentId}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate mark sheet
   * GET /api/v1/exams/marksheet/:studentId
   * 
   * Requirements: N1.9
   */
  async generateMarkSheet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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
      const termId = parseInt(req.query.termId as string);
      const academicYearId = parseInt(req.query.academicYearId as string);

      // School info should come from configuration or database
      const schoolInfo: SchoolInfo = {
        nameEn: 'Sample School',
        addressEn: 'Kathmandu, Nepal',
        phone: '+977-1-1234567',
        email: 'info@sampleschool.edu.np'
      };

      const options: ReportCardOptions = {
        language: (req.query.language as any) || 'bilingual',
        format: 'standard',
        includeSchoolSeal: true,
        includePrincipalSignature: true
      };

      const pdfBuffer = await examService.generateMarkSheet(
        studentId,
        termId,
        academicYearId,
        schoolInfo,
        options
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=marksheet_${studentId}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate aggregate GPA for Class 11-12
   * GET /api/v1/exams/aggregate/:studentId
   * 
   * Requirements: N1.8
   */
  async calculateAggregateGPA(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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
      const class11TermId = parseInt(req.query.class11TermId as string);
      const class12TermId = parseInt(req.query.class12TermId as string);
      const academicYearId = parseInt(req.query.academicYearId as string);

      const result = await examService.calculateAggregateGPA(
        studentId,
        class11TermId,
        class12TermId,
        academicYearId
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Aggregate GPA calculated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get exam analytics
   * GET /api/v1/exams/:examId/analytics
   * 
   * Requirements: 7.12
   */
  async getExamAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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
      const analytics = await examService.getExamAnalytics(examId);

      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error) {
      next(error);
    }
  }

  async emailReportCards(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { studentIds, termId, academicYearId } = req.body;

      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'studentIds array is required'
          }
        });
        return;
      }

      const schoolInfo: SchoolInfo = {
        nameEn: process.env.SCHOOL_NAME || 'School Management System',
        addressEn: process.env.SCHOOL_ADDRESS || 'Kathmandu, Nepal',
        phone: process.env.SCHOOL_PHONE || '+977-1-1234567',
        email: process.env.SCHOOL_EMAIL || 'info@school.edu.np'
      };

      const options: ReportCardOptions = {
        language: 'bilingual',
        format: 'ledger',
        includeSchoolSeal: true,
        includePrincipalSignature: true,
        includeClassTeacherSignature: true
      };

      const results = [];
      const errorsList = [];

      for (const studentId of studentIds) {
        try {
          const pdfBuffer = await examService.generateReportCard(
            studentId,
            termId,
            academicYearId,
            schoolInfo,
            options
          );
          results.push({ studentId, success: true });
        } catch (error) {
          errorsList.push({
            studentId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.status(200).json({
        success: true,
        data: {
          successCount: results.length,
          failureCount: errorsList.length,
          results,
          errors: errorsList
        },
        message: `Report cards processed: ${results.length} successful, ${errorsList.length} failed`
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ExamController();
