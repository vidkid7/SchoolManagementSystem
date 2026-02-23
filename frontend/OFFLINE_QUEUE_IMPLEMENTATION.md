# Offline Queue Implementation

## Overview

Task 37.2 implements offline queue functionality using IndexedDB to allow teachers to mark attendance and enter grades even when offline. The system automatically syncs queued operations when connectivity is restored.

## Architecture

### Components

1. **offlineDatabase.ts** - IndexedDB wrapper using Dexie
2. **offlineSync.ts** - Sync service for queued operations
3. **useOfflineQueue.ts** - React hook for offline queue management
4. **usePWA.ts** - Updated to integrate with offline queue

### Database Schema

```typescript
SchoolManagementOfflineDB
├── attendanceQueue
│   ├── id (primary key)
│   ├── classId
│   ├── date
│   ├── dateBS
│   ├── records[]
│   ├── markedBy
│   ├── timestamp
│   ├── syncStatus (pending | synced | error)
│   ├── errorMessage
│   └── retryCount
├── gradeQueue
│   ├── id (primary key)
│   ├── examId
│   ├── studentId
│   ├── theoryMarks
│   ├── practicalMarks
│   ├── totalMarks
│   ├── remarks
│   ├── enteredBy
│   ├── timestamp
│   ├── syncStatus (pending | synced | error)
│   ├── errorMessage
│   └── retryCount
├── cachedStudents
│   ├── id (primary key)
│   ├── studentId
│   ├── firstNameEn
│   ├── lastNameEn
│   ├── currentClass
│   ├── currentSection
│   ├── rollNumber
│   ├── photoUrl
│   └── cachedAt
└── cachedClasses
    ├── id (primary key)
    ├── gradeLevel
    ├── section
    ├── shift
    ├── classTeacherId
    └── cachedAt
```

## Features

### 1. Offline Queue Management

**Queue Attendance:**
```typescript
import { queueAttendance } from '@utils/offlineDatabase';

await queueAttendance({
  classId: 'class-1',
  date: '2024-01-15',
  dateBS: '2080-10-01',
  records: [
    { studentId: 'student-1', status: 'present' },
    { studentId: 'student-2', status: 'absent' }
  ],
  markedBy: 'teacher-1'
});
```

**Queue Grade Entry:**
```typescript
import { queueGrade } from '@utils/offlineDatabase';

await queueGrade({
  examId: 'exam-1',
  studentId: 'student-1',
  theoryMarks: 75,
  practicalMarks: 20,
  totalMarks: 95,
  enteredBy: 'teacher-1'
});
```

### 2. Automatic Sync

The system automatically syncs queued operations when:
- Network connectivity is restored
- User manually triggers sync
- App comes back online

**Auto-sync on reconnection:**
```typescript
import { setupAutoSync } from '@utils/offlineSync';

const cleanup = setupAutoSync(
  () => console.log('Sync started'),
  (result) => console.log('Sync completed:', result)
);

// Cleanup when component unmounts
return cleanup;
```

**Manual sync:**
```typescript
import { triggerManualSync } from '@utils/offlineSync';

const result = await triggerManualSync();
console.log(`Synced: ${result.syncedCount}, Failed: ${result.failedCount}`);
```

### 3. Data Caching

**Cache students for offline access:**
```typescript
import { cacheStudents, getCachedStudentsByClass } from '@utils/offlineDatabase';

// Cache students
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

// Retrieve cached students
const students = await getCachedStudentsByClass(10, 'A');
```

**Cache classes:**
```typescript
import { cacheClasses, getCachedClasses } from '@utils/offlineDatabase';

await cacheClasses([
  {
    id: 'class-1',
    gradeLevel: 10,
    section: 'A',
    shift: 'morning',
    classTeacherId: 'teacher-1'
  }
]);

const classes = await getCachedClasses();
```

### 4. React Hook Integration

**useOfflineQueue Hook:**
```typescript
import { useOfflineQueue } from '@hooks/useOfflineQueue';

function AttendanceComponent() {
  const {
    state,
    queueAttendanceOffline,
    queueGradeOffline,
    triggerSync,
    refreshStatus
  } = useOfflineQueue();

  const handleMarkAttendance = async () => {
    if (!state.isOnline) {
      // Queue for offline sync
      await queueAttendanceOffline({
        classId: 'class-1',
        date: '2024-01-15',
        dateBS: '2080-10-01',
        records: attendanceRecords,
        markedBy: currentUser.id
      });
      
      alert('Attendance queued for sync when online');
    } else {
      // Send directly to API
      await api.post('/api/v1/attendance/student/mark', data);
    }
  };

  return (
    <div>
      {!state.isOnline && (
        <Alert severity="warning">
          You are offline. Changes will be synced when online.
        </Alert>
      )}
      
      {state.pendingCount > 0 && (
        <Chip 
          label={`${state.pendingCount} pending`}
          color="warning"
        />
      )}
      
      {state.isSyncing && <CircularProgress />}
      
      <Button onClick={handleMarkAttendance}>
        Mark Attendance
      </Button>
      
      <Button onClick={triggerSync} disabled={!state.isOnline}>
        Sync Now
      </Button>
    </div>
  );
}
```

## Sync Behavior

### Retry Logic

- Failed sync operations are retried automatically
- Maximum 3 retry attempts per operation
- Retry count is tracked in the database
- Operations exceeding retry limit are marked as failed

### Conflict Resolution

Currently implements **last-write-wins** strategy:
- Local changes always overwrite server data
- No conflict detection or merging
- Future enhancement: implement conflict detection and user prompts

### Error Handling

```typescript
const result = await syncOfflineQueue();

if (!result.success) {
  console.error('Sync errors:', result.errors);
  // result.errors contains:
  // [{ id: 'record-id', type: 'attendance', error: 'error message' }]
}
```

## API Endpoints

The offline queue syncs with these backend endpoints:

**Attendance Sync:**
```
POST /api/v1/attendance/student/sync
Body: {
  records: [
    {
      studentId: string,
      classId: string,
      date: string,
      dateBS: string,
      status: 'present' | 'absent' | 'late' | 'excused',
      periodNumber?: number,
      remarks?: string,
      markedBy: string
    }
  ]
}
```

**Grade Sync:**
```
POST /api/v1/exams/:examId/grades
Body: {
  studentId: string,
  theoryMarks?: number,
  practicalMarks?: number,
  totalMarks: number,
  remarks?: string,
  enteredBy: string
}
```

## Database Maintenance

**Cleanup old synced records:**
```typescript
import { cleanupSyncedRecords } from '@utils/offlineDatabase';

// Delete synced records older than 7 days
await cleanupSyncedRecords(7);
```

**Get database statistics:**
```typescript
import { getDatabaseStats } from '@utils/offlineDatabase';

const stats = await getDatabaseStats();
console.log(stats);
// {
//   pendingAttendance: 5,
//   pendingGrades: 2,
//   cachedStudents: 150,
//   cachedClasses: 12,
//   totalPending: 7
// }
```

**Clear all offline data:**
```typescript
import { clearAllOfflineData } from '@utils/offlineDatabase';

await clearAllOfflineData();
```

## Testing

### Unit Tests

**offlineDatabase.test.ts:**
- Queue management (attendance and grades)
- Sync status updates
- Pending count tracking
- Student and class caching
- Database cleanup

**offlineSync.test.ts:**
- Sync queue processing
- Error handling
- Retry logic
- Online/offline detection
- localStorage integration

### Running Tests

```bash
cd frontend
npm test -- offlineDatabase.test.ts
npm test -- offlineSync.test.ts
```

## Requirements Validation

This implementation satisfies:

- **Requirement 28.1**: Offline-first architecture for attendance marking and grade entry
- **Requirement 28.2**: Queue write operations when network is unavailable
- **Requirement 28.6**: Cache frequently accessed data locally (students, classes)

## Future Enhancements

1. **Background Sync API**: Use Service Worker Background Sync for more reliable syncing
2. **Conflict Detection**: Detect when server data has changed since offline operation
3. **Partial Sync**: Sync operations in batches to handle large queues
4. **Compression**: Compress cached data to reduce storage usage
5. **Encryption**: Encrypt sensitive data in IndexedDB
6. **Sync Priority**: Prioritize critical operations (attendance over grades)
7. **Network Quality Detection**: Adjust sync behavior based on connection speed

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 14+)
- Opera: Full support

IndexedDB is supported in all modern browsers. The implementation uses Dexie.js which provides a consistent API across browsers.

## Storage Limits

- Chrome: ~60% of available disk space
- Firefox: ~50% of available disk space
- Safari: 1GB (can request more)
- Edge: ~60% of available disk space

The app monitors storage usage and can alert users when approaching limits.

## Troubleshooting

**Queue not syncing:**
1. Check network connectivity
2. Verify API endpoints are accessible
3. Check browser console for errors
4. Inspect IndexedDB in DevTools

**Data not persisting:**
1. Check browser storage settings
2. Verify IndexedDB is enabled
3. Check for storage quota exceeded errors

**Sync conflicts:**
1. Currently uses last-write-wins
2. Check server logs for rejected operations
3. Manually resolve conflicts if needed

## Status

✅ Task 37.2 Complete

**Implemented:**
- IndexedDB setup with Dexie
- Attendance queue
- Grade entry queue
- Student and class caching
- Auto-sync on reconnection
- Manual sync trigger
- React hooks for easy integration
- Comprehensive unit tests

**Next Steps:**
- Task 37.3: Implement sync mechanism with conflict resolution
- Task 37.4: Write property tests for offline sync
- Task 37.5: Write unit tests for offline functionality
