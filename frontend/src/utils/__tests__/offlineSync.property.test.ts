/**
 * Property-Based Tests for Offline Sync Service
 * Tests universal properties that should hold for all inputs
 */

import * as fc from 'fast-check';
import axios from 'axios';
import {
  syncOfflineQueue,
  getSyncStatus,
  hasPendingOperations
} from '../offlineSync';
import {
  queueAttendance,
  clearAllOfflineData,
  getPendingCount
} from '../offlineDatabase';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Offline Sync - Property-Based Tests', () => {
  // Setup localStorage mock
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value; },
      clear: () => { store = {}; },
      removeItem: (key: string) => { delete store[key]; }
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  });

  beforeEach(async () => {
    await clearAllOfflineData();
    jest.clearAllMocks();
    localStorageMock.clear();
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
  });

afterAll(async () => {
    await clearAllOfflineData();
  });

  /**
   * Property 19: Offline Attendance Sync Round Trip
   * 
   * **Validates: Requirements 6.13, 28.2, 28.3**
   * 
   * For any attendance records marked while offline, when connectivity is restored,
   * all queued records should be synced to the server and the local queue should be
   * cleared upon successful sync.
   * 
   * This property ensures that:
   * 1. All queued attendance records are sent to the server
   * 2. Upon successful sync, the local queue is cleared (pending count becomes 0)
   * 3. The sync process is idempotent (can be run multiple times safely)
   * 4. The round trip preserves data integrity
   */
  describe('Property 19: Offline Attendance Sync Round Trip', () => {
    // Arbitrary for generating attendance status
    const attendanceStatusArb = fc.constantFrom(
      'present' as const,
      'absent' as const,
      'late' as const,
      'excused' as const
    );

    // Arbitrary for generating a single attendance record
    const attendanceRecordArb = fc.record({
      studentId: fc.string({ minLength: 1, maxLength: 20 }).map(s => `student-${s}`),
      status: attendanceStatusArb,
      periodNumber: fc.option(fc.integer({ min: 1, max: 8 }), { nil: undefined }),
      remarks: fc.option(fc.string({ maxLength: 100 }), { nil: undefined })
    });

    // Arbitrary for generating offline attendance data
    const offlineAttendanceArb = fc.record({
      classId: fc.string({ minLength: 1, maxLength: 20 }).map(s => `class-${s}`),
      date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') })
        .map(d => d.toISOString().split('T')[0]),
dateBS: fc.string({ minLength: 10, maxLength: 10 }).map(() => '2080-10-01'), // Simplified BS date
      records: fc.array(attendanceRecordArb, { minLength: 1, maxLength: 50 }),
      markedBy: fc.string({ minLength: 1, maxLength: 20 }).map(() => 'teacher-default')
    });

    it('should sync all queued attendance records and clear queue on success', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(offlineAttendanceArb, { minLength: 1, maxLength: 10 }),
          async (attendanceList) => {
            // Setup: Clear database before each test
            await clearAllOfflineData();
            jest.clearAllMocks();

            // Mock successful API responses
            mockedAxios.post.mockResolvedValue({ data: { success: true } });

            // Queue all attendance records (simulating offline marking)
            for (const attendance of attendanceList) {
              await queueAttendance(attendance);
            }

            // Verify records are queued
            const pendingCountBefore = await getPendingCount();
            expect(pendingCountBefore).toBe(attendanceList.length);

            // Sync when connectivity is restored
            const result = await syncOfflineQueue();

            // Property assertions:
            // 1. All records should be synced successfully
            expect(result.success).toBe(true);
            expect(result.syncedCount).toBe(attendanceList.length);
            expect(result.failedCount).toBe(0);

            // 2. Queue should be cleared after successful sync
            const pendingCountAfter = await getPendingCount();
            expect(pendingCountAfter).toBe(0);

            // 3. API should be called for each attendance record
            expect(mockedAxios.post).toHaveBeenCalledTimes(attendanceList.length);

            // 4. Each API call should contain the correct data
            // Note: We verify all calls were made with correct structure, but not order
            // since async processing doesn't guarantee order
            const allCalls = mockedAxios.post.mock.calls;
            expect(allCalls).toHaveLength(attendanceList.length);
            
            for (const attendance of attendanceList) {
              // Find a call that matches this attendance record
const matchingCall = allCalls.find(call => {
                const [url, data] = call as [string, any];
                if (url !== '/api/v1/attendance/student/sync') return false;
                if (!data || !data.records) return false;
                
                // Check if this call contains records from this attendance
                return data.records.some((r: any) =>
                  r.classId === attendance.classId &&
                  r.date === attendance.date &&
                  r.markedBy === attendance.markedBy
                );
              });
              
              expect(matchingCall).toBeDefined();
            }

            // 5. Sync status should reflect completion
            const syncStatus = await getSyncStatus();
            expect(syncStatus.isPending).toBe(false);
            expect(syncStatus.pendingCount).toBe(0);
          }
        ),
        {
          numRuns: 20, // Run 20 different test cases
          endOnFailure: true
        }
      );
    });

    it('should handle idempotent sync (running sync multiple times is safe)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(offlineAttendanceArb, { minLength: 1, maxLength: 5 }),
          async (attendanceList) => {
            // Setup
            await clearAllOfflineData();
            jest.clearAllMocks();

            // Mock successful API responses
            mockedAxios.post.mockResolvedValue({ data: { success: true } });

            // Queue attendance records
            for (const attendance of attendanceList) {
              await queueAttendance(attendance);
            }

            // First sync
            const result1 = await syncOfflineQueue();
            expect(result1.success).toBe(true);
            expect(result1.syncedCount).toBe(attendanceList.length);

            // Clear mock calls
            jest.clearAllMocks();

            // Second sync (should have nothing to sync)
            const result2 = await syncOfflineQueue();
            expect(result2.success).toBe(true);
            expect(result2.syncedCount).toBe(0); // Nothing to sync
            expect(mockedAxios.post).not.toHaveBeenCalled(); // No API calls

            // Queue should still be empty
            const pendingCount = await getPendingCount();
            expect(pendingCount).toBe(0);
          }
        ),
        {
          numRuns: 15,
          endOnFailure: true
        }
      );
    });

    it('should preserve data integrity during round trip', async () => {
      await fc.assert(
        fc.asyncProperty(
          offlineAttendanceArb,
          async (attendance) => {
            // Setup
            await clearAllOfflineData();
            jest.clearAllMocks();

// Capture the data sent to API
            let capturedData: any = null;
            mockedAxios.post.mockImplementation(async (_url, data) => {
              capturedData = data;
              return { data: { success: true } };
            });

            // Queue attendance
            await queueAttendance(attendance);

            // Sync
            await syncOfflineQueue();

            // Verify data integrity: all original data should be present in API call
            expect(capturedData).toBeDefined();
            expect(capturedData.records).toHaveLength(attendance.records.length);

            for (let i = 0; i < attendance.records.length; i++) {
              const original = attendance.records[i];
              const synced = capturedData.records[i];

              expect(synced.studentId).toBe(original.studentId);
              expect(synced.status).toBe(original.status);
              expect(synced.classId).toBe(attendance.classId);
              expect(synced.date).toBe(attendance.date);
              expect(synced.dateBS).toBe(attendance.dateBS);
              expect(synced.markedBy).toBe(attendance.markedBy);

              if (original.periodNumber !== undefined) {
                expect(synced.periodNumber).toBe(original.periodNumber);
              }
              if (original.remarks !== undefined) {
                expect(synced.remarks).toBe(original.remarks);
              }
            }
          }
        ),
        {
          numRuns: 25,
          endOnFailure: true
        }
      );
    });

    it('should handle partial failures correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(offlineAttendanceArb, { minLength: 2, maxLength: 5 }),
          fc.integer({ min: 0, max: 4 }), // Index of record that will fail
          async (attendanceList, failIndex) => {
            // Only test if failIndex is within bounds
if (failIndex >= attendanceList.length) {
               return true; // Skip this test case
             }

            // Setup
            await clearAllOfflineData();
            jest.clearAllMocks();

            // Mock API: first failIndex calls succeed, then one fails, rest succeed
            let callCount = 0;
            mockedAxios.post.mockImplementation(async () => {
              const currentCall = callCount++;
              if (currentCall === failIndex) {
                throw new Error('Simulated network error');
              }
              return { data: { success: true } };
            });

            // Queue all attendance records
            for (const attendance of attendanceList) {
              await queueAttendance(attendance);
            }

            // Sync
            const result = await syncOfflineQueue();

            // Property assertions:
            // 1. Should report correct counts
            expect(result.syncedCount).toBe(attendanceList.length - 1);
            expect(result.failedCount).toBe(1);

            // 2. Failed record is marked as 'error', not 'pending'
            // So pending count should be 0, but we can check error records exist
            const pendingCount = await getPendingCount();
            expect(pendingCount).toBe(0); // Failed records are marked 'error', not 'pending'

            // 3. hasPendingOperations should return false (error records are not pending)
            const hasPending = await hasPendingOperations();
            expect(hasPending).toBe(false);

            return true;
          }
        ),
        {
          numRuns: 15,
          endOnFailure: true
        }
      );
    });

    it('should not sync when offline', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(offlineAttendanceArb, { minLength: 1, maxLength: 5 }),
          async (attendanceList) => {
            // Setup
            await clearAllOfflineData();
            jest.clearAllMocks();

            // Set offline
            Object.defineProperty(navigator, 'onLine', {
              writable: true,
              value: false
            });

            // Queue attendance records
            for (const attendance of attendanceList) {
              await queueAttendance(attendance);
            }

            const pendingCountBefore = await getPendingCount();

            // Try to sync while offline
            const result = await syncOfflineQueue();

            // Property assertions:
            // 1. Sync should fail
            expect(result.success).toBe(false);
            expect(result.syncedCount).toBe(0);

            // 2. Queue should remain unchanged
            const pendingCountAfter = await getPendingCount();
            expect(pendingCountAfter).toBe(pendingCountBefore);
            expect(pendingCountAfter).toBe(attendanceList.length);

            // 3. No API calls should be made
            expect(mockedAxios.post).not.toHaveBeenCalled();

            // Restore online status for next test
            Object.defineProperty(navigator, 'onLine', {
              writable: true,
              value: true
            });
          }
        ),
        {
          numRuns: 10,
          endOnFailure: true
        }
      );
    });
  });
});
