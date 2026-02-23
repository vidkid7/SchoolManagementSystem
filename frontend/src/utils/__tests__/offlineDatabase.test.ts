/**
 * Unit Tests for Offline Database
 */

import {
  db,
  queueAttendance,
  queueGrade,
  getPendingAttendance,
  getPendingGrades,
  getPendingCount,
  updateAttendanceSyncStatus,
  updateGradeSyncStatus,
  cacheStudents,
  getCachedStudentsByClass,
  cacheClasses,
  getCachedClasses,
  clearAllOfflineData,
  getDatabaseStats,
  cleanupSyncedRecords
} from '../offlineDatabase';

describe('Offline Database', () => {
  beforeEach(async () => {
    // Clear all data before each test
    await clearAllOfflineData();
  });

  afterAll(async () => {
    // Clean up after all tests
    await clearAllOfflineData();
    await db.close();
  });

  describe('Attendance Queue', () => {
    it('should queue attendance record', async () => {
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

      const id = await queueAttendance(attendance);

      expect(id).toBeDefined();
      expect(id).toContain('attendance_');

      const pending = await getPendingAttendance();
      expect(pending).toHaveLength(1);
      expect(pending[0].classId).toBe('class-1');
      expect(pending[0].syncStatus).toBe('pending');
      expect(pending[0].retryCount).toBe(0);
    });

    it('should update attendance sync status', async () => {
      const id = await queueAttendance({
        classId: 'class-1',
        date: '2024-01-15',
        dateBS: '2080-10-01',
        records: [{ studentId: 'student-1', status: 'present' as const }],
        markedBy: 'teacher-1'
      });

      await updateAttendanceSyncStatus(id, 'synced');

      const pending = await getPendingAttendance();
      expect(pending).toHaveLength(0);

      const record = await db.attendanceQueue.get(id);
      expect(record?.syncStatus).toBe('synced');
    });

    it('should increment retry count on error', async () => {
      const id = await queueAttendance({
        classId: 'class-1',
        date: '2024-01-15',
        dateBS: '2080-10-01',
        records: [{ studentId: 'student-1', status: 'present' as const }],
        markedBy: 'teacher-1'
      });

      await updateAttendanceSyncStatus(id, 'error', 'Network error');

      const record = await db.attendanceQueue.get(id);
      expect(record?.syncStatus).toBe('error');
      expect(record?.errorMessage).toBe('Network error');
      expect(record?.retryCount).toBe(1);
    });
  });

  describe('Grade Queue', () => {
    it('should queue grade record', async () => {
      const grade = {
        examId: 'exam-1',
        studentId: 'student-1',
        theoryMarks: 75,
        practicalMarks: 20,
        totalMarks: 95,
        enteredBy: 'teacher-1'
      };

      const id = await queueGrade(grade);

      expect(id).toBeDefined();
      expect(id).toContain('grade_');

      const pending = await getPendingGrades();
      expect(pending).toHaveLength(1);
      expect(pending[0].examId).toBe('exam-1');
      expect(pending[0].syncStatus).toBe('pending');
    });

    it('should update grade sync status', async () => {
      const id = await queueGrade({
        examId: 'exam-1',
        studentId: 'student-1',
        totalMarks: 95,
        enteredBy: 'teacher-1'
      });

      await updateGradeSyncStatus(id, 'synced');

      const pending = await getPendingGrades();
      expect(pending).toHaveLength(0);
    });
  });

  describe('Pending Count', () => {
    it('should return total pending count', async () => {
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

      const count = await getPendingCount();
      expect(count).toBe(2);
    });

    it('should not count synced records', async () => {
      const id1 = await queueAttendance({
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

      await updateAttendanceSyncStatus(id1, 'synced');

      const count = await getPendingCount();
      expect(count).toBe(1);
    });
  });

  describe('Student Cache', () => {
    it('should cache students', async () => {
const students = [
        {
          id: 'student-1',
          studentId: 'STU001',
          firstNameEn: 'John',
          lastNameEn: 'Doe',
          currentClass: 10,
          currentSection: 'A',
          rollNumber: 1,
          cachedAt: new Date()
        },
        {
          id: 'student-2',
          studentId: 'STU002',
          firstNameEn: 'Jane',
          lastNameEn: 'Smith',
          currentClass: 10,
          currentSection: 'A',
          rollNumber: 2,
          cachedAt: new Date()
        }
      ];

      await cacheStudents(students);

      const cached = await getCachedStudentsByClass(10, 'A');
      expect(cached).toHaveLength(2);
      expect(cached[0].firstNameEn).toBe('John');
    });

it('should filter students by class and section', async () => {
      const students = [
        {
          id: 'student-1',
          studentId: 'STU001',
          firstNameEn: 'John',
          lastNameEn: 'Doe',
          currentClass: 10,
          currentSection: 'A',
          rollNumber: 1,
          cachedAt: new Date()
        },
        {
          id: 'student-2',
          studentId: 'STU002',
          firstNameEn: 'Jane',
          lastNameEn: 'Smith',
          currentClass: 10,
          currentSection: 'B',
          rollNumber: 1,
          cachedAt: new Date()
        }
      ];

      await cacheStudents(students);

      const cachedA = await getCachedStudentsByClass(10, 'A');
      const cachedB = await getCachedStudentsByClass(10, 'B');

      expect(cachedA).toHaveLength(1);
      expect(cachedB).toHaveLength(1);
      expect(cachedA[0].firstNameEn).toBe('John');
      expect(cachedB[0].firstNameEn).toBe('Jane');
    });
  });

  describe('Class Cache', () => {
    it('should cache classes', async () => {
const classes = [
        {
          id: 'class-1',
          gradeLevel: 10,
          section: 'A',
          shift: 'morning',
          classTeacherId: 'teacher-1',
          cachedAt: new Date()
        },
        {
          id: 'class-2',
          gradeLevel: 10,
          section: 'B',
          shift: 'morning',
          classTeacherId: 'teacher-2',
          cachedAt: new Date()
        }
      ];

      await cacheClasses(classes);

      const cached = await getCachedClasses();
      expect(cached).toHaveLength(2);
      expect(cached[0].gradeLevel).toBe(10);
    });
  });

  describe('Database Stats', () => {
    it('should return accurate statistics', async () => {
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
          rollNumber: 1,
          cachedAt: new Date()
        }
      ]);

await cacheClasses([
        {
          id: 'class-1',
          gradeLevel: 10,
          section: 'A',
          shift: 'morning',
          classTeacherId: 'teacher-1',
          cachedAt: new Date()
        }
      ]);

      const stats = await getDatabaseStats();

      expect(stats.pendingAttendance).toBe(1);
      expect(stats.pendingGrades).toBe(1);
      expect(stats.cachedStudents).toBe(1);
      expect(stats.cachedClasses).toBe(1);
      expect(stats.totalPending).toBe(2);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup old synced records', async () => {
      const id = await queueAttendance({
        classId: 'class-1',
        date: '2024-01-15',
        dateBS: '2080-10-01',
        records: [{ studentId: 'student-1', status: 'present' as const }],
        markedBy: 'teacher-1'
      });

      await updateAttendanceSyncStatus(id, 'synced');

      // Manually set old timestamp (10 days ago)
      const record = await db.attendanceQueue.get(id);
      if (record) {
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 10);
        await db.attendanceQueue.update(id, { timestamp: oldDate });
      }

      await cleanupSyncedRecords(7);

      const allRecords = await db.attendanceQueue.toArray();
      // Should be deleted because it's older than 7 days
      expect(allRecords.filter(r => r.syncStatus === 'synced')).toHaveLength(0);
    });

    it('should not cleanup recent synced records', async () => {
      const id = await queueAttendance({
        classId: 'class-1',
        date: '2024-01-15',
        dateBS: '2080-10-01',
        records: [{ studentId: 'student-1', status: 'present' as const }],
        markedBy: 'teacher-1'
      });

      await updateAttendanceSyncStatus(id, 'synced');

      await cleanupSyncedRecords(7);

      const allRecords = await db.attendanceQueue.toArray();
      expect(allRecords).toHaveLength(1);
    });
  });
});
