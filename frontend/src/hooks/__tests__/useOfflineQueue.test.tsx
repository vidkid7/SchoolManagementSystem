/**
 * Unit Tests for useOfflineQueue Hook
 * Tests queue management, sync mechanism, and conflict resolution
 * 
 * **Validates: Requirements 28.2, 28.3, 28.5**
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import axios from 'axios';
import { useOfflineQueue, useOfflineStats } from '../useOfflineQueue';
import {
  clearAllOfflineData,
  queueAttendance,
  queueGrade,
  db,
  cacheStudents,
  cacheClasses
} from '../../utils/offlineDatabase';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('useOfflineQueue Hook', () => {
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

  describe('Queue Management - Requirement 28.2', () => {
    it('should queue attendance when offline', async () => {
      const { result } = renderHook(() => useOfflineQueue());

      const attendance = {
        classId: 'class-1',
        date: '2024-01-15',
        dateBS: '2080-10-01',
        records: [
          { studentId: 'student-1', status: 'present' as const },
          { studentId: 'student-2', status: 'absent' as const }
        ],
        markedBy: 'teacher-1'
      };

      let queueId: string = '';
      await act(async () => {
        queueId = await result.current.queueAttendanceOffline(attendance);
      });

      expect(queueId).toBeDefined();
      expect(queueId).toContain('attendance_');

      // Verify state is updated
      await waitFor(() => {
        expect(result.current.state.pendingCount).toBe(1);
        expect(result.current.state.isPending).toBe(true);
      });
    });

    it('should queue grade entry when offline', async () => {
      const { result } = renderHook(() => useOfflineQueue());

      const grade = {
        examId: 'exam-1',
        studentId: 'student-1',
        theoryMarks: 75,
        practicalMarks: 20,
        totalMarks: 95,
        enteredBy: 'teacher-1'
      };

      let queueId: string = '';
      await act(async () => {
        queueId = await result.current.queueGradeOffline(grade);
      });

      expect(queueId).toBeDefined();
      expect(queueId).toContain('grade_');

      await waitFor(() => {
        expect(result.current.state.pendingCount).toBe(1);
        expect(result.current.state.isPending).toBe(true);
      });
    });

    it('should track multiple queued operations', async () => {
      const { result } = renderHook(() => useOfflineQueue());

      await act(async () => {
        await result.current.queueAttendanceOffline({
          classId: 'class-1',
          date: '2024-01-15',
          dateBS: '2080-10-01',
          records: [{ studentId: 'student-1', status: 'present' as const }],
          markedBy: 'teacher-1'
        });

        await result.current.queueGradeOffline({
          examId: 'exam-1',
          studentId: 'student-1',
          totalMarks: 95,
          enteredBy: 'teacher-1'
        });

        await result.current.queueAttendanceOffline({
          classId: 'class-2',
          date: '2024-01-15',
          dateBS: '2080-10-01',
          records: [{ studentId: 'student-3', status: 'absent' as const }],
          markedBy: 'teacher-2'
        });
      });

      await waitFor(() => {
        expect(result.current.state.pendingCount).toBe(3);
        expect(result.current.state.isPending).toBe(true);
      });
    });

    it('should update pending count after refresh', async () => {
      // Queue some operations directly
      await queueAttendance({
        classId: 'class-1',
        date: '2024-01-15',
        dateBS: '2080-10-01',
        records: [{ studentId: 'student-1', status: 'present' as const }],
        markedBy: 'teacher-1'
      });

      const { result } = renderHook(() => useOfflineQueue());

      await act(async () => {
        await result.current.refreshStatus();
      });

      await waitFor(() => {
        expect(result.current.state.pendingCount).toBe(1);
      });
    });
  });

  describe('Sync Mechanism - Requirement 28.3', () => {
    it('should sync queued operations when connectivity is restored', async () => {
      // Start offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      const { result } = renderHook(() => useOfflineQueue());

      // Queue operations while offline
      await act(async () => {
        await result.current.queueAttendanceOffline({
          classId: 'class-1',
          date: '2024-01-15',
          dateBS: '2080-10-01',
          records: [{ studentId: 'student-1', status: 'present' as const }],
          markedBy: 'teacher-1'
        });
      });

      await waitFor(() => {
        expect(result.current.state.isOnline).toBe(false);
        expect(result.current.state.pendingCount).toBe(1);
      });

      // Mock successful API response
      mockedAxios.post.mockResolvedValue({ data: { success: true } });

      // Go back online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });

      // Trigger online event
      await act(async () => {
        window.dispatchEvent(new Event('online'));
        // Wait for auto-sync to complete
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await waitFor(() => {
        expect(result.current.state.isOnline).toBe(true);
      }, { timeout: 3000 });

      // Verify sync occurred
      expect(mockedAxios.post).toHaveBeenCalled();
    });

    it('should trigger manual sync', async () => {
      const { result } = renderHook(() => useOfflineQueue());

      // Queue an operation
      await act(async () => {
        await result.current.queueAttendanceOffline({
          classId: 'class-1',
          date: '2024-01-15',
          dateBS: '2080-10-01',
          records: [{ studentId: 'student-1', status: 'present' as const }],
          markedBy: 'teacher-1'
        });
      });

      // Mock successful API response
      mockedAxios.post.mockResolvedValue({ data: { success: true } });

      // Trigger manual sync
      let syncResult: any;
      await act(async () => {
        syncResult = await result.current.triggerSync();
      });

      expect(syncResult.success).toBe(true);
      expect(syncResult.syncedCount).toBe(1);
      expect(mockedAxios.post).toHaveBeenCalled();

      await waitFor(() => {
        expect(result.current.state.pendingCount).toBe(0);
        expect(result.current.state.isPending).toBe(false);
      });
    });

    it('should indicate sync status during sync', async () => {
      const { result } = renderHook(() => useOfflineQueue());

      await act(async () => {
        await result.current.queueAttendanceOffline({
          classId: 'class-1',
          date: '2024-01-15',
          dateBS: '2080-10-01',
          records: [{ studentId: 'student-1', status: 'present' as const }],
          markedBy: 'teacher-1'
        });
      });

      // Mock slow API response
      mockedAxios.post.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: { success: true } }), 100))
      );

      // Start sync
      act(() => {
        result.current.triggerSync();
      });

      // Check that isSyncing is true during sync
      await waitFor(() => {
        expect(result.current.state.isSyncing).toBe(true);
      });

      // Wait for sync to complete
      await waitFor(() => {
        expect(result.current.state.isSyncing).toBe(false);
      }, { timeout: 3000 });
    });

    it('should handle sync errors gracefully', async () => {
      const { result } = renderHook(() => useOfflineQueue());

      await act(async () => {
        await result.current.queueAttendanceOffline({
          classId: 'class-1',
          date: '2024-01-15',
          dateBS: '2080-10-01',
          records: [{ studentId: 'student-1', status: 'present' as const }],
          markedBy: 'teacher-1'
        });
      });

      // Mock API error
      mockedAxios.post.mockRejectedValue(new Error('Network error'));

      // Trigger sync
      await act(async () => {
        try {
          await result.current.triggerSync();
        } catch (error) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.state.syncError).toBeTruthy();
        expect(result.current.state.isSyncing).toBe(false);
      });
    });

    it('should update last sync time after successful sync', async () => {
      const { result } = renderHook(() => useOfflineQueue());

      await act(async () => {
        await result.current.queueAttendanceOffline({
          classId: 'class-1',
          date: '2024-01-15',
          dateBS: '2080-10-01',
          records: [{ studentId: 'student-1', status: 'present' as const }],
          markedBy: 'teacher-1'
        });
      });

      mockedAxios.post.mockResolvedValue({ data: { success: true } });

      const beforeSync = new Date();

      await act(async () => {
        await result.current.triggerSync();
      });

      await waitFor(() => {
        expect(result.current.state.lastSyncTime).toBeTruthy();
        if (result.current.state.lastSyncTime) {
          expect(result.current.state.lastSyncTime.getTime()).toBeGreaterThanOrEqual(beforeSync.getTime());
        }
      });
    });

    it('should not sync when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      const { result } = renderHook(() => useOfflineQueue());

      await act(async () => {
        await result.current.queueAttendanceOffline({
          classId: 'class-1',
          date: '2024-01-15',
          dateBS: '2080-10-01',
          records: [{ studentId: 'student-1', status: 'present' as const }],
          markedBy: 'teacher-1'
        });
      });

      // Try to sync while offline
      await act(async () => {
        try {
          await result.current.triggerSync();
        } catch (error: any) {
          expect(error.message).toContain('offline');
        }
      });

      // Verify no API calls were made
      expect(mockedAxios.post).not.toHaveBeenCalled();

      // Pending count should remain
      await waitFor(() => {
        expect(result.current.state.pendingCount).toBe(1);
      });
    });
  });

  describe('Conflict Resolution - Requirement 28.5', () => {
    it('should handle conflicts with last-write-wins strategy', async () => {
      const { result } = renderHook(() => useOfflineQueue());

      await act(async () => {
        await result.current.queueAttendanceOffline({
          classId: 'class-1',
          date: '2024-01-15',
          dateBS: '2080-10-01',
          records: [{ studentId: 'student-1', status: 'present' as const }],
          markedBy: 'teacher-1'
        });
      });

      // Mock conflict response, then success on retry
      mockedAxios.post
        .mockRejectedValueOnce({
          response: {
            status: 409,
            data: {
              data: { studentId: 'student-1', status: 'absent' }
            }
          }
        })
        .mockResolvedValueOnce({ data: { success: true } });

      let syncResult: any;
      await act(async () => {
        syncResult = await result.current.triggerSync();
      });

      // Should resolve conflict and sync successfully
      expect(syncResult.syncedCount).toBe(1);
      expect(syncResult.conflictCount).toBe(1);
      expect(syncResult.conflicts[0].resolution).toBe('local');

      await waitFor(() => {
        expect(result.current.state.pendingCount).toBe(0);
      });
    });

    it('should report conflicts in sync result', async () => {
      const { result } = renderHook(() => useOfflineQueue());

      await act(async () => {
        await result.current.queueGradeOffline({
          examId: 'exam-1',
          studentId: 'student-1',
          totalMarks: 95,
          enteredBy: 'teacher-1'
        });
      });

      // Mock conflict
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 409,
          data: {
            data: { totalMarks: 90 }
          }
        }
      }).mockResolvedValueOnce({ data: { success: true } });

      let syncResult: any;
      await act(async () => {
        syncResult = await result.current.triggerSync();
      });

      expect(syncResult.conflicts).toHaveLength(1);
      expect(syncResult.conflicts[0].type).toBe('grade');
      expect(syncResult.conflicts[0].localData.totalMarks).toBe(95);
      expect(syncResult.conflicts[0].serverData.totalMarks).toBe(90);
    });
  });

  describe('Online/Offline State Tracking', () => {
    it('should track online state', async () => {
      const { result } = renderHook(() => useOfflineQueue());

      await waitFor(() => {
        expect(result.current.state.isOnline).toBe(true);
      });

      // Go offline
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: false
        });
        window.dispatchEvent(new Event('offline'));
      });

      await waitFor(() => {
        expect(result.current.state.isOnline).toBe(false);
      });

      // Go back online
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: true
        });
        window.dispatchEvent(new Event('online'));
      });

      await waitFor(() => {
        expect(result.current.state.isOnline).toBe(true);
      });
    });

    it('should initialize with correct online state', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      const { result } = renderHook(() => useOfflineQueue());

      expect(result.current.state.isOnline).toBe(false);

      // Restore online state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
    });
  });

  describe('Auto-sync on Reconnection', () => {
    it('should automatically sync when going back online', async () => {
      // Start offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      const { result } = renderHook(() => useOfflineQueue());

      // Queue operations while offline
      await act(async () => {
        await result.current.queueAttendanceOffline({
          classId: 'class-1',
          date: '2024-01-15',
          dateBS: '2080-10-01',
          records: [{ studentId: 'student-1', status: 'present' as const }],
          markedBy: 'teacher-1'
        });
      });

      mockedAxios.post.mockResolvedValue({ data: { success: true } });

      // Go back online
      await act(async () => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: true
        });
        window.dispatchEvent(new Event('online'));
        // Wait for auto-sync
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      // Verify auto-sync occurred
      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalled();
      }, { timeout: 3000 });
    });
  });
});

describe('useOfflineStats Hook', () => {
  beforeEach(async () => {
    await clearAllOfflineData();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await clearAllOfflineData();
  });

  it('should return database statistics', async () => {
    // Add some data
    await queueAttendance({
      classId: 'class-1',
      date: '2024-01-15',
      dateBS: '2080-10-01',
      records: [{ studentId: 'student-1', status: 'present' as const }],
      markedBy: 'teacher-1'
    });

    await queueGrade({
      examId: 'exam-1',
      studentId: 'student-1',
      totalMarks: 95,
      enteredBy: 'teacher-1'
    });

    await cacheStudents([
      {
        id: 'student-1',
        studentId: 'STU001',
        firstNameEn: 'John',
        lastNameEn: 'Doe',
        currentClass: 10,
        currentSection: 'A',
        rollNumber: 1
      }
    ]);

    await cacheClasses([
      {
        id: 'class-1',
        gradeLevel: 10,
        section: 'A',
        shift: 'morning',
        classTeacherId: 'teacher-1'
      }
    ]);

    const { result } = renderHook(() => useOfflineStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.stats.pendingAttendance).toBe(1);
      expect(result.current.stats.pendingGrades).toBe(1);
      expect(result.current.stats.cachedStudents).toBe(1);
      expect(result.current.stats.cachedClasses).toBe(1);
      expect(result.current.stats.totalPending).toBe(2);
    });
  });

  it('should refresh statistics on demand', async () => {
    const { result } = renderHook(() => useOfflineStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Initial stats should be empty
    expect(result.current.stats.totalPending).toBe(0);

    // Add data
    await queueAttendance({
      classId: 'class-1',
      date: '2024-01-15',
      dateBS: '2080-10-01',
      records: [{ studentId: 'student-1', status: 'present' as const }],
      markedBy: 'teacher-1'
    });

    // Refresh
    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.stats.totalPending).toBe(1);
    });
  });

  it('should handle errors gracefully', async () => {
    // Mock database error
    jest.spyOn(db.attendanceQueue, 'where').mockImplementation(() => {
      throw new Error('Database error');
    });

    const { result } = renderHook(() => useOfflineStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should not crash, stats should remain at default values
    expect(result.current.stats.totalPending).toBe(0);

    // Restore mock
    jest.restoreAllMocks();
  });
});
