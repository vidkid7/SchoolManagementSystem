import request from 'supertest';
import express, { Express } from 'express';
import gradeEntryRoutes from '../gradeEntry.routes';
import gradeEntryService from '../gradeEntry.service';

/**
 * Grade Entry Controller Integration Tests
 * 
 * Requirements: 7.6, 7.9, N1.1
 */

// Mock the service
jest.mock('../gradeEntry.service');

// Mock auth middleware
jest.mock('@middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 1, role: 'teacher' };
    next();
  },
  authorize: () => (_req: any, _res: any, next: any) => next()
}));

describe('GradeEntryController', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/grades', gradeEntryRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/grades', () => {
    it('should create a grade entry successfully', async () => {
      const mockGrade = {
        gradeId: 1,
        examId: 1,
        studentId: 1,
        theoryMarks: 70,
        practicalMarks: 20,
        totalMarks: 90,
        grade: 'A',
        gradePoint: 3.6,
        enteredBy: 1
      };

      (gradeEntryService.createGradeEntry as jest.Mock).mockResolvedValue(mockGrade);

      const response = await request(app)
        .post('/api/v1/grades')
        .send({
          examId: 1,
          studentId: 1,
          theoryMarks: 70,
          practicalMarks: 20
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockGrade);
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/api/v1/grades')
        .send({
          examId: 'invalid', // Should be number
          studentId: 1
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle service errors', async () => {
      (gradeEntryService.createGradeEntry as jest.Mock).mockRejectedValue(
        new Error('Grade already exists')
      );

      const response = await request(app)
        .post('/api/v1/grades')
        .send({
          examId: 1,
          studentId: 1,
          theoryMarks: 70,
          practicalMarks: 20
        });

      expect(response.status).toBe(500);
    });
  });

  describe('PUT /api/v1/grades/:gradeId', () => {
    it('should update a grade entry successfully', async () => {
      const mockGrade = {
        gradeId: 1,
        examId: 1,
        studentId: 1,
        theoryMarks: 75,
        practicalMarks: 22,
        totalMarks: 97,
        grade: 'A+',
        gradePoint: 4.0,
        enteredBy: 1
      };

      (gradeEntryService.updateGradeEntry as jest.Mock).mockResolvedValue(mockGrade);

      const response = await request(app)
        .put('/api/v1/grades/1')
        .send({
          theoryMarks: 75,
          practicalMarks: 22
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockGrade);
    });

    it('should return 400 for invalid grade ID', async () => {
      const response = await request(app)
        .put('/api/v1/grades/invalid')
        .send({
          theoryMarks: 75
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/grades/bulk', () => {
    it('should create multiple grade entries', async () => {
      const mockResult = {
        successCount: 2,
        failureCount: 0,
        grades: [
          { gradeId: 1, studentId: 1, totalMarks: 90 },
          { gradeId: 2, studentId: 2, totalMarks: 85 }
        ],
        errors: []
      };

      (gradeEntryService.createGradeEntry as jest.Mock)
        .mockResolvedValueOnce(mockResult.grades[0])
        .mockResolvedValueOnce(mockResult.grades[1]);

      const response = await request(app)
        .post('/api/v1/grades/bulk')
        .send({
          examId: 1,
          grades: [
            { studentId: 1, theoryMarks: 70, practicalMarks: 20 },
            { studentId: 2, theoryMarks: 65, practicalMarks: 20 }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.successCount).toBe(2);
    });

    it('should return 400 for invalid bulk data', async () => {
      const response = await request(app)
        .post('/api/v1/grades/bulk')
        .send({
          examId: 1,
          grades: 'invalid' // Should be array
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/grades/weighted', () => {
    it('should calculate weighted grades successfully', async () => {
      const mockResult = {
        studentId: 1,
        totalWeightedMarks: 87,
        totalWeightedPercentage: 87,
        grade: 'A',
        gradePoint: 3.6,
        assessments: [
          { examId: 1, marks: 80, weightage: 30, weightedMarks: 24 },
          { examId: 2, marks: 90, weightage: 70, weightedMarks: 63 }
        ]
      };

      (gradeEntryService.calculateWeightedGrades as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/v1/grades/weighted')
        .send({
          studentId: 1,
          assessments: [
            { examId: 1, weightage: 30 },
            { examId: 2, weightage: 70 }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult);
    });

    it('should return 400 for invalid weightage', async () => {
      const response = await request(app)
        .post('/api/v1/grades/weighted')
        .send({
          studentId: 1,
          assessments: [
            { examId: 1, weightage: 150 } // Invalid: > 100
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/grades/:gradeId', () => {
    it('should get grade by ID successfully', async () => {
      const mockGrade = {
        gradeId: 1,
        examId: 1,
        studentId: 1,
        totalMarks: 90,
        grade: 'A',
        gradePoint: 3.6
      };

      (gradeEntryService.getGradeById as jest.Mock).mockResolvedValue(mockGrade);

      const response = await request(app).get('/api/v1/grades/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockGrade);
    });

    it('should return 404 when grade not found', async () => {
      (gradeEntryService.getGradeById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/v1/grades/999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('GRADE_NOT_FOUND');
    });
  });

  describe('GET /api/v1/grades/exam/:examId', () => {
    it('should get all grades for an exam', async () => {
      const mockGrades = [
        { gradeId: 1, examId: 1, studentId: 1, totalMarks: 90 },
        { gradeId: 2, examId: 1, studentId: 2, totalMarks: 85 }
      ];

      (gradeEntryService.getGradesByExam as jest.Mock).mockResolvedValue(mockGrades);

      const response = await request(app).get('/api/v1/grades/exam/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockGrades);
      expect(response.body.meta.total).toBe(2);
    });
  });

  describe('GET /api/v1/grades/student/:studentId', () => {
    it('should get all grades for a student', async () => {
      const mockGrades = [
        { gradeId: 1, examId: 1, studentId: 1, totalMarks: 90 },
        { gradeId: 2, examId: 2, studentId: 1, totalMarks: 85 }
      ];

      (gradeEntryService.getGradesByStudent as jest.Mock).mockResolvedValue(mockGrades);

      const response = await request(app).get('/api/v1/grades/student/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockGrades);
      expect(response.body.meta.total).toBe(2);
    });
  });

  describe('GET /api/v1/grades/student-exam', () => {
    it('should get grade for specific student and exam', async () => {
      const mockGrade = {
        gradeId: 1,
        examId: 1,
        studentId: 1,
        totalMarks: 90
      };

      (gradeEntryService.getGradeByStudentAndExam as jest.Mock).mockResolvedValue(mockGrade);

      const response = await request(app)
        .get('/api/v1/grades/student-exam')
        .query({ studentId: 1, examId: 1 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockGrade);
    });

    it('should return 404 when grade not found', async () => {
      (gradeEntryService.getGradeByStudentAndExam as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/grades/student-exam')
        .query({ studentId: 1, examId: 999 });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/grades/exam/:examId/statistics', () => {
    it('should get exam statistics successfully', async () => {
      const mockStats = {
        totalStudents: 5,
        averageMarks: 80,
        highestMarks: 95,
        lowestMarks: 65,
        passCount: 5,
        failCount: 0,
        passPercentage: 100,
        gradeDistribution: {
          'A+': 1,
          'A': 2,
          'B+': 2
        }
      };

      (gradeEntryService.getExamStatistics as jest.Mock).mockResolvedValue(mockStats);

      const response = await request(app).get('/api/v1/grades/exam/1/statistics');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStats);
    });
  });

  describe('DELETE /api/v1/grades/:gradeId', () => {
    it('should delete grade successfully', async () => {
      (gradeEntryService.deleteGrade as jest.Mock).mockResolvedValue(true);

      const response = await request(app).delete('/api/v1/grades/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Grade deleted successfully');
    });

    it('should return 404 when grade not found', async () => {
      (gradeEntryService.deleteGrade as jest.Mock).mockResolvedValue(false);

      const response = await request(app).delete('/api/v1/grades/999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
