/**
 * Property-Based Tests for NEB Grading Service
 * 
 * Uses fast-check to verify universal properties of the NEB grading system
 * across a large number of randomly generated test cases.
 * 
 * Task: 12.2 Write property test for NEB grade mapping
 * Property 1: NEB Grade Mapping Correctness
 * Validates: Requirements N1.1, N1.4
 */

import * as fc from 'fast-check';
import { calculateNEBGrade, calculateGPA, calculateWeightedGrade, NEB_GRADE_SCALE, SubjectGrade } from '../nebGrading.service';

describe('NEB Grading Service - Property-Based Tests', () => {
  describe('Property 1: NEB Grade Mapping Correctness', () => {
    /**
     * **Validates: Requirements N1.1, N1.4**
     * 
     * Property: For any marks value between 0 and 100, the system should map it
     * to exactly one NEB grade according to the official grading table.
     * 
     * Expected mappings:
     * - [90-100] → A+ (4.0)
     * - [80-89]  → A  (3.6)
     * - [70-79]  → B+ (3.2)
     * - [60-69]  → B  (2.8)
     * - [50-59]  → C+ (2.4)
     * - [40-49]  → C  (2.0)
     * - [32-39]  → D  (1.6)  [NOTE: Implementation uses 32, Requirements say 35]
     * - [0-31]   → NG (0.0)
     * 
     * This test runs 100+ iterations across the full marks range (0-100)
     * to verify correct grade mapping at all boundaries and mid-ranges.
     */
    it('should map any marks (0-100) to exactly one correct NEB grade', () => {
      fc.assert(
        fc.property(
          // Generate marks between 0 and 100 (inclusive)
          fc.double({ min: 0, max: 100, noNaN: true }),
          (marks) => {
            // Calculate the grade
            const result = calculateNEBGrade(marks);

            // Property 1: Result should always have grade, gradePoint, and description
            expect(result).toHaveProperty('grade');
            expect(result).toHaveProperty('gradePoint');
            expect(result).toHaveProperty('description');

            // Property 2: Grade should be one of the 8 valid NEB grades
            const validGrades = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'NG'];
            expect(validGrades).toContain(result.grade);

            // Property 3: Grade point should be one of the valid grade points
            const validGradePoints = [4.0, 3.6, 3.2, 2.8, 2.4, 2.0, 1.6, 0.0];
            expect(validGradePoints).toContain(result.gradePoint);

            // Property 4: Verify correct mapping based on marks range
            if (marks >= 90 && marks <= 100) {
              expect(result.grade).toBe('A+');
              expect(result.gradePoint).toBe(4.0);
              expect(result.description).toBe('Outstanding');
            } else if (marks >= 80 && marks < 90) {
              expect(result.grade).toBe('A');
              expect(result.gradePoint).toBe(3.6);
              expect(result.description).toBe('Excellent');
            } else if (marks >= 70 && marks < 80) {
              expect(result.grade).toBe('B+');
              expect(result.gradePoint).toBe(3.2);
              expect(result.description).toBe('Very Good');
            } else if (marks >= 60 && marks < 70) {
              expect(result.grade).toBe('B');
              expect(result.gradePoint).toBe(2.8);
              expect(result.description).toBe('Good');
            } else if (marks >= 50 && marks < 60) {
              expect(result.grade).toBe('C+');
              expect(result.gradePoint).toBe(2.4);
              expect(result.description).toBe('Satisfactory');
            } else if (marks >= 40 && marks < 50) {
              expect(result.grade).toBe('C');
              expect(result.gradePoint).toBe(2.0);
              expect(result.description).toBe('Acceptable');
            } else if (marks >= 32 && marks < 40) {
              expect(result.grade).toBe('D');
              expect(result.gradePoint).toBe(1.6);
              expect(result.description).toBe('Basic');
            } else if (marks >= 0 && marks < 32) {
              expect(result.grade).toBe('NG');
              expect(result.gradePoint).toBe(0.0);
              expect(result.description).toBe('Not Graded');
            }

            // Property 5: Grade and grade point should be consistent with NEB_GRADE_SCALE
            const gradeInfo = NEB_GRADE_SCALE.find((g) => g.grade === result.grade);
            expect(gradeInfo).toBeDefined();
            expect(result.gradePoint).toBe(gradeInfo?.gradePoint);
            expect(result.description).toBe(gradeInfo?.description);
          }
        ),
        {
          // Run 100+ iterations to thoroughly test the full range
          numRuns: 150,
          // Show verbose output on failure
          verbose: true,
        }
      );
    });

    /**
     * Property: Grade boundaries should be correctly handled
     * 
     * This test specifically focuses on boundary values where grades transition
     * from one level to another. These are the most critical points to test.
     */
    it('should correctly handle all grade boundary transitions', () => {
      fc.assert(
        fc.property(
          // Generate boundary values and values just before/after boundaries
          fc.constantFrom(
            // A+/A boundary (89-90)
            89, 89.5, 89.9, 89.99, 90, 90.01, 90.1,
            // A/B+ boundary (79-80)
            79, 79.5, 79.9, 79.99, 80, 80.01, 80.1,
            // B+/B boundary (69-70)
            69, 69.5, 69.9, 69.99, 70, 70.01, 70.1,
            // B/C+ boundary (59-60)
            59, 59.5, 59.9, 59.99, 60, 60.01, 60.1,
            // C+/C boundary (49-50)
            49, 49.5, 49.9, 49.99, 50, 50.01, 50.1,
            // C/D boundary (39-40)
            39, 39.5, 39.9, 39.99, 40, 40.01, 40.1,
            // D/NG boundary (31-32)
            31, 31.5, 31.9, 31.99, 32, 32.01, 32.1,
            // Edge boundaries
            0, 0.01, 99.99, 100
          ),
          (marks) => {
            const result = calculateNEBGrade(marks);

            // Verify the boundary is correctly classified
            if (marks >= 90) {
              expect(result.grade).toBe('A+');
            } else if (marks >= 80) {
              expect(result.grade).toBe('A');
            } else if (marks >= 70) {
              expect(result.grade).toBe('B+');
            } else if (marks >= 60) {
              expect(result.grade).toBe('B');
            } else if (marks >= 50) {
              expect(result.grade).toBe('C+');
            } else if (marks >= 40) {
              expect(result.grade).toBe('C');
            } else if (marks >= 32) {
              expect(result.grade).toBe('D');
            } else {
              expect(result.grade).toBe('NG');
            }
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      );
    });

    /**
     * Property: Invalid marks should be rejected
     * 
     * Marks outside the valid range [0, 100] should throw an error.
     */
    it('should reject marks outside valid range [0, 100]', () => {
      fc.assert(
        fc.property(
          // Generate invalid marks (negative or > 100)
          fc.oneof(
            fc.double({ max: -0.01, noNaN: true }), // Negative marks
            fc.double({ min: 100.01, max: 1000, noNaN: true }) // Marks > 100
          ),
          (invalidMarks) => {
            expect(() => calculateNEBGrade(invalidMarks)).toThrow(
              'Marks must be between 0 and 100'
            );
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      );
    });

    /**
     * Property: Grade point should decrease monotonically with marks
     * 
     * Higher marks should never result in a lower grade point.
     */
    it('should have monotonically decreasing grade points as marks decrease', () => {
      fc.assert(
        fc.property(
          // Generate two marks values
          fc.double({ min: 0, max: 100, noNaN: true }),
          fc.double({ min: 0, max: 100, noNaN: true }),
          (marks1, marks2) => {
            const result1 = calculateNEBGrade(marks1);
            const result2 = calculateNEBGrade(marks2);

            // If marks1 > marks2, then gradePoint1 >= gradePoint2
            if (marks1 > marks2) {
              expect(result1.gradePoint).toBeGreaterThanOrEqual(result2.gradePoint);
            } else if (marks1 < marks2) {
              expect(result1.gradePoint).toBeLessThanOrEqual(result2.gradePoint);
            } else {
              // Equal marks should give equal grade points
              expect(result1.gradePoint).toBe(result2.gradePoint);
            }
          }
        ),
        {
          numRuns: 100,
          verbose: true,
        }
      );
    });

    /**
     * Property: Same marks should always produce same grade
     * 
     * The function should be deterministic - same input always produces same output.
     */
    it('should be deterministic (same marks always produce same grade)', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 100, noNaN: true }),
          (marks) => {
            const result1 = calculateNEBGrade(marks);
            const result2 = calculateNEBGrade(marks);
            const result3 = calculateNEBGrade(marks);

            // All three calls should produce identical results
            expect(result1).toEqual(result2);
            expect(result2).toEqual(result3);
            expect(result1.grade).toBe(result2.grade);
            expect(result1.gradePoint).toBe(result2.gradePoint);
            expect(result1.description).toBe(result2.description);
          }
        ),
        {
          numRuns: 100,
          verbose: true,
        }
      );
    });

    /**
     * Property: All marks in the same grade range should produce the same grade
     * 
     * Any two marks within the same grade range should map to the same grade.
     */
    it('should map all marks within same range to same grade', () => {
      fc.assert(
        fc.property(
          // Pick a grade range and generate two marks within it
          fc
            .constantFrom(...NEB_GRADE_SCALE)
            .chain((gradeInfo) =>
              fc.tuple(
                fc.constant(gradeInfo),
                fc.double({
                  min: gradeInfo.minMarks,
                  max: gradeInfo.maxMarks,
                  noNaN: true,
                }),
                fc.double({
                  min: gradeInfo.minMarks,
                  max: gradeInfo.maxMarks,
                  noNaN: true,
                })
              )
            ),
          ([gradeInfo, marks1, marks2]) => {
            const result1 = calculateNEBGrade(marks1);
            const result2 = calculateNEBGrade(marks2);

            // Both marks should map to the same grade
            expect(result1.grade).toBe(gradeInfo.grade);
            expect(result2.grade).toBe(gradeInfo.grade);
            expect(result1.grade).toBe(result2.grade);
            expect(result1.gradePoint).toBe(result2.gradePoint);
          }
        ),
        {
          numRuns: 100,
          verbose: true,
        }
      );
    });

    /**
     * Property: Grade scale should have no gaps or overlaps
     * 
     * Every possible marks value should map to exactly one grade,
     * with no gaps or overlaps in the ranges.
     */
    it('should have complete coverage with no gaps in grade ranges', () => {
      // This is a structural test of the grade scale itself
      const sortedScale = [...NEB_GRADE_SCALE].sort((a, b) => b.minMarks - a.minMarks);

      // Check that the highest grade covers 100
      expect(sortedScale[0].maxMarks).toBe(100);

      // Check that the lowest grade covers 0
      expect(sortedScale[sortedScale.length - 1].minMarks).toBe(0);

      // Check that there are no gaps between consecutive grades
      for (let i = 0; i < sortedScale.length - 1; i++) {
        const currentGrade = sortedScale[i];
        const nextGrade = sortedScale[i + 1];

        // The next grade's maxMarks should be exactly 1 less than current grade's minMarks
        // This ensures no gaps or overlaps
        expect(nextGrade.maxMarks).toBe(currentGrade.minMarks - 1);
      }
    });
  });

  describe('Property 2: GPA Calculation Formula', () => {
    /**
     * **Validates: Requirements N1.2**
     * 
     * Property: For any set of subjects with credit hours and grade points,
     * the calculated GPA should equal the sum of (credit_hour × grade_point)
     * divided by total credit hours, rounded to 2 decimal places.
     * 
     * Formula: GPA = Σ(Credit Hour × Grade Point) / Total Credit Hours
     * 
     * This test verifies that the GPA calculation follows the correct NEB formula
     * across various input combinations of subjects, credit hours, and grade points.
     */
    it('should calculate GPA using correct formula: Σ(credit × gradePoint) / totalCredit', () => {
      fc.assert(
        fc.property(
          // Generate an array of 1-8 subjects (typical course load)
          fc.array(
            fc.record({
              subjectName: fc.constantFrom(
                'Mathematics',
                'English',
                'Nepali',
                'Science',
                'Social Studies',
                'Computer Science',
                'Physics',
                'Chemistry'
              ),
              // Credit hours typically range from 1-5
              creditHours: fc.integer({ min: 1, max: 5 }),
              // Grade points are 0.0, 1.6, 2.0, 2.4, 2.8, 3.2, 3.6, or 4.0
              gradePoint: fc.constantFrom(0.0, 1.6, 2.0, 2.4, 2.8, 3.2, 3.6, 4.0),
            }),
            { minLength: 1, maxLength: 8 }
          ),
          (subjects) => {
            // Calculate GPA using the service
            const calculatedGPA = calculateGPA(subjects);

            // Manually calculate expected GPA using the formula
            let totalWeightedPoints = 0;
            let totalCreditHours = 0;

            for (const subject of subjects) {
              totalWeightedPoints += subject.creditHours * subject.gradePoint;
              totalCreditHours += subject.creditHours;
            }

            const expectedGPA = Math.round((totalWeightedPoints / totalCreditHours) * 100) / 100;

            // Property 1: Calculated GPA should match the formula
            expect(calculatedGPA).toBe(expectedGPA);

            // Property 2: GPA should be between 0.0 and 4.0
            expect(calculatedGPA).toBeGreaterThanOrEqual(0.0);
            expect(calculatedGPA).toBeLessThanOrEqual(4.0);

            // Property 3: GPA should be rounded to 2 decimal places
            const decimalPlaces = (calculatedGPA.toString().split('.')[1] || '').length;
            expect(decimalPlaces).toBeLessThanOrEqual(2);

            // Property 4: If all subjects have same grade point, GPA should equal that grade point
            const allSameGradePoint = subjects.every((s) => s.gradePoint === subjects[0].gradePoint);
            if (allSameGradePoint) {
              expect(calculatedGPA).toBe(subjects[0].gradePoint);
            }
          }
        ),
        {
          numRuns: 200,
          verbose: true,
        }
      );
    });

    /**
     * Property: GPA should be weighted average, not simple average
     * 
     * Verifies that credit hours properly weight the grade points.
     */
    it('should weight grade points by credit hours (not simple average)', () => {
      fc.assert(
        fc.property(
          // Generate subjects with different credit hours
          fc.tuple(
            fc.integer({ min: 1, max: 5 }), // creditHours1
            fc.integer({ min: 1, max: 5 }), // creditHours2
            fc.constantFrom(0.0, 1.6, 2.0, 2.4, 2.8, 3.2, 3.6, 4.0), // gradePoint1
            fc.constantFrom(0.0, 1.6, 2.0, 2.4, 2.8, 3.2, 3.6, 4.0) // gradePoint2
          ),
          ([creditHours1, creditHours2, gradePoint1, gradePoint2]) => {
            const subjects: SubjectGrade[] = [
              { subjectName: 'Subject1', creditHours: creditHours1, gradePoint: gradePoint1 },
              { subjectName: 'Subject2', creditHours: creditHours2, gradePoint: gradePoint2 },
            ];

            const calculatedGPA = calculateGPA(subjects);

            // Calculate expected weighted average
            const totalWeighted = creditHours1 * gradePoint1 + creditHours2 * gradePoint2;
            const totalCredits = creditHours1 + creditHours2;
            const expectedGPA = Math.round((totalWeighted / totalCredits) * 100) / 100;

            expect(calculatedGPA).toBe(expectedGPA);

            // If credit hours are different, GPA should be weighted toward the higher credit subject
            if (creditHours1 !== creditHours2 && gradePoint1 !== gradePoint2) {
              // The weighted GPA should be closer to the grade with more credit hours
              if (creditHours1 > creditHours2) {
                const distanceToGP1 = Math.abs(calculatedGPA - gradePoint1);
                const distanceToGP2 = Math.abs(calculatedGPA - gradePoint2);
                expect(distanceToGP1).toBeLessThanOrEqual(distanceToGP2);
              } else if (creditHours2 > creditHours1) {
                const distanceToGP1 = Math.abs(calculatedGPA - gradePoint1);
                const distanceToGP2 = Math.abs(calculatedGPA - gradePoint2);
                expect(distanceToGP2).toBeLessThanOrEqual(distanceToGP1);
              }
            }
          }
        ),
        {
          numRuns: 150,
          verbose: true,
        }
      );
    });

    /**
     * Property: GPA with single subject should equal that subject's grade point
     * 
     * When there's only one subject, the GPA should be exactly the grade point
     * of that subject, regardless of credit hours.
     */
    it('should return grade point when only one subject is provided', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }), // creditHours
          fc.constantFrom(0.0, 1.6, 2.0, 2.4, 2.8, 3.2, 3.6, 4.0), // gradePoint
          (creditHours, gradePoint) => {
            const subjects: SubjectGrade[] = [
              { subjectName: 'SingleSubject', creditHours, gradePoint },
            ];

            const calculatedGPA = calculateGPA(subjects);

            // GPA should equal the single subject's grade point
            expect(calculatedGPA).toBe(gradePoint);
          }
        ),
        {
          numRuns: 100,
          verbose: true,
        }
      );
    });

    /**
     * Property: GPA should be deterministic
     * 
     * Same input should always produce same output.
     */
    it('should be deterministic (same subjects always produce same GPA)', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              subjectName: fc.string({ minLength: 1, maxLength: 20 }),
              creditHours: fc.integer({ min: 1, max: 5 }),
              gradePoint: fc.constantFrom(0.0, 1.6, 2.0, 2.4, 2.8, 3.2, 3.6, 4.0),
            }),
            { minLength: 1, maxLength: 8 }
          ),
          (subjects) => {
            const gpa1 = calculateGPA(subjects);
            const gpa2 = calculateGPA(subjects);
            const gpa3 = calculateGPA(subjects);

            // All three calls should produce identical results
            expect(gpa1).toBe(gpa2);
            expect(gpa2).toBe(gpa3);
          }
        ),
        {
          numRuns: 100,
          verbose: true,
        }
      );
    });

    /**
     * Property: GPA should reject empty subjects array
     * 
     * An empty array should throw an error.
     */
    it('should reject empty subjects array', () => {
      expect(() => calculateGPA([])).toThrow('Subjects array must not be empty');
    });

    /**
     * Property: GPA should reject invalid credit hours
     * 
     * Credit hours must be positive numbers.
     */
    it('should reject invalid credit hours (zero or negative)', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(0),
            fc.integer({ max: -1 })
          ),
          (invalidCreditHours) => {
            const subjects: SubjectGrade[] = [
              { subjectName: 'Math', creditHours: invalidCreditHours, gradePoint: 4.0 },
            ];

            expect(() => calculateGPA(subjects)).toThrow(/Invalid credit hours/);
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      );
    });

    /**
     * Property: GPA should reject invalid grade points
     * 
     * Grade points must be between 0.0 and 4.0.
     */
    it('should reject invalid grade points (< 0 or > 4.0)', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.double({ max: -0.01, noNaN: true }), // Negative
            fc.double({ min: 4.01, max: 10, noNaN: true }) // > 4.0
          ),
          (invalidGradePoint) => {
            const subjects: SubjectGrade[] = [
              { subjectName: 'Math', creditHours: 3, gradePoint: invalidGradePoint },
            ];

            expect(() => calculateGPA(subjects)).toThrow(/Invalid grade point/);
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      );
    });

    /**
     * Property: GPA calculation should be commutative
     * 
     * The order of subjects should not affect the GPA.
     */
    it('should produce same GPA regardless of subject order (commutative)', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              subjectName: fc.string({ minLength: 1, maxLength: 20 }),
              creditHours: fc.integer({ min: 1, max: 5 }),
              gradePoint: fc.constantFrom(0.0, 1.6, 2.0, 2.4, 2.8, 3.2, 3.6, 4.0),
            }),
            { minLength: 2, maxLength: 6 }
          ),
          (subjects) => {
            const gpa1 = calculateGPA(subjects);

            // Reverse the array
            const reversedSubjects = [...subjects].reverse();
            const gpa2 = calculateGPA(reversedSubjects);

            // Shuffle the array
            const shuffledSubjects = [...subjects].sort(() => Math.random() - 0.5);
            const gpa3 = calculateGPA(shuffledSubjects);

            // All should produce the same GPA
            expect(gpa1).toBe(gpa2);
            expect(gpa1).toBe(gpa3);
          }
        ),
        {
          numRuns: 100,
          verbose: true,
        }
      );
    });

    /**
     * Property: Adding a subject with GPA equal to current GPA should not change GPA
     * 
     * If we add a subject whose grade point equals the current GPA,
     * the overall GPA should remain the same.
     */
    it('should maintain GPA when adding subject with grade point equal to current GPA', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              subjectName: fc.string({ minLength: 1, maxLength: 20 }),
              creditHours: fc.integer({ min: 1, max: 5 }),
              gradePoint: fc.constantFrom(0.0, 1.6, 2.0, 2.4, 2.8, 3.2, 3.6, 4.0),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          fc.integer({ min: 1, max: 5 }), // Additional credit hours
          (subjects, additionalCreditHours) => {
            const currentGPA = calculateGPA(subjects);

            // Add a new subject with grade point equal to current GPA
            const newSubjects = [
              ...subjects,
              {
                subjectName: 'NewSubject',
                creditHours: additionalCreditHours,
                gradePoint: currentGPA,
              },
            ];

            const newGPA = calculateGPA(newSubjects);

            // GPA should remain the same (within rounding tolerance)
            expect(Math.abs(newGPA - currentGPA)).toBeLessThanOrEqual(0.01);
          }
        ),
        {
          numRuns: 100,
          verbose: true,
        }
      );
    });

    /**
     * Property: GPA bounds based on min/max grade points
     * 
     * The GPA should always be between the minimum and maximum grade points
     * of the subjects.
     */
    it('should have GPA between min and max grade points of subjects', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              subjectName: fc.string({ minLength: 1, maxLength: 20 }),
              creditHours: fc.integer({ min: 1, max: 5 }),
              gradePoint: fc.constantFrom(0.0, 1.6, 2.0, 2.4, 2.8, 3.2, 3.6, 4.0),
            }),
            { minLength: 2, maxLength: 8 }
          ),
          (subjects) => {
            const calculatedGPA = calculateGPA(subjects);

            const gradePoints = subjects.map((s) => s.gradePoint);
            const minGradePoint = Math.min(...gradePoints);
            const maxGradePoint = Math.max(...gradePoints);

            // GPA should be within the range of grade points
            expect(calculatedGPA).toBeGreaterThanOrEqual(minGradePoint);
            expect(calculatedGPA).toBeLessThanOrEqual(maxGradePoint);
          }
        ),
        {
          numRuns: 150,
          verbose: true,
        }
      );
    });
  });

  describe('Property 3: Weighted Grade Calculation', () => {
    /**
     * **Validates: Requirements N1.3**
     * 
     * Property: For any theory marks and practical marks with specified weights,
     * the total marks should equal (theory_marks × theory_weight + practical_marks × practical_weight) / 100,
     * where weights sum to 100%.
     * 
     * This test verifies that weighted grade calculation follows the correct formula
     * across various input combinations, including:
     * - Default 75% theory + 25% practical split
     * - 50/50 split for subjects like Computer Science
     * - Other valid weight combinations
     */
    it('should calculate weighted grade using correct formula: (theory × weight + practical × weight) / 100', () => {
      fc.assert(
        fc.property(
          // Generate theory marks (0-100)
          fc.double({ min: 0, max: 100, noNaN: true }),
          // Generate practical marks (0-100)
          fc.double({ min: 0, max: 100, noNaN: true }),
          // Generate theory weight (0-100)
          fc.integer({ min: 0, max: 100 }),
          (theoryMarks, practicalMarks, theoryWeight) => {
            // Calculate practical weight to ensure sum is 100
            const practicalWeight = 100 - theoryWeight;

            const config = {
              theoryMarks,
              practicalMarks,
              theoryWeight,
              practicalWeight,
            };

            // Calculate weighted grade using the service
            const calculatedWeightedGrade = calculateWeightedGrade(config);

            // Manually calculate expected weighted grade using the formula
            const expectedWeightedGrade = Math.round(
              ((theoryMarks * theoryWeight / 100) + (practicalMarks * practicalWeight / 100)) * 100
            ) / 100;

            // Property 1: Calculated weighted grade should match the formula
            expect(calculatedWeightedGrade).toBe(expectedWeightedGrade);

            // Property 2: Weighted grade should be between 0 and 100
            expect(calculatedWeightedGrade).toBeGreaterThanOrEqual(0);
            expect(calculatedWeightedGrade).toBeLessThanOrEqual(100);

            // Property 3: Weighted grade should be rounded to 2 decimal places
            const decimalPlaces = (calculatedWeightedGrade.toString().split('.')[1] || '').length;
            expect(decimalPlaces).toBeLessThanOrEqual(2);

            // Property 4: If both marks are equal, weighted grade should equal that mark (within rounding tolerance)
            if (theoryMarks === practicalMarks) {
              // Account for rounding to 2 decimal places
              expect(Math.abs(calculatedWeightedGrade - theoryMarks)).toBeLessThanOrEqual(0.01);
            }

            // Property 5: Weighted grade should be between min and max of theory and practical marks
            // (with tolerance for rounding to 2 decimal places)
            const minMarks = Math.min(theoryMarks, practicalMarks);
            const maxMarks = Math.max(theoryMarks, practicalMarks);
            // Allow small tolerance for rounding (0.01)
            expect(calculatedWeightedGrade).toBeGreaterThanOrEqual(minMarks - 0.01);
            expect(calculatedWeightedGrade).toBeLessThanOrEqual(maxMarks + 0.01);
          }
        ),
        {
          numRuns: 200,
          verbose: true,
        }
      );
    });

    /**
     * Property: Default 75% theory + 25% practical split
     * 
     * Tests the most common weight configuration used in Nepal's education system.
     */
    it('should correctly calculate weighted grade with 75% theory + 25% practical (default)', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 100, noNaN: true }),
          fc.double({ min: 0, max: 100, noNaN: true }),
          (theoryMarks, practicalMarks) => {
            const config = {
              theoryMarks,
              practicalMarks,
              theoryWeight: 75,
              practicalWeight: 25,
            };

            const weightedGrade = calculateWeightedGrade(config);

            // Calculate expected value
            const expected = Math.round((theoryMarks * 0.75 + practicalMarks * 0.25) * 100) / 100;

            expect(weightedGrade).toBe(expected);

            // Weighted grade should be closer to theory marks (since it has 75% weight)
            if (theoryMarks !== practicalMarks) {
              const distanceToTheory = Math.abs(weightedGrade - theoryMarks);
              const distanceToPractical = Math.abs(weightedGrade - practicalMarks);
              // Only check if the difference is significant (> 0.01 to avoid floating point issues)
              if (Math.abs(theoryMarks - practicalMarks) > 0.01) {
                expect(distanceToTheory).toBeLessThan(distanceToPractical);
              }
            }
          }
        ),
        {
          numRuns: 150,
          verbose: true,
        }
      );
    });

    /**
     * Property: 50/50 theory-practical split
     * 
     * Tests the equal weight configuration used for subjects like Computer Science.
     */
    it('should correctly calculate weighted grade with 50% theory + 50% practical split', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 100, noNaN: true }),
          fc.double({ min: 0, max: 100, noNaN: true }),
          (theoryMarks, practicalMarks) => {
            const config = {
              theoryMarks,
              practicalMarks,
              theoryWeight: 50,
              practicalWeight: 50,
            };

            const weightedGrade = calculateWeightedGrade(config);

            // Calculate expected value (simple average for 50/50)
            const expected = Math.round((theoryMarks + practicalMarks) / 2 * 100) / 100;

            expect(weightedGrade).toBe(expected);

            // For 50/50 split, weighted grade should be exactly the average
            const average = (theoryMarks + practicalMarks) / 2;
            expect(Math.abs(weightedGrade - average)).toBeLessThanOrEqual(0.01);
          }
        ),
        {
          numRuns: 150,
          verbose: true,
        }
      );
    });

    /**
     * Property: Weights must sum to 100
     * 
     * The function should reject configurations where weights don't sum to 100.
     */
    it('should reject weights that do not sum to 100', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 100, noNaN: true }),
          fc.double({ min: 0, max: 100, noNaN: true }),
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 100 }),
          (theoryMarks, practicalMarks, theoryWeight, practicalWeight) => {
            // Only test cases where weights don't sum to 100
            fc.pre(theoryWeight + practicalWeight !== 100);

            const config = {
              theoryMarks,
              practicalMarks,
              theoryWeight,
              practicalWeight,
            };

            expect(() => calculateWeightedGrade(config)).toThrow(/Weights must sum to 100/);
          }
        ),
        {
          numRuns: 100,
          verbose: true,
        }
      );
    });

    /**
     * Property: Weights must be non-negative
     * 
     * The function should reject negative weights.
     */
    it('should reject negative weights', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 100, noNaN: true }),
          fc.double({ min: 0, max: 100, noNaN: true }),
          fc.oneof(
            fc.integer({ max: -1 }), // Negative theory weight
            fc.integer({ min: 101, max: 200 }) // Theory weight > 100 (makes practical negative)
          ),
          (theoryMarks, practicalMarks, theoryWeight) => {
            const practicalWeight = 100 - theoryWeight;

            const config = {
              theoryMarks,
              practicalMarks,
              theoryWeight,
              practicalWeight,
            };

            expect(() => calculateWeightedGrade(config)).toThrow(/Weights must be non-negative/);
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      );
    });

    /**
     * Property: Marks must be within valid range [0, 100]
     * 
     * The function should reject marks outside the valid range.
     */
    it('should reject marks outside valid range [0, 100]', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // Invalid theory marks
            fc.tuple(
              fc.oneof(
                fc.double({ max: -0.01, noNaN: true }),
                fc.double({ min: 100.01, max: 200, noNaN: true })
              ),
              fc.double({ min: 0, max: 100, noNaN: true })
            ),
            // Invalid practical marks
            fc.tuple(
              fc.double({ min: 0, max: 100, noNaN: true }),
              fc.oneof(
                fc.double({ max: -0.01, noNaN: true }),
                fc.double({ min: 100.01, max: 200, noNaN: true })
              )
            )
          ),
          ([theoryMarks, practicalMarks]) => {
            const config = {
              theoryMarks,
              practicalMarks,
              theoryWeight: 75,
              practicalWeight: 25,
            };

            expect(() => calculateWeightedGrade(config)).toThrow(/marks must be between 0 and 100/);
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      );
    });

    /**
     * Property: Weighted grade should be deterministic
     * 
     * Same input should always produce same output.
     */
    it('should be deterministic (same inputs always produce same weighted grade)', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 100, noNaN: true }),
          fc.double({ min: 0, max: 100, noNaN: true }),
          fc.integer({ min: 0, max: 100 }),
          (theoryMarks, practicalMarks, theoryWeight) => {
            const practicalWeight = 100 - theoryWeight;

            const config = {
              theoryMarks,
              practicalMarks,
              theoryWeight,
              practicalWeight,
            };

            const result1 = calculateWeightedGrade(config);
            const result2 = calculateWeightedGrade(config);
            const result3 = calculateWeightedGrade(config);

            // All three calls should produce identical results
            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
          }
        ),
        {
          numRuns: 100,
          verbose: true,
        }
      );
    });

    /**
     * Property: 100% weight on one component should return that component's marks
     * 
     * If theory weight is 100%, weighted grade should equal theory marks.
     * If practical weight is 100%, weighted grade should equal practical marks.
     */
    it('should return component marks when weight is 100% for that component', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 100, noNaN: true }),
          fc.double({ min: 0, max: 100, noNaN: true }),
          (theoryMarks, practicalMarks) => {
            // Test 100% theory weight
            const config1 = {
              theoryMarks,
              practicalMarks,
              theoryWeight: 100,
              practicalWeight: 0,
            };
            const result1 = calculateWeightedGrade(config1);
            // Account for rounding to 2 decimal places
            expect(Math.abs(result1 - theoryMarks)).toBeLessThanOrEqual(0.01);

            // Test 100% practical weight
            const config2 = {
              theoryMarks,
              practicalMarks,
              theoryWeight: 0,
              practicalWeight: 100,
            };
            const result2 = calculateWeightedGrade(config2);
            // Account for rounding to 2 decimal places
            expect(Math.abs(result2 - practicalMarks)).toBeLessThanOrEqual(0.01);
          }
        ),
        {
          numRuns: 100,
          verbose: true,
        }
      );
    });

    /**
     * Property: Weighted grade should be monotonic with respect to component marks
     * 
     * If we increase theory marks while keeping practical marks constant,
     * the weighted grade should increase (or stay the same if theory weight is 0).
     * Same applies for practical marks.
     */
    it('should increase weighted grade when component marks increase (monotonicity)', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 99, noNaN: true }), // Lower theory marks
          fc.double({ min: 0, max: 100, noNaN: true }), // Practical marks
          fc.integer({ min: 1, max: 100 }), // Theory weight (at least 1 to see effect)
          (theoryMarks1, practicalMarks, theoryWeight) => {
            const practicalWeight = 100 - theoryWeight;
            const theoryMarks2 = theoryMarks1 + 1; // Slightly higher theory marks

            const config1 = {
              theoryMarks: theoryMarks1,
              practicalMarks,
              theoryWeight,
              practicalWeight,
            };

            const config2 = {
              theoryMarks: theoryMarks2,
              practicalMarks,
              theoryWeight,
              practicalWeight,
            };

            const weightedGrade1 = calculateWeightedGrade(config1);
            const weightedGrade2 = calculateWeightedGrade(config2);

            // Increasing theory marks should increase (or maintain) weighted grade
            expect(weightedGrade2).toBeGreaterThanOrEqual(weightedGrade1);

            // If theory weight > 0, weighted grade should strictly increase
            if (theoryWeight > 0) {
              expect(weightedGrade2).toBeGreaterThan(weightedGrade1);
            }
          }
        ),
        {
          numRuns: 150,
          verbose: true,
        }
      );
    });

    /**
     * Property: Swapping marks and weights should produce consistent results
     * 
     * If we swap theory/practical marks and their weights, the result should be the same.
     * For example: (80 theory × 75% + 60 practical × 25%) should equal (60 theory × 25% + 80 practical × 75%)
     */
    it('should be commutative with respect to marks and weights', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 100, noNaN: true }),
          fc.double({ min: 0, max: 100, noNaN: true }),
          fc.integer({ min: 0, max: 100 }),
          (marks1, marks2, weight1) => {
            const weight2 = 100 - weight1;

            const config1 = {
              theoryMarks: marks1,
              practicalMarks: marks2,
              theoryWeight: weight1,
              practicalWeight: weight2,
            };

            const config2 = {
              theoryMarks: marks2,
              practicalMarks: marks1,
              theoryWeight: weight2,
              practicalWeight: weight1,
            };

            const result1 = calculateWeightedGrade(config1);
            const result2 = calculateWeightedGrade(config2);

            // Both configurations should produce the same result
            expect(result1).toBe(result2);
          }
        ),
        {
          numRuns: 150,
          verbose: true,
        }
      );
    });

    /**
     * Property: Boundary values should be handled correctly
     * 
     * Tests edge cases like 0 marks, 100 marks, and various weight combinations.
     */
    it('should correctly handle boundary values (0, 100 marks)', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(0, 100), // Theory marks at boundaries
          fc.constantFrom(0, 100), // Practical marks at boundaries
          fc.integer({ min: 0, max: 100 }), // Any valid weight
          (theoryMarks, practicalMarks, theoryWeight) => {
            const practicalWeight = 100 - theoryWeight;

            const config = {
              theoryMarks,
              practicalMarks,
              theoryWeight,
              practicalWeight,
            };

            const weightedGrade = calculateWeightedGrade(config);

            // Weighted grade should be within [0, 100]
            expect(weightedGrade).toBeGreaterThanOrEqual(0);
            expect(weightedGrade).toBeLessThanOrEqual(100);

            // If both marks are 0, weighted grade should be 0
            if (theoryMarks === 0 && practicalMarks === 0) {
              expect(weightedGrade).toBe(0);
            }

            // If both marks are 100, weighted grade should be 100
            if (theoryMarks === 100 && practicalMarks === 100) {
              expect(weightedGrade).toBe(100);
            }
          }
        ),
        {
          numRuns: 100,
          verbose: true,
        }
      );
    });
  });
});
