import reportCardService, {
  ReportCardData,
  SubjectGradeInfo,
  SchoolInfo,
  ReportCardOptions
} from '../reportCard.service';
import Grade, { NEBGrade } from '@models/Grade.model';
import Exam from '@models/Exam.model';
import Student from '@models/Student.model';
import AttendanceRecord, { AttendanceStatus } from '@models/AttendanceRecord.model';
import rankCalculationService from '../rankCalculation.service';
import * as fs from 'fs';

/**
 * Report Card Service Unit Tests
 * 
 * Tests report card generation functionality including:
 * - Attendance summary calculation
 * - Term GPA calculation
 * - Report card data gathering
 * - PDF generation
 * 
 * Requirements: 7.7, N1.9
 */

// Mock dependencies
jest.mock('@models/Grade.model');
jest.mock('@models/Exam.model');
jest.mock('@models/Student.model');
jest.mock('@models/AttendanceRecord.model');
jest.mock('../rankCalculation.service');
jest.mock('fs');
jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => {
    const mockDoc: any = {
      on: jest.fn((event: string, callback: any) => {
        if (event === 'data') {
          // Simulate PDF data chunks
          setTimeout(() => callback(Buffer.from('PDF data chunk')), 0);
        } else if (event === 'end') {
          setTimeout(() => callback(), 10);
        }
        return mockDoc;
      }),
      end: jest.fn(),
      page: { width: 1224, height: 792 },
      fontSize: jest.fn().mockReturnThis(),
      font: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      image: jest.fn().mockReturnThis(),
      moveTo: jest.fn().mockReturnThis(),
      lineTo: jest.fn().mockReturnThis(),
      stroke: jest.fn().mockReturnThis(),
      rect: jest.fn().mockReturnThis()
    };
    return mockDoc;
  });
});

describe('ReportCardService', () => {
  // Sample data
  const mockStudent = {
    studentId: 1,
    studentCode: 'STU-2024-001',
    firstNameEn: 'Ram',
    middleNameEn: 'Kumar',
    lastNameEn: 'Sharma',
    firstNameNp: 'राम',
    middleNameNp: 'कुमार',
    lastNameNp: 'शर्मा',
    symbolNumber: 'SEE-2024-12345',
    nebRegistrationNumber: 'NEB-2024-67890',
    rollNumber: 15,
    dateOfBirthBS: '2065-05-15',
    dateOfBirthAD: new Date('2008-08-30'),
    currentClassId: 1
  };

  const mockSchoolInfo: SchoolInfo = {
    nameEn: 'Nepal Model School',
    nameNp: 'नेपाल मोडेल स्कूल',
    addressEn: 'Kathmandu, Nepal',
    addressNp: 'काठमाडौं, नेपाल',
    phone: '+977-1-4123456',
    email: 'info@nepalmodelschool.edu.np',
    principalName: 'Dr. Shyam Prasad Adhikari'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateAttendanceSummary', () => {
    it('should calculate attendance summary correctly', async () => {
      // Mock attendance records
      const mockAttendanceRecords = [
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.ABSENT },
        { status: AttendanceStatus.LATE },
        { status: AttendanceStatus.EXCUSED }
      ];

      (AttendanceRecord.findAll as jest.Mock).mockResolvedValue(mockAttendanceRecords);

      const result = await reportCardService.calculateAttendanceSummary(
        1,
        new Date('2024-01-01'),
        new Date('2024-03-31')
      );

      expect(result).toEqual({
        totalDays: 5,
        presentDays: 2,
        absentDays: 1,
        lateDays: 1,
        excusedDays: 1,
        attendancePercentage: 60 // (2 present + 1 late) / 5 * 100
      });
    });

    it('should handle empty attendance records', async () => {
      (AttendanceRecord.findAll as jest.Mock).mockResolvedValue([]);

      const result = await reportCardService.calculateAttendanceSummary(
        1,
        new Date('2024-01-01'),
        new Date('2024-03-31')
      );

      expect(result).toEqual({
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        excusedDays: 0,
        attendancePercentage: 0
      });
    });

    it('should calculate 100% attendance correctly', async () => {
      const mockAttendanceRecords = [
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.PRESENT }
      ];

      (AttendanceRecord.findAll as jest.Mock).mockResolvedValue(mockAttendanceRecords);

      const result = await reportCardService.calculateAttendanceSummary(
        1,
        new Date('2024-01-01'),
        new Date('2024-03-31')
      );

      expect(result.attendancePercentage).toBe(100);
    });

    it('should include late days in attendance percentage', async () => {
      const mockAttendanceRecords = [
        { status: AttendanceStatus.LATE },
        { status: AttendanceStatus.LATE },
        { status: AttendanceStatus.ABSENT },
        { status: AttendanceStatus.ABSENT }
      ];

      (AttendanceRecord.findAll as jest.Mock).mockResolvedValue(mockAttendanceRecords);

      const result = await reportCardService.calculateAttendanceSummary(
        1,
        new Date('2024-01-01'),
        new Date('2024-03-31')
      );

      expect(result.attendancePercentage).toBe(50); // 2 late / 4 total * 100
    });
  });

  describe('calculateTermGPA', () => {
    it('should calculate term GPA correctly', () => {
      const subjects: SubjectGradeInfo[] = [
        {
          subjectId: 1,
          subjectName: 'Mathematics',
          creditHours: 5,
          theoryMarks: 75,
          practicalMarks: 20,
          totalMarks: 95,
          fullMarks: 100,
          grade: NEBGrade.A_PLUS,
          gradePoint: 4.0
        },
        {
          subjectId: 2,
          subjectName: 'Science',
          creditHours: 4,
          theoryMarks: 65,
          practicalMarks: 15,
          totalMarks: 80,
          fullMarks: 100,
          grade: NEBGrade.A,
          gradePoint: 3.6
        },
        {
          subjectId: 3,
          subjectName: 'English',
          creditHours: 3,
          theoryMarks: 70,
          practicalMarks: 0,
          totalMarks: 70,
          fullMarks: 100,
          grade: NEBGrade.B_PLUS,
          gradePoint: 3.2
        }
      ];

      const gpa = reportCardService.calculateTermGPA(subjects);

      // Expected: (5*4.0 + 4*3.6 + 3*3.2) / (5+4+3) = (20 + 14.4 + 9.6) / 12 = 44 / 12 = 3.67
      expect(gpa).toBeCloseTo(3.67, 2);
    });

    it('should return 0 for empty subjects array', () => {
      const gpa = reportCardService.calculateTermGPA([]);
      expect(gpa).toBe(0);
    });

    it('should return 0 when total credit hours is 0', () => {
      const subjects: SubjectGradeInfo[] = [
        {
          subjectId: 1,
          subjectName: 'Mathematics',
          creditHours: 0,
          theoryMarks: 75,
          practicalMarks: 20,
          totalMarks: 95,
          fullMarks: 100,
          grade: NEBGrade.A_PLUS,
          gradePoint: 4.0
        }
      ];

      const gpa = reportCardService.calculateTermGPA(subjects);
      expect(gpa).toBe(0);
    });

    it('should calculate perfect GPA (4.0)', () => {
      const subjects: SubjectGradeInfo[] = [
        {
          subjectId: 1,
          subjectName: 'Mathematics',
          creditHours: 5,
          theoryMarks: 95,
          practicalMarks: 0,
          totalMarks: 95,
          fullMarks: 100,
          grade: NEBGrade.A_PLUS,
          gradePoint: 4.0
        },
        {
          subjectId: 2,
          subjectName: 'Science',
          creditHours: 4,
          theoryMarks: 92,
          practicalMarks: 0,
          totalMarks: 92,
          fullMarks: 100,
          grade: NEBGrade.A_PLUS,
          gradePoint: 4.0
        }
      ];

      const gpa = reportCardService.calculateTermGPA(subjects);
      expect(gpa).toBe(4.0);
    });

    it('should round GPA to 2 decimal places', () => {
      const subjects: SubjectGradeInfo[] = [
        {
          subjectId: 1,
          subjectName: 'Mathematics',
          creditHours: 3,
          theoryMarks: 75,
          practicalMarks: 0,
          totalMarks: 75,
          fullMarks: 100,
          grade: NEBGrade.B_PLUS,
          gradePoint: 3.2
        },
        {
          subjectId: 2,
          subjectName: 'Science',
          creditHours: 3,
          theoryMarks: 85,
          practicalMarks: 0,
          totalMarks: 85,
          fullMarks: 100,
          grade: NEBGrade.A,
          gradePoint: 3.6
        },
        {
          subjectId: 3,
          subjectName: 'English',
          creditHours: 3,
          theoryMarks: 80,
          practicalMarks: 0,
          totalMarks: 80,
          fullMarks: 100,
          grade: NEBGrade.A,
          gradePoint: 3.6
        }
      ];

      const gpa = reportCardService.calculateTermGPA(subjects);
      
      // Expected: (3*3.2 + 3*3.6 + 3*3.6) / 9 = (9.6 + 10.8 + 10.8) / 9 = 31.2 / 9 = 3.466...
      expect(gpa).toBe(3.47); // Rounded to 2 decimal places
    });
  });

  describe('gatherReportCardData', () => {
    it('should gather complete report card data', async () => {
      // Mock student
      (Student.findByPk as jest.Mock).mockResolvedValue(mockStudent);

      // Mock exams
      const mockExams = [
        {
          examId: 1,
          subjectId: 1,
          classId: 1,
          fullMarks: 100,
          termId: 1,
          academicYearId: 1
        },
        {
          examId: 2,
          subjectId: 2,
          classId: 1,
          fullMarks: 100,
          termId: 1,
          academicYearId: 1
        }
      ];
      (Exam.findAll as jest.Mock).mockResolvedValue(mockExams);

      // Mock grades
      const mockGrades = [
        {
          examId: 1,
          studentId: 1,
          theoryMarks: 75,
          practicalMarks: 20,
          totalMarks: 95
        },
        {
          examId: 2,
          studentId: 1,
          theoryMarks: 65,
          practicalMarks: 15,
          totalMarks: 80
        }
      ];
      (Grade.findAll as jest.Mock).mockResolvedValue(mockGrades);

      // Mock rank info
      (rankCalculationService.getStudentRank as jest.Mock).mockResolvedValue({
        studentId: 1,
        totalMarks: 175,
        rank: 2,
        percentile: 85.5
      });

      // Mock attendance
      (AttendanceRecord.findAll as jest.Mock).mockResolvedValue([
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.ABSENT }
      ]);

      const result = await reportCardService.gatherReportCardData(1, 1, 1);

      expect(result.studentId).toBe(1);
      expect(result.studentCode).toBe('STU-2024-001');
      expect(result.studentNameEn).toBe('Ram Kumar Sharma');
      expect(result.subjects.length).toBe(2);
      expect(result.rank).toBe(2);
      expect(result.percentile).toBe(85.5);
    });

    it('should throw error if student not found', async () => {
      (Student.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(
        reportCardService.gatherReportCardData(999, 1, 1)
      ).rejects.toThrow('Student with ID 999 not found');
    });

    it('should throw error if no exams found', async () => {
      (Student.findByPk as jest.Mock).mockResolvedValue(mockStudent);
      (Exam.findAll as jest.Mock).mockResolvedValue([]);

      await expect(
        reportCardService.gatherReportCardData(1, 1, 1)
      ).rejects.toThrow('No exams found for term 1 and academic year 1');
    });

    it('should handle student without Nepali name', async () => {
      const studentWithoutNepaliName = {
        ...mockStudent,
        firstNameNp: undefined,
        middleNameNp: undefined,
        lastNameNp: undefined
      };

      (Student.findByPk as jest.Mock).mockResolvedValue(studentWithoutNepaliName);
      (Exam.findAll as jest.Mock).mockResolvedValue([
        { examId: 1, subjectId: 1, classId: 1, fullMarks: 100, termId: 1, academicYearId: 1 }
      ]);
      (Grade.findAll as jest.Mock).mockResolvedValue([
        { examId: 1, studentId: 1, theoryMarks: 75, practicalMarks: 20, totalMarks: 95 }
      ]);
      (rankCalculationService.getStudentRank as jest.Mock).mockResolvedValue({
        studentId: 1,
        totalMarks: 95,
        rank: 1,
        percentile: 100
      });
      (AttendanceRecord.findAll as jest.Mock).mockResolvedValue([]);

      const result = await reportCardService.gatherReportCardData(1, 1, 1);

      expect(result.studentNameNp).toBeUndefined();
    });
  });

  describe('generateReportCardPDF', () => {
    it('should generate PDF buffer', async () => {
      const mockReportCardData: ReportCardData = {
        studentId: 1,
        studentCode: 'STU-2024-001',
        studentNameEn: 'Ram Kumar Sharma',
        studentNameNp: 'राम कुमार शर्मा',
        symbolNumber: 'SEE-2024-12345',
        rollNumber: 15,
        dateOfBirthBS: '2065-05-15',
        dateOfBirthAD: new Date('2008-08-30'),
        academicYearId: 1,
        academicYearName: '2081-2082 BS',
        termId: 1,
        termName: 'First Terminal',
        className: 'Class 10 - A',
        subjects: [
          {
            subjectId: 1,
            subjectName: 'Mathematics',
            creditHours: 5,
            theoryMarks: 75,
            practicalMarks: 20,
            totalMarks: 95,
            fullMarks: 100,
            grade: NEBGrade.A_PLUS,
            gradePoint: 4.0
          }
        ],
        termGPA: 4.0,
        rank: 1,
        totalStudents: 50,
        percentile: 100,
        attendance: {
          totalDays: 100,
          presentDays: 95,
          absentDays: 3,
          lateDays: 2,
          excusedDays: 0,
          attendancePercentage: 97
        },
        classTeacherRemarks: 'Excellent performance',
        principalRemarks: 'Keep up the good work',
        generatedAt: new Date(),
        generatedBy: 1
      };

      const options: ReportCardOptions = {
        language: 'bilingual',
        format: 'ledger',
        includeSchoolSeal: false,
        includePrincipalSignature: false
      };

      const pdfBuffer = await reportCardService.generateReportCardPDF(
        mockReportCardData,
        mockSchoolInfo,
        options
      );

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should generate PDF with English language only', async () => {
      const mockReportCardData: ReportCardData = {
        studentId: 1,
        studentCode: 'STU-2024-001',
        studentNameEn: 'Ram Kumar Sharma',
        rollNumber: 15,
        dateOfBirthBS: '2065-05-15',
        dateOfBirthAD: new Date('2008-08-30'),
        academicYearId: 1,
        academicYearName: '2081-2082 BS',
        termId: 1,
        termName: 'First Terminal',
        className: 'Class 10 - A',
        subjects: [],
        termGPA: 0,
        rank: 1,
        totalStudents: 50,
        percentile: 100,
        attendance: {
          totalDays: 0,
          presentDays: 0,
          absentDays: 0,
          lateDays: 0,
          excusedDays: 0,
          attendancePercentage: 0
        },
        generatedAt: new Date(),
        generatedBy: 1
      };

      const options: ReportCardOptions = {
        language: 'english',
        format: 'standard'
      };

      const pdfBuffer = await reportCardService.generateReportCardPDF(
        mockReportCardData,
        mockSchoolInfo,
        options
      );

      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });
  });

  describe('saveReportCardPDF', () => {
    it('should save PDF to file', async () => {
      const mockReportCardData: ReportCardData = {
        studentId: 1,
        studentCode: 'STU-2024-001',
        studentNameEn: 'Ram Kumar Sharma',
        rollNumber: 15,
        dateOfBirthBS: '2065-05-15',
        dateOfBirthAD: new Date('2008-08-30'),
        academicYearId: 1,
        academicYearName: '2081-2082 BS',
        termId: 1,
        termName: 'First Terminal',
        className: 'Class 10 - A',
        subjects: [],
        termGPA: 0,
        rank: 1,
        totalStudents: 50,
        percentile: 100,
        attendance: {
          totalDays: 0,
          presentDays: 0,
          absentDays: 0,
          lateDays: 0,
          excusedDays: 0,
          attendancePercentage: 0
        },
        generatedAt: new Date(),
        generatedBy: 1
      };

      const outputPath = '/tmp/report_card.pdf';

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
      (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);

      const result = await reportCardService.saveReportCardPDF(
        mockReportCardData,
        mockSchoolInfo,
        outputPath
      );

      expect(result).toBe(outputPath);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('generateBulkReportCards', () => {
    it('should generate report cards for multiple students', async () => {
      const studentIds = [1, 2, 3];

      // Mock student data
      (Student.findByPk as jest.Mock).mockImplementation((id) => ({
        studentId: id,
        studentCode: `STU-2024-00${id}`,
        firstNameEn: `Student${id}`,
        lastNameEn: 'Test',
        dateOfBirthBS: '2065-05-15',
        dateOfBirthAD: new Date('2008-08-30'),
        currentClassId: 1
      }));

      (Exam.findAll as jest.Mock).mockResolvedValue([
        { examId: 1, subjectId: 1, classId: 1, fullMarks: 100, termId: 1, academicYearId: 1 }
      ]);

      (Grade.findAll as jest.Mock).mockResolvedValue([
        { examId: 1, studentId: 1, theoryMarks: 75, practicalMarks: 20, totalMarks: 95 }
      ]);

      (rankCalculationService.getStudentRank as jest.Mock).mockResolvedValue({
        studentId: 1,
        totalMarks: 95,
        rank: 1,
        percentile: 100
      });

      (AttendanceRecord.findAll as jest.Mock).mockResolvedValue([]);

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
      (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);

      const results = await reportCardService.generateBulkReportCards(
        studentIds,
        1,
        1,
        mockSchoolInfo,
        '/tmp/reports'
      );

      expect(results.length).toBe(3);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should handle errors for individual students', async () => {
      const studentIds = [1, 2];

      // First student succeeds
      (Student.findByPk as jest.Mock).mockImplementation((id) => {
        if (id === 1) {
          return {
            studentId: id,
            studentCode: `STU-2024-00${id}`,
            firstNameEn: `Student${id}`,
            lastNameEn: 'Test',
            dateOfBirthBS: '2065-05-15',
            dateOfBirthAD: new Date('2008-08-30'),
            currentClassId: 1
          };
        }
        return null; // Second student fails
      });

      (Exam.findAll as jest.Mock).mockResolvedValue([
        { examId: 1, subjectId: 1, classId: 1, fullMarks: 100, termId: 1, academicYearId: 1 }
      ]);

      (Grade.findAll as jest.Mock).mockResolvedValue([
        { examId: 1, studentId: 1, theoryMarks: 75, practicalMarks: 20, totalMarks: 95 }
      ]);

      (rankCalculationService.getStudentRank as jest.Mock).mockResolvedValue({
        studentId: 1,
        totalMarks: 95,
        rank: 1,
        percentile: 100
      });

      (AttendanceRecord.findAll as jest.Mock).mockResolvedValue([]);

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
      (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);

      const results = await reportCardService.generateBulkReportCards(
        studentIds,
        1,
        1,
        mockSchoolInfo,
        '/tmp/reports'
      );

      expect(results.length).toBe(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toContain('Student with ID 2 not found');
    });
  });

  describe('Edge Cases', () => {
    it('should handle student with no middle name', () => {
      const subjects: SubjectGradeInfo[] = [
        {
          subjectId: 1,
          subjectName: 'Mathematics',
          creditHours: 5,
          theoryMarks: 75,
          practicalMarks: 20,
          totalMarks: 95,
          fullMarks: 100,
          grade: NEBGrade.A_PLUS,
          gradePoint: 4.0
        }
      ];

      const gpa = reportCardService.calculateTermGPA(subjects);
      expect(gpa).toBe(4.0);
    });

    it('should handle zero attendance days', async () => {
      (AttendanceRecord.findAll as jest.Mock).mockResolvedValue([]);

      const result = await reportCardService.calculateAttendanceSummary(
        1,
        new Date('2024-01-01'),
        new Date('2024-03-31')
      );

      expect(result.attendancePercentage).toBe(0);
      expect(result.totalDays).toBe(0);
    });

    it('should handle subjects with zero credit hours in GPA calculation', () => {
      const subjects: SubjectGradeInfo[] = [
        {
          subjectId: 1,
          subjectName: 'Mathematics',
          creditHours: 0,
          theoryMarks: 75,
          practicalMarks: 20,
          totalMarks: 95,
          fullMarks: 100,
          grade: NEBGrade.A_PLUS,
          gradePoint: 4.0
        },
        {
          subjectId: 2,
          subjectName: 'Science',
          creditHours: 0,
          theoryMarks: 65,
          practicalMarks: 15,
          totalMarks: 80,
          fullMarks: 100,
          grade: NEBGrade.A,
          gradePoint: 3.6
        }
      ];

      const gpa = reportCardService.calculateTermGPA(subjects);
      expect(gpa).toBe(0);
    });
  });
});
