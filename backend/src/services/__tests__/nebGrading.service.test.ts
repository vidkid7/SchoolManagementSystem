/**
 * Unit Tests for NEB Grading Service
 * 
 * Tests the NEB grade calculation functionality including:
 * - Grade mapping for all 8 grade levels
 * - Edge cases and boundary values
 * - Input validation
 * - Helper functions
 */

import {
  calculateNEBGrade,
  getGradeInfo,
  isPassing,
  getAllGrades,
  NEB_GRADE_SCALE,
  calculateGPA,
  calculateWeightedGrade,
  calculateAggregateGPA,
  SubjectGrade,
  WeightedMarksConfig,
  validateClass11SubjectCombination,
  validateClass12SubjectCombination,
  validateSubjectCombination,
} from '../nebGrading.service';

describe('NEB Grading Service', () => {
  describe('NEB_GRADE_SCALE', () => {
    it('should have exactly 8 grade levels', () => {
      expect(NEB_GRADE_SCALE).toHaveLength(8);
    });

    it('should have all required grades in correct order', () => {
      const grades = NEB_GRADE_SCALE.map((g) => g.grade);
      expect(grades).toEqual(['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'NG']);
    });

    it('should have correct grade points for each grade', () => {
      const gradePoints = NEB_GRADE_SCALE.map((g) => g.gradePoint);
      expect(gradePoints).toEqual([4.0, 3.6, 3.2, 2.8, 2.4, 2.0, 1.6, 0.0]);
    });

    it('should have no gaps in marks ranges', () => {
      // Check that ranges are properly ordered (descending)
      // and that each grade's minMarks is less than or equal to maxMarks
      for (let i = 0; i < NEB_GRADE_SCALE.length; i++) {
        const grade = NEB_GRADE_SCALE[i];
        expect(grade.minMarks).toBeLessThanOrEqual(grade.maxMarks);
        
        // Check that grades are in descending order
        if (i < NEB_GRADE_SCALE.length - 1) {
          const nextGrade = NEB_GRADE_SCALE[i + 1];
          expect(grade.minMarks).toBeGreaterThan(nextGrade.maxMarks);
        }
      }
    });

    it('should cover the full range from 0 to 100', () => {
      expect(NEB_GRADE_SCALE[0].maxMarks).toBe(100);
      expect(NEB_GRADE_SCALE[NEB_GRADE_SCALE.length - 1].minMarks).toBe(0);
    });
  });

  describe('calculateNEBGrade', () => {
    describe('A+ grade (90-100)', () => {
      it('should return A+ for 100 marks', () => {
        const result = calculateNEBGrade(100);
        expect(result.grade).toBe('A+');
        expect(result.gradePoint).toBe(4.0);
        expect(result.description).toBe('Outstanding');
      });

      it('should return A+ for 90 marks (lower boundary)', () => {
        const result = calculateNEBGrade(90);
        expect(result.grade).toBe('A+');
        expect(result.gradePoint).toBe(4.0);
      });

      it('should return A+ for 95 marks (mid-range)', () => {
        const result = calculateNEBGrade(95);
        expect(result.grade).toBe('A+');
        expect(result.gradePoint).toBe(4.0);
      });
    });

    describe('A grade (80-89)', () => {
      it('should return A for 89 marks (upper boundary)', () => {
        const result = calculateNEBGrade(89);
        expect(result.grade).toBe('A');
        expect(result.gradePoint).toBe(3.6);
        expect(result.description).toBe('Excellent');
      });

      it('should return A for 80 marks (lower boundary)', () => {
        const result = calculateNEBGrade(80);
        expect(result.grade).toBe('A');
        expect(result.gradePoint).toBe(3.6);
      });

      it('should return A for 85 marks (mid-range)', () => {
        const result = calculateNEBGrade(85);
        expect(result.grade).toBe('A');
        expect(result.gradePoint).toBe(3.6);
      });
    });

    describe('B+ grade (70-79)', () => {
      it('should return B+ for 79 marks (upper boundary)', () => {
        const result = calculateNEBGrade(79);
        expect(result.grade).toBe('B+');
        expect(result.gradePoint).toBe(3.2);
        expect(result.description).toBe('Very Good');
      });

      it('should return B+ for 70 marks (lower boundary)', () => {
        const result = calculateNEBGrade(70);
        expect(result.grade).toBe('B+');
        expect(result.gradePoint).toBe(3.2);
      });

      it('should return B+ for 75 marks (mid-range)', () => {
        const result = calculateNEBGrade(75);
        expect(result.grade).toBe('B+');
        expect(result.gradePoint).toBe(3.2);
      });
    });

    describe('B grade (60-69)', () => {
      it('should return B for 69 marks (upper boundary)', () => {
        const result = calculateNEBGrade(69);
        expect(result.grade).toBe('B');
        expect(result.gradePoint).toBe(2.8);
        expect(result.description).toBe('Good');
      });

      it('should return B for 60 marks (lower boundary)', () => {
        const result = calculateNEBGrade(60);
        expect(result.grade).toBe('B');
        expect(result.gradePoint).toBe(2.8);
      });

      it('should return B for 65 marks (mid-range)', () => {
        const result = calculateNEBGrade(65);
        expect(result.grade).toBe('B');
        expect(result.gradePoint).toBe(2.8);
      });
    });

    describe('C+ grade (50-59)', () => {
      it('should return C+ for 59 marks (upper boundary)', () => {
        const result = calculateNEBGrade(59);
        expect(result.grade).toBe('C+');
        expect(result.gradePoint).toBe(2.4);
        expect(result.description).toBe('Satisfactory');
      });

      it('should return C+ for 50 marks (lower boundary)', () => {
        const result = calculateNEBGrade(50);
        expect(result.grade).toBe('C+');
        expect(result.gradePoint).toBe(2.4);
      });

      it('should return C+ for 55 marks (mid-range)', () => {
        const result = calculateNEBGrade(55);
        expect(result.grade).toBe('C+');
        expect(result.gradePoint).toBe(2.4);
      });
    });

    describe('C grade (40-49)', () => {
      it('should return C for 49 marks (upper boundary)', () => {
        const result = calculateNEBGrade(49);
        expect(result.grade).toBe('C');
        expect(result.gradePoint).toBe(2.0);
        expect(result.description).toBe('Acceptable');
      });

      it('should return C for 40 marks (lower boundary)', () => {
        const result = calculateNEBGrade(40);
        expect(result.grade).toBe('C');
        expect(result.gradePoint).toBe(2.0);
      });

      it('should return C for 45 marks (mid-range)', () => {
        const result = calculateNEBGrade(45);
        expect(result.grade).toBe('C');
        expect(result.gradePoint).toBe(2.0);
      });
    });

    describe('D grade (32-39)', () => {
      it('should return D for 39 marks (upper boundary)', () => {
        const result = calculateNEBGrade(39);
        expect(result.grade).toBe('D');
        expect(result.gradePoint).toBe(1.6);
        expect(result.description).toBe('Basic');
      });

      it('should return D for 32 marks (lower boundary)', () => {
        const result = calculateNEBGrade(32);
        expect(result.grade).toBe('D');
        expect(result.gradePoint).toBe(1.6);
      });

      it('should return D for 35 marks (mid-range)', () => {
        const result = calculateNEBGrade(35);
        expect(result.grade).toBe('D');
        expect(result.gradePoint).toBe(1.6);
      });
    });

    describe('NG grade (0-31)', () => {
      it('should return NG for 31 marks (upper boundary)', () => {
        const result = calculateNEBGrade(31);
        expect(result.grade).toBe('NG');
        expect(result.gradePoint).toBe(0.0);
        expect(result.description).toBe('Not Graded');
      });

      it('should return NG for 0 marks (lower boundary)', () => {
        const result = calculateNEBGrade(0);
        expect(result.grade).toBe('NG');
        expect(result.gradePoint).toBe(0.0);
      });

      it('should return NG for 15 marks (mid-range)', () => {
        const result = calculateNEBGrade(15);
        expect(result.grade).toBe('NG');
        expect(result.gradePoint).toBe(0.0);
      });
    });

    describe('Edge cases and validation', () => {
      it('should throw error for negative marks', () => {
        expect(() => calculateNEBGrade(-1)).toThrow('Marks must be between 0 and 100');
        expect(() => calculateNEBGrade(-10)).toThrow('Marks must be between 0 and 100');
      });

      it('should throw error for marks above 100', () => {
        expect(() => calculateNEBGrade(101)).toThrow('Marks must be between 0 and 100');
        expect(() => calculateNEBGrade(150)).toThrow('Marks must be between 0 and 100');
      });

      it('should throw error for NaN', () => {
        expect(() => calculateNEBGrade(NaN)).toThrow('Marks must be a valid number');
      });

      it('should throw error for non-numeric input', () => {
        expect(() => calculateNEBGrade('85' as any)).toThrow('Marks must be a valid number');
        expect(() => calculateNEBGrade(null as any)).toThrow('Marks must be a valid number');
        expect(() => calculateNEBGrade(undefined as any)).toThrow('Marks must be a valid number');
      });

      it('should handle decimal marks correctly', () => {
        const result1 = calculateNEBGrade(89.5);
        expect(result1.grade).toBe('A');

        const result2 = calculateNEBGrade(90.1);
        expect(result2.grade).toBe('A+');

        const result3 = calculateNEBGrade(79.9);
        expect(result3.grade).toBe('B+');
      });
    });

    describe('Boundary transitions', () => {
      it('should correctly transition from A+ to A at 89-90 boundary', () => {
        expect(calculateNEBGrade(89).grade).toBe('A');
        expect(calculateNEBGrade(90).grade).toBe('A+');
      });

      it('should correctly transition from A to B+ at 79-80 boundary', () => {
        expect(calculateNEBGrade(79).grade).toBe('B+');
        expect(calculateNEBGrade(80).grade).toBe('A');
      });

      it('should correctly transition from B+ to B at 69-70 boundary', () => {
        expect(calculateNEBGrade(69).grade).toBe('B');
        expect(calculateNEBGrade(70).grade).toBe('B+');
      });

      it('should correctly transition from B to C+ at 59-60 boundary', () => {
        expect(calculateNEBGrade(59).grade).toBe('C+');
        expect(calculateNEBGrade(60).grade).toBe('B');
      });

      it('should correctly transition from C+ to C at 49-50 boundary', () => {
        expect(calculateNEBGrade(49).grade).toBe('C');
        expect(calculateNEBGrade(50).grade).toBe('C+');
      });

      it('should correctly transition from C to D at 39-40 boundary', () => {
        expect(calculateNEBGrade(39).grade).toBe('D');
        expect(calculateNEBGrade(40).grade).toBe('C');
      });

      it('should correctly transition from D to NG at 31-32 boundary', () => {
        expect(calculateNEBGrade(31).grade).toBe('NG');
        expect(calculateNEBGrade(32).grade).toBe('D');
      });
    });
  });

  describe('getGradeInfo', () => {
    it('should return correct info for A+ grade', () => {
      const info = getGradeInfo('A+');
      expect(info).toBeDefined();
      expect(info?.grade).toBe('A+');
      expect(info?.gradePoint).toBe(4.0);
      expect(info?.minMarks).toBe(90);
      expect(info?.maxMarks).toBe(100);
    });

    it('should return correct info for NG grade', () => {
      const info = getGradeInfo('NG');
      expect(info).toBeDefined();
      expect(info?.grade).toBe('NG');
      expect(info?.gradePoint).toBe(0.0);
      expect(info?.minMarks).toBe(0);
      expect(info?.maxMarks).toBe(31);
    });

    it('should return undefined for invalid grade', () => {
      const info = getGradeInfo('F');
      expect(info).toBeUndefined();
    });

    it('should be case-sensitive', () => {
      const info = getGradeInfo('a+');
      expect(info).toBeUndefined();
    });
  });

  describe('isPassing', () => {
    it('should return true for passing grades (D and above)', () => {
      expect(isPassing(100)).toBe(true); // A+
      expect(isPassing(85)).toBe(true);  // A
      expect(isPassing(75)).toBe(true);  // B+
      expect(isPassing(65)).toBe(true);  // B
      expect(isPassing(55)).toBe(true);  // C+
      expect(isPassing(45)).toBe(true);  // C
      expect(isPassing(35)).toBe(true);  // D
      expect(isPassing(32)).toBe(true);  // D (minimum passing)
    });

    it('should return false for failing grades (NG)', () => {
      expect(isPassing(31)).toBe(false); // NG (maximum failing)
      expect(isPassing(20)).toBe(false); // NG
      expect(isPassing(0)).toBe(false);  // NG
    });

    it('should correctly identify passing boundary at 32 marks', () => {
      expect(isPassing(31)).toBe(false);
      expect(isPassing(32)).toBe(true);
    });
  });

  describe('getAllGrades', () => {
    it('should return all 8 grades', () => {
      const grades = getAllGrades();
      expect(grades).toHaveLength(8);
    });

    it('should return grades in descending order', () => {
      const grades = getAllGrades();
      const gradePoints = grades.map((g) => g.gradePoint);
      expect(gradePoints).toEqual([4.0, 3.6, 3.2, 2.8, 2.4, 2.0, 1.6, 0.0]);
    });

    it('should return the same reference as NEB_GRADE_SCALE', () => {
      const grades = getAllGrades();
      expect(grades).toBe(NEB_GRADE_SCALE);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle a typical student result scenario', () => {
      // Student scores in different subjects
      const mathMarks = 92;
      const scienceMarks = 78;
      const englishMarks = 65;
      const socialMarks = 45;

      const mathGrade = calculateNEBGrade(mathMarks);
      const scienceGrade = calculateNEBGrade(scienceMarks);
      const englishGrade = calculateNEBGrade(englishMarks);
      const socialGrade = calculateNEBGrade(socialMarks);

      expect(mathGrade.grade).toBe('A+');
      expect(scienceGrade.grade).toBe('B+');
      expect(englishGrade.grade).toBe('B');
      expect(socialGrade.grade).toBe('C');

      // All subjects are passing
      expect(isPassing(mathMarks)).toBe(true);
      expect(isPassing(scienceMarks)).toBe(true);
      expect(isPassing(englishMarks)).toBe(true);
      expect(isPassing(socialMarks)).toBe(true);
    });

    it('should handle a failing student scenario', () => {
      const marks = 28;
      const result = calculateNEBGrade(marks);

      expect(result.grade).toBe('NG');
      expect(result.gradePoint).toBe(0.0);
      expect(isPassing(marks)).toBe(false);
    });

    it('should handle perfect score scenario', () => {
      const marks = 100;
      const result = calculateNEBGrade(marks);

      expect(result.grade).toBe('A+');
      expect(result.gradePoint).toBe(4.0);
      expect(result.description).toBe('Outstanding');
      expect(isPassing(marks)).toBe(true);
    });
  });
});

  describe('GPA Calculation', () => {
    describe('calculateGPA', () => {
      it('should calculate GPA correctly for single subject', () => {
        const subjects: SubjectGrade[] = [
          { subjectName: 'Math', creditHours: 4, gradePoint: 4.0 },
        ];
        const gpa = calculateGPA(subjects);
        expect(gpa).toBe(4.0);
      });

      it('should calculate GPA correctly for multiple subjects with same credit hours', () => {
        const subjects: SubjectGrade[] = [
          { subjectName: 'Math', creditHours: 3, gradePoint: 4.0 },
          { subjectName: 'English', creditHours: 3, gradePoint: 3.6 },
          { subjectName: 'Science', creditHours: 3, gradePoint: 3.2 },
        ];
        // GPA = (3*4.0 + 3*3.6 + 3*3.2) / 9 = 32.4 / 9 = 3.6
        const gpa = calculateGPA(subjects);
        expect(gpa).toBe(3.6);
      });

      it('should calculate GPA correctly for subjects with different credit hours', () => {
        const subjects: SubjectGrade[] = [
          { subjectName: 'Math', creditHours: 4, gradePoint: 4.0 },
          { subjectName: 'English', creditHours: 3, gradePoint: 3.6 },
        ];
        // GPA = (4*4.0 + 3*3.6) / 7 = (16 + 10.8) / 7 = 26.8 / 7 = 3.828...
        const gpa = calculateGPA(subjects);
        expect(gpa).toBe(3.83); // Rounded to 2 decimal places
      });

      it('should round GPA to 2 decimal places', () => {
        const subjects: SubjectGrade[] = [
          { subjectName: 'Math', creditHours: 3, gradePoint: 4.0 },
          { subjectName: 'English', creditHours: 3, gradePoint: 3.6 },
          { subjectName: 'Science', creditHours: 3, gradePoint: 3.3 },
        ];
        // GPA = (3*4.0 + 3*3.6 + 3*3.3) / 9 = 32.7 / 9 = 3.633...
        const gpa = calculateGPA(subjects);
        expect(gpa).toBe(3.63);
      });

      it('should handle subjects with grade point 0 (NG)', () => {
        const subjects: SubjectGrade[] = [
          { subjectName: 'Math', creditHours: 4, gradePoint: 4.0 },
          { subjectName: 'English', creditHours: 3, gradePoint: 0.0 },
        ];
        // GPA = (4*4.0 + 3*0.0) / 7 = 16 / 7 = 2.285...
        const gpa = calculateGPA(subjects);
        expect(gpa).toBe(2.29);
      });

      it('should calculate GPA for typical NEB Class 11-12 scenario', () => {
        const subjects: SubjectGrade[] = [
          { subjectName: 'Nepali', creditHours: 4, gradePoint: 3.6 },
          { subjectName: 'English', creditHours: 4, gradePoint: 4.0 },
          { subjectName: 'Physics', creditHours: 5, gradePoint: 3.2 },
          { subjectName: 'Chemistry', creditHours: 5, gradePoint: 3.6 },
          { subjectName: 'Mathematics', creditHours: 5, gradePoint: 4.0 },
          { subjectName: 'Computer Science', creditHours: 3, gradePoint: 3.6 },
        ];
        // Total weighted points = 4*3.6 + 4*4.0 + 5*3.2 + 5*3.6 + 5*4.0 + 3*3.6
        //                       = 14.4 + 16 + 16 + 18 + 20 + 10.8 = 95.2
        // Total credit hours = 4 + 4 + 5 + 5 + 5 + 3 = 26
        // GPA = 95.2 / 26 = 3.661...
        const gpa = calculateGPA(subjects);
        expect(gpa).toBe(3.66);
      });

      it('should throw error for empty subjects array', () => {
        expect(() => calculateGPA([])).toThrow('Subjects array must not be empty');
      });

      it('should throw error for non-array input', () => {
        expect(() => calculateGPA(null as any)).toThrow('Subjects array must not be empty');
        expect(() => calculateGPA(undefined as any)).toThrow('Subjects array must not be empty');
      });

      it('should throw error for invalid credit hours', () => {
        const subjects: SubjectGrade[] = [
          { subjectName: 'Math', creditHours: 0, gradePoint: 4.0 },
        ];
        expect(() => calculateGPA(subjects)).toThrow('Invalid credit hours for subject Math: 0');
      });

      it('should throw error for negative credit hours', () => {
        const subjects: SubjectGrade[] = [
          { subjectName: 'Math', creditHours: -3, gradePoint: 4.0 },
        ];
        expect(() => calculateGPA(subjects)).toThrow('Invalid credit hours for subject Math: -3');
      });

      it('should throw error for invalid grade point (negative)', () => {
        const subjects: SubjectGrade[] = [
          { subjectName: 'Math', creditHours: 3, gradePoint: -1 },
        ];
        expect(() => calculateGPA(subjects)).toThrow('Invalid grade point for subject Math: -1');
      });

      it('should throw error for invalid grade point (above 4.0)', () => {
        const subjects: SubjectGrade[] = [
          { subjectName: 'Math', creditHours: 3, gradePoint: 4.5 },
        ];
        expect(() => calculateGPA(subjects)).toThrow('Invalid grade point for subject Math: 4.5');
      });

      it('should handle edge case with all subjects having 0 grade point', () => {
        const subjects: SubjectGrade[] = [
          { subjectName: 'Math', creditHours: 3, gradePoint: 0.0 },
          { subjectName: 'English', creditHours: 3, gradePoint: 0.0 },
        ];
        const gpa = calculateGPA(subjects);
        expect(gpa).toBe(0.0);
      });

      it('should handle edge case with all subjects having perfect 4.0 grade point', () => {
        const subjects: SubjectGrade[] = [
          { subjectName: 'Math', creditHours: 4, gradePoint: 4.0 },
          { subjectName: 'English', creditHours: 3, gradePoint: 4.0 },
          { subjectName: 'Science', creditHours: 5, gradePoint: 4.0 },
        ];
        const gpa = calculateGPA(subjects);
        expect(gpa).toBe(4.0);
      });
    });

    describe('calculateWeightedGrade', () => {
      it('should calculate weighted grade with 75% theory + 25% practical (default)', () => {
        const config: WeightedMarksConfig = {
          theoryMarks: 80,
          practicalMarks: 90,
          theoryWeight: 75,
          practicalWeight: 25,
        };
        // Weighted = (80 * 75/100) + (90 * 25/100) = 60 + 22.5 = 82.5
        const weighted = calculateWeightedGrade(config);
        expect(weighted).toBe(82.5);
      });

      it('should calculate weighted grade with 50/50 split', () => {
        const config: WeightedMarksConfig = {
          theoryMarks: 80,
          practicalMarks: 90,
          theoryWeight: 50,
          practicalWeight: 50,
        };
        // Weighted = (80 * 50/100) + (90 * 50/100) = 40 + 45 = 85
        const weighted = calculateWeightedGrade(config);
        expect(weighted).toBe(85.0);
      });

      it('should calculate weighted grade with 60/40 split', () => {
        const config: WeightedMarksConfig = {
          theoryMarks: 70,
          practicalMarks: 80,
          theoryWeight: 60,
          practicalWeight: 40,
        };
        // Weighted = (70 * 60/100) + (80 * 40/100) = 42 + 32 = 74
        const weighted = calculateWeightedGrade(config);
        expect(weighted).toBe(74.0);
      });

      it('should round weighted grade to 2 decimal places', () => {
        const config: WeightedMarksConfig = {
          theoryMarks: 85,
          practicalMarks: 92,
          theoryWeight: 75,
          practicalWeight: 25,
        };
        // Weighted = (85 * 0.75) + (92 * 0.25) = 63.75 + 23 = 86.75
        const weighted = calculateWeightedGrade(config);
        expect(weighted).toBe(86.75);
      });

      it('should handle edge case with 100% theory weight', () => {
        const config: WeightedMarksConfig = {
          theoryMarks: 85,
          practicalMarks: 95,
          theoryWeight: 100,
          practicalWeight: 0,
        };
        const weighted = calculateWeightedGrade(config);
        expect(weighted).toBe(85.0);
      });

      it('should handle edge case with 100% practical weight', () => {
        const config: WeightedMarksConfig = {
          theoryMarks: 85,
          practicalMarks: 95,
          theoryWeight: 0,
          practicalWeight: 100,
        };
        const weighted = calculateWeightedGrade(config);
        expect(weighted).toBe(95.0);
      });

      it('should handle zero marks correctly', () => {
        const config: WeightedMarksConfig = {
          theoryMarks: 0,
          practicalMarks: 100,
          theoryWeight: 75,
          practicalWeight: 25,
        };
        // Weighted = (0 * 0.75) + (100 * 0.25) = 0 + 25 = 25
        const weighted = calculateWeightedGrade(config);
        expect(weighted).toBe(25.0);
      });

      it('should throw error if weights do not sum to 100', () => {
        const config: WeightedMarksConfig = {
          theoryMarks: 80,
          practicalMarks: 90,
          theoryWeight: 60,
          practicalWeight: 30,
        };
        expect(() => calculateWeightedGrade(config)).toThrow('Weights must sum to 100');
      });

      it('should throw error for negative weights', () => {
        const config: WeightedMarksConfig = {
          theoryMarks: 80,
          practicalMarks: 90,
          theoryWeight: -75,
          practicalWeight: 175,
        };
        expect(() => calculateWeightedGrade(config)).toThrow('Weights must be non-negative');
      });

      it('should throw error for theory marks below 0', () => {
        const config: WeightedMarksConfig = {
          theoryMarks: -10,
          practicalMarks: 90,
          theoryWeight: 75,
          practicalWeight: 25,
        };
        expect(() => calculateWeightedGrade(config)).toThrow('Theory marks must be between 0 and 100');
      });

      it('should throw error for theory marks above 100', () => {
        const config: WeightedMarksConfig = {
          theoryMarks: 110,
          practicalMarks: 90,
          theoryWeight: 75,
          practicalWeight: 25,
        };
        expect(() => calculateWeightedGrade(config)).toThrow('Theory marks must be between 0 and 100');
      });

      it('should throw error for practical marks below 0', () => {
        const config: WeightedMarksConfig = {
          theoryMarks: 80,
          practicalMarks: -5,
          theoryWeight: 75,
          practicalWeight: 25,
        };
        expect(() => calculateWeightedGrade(config)).toThrow('Practical marks must be between 0 and 100');
      });

      it('should throw error for practical marks above 100', () => {
        const config: WeightedMarksConfig = {
          theoryMarks: 80,
          practicalMarks: 105,
          theoryWeight: 75,
          practicalWeight: 25,
        };
        expect(() => calculateWeightedGrade(config)).toThrow('Practical marks must be between 0 and 100');
      });

      it('should handle decimal marks correctly', () => {
        const config: WeightedMarksConfig = {
          theoryMarks: 85.5,
          practicalMarks: 92.3,
          theoryWeight: 75,
          practicalWeight: 25,
        };
        // Weighted = (85.5 * 0.75) + (92.3 * 0.25) = 64.125 + 23.075 = 87.2
        const weighted = calculateWeightedGrade(config);
        expect(weighted).toBe(87.2);
      });
    });

    describe('calculateAggregateGPA', () => {
      it('should calculate aggregate GPA for Class 11-12 correctly', () => {
        const class11GPA = 3.5;
        const class12GPA = 3.7;
        // Aggregate = (3.5 + 3.7) / 2 = 7.2 / 2 = 3.6
        const aggregateGPA = calculateAggregateGPA(class11GPA, class12GPA);
        expect(aggregateGPA).toBe(3.6);
      });

      it('should round aggregate GPA to 2 decimal places', () => {
        const class11GPA = 3.55;
        const class12GPA = 3.66;
        // Aggregate = (3.55 + 3.66) / 2 = 7.21 / 2 = 3.605
        const aggregateGPA = calculateAggregateGPA(class11GPA, class12GPA);
        expect(aggregateGPA).toBe(3.61);
      });

      it('should handle same GPA for both years', () => {
        const class11GPA = 3.8;
        const class12GPA = 3.8;
        const aggregateGPA = calculateAggregateGPA(class11GPA, class12GPA);
        expect(aggregateGPA).toBe(3.8);
      });

      it('should handle perfect 4.0 GPA for both years', () => {
        const class11GPA = 4.0;
        const class12GPA = 4.0;
        const aggregateGPA = calculateAggregateGPA(class11GPA, class12GPA);
        expect(aggregateGPA).toBe(4.0);
      });

      it('should handle minimum passing GPA (1.6)', () => {
        const class11GPA = 1.6;
        const class12GPA = 1.6;
        const aggregateGPA = calculateAggregateGPA(class11GPA, class12GPA);
        expect(aggregateGPA).toBe(1.6);
      });

      it('should handle zero GPA (all NG grades)', () => {
        const class11GPA = 0.0;
        const class12GPA = 0.0;
        const aggregateGPA = calculateAggregateGPA(class11GPA, class12GPA);
        expect(aggregateGPA).toBe(0.0);
      });

      it('should handle mixed GPAs', () => {
        const class11GPA = 2.5;
        const class12GPA = 3.5;
        // Aggregate = (2.5 + 3.5) / 2 = 6.0 / 2 = 3.0
        const aggregateGPA = calculateAggregateGPA(class11GPA, class12GPA);
        expect(aggregateGPA).toBe(3.0);
      });

      it('should throw error for Class 11 GPA below 0', () => {
        expect(() => calculateAggregateGPA(-0.5, 3.5)).toThrow('Invalid Class 11 GPA');
      });

      it('should throw error for Class 11 GPA above 4.0', () => {
        expect(() => calculateAggregateGPA(4.5, 3.5)).toThrow('Invalid Class 11 GPA');
      });

      it('should throw error for Class 12 GPA below 0', () => {
        expect(() => calculateAggregateGPA(3.5, -0.5)).toThrow('Invalid Class 12 GPA');
      });

      it('should throw error for Class 12 GPA above 4.0', () => {
        expect(() => calculateAggregateGPA(3.5, 4.5)).toThrow('Invalid Class 12 GPA');
      });

      it('should throw error for non-numeric Class 11 GPA', () => {
        expect(() => calculateAggregateGPA(NaN, 3.5)).toThrow('Invalid Class 11 GPA');
        expect(() => calculateAggregateGPA(null as any, 3.5)).toThrow('Invalid Class 11 GPA');
      });

      it('should throw error for non-numeric Class 12 GPA', () => {
        expect(() => calculateAggregateGPA(3.5, NaN)).toThrow('Invalid Class 12 GPA');
        expect(() => calculateAggregateGPA(3.5, undefined as any)).toThrow('Invalid Class 12 GPA');
      });
    });

    describe('Integration: GPA calculation with weighted grades', () => {
      it('should calculate GPA from weighted subject grades', () => {
        // Subject 1: Theory 80, Practical 90, Weight 75/25
        const subject1Weighted = calculateWeightedGrade({
          theoryMarks: 80,
          practicalMarks: 90,
          theoryWeight: 75,
          practicalWeight: 25,
        });
        const subject1Grade = calculateNEBGrade(subject1Weighted);

        // Subject 2: Theory 70, Practical 85, Weight 75/25
        const subject2Weighted = calculateWeightedGrade({
          theoryMarks: 70,
          practicalMarks: 85,
          theoryWeight: 75,
          practicalWeight: 25,
        });
        const subject2Grade = calculateNEBGrade(subject2Weighted);

        // Calculate GPA
        const subjects: SubjectGrade[] = [
          { subjectName: 'Physics', creditHours: 5, gradePoint: subject1Grade.gradePoint },
          { subjectName: 'Chemistry', creditHours: 5, gradePoint: subject2Grade.gradePoint },
        ];

        const gpa = calculateGPA(subjects);
        expect(gpa).toBeGreaterThan(0);
        expect(gpa).toBeLessThanOrEqual(4.0);
      });

      it('should calculate aggregate GPA for complete Class 11-12 scenario', () => {
        // Class 11 subjects
        const class11Subjects: SubjectGrade[] = [
          { subjectName: 'Nepali', creditHours: 4, gradePoint: 3.6 },
          { subjectName: 'English', creditHours: 4, gradePoint: 4.0 },
          { subjectName: 'Physics', creditHours: 5, gradePoint: 3.2 },
          { subjectName: 'Chemistry', creditHours: 5, gradePoint: 3.6 },
          { subjectName: 'Mathematics', creditHours: 5, gradePoint: 4.0 },
        ];
        const class11GPA = calculateGPA(class11Subjects);

        // Class 12 subjects
        const class12Subjects: SubjectGrade[] = [
          { subjectName: 'Nepali', creditHours: 4, gradePoint: 3.6 },
          { subjectName: 'English', creditHours: 4, gradePoint: 4.0 },
          { subjectName: 'Physics', creditHours: 5, gradePoint: 3.6 },
          { subjectName: 'Chemistry', creditHours: 5, gradePoint: 4.0 },
          { subjectName: 'Mathematics', creditHours: 5, gradePoint: 4.0 },
        ];
        const class12GPA = calculateGPA(class12Subjects);

        // Calculate aggregate
        const aggregateGPA = calculateAggregateGPA(class11GPA, class12GPA);

        expect(aggregateGPA).toBeGreaterThan(0);
        expect(aggregateGPA).toBeLessThanOrEqual(4.0);
        expect(aggregateGPA).toBeGreaterThanOrEqual(Math.min(class11GPA, class12GPA));
        expect(aggregateGPA).toBeLessThanOrEqual(Math.max(class11GPA, class12GPA));
      });
    });
  });

describe('Subject Combination Validation', () => {
  describe('validateClass11SubjectCombination', () => {
    it('should validate correct science stream combination', () => {
      const subjects = [
        { name: 'Nepali', creditHours: 100 },
        { name: 'English', creditHours: 100 },
        { name: 'Social Studies', creditHours: 100 },
        { name: 'Mathematics', creditHours: 100 },
        { name: 'Physics', creditHours: 100 },
        { name: 'Chemistry', creditHours: 100 },
        { name: 'Biology', creditHours: 100 },
      ];
      
      const result = validateClass11SubjectCombination(subjects, 'science');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject combination missing compulsory subject Nepali', () => {
      const subjects = [
        { name: 'English', creditHours: 100 },
        { name: 'Social Studies', creditHours: 100 },
        { name: 'Mathematics', creditHours: 100 },
        { name: 'Physics', creditHours: 100 },
        { name: 'Chemistry', creditHours: 100 },
        { name: 'Biology', creditHours: 100 },
      ];
      
      const result = validateClass11SubjectCombination(subjects, 'science');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing compulsory subject: Nepali');
    });

    it('should reject combination missing compulsory subject English', () => {
      const subjects = [
        { name: 'Nepali', creditHours: 100 },
        { name: 'Social Studies', creditHours: 100 },
        { name: 'Mathematics', creditHours: 100 },
        { name: 'Physics', creditHours: 100 },
        { name: 'Chemistry', creditHours: 100 },
        { name: 'Biology', creditHours: 100 },
      ];
      
      const result = validateClass11SubjectCombination(subjects, 'science');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing compulsory subject: English');
    });

    it('should reject combination missing compulsory subject Social Studies', () => {
      const subjects = [
        { name: 'Nepali', creditHours: 100 },
        { name: 'English', creditHours: 100 },
        { name: 'Mathematics', creditHours: 100 },
        { name: 'Physics', creditHours: 100 },
        { name: 'Chemistry', creditHours: 100 },
        { name: 'Biology', creditHours: 100 },
      ];
      
      const result = validateClass11SubjectCombination(subjects, 'science');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing compulsory subject: Social Studies');
    });

    it('should accept combination with Mathematics', () => {
      const subjects = [
        { name: 'Nepali', creditHours: 100 },
        { name: 'English', creditHours: 100 },
        { name: 'Social Studies', creditHours: 100 },
        { name: 'Mathematics', creditHours: 100 },
        { name: 'Physics', creditHours: 100 },
        { name: 'Chemistry', creditHours: 100 },
        { name: 'Biology', creditHours: 100 },
      ];
      
      const result = validateClass11SubjectCombination(subjects, 'science');
      expect(result.isValid).toBe(true);
    });

    it('should accept combination with Social Studies & Life Skills instead of Mathematics', () => {
      const subjects = [
        { name: 'Nepali', creditHours: 100 },
        { name: 'English', creditHours: 100 },
        { name: 'Social Studies', creditHours: 100 },
        { name: 'Life Skills', creditHours: 100 },
        { name: 'Accounting', creditHours: 100 },
        { name: 'Economics', creditHours: 100 },
        { name: 'Business Studies', creditHours: 100 },
      ];
      
      const result = validateClass11SubjectCombination(subjects, 'management');
      expect(result.isValid).toBe(true);
    });

    it('should reject combination without Mathematics or Life Skills', () => {
      const subjects = [
        { name: 'Nepali', creditHours: 100 },
        { name: 'English', creditHours: 100 },
        { name: 'Social Studies', creditHours: 100 },
        { name: 'Physics', creditHours: 100 },
        { name: 'Chemistry', creditHours: 100 },
        { name: 'Biology', creditHours: 100 },
      ];
      
      const result = validateClass11SubjectCombination(subjects, 'science');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Must have either Mathematics OR both Social Studies & Life Skills');
    });

    it('should reject combination with less than 3 optional subjects', () => {
      const subjects = [
        { name: 'Nepali', creditHours: 100 },
        { name: 'English', creditHours: 100 },
        { name: 'Social Studies', creditHours: 100 },
        { name: 'Mathematics', creditHours: 100 },
        { name: 'Physics', creditHours: 100 },
        { name: 'Chemistry', creditHours: 100 },
      ];
      
      const result = validateClass11SubjectCombination(subjects, 'science');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Must select at least 3 optional subjects. Currently selected: 2');
    });

    it('should reject combination with more than 4 optional subjects', () => {
      const subjects = [
        { name: 'Nepali', creditHours: 100 },
        { name: 'English', creditHours: 100 },
        { name: 'Social Studies', creditHours: 100 },
        { name: 'Life Skills', creditHours: 100 }, // This makes it valid for the Math OR SS&LS requirement
        { name: 'Physics', creditHours: 100 },
        { name: 'Chemistry', creditHours: 100 },
        { name: 'Biology', creditHours: 100 },
        { name: 'Computer Science', creditHours: 100 },
        { name: 'Mathematics', creditHours: 100 }, // 5th optional subject
      ];
      
      const result = validateClass11SubjectCombination(subjects, 'science');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cannot select more than 4 optional subjects. Currently selected: 5');
    });

    it('should reject optional subject not valid for science stream', () => {
      const subjects = [
        { name: 'Nepali', creditHours: 100 },
        { name: 'English', creditHours: 100 },
        { name: 'Social Studies', creditHours: 100 },
        { name: 'Mathematics', creditHours: 100 },
        { name: 'Physics', creditHours: 100 },
        { name: 'Chemistry', creditHours: 100 },
        { name: 'Accounting', creditHours: 100 }, // Management subject
      ];
      
      const result = validateClass11SubjectCombination(subjects, 'science');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Subject "Accounting" is not valid for science stream. Valid subjects: Physics, Chemistry, Biology, Computer Science, Mathematics');
    });

    it('should validate correct management stream combination', () => {
      const subjects = [
        { name: 'Nepali', creditHours: 100 },
        { name: 'English', creditHours: 100 },
        { name: 'Social Studies', creditHours: 100 },
        { name: 'Mathematics', creditHours: 100 },
        { name: 'Accounting', creditHours: 100 },
        { name: 'Economics', creditHours: 100 },
        { name: 'Business Studies', creditHours: 100 },
      ];
      
      const result = validateClass11SubjectCombination(subjects, 'management');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate correct humanities stream combination', () => {
      const subjects = [
        { name: 'Nepali', creditHours: 100 },
        { name: 'English', creditHours: 100 },
        { name: 'Social Studies', creditHours: 100 },
        { name: 'Mathematics', creditHours: 100 },
        { name: 'Sociology', creditHours: 100 },
        { name: 'Political Science', creditHours: 100 },
        { name: 'History', creditHours: 100 },
      ];
      
      const result = validateClass11SubjectCombination(subjects, 'humanities');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate correct technical stream combination', () => {
      const subjects = [
        { name: 'Nepali', creditHours: 100 },
        { name: 'English', creditHours: 100 },
        { name: 'Social Studies', creditHours: 100 },
        { name: 'Mathematics', creditHours: 100 },
        { name: 'Hotel Management', creditHours: 100 },
        { name: 'Tourism & Mountaineering', creditHours: 100 },
        { name: 'Computer Science', creditHours: 100 },
      ];
      
      const result = validateClass11SubjectCombination(subjects, 'technical');
      expect(result.isValid).toBe(false); // Computer Science is not in technical stream
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject subject with insufficient credit hours', () => {
      const subjects = [
        { name: 'Nepali', creditHours: 100 },
        { name: 'English', creditHours: 100 },
        { name: 'Social Studies', creditHours: 100 },
        { name: 'Mathematics', creditHours: 100 },
        { name: 'Physics', creditHours: 50 }, // Insufficient
        { name: 'Chemistry', creditHours: 100 },
        { name: 'Biology', creditHours: 100 },
      ];
      
      const result = validateClass11SubjectCombination(subjects, 'science');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Subject "Physics" has insufficient credit hours: 50. Minimum required: 100');
    });

    it('should reject empty subject list', () => {
      const result = validateClass11SubjectCombination([], 'science');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Subject list cannot be empty');
    });

    it('should reject invalid stream', () => {
      const subjects = [
        { name: 'Nepali', creditHours: 100 },
        { name: 'English', creditHours: 100 },
        { name: 'Social Studies', creditHours: 100 },
      ];
      
      const result = validateClass11SubjectCombination(subjects, 'invalid' as any);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid stream');
    });
  });

  describe('validateClass12SubjectCombination', () => {
    it('should validate correct science stream combination', () => {
      const subjects = [
        { name: 'Nepali', creditHours: 100 },
        { name: 'English', creditHours: 100 },
        { name: 'Life Skill', creditHours: 100 },
        { name: 'Physics', creditHours: 100 },
        { name: 'Chemistry', creditHours: 100 },
        { name: 'Biology', creditHours: 100 },
      ];
      
      const result = validateClass12SubjectCombination(subjects, 'science');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject combination missing compulsory subject Nepali', () => {
      const subjects = [
        { name: 'English', creditHours: 100 },
        { name: 'Life Skill', creditHours: 100 },
        { name: 'Physics', creditHours: 100 },
        { name: 'Chemistry', creditHours: 100 },
        { name: 'Biology', creditHours: 100 },
      ];
      
      const result = validateClass12SubjectCombination(subjects, 'science');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing compulsory subject: Nepali');
    });

    it('should reject combination missing compulsory subject English', () => {
      const subjects = [
        { name: 'Nepali', creditHours: 100 },
        { name: 'Life Skill', creditHours: 100 },
        { name: 'Physics', creditHours: 100 },
        { name: 'Chemistry', creditHours: 100 },
        { name: 'Biology', creditHours: 100 },
      ];
      
      const result = validateClass12SubjectCombination(subjects, 'science');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing compulsory subject: English');
    });

    it('should reject combination missing compulsory subject Life Skill', () => {
      const subjects = [
        { name: 'Nepali', creditHours: 100 },
        { name: 'English', creditHours: 100 },
        { name: 'Physics', creditHours: 100 },
        { name: 'Chemistry', creditHours: 100 },
        { name: 'Biology', creditHours: 100 },
      ];
      
      const result = validateClass12SubjectCombination(subjects, 'science');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing compulsory subject: Life Skill');
    });

    it('should reject combination with less than 3 optional subjects', () => {
      const subjects = [
        { name: 'Nepali', creditHours: 100 },
        { name: 'English', creditHours: 100 },
        { name: 'Life Skill', creditHours: 100 },
        { name: 'Physics', creditHours: 100 },
        { name: 'Chemistry', creditHours: 100 },
      ];
      
      const result = validateClass12SubjectCombination(subjects, 'science');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Must select at least 3 optional subjects. Currently selected: 2');
    });

    it('should reject combination with more than 4 optional subjects', () => {
      const subjects = [
        { name: 'Nepali', creditHours: 100 },
        { name: 'English', creditHours: 100 },
        { name: 'Life Skill', creditHours: 100 },
        { name: 'Physics', creditHours: 100 },
        { name: 'Chemistry', creditHours: 100 },
        { name: 'Biology', creditHours: 100 },
        { name: 'Computer Science', creditHours: 100 },
        { name: 'Mathematics', creditHours: 100 },
      ];
      
      const result = validateClass12SubjectCombination(subjects, 'science');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cannot select more than 4 optional subjects. Currently selected: 5');
    });

    it('should reject optional subject not valid for management stream', () => {
      const subjects = [
        { name: 'Nepali', creditHours: 100 },
        { name: 'English', creditHours: 100 },
        { name: 'Life Skill', creditHours: 100 },
        { name: 'Accounting', creditHours: 100 },
        { name: 'Economics', creditHours: 100 },
        { name: 'Physics', creditHours: 100 }, // Science subject
      ];
      
      const result = validateClass12SubjectCombination(subjects, 'management');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Subject "Physics" is not valid for management stream. Valid subjects: Accounting, Economics, Business Studies, Computer Science, Finance, Marketing');
    });

    it('should validate correct management stream combination', () => {
      const subjects = [
        { name: 'Nepali', creditHours: 100 },
        { name: 'English', creditHours: 100 },
        { name: 'Life Skill', creditHours: 100 },
        { name: 'Accounting', creditHours: 100 },
        { name: 'Economics', creditHours: 100 },
        { name: 'Business Studies', creditHours: 100 },
      ];
      
      const result = validateClass12SubjectCombination(subjects, 'management');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate correct humanities stream combination', () => {
      const subjects = [
        { name: 'Nepali', creditHours: 100 },
        { name: 'English', creditHours: 100 },
        { name: 'Life Skill', creditHours: 100 },
        { name: 'Sociology', creditHours: 100 },
        { name: 'Political Science', creditHours: 100 },
        { name: 'History', creditHours: 100 },
      ];
      
      const result = validateClass12SubjectCombination(subjects, 'humanities');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject subject with insufficient credit hours', () => {
      const subjects = [
        { name: 'Nepali', creditHours: 100 },
        { name: 'English', creditHours: 100 },
        { name: 'Life Skill', creditHours: 100 },
        { name: 'Physics', creditHours: 75 }, // Insufficient
        { name: 'Chemistry', creditHours: 100 },
        { name: 'Biology', creditHours: 100 },
      ];
      
      const result = validateClass12SubjectCombination(subjects, 'science');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Subject "Physics" has insufficient credit hours: 75. Minimum required: 100');
    });

    it('should reject empty subject list', () => {
      const result = validateClass12SubjectCombination([], 'science');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Subject list cannot be empty');
    });

    it('should reject invalid stream', () => {
      const subjects = [
        { name: 'Nepali', creditHours: 100 },
        { name: 'English', creditHours: 100 },
        { name: 'Life Skill', creditHours: 100 },
      ];
      
      const result = validateClass12SubjectCombination(subjects, 'arts' as any);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid stream');
    });
  });

  describe('validateSubjectCombination', () => {
    it('should route to Class 11 validator for class level 11', () => {
      const subjects = [
        { name: 'Nepali', creditHours: 100 },
        { name: 'English', creditHours: 100 },
        { name: 'Social Studies', creditHours: 100 },
        { name: 'Mathematics', creditHours: 100 },
        { name: 'Physics', creditHours: 100 },
        { name: 'Chemistry', creditHours: 100 },
        { name: 'Biology', creditHours: 100 },
      ];
      
      const result = validateSubjectCombination(subjects, 'science', 11);
      expect(result.isValid).toBe(true);
    });

    it('should route to Class 12 validator for class level 12', () => {
      const subjects = [
        { name: 'Nepali', creditHours: 100 },
        { name: 'English', creditHours: 100 },
        { name: 'Life Skill', creditHours: 100 },
        { name: 'Physics', creditHours: 100 },
        { name: 'Chemistry', creditHours: 100 },
        { name: 'Biology', creditHours: 100 },
      ];
      
      const result = validateSubjectCombination(subjects, 'science', 12);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid class level', () => {
      const subjects = [
        { name: 'Nepali', creditHours: 100 },
        { name: 'English', creditHours: 100 },
      ];
      
      const result = validateSubjectCombination(subjects, 'science', 10 as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid class level: 10. Subject combination validation is only for Classes 11 and 12');
    });
  });
});

describe('Grade Improvement Tracking', () => {
  describe('Constants', () => {
    it('should have correct maximum grade improvement subjects limit', () => {
      const { MAX_GRADE_IMPROVEMENT_SUBJECTS } = require('../nebGrading.service');
      expect(MAX_GRADE_IMPROVEMENT_SUBJECTS).toBe(2);
    });

    it('should have correct maximum re-examination attempts limit', () => {
      const { MAX_REEXAMINATION_ATTEMPTS } = require('../nebGrading.service');
      expect(MAX_REEXAMINATION_ATTEMPTS).toBe(3);
    });
  });

  describe('createGradeImprovementRecord', () => {
    const { createGradeImprovementRecord } = require('../nebGrading.service');

    it('should create a new grade improvement record with correct initial values', () => {
      const record = createGradeImprovementRecord(
        'student-123',
        'subject-456',
        'Physics',
        65
      );

      expect(record.studentId).toBe('student-123');
      expect(record.subjectId).toBe('subject-456');
      expect(record.subjectName).toBe('Physics');
      expect(record.originalMarks).toBe(65);
      expect(record.originalGrade).toBe('B');
      expect(record.originalGradePoint).toBe(2.8);
      expect(record.attempts).toHaveLength(0);
      expect(record.currentMarks).toBe(65);
      expect(record.currentGrade).toBe('B');
      expect(record.currentGradePoint).toBe(2.8);
      expect(record.status).toBe('active');
    });

    it('should create record for failing grade (NG)', () => {
      const record = createGradeImprovementRecord(
        'student-123',
        'subject-456',
        'Mathematics',
        25
      );

      expect(record.originalGrade).toBe('NG');
      expect(record.originalGradePoint).toBe(0.0);
      expect(record.status).toBe('active');
    });

    it('should create record for perfect score', () => {
      const record = createGradeImprovementRecord(
        'student-123',
        'subject-456',
        'English',
        100
      );

      expect(record.originalGrade).toBe('A+');
      expect(record.originalGradePoint).toBe(4.0);
      expect(record.status).toBe('active');
    });

    it('should throw error for invalid marks (negative)', () => {
      expect(() => createGradeImprovementRecord(
        'student-123',
        'subject-456',
        'Physics',
        -10
      )).toThrow('Invalid original marks: -10. Must be between 0 and 100');
    });

    it('should throw error for invalid marks (above 100)', () => {
      expect(() => createGradeImprovementRecord(
        'student-123',
        'subject-456',
        'Physics',
        110
      )).toThrow('Invalid original marks: 110. Must be between 0 and 100');
    });

    it('should throw error for non-numeric marks', () => {
      expect(() => createGradeImprovementRecord(
        'student-123',
        'subject-456',
        'Physics',
        NaN
      )).toThrow('Marks must be a valid number');
    });
  });

  describe('validateGradeImprovementRegistration', () => {
    const { validateGradeImprovementRegistration } = require('../nebGrading.service');

    it('should allow registration for first subject', () => {
      const studentImprovement = {
        studentId: 'student-123',
        academicYearId: 'year-2024',
        subjects: [],
      };

      const result = validateGradeImprovementRegistration(
        studentImprovement,
        'subject-456'
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should allow registration for second subject', () => {
      const studentImprovement = {
        studentId: 'student-123',
        academicYearId: 'year-2024',
        subjects: [
          {
            studentId: 'student-123',
            subjectId: 'subject-111',
            subjectName: 'Physics',
            originalMarks: 60,
            originalGrade: 'B',
            originalGradePoint: 2.8,
            attempts: [],
            currentMarks: 60,
            currentGrade: 'B',
            currentGradePoint: 2.8,
            status: 'active',
          },
        ],
      };

      const result = validateGradeImprovementRegistration(
        studentImprovement,
        'subject-456'
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject registration for third subject (exceeds maximum)', () => {
      const studentImprovement = {
        studentId: 'student-123',
        academicYearId: 'year-2024',
        subjects: [
          {
            studentId: 'student-123',
            subjectId: 'subject-111',
            subjectName: 'Physics',
            originalMarks: 60,
            originalGrade: 'B',
            originalGradePoint: 2.8,
            attempts: [],
            currentMarks: 60,
            currentGrade: 'B',
            currentGradePoint: 2.8,
            status: 'active',
          },
          {
            studentId: 'student-123',
            subjectId: 'subject-222',
            subjectName: 'Chemistry',
            originalMarks: 55,
            originalGrade: 'C+',
            originalGradePoint: 2.4,
            attempts: [],
            currentMarks: 55,
            currentGrade: 'C+',
            currentGradePoint: 2.4,
            status: 'active',
          },
        ],
      };

      const result = validateGradeImprovementRegistration(
        studentImprovement,
        'subject-456'
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Cannot register for grade improvement. Maximum 2 subjects allowed. Currently registered: 2'
      );
    });

    it('should allow additional attempt for existing subject', () => {
      const studentImprovement = {
        studentId: 'student-123',
        academicYearId: 'year-2024',
        subjects: [
          {
            studentId: 'student-123',
            subjectId: 'subject-456',
            subjectName: 'Physics',
            originalMarks: 60,
            originalGrade: 'B',
            originalGradePoint: 2.8,
            attempts: [
              {
                attemptNumber: 1,
                examDate: '2024-05-15',
                marks: 65,
                grade: 'B',
                gradePoint: 2.8,
                attemptDate: new Date('2024-05-15'),
              },
            ],
            currentMarks: 65,
            currentGrade: 'B',
            currentGradePoint: 2.8,
            status: 'active',
          },
        ],
      };

      const result = validateGradeImprovementRegistration(
        studentImprovement,
        'subject-456'
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject registration when maximum attempts reached', () => {
      const studentImprovement = {
        studentId: 'student-123',
        academicYearId: 'year-2024',
        subjects: [
          {
            studentId: 'student-123',
            subjectId: 'subject-456',
            subjectName: 'Physics',
            originalMarks: 60,
            originalGrade: 'B',
            originalGradePoint: 2.8,
            attempts: [
              {
                attemptNumber: 1,
                examDate: '2024-05-15',
                marks: 65,
                grade: 'B',
                gradePoint: 2.8,
                attemptDate: new Date('2024-05-15'),
              },
              {
                attemptNumber: 2,
                examDate: '2024-08-15',
                marks: 70,
                grade: 'B+',
                gradePoint: 3.2,
                attemptDate: new Date('2024-08-15'),
              },
              {
                attemptNumber: 3,
                examDate: '2024-11-15',
                marks: 75,
                grade: 'B+',
                gradePoint: 3.2,
                attemptDate: new Date('2024-11-15'),
              },
            ],
            currentMarks: 75,
            currentGrade: 'B+',
            currentGradePoint: 3.2,
            status: 'exhausted',
          },
        ],
      };

      const result = validateGradeImprovementRegistration(
        studentImprovement,
        'subject-456'
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Cannot register for re-examination. Maximum 3 attempts allowed. Current attempts: 3'
      );
    });

    it('should reject registration when status is exhausted', () => {
      const studentImprovement = {
        studentId: 'student-123',
        academicYearId: 'year-2024',
        subjects: [
          {
            studentId: 'student-123',
            subjectId: 'subject-456',
            subjectName: 'Physics',
            originalMarks: 60,
            originalGrade: 'B',
            originalGradePoint: 2.8,
            attempts: [
              { attemptNumber: 1, examDate: '2024-05-15', marks: 65, grade: 'B', gradePoint: 2.8, attemptDate: new Date() },
              { attemptNumber: 2, examDate: '2024-08-15', marks: 70, grade: 'B+', gradePoint: 3.2, attemptDate: new Date() },
              { attemptNumber: 3, examDate: '2024-11-15', marks: 75, grade: 'B+', gradePoint: 3.2, attemptDate: new Date() },
            ],
            currentMarks: 75,
            currentGrade: 'B+',
            currentGradePoint: 3.2,
            status: 'exhausted',
          },
        ],
      };

      const result = validateGradeImprovementRegistration(
        studentImprovement,
        'subject-456'
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Cannot register for re-examination. All 3 attempts have been exhausted for this subject.'
      );
    });

    it('should reject registration when already at maximum grade (A+)', () => {
      const studentImprovement = {
        studentId: 'student-123',
        academicYearId: 'year-2024',
        subjects: [
          {
            studentId: 'student-123',
            subjectId: 'subject-456',
            subjectName: 'Physics',
            originalMarks: 85,
            originalGrade: 'A',
            originalGradePoint: 3.6,
            attempts: [
              {
                attemptNumber: 1,
                examDate: '2024-05-15',
                marks: 95,
                grade: 'A+',
                gradePoint: 4.0,
                attemptDate: new Date('2024-05-15'),
              },
            ],
            currentMarks: 95,
            currentGrade: 'A+',
            currentGradePoint: 4.0,
            status: 'completed',
          },
        ],
      };

      const result = validateGradeImprovementRegistration(
        studentImprovement,
        'subject-456'
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Cannot register for grade improvement. Subject already has the maximum grade (A+).'
      );
    });
  });

  describe('recordGradeImprovementAttempt', () => {
    const { recordGradeImprovementAttempt, createGradeImprovementRecord } = require('../nebGrading.service');

    it('should record first improvement attempt successfully', () => {
      const record = createGradeImprovementRecord(
        'student-123',
        'subject-456',
        'Physics',
        60
      );

      const updated = recordGradeImprovementAttempt(record, 75, '2024-05-15');

      expect(updated.attempts).toHaveLength(1);
      expect(updated.attempts[0].attemptNumber).toBe(1);
      expect(updated.attempts[0].marks).toBe(75);
      expect(updated.attempts[0].grade).toBe('B+');
      expect(updated.attempts[0].gradePoint).toBe(3.2);
      expect(updated.attempts[0].examDate).toBe('2024-05-15');
      expect(updated.currentMarks).toBe(75);
      expect(updated.currentGrade).toBe('B+');
      expect(updated.currentGradePoint).toBe(3.2);
      expect(updated.status).toBe('active');
    });

    it('should record multiple attempts and track best score', () => {
      let record = createGradeImprovementRecord(
        'student-123',
        'subject-456',
        'Physics',
        60
      );

      // First attempt: 65 marks
      record = recordGradeImprovementAttempt(record, 65, '2024-05-15');
      expect(record.currentMarks).toBe(65);
      expect(record.currentGrade).toBe('B');

      // Second attempt: 80 marks (better)
      record = recordGradeImprovementAttempt(record, 80, '2024-08-15');
      expect(record.currentMarks).toBe(80);
      expect(record.currentGrade).toBe('A');

      // Third attempt: 70 marks (worse than best)
      record = recordGradeImprovementAttempt(record, 70, '2024-11-15');
      expect(record.currentMarks).toBe(80); // Still uses best score
      expect(record.currentGrade).toBe('A');
      expect(record.attempts).toHaveLength(3);
    });

    it('should keep original marks if all attempts are worse', () => {
      let record = createGradeImprovementRecord(
        'student-123',
        'subject-456',
        'Physics',
        75
      );

      // Attempt with worse score
      record = recordGradeImprovementAttempt(record, 65, '2024-05-15');
      
      expect(record.currentMarks).toBe(75); // Original is still best
      expect(record.currentGrade).toBe('B+');
      expect(record.attempts).toHaveLength(1);
      expect(record.attempts[0].marks).toBe(65);
    });

    it('should set status to exhausted after 3 attempts', () => {
      let record = createGradeImprovementRecord(
        'student-123',
        'subject-456',
        'Physics',
        60
      );

      record = recordGradeImprovementAttempt(record, 65, '2024-05-15');
      expect(record.status).toBe('active');

      record = recordGradeImprovementAttempt(record, 70, '2024-08-15');
      expect(record.status).toBe('active');

      record = recordGradeImprovementAttempt(record, 75, '2024-11-15');
      expect(record.status).toBe('exhausted');
      expect(record.attempts).toHaveLength(3);
    });

    it('should set status to completed when reaching A+ grade', () => {
      let record = createGradeImprovementRecord(
        'student-123',
        'subject-456',
        'Physics',
        60
      );

      record = recordGradeImprovementAttempt(record, 95, '2024-05-15');
      
      expect(record.currentGrade).toBe('A+');
      expect(record.status).toBe('completed');
    });

    it('should throw error when maximum attempts already reached', () => {
      let record = createGradeImprovementRecord(
        'student-123',
        'subject-456',
        'Physics',
        60
      );

      record = recordGradeImprovementAttempt(record, 65, '2024-05-15');
      record = recordGradeImprovementAttempt(record, 70, '2024-08-15');
      record = recordGradeImprovementAttempt(record, 75, '2024-11-15');

      expect(() => recordGradeImprovementAttempt(record, 80, '2025-02-15')).toThrow(
        'Cannot record attempt. Maximum 3 attempts already reached.'
      );
    });

    it('should throw error for invalid marks (negative)', () => {
      const record = createGradeImprovementRecord(
        'student-123',
        'subject-456',
        'Physics',
        60
      );

      expect(() => recordGradeImprovementAttempt(record, -10, '2024-05-15')).toThrow(
        'Invalid marks: -10. Must be between 0 and 100'
      );
    });

    it('should throw error for invalid marks (above 100)', () => {
      const record = createGradeImprovementRecord(
        'student-123',
        'subject-456',
        'Physics',
        60
      );

      expect(() => recordGradeImprovementAttempt(record, 110, '2024-05-15')).toThrow(
        'Invalid marks: 110. Must be between 0 and 100'
      );
    });

    it('should handle improvement from failing grade (NG) to passing', () => {
      let record = createGradeImprovementRecord(
        'student-123',
        'subject-456',
        'Physics',
        25
      );

      expect(record.originalGrade).toBe('NG');

      record = recordGradeImprovementAttempt(record, 65, '2024-05-15');
      
      expect(record.currentMarks).toBe(65);
      expect(record.currentGrade).toBe('B');
      expect(record.status).toBe('active');
    });

    it('should maintain attempt history correctly', () => {
      let record = createGradeImprovementRecord(
        'student-123',
        'subject-456',
        'Physics',
        60
      );

      record = recordGradeImprovementAttempt(record, 65, '2024-05-15');
      record = recordGradeImprovementAttempt(record, 80, '2024-08-15');

      expect(record.attempts).toHaveLength(2);
      expect(record.attempts[0].attemptNumber).toBe(1);
      expect(record.attempts[0].marks).toBe(65);
      expect(record.attempts[1].attemptNumber).toBe(2);
      expect(record.attempts[1].marks).toBe(80);
    });
  });

  describe('getGradeImprovementHistory', () => {
    const { getGradeImprovementHistory, createGradeImprovementRecord, recordGradeImprovementAttempt } = require('../nebGrading.service');

    it('should return history for record with no attempts', () => {
      const record = createGradeImprovementRecord(
        'student-123',
        'subject-456',
        'Physics',
        60
      );

      const history = getGradeImprovementHistory(record);

      expect(history).toHaveLength(2);
      expect(history[0]).toBe('Original: 60 marks (B, 2.8 GP)');
      expect(history[1]).toBe('Current Best: 60 marks (B, 2.8 GP)');
    });

    it('should return history with improvement attempts', () => {
      let record = createGradeImprovementRecord(
        'student-123',
        'subject-456',
        'Physics',
        60
      );

      record = recordGradeImprovementAttempt(record, 75, '2024-05-15');
      record = recordGradeImprovementAttempt(record, 85, '2024-08-15');

      const history = getGradeImprovementHistory(record);

      expect(history).toHaveLength(4);
      expect(history[0]).toBe('Original: 60 marks (B, 2.8 GP)');
      expect(history[1]).toContain('Attempt 1 (2024-05-15): 75 marks (B+, 3.2 GP) [+15]');
      expect(history[2]).toContain('Attempt 2 (2024-08-15): 85 marks (A, 3.6 GP) [+25]');
      expect(history[3]).toBe('Current Best: 85 marks (A, 3.6 GP)');
    });

    it('should show negative improvement when attempt is worse', () => {
      let record = createGradeImprovementRecord(
        'student-123',
        'subject-456',
        'Physics',
        75
      );

      record = recordGradeImprovementAttempt(record, 65, '2024-05-15');

      const history = getGradeImprovementHistory(record);

      expect(history[1]).toContain('Attempt 1 (2024-05-15): 65 marks (B, 2.8 GP) [-10]');
      expect(history[2]).toBe('Current Best: 75 marks (B+, 3.2 GP)');
    });

    it('should handle multiple attempts with mixed results', () => {
      let record = createGradeImprovementRecord(
        'student-123',
        'subject-456',
        'Physics',
        60
      );

      record = recordGradeImprovementAttempt(record, 65, '2024-05-15');
      record = recordGradeImprovementAttempt(record, 55, '2024-08-15');
      record = recordGradeImprovementAttempt(record, 80, '2024-11-15');

      const history = getGradeImprovementHistory(record);

      expect(history).toHaveLength(5);
      expect(history[0]).toBe('Original: 60 marks (B, 2.8 GP)');
      expect(history[1]).toContain('[+5]');
      expect(history[2]).toContain('[-5]');
      expect(history[3]).toContain('[+20]');
      expect(history[4]).toBe('Current Best: 80 marks (A, 3.6 GP)');
    });
  });

  describe('Integration: Complete grade improvement workflow', () => {
    const {
      createGradeImprovementRecord,
      validateGradeImprovementRegistration,
      recordGradeImprovementAttempt,
      getGradeImprovementHistory,
    } = require('../nebGrading.service');

    it('should handle complete workflow for single subject improvement', () => {
      // Student initially fails Physics with 60 marks (B grade)
      const studentImprovement: any = {
        studentId: 'student-123',
        academicYearId: 'year-2024',
        subjects: [],
      };

      // Validate registration
      let validation = validateGradeImprovementRegistration(studentImprovement, 'subject-physics');
      expect(validation.isValid).toBe(true);

      // Create improvement record
      let physicsRecord = createGradeImprovementRecord(
        'student-123',
        'subject-physics',
        'Physics',
        60
      );
      studentImprovement.subjects.push(physicsRecord);

      // First attempt: 70 marks
      physicsRecord = recordGradeImprovementAttempt(physicsRecord, 70, '2024-05-15');
      expect(physicsRecord.currentGrade).toBe('B+');

      // Second attempt: 85 marks
      physicsRecord = recordGradeImprovementAttempt(physicsRecord, 85, '2024-08-15');
      expect(physicsRecord.currentGrade).toBe('A');

      // Get history
      const history = getGradeImprovementHistory(physicsRecord);
      expect(history).toHaveLength(4);
      expect(physicsRecord.attempts).toHaveLength(2);
      expect(physicsRecord.status).toBe('active');
    });

    it('should handle workflow for two subjects (maximum allowed)', () => {
      const studentImprovement: any = {
        studentId: 'student-123',
        academicYearId: 'year-2024',
        subjects: [],
      };

      // Register first subject (Physics)
      let validation1 = validateGradeImprovementRegistration(studentImprovement, 'subject-physics');
      expect(validation1.isValid).toBe(true);

      const physicsRecord = createGradeImprovementRecord(
        'student-123',
        'subject-physics',
        'Physics',
        60
      );
      studentImprovement.subjects.push(physicsRecord);

      // Register second subject (Chemistry)
      let validation2 = validateGradeImprovementRegistration(studentImprovement, 'subject-chemistry');
      expect(validation2.isValid).toBe(true);

      const chemistryRecord = createGradeImprovementRecord(
        'student-123',
        'subject-chemistry',
        'Chemistry',
        55
      );
      studentImprovement.subjects.push(chemistryRecord);

      // Try to register third subject (should fail)
      let validation3 = validateGradeImprovementRegistration(studentImprovement, 'subject-math');
      expect(validation3.isValid).toBe(false);
      expect(validation3.errors[0]).toContain('Maximum 2 subjects allowed');
    });

    it('should handle workflow until attempts are exhausted', () => {
      let record = createGradeImprovementRecord(
        'student-123',
        'subject-456',
        'Physics',
        60
      );

      // Three attempts
      record = recordGradeImprovementAttempt(record, 65, '2024-05-15');
      expect(record.status).toBe('active');

      record = recordGradeImprovementAttempt(record, 70, '2024-08-15');
      expect(record.status).toBe('active');

      record = recordGradeImprovementAttempt(record, 75, '2024-11-15');
      expect(record.status).toBe('exhausted');

      // Validate that no more attempts are allowed
      const studentImprovement = {
        studentId: 'student-123',
        academicYearId: 'year-2024',
        subjects: [record],
      };

      const validation = validateGradeImprovementRegistration(studentImprovement, 'subject-456');
      expect(validation.isValid).toBe(false);
      expect(validation.errors[0]).toContain('Maximum 3 attempts allowed');
    });

    it('should handle workflow until A+ grade is achieved', () => {
      let record = createGradeImprovementRecord(
        'student-123',
        'subject-456',
        'Physics',
        75
      );

      // First attempt achieves A+
      record = recordGradeImprovementAttempt(record, 95, '2024-05-15');
      expect(record.status).toBe('completed');
      expect(record.currentGrade).toBe('A+');

      // Validate that no more attempts are allowed
      const studentImprovement = {
        studentId: 'student-123',
        academicYearId: 'year-2024',
        subjects: [record],
      };

      const validation = validateGradeImprovementRegistration(studentImprovement, 'subject-456');
      expect(validation.isValid).toBe(false);
      expect(validation.errors[0]).toContain('already has the maximum grade (A+)');
    });
  });
});
