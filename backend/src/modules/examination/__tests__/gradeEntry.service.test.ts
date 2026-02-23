import gradeEntryService from '../gradeEntry.service';
import Grade from '@models/Grade.model';
import Exam from '@models/Exam.model';
import { calculateNEBGrade } from '@services/nebGrading.service';

/**
 * Grade Entry Service Unit Tests
 * 
 * Requirements: 7.6, 7.9, N1.1
 */

// Mock dependencies
jest.mock('@models/Grade.model');
jest.mock('@models/Exam.model');
jest.mock('@services/nebGrading.service');

describe('GradeEntryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateGradeEntry', () => {
    it('should validate grade entry successfully for theory+practical exam', async () => {
      // Mock exam with theory and practical
      const mockExam = {
        examId: 1,
        fullMarks: 100,
        theoryMarks: 75,
        practicalMarks: 25
      };

      (Exam.findByPk as jest.Mock).mockResolvedValue(mockExam);
      (Grade.findOne as jest.Mock).mockResolvedValue(null);

      const input = {
        examId: 1,
        studentId: 1,
        theoryMarks: 70,
        practicalMarks: 20,
        enteredBy: 1
      };

      const result = await gradeEntryService.validateGradeEntry(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject grade entry with marks out of range', async () => {
      const mockExam = {
        examId: 1,
        fullMarks: 100,
        theoryMarks: 75,
        practicalMarks: 25
      };

      (Exam.findByPk as jest.Mock).mockResolvedValue(mockExam);
      (Grade.findOne as jest.Mock).mockResolvedValue(null);

      const input = {
        examId: 1,
        studentId: 1,
        theoryMarks: 80, // Exceeds theoryMarks (75)
        practicalMarks: 20,
        enteredBy: 1
      };

      const result = await gradeEntryService.validateGradeEntry(input);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Theory marks must be between 0 and 75');
    });

    it('should reject duplicate grade entry', async () => {
      const mockExam = {
        examId: 1,
        fullMarks: 100,
        theoryMarks: 75,
        practicalMarks: 25
      };

      const mockExistingGrade = {
        gradeId: 1,
        examId: 1,
        studentId: 1
      };

      (Exam.findByPk as jest.Mock).mockResolvedValue(mockExam);
      (Grade.findOne as jest.Mock).mockResolvedValue(mockExistingGrade);

      const input = {
        examId: 1,
        studentId: 1,
        theoryMarks: 70,
        practicalMarks: 20,
        enteredBy: 1
      };

      const result = await gradeEntryService.validateGradeEntry(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Grade already exists for student 1 in exam 1');
    });

    it('should reject when exam not found', async () => {
      (Exam.findByPk as jest.Mock).mockResolvedValue(null);

      const input = {
        examId: 999,
        studentId: 1,
        theoryMarks: 70,
        practicalMarks: 20,
        enteredBy: 1
      };

      const result = await gradeEntryService.validateGradeEntry(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Exam with ID 999 not found');
    });
  });

  describe('createGradeEntry', () => {
    it('should create grade entry with auto-calculated NEB grade', async () => {
      const mockExam = {
        examId: 1,
        fullMarks: 100,
        theoryMarks: 75,
        practicalMarks: 25
      };

      const mockNEBGrade = {
        grade: 'A',
        gradePoint: 3.6,
        description: 'Excellent'
      };

      (Exam.findByPk as jest.Mock).mockResolvedValue(mockExam);
      (Grade.findOne as jest.Mock).mockResolvedValue(null);
      (calculateNEBGrade as jest.Mock).mockReturnValue(mockNEBGrade);
      (Grade.create as jest.Mock).mockResolvedValue({
        gradeId: 1,
        examId: 1,
        studentId: 1,
        theoryMarks: 70,
        practicalMarks: 20,
        totalMarks: 90,
        grade: 'A',
        gradePoint: 3.6,
        enteredBy: 1
      });

      const input = {
        examId: 1,
        studentId: 1,
        theoryMarks: 70,
        practicalMarks: 20,
        enteredBy: 1
      };

      const result = await gradeEntryService.createGradeEntry(input);

      expect(result.totalMarks).toBe(90);
      expect(result.grade).toBe('A');
      expect(result.gradePoint).toBe(3.6);
      expect(calculateNEBGrade).toHaveBeenCalledWith(90); // 90% of 100
    });

    it('should calculate total marks from theory and practical', async () => {
      const mockExam = {
        examId: 1,
        fullMarks: 100,
        theoryMarks: 75,
        practicalMarks: 25
      };

      const mockNEBGrade = {
        grade: 'B+',
        gradePoint: 3.2,
        description: 'Very Good'
      };

      (Exam.findByPk as jest.Mock).mockResolvedValue(mockExam);
      (Grade.findOne as jest.Mock).mockResolvedValue(null);
      (calculateNEBGrade as jest.Mock).mockReturnValue(mockNEBGrade);
      (Grade.create as jest.Mock).mockResolvedValue({
        gradeId: 1,
        examId: 1,
        studentId: 1,
        theoryMarks: 60,
        practicalMarks: 15,
        totalMarks: 75,
        grade: 'B+',
        gradePoint: 3.2,
        enteredBy: 1
      });

      const input = {
        examId: 1,
        studentId: 1,
        theoryMarks: 60,
        practicalMarks: 15,
        enteredBy: 1
      };

      const result = await gradeEntryService.createGradeEntry(input);

      expect(result.totalMarks).toBe(75);
      expect(Grade.create).toHaveBeenCalledWith(
        expect.objectContaining({
          totalMarks: 75
        })
      );
    });

    it('should throw error for invalid grade entry', async () => {
      const mockExam = {
        examId: 1,
        fullMarks: 100,
        theoryMarks: 75,
        practicalMarks: 25
      };

      (Exam.findByPk as jest.Mock).mockResolvedValue(mockExam);
      (Grade.findOne as jest.Mock).mockResolvedValue({ gradeId: 1 }); // Duplicate

      const input = {
        examId: 1,
        studentId: 1,
        theoryMarks: 70,
        practicalMarks: 20,
        enteredBy: 1
      };

      await expect(gradeEntryService.createGradeEntry(input)).rejects.toThrow(
        'Grade entry validation failed'
      );
    });
  });

  describe('updateGradeEntry', () => {
    it('should update grade entry and recalculate NEB grade', async () => {
      const mockGrade = {
        gradeId: 1,
        examId: 1,
        studentId: 1,
        theoryMarks: 60,
        practicalMarks: 15,
        totalMarks: 75,
        grade: 'B+',
        gradePoint: 3.2,
        update: jest.fn()
      };

      const mockExam = {
        examId: 1,
        fullMarks: 100,
        theoryMarks: 75,
        practicalMarks: 25
      };

      const mockNEBGrade = {
        grade: 'A',
        gradePoint: 3.6,
        description: 'Excellent'
      };

      (Grade.findByPk as jest.Mock).mockResolvedValue(mockGrade);
      (Exam.findByPk as jest.Mock).mockResolvedValue(mockExam);
      (calculateNEBGrade as jest.Mock).mockReturnValue(mockNEBGrade);

      const updates = {
        theoryMarks: 70,
        practicalMarks: 20
      };

      await gradeEntryService.updateGradeEntry(1, updates);

      expect(mockGrade.update).toHaveBeenCalledWith(
        expect.objectContaining({
          theoryMarks: 70,
          practicalMarks: 20,
          totalMarks: 90,
          grade: 'A',
          gradePoint: 3.6
        })
      );
    });

    it('should throw error when grade not found', async () => {
      (Grade.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(gradeEntryService.updateGradeEntry(999, {})).rejects.toThrow(
        'Grade with ID 999 not found'
      );
    });
  });

  describe('calculateWeightedGrades', () => {
    it('should calculate weighted grades correctly', async () => {
      const mockGrades = [
        {
          gradeId: 1,
          examId: 1,
          studentId: 1,
          totalMarks: 80
        },
        {
          gradeId: 2,
          examId: 2,
          studentId: 1,
          totalMarks: 90
        }
      ];

      const mockExams = [
        { examId: 1, fullMarks: 100 },
        { examId: 2, fullMarks: 100 }
      ];

      const mockNEBGrade = {
        grade: 'A',
        gradePoint: 3.6,
        description: 'Excellent'
      };

      (Grade.findAll as jest.Mock).mockResolvedValue(mockGrades);
      (Exam.findByPk as jest.Mock)
        .mockResolvedValueOnce(mockExams[0])
        .mockResolvedValueOnce(mockExams[1]);
      (calculateNEBGrade as jest.Mock).mockReturnValue(mockNEBGrade);

      const input = {
        examId: 0,
        studentId: 1,
        assessments: [
          { examId: 1, weightage: 30 },
          { examId: 2, weightage: 70 }
        ]
      };

      const result = await gradeEntryService.calculateWeightedGrades(input);

      // Expected: (80% * 30%) + (90% * 70%) = 24 + 63 = 87%
      expect(result.totalWeightedPercentage).toBe(87);
      expect(result.grade).toBe('A');
      expect(result.gradePoint).toBe(3.6);
      expect(result.assessments).toHaveLength(2);
    });

    it('should throw error when weightages do not sum to 100', async () => {
      const input = {
        examId: 0,
        studentId: 1,
        assessments: [
          { examId: 1, weightage: 30 },
          { examId: 2, weightage: 60 } // Sum = 90, not 100
        ]
      };

      await expect(gradeEntryService.calculateWeightedGrades(input)).rejects.toThrow(
        'Weightages must sum to 100'
      );
    });

    it('should throw error when grades are missing', async () => {
      (Grade.findAll as jest.Mock).mockResolvedValue([
        { gradeId: 1, examId: 1, studentId: 1, totalMarks: 80 }
        // Missing grade for exam 2
      ]);

      const input = {
        examId: 0,
        studentId: 1,
        assessments: [
          { examId: 1, weightage: 30 },
          { examId: 2, weightage: 70 }
        ]
      };

      await expect(gradeEntryService.calculateWeightedGrades(input)).rejects.toThrow(
        'Missing grades for exams'
      );
    });
  });

  describe('getExamStatistics', () => {
    it('should calculate exam statistics correctly', async () => {
      const mockGrades = [
        { gradeId: 1, totalMarks: 90, grade: 'A+' },
        { gradeId: 2, totalMarks: 80, grade: 'A' },
        { gradeId: 3, totalMarks: 70, grade: 'B+' },
        { gradeId: 4, totalMarks: 60, grade: 'B' },
        { gradeId: 5, totalMarks: 30, grade: 'NG' }
      ];

      const mockExam = {
        examId: 1,
        passMarks: 35
      };

      (Grade.findAll as jest.Mock).mockResolvedValue(mockGrades);
      (Exam.findByPk as jest.Mock).mockResolvedValue(mockExam);

      const stats = await gradeEntryService.getExamStatistics(1);

      expect(stats.totalStudents).toBe(5);
      expect(stats.averageMarks).toBe(66); // (90+80+70+60+30)/5 = 66
      expect(stats.highestMarks).toBe(90);
      expect(stats.lowestMarks).toBe(30);
      expect(stats.passCount).toBe(4); // All except 30
      expect(stats.failCount).toBe(1);
      expect(stats.passPercentage).toBe(80); // 4/5 * 100
      expect(stats.gradeDistribution).toEqual({
        'A+': 1,
        'A': 1,
        'B+': 1,
        'B': 1,
        'NG': 1
      });
    });

    it('should return zero statistics for exam with no grades', async () => {
      (Grade.findAll as jest.Mock).mockResolvedValue([]);
      (Exam.findByPk as jest.Mock).mockResolvedValue({ examId: 1 });

      const stats = await gradeEntryService.getExamStatistics(1);

      expect(stats.totalStudents).toBe(0);
      expect(stats.averageMarks).toBe(0);
      expect(stats.highestMarks).toBe(0);
      expect(stats.lowestMarks).toBe(0);
      expect(stats.passCount).toBe(0);
      expect(stats.failCount).toBe(0);
      expect(stats.passPercentage).toBe(0);
    });
  });

  describe('getGradesByExam', () => {
    it('should return all grades for an exam', async () => {
      const mockGrades = [
        { gradeId: 1, examId: 1, studentId: 1 },
        { gradeId: 2, examId: 1, studentId: 2 }
      ];

      (Grade.findAll as jest.Mock).mockResolvedValue(mockGrades);

      const result = await gradeEntryService.getGradesByExam(1);

      expect(result).toHaveLength(2);
      expect(Grade.findAll).toHaveBeenCalledWith({
        where: { examId: 1 },
        order: [['studentId', 'ASC']]
      });
    });
  });

  describe('getGradesByStudent', () => {
    it('should return all grades for a student', async () => {
      const mockGrades = [
        { gradeId: 1, examId: 1, studentId: 1 },
        { gradeId: 2, examId: 2, studentId: 1 }
      ];

      (Grade.findAll as jest.Mock).mockResolvedValue(mockGrades);

      const result = await gradeEntryService.getGradesByStudent(1);

      expect(result).toHaveLength(2);
      expect(Grade.findAll).toHaveBeenCalledWith({
        where: { studentId: 1 },
        order: [['enteredAt', 'DESC']]
      });
    });
  });

  describe('deleteGrade', () => {
    it('should delete grade successfully', async () => {
      const mockGrade = {
        gradeId: 1,
        destroy: jest.fn()
      };

      (Grade.findByPk as jest.Mock).mockResolvedValue(mockGrade);

      const result = await gradeEntryService.deleteGrade(1);

      expect(result).toBe(true);
      expect(mockGrade.destroy).toHaveBeenCalled();
    });

    it('should return false when grade not found', async () => {
      (Grade.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await gradeEntryService.deleteGrade(999);

      expect(result).toBe(false);
    });
  });
});
