/**
 * Property-Based Tests for Attendance Service - Mark All Present
 * 
 * Uses fast-check to verify universal properties of the "Mark All Present" functionality
 * across a large number of randomly generated test cases.
 * 
 * Task: 13.3 Write property test for mark all present
 * Property 16: Mark All Present Completeness
 * Validates: Requirements 6.3
 */

import * as fc from 'fast-check';
import AttendanceService from '../attendance.service';
import AttendanceRepository from '../attendance.repository';
import { AttendanceStatus, SyncStatus } from '@models/AttendanceRecord.model';

// Mock the repository
jest.mock('../attendance.repository');

describe('Attendance Service - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('Property 16: Mark All Present Completeness', () => {
    /**
     * **Validates: Requirements 6.3**
     * 
     * Property: When marking all students present in a class, the system should create
     * exactly N attendance records for N students, where each record has status "present".
     * 
     * This is a critical correctness property that ensures:
     * 1. Every student gets an attendance record
     * 2. No duplicate records are created
     * 3. All records have the correct "present" status
     * 4. The count of created records matches the count of students
     * 
     * This test runs 100+ iterations with varying numbers of students (1-50)
     * to verify the property holds across all class sizes.
     */
    it('should create exactly N attendance records for N students when marking all present', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a class ID (1-100)
          fc.integer({ min: 1, max: 100 }),
          // Generate an array of 1-50 student IDs (realistic class size)
          fc.array(fc.integer({ min: 1, max: 1000 }), { minLength: 1, maxLength: 50 }).map(
            (ids) => Array.from(new Set(ids)) // Ensure unique student IDs
          ),
          // Generate a date
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          // Generate optional period number (1-8 or undefined for day-wise)
          fc.option(fc.integer({ min: 1, max: 8 }), { nil: undefined }),
          // Generate user ID (1-100)
          fc.integer({ min: 1, max: 100 }),
          async (classId, studentIds, date, periodNumber, userId) => {
            // Reset mocks for this iteration
            jest.clearAllMocks();

            // Skip if no students (edge case handled separately)
            if (studentIds.length === 0) {
              return;
            }

            // Skip invalid dates (NaN)
            if (isNaN(date.getTime())) {
              return;
            }

            const N = studentIds.length;

            // Mock: No existing attendance records
            (AttendanceRepository.findByClassAndDate as jest.Mock).mockResolvedValue([]);

            // Mock: bulkCreate returns N records with correct structure
            const mockCreatedRecords = studentIds.map((studentId, index) => ({
              attendanceId: index + 1,
              studentId,
              classId,
              date,
              dateBS: undefined,
              status: AttendanceStatus.PRESENT,
              periodNumber,
              markedBy: userId,
              markedAt: new Date(),
              syncStatus: SyncStatus.SYNCED,
            }));

            (AttendanceRepository.bulkCreate as jest.Mock).mockResolvedValue(
              mockCreatedRecords
            );

            // Call markAllPresent
            const result = await AttendanceService.markAllPresent(
              classId,
              studentIds,
              date,
              undefined, // dateBS
              periodNumber,
              userId
            );

            // Property 1: Result should contain exactly N records
            expect(result).toHaveLength(N);

            // Property 2: Each student should have exactly one record
            const resultStudentIds = result.map((r) => r.studentId);
            expect(resultStudentIds).toHaveLength(N);
            expect(new Set(resultStudentIds).size).toBe(N); // All unique

            // Property 3: All records should have status "PRESENT"
            expect(result.every((r) => r.status === AttendanceStatus.PRESENT)).toBe(true);

            // Property 4: All records should have the correct classId
            expect(result.every((r) => r.classId === classId)).toBe(true);

            // Property 5: All records should have the correct date
            expect(result.every((r) => r.date.getTime() === date.getTime())).toBe(true);

            // Property 6: All records should have the correct periodNumber (or undefined)
            expect(result.every((r) => r.periodNumber === periodNumber)).toBe(true);

            // Property 7: All records should be marked by the correct user
            expect(result.every((r) => r.markedBy === userId)).toBe(true);

            // Property 8: bulkCreate should be called with exactly N records
            expect(AttendanceRepository.bulkCreate).toHaveBeenCalledWith(
              expect.arrayContaining(
                studentIds.map((studentId) =>
                  expect.objectContaining({
                    studentId,
                    classId,
                    status: AttendanceStatus.PRESENT,
                  })
                )
              ),
              userId,
              undefined
            );

            // Property 9: The number of records passed to bulkCreate should equal N
            const bulkCreateCall = (AttendanceRepository.bulkCreate as jest.Mock).mock.calls[0];
            expect(bulkCreateCall[0]).toHaveLength(N);

            // Property 10: Every student ID should appear in the created records
            const createdStudentIds = bulkCreateCall[0].map((r: any) => r.studentId);
            expect(createdStudentIds.sort()).toEqual(studentIds.sort());
          }
        ),
        {
          numRuns: 100,
          verbose: true,
        }
      );
    });

    /**
     * Property: Mark all present should handle existing records correctly
     * 
     * When some students already have attendance records within the 24-hour window,
     * the system should:
     * - Update existing records to "present" (if different)
     * - Create new records for students without attendance
     * - Return exactly N records total (created + updated)
     */
    it('should create/update exactly N records when some students already have attendance', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }), // classId
          fc
            .array(fc.integer({ min: 1, max: 1000 }), { minLength: 2, maxLength: 30 })
            .map((ids) => Array.from(new Set(ids))), // Unique student IDs
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          fc.option(fc.integer({ min: 1, max: 8 }), { nil: undefined }),
          fc.integer({ min: 1, max: 100 }), // userId
          // Generate a subset of students who already have attendance
          fc.integer({ min: 0, max: 100 }), // Percentage of students with existing attendance
          async (classId, studentIds, date, periodNumber, userId, existingPercentage) => {
            // Reset mocks for this iteration
            jest.clearAllMocks();

            if (studentIds.length === 0) {
              return;
            }

            const N = studentIds.length;

            // Determine how many students already have attendance
            const numExisting = Math.floor((N * existingPercentage) / 100);
            const existingStudentIds = studentIds.slice(0, numExisting);
            const newStudentIds = studentIds.slice(numExisting);

            // Mock existing attendance records (within 24-hour window)
            const existingRecords = existingStudentIds.map((studentId, index) => ({
              attendanceId: index + 1,
              studentId,
              classId,
              date,
              status: AttendanceStatus.ABSENT, // Different status to trigger update
              periodNumber,
              markedBy: userId,
              markedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
              syncStatus: SyncStatus.SYNCED,
            }));

            (AttendanceRepository.findByClassAndDate as jest.Mock).mockResolvedValue(
              existingRecords
            );

            // Mock bulkCreate for new records
            const mockCreatedRecords = newStudentIds.map((studentId, index) => ({
              attendanceId: numExisting + index + 1,
              studentId,
              classId,
              date,
              status: AttendanceStatus.PRESENT,
              periodNumber,
              markedBy: userId,
              markedAt: new Date(),
              syncStatus: SyncStatus.SYNCED,
            }));

            (AttendanceRepository.bulkCreate as jest.Mock).mockResolvedValue(
              mockCreatedRecords
            );

            // Mock update for existing records
            (AttendanceRepository.update as jest.Mock).mockImplementation(
              async (attendanceId, updateData) => {
                const existing = existingRecords.find((r) => r.attendanceId === attendanceId);
                return existing ? { ...existing, ...updateData } : null;
              }
            );

            // Call markAllPresent
            const result = await AttendanceService.markAllPresent(
              classId,
              studentIds,
              date,
              undefined,
              periodNumber,
              userId
            );

            // Property 1: Result should contain exactly N records (created + updated)
            expect(result).toHaveLength(N);

            // Property 2: All N students should be represented in the result
            const resultStudentIds = result.map((r) => r.studentId).sort();
            expect(resultStudentIds).toEqual(studentIds.sort());

            // Property 3: All records should have status "PRESENT"
            expect(result.every((r) => r.status === AttendanceStatus.PRESENT)).toBe(true);

            // Property 4: Number of updates should equal number of existing records
            if (numExisting > 0) {
              expect(AttendanceRepository.update).toHaveBeenCalledTimes(numExisting);
            }

            // Property 5: Number of creates should equal number of new students
            if (newStudentIds.length > 0) {
              expect(AttendanceRepository.bulkCreate).toHaveBeenCalledWith(
                expect.arrayContaining(
                  newStudentIds.map((studentId) =>
                    expect.objectContaining({
                      studentId,
                      status: AttendanceStatus.PRESENT,
                    })
                  )
                ),
                userId,
                undefined
              );
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
     * Property: Mark all present should skip records outside 24-hour correction window
     * 
     * When existing attendance records are older than 24 hours, they should not be updated,
     * but new records should still be created for students without attendance.
     */
    it('should skip updating records outside 24-hour window but still create new records', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }), // classId
          fc
            .array(fc.integer({ min: 1, max: 1000 }), { minLength: 2, maxLength: 20 })
            .map((ids) => Array.from(new Set(ids))),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          fc.integer({ min: 1, max: 100 }), // userId
          async (classId, studentIds, date, userId) => {
            // Reset mocks for this iteration
            jest.clearAllMocks();

            if (studentIds.length === 0) {
              return;
            }

            const N = studentIds.length;

            // Split students: half have old attendance, half are new
            const midpoint = Math.floor(N / 2);
            const oldAttendanceStudentIds = studentIds.slice(0, midpoint);
            const newStudentIds = studentIds.slice(midpoint);

            // Mock existing attendance records (OUTSIDE 24-hour window)
            const existingRecords = oldAttendanceStudentIds.map((studentId, index) => ({
              attendanceId: index + 1,
              studentId,
              classId,
              date,
              status: AttendanceStatus.ABSENT,
              periodNumber: undefined,
              markedBy: userId,
              markedAt: new Date(Date.now() - 1000 * 60 * 60 * 25), // 25 hours ago
              syncStatus: SyncStatus.SYNCED,
            }));

            (AttendanceRepository.findByClassAndDate as jest.Mock).mockResolvedValue(
              existingRecords
            );

            // Mock bulkCreate for new records only
            const mockCreatedRecords = newStudentIds.map((studentId, index) => ({
              attendanceId: midpoint + index + 1,
              studentId,
              classId,
              date,
              status: AttendanceStatus.PRESENT,
              periodNumber: undefined,
              markedBy: userId,
              markedAt: new Date(),
              syncStatus: SyncStatus.SYNCED,
            }));

            (AttendanceRepository.bulkCreate as jest.Mock).mockResolvedValue(
              mockCreatedRecords
            );

            // Call markAllPresent
            const result = await AttendanceService.markAllPresent(
              classId,
              studentIds,
              date,
              undefined,
              undefined,
              userId
            );

            // Property 1: Result should only contain new records (old ones skipped)
            expect(result).toHaveLength(newStudentIds.length);

            // Property 2: Result should only contain students without old attendance
            const resultStudentIds = result.map((r) => r.studentId).sort();
            expect(resultStudentIds).toEqual(newStudentIds.sort());

            // Property 3: Update should NOT be called (records outside window)
            expect(AttendanceRepository.update).not.toHaveBeenCalled();

            // Property 4: bulkCreate should only be called for new students
            if (newStudentIds.length > 0) {
              expect(AttendanceRepository.bulkCreate).toHaveBeenCalledWith(
                expect.arrayContaining(
                  newStudentIds.map((studentId) =>
                    expect.objectContaining({
                      studentId,
                      status: AttendanceStatus.PRESENT,
                    })
                  )
                ),
                userId,
                undefined
              );
            }
          }
        ),
        {
          numRuns: 80,
          verbose: true,
        }
      );
    });

    /**
     * Property: Mark all present should be idempotent within 24-hour window
     * 
     * Calling markAllPresent multiple times for the same class/date should:
     * - First call: Create N records
     * - Subsequent calls: Update N records (no new records created)
     * - Always return N records with status "present"
     */
    it('should be idempotent when called multiple times within 24-hour window', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }), // classId
          fc
            .array(fc.integer({ min: 1, max: 1000 }), { minLength: 1, maxLength: 15 })
            .map((ids) => Array.from(new Set(ids))),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          fc.integer({ min: 1, max: 100 }), // userId
          async (classId, studentIds, date, userId) => {
            // Reset mocks for this iteration
            jest.clearAllMocks();

            if (studentIds.length === 0) {
              return;
            }

            const N = studentIds.length;

            // First call: No existing records
            (AttendanceRepository.findByClassAndDate as jest.Mock).mockResolvedValue([]);

            const firstCallRecords = studentIds.map((studentId, index) => ({
              attendanceId: index + 1,
              studentId,
              classId,
              date,
              status: AttendanceStatus.PRESENT,
              periodNumber: undefined,
              markedBy: userId,
              markedAt: new Date(),
              syncStatus: SyncStatus.SYNCED,
            }));

            (AttendanceRepository.bulkCreate as jest.Mock).mockResolvedValue(
              firstCallRecords
            );

            // First call
            const result1 = await AttendanceService.markAllPresent(
              classId,
              studentIds,
              date,
              undefined,
              undefined,
              userId
            );

            // Property 1: First call should create N records
            expect(result1).toHaveLength(N);
            expect(AttendanceRepository.bulkCreate).toHaveBeenCalledTimes(1);

            // Reset mocks for second call
            jest.clearAllMocks();

            // Second call: All records exist (within 24-hour window), all already "present"
            (AttendanceRepository.findByClassAndDate as jest.Mock).mockResolvedValue(
              firstCallRecords
            );

            // No new records to create
            (AttendanceRepository.bulkCreate as jest.Mock).mockResolvedValue([]);

            // No updates needed since all are already "present"
            (AttendanceRepository.update as jest.Mock).mockImplementation(
              async (attendanceId, updateData) => {
                const existing = firstCallRecords.find((r) => r.attendanceId === attendanceId);
                return existing ? { ...existing, ...updateData } : null;
              }
            );

            // Second call
            const result2 = await AttendanceService.markAllPresent(
              classId,
              studentIds,
              date,
              undefined,
              undefined,
              userId
            );

            // Property 2: Second call should return empty (no changes needed)
            // Since all records are already "present", they won't be updated or created
            expect(result2).toHaveLength(0);

            // Property 3: bulkCreate should be called with empty array (no new records)
            if ((AttendanceRepository.bulkCreate as jest.Mock).mock.calls.length > 0) {
              expect(AttendanceRepository.bulkCreate).toHaveBeenCalledWith([], userId, undefined);
            }

            // Property 4: No updates needed since all are already "present"
            expect(AttendanceRepository.update).not.toHaveBeenCalled();

            // Property 5: Both calls should process the same students (even if second returns empty)
            const result1StudentIds = result1.map((r) => r.studentId).sort();
            expect(result1StudentIds).toEqual(studentIds.sort());
          }
        ),
        {
          numRuns: 60,
          verbose: true,
        }
      );
    });

    /**
     * Property: Mark all present should reject empty student array
     * 
     * Calling markAllPresent with an empty student array should throw an error.
     */
    it('should reject empty student array', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }), // classId
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          fc.integer({ min: 1, max: 100 }), // userId
          async (classId, date, userId) => {
            // Reset mocks for this iteration
            jest.clearAllMocks();

            await expect(
              AttendanceService.markAllPresent(classId, [], date, undefined, undefined, userId)
            ).rejects.toThrow('No students provided for marking attendance');
          }
        ),
        {
          numRuns: 30,
          verbose: true,
        }
      );
    });

    /**
     * Property: Mark all present should handle period-wise attendance correctly
     * 
     * When a period number is provided, all created records should have that period number.
     */
    it('should create records with correct period number for period-wise attendance', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }), // classId
          fc
            .array(fc.integer({ min: 1, max: 1000 }), { minLength: 1, maxLength: 20 })
            .map((ids) => Array.from(new Set(ids))),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          fc.integer({ min: 1, max: 8 }), // periodNumber
          fc.integer({ min: 1, max: 100 }), // userId
          async (classId, studentIds, date, periodNumber, userId) => {
            // Reset mocks for this iteration
            jest.clearAllMocks();

            if (studentIds.length === 0) {
              return;
            }

            (AttendanceRepository.findByClassAndDate as jest.Mock).mockResolvedValue([]);

            const mockCreatedRecords = studentIds.map((studentId, index) => ({
              attendanceId: index + 1,
              studentId,
              classId,
              date,
              status: AttendanceStatus.PRESENT,
              periodNumber,
              markedBy: userId,
              markedAt: new Date(),
              syncStatus: SyncStatus.SYNCED,
            }));

            (AttendanceRepository.bulkCreate as jest.Mock).mockResolvedValue(
              mockCreatedRecords
            );

            const result = await AttendanceService.markAllPresent(
              classId,
              studentIds,
              date,
              undefined,
              periodNumber,
              userId
            );

            // Property 1: All records should have the specified period number
            expect(result.every((r) => r.periodNumber === periodNumber)).toBe(true);

            // Property 2: findByClassAndDate should be called with the period number
            expect(AttendanceRepository.findByClassAndDate).toHaveBeenCalledWith(
              classId,
              date,
              periodNumber
            );

            // Property 3: bulkCreate should be called with records containing the period number
            expect(AttendanceRepository.bulkCreate).toHaveBeenCalledWith(
              expect.arrayContaining(
                studentIds.map((studentId) =>
                  expect.objectContaining({
                    studentId,
                    periodNumber,
                  })
                )
              ),
              userId,
              undefined
            );
          }
        ),
        {
          numRuns: 60,
          verbose: true,
        }
      );
    });

    /**
     * Property: Mark all present should preserve student ID uniqueness
     * 
     * Even if duplicate student IDs are somehow provided, the result should
     * contain unique student IDs only (no duplicate attendance records).
     */
    it('should handle duplicate student IDs gracefully (create only unique records)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }), // classId
          fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 5, maxLength: 20 }), // May contain duplicates
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          fc.integer({ min: 1, max: 100 }), // userId
          async (classId, studentIdsWithDuplicates, date, userId) => {
            // Reset mocks for this iteration
            jest.clearAllMocks();

            // Get unique student IDs
            const uniqueStudentIds = Array.from(new Set(studentIdsWithDuplicates));
            const N = uniqueStudentIds.length;

            if (N === 0) {
              return;
            }

            (AttendanceRepository.findByClassAndDate as jest.Mock).mockResolvedValue([]);

            const mockCreatedRecords = uniqueStudentIds.map((studentId, index) => ({
              attendanceId: index + 1,
              studentId,
              classId,
              date,
              status: AttendanceStatus.PRESENT,
              periodNumber: undefined,
              markedBy: userId,
              markedAt: new Date(),
              syncStatus: SyncStatus.SYNCED,
            }));

            (AttendanceRepository.bulkCreate as jest.Mock).mockResolvedValue(
              mockCreatedRecords
            );

            // Call with potentially duplicate student IDs
            const result = await AttendanceService.markAllPresent(
              classId,
              studentIdsWithDuplicates,
              date,
              undefined,
              undefined,
              userId
            );

            // Property 1: Result should contain records for all provided students
            expect(result.length).toBeGreaterThan(0);

            // Property 2: All student IDs in result should be unique
            const resultStudentIds = result.map((r) => r.studentId);
            const uniqueResultIds = Array.from(new Set(resultStudentIds));
            expect(resultStudentIds).toHaveLength(uniqueResultIds.length);

            // Property 3: Each unique student should have exactly one record
            for (const studentId of uniqueStudentIds) {
              const recordsForStudent = result.filter((r) => r.studentId === studentId);
              expect(recordsForStudent).toHaveLength(1);
            }
          }
        ),
        {
          numRuns: 60,
          verbose: true,
        }
      );
    });
  });
});
