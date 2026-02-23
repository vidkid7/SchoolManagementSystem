/**
 * Offline Database using IndexedDB (Dexie)
 * Handles offline queue for attendance and grade entry
 */

import Dexie, { Table } from 'dexie';

// Types for offline queue items
export interface OfflineAttendance {
  id: string;
  classId: string;
  date: string;
  dateBS: string;
  records: Array<{
    studentId: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    periodNumber?: number;
    remarks?: string;
  }>;
  markedBy: string;
  timestamp: Date;
  syncStatus: 'pending' | 'synced' | 'error';
  errorMessage?: string;
  retryCount: number;
}

export interface OfflineGrade {
  id: string;
  examId: string;
  studentId: string;
  theoryMarks?: number;
  practicalMarks?: number;
  totalMarks: number;
  remarks?: string;
  enteredBy: string;
  timestamp: Date;
  syncStatus: 'pending' | 'synced' | 'error';
  errorMessage?: string;
  retryCount: number;
}

export interface CachedStudent {
  id: string;
  studentId: string;
  firstNameEn: string;
  lastNameEn: string;
  currentClass: number;
  currentSection: string;
  rollNumber: number;
  photoUrl?: string;
  cachedAt: Date;
}

export interface CachedClass {
  id: string;
  gradeLevel: number;
  section: string;
  shift: string;
  classTeacherId: string;
  cachedAt: Date;
}

/**
 * Offline Database Schema
 */
class OfflineDatabase extends Dexie {
  attendanceQueue!: Table<OfflineAttendance, string>;
  gradeQueue!: Table<OfflineGrade, string>;
  cachedStudents!: Table<CachedStudent, string>;
  cachedClasses!: Table<CachedClass, string>;

  constructor() {
    super('SchoolManagementOfflineDB');
    
    this.version(1).stores({
      attendanceQueue: 'id, classId, date, syncStatus, timestamp',
      gradeQueue: 'id, examId, studentId, syncStatus, timestamp',
      cachedStudents: 'id, studentId, currentClass, currentSection, [currentClass+currentSection]',
      cachedClasses: 'id, gradeLevel, section'
    });
  }
}

// Singleton instance
export const db = new OfflineDatabase();

/**
 * Queue attendance for offline sync
 */
export async function queueAttendance(
  attendance: Omit<OfflineAttendance, 'id' | 'timestamp' | 'syncStatus' | 'retryCount'>
): Promise<string> {
  const id = `attendance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  await db.attendanceQueue.add({
    ...attendance,
    id,
    timestamp: new Date(),
    syncStatus: 'pending',
    retryCount: 0
  });
  
  return id;
}

/**
 * Queue grade entry for offline sync
 */
export async function queueGrade(
  grade: Omit<OfflineGrade, 'id' | 'timestamp' | 'syncStatus' | 'retryCount'>
): Promise<string> {
  const id = `grade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  await db.gradeQueue.add({
    ...grade,
    id,
    timestamp: new Date(),
    syncStatus: 'pending',
    retryCount: 0
  });
  
  return id;
}

/**
 * Get all pending attendance records
 */
export async function getPendingAttendance(): Promise<OfflineAttendance[]> {
  return await db.attendanceQueue
    .where('syncStatus')
    .equals('pending')
    .toArray();
}

/**
 * Get all pending grade records
 */
export async function getPendingGrades(): Promise<OfflineGrade[]> {
  return await db.gradeQueue
    .where('syncStatus')
    .equals('pending')
    .toArray();
}

/**
 * Get total pending count
 */
export async function getPendingCount(): Promise<number> {
  const attendanceCount = await db.attendanceQueue
    .where('syncStatus')
    .equals('pending')
    .count();
  
  const gradeCount = await db.gradeQueue
    .where('syncStatus')
    .equals('pending')
    .count();
  
  return attendanceCount + gradeCount;
}

/**
 * Update attendance sync status
 */
export async function updateAttendanceSyncStatus(
  id: string,
  status: 'synced' | 'error',
  errorMessage?: string
): Promise<void> {
  const record = await db.attendanceQueue.get(id);
  if (record) {
    await db.attendanceQueue.update(id, {
      syncStatus: status,
      errorMessage,
      retryCount: status === 'error' ? record.retryCount + 1 : record.retryCount
    });
  }
}

/**
 * Update grade sync status
 */
export async function updateGradeSyncStatus(
  id: string,
  status: 'synced' | 'error',
  errorMessage?: string
): Promise<void> {
  const record = await db.gradeQueue.get(id);
  if (record) {
    await db.gradeQueue.update(id, {
      syncStatus: status,
      errorMessage,
      retryCount: status === 'error' ? record.retryCount + 1 : record.retryCount
    });
  }
}

/**
 * Delete synced records older than specified days
 */
export async function cleanupSyncedRecords(daysOld: number = 7): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  const cutoffTime = cutoffDate.getTime();
  
  await db.attendanceQueue
    .where('syncStatus')
    .equals('synced')
    .and(record => {
      const recordTime = record.timestamp instanceof Date 
        ? record.timestamp.getTime() 
        : new Date(record.timestamp).getTime();
      return recordTime < cutoffTime;
    })
    .delete();
  
  await db.gradeQueue
    .where('syncStatus')
    .equals('synced')
    .and(record => {
      const recordTime = record.timestamp instanceof Date 
        ? record.timestamp.getTime() 
        : new Date(record.timestamp).getTime();
      return recordTime < cutoffTime;
    })
    .delete();
}

/**
 * Cache students for offline access
 */
export async function cacheStudents(students: CachedStudent[]): Promise<void> {
  const studentsWithTimestamp = students.map(s => ({
    ...s,
    cachedAt: new Date()
  }));
  
  await db.cachedStudents.bulkPut(studentsWithTimestamp);
}

/**
 * Get cached students by class
 */
export async function getCachedStudentsByClass(
  gradeLevel: number,
  section: string
): Promise<CachedStudent[]> {
  return await db.cachedStudents
    .where('[currentClass+currentSection]')
    .equals([gradeLevel, section])
    .toArray();
}

/**
 * Cache classes for offline access
 */
export async function cacheClasses(classes: CachedClass[]): Promise<void> {
  const classesWithTimestamp = classes.map(c => ({
    ...c,
    cachedAt: new Date()
  }));
  
  await db.cachedClasses.bulkPut(classesWithTimestamp);
}

/**
 * Get all cached classes
 */
export async function getCachedClasses(): Promise<CachedClass[]> {
  return await db.cachedClasses.toArray();
}

/**
 * Clear all offline data (for testing/reset)
 */
export async function clearAllOfflineData(): Promise<void> {
  await db.attendanceQueue.clear();
  await db.gradeQueue.clear();
  await db.cachedStudents.clear();
  await db.cachedClasses.clear();
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{
  pendingAttendance: number;
  pendingGrades: number;
  cachedStudents: number;
  cachedClasses: number;
  totalPending: number;
}> {
  const [pendingAttendance, pendingGrades, cachedStudents, cachedClasses] = await Promise.all([
    db.attendanceQueue.where('syncStatus').equals('pending').count(),
    db.gradeQueue.where('syncStatus').equals('pending').count(),
    db.cachedStudents.count(),
    db.cachedClasses.count()
  ]);
  
  return {
    pendingAttendance,
    pendingGrades,
    cachedStudents,
    cachedClasses,
    totalPending: pendingAttendance + pendingGrades
  };
}
