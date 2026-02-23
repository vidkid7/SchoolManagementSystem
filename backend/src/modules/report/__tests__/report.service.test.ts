import reportService from '../report.service';
import Student from '../../../models/Student.model';
import AttendanceRecord from '../../../models/AttendanceRecord.model';
import Invoice from '../../../models/Invoice.model';
import Payment from '../../../models/Payment.model';
import Grade from '../../../models/Grade.model';

jest.mock('../../../models/Student.model');
jest.mock('../../../models/AttendanceRecord.model');
jest.mock('../../../models/Invoice.model');
jest.mock('../../../models/Payment.model');
jest.mock('../../../models/Grade.model');

describe('ReportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateEnrollmentReport', () => {
    it('should generate enrollment report with correct totals', async () => {
      (Student.count as jest.Mock).mockResolvedValue(100);
      (Student.findAll as jest.Mock)
        .mockResolvedValueOnce([
          { currentClass: 1, currentSection: 'A', count: '30' },
          { currentClass: 1, currentSection: 'B', count: '25' },
        ])
        .mockResolvedValueOnce([
          { gender: 'male', count: '55' },
          { gender: 'female', count: '45' },
        ])
        .mockResolvedValueOnce([
          { currentShift: 'morning', count: '60' },
          { currentShift: 'day', count: '40' },
        ])
        .mockResolvedValueOnce([
          { date: '2024-01-01', count: '20' },
          { date: '2024-02-01', count: '30' },
        ]);

      const report = await reportService.generateEnrollmentReport({});

      expect(report.totalStudents).toBe(100);
      expect(report.byClass).toHaveLength(2);
      expect(report.byGender).toHaveLength(2);
      expect(report.byShift).toHaveLength(2);
      expect(report.trend).toHaveLength(2);
    });

    it('should filter by class when classId is provided', async () => {
      (Student.count as jest.Mock).mockResolvedValue(30);
      (Student.findAll as jest.Mock).mockResolvedValue([]);

      await reportService.generateEnrollmentReport({ classId: '1' });

      expect(Student.count).toHaveBeenCalledWith({
        where: expect.objectContaining({ currentClass: '1' }),
      });
    });

    it('should filter by gender when gender is provided', async () => {
      (Student.count as jest.Mock).mockResolvedValue(55);
      (Student.findAll as jest.Mock).mockResolvedValue([]);

      await reportService.generateEnrollmentReport({ gender: 'male' });

      expect(Student.count).toHaveBeenCalledWith({
        where: expect.objectContaining({ gender: 'male' }),
      });
    });
  });

  describe('generateAttendanceReport', () => {
    it('should calculate average attendance correctly', async () => {
      (AttendanceRecord.count as jest.Mock)
        .mockResolvedValueOnce(100) // total records
        .mockResolvedValueOnce(85); // present records

      (AttendanceRecord.findAll as jest.Mock).mockResolvedValue([
        { date: '2024-01-01', presentCount: '25', absentCount: '5', lateCount: '0' },
        { date: '2024-01-02', presentCount: '28', absentCount: '2', lateCount: '0' },
      ]);

      const report = await reportService.generateAttendanceReport({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(report.averageAttendance).toBe(85);
      expect(report.totalDays).toBe(2);
      expect(report.byDate).toHaveLength(2);
    });

    it('should handle zero attendance records', async () => {
      (AttendanceRecord.count as jest.Mock).mockResolvedValue(0);
      (AttendanceRecord.findAll as jest.Mock).mockResolvedValue([]);

      const report = await reportService.generateAttendanceReport({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(report.averageAttendance).toBe(0);
      expect(report.totalDays).toBe(0);
    });
  });

  describe('generateFeeCollectionReport', () => {
    it('should calculate fee collection rate correctly', async () => {
      const mockInvoices = [
        { totalAmount: 10000, paidAmount: 8000 },
        { totalAmount: 15000, paidAmount: 15000 },
        { totalAmount: 12000, paidAmount: 10000 },
      ];

      (Invoice.findAll as jest.Mock).mockResolvedValue(mockInvoices);
      (Payment.findAll as jest.Mock)
        .mockResolvedValueOnce([
          { paymentMethod: 'cash', amount: '20000', count: '10' },
          { paymentMethod: 'esewa', amount: '13000', count: '8' },
        ])
        .mockResolvedValueOnce([
          { date: '2024-01-01', amount: '15000' },
          { date: '2024-01-02', amount: '18000' },
        ]);

      const report = await reportService.generateFeeCollectionReport({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(report.totalExpected).toBe(37000);
      expect(report.totalCollected).toBe(33000);
      expect(report.totalPending).toBe(4000);
      expect(report.collectionRate).toBeCloseTo(89.19, 1);
      expect(report.byPaymentMethod).toHaveLength(2);
    });

    it('should handle zero invoices', async () => {
      (Invoice.findAll as jest.Mock).mockResolvedValue([]);
      (Payment.findAll as jest.Mock).mockResolvedValue([]);

      const report = await reportService.generateFeeCollectionReport({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(report.totalExpected).toBe(0);
      expect(report.totalCollected).toBe(0);
      expect(report.collectionRate).toBe(0);
    });
  });

  describe('generateExaminationReport', () => {
    it('should calculate exam statistics correctly', async () => {
      const mockGrades = [
        { studentId: '1', totalMarks: 85, gradePoint: 3.6, grade: 'A' },
        { studentId: '2', totalMarks: 92, gradePoint: 4.0, grade: 'A+' },
        { studentId: '3', totalMarks: 75, gradePoint: 3.2, grade: 'B+' },
        { studentId: '4', totalMarks: 65, gradePoint: 2.8, grade: 'B' },
        { studentId: '5', totalMarks: 30, gradePoint: 0.0, grade: 'NG' },
      ];

      (Grade.findAll as jest.Mock).mockResolvedValue(mockGrades);

      const report = await reportService.generateExaminationReport({});

      expect(report.totalStudents).toBe(5);
      expect(report.averageMarks).toBeCloseTo(69.4, 1);
      expect(report.averageGPA).toBeCloseTo(2.72, 1);
      expect(report.passRate).toBe(80); // 4 out of 5 passed
      expect(report.gradeDistribution.length).toBeGreaterThan(0);
    });

    it('should handle no grades', async () => {
      (Grade.findAll as jest.Mock).mockResolvedValue([]);

      const report = await reportService.generateExaminationReport({});

      expect(report.totalStudents).toBe(0);
      expect(report.averageMarks).toBe(0);
      expect(report.averageGPA).toBe(0);
      expect(report.passRate).toBe(0);
    });
  });

  describe('getDashboardData', () => {
    it('should return dashboard summary data', async () => {
      (Student.count as jest.Mock).mockResolvedValue(250);
      (jest.spyOn(require('../../../models/Staff.model').default, 'count') as jest.Mock).mockResolvedValue(30);

      const data = await reportService.getDashboardData('school_admin', 'user-1');

      expect(data.summary.totalStudents).toBe(250);
      expect(data.summary.totalStaff).toBe(30);
      expect(data.summary.attendanceRate).toBeDefined();
      expect(data.summary.feeCollectionRate).toBeDefined();
      expect(data.charts).toBeDefined();
    });
  });
});
