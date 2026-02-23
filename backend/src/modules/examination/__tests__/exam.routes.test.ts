import request from 'supertest';
import express, { Express } from 'express';
import examRoutes from '../exam.routes';
import examService from '../exam.service';
import examScheduleService from '../examSchedule.service';
import gradeEntryService from '../gradeEntry.service';
import { ExamType, ExamStatus } from '@models/Exam.model';

/**
 * Exam Routes Tests
 * 
 * Requirements: 7.1-7.12
 */

// Mock services
jest.mock('../exam.service');
jest.mock('../examSchedule.service');
jest.mock('../gradeEntry.service');

describe('Exam Routes', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Mock auth middleware
    app.use((req, _res, next) => {
      req.user = { 
        userId: 1, 
        username: 'testuser',
        email: 'test@example.com',
        role: 'Subject_Teacher' as any 
      };
      next();
    });
    
    app.use('/api/v1/exams', examRoutes);
    
    // Error handler
    app.use((err: any, _req: any, res: any, _next: any) => {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: err.message
        }
      });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/exams', () => {
    it('should return paginated exams', async () => {
      const mockExams = [
        {
          examId: 1,
          name: 'First Terminal Exam',
          type: ExamType.FIRST_TERMINAL,
          status: ExamStatus.SCHEDULED
        }
      ];

      (examService.getExams as jest.Mock).mockResolvedValue({
        exams: mockExams,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1
      });

      const response = await request(app)
        .get('/api/v1/exams')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockExams);
      expect(response.body.meta.total).toBe(1);
    });

    it('should filter exams by classId', async () => {
      (examService.getExams as jest.Mock).mockResolvedValue({
        exams: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
      });

      await request(app)
        .get('/api/v1/exams?classId=1')
        .expect(200);

      expect(examService.getExams).toHaveBeenCalledWith(
        expect.objectContaining({ classId: 1 })
      );
    });
  });

  describe('POST /api/v1/exams', () => {
    it('should create a new exam', async () => {
      const mockExam = {
        examId: 1,
        name: 'First Terminal Exam',
        type: ExamType.FIRST_TERMINAL,
        fullMarks: 100,
        passMarks: 35
      };

      (examService.createExam as jest.Mock).mockResolvedValue(mockExam);

      const examData = {
        name: 'First Terminal Exam',
        type: ExamType.FIRST_TERMINAL,
        subjectId: 1,
        classId: 1,
        academicYearId: 1,
        termId: 1,
        examDate: '2024-01-15',
        duration: 180,
        fullMarks: 100,
        passMarks: 35,
        theoryMarks: 75,
        practicalMarks: 25,
        weightage: 70
      };

      const response = await request(app)
        .post('/api/v1/exams')
        .send(examData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockExam);
      expect(response.body.message).toBe('Exam created successfully');
    });

    it('should return validation error for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/exams')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return validation error for invalid exam type', async () => {
      const examData = {
        name: 'Test Exam',
        type: 'INVALID_TYPE',
        subjectId: 1,
        classId: 1,
        academicYearId: 1,
        termId: 1,
        examDate: '2024-01-15',
        duration: 180,
        fullMarks: 100,
        passMarks: 35,
        theoryMarks: 75,
        practicalMarks: 25,
        weightage: 70
      };

      const response = await request(app)
        .post('/api/v1/exams')
        .send(examData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/exams/:examId', () => {
    it('should return exam by ID', async () => {
      const mockExam = {
        examId: 1,
        name: 'First Terminal Exam',
        type: ExamType.FIRST_TERMINAL
      };

      (examService.getExamById as jest.Mock).mockResolvedValue(mockExam);

      const response = await request(app)
        .get('/api/v1/exams/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockExam);
    });

    it('should return 404 for non-existent exam', async () => {
      (examService.getExamById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/exams/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EXAM_NOT_FOUND');
    });
  });

  describe('PUT /api/v1/exams/:examId', () => {
    it('should update exam', async () => {
      const mockExam = {
        examId: 1,
        name: 'Updated Exam Name',
        type: ExamType.FIRST_TERMINAL
      };

      (examService.updateExam as jest.Mock).mockResolvedValue(mockExam);

      const response = await request(app)
        .put('/api/v1/exams/1')
        .send({ name: 'Updated Exam Name' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockExam);
      expect(response.body.message).toBe('Exam updated successfully');
    });
  });

  describe('DELETE /api/v1/exams/:examId', () => {
    it('should delete exam', async () => {
      (examService.deleteExam as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/v1/exams/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Exam deleted successfully');
    });

    it('should return 404 for non-existent exam', async () => {
      (examService.deleteExam as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/v1/exams/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EXAM_NOT_FOUND');
    });
  });

  describe('POST /api/v1/exams/:examId/schedule', () => {
    it('should create exam schedule', async () => {
      const mockSchedule = {
        examScheduleId: 1,
        examId: 1,
        date: new Date('2024-01-15'),
        startTime: '10:00',
        endTime: '13:00'
      };

      (examScheduleService.createSchedule as jest.Mock).mockResolvedValue({
        schedule: mockSchedule,
        errors: []
      });

      const scheduleData = {
        subjectId: 1,
        date: '2024-01-15',
        startTime: '10:00',
        endTime: '13:00',
        roomNumber: 'Room 101',
        invigilators: [1, 2]
      };

      const response = await request(app)
        .post('/api/v1/exams/1/schedule')
        .send(scheduleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSchedule);
    });

    it('should return conflict error for overlapping schedules', async () => {
      (examScheduleService.createSchedule as jest.Mock).mockResolvedValue({
        schedule: null,
        errors: [{ type: 'student_overlap', message: 'Students have overlapping exam' }]
      });

      const scheduleData = {
        subjectId: 1,
        date: '2024-01-15',
        startTime: '10:00',
        endTime: '13:00',
        roomNumber: 'Room 101',
        invigilators: [1, 2]
      };

      const response = await request(app)
        .post('/api/v1/exams/1/schedule')
        .send(scheduleData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SCHEDULE_CONFLICT');
    });
  });

  describe('GET /api/v1/exams/:examId/schedule', () => {
    it('should return exam schedules', async () => {
      const mockSchedules = [
        {
          examScheduleId: 1,
          examId: 1,
          date: new Date('2024-01-15'),
          startTime: '10:00',
          endTime: '13:00'
        }
      ];

      (examScheduleService.getSchedulesByExamId as jest.Mock).mockResolvedValue(mockSchedules);

      const response = await request(app)
        .get('/api/v1/exams/1/schedule')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSchedules);
    });
  });

  describe('POST /api/v1/exams/:examId/grades', () => {
    it('should enter grades for an exam', async () => {
      const mockGrade = {
        gradeId: 1,
        examId: 1,
        studentId: 1,
        totalMarks: 85,
        grade: 'A',
        gradePoint: 3.6
      };

      (gradeEntryService.createGradeEntry as jest.Mock).mockResolvedValue(mockGrade);

      const gradeData = {
        studentId: 1,
        theoryMarks: 60,
        practicalMarks: 25,
        totalMarks: 85
      };

      const response = await request(app)
        .post('/api/v1/exams/1/grades')
        .send(gradeData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockGrade);
    });
  });

  describe('POST /api/v1/exams/:examId/grades/bulk', () => {
    it('should bulk import grades', async () => {
      const mockGrade = {
        gradeId: 1,
        examId: 1,
        studentId: 1,
        totalMarks: 85
      };

      (gradeEntryService.createGradeEntry as jest.Mock).mockResolvedValue(mockGrade);

      const bulkData = {
        grades: [
          { studentId: 1, theoryMarks: 60, practicalMarks: 25, totalMarks: 85 },
          { studentId: 2, theoryMarks: 70, practicalMarks: 20, totalMarks: 90 }
        ]
      };

      const response = await request(app)
        .post('/api/v1/exams/1/grades/bulk')
        .send(bulkData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.successCount).toBe(2);
    });
  });

  describe('GET /api/v1/exams/:examId/grades/:studentId', () => {
    it('should return student grades', async () => {
      const mockGrade = {
        gradeId: 1,
        examId: 1,
        studentId: 1,
        totalMarks: 85,
        grade: 'A'
      };

      (examService.getStudentGrades as jest.Mock).mockResolvedValue(mockGrade);

      const response = await request(app)
        .get('/api/v1/exams/1/grades/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockGrade);
    });

    it('should return 404 for non-existent grade', async () => {
      (examService.getStudentGrades as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/exams/1/grades/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('GRADE_NOT_FOUND');
    });
  });

  describe('GET /api/v1/exams/report-card/:studentId', () => {
    it('should generate report card PDF', async () => {
      const mockPDF = Buffer.from('PDF content');

      (examService.generateReportCard as jest.Mock).mockResolvedValue(mockPDF);

      const response = await request(app)
        .get('/api/v1/exams/report-card/1?termId=1&academicYearId=1')
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('report_card_1.pdf');
    });

    it('should return validation error for missing query params', async () => {
      const response = await request(app)
        .get('/api/v1/exams/report-card/1')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/exams/marksheet/:studentId', () => {
    it('should generate mark sheet PDF', async () => {
      const mockPDF = Buffer.from('PDF content');

      (examService.generateMarkSheet as jest.Mock).mockResolvedValue(mockPDF);

      const response = await request(app)
        .get('/api/v1/exams/marksheet/1?termId=1&academicYearId=1')
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('marksheet_1.pdf');
    });
  });

  describe('GET /api/v1/exams/aggregate/:studentId', () => {
    it('should calculate aggregate GPA', async () => {
      const mockResult = {
        studentId: 1,
        class11GPA: 3.5,
        class12GPA: 3.7,
        aggregateGPA: 3.6
      };

      (examService.calculateAggregateGPA as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/v1/exams/aggregate/1?class11TermId=1&class12TermId=2&academicYearId=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult);
    });
  });

  describe('GET /api/v1/exams/:examId/analytics', () => {
    it('should return exam analytics', async () => {
      const mockAnalytics = {
        examId: 1,
        examName: 'First Terminal Exam',
        totalStudents: 50,
        averageMarks: 75.5,
        highestMarks: 98,
        lowestMarks: 45,
        passCount: 45,
        failCount: 5,
        passPercentage: 90,
        gradeDistribution: {
          'A+': 10,
          'A': 15,
          'B+': 12,
          'B': 8,
          'C+': 3,
          'C': 2
        },
        rankStatistics: {
          topRank: 1,
          bottomRank: 50,
          medianMarks: 76,
          tiedRanks: []
        }
      };

      (examService.getExamAnalytics as jest.Mock).mockResolvedValue(mockAnalytics);

      const response = await request(app)
        .get('/api/v1/exams/1/analytics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAnalytics);
    });
  });
});
