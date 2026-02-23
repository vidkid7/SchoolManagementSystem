import request from 'supertest';
import express from 'express';
import reportRoutes from '../report.routes';
import reportService from '../report.service';
import { UserRole } from '@models/User.model';

jest.mock('../report.service');

const app = express();
app.use(express.json());

// Mock authentication middleware
app.use((req, _res, next) => {
  req.user = { id: 'user-1', role: UserRole.SCHOOL_ADMIN };
  next();
});

app.use('/api/v1/reports', reportRoutes);

describe('Report Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/reports/enrollment', () => {
    it('should return enrollment report', async () => {
      const mockReport = {
        totalStudents: 100,
        byClass: [{ class: 1, section: 'A', count: 30 }],
        byGender: [{ gender: 'male', count: 55 }],
        byShift: [{ shift: 'morning', count: 60 }],
        trend: [{ date: '2024-01-01', count: 20 }],
      };

      (reportService.generateEnrollmentReport as jest.Mock).mockResolvedValue(mockReport);

      const response = await request(app).get('/api/v1/reports/enrollment');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockReport);
    });

    it('should handle errors', async () => {
      (reportService.generateEnrollmentReport as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).get('/api/v1/reports/enrollment');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/reports/attendance', () => {
    it('should return attendance report with filters', async () => {
      const mockReport = {
        totalDays: 20,
        averageAttendance: 85,
        byClass: [],
        byDate: [{ date: '2024-01-01', presentCount: 25, absentCount: 5, lateCount: 0 }],
        lowAttendanceStudents: [],
      };

      (reportService.generateAttendanceReport as jest.Mock).mockResolvedValue(mockReport);

      const response = await request(app)
        .get('/api/v1/reports/attendance')
        .query({ startDate: '2024-01-01', endDate: '2024-01-31' });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockReport);
    });
  });

  describe('GET /api/v1/reports/fee-collection', () => {
    it('should return fee collection report', async () => {
      const mockReport = {
        totalExpected: 100000,
        totalCollected: 85000,
        totalPending: 15000,
        collectionRate: 85,
        byClass: [],
        byDate: [{ date: '2024-01-01', amount: 10000 }],
        byPaymentMethod: [{ method: 'cash', amount: 50000, count: 10 }],
        defaulters: [],
      };

      (reportService.generateFeeCollectionReport as jest.Mock).mockResolvedValue(mockReport);

      const response = await request(app)
        .get('/api/v1/reports/fee-collection')
        .query({ startDate: '2024-01-01', endDate: '2024-01-31' });

      expect(response.status).toBe(200);
      expect(response.body.data.collectionRate).toBe(85);
    });
  });

  describe('GET /api/v1/reports/examination', () => {
    it('should return examination report', async () => {
      const mockReport = {
        totalStudents: 50,
        averageMarks: 75,
        averageGPA: 3.2,
        passRate: 95,
        gradeDistribution: [{ grade: 'A+', count: 10, percentage: 20 }],
        subjectWisePerformance: [],
        topPerformers: [],
      };

      (reportService.generateExaminationReport as jest.Mock).mockResolvedValue(mockReport);

      const response = await request(app).get('/api/v1/reports/examination');

      expect(response.status).toBe(200);
      expect(response.body.data.passRate).toBe(95);
    });
  });

  describe('GET /api/v1/reports/dashboard', () => {
    it('should return dashboard data', async () => {
      const mockData = {
        summary: {
          totalStudents: 250,
          totalStaff: 30,
          attendanceRate: 85,
          feeCollectionRate: 75,
        },
        charts: {
          enrollmentTrend: [],
          attendanceTrend: [],
          feeCollection: [],
          examPerformance: [],
        },
      };

      (reportService.getDashboardData as jest.Mock).mockResolvedValue(mockData);

      const response = await request(app).get('/api/v1/reports/dashboard');

      expect(response.status).toBe(200);
      expect(response.body.data.summary.totalStudents).toBe(250);
    });
  });

  describe('GET /api/v1/reports/export/excel/:reportType', () => {
    it('should export enrollment report to Excel', async () => {
      const mockReport = {
        totalStudents: 100,
        byClass: [{ class: 1, section: 'A', count: 30 }],
      };

      (reportService.generateEnrollmentReport as jest.Mock).mockResolvedValue(mockReport);

      const response = await request(app).get('/api/v1/reports/export/excel/enrollment');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('spreadsheetml');
    });

    it('should return 400 for invalid report type', async () => {
      const response = await request(app).get('/api/v1/reports/export/excel/invalid');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/reports/export/pdf/:reportType', () => {
    it('should export attendance report to PDF', async () => {
      const mockReport = {
        totalDays: 20,
        averageAttendance: 85,
      };

      (reportService.generateAttendanceReport as jest.Mock).mockResolvedValue(mockReport);

      const response = await request(app)
        .get('/api/v1/reports/export/pdf/attendance')
        .query({ startDate: '2024-01-01', endDate: '2024-01-31' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('pdf');
    });
  });
});
