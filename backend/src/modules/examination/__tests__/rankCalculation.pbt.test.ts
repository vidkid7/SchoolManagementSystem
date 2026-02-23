import * as fc from 'fast-check';
import rankCalculationService from '../rankCalculation.service';

/**
 * Property-Based Tests for Rank Calculation
 * 
 * **Property 20: Class Rank Calculation Correctness**
 * **Validates: Requirements 7.10**
 * 
 * For any set of students in a class with their total marks, the rank assigned to each student
 * should be their position in descending order of marks, with tied students receiving the same
 * rank and the next rank being skipped accordingly.
 */

describe('Rank Calculation Property-Based Tests', () => {
  describe('Property 20: Class Rank Calculation Correctness', () => {
    it('should assign ranks in descending order of marks', () => {
      fc.assert(
        fc.property(
          // Generate array of students with unique IDs and marks between 0 and 100
          fc.array(
            fc.record({
              studentId: fc.integer({ min: 1, max: 10000 }),
              totalMarks: fc.float({ min: 0, max: 100, noNaN: true })
            }),
            { minLength: 1, maxLength: 50 }
          ).map(students => {
            // Ensure unique student IDs
            const uniqueStudents = students.filter((student, index, self) =>
              index === self.findIndex(s => s.studentId === student.studentId)
            );
            return uniqueStudents.length > 0 ? uniqueStudents : [{ studentId: 1, totalMarks: 50 }];
          }),
          (students) => {
            // Calculate ranks
            const rankedStudents = rankCalculationService.calculateRanks(students);

            // Property 1: Number of ranked students equals input students
            expect(rankedStudents.length).toBe(students.length);

            // Property 2: Ranks are in ascending order (1, 2, 3, ... or with ties: 1, 2, 2, 4, ...)
            for (let i = 1; i < rankedStudents.length; i++) {
              expect(rankedStudents[i].rank).toBeGreaterThanOrEqual(rankedStudents[i - 1].rank);
            }

            // Property 3: Marks are in descending order
            for (let i = 1; i < rankedStudents.length; i++) {
              expect(rankedStudents[i].totalMarks).toBeLessThanOrEqual(rankedStudents[i - 1].totalMarks);
            }

            // Property 4: Students with same marks have same rank
            // Group students by marks and check they all have the same rank
            const markGroups = new Map<number, number[]>();
            for (const student of rankedStudents) {
              const marks = student.totalMarks;
              if (!markGroups.has(marks)) {
                markGroups.set(marks, []);
              }
              markGroups.get(marks)!.push(student.rank);
            }
            
            // All students in each mark group should have the same rank
            for (const ranks of markGroups.values()) {
              const uniqueRanks = new Set(ranks);
              expect(uniqueRanks.size).toBe(1);
            }

            // Property 5: First student has rank 1
            expect(rankedStudents[0].rank).toBe(1);

            // Property 6: All student IDs from input are present in output
            const inputIds = students.map(s => s.studentId).sort();
            const outputIds = rankedStudents.map(s => s.studentId).sort();
            expect(outputIds).toEqual(inputIds);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should skip ranks correctly after ties', () => {
      fc.assert(
        fc.property(
          // Generate students with potential ties
          fc.array(
            fc.record({
              studentId: fc.integer({ min: 1, max: 10000 }),
              totalMarks: fc.integer({ min: 0, max: 100 }) // Use integers to increase tie probability
            }),
            { minLength: 2, maxLength: 30 }
          ),
          (students) => {
            const rankedStudents = rankCalculationService.calculateRanks(students);

            // Property: After N students with same rank R, next different rank should be R + N
            let i = 0;
            while (i < rankedStudents.length) {
              const currentRank = rankedStudents[i].rank;
              const currentMarks = rankedStudents[i].totalMarks;
              
              // Count students with same rank
              let tieCount = 1;
              let j = i + 1;
              while (j < rankedStudents.length && rankedStudents[j].totalMarks === currentMarks) {
                expect(rankedStudents[j].rank).toBe(currentRank);
                tieCount++;
                j++;
              }

              // If there's a next student with different marks, check rank skip
              if (j < rankedStudents.length) {
                const nextRank = rankedStudents[j].rank;
                expect(nextRank).toBe(currentRank + tieCount);
              }

              i = j;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate percentile correctly', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              studentId: fc.integer({ min: 1, max: 10000 }),
              totalMarks: fc.float({ min: 0, max: 100, noNaN: true })
            }),
            { minLength: 1, maxLength: 50 }
          ).map(students => {
            // Ensure unique student IDs
            const uniqueStudents = students.filter((student, index, self) =>
              index === self.findIndex(s => s.studentId === student.studentId)
            );
            return uniqueStudents.length > 0 ? uniqueStudents : [{ studentId: 1, totalMarks: 50 }];
          }),
          (students) => {
            const rankedStudents = rankCalculationService.calculateRanks(students);

            for (const student of rankedStudents) {
              // Property 1: Percentile is between 0 and 100
              expect(student.percentile).toBeGreaterThanOrEqual(0);
              expect(student.percentile).toBeLessThanOrEqual(100);

              // Property 2: Percentile calculation is correct
              const studentsAtOrBelow = rankedStudents.filter(
                s => s.totalMarks <= student.totalMarks
              ).length;
              const expectedPercentile = (studentsAtOrBelow / rankedStudents.length) * 100;
              expect(Math.abs(student.percentile - expectedPercentile)).toBeLessThan(0.01);
            }

            // Property 3: Student with highest marks has 100th percentile
            const highestMarksStudent = rankedStudents[0];
            expect(highestMarksStudent.percentile).toBe(100);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle all students with same marks', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }), // Number of students
          fc.float({ min: 0, max: 100, noNaN: true }), // Same marks for all
          (numStudents, marks) => {
            const students = Array.from({ length: numStudents }, (_, i) => ({
              studentId: i + 1,
              totalMarks: marks
            }));

            const rankedStudents = rankCalculationService.calculateRanks(students);

            // Property: All students should have rank 1
            for (const student of rankedStudents) {
              expect(student.rank).toBe(1);
              expect(student.totalMarks).toBe(marks);
            }

            // Property: All students should have 100th percentile
            for (const student of rankedStudents) {
              expect(student.percentile).toBe(100);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain rank consistency across multiple calculations', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              studentId: fc.integer({ min: 1, max: 10000 }),
              totalMarks: fc.float({ min: 0, max: 100, noNaN: true })
            }),
            { minLength: 1, maxLength: 30 }
          ).map(students => {
            // Ensure unique student IDs
            const uniqueStudents = students.filter((student, index, self) =>
              index === self.findIndex(s => s.studentId === student.studentId)
            );
            return uniqueStudents.length > 0 ? uniqueStudents : [{ studentId: 1, totalMarks: 50 }];
          }),
          (students) => {
            // Calculate ranks twice
            const result1 = rankCalculationService.calculateRanks(students);
            const result2 = rankCalculationService.calculateRanks(students);

            // Property: Results should be identical
            expect(result1.length).toBe(result2.length);
            
            for (let i = 0; i < result1.length; i++) {
              expect(result1[i].studentId).toBe(result2[i].studentId);
              expect(result1[i].rank).toBe(result2[i].rank);
              expect(result1[i].totalMarks).toBe(result2[i].totalMarks);
              expect(result1[i].percentile).toBe(result2[i].percentile);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle edge case: single student', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.float({ min: 0, max: 100, noNaN: true }),
          (studentId, marks) => {
            const students = [{ studentId, totalMarks: marks }];
            const rankedStudents = rankCalculationService.calculateRanks(students);

            // Properties for single student
            expect(rankedStudents.length).toBe(1);
            expect(rankedStudents[0].rank).toBe(1);
            expect(rankedStudents[0].percentile).toBe(100);
            expect(rankedStudents[0].studentId).toBe(studentId);
            expect(rankedStudents[0].totalMarks).toBe(marks);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should preserve student identity through ranking', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              studentId: fc.integer({ min: 1, max: 10000 }),
              totalMarks: fc.float({ min: 0, max: 100, noNaN: true })
            }),
            { minLength: 1, maxLength: 50 }
          ).map(students => {
            // Ensure unique student IDs
            const uniqueStudents = students.filter((student, index, self) =>
              index === self.findIndex(s => s.studentId === student.studentId)
            );
            return uniqueStudents.length > 0 ? uniqueStudents : [{ studentId: 1, totalMarks: 50 }];
          }),
          (students) => {
            const rankedStudents = rankCalculationService.calculateRanks(students);

            // Property: Each student in output corresponds to exactly one student in input
            for (const rankedStudent of rankedStudents) {
              const originalStudent = students.find(s => s.studentId === rankedStudent.studentId);
              expect(originalStudent).toBeDefined();
              expect(rankedStudent.totalMarks).toBe(originalStudent!.totalMarks);
            }

            // Property: No duplicate student IDs in output
            const studentIds = rankedStudents.map(s => s.studentId);
            const uniqueIds = new Set(studentIds);
            expect(uniqueIds.size).toBe(studentIds.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should assign higher ranks to students with higher marks', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              studentId: fc.integer({ min: 1, max: 10000 }),
              totalMarks: fc.float({ min: 0, max: 100, noNaN: true })
            }),
            { minLength: 2, maxLength: 50 }
          ).map(students => {
            // Ensure unique student IDs
            const uniqueStudents = students.filter((student, index, self) =>
              index === self.findIndex(s => s.studentId === student.studentId)
            );
            return uniqueStudents.length >= 2 ? uniqueStudents : [
              { studentId: 1, totalMarks: 50 },
              { studentId: 2, totalMarks: 60 }
            ];
          }),
          (students) => {
            const rankedStudents = rankCalculationService.calculateRanks(students);

            // Property: If student A has higher marks than student B, A's rank <= B's rank
            for (let i = 0; i < rankedStudents.length; i++) {
              for (let j = i + 1; j < rankedStudents.length; j++) {
                if (rankedStudents[i].totalMarks > rankedStudents[j].totalMarks) {
                  expect(rankedStudents[i].rank).toBeLessThan(rankedStudents[j].rank);
                } else if (rankedStudents[i].totalMarks === rankedStudents[j].totalMarks) {
                  expect(rankedStudents[i].rank).toBe(rankedStudents[j].rank);
                } else {
                  expect(rankedStudents[i].rank).toBeGreaterThan(rankedStudents[j].rank);
                }
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle maximum number of ties', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 20 }), // Number of students
          fc.float({ min: 0, max: 100, noNaN: true }), // Marks for first group
          fc.float({ min: 0, max: 100, noNaN: true }), // Marks for second group
          (numStudents, marks1, marks2) => {
            // Create two groups of students with same marks within each group
            const halfSize = Math.floor(numStudents / 2);
            const students = [
              ...Array.from({ length: halfSize }, (_, i) => ({
                studentId: i + 1,
                totalMarks: Math.max(marks1, marks2) // Higher marks
              })),
              ...Array.from({ length: numStudents - halfSize }, (_, i) => ({
                studentId: halfSize + i + 1,
                totalMarks: Math.min(marks1, marks2) // Lower marks
              }))
            ];

            const rankedStudents = rankCalculationService.calculateRanks(students);

            // Property: First group should all have rank 1
            for (let i = 0; i < halfSize; i++) {
              expect(rankedStudents[i].rank).toBe(1);
            }

            // Property: Second group should all have rank (halfSize + 1)
            if (marks1 !== marks2) {
              for (let i = halfSize; i < rankedStudents.length; i++) {
                expect(rankedStudents[i].rank).toBe(halfSize + 1);
              }
            } else {
              // If both groups have same marks, all should have rank 1
              for (const student of rankedStudents) {
                expect(student.rank).toBe(1);
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
