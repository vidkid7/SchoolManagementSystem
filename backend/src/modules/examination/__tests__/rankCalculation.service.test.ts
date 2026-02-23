import rankCalculationService from '../rankCalculation.service';
import Grade from '@models/Grade.model';
import Exam from '@models/Exam.model';
import { ExamType } from '@models/Exam.model';

// Mock the models
jest.mock('@models/Grade.model');
jest.mock('@models/Exam.model');

describe('RankCalculationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateRanks', () => {
    it('should calculate ranks correctly for students with different marks', () => {
      const students = [
        { studentId: 1, totalMarks: 95 },
        { studentId: 2, totalMarks: 85 },
        { studentId: 3, totalMarks: 75 },
        { studentId: 4, totalMarks: 65 }
      ];

      const result = rankCalculationService.calculateRanks(students);

      expect(result).toHaveLength(4);
      expect(result[0]).toMatchObject({ studentId: 1, rank: 1, totalMarks: 95 });
      expect(result[1]).toMatchObject({ studentId: 2, rank: 2, totalMarks: 85 });
      expect(result[2]).toMatchObject({ studentId: 3, rank: 3, totalMarks: 75 });
      expect(result[3]).toMatchObject({ studentId: 4, rank: 4, totalMarks: 65 });
    });

    it('should handle tied students correctly - same rank, skip next rank', () => {
      const students = [
        { studentId: 1, totalMarks: 95 },
        { studentId: 2, totalMarks: 85 },
        { studentId: 3, totalMarks: 85 }, // Tied with student 2
        { studentId: 4, totalMarks: 75 }
      ];

      const result = rankCalculationService.calculateRanks(students);

      expect(result).toHaveLength(4);
      expect(result[0]).toMatchObject({ studentId: 1, rank: 1, totalMarks: 95 });
      expect(result[1]).toMatchObject({ studentId: 2, rank: 2, totalMarks: 85 });
      expect(result[2]).toMatchObject({ studentId: 3, rank: 2, totalMarks: 85 }); // Same rank as student 2
      expect(result[3]).toMatchObject({ studentId: 4, rank: 4, totalMarks: 75 }); // Rank 3 is skipped
    });

    it('should handle multiple tied students correctly', () => {
      const students = [
        { studentId: 1, totalMarks: 95 },
        { studentId: 2, totalMarks: 85 },
        { studentId: 3, totalMarks: 85 },
        { studentId: 4, totalMarks: 85 }, // Three students tied at 85
        { studentId: 5, totalMarks: 75 }
      ];

      const result = rankCalculationService.calculateRanks(students);

      expect(result).toHaveLength(5);
      expect(result[0]).toMatchObject({ studentId: 1, rank: 1 });
      expect(result[1]).toMatchObject({ studentId: 2, rank: 2 });
      expect(result[2]).toMatchObject({ studentId: 3, rank: 2 });
      expect(result[3]).toMatchObject({ studentId: 4, rank: 2 });
      expect(result[4]).toMatchObject({ studentId: 5, rank: 5 }); // Ranks 3 and 4 are skipped
    });

    it('should handle all students with same marks', () => {
      const students = [
        { studentId: 1, totalMarks: 85 },
        { studentId: 2, totalMarks: 85 },
        { studentId: 3, totalMarks: 85 }
      ];

      const result = rankCalculationService.calculateRanks(students);

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({ studentId: 1, rank: 1 });
      expect(result[1]).toMatchObject({ studentId: 2, rank: 1 });
      expect(result[2]).toMatchObject({ studentId: 3, rank: 1 });
    });

    it('should return empty array for empty input', () => {
      const result = rankCalculationService.calculateRanks([]);
      expect(result).toEqual([]);
    });

    it('should handle single student', () => {
      const students = [{ studentId: 1, totalMarks: 95 }];

      const result = rankCalculationService.calculateRanks(students);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        studentId: 1,
        rank: 1,
        totalMarks: 95,
        percentile: 100
      });
    });

    it('should calculate percentile correctly', () => {
      const students = [
        { studentId: 1, totalMarks: 95 },
        { studentId: 2, totalMarks: 85 },
        { studentId: 3, totalMarks: 75 },
        { studentId: 4, totalMarks: 65 }
      ];

      const result = rankCalculationService.calculateRanks(students);

      // Student with highest marks should have 100th percentile
      expect(result[0].percentile).toBe(100);
      
      // Student with lowest marks should have 25th percentile (1 out of 4)
      expect(result[3].percentile).toBe(25);
    });

    it('should sort students by marks in descending order', () => {
      const students = [
        { studentId: 1, totalMarks: 65 },
        { studentId: 2, totalMarks: 95 },
        { studentId: 3, totalMarks: 75 },
        { studentId: 4, totalMarks: 85 }
      ];

      const result = rankCalculationService.calculateRanks(students);

      expect(result[0].totalMarks).toBe(95);
      expect(result[1].totalMarks).toBe(85);
      expect(result[2].totalMarks).toBe(75);
      expect(result[3].totalMarks).toBe(65);
    });
  });

  describe('calculateClassRank', () => {
    it('should calculate class rank for an exam', async () => {
      const mockExam = {
        examId: 1,
        classId: 10,
        name: 'Final Exam',
        type: ExamType.FINAL,
        fullMarks: 100
      };

      const mockGrades = [
        { studentId: 1, totalMarks: 95, examId: 1 },
        { studentId: 2, totalMarks: 85, examId: 1 },
        { studentId: 3, totalMarks: 75, examId: 1 }
      ];

      (Exam.findByPk as jest.Mock).mockResolvedValue(mockExam);
      (Grade.findAll as jest.Mock).mockResolvedValue(mockGrades);

      const result = await rankCalculationService.calculateClassRank(1, 10);

      expect(result.examId).toBe(1);
      expect(result.classId).toBe(10);
      expect(result.totalStudents).toBe(3);
      expect(result.ranks).toHaveLength(3);
      expect(result.ranks[0]).toMatchObject({ studentId: 1, rank: 1 });
      expect(result.ranks[1]).toMatchObject({ studentId: 2, rank: 2 });
      expect(result.ranks[2]).toMatchObject({ studentId: 3, rank: 3 });
    });

    it('should throw error if exam not found', async () => {
      (Exam.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(
        rankCalculationService.calculateClassRank(999, 10)
      ).rejects.toThrow('Exam with ID 999 not found');
    });

    it('should throw error if exam does not belong to class', async () => {
      const mockExam = {
        examId: 1,
        classId: 10,
        name: 'Final Exam'
      };

      (Exam.findByPk as jest.Mock).mockResolvedValue(mockExam);

      await expect(
        rankCalculationService.calculateClassRank(1, 20)
      ).rejects.toThrow('Exam 1 does not belong to class 20');
    });

    it('should return empty result if no grades found', async () => {
      const mockExam = {
        examId: 1,
        classId: 10,
        name: 'Final Exam'
      };

      (Exam.findByPk as jest.Mock).mockResolvedValue(mockExam);
      (Grade.findAll as jest.Mock).mockResolvedValue([]);

      const result = await rankCalculationService.calculateClassRank(1, 10);

      expect(result.totalStudents).toBe(0);
      expect(result.ranks).toEqual([]);
    });
  });

  describe('calculateSectionRank', () => {
    it('should calculate section rank for an exam', async () => {
      const mockExam = {
        examId: 1,
        classId: 10,
        name: 'Final Exam'
      };

      const mockGrades = [
        { studentId: 1, totalMarks: 95, examId: 1 },
        { studentId: 2, totalMarks: 85, examId: 1 }
      ];

      (Exam.findByPk as jest.Mock).mockResolvedValue(mockExam);
      (Grade.findAll as jest.Mock).mockResolvedValue(mockGrades);

      const result = await rankCalculationService.calculateSectionRank(1, 10, 1);

      expect(result.examId).toBe(1);
      expect(result.classId).toBe(10);
      expect(result.sectionId).toBe(1);
      expect(result.totalStudents).toBe(2);
      expect(result.ranks).toHaveLength(2);
    });
  });

  describe('getStudentRank', () => {
    it('should get rank for a specific student', async () => {
      const mockExam = {
        examId: 1,
        classId: 10,
        name: 'Final Exam'
      };

      const mockStudentGrade = {
        studentId: 2,
        totalMarks: 85,
        examId: 1
      };

      const mockGrades = [
        { studentId: 1, totalMarks: 95, examId: 1 },
        { studentId: 2, totalMarks: 85, examId: 1 },
        { studentId: 3, totalMarks: 75, examId: 1 }
      ];

      (Grade.findOne as jest.Mock).mockResolvedValue(mockStudentGrade);
      (Exam.findByPk as jest.Mock).mockResolvedValue(mockExam);
      (Grade.findAll as jest.Mock).mockResolvedValue(mockGrades);

      const result = await rankCalculationService.getStudentRank(1, 2);

      expect(result).not.toBeNull();
      expect(result?.studentId).toBe(2);
      expect(result?.rank).toBe(2);
      expect(result?.totalMarks).toBe(85);
    });

    it('should return null if student has no grade for exam', async () => {
      (Grade.findOne as jest.Mock).mockResolvedValue(null);

      const result = await rankCalculationService.getStudentRank(1, 999);

      expect(result).toBeNull();
    });
  });

  describe('calculateOverallRank', () => {
    it('should calculate overall rank across multiple exams', async () => {
      const mockGrades = [
        { studentId: 1, examId: 1, totalMarks: 95 },
        { studentId: 1, examId: 2, totalMarks: 90 }, // Student 1 total: 185
        { studentId: 2, examId: 1, totalMarks: 85 },
        { studentId: 2, examId: 2, totalMarks: 88 }, // Student 2 total: 173
        { studentId: 3, examId: 1, totalMarks: 75 },
        { studentId: 3, examId: 2, totalMarks: 80 }  // Student 3 total: 155
      ];

      (Grade.findAll as jest.Mock).mockResolvedValue(mockGrades);

      const result = await rankCalculationService.calculateOverallRank([1, 2], 10);

      expect(result.totalStudents).toBe(3);
      expect(result.ranks).toHaveLength(3);
      expect(result.ranks[0]).toMatchObject({ studentId: 1, rank: 1, totalMarks: 185 });
      expect(result.ranks[1]).toMatchObject({ studentId: 2, rank: 2, totalMarks: 173 });
      expect(result.ranks[2]).toMatchObject({ studentId: 3, rank: 3, totalMarks: 155 });
    });

    it('should throw error if no exam IDs provided', async () => {
      await expect(
        rankCalculationService.calculateOverallRank([], 10)
      ).rejects.toThrow('At least one exam ID is required');
    });

    it('should return empty result if no grades found', async () => {
      (Grade.findAll as jest.Mock).mockResolvedValue([]);

      const result = await rankCalculationService.calculateOverallRank([1, 2], 10);

      expect(result.totalStudents).toBe(0);
      expect(result.ranks).toEqual([]);
    });
  });

  describe('calculatePercentile', () => {
    it('should calculate percentile correctly', () => {
      const allMarks = [95, 85, 75, 65, 55];

      // Student with 85 marks: 4 out of 5 students have marks <= 85
      const percentile = rankCalculationService.calculatePercentile(85, allMarks);
      expect(percentile).toBe(80);
    });

    it('should return 100 for highest marks', () => {
      const allMarks = [95, 85, 75, 65];
      const percentile = rankCalculationService.calculatePercentile(95, allMarks);
      expect(percentile).toBe(100);
    });

    it('should return 25 for lowest marks in 4 students', () => {
      const allMarks = [95, 85, 75, 65];
      const percentile = rankCalculationService.calculatePercentile(65, allMarks);
      expect(percentile).toBe(25);
    });

    it('should return 0 for empty marks array', () => {
      const percentile = rankCalculationService.calculatePercentile(85, []);
      expect(percentile).toBe(0);
    });

    it('should handle tied marks correctly', () => {
      const allMarks = [95, 85, 85, 75, 65];
      // 4 students have marks <= 85 (including both 85s)
      const percentile = rankCalculationService.calculatePercentile(85, allMarks);
      expect(percentile).toBe(80);
    });
  });

  describe('getRankStatistics', () => {
    it('should return rank statistics for an exam', async () => {
      const mockExam = {
        examId: 1,
        classId: 10,
        name: 'Final Exam'
      };

      const mockGrades = [
        { studentId: 1, totalMarks: 95, examId: 1 },
        { studentId: 2, totalMarks: 85, examId: 1 },
        { studentId: 3, totalMarks: 85, examId: 1 }, // Tied
        { studentId: 4, totalMarks: 75, examId: 1 },
        { studentId: 5, totalMarks: 65, examId: 1 }
      ];

      (Exam.findByPk as jest.Mock).mockResolvedValue(mockExam);
      (Grade.findAll as jest.Mock).mockResolvedValue(mockGrades);

      const result = await rankCalculationService.getRankStatistics(1, 10);

      expect(result.totalStudents).toBe(5);
      expect(result.topRank).toBe(1);
      expect(result.bottomRank).toBe(5); // Last rank (5 students, ranks: 1, 2, 2, 4, 5)
      expect(result.averageMarks).toBe(81); // (95+85+85+75+65)/5 = 81
      expect(result.medianMarks).toBe(85); // Middle value
      expect(result.tiedRanks).toHaveLength(1);
      expect(result.tiedRanks[0]).toEqual({ rank: 2, count: 2 }); // Two students at rank 2
    });

    it('should return zero statistics for empty grades', async () => {
      const mockExam = {
        examId: 1,
        classId: 10,
        name: 'Final Exam'
      };

      (Exam.findByPk as jest.Mock).mockResolvedValue(mockExam);
      (Grade.findAll as jest.Mock).mockResolvedValue([]);

      const result = await rankCalculationService.getRankStatistics(1, 10);

      expect(result.totalStudents).toBe(0);
      expect(result.topRank).toBe(0);
      expect(result.bottomRank).toBe(0);
      expect(result.averageMarks).toBe(0);
      expect(result.medianMarks).toBe(0);
      expect(result.tiedRanks).toEqual([]);
    });

    it('should calculate median correctly for even number of students', async () => {
      const mockExam = {
        examId: 1,
        classId: 10,
        name: 'Final Exam'
      };

      const mockGrades = [
        { studentId: 1, totalMarks: 90, examId: 1 },
        { studentId: 2, totalMarks: 80, examId: 1 },
        { studentId: 3, totalMarks: 70, examId: 1 },
        { studentId: 4, totalMarks: 60, examId: 1 }
      ];

      (Exam.findByPk as jest.Mock).mockResolvedValue(mockExam);
      (Grade.findAll as jest.Mock).mockResolvedValue(mockGrades);

      const result = await rankCalculationService.getRankStatistics(1, 10);

      // Median of [60, 70, 80, 90] = (70 + 80) / 2 = 75
      expect(result.medianMarks).toBe(75);
    });
  });
});
