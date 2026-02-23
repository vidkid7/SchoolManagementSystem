import gradeEntryRepository from '../gradeEntry.repository';
import Grade, { NEBGrade } from '@models/Grade.model';

/**
 * Grade Entry Repository Unit Tests
 * 
 * Requirements: 7.6, 7.9, N1.1
 */

// Mock Grade model
jest.mock('@models/Grade.model');

describe('GradeEntryRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new grade entry', async () => {
      const gradeData = {
        examId: 1,
        studentId: 1,
        theoryMarks: 70,
        practicalMarks: 20,
        totalMarks: 90,
        grade: NEBGrade.A,
        gradePoint: 3.6,
        enteredBy: 1
      };

      const mockGrade = { gradeId: 1, ...gradeData };
      (Grade.create as jest.Mock).mockResolvedValue(mockGrade);

      const result = await gradeEntryRepository.create(gradeData);

      expect(result).toEqual(mockGrade);
      expect(Grade.create).toHaveBeenCalledWith(gradeData);
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple grade entries', async () => {
      const gradesData = [
        {
          examId: 1,
          studentId: 1,
          totalMarks: 90,
          grade: NEBGrade.A,
          gradePoint: 3.6,
          enteredBy: 1
        },
        {
          examId: 1,
          studentId: 2,
          totalMarks: 80,
          grade: NEBGrade.A,
          gradePoint: 3.6,
          enteredBy: 1
        }
      ];

      const mockGrades = gradesData.map((data, index) => ({
        gradeId: index + 1,
        ...data
      }));

      (Grade.bulkCreate as jest.Mock).mockResolvedValue(mockGrades);

      const result = await gradeEntryRepository.bulkCreate(gradesData);

      expect(result).toHaveLength(2);
      expect(Grade.bulkCreate).toHaveBeenCalledWith(gradesData);
    });
  });

  describe('findById', () => {
    it('should find grade by ID', async () => {
      const mockGrade = {
        gradeId: 1,
        examId: 1,
        studentId: 1,
        totalMarks: 90
      };

      (Grade.findByPk as jest.Mock).mockResolvedValue(mockGrade);

      const result = await gradeEntryRepository.findById(1);

      expect(result).toEqual(mockGrade);
      expect(Grade.findByPk).toHaveBeenCalledWith(1);
    });

    it('should return null when grade not found', async () => {
      (Grade.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await gradeEntryRepository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByExamId', () => {
    it('should find all grades for an exam', async () => {
      const mockGrades = [
        { gradeId: 1, examId: 1, studentId: 1 },
        { gradeId: 2, examId: 1, studentId: 2 }
      ];

      (Grade.findAll as jest.Mock).mockResolvedValue(mockGrades);

      const result = await gradeEntryRepository.findByExamId(1);

      expect(result).toHaveLength(2);
      expect(Grade.findAll).toHaveBeenCalledWith({
        where: { examId: 1 },
        order: [['studentId', 'ASC']]
      });
    });
  });

  describe('findByStudentId', () => {
    it('should find all grades for a student', async () => {
      const mockGrades = [
        { gradeId: 1, examId: 1, studentId: 1 },
        { gradeId: 2, examId: 2, studentId: 1 }
      ];

      (Grade.findAll as jest.Mock).mockResolvedValue(mockGrades);

      const result = await gradeEntryRepository.findByStudentId(1);

      expect(result).toHaveLength(2);
      expect(Grade.findAll).toHaveBeenCalledWith({
        where: { studentId: 1 },
        order: [['enteredAt', 'DESC']]
      });
    });
  });

  describe('findByStudentAndExam', () => {
    it('should find grade for specific student and exam', async () => {
      const mockGrade = {
        gradeId: 1,
        examId: 1,
        studentId: 1,
        totalMarks: 90
      };

      (Grade.findOne as jest.Mock).mockResolvedValue(mockGrade);

      const result = await gradeEntryRepository.findByStudentAndExam(1, 1);

      expect(result).toEqual(mockGrade);
      expect(Grade.findOne).toHaveBeenCalledWith({
        where: {
          studentId: 1,
          examId: 1
        }
      });
    });

    it('should return null when grade not found', async () => {
      (Grade.findOne as jest.Mock).mockResolvedValue(null);

      const result = await gradeEntryRepository.findByStudentAndExam(1, 999);

      expect(result).toBeNull();
    });
  });

  describe('findByExamIds', () => {
    it('should find grades for multiple exams', async () => {
      const mockGrades = [
        { gradeId: 1, examId: 1, studentId: 1 },
        { gradeId: 2, examId: 2, studentId: 1 }
      ];

      (Grade.findAll as jest.Mock).mockResolvedValue(mockGrades);

      const result = await gradeEntryRepository.findByExamIds([1, 2]);

      expect(result).toHaveLength(2);
      expect(Grade.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            examId: expect.any(Object)
          })
        })
      );
    });
  });

  describe('update', () => {
    it('should update grade successfully', async () => {
      const mockGrade = {
        gradeId: 1,
        totalMarks: 90,
        update: jest.fn().mockResolvedValue(true)
      };

      (Grade.findByPk as jest.Mock).mockResolvedValue(mockGrade);

      const updateData = { totalMarks: 95 };
      const result = await gradeEntryRepository.update(1, updateData);

      expect(mockGrade.update).toHaveBeenCalledWith(updateData);
      expect(result).toEqual(mockGrade);
    });

    it('should return null when grade not found', async () => {
      (Grade.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await gradeEntryRepository.update(999, { totalMarks: 95 });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete grade successfully', async () => {
      const mockGrade = {
        gradeId: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };

      (Grade.findByPk as jest.Mock).mockResolvedValue(mockGrade);

      const result = await gradeEntryRepository.delete(1);

      expect(result).toBe(true);
      expect(mockGrade.destroy).toHaveBeenCalled();
    });

    it('should return false when grade not found', async () => {
      (Grade.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await gradeEntryRepository.delete(999);

      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true when grade exists', async () => {
      (Grade.count as jest.Mock).mockResolvedValue(1);

      const result = await gradeEntryRepository.exists(1, 1);

      expect(result).toBe(true);
      expect(Grade.count).toHaveBeenCalledWith({
        where: {
          studentId: 1,
          examId: 1
        }
      });
    });

    it('should return false when grade does not exist', async () => {
      (Grade.count as jest.Mock).mockResolvedValue(0);

      const result = await gradeEntryRepository.exists(1, 999);

      expect(result).toBe(false);
    });
  });

  describe('countByExam', () => {
    it('should count grades for an exam', async () => {
      (Grade.count as jest.Mock).mockResolvedValue(25);

      const result = await gradeEntryRepository.countByExam(1);

      expect(result).toBe(25);
      expect(Grade.count).toHaveBeenCalledWith({
        where: { examId: 1 }
      });
    });
  });

  describe('countByStudent', () => {
    it('should count grades for a student', async () => {
      (Grade.count as jest.Mock).mockResolvedValue(10);

      const result = await gradeEntryRepository.countByStudent(1);

      expect(result).toBe(10);
      expect(Grade.count).toHaveBeenCalledWith({
        where: { studentId: 1 }
      });
    });
  });

  describe('findByGrade', () => {
    it('should find all grades with specific grade level', async () => {
      const mockGrades = [
        { gradeId: 1, grade: NEBGrade.A_PLUS },
        { gradeId: 2, grade: NEBGrade.A_PLUS }
      ];

      (Grade.findAll as jest.Mock).mockResolvedValue(mockGrades);

      const result = await gradeEntryRepository.findByGrade(NEBGrade.A_PLUS);

      expect(result).toHaveLength(2);
      expect(Grade.findAll).toHaveBeenCalledWith({
        where: { grade: NEBGrade.A_PLUS },
        order: [['enteredAt', 'DESC']]
      });
    });
  });

  describe('getAverageGradePoint', () => {
    it('should calculate average grade point', async () => {
      const mockGrades = [
        { gradePoint: 4.0 },
        { gradePoint: 3.6 },
        { gradePoint: 3.2 }
      ];

      (Grade.findAll as jest.Mock).mockResolvedValue(mockGrades);

      const result = await gradeEntryRepository.getAverageGradePoint(1);

      // Average: (4.0 + 3.6 + 3.2) / 3 = 3.6
      expect(result).toBeCloseTo(3.6, 1);
    });

    it('should return 0 when no grades exist', async () => {
      (Grade.findAll as jest.Mock).mockResolvedValue([]);

      const result = await gradeEntryRepository.getAverageGradePoint(1);

      expect(result).toBe(0);
    });
  });

  describe('getAverageMarks', () => {
    it('should calculate average marks', async () => {
      const mockGrades = [
        { totalMarks: 90 },
        { totalMarks: 80 },
        { totalMarks: 70 }
      ];

      (Grade.findAll as jest.Mock).mockResolvedValue(mockGrades);

      const result = await gradeEntryRepository.getAverageMarks(1);

      // Average: (90 + 80 + 70) / 3 = 80
      expect(result).toBe(80);
    });
  });

  describe('getHighestMarks', () => {
    it('should return highest marks', async () => {
      const mockGrades = [
        { totalMarks: 90 },
        { totalMarks: 95 },
        { totalMarks: 85 }
      ];

      (Grade.findAll as jest.Mock).mockResolvedValue(mockGrades);

      const result = await gradeEntryRepository.getHighestMarks(1);

      expect(result).toBe(95);
    });
  });

  describe('getLowestMarks', () => {
    it('should return lowest marks', async () => {
      const mockGrades = [
        { totalMarks: 90 },
        { totalMarks: 75 },
        { totalMarks: 85 }
      ];

      (Grade.findAll as jest.Mock).mockResolvedValue(mockGrades);

      const result = await gradeEntryRepository.getLowestMarks(1);

      expect(result).toBe(75);
    });
  });

  describe('getGradeDistribution', () => {
    it('should calculate grade distribution', async () => {
      const mockGrades = [
        { grade: NEBGrade.A_PLUS },
        { grade: NEBGrade.A_PLUS },
        { grade: NEBGrade.A },
        { grade: NEBGrade.B_PLUS },
        { grade: NEBGrade.B_PLUS },
        { grade: NEBGrade.B_PLUS }
      ];

      (Grade.findAll as jest.Mock).mockResolvedValue(mockGrades);

      const result = await gradeEntryRepository.getGradeDistribution(1);

      expect(result).toEqual({
        'A+': 2,
        'A': 1,
        'B+': 3
      });
    });
  });
});
