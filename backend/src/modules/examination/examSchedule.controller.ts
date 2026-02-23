import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import examScheduleService from './examSchedule.service';
import { ExamScheduleCreationAttributes } from '@models/ExamSchedule.model';

/**
 * ExamSchedule Controller
 * Handles HTTP requests for exam scheduling
 * 
 * Requirements: 7.3, 7.4
 */
class ExamScheduleController {
  /**
   * Create exam schedule
   * POST /api/v1/exams/schedules
   * 
   * Requirement 7.3: Create exam schedules with date, time, room, invigilators
   * Requirement 7.4: Validate no overlapping exams
   */
  async createSchedule(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
        return;
      }

      const scheduleData: ExamScheduleCreationAttributes = {
        examId: req.body.examId,
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
    } catch (error: any) {
      console.error('Error creating exam schedule:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create exam schedule',
          details: error.message
        }
      });
    }
  }

  /**
   * Update exam schedule
   * PUT /api/v1/exams/schedules/:id
   */
  async updateSchedule(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
        return;
      }

      const scheduleId = parseInt(req.params.id);
      const updateData: Partial<ExamScheduleCreationAttributes> = {};

      if (req.body.examId) updateData.examId = req.body.examId;
      if (req.body.subjectId) updateData.subjectId = req.body.subjectId;
      if (req.body.date) updateData.date = new Date(req.body.date);
      if (req.body.startTime) updateData.startTime = req.body.startTime;
      if (req.body.endTime) updateData.endTime = req.body.endTime;
      if (req.body.roomNumber !== undefined) updateData.roomNumber = req.body.roomNumber;
      if (req.body.invigilators !== undefined) updateData.invigilators = req.body.invigilators;

      const result = await examScheduleService.updateSchedule(scheduleId, updateData);

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

      if (!result.schedule) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Exam schedule not found'
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.schedule,
        message: 'Exam schedule updated successfully'
      });
    } catch (error: any) {
      console.error('Error updating exam schedule:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update exam schedule',
          details: error.message
        }
      });
    }
  }

  /**
   * Get exam schedule by ID
   * GET /api/v1/exams/schedules/:id
   */
  async getScheduleById(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
        return;
      }

      const scheduleId = parseInt(req.params.id);
      const schedule = await examScheduleService.getScheduleById(scheduleId);

      if (!schedule) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Exam schedule not found'
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: schedule
      });
    } catch (error: any) {
      console.error('Error getting exam schedule:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get exam schedule',
          details: error.message
        }
      });
    }
  }

  /**
   * Get schedules by exam ID
   * GET /api/v1/exams/:examId/schedules
   */
  async getSchedulesByExamId(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
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
    } catch (error: any) {
      console.error('Error getting exam schedules:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get exam schedules',
          details: error.message
        }
      });
    }
  }

  /**
   * Get schedules by date
   * GET /api/v1/exams/schedules/by-date?date=YYYY-MM-DD
   */
  async getSchedulesByDate(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
        return;
      }

      const date = new Date(req.query.date as string);
      const schedules = await examScheduleService.getSchedulesByDate(date);

      res.status(200).json({
        success: true,
        data: schedules
      });
    } catch (error: any) {
      console.error('Error getting exam schedules by date:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get exam schedules',
          details: error.message
        }
      });
    }
  }

  /**
   * Get schedules by date range
   * GET /api/v1/exams/schedules/by-date-range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   */
  async getSchedulesByDateRange(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
        return;
      }

      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);
      const schedules = await examScheduleService.getSchedulesByDateRange(startDate, endDate);

      res.status(200).json({
        success: true,
        data: schedules
      });
    } catch (error: any) {
      console.error('Error getting exam schedules by date range:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get exam schedules',
          details: error.message
        }
      });
    }
  }

  /**
   * Get schedules by invigilator (teacher)
   * GET /api/v1/exams/schedules/by-invigilator/:teacherId?date=YYYY-MM-DD
   */
  async getSchedulesByInvigilator(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
        return;
      }

      const teacherId = parseInt(req.params.teacherId);
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const schedules = await examScheduleService.getSchedulesByInvigilator(teacherId, date);

      res.status(200).json({
        success: true,
        data: schedules
      });
    } catch (error: any) {
      console.error('Error getting exam schedules by invigilator:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get exam schedules',
          details: error.message
        }
      });
    }
  }

  /**
   * Get schedules by room
   * GET /api/v1/exams/schedules/by-room/:roomNumber?date=YYYY-MM-DD
   */
  async getSchedulesByRoom(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
        return;
      }

      const roomNumber = req.params.roomNumber;
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const schedules = await examScheduleService.getSchedulesByRoom(roomNumber, date);

      res.status(200).json({
        success: true,
        data: schedules
      });
    } catch (error: any) {
      console.error('Error getting exam schedules by room:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get exam schedules',
          details: error.message
        }
      });
    }
  }

  /**
   * Generate class timetable
   * GET /api/v1/exams/schedules/timetable/class/:classId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   * 
   * Requirement 7.3: Generate exam timetables
   */
  async generateClassTimetable(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
        return;
      }

      const classId = parseInt(req.params.classId);
      const dateRange = (req.query.startDate && req.query.endDate) ? {
        start: new Date(req.query.startDate as string),
        end: new Date(req.query.endDate as string)
      } : undefined;

      const timetable = await examScheduleService.generateClassTimetable(classId, dateRange);

      res.status(200).json({
        success: true,
        data: timetable,
        message: 'Class exam timetable generated successfully'
      });
    } catch (error: any) {
      console.error('Error generating class timetable:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate class timetable',
          details: error.message
        }
      });
    }
  }

  /**
   * Generate teacher timetable
   * GET /api/v1/exams/schedules/timetable/teacher/:teacherId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   */
  async generateTeacherTimetable(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
        return;
      }

      const teacherId = parseInt(req.params.teacherId);
      const dateRange = (req.query.startDate && req.query.endDate) ? {
        start: new Date(req.query.startDate as string),
        end: new Date(req.query.endDate as string)
      } : undefined;

      const timetable = await examScheduleService.generateTeacherTimetable(teacherId, dateRange);

      res.status(200).json({
        success: true,
        data: timetable,
        message: 'Teacher exam timetable generated successfully'
      });
    } catch (error: any) {
      console.error('Error generating teacher timetable:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate teacher timetable',
          details: error.message
        }
      });
    }
  }

  /**
   * Delete exam schedule
   * DELETE /api/v1/exams/schedules/:id
   */
  async deleteSchedule(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
        return;
      }

      const scheduleId = parseInt(req.params.id);
      const deleted = await examScheduleService.deleteSchedule(scheduleId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Exam schedule not found'
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Exam schedule deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting exam schedule:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete exam schedule',
          details: error.message
        }
      });
    }
  }

  /**
   * Bulk create exam schedules
   * POST /api/v1/exams/schedules/bulk
   */
  async bulkCreateSchedules(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
        return;
      }

      const schedules: ExamScheduleCreationAttributes[] = req.body.schedules.map((s: any) => ({
        examId: s.examId,
        subjectId: s.subjectId,
        date: new Date(s.date),
        startTime: s.startTime,
        endTime: s.endTime,
        roomNumber: s.roomNumber,
        invigilators: s.invigilators
      }));

      const result = await examScheduleService.bulkCreateSchedules(schedules);

      res.status(201).json({
        success: true,
        data: {
          created: result.created,
          failed: result.failed
        },
        message: `Successfully created ${result.created.length} schedules. ${result.failed.length} failed.`
      });
    } catch (error: any) {
      console.error('Error bulk creating exam schedules:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to bulk create exam schedules',
          details: error.message
        }
      });
    }
  }
}

export default new ExamScheduleController();
