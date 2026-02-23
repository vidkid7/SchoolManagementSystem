/**
 * Property-Based Tests for Attendance Service - Correction Time Window
 * 
 * Uses fast-check to verify the 24-hour correction window property
 * across a large number of randomly generated test cases.
 * 
 * Task: 13.4 Write property test for attendance correction window
 * Property 17: Attendance Correction Time Window
 * Validates: Requirements 6.6
 */

import * as fc from 'fast-check';
import AttendanceService from '../attendance.service';
import AttendanceRepository from '../attendance.repository';
import { AttendanceStatus, SyncStatus } from '@models/AttendanceRecord.model';

// Mock the repository
jest.mock('../attendance.repository');

describe('Attendance Service - Correction Window Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('Property 17: Attendance Correction Time Window', () => {
    /**
     * **Validates: Requirements 6.6**
     * 
     * Property: For any attendance record, correction attempts within 24 hours
     * of marking should succeed, while attempts after 24 hours should be rejected
     * with an error message.
     * 
     * This is a critical business rule that ensures:
     * 1. Teachers can correct mistakes within a reasonable timeframe
     * 2. Historical attendance records remain immutable after 24 hours
     * 3. Audit trail integrity is maintained
     * 
     * This test runs 100+ iterations with varying time offsets to verify
     * the property holds across all time ranges.
     */
    it('should allow corrections within 24 hours and reject corrections after 24 hours', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate student ID
          fc.integer({ min: 1, max: 1000 }),
          // Generate class ID
          fc.integer({ min: 1, max: 100 }),
          // Generate attendance date
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          // Generate original status
          fc.constantFrom(
            AttendanceStatus.PRESENT,
            AttendanceStatus.ABSENT,
            AttendanceStatus.LATE,
            AttendanceStatus.EXCUSED
          ),
          // Generate new status (for correction)
          fc.constantFrom(
            AttendanceStatus.PRESENT,
            AttendanceStatus.ABSENT,
            AttendanceStatus.LATE,
            AttendanceStatus.EXCUSED
          ),
          // Generate hours since marked (0-48 hours to test both sides of 24-hour boundary)
          fc.double({ min: 0, max: 48, noNaN: true }),
          // Generate user ID
          fc.integer({ min: 1, max: 100 }),
          async (
            studentId,
            classId,
            date,
            originalStatus,
            newStatus,
            hoursSinceMarked,
            userId
          ) => {
            // Reset mocks for this iteration
            jest.clearAllMocks();

            // Skip invalid dates
            if (isNaN(date.getTime())) {
              return;
            }

            // Calculate when the attendance was originally marked
            const now = new Date();
            const markedAt = new Date(now.getTime() - hoursSinceMarked * 60 * 60 * 1000);

            // Create existing attendance record
            const existingAttendance = {
              attendanceId: 1,
              studentId,
              classId,
              date,
              dateBS: undefined,
              status: originalStatus,
              periodNumber: undefined,
              markedBy: userId,
              markedAt,
              syncStatus: SyncStatus.SYNCED,
            };

            // Mock repository to return existing attendance
            (AttendanceRepository.findByStudentAndDate as jest.Mock).mockResolvedValue(
              existingAttendance
            );

            // Mock repository update
            (AttendanceRepository.update as jest.Mock).mockResolvedValue({
              ...existingAttendance,
              status: newStatus,
              markedAt: now,
            });

            // Determine if correction should be allowed
            const shouldAllowCorrection = hoursSinceMarked <= 24;

            // Attempt to mark attendance (which will try to correct existing record)
            const attendanceData = {
              studentId,
              classId,
              date,
              status: newStatus,
            };

            if (shouldAllowCorrection) {
              // Property 1: Corrections within 24 hours should succeed
              const result = await AttendanceService.markAttendance(
                attendanceData,
                userId
              );

              // Verify the correction was successful
              expect(result).toBeDefined();
              expect(result.status).toBe(newStatus);

              // Verify repository.update was called
              expect(AttendanceRepository.update).toHaveBeenCalledWith(
                existingAttendance.attendanceId,
                expect.objectContaining({
                  status: newStatus,
                  markedBy: userId,
                }),
                userId,
                undefined
              );

              // Verify findByStudentAndDate was called
              expect(AttendanceRepository.findByStudentAndDate).toHaveBeenCalledWith(
                studentId,
                date,
                undefined
              );
            } else {
              // Property 2: Corrections after 24 hours should be rejected
              await expect(
                AttendanceService.markAttendance(attendanceData, userId)
              ).rejects.toThrow(/Attendance correction is only allowed within 24 hours/);

              // Verify repository.update was NOT called
              expect(AttendanceRepository.update).not.toHaveBeenCalled();

              // Verify findByStudentAndDate was called (to check existing record)
              expect(AttendanceRepository.findByStudentAndDate).toHaveBeenCalledWith(
                studentId,
                date,
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
     * Property: Correction window boundary test
     * 
     * Test the exact 24-hour boundary to ensure:
     * - 23.99 hours: Correction allowed
     * - 24.00 hours: Correction allowed (inclusive)
     * - 24.01 hours: Correction rejected
     */
    it('should enforce exact 24-hour boundary for corrections', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 1000 }), // studentId
          fc.integer({ min: 1, max: 100 }), // classId
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          fc.constantFrom(
            AttendanceStatus.PRESENT,
            AttendanceStatus.ABSENT,
            AttendanceStatus.LATE,
            AttendanceStatus.EXCUSED
          ),
          fc.integer({ min: 1, max: 100 }), // userId
          // Test boundary cases: just before, at, and just after 24 hours
          fc.constantFrom(23.99, 24.0, 24.01),
          async (studentId, classId, date, originalStatus, userId, hoursSinceMarked) => {
            jest.clearAllMocks();

            if (isNaN(date.getTime())) {
              return;
            }

            const now = new Date();
            const markedAt = new Date(now.getTime() - hoursSinceMarked * 60 * 60 * 1000);

            const existingAttendance = {
              attendanceId: 1,
              studentId,
              classId,
              date,
              status: originalStatus,
              periodNumber: undefined,
              markedBy: userId,
              markedAt,
              syncStatus: SyncStatus.SYNCED,
            };

            (AttendanceRepository.findByStudentAndDate as jest.Mock).mockResolvedValue(
              existingAttendance
            );

            (AttendanceRepository.update as jest.Mock).mockResolvedValue({
              ...existingAttendance,
              status: AttendanceStatus.PRESENT,
              markedAt: now,
            });

            const attendanceData = {
              studentId,
              classId,
              date,
              status: AttendanceStatus.PRESENT,
            };

            // Property: 24 hours or less should succeed, more than 24 should fail
            if (hoursSinceMarked <= 24.0) {
              const result = await AttendanceService.markAttendance(attendanceData, userId);
              expect(result).toBeDefined();
              expect(AttendanceRepository.update).toHaveBeenCalled();
            } else {
              await expect(
                AttendanceService.markAttendance(attendanceData, userId)
              ).rejects.toThrow(/Attendance correction is only allowed within 24 hours/);
              expect(AttendanceRepository.update).not.toHaveBeenCalled();
            }
          }
        ),
        {
          numRuns: 60,
          verbose: true,
        }
      );
    });

    /**
     * Property: Correction window applies to period-wise attendance
     * 
     * The 24-hour correction window should apply equally to both
     * day-wise and period-wise attendance.
     */
    it('should enforce 24-hour window for period-wise attendance', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 1000 }), // studentId
          fc.integer({ min: 1, max: 100 }), // classId
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          fc.integer({ min: 1, max: 8 }), // periodNumber
          fc.constantFrom(
            AttendanceStatus.PRESENT,
            AttendanceStatus.ABSENT,
            AttendanceStatus.LATE
          ),
          fc.double({ min: 0, max: 48, noNaN: true }), // hoursSinceMarked
          fc.integer({ min: 1, max: 100 }), // userId
          async (
            studentId,
            classId,
            date,
            periodNumber,
            originalStatus,
            hoursSinceMarked,
            userId
          ) => {
            jest.clearAllMocks();

            if (isNaN(date.getTime())) {
              return;
            }

            const now = new Date();
            const markedAt = new Date(now.getTime() - hoursSinceMarked * 60 * 60 * 1000);

            const existingAttendance = {
              attendanceId: 1,
              studentId,
              classId,
              date,
              status: originalStatus,
              periodNumber,
              markedBy: userId,
              markedAt,
              syncStatus: SyncStatus.SYNCED,
            };

            (AttendanceRepository.findByStudentAndDate as jest.Mock).mockResolvedValue(
              existingAttendance
            );

            (AttendanceRepository.update as jest.Mock).mockResolvedValue({
              ...existingAttendance,
              status: AttendanceStatus.PRESENT,
              markedAt: now,
            });

            const attendanceData = {
              studentId,
              classId,
              date,
              status: AttendanceStatus.PRESENT,
              periodNumber,
            };

            const shouldAllowCorrection = hoursSinceMarked <= 24;

            if (shouldAllowCorrection) {
              const result = await AttendanceService.markAttendance(attendanceData, userId);
              expect(result).toBeDefined();
              expect(result.periodNumber).toBe(periodNumber);
              expect(AttendanceRepository.update).toHaveBeenCalled();
            } else {
              await expect(
                AttendanceService.markAttendance(attendanceData, userId)
              ).rejects.toThrow(/Attendance correction is only allowed within 24 hours/);
              expect(AttendanceRepository.update).not.toHaveBeenCalled();
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
     * Property: Multiple corrections within window should all succeed
     * 
     * If multiple corrections are attempted within the 24-hour window,
     * all should succeed (as long as each correction is within 24 hours
     * of the most recent marking time).
     */
    it('should allow multiple corrections within 24-hour window', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 1000 }), // studentId
          fc.integer({ min: 1, max: 100 }), // classId
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          fc.integer({ min: 1, max: 100 }), // userId
          // Generate array of correction attempts (2-5 corrections)
          fc.array(
            fc.record({
              status: fc.constantFrom(
                AttendanceStatus.PRESENT,
                AttendanceStatus.ABSENT,
                AttendanceStatus.LATE,
                AttendanceStatus.EXCUSED
              ),
              hoursAfterPrevious: fc.double({ min: 0.1, max: 5, noNaN: true }), // Each correction 0.1-5 hours after previous
            }),
            { minLength: 2, maxLength: 5 }
          ),
          async (studentId, classId, date, userId, corrections) => {
            jest.clearAllMocks();

            if (isNaN(date.getTime())) {
              return;
            }

            const now = new Date();
            let currentMarkedAt = new Date(now.getTime() - 10 * 60 * 60 * 1000); // Start 10 hours ago

            // Initial attendance record
            let currentAttendance = {
              attendanceId: 1,
              studentId,
              classId,
              date,
              status: AttendanceStatus.PRESENT,
              periodNumber: undefined,
              markedBy: userId,
              markedAt: currentMarkedAt,
              syncStatus: SyncStatus.SYNCED,
            };

            // Attempt each correction
            for (let i = 0; i < corrections.length; i++) {
              const correction = corrections[i];

              // Calculate time of this correction attempt
              const correctionTime = new Date(
                currentMarkedAt.getTime() + correction.hoursAfterPrevious * 60 * 60 * 1000
              );

              // Check if this correction is within 24 hours of last marking
              const hoursSinceMarked =
                (correctionTime.getTime() - currentMarkedAt.getTime()) / (1000 * 60 * 60);

              // Mock repository
              (AttendanceRepository.findByStudentAndDate as jest.Mock).mockResolvedValue(
                currentAttendance
              );

              const updatedAttendance = {
                ...currentAttendance,
                status: correction.status,
                markedAt: correctionTime,
              };

              (AttendanceRepository.update as jest.Mock).mockResolvedValue(updatedAttendance);

              const attendanceData = {
                studentId,
                classId,
                date,
                status: correction.status,
              };

              // Property: All corrections within cumulative 24-hour window should succeed
              if (hoursSinceMarked <= 24) {
                const result = await AttendanceService.markAttendance(attendanceData, userId);
                expect(result).toBeDefined();
                expect(result.status).toBe(correction.status);

                // Update current state for next iteration
                currentAttendance = updatedAttendance;
                currentMarkedAt = correctionTime;
              } else {
                // If we exceed 24 hours, correction should fail
                await expect(
                  AttendanceService.markAttendance(attendanceData, userId)
                ).rejects.toThrow(/Attendance correction is only allowed within 24 hours/);
              }

              jest.clearAllMocks();
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
     * Property: Error message should include original marking timestamp
     * 
     * When a correction is rejected, the error message should include
     * the timestamp when the attendance was originally marked, helping
     * users understand why the correction was rejected.
     */
    it('should include original marking timestamp in error message when correction fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 1000 }), // studentId
          fc.integer({ min: 1, max: 100 }), // classId
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          fc.constantFrom(
            AttendanceStatus.PRESENT,
            AttendanceStatus.ABSENT,
            AttendanceStatus.LATE
          ),
          fc.integer({ min: 1, max: 100 }), // userId
          // Hours since marked (must be > 24 for this test)
          fc.double({ min: 24.1, max: 48, noNaN: true }),
          async (studentId, classId, date, originalStatus, userId, hoursSinceMarked) => {
            jest.clearAllMocks();

            if (isNaN(date.getTime())) {
              return;
            }

            const now = new Date();
            const markedAt = new Date(now.getTime() - hoursSinceMarked * 60 * 60 * 1000);

            const existingAttendance = {
              attendanceId: 1,
              studentId,
              classId,
              date,
              status: originalStatus,
              periodNumber: undefined,
              markedBy: userId,
              markedAt,
              syncStatus: SyncStatus.SYNCED,
            };

            (AttendanceRepository.findByStudentAndDate as jest.Mock).mockResolvedValue(
              existingAttendance
            );

            const attendanceData = {
              studentId,
              classId,
              date,
              status: AttendanceStatus.PRESENT,
            };

            // Property: Error message should contain the original markedAt timestamp
            try {
              await AttendanceService.markAttendance(attendanceData, userId);
              // Should not reach here
              expect(true).toBe(false);
            } catch (error: any) {
              expect(error.message).toContain('Attendance correction is only allowed within 24 hours');
              expect(error.message).toContain(markedAt.toISOString());
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
     * Property: Deletion should also respect 24-hour window
     * 
     * The 24-hour window should apply to deletion operations as well,
     * not just corrections.
     */
    it('should enforce 24-hour window for attendance deletion', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 1000 }), // attendanceId
          fc.integer({ min: 1, max: 100 }), // userId
          fc.double({ min: 0, max: 48, noNaN: true }), // hoursSinceMarked
          async (attendanceId, userId, hoursSinceMarked) => {
            jest.clearAllMocks();

            const now = new Date();
            const markedAt = new Date(now.getTime() - hoursSinceMarked * 60 * 60 * 1000);

            const existingAttendance = {
              attendanceId,
              studentId: 1,
              classId: 1,
              date: new Date(),
              status: AttendanceStatus.PRESENT,
              periodNumber: undefined,
              markedBy: userId,
              markedAt,
              syncStatus: SyncStatus.SYNCED,
            };

            (AttendanceRepository.findById as jest.Mock).mockResolvedValue(existingAttendance);
            (AttendanceRepository.delete as jest.Mock).mockResolvedValue(true);

            const shouldAllowDeletion = hoursSinceMarked <= 24;

            if (shouldAllowDeletion) {
              // Property: Deletion within 24 hours should succeed
              const result = await AttendanceService.deleteAttendance(attendanceId, userId);
              expect(result).toBe(true);
              expect(AttendanceRepository.delete).toHaveBeenCalledWith(
                attendanceId,
                userId,
                undefined
              );
            } else {
              // Property: Deletion after 24 hours should be rejected
              await expect(
                AttendanceService.deleteAttendance(attendanceId, userId)
              ).rejects.toThrow(/Attendance deletion is only allowed within 24 hours/);
              expect(AttendanceRepository.delete).not.toHaveBeenCalled();
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
     * Property: canCorrectAttendance helper should match correction behavior
     * 
     * The canCorrectAttendance helper method should return true/false
     * consistently with whether corrections actually succeed or fail.
     */
    it('should have canCorrectAttendance helper match actual correction behavior', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: 0, max: 48, noNaN: true }), // hoursSinceMarked
          async (hoursSinceMarked) => {
            const now = new Date();
            const markedAt = new Date(now.getTime() - hoursSinceMarked * 60 * 60 * 1000);

            // Call the helper method
            const canCorrect = AttendanceService.canCorrectAttendance(markedAt);

            // Property: Helper should return true if and only if hours <= 24
            const expectedResult = hoursSinceMarked <= 24;
            expect(canCorrect).toBe(expectedResult);
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
