/**
 * Unit Tests for Offline Sync Service
 */

import axios from 'axios';
import {
  syncOfflineQueue,
  getSyncStatus,
  hasPendingOperations
} from '../offlineSync';
import {
  queueAttendance,
  queueGrade,
  clearAllOfflineData,
  db
} from '../offlineDatabase';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Offline Sync Service', () => {
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
    await db.close();
  });

  describe('syncOfflineQueue', () => {
    it('should sync pending attendance records', async () => {
      await queueAttendance({
        classId: 'class-1',
        date: '2024-01-15',
        dateBS: '2080-10-01',
        records: [
          { studentId: 'student-1', status: 'present' as const },
          { studentId: 'student-2', status: 'absent' as const }
        ],
        markedBy: 'teacher-1'
      });

      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      const result = await syncOfflineQueue();

      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(result.conflictCount).toBe(0);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/v1/attendance/student/sync',
        expect.objectContaining({
          records: expect.arrayContaining([
            expect.objectContaining({
              studentId: 'student-1',
              status: 'present'
            })
          ])
        })
      );
    });

    it('should sync pending grade records', async () => {
      await queueGrade({
        examId: 'exam-1',
        studentId: 'student-1',
        theoryMarks: 75,
        practicalMarks: 20,
        totalMarks: 95,
        enteredBy: 'teacher-1'
      });

      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      const result = await syncOfflineQueue();

      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(result.conflictCount).toBe(0);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/v1/exams/exam-1/grades',
        expect.objectContaining({
          studentId: 'student-1',
          totalMarks: 95
        })
      );
    });

    it('should handle sync errors', async () => {
      await queueAttendance({
        classId: 'class-1',
        date: '2024-01-15',
        dateBS: '2080-10-01',
        records: [{ studentId: 'student-1', status: 'present' as const }],
        markedBy: 'teacher-1'
      });

      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      const result = await syncOfflineQueue();

      expect(result.success).toBe(false);
      expect(result.syncedCount).toBe(0);
      expect(result.failedCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe('Network error');
    });

    it('should not sync when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      await queueAttendance({
        classId: 'class-1',
        date: '2024-01-15',
        dateBS: '2080-10-01',
        records: [{ studentId: 'student-1', status: 'present' as const }],
        markedBy: 'teacher-1'
      });

      const result = await syncOfflineQueue();

      expect(result.success).toBe(false);
      expect(result.syncedCount).toBe(0);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should skip records that exceeded retry limit', async () => {
      const id = await queueAttendance({
        classId: 'class-1',
        date: '2024-01-15',
        dateBS: '2080-10-01',
        records: [{ studentId: 'student-1', status: 'present' as const }],
        markedBy: 'teacher-1'
      });

      // Manually set retry count to 3
      await db.attendanceQueue.update(id, { retryCount: 3 });

      const result = await syncOfflineQueue();

      expect(result.failedCount).toBe(1);
      expect(result.errors[0].error).toBe('Max retry count exceeded');
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should sync multiple records', async () => {
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

      mockedAxios.post.mockResolvedValue({ data: { success: true } });

      const result = await syncOfflineQueue();

      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(2);
      expect(result.failedCount).toBe(0);
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });

    it('should handle conflicts with last-write-wins strategy', async () => {
      await queueAttendance({
        classId: 'class-1',
        date: '2024-01-15',
        dateBS: '2080-10-01',
        records: [{ studentId: 'student-1', status: 'present' as const }],
        markedBy: 'teacher-1'
      });

      // First call returns conflict
      mockedAxios.post
        .mockRejectedValueOnce({
          response: {
            status: 409,
            data: {
              data: { studentId: 'student-1', status: 'absent' }
            }
          }
        })
        // Second call with forceUpdate succeeds
        .mockResolvedValueOnce({ data: { success: true } });

      const result = await syncOfflineQueue(undefined, 'last-write-wins');

      expect(result.syncedCount).toBe(1);
      expect(result.conflictCount).toBe(1);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].resolution).toBe('local');
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
      // Second call should have forceUpdate
      expect(mockedAxios.post).toHaveBeenLastCalledWith(
        '/api/v1/attendance/student/sync',
        expect.objectContaining({
          forceUpdate: true
        })
      );
    });

    it('should handle conflicts with server-wins strategy', async () => {
      await queueAttendance({
        classId: 'class-1',
        date: '2024-01-15',
        dateBS: '2080-10-01',
        records: [{ studentId: 'student-1', status: 'present' as const }],
        markedBy: 'teacher-1'
      });

      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 409,
          data: {
            data: { studentId: 'student-1', status: 'absent' }
          }
        }
      });

      const result = await syncOfflineQueue(undefined, 'server-wins');

      expect(result.syncedCount).toBe(1);
      expect(result.conflictCount).toBe(1);
      expect(result.conflicts[0].resolution).toBe('server');
      // Should not retry with forceUpdate
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });

    it('should report sync progress', async () => {
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

      mockedAxios.post.mockResolvedValue({ data: { success: true } });

      const progressUpdates: any[] = [];
      await syncOfflineQueue((progress) => {
        progressUpdates.push(progress);
      });

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].stage).toBe('starting');
      expect(progressUpdates.some(p => p.stage === 'syncing-attendance')).toBe(true);
      expect(progressUpdates.some(p => p.stage === 'syncing-grades')).toBe(true);
      expect(progressUpdates[progressUpdates.length - 1].stage).toBe('complete');
    });

    it('should display clear sync status in progress messages', async () => {
      await queueAttendance({
        classId: 'class-1',
        date: '2024-01-15',
        dateBS: '2080-10-01',
        records: [{ studentId: 'student-1', status: 'present' as const }],
        markedBy: 'teacher-1'
      });

      mockedAxios.post.mockResolvedValue({ data: { success: true } });

      const progressMessages: string[] = [];
      await syncOfflineQueue((progress) => {
        progressMessages.push(progress.message);
      });

      expect(progressMessages.some(m => m.includes('Starting sync'))).toBe(true);
      expect(progressMessages.some(m => m.includes('Syncing'))).toBe(true);
      expect(progressMessages.some(m => m.includes('complete'))).toBe(true);
    });
  });

  describe('getSyncStatus', () => {
    it('should return sync status', async () => {
      await queueAttendance({
        classId: 'class-1',
        date: '2024-01-15',
        dateBS: '2080-10-01',
        records: [{ studentId: 'student-1', status: 'present' as const }],
        markedBy: 'teacher-1'
      });

      const status = await getSyncStatus();

      expect(status.isPending).toBe(true);
      expect(status.pendingCount).toBe(1);
    });

    it('should return last sync time from localStorage', async () => {
      const lastSyncTime = new Date('2024-01-15T10:00:00Z');
      localStorage.setItem('lastSyncTime', lastSyncTime.toISOString());

      const status = await getSyncStatus();

      expect(status.lastSyncTime).toEqual(lastSyncTime);
    });

    it('should return null for last sync time if not set', async () => {
      const status = await getSyncStatus();

      expect(status.lastSyncTime).toBeNull();
    });
  });

  describe('hasPendingOperations', () => {
    it('should return true when there are pending operations', async () => {
      await queueAttendance({
        classId: 'class-1',
        date: '2024-01-15',
        dateBS: '2080-10-01',
        records: [{ studentId: 'student-1', status: 'present' as const }],
        markedBy: 'teacher-1'
      });

      const hasPending = await hasPendingOperations();

      expect(hasPending).toBe(true);
    });

    it('should return false when there are no pending operations', async () => {
      const hasPending = await hasPendingOperations();

      expect(hasPending).toBe(false);
    });
  });
});
