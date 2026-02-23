# Attendance Module

This module handles attendance management for the School Management System, supporting both period-wise and day-wise attendance tracking with offline sync capabilities.

## Requirements

- **6.1**: Display student list with photos for attendance marking
- **6.2**: Support marking attendance statuses (Present, Absent, Late, Excused)
- **6.14**: Support period-wise and day-wise attendance modes
- **28.1**: Offline-first architecture with sync status tracking

## Features

### Attendance Model (`AttendanceRecord`)

The `AttendanceRecord` model provides:

- **Period-wise attendance**: Track attendance for specific periods (e.g., Period 1, Period 2)
- **Day-wise attendance**: Track overall daily attendance (periodNumber = null)
- **Offline sync support**: `syncStatus` field tracks sync state (synced, pending, error)
- **Audit trail**: `markedBy` and `markedAt` fields track who marked attendance and when
- **Bikram Sambat support**: Optional `dateBS` field for Nepal calendar system

#### Attendance Statuses

- `PRESENT`: Student is present
- `ABSENT`: Student is absent
- `LATE`: Student arrived late (counts as present for percentage calculation)
- `EXCUSED`: Student has approved leave

#### Sync Statuses

- `SYNCED`: Record is synced with server
- `PENDING`: Record is waiting to be synced (offline mode)
- `ERROR`: Sync failed, needs retry

### Attendance Repository

The repository provides comprehensive CRUD operations and specialized methods:

#### Basic Operations

- `create(attendanceData)`: Create a single attendance record
- `findById(attendanceId)`: Find record by ID
- `update(attendanceId, updateData)`: Update existing record
- `delete(attendanceId)`: Soft delete record
- `bulkCreate(recordsData)`: Create multiple records at once

#### Query Methods

- `findByStudentAndDate(studentId, date, periodNumber?)`: Find attendance for specific student and date
- `findByClassAndDate(classId, date, periodNumber?)`: Find all attendance for a class on a date
- `findByStudentAndDateRange(studentId, dateFrom, dateTo)`: Get attendance history for a student
- `findByClassAndDateRange(classId, dateFrom, dateTo)`: Get attendance history for a class
- `findAll(filters, options)`: Advanced filtering with pagination

#### Attendance Calculation

- `countByStatusForStudent(studentId, dateFrom?, dateTo?)`: Count attendance by status
- `calculateAttendancePercentage(studentId, dateFrom?, dateTo?)`: Calculate attendance percentage
  - Formula: `(present + late) / total × 100`
  - Late counts as present for percentage calculation

#### Offline Sync Support

- `findPendingSync(limit)`: Get records waiting to be synced
- `findErrorSync(limit)`: Get records with sync errors
- `updateSyncStatus(attendanceId, syncStatus)`: Update sync status for a record
- `bulkUpdateSyncStatus(attendanceIds, syncStatus)`: Bulk update sync status

#### Validation

- `attendanceExists(studentId, date, periodNumber?, excludeAttendanceId?)`: Check if attendance already exists
- Prevents duplicate attendance records for same student/date/period

### Model Helper Methods

The `AttendanceRecord` model includes convenient helper methods:

```typescript
// Status checks
attendance.isPresent()      // true for PRESENT or LATE
attendance.isAbsent()       // true for ABSENT
attendance.isExcused()      // true for EXCUSED

// Attendance mode checks
attendance.isPeriodWise()   // true if periodNumber is set
attendance.isDayWise()      // true if periodNumber is null

// Sync status checks
attendance.isSynced()       // true if syncStatus is SYNCED
attendance.isPendingSync()  // true if syncStatus is PENDING
attendance.hasSyncError()   // true if syncStatus is ERROR

// Date formatting
attendance.getFormattedDate()  // Returns AD date in YYYY-MM-DD format
attendance.getDisplayDate()    // Returns BS date if available, otherwise AD
```

## Database Schema

```sql
CREATE TABLE attendance (
  attendance_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  class_id INT UNSIGNED NOT NULL,
  date DATE NOT NULL,
  date_bs VARCHAR(10),
  status ENUM('present', 'absent', 'late', 'excused') NOT NULL DEFAULT 'present',
  period_number INT UNSIGNED,
  marked_by INT UNSIGNED NOT NULL,
  marked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  remarks TEXT,
  sync_status ENUM('synced', 'pending', 'error') NOT NULL DEFAULT 'synced',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by) REFERENCES users(user_id) ON DELETE RESTRICT,
  
  INDEX idx_attendance_student_date (student_id, date),
  INDEX idx_attendance_class_id (class_id),
  INDEX idx_attendance_date (date),
  INDEX idx_attendance_status (status),
  INDEX idx_attendance_marked_by (marked_by),
  INDEX idx_attendance_sync_status (sync_status),
  INDEX idx_attendance_class_date_period (class_id, date, period_number)
);
```

## Usage Examples

### Creating Day-wise Attendance

```typescript
const attendance = await attendanceRepository.create({
  studentId: 1,
  classId: 1,
  date: new Date('2024-01-15'),
  dateBS: '2080-10-01',
  status: AttendanceStatus.PRESENT,
  markedBy: teacherId,
  markedAt: new Date()
});
```

### Creating Period-wise Attendance

```typescript
const attendance = await attendanceRepository.create({
  studentId: 1,
  classId: 1,
  date: new Date('2024-01-15'),
  status: AttendanceStatus.PRESENT,
  periodNumber: 3,  // Period 3
  markedBy: teacherId,
  markedAt: new Date()
});
```

### Bulk Creating Attendance (Mark All Present)

```typescript
const students = [1, 2, 3, 4, 5];
const date = new Date('2024-01-15');

const attendanceRecords = students.map(studentId => ({
  studentId,
  classId: 1,
  date,
  status: AttendanceStatus.PRESENT,
  markedBy: teacherId,
  markedAt: new Date()
}));

await attendanceRepository.bulkCreate(attendanceRecords);
```

### Offline Attendance Marking

```typescript
// Mark attendance offline
const attendance = await attendanceRepository.create({
  studentId: 1,
  classId: 1,
  date: new Date(),
  status: AttendanceStatus.PRESENT,
  markedBy: teacherId,
  markedAt: new Date(),
  syncStatus: SyncStatus.PENDING  // Mark as pending sync
});

// Later, when online, sync pending records
const pendingRecords = await attendanceRepository.findPendingSync(100);

for (const record of pendingRecords) {
  try {
    // Sync to server
    await syncToServer(record);
    
    // Update sync status
    await attendanceRepository.updateSyncStatus(
      record.attendanceId,
      SyncStatus.SYNCED
    );
  } catch (error) {
    // Mark as error if sync fails
    await attendanceRepository.updateSyncStatus(
      record.attendanceId,
      SyncStatus.ERROR
    );
  }
}
```

### Calculating Attendance Percentage

```typescript
// Get attendance percentage for a student
const percentage = await attendanceRepository.calculateAttendancePercentage(
  studentId,
  new Date('2024-01-01'),  // From date
  new Date('2024-01-31')   // To date
);

console.log(`Attendance: ${percentage}%`);

// Get detailed counts
const counts = await attendanceRepository.countByStatusForStudent(
  studentId,
  new Date('2024-01-01'),
  new Date('2024-01-31')
);

console.log(`Present: ${counts.present}`);
console.log(`Absent: ${counts.absent}`);
console.log(`Late: ${counts.late}`);
console.log(`Excused: ${counts.excused}`);
console.log(`Total: ${counts.total}`);
```

### Finding Class Attendance

```typescript
// Get all attendance for a class on a specific date
const records = await attendanceRepository.findByClassAndDate(
  classId,
  new Date('2024-01-15')
);

// Get period-wise attendance
const period1Records = await attendanceRepository.findByClassAndDate(
  classId,
  new Date('2024-01-15'),
  1  // Period 1
);
```

## Testing

Unit tests are provided in `__tests__/attendance.repository.test.ts`.

To run tests:

```bash
npm test -- attendance.repository.test.ts
```

**Note**: Tests require a properly configured MySQL database with all related tables (students, classes, users) created via migrations.

## Future Enhancements

- Biometric device integration (Requirement 6.9)
- Low attendance alerts (Requirement 6.8)
- Attendance correction within 24-hour window (Requirement 6.6)
- Bulk import via Excel (Requirement 6.5)
- Attendance reports generation (Requirement 6.10)

## Leave Application Module

The leave application module provides a complete workflow for managing student leave requests with automatic attendance marking.

### Requirements

- **6.11**: Support leave application submission by students/parents
- **6.12**: Auto-mark attendance as "excused" for approved leave dates

### Features

#### Leave Application Model (`LeaveApplication`)

The `LeaveApplication` model provides:

- **Approval workflow**: pending → approved/rejected
- **Date range support**: Start date and end date for leave period
- **Bikram Sambat support**: Optional BS dates
- **Audit trail**: Tracks who applied and who approved/rejected
- **Notifications**: Automatic SMS notifications on status changes

#### Leave Statuses

- `PENDING`: Leave application is awaiting approval
- `APPROVED`: Leave has been approved
- `REJECTED`: Leave has been rejected

#### Leave Application Service

The service provides comprehensive leave management:

**Application Submission**:
- `applyForLeave(leaveData, userId)`: Submit a new leave application
- Validates date ranges
- Checks for overlapping approved leaves
- Sends notifications to teachers and admins

**Approval Workflow**:
- `approveLeave(leaveId, approvedBy, remarks?)`: Approve a leave application
  - Updates status to APPROVED
  - Auto-marks attendance as EXCUSED for all dates in the leave period
  - Sends approval notification to parents
- `rejectLeave(leaveId, rejectedBy, rejectionReason)`: Reject a leave application
  - Updates status to REJECTED
  - Sends rejection notification with reason to parents

**Auto-Attendance Marking**:
When a leave is approved, the system automatically:
1. Generates all dates in the leave period
2. For each date, either:
   - Creates a new attendance record with status EXCUSED
   - Updates existing attendance record to EXCUSED
3. Adds remarks: "Leave approved: [reason]"

**Query Methods**:
- `getLeaveById(leaveId)`: Get leave application by ID
- `getLeaveApplications(filters, page, limit)`: Get all leaves with pagination
- `getPendingLeaves(studentId?, limit)`: Get pending leave applications
- `getStudentLeaves(studentId, status?)`: Get all leaves for a student
- `getLeaveStatistics(studentId, dateFrom?, dateTo?)`: Get leave statistics

**Cancellation**:
- `cancelLeave(leaveId, userId)`: Cancel a pending leave application
- Only pending applications can be cancelled

### Database Schema

```sql
CREATE TABLE leave_applications (
  leave_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_date_bs VARCHAR(10),
  end_date_bs VARCHAR(10),
  reason TEXT NOT NULL,
  applied_by INT UNSIGNED NOT NULL,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  approved_by INT UNSIGNED,
  approved_at DATETIME,
  rejection_reason TEXT,
  remarks TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (applied_by) REFERENCES users(user_id) ON DELETE RESTRICT,
  FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE RESTRICT,
  
  INDEX idx_leave_student_id (student_id),
  INDEX idx_leave_status (status),
  INDEX idx_leave_dates (start_date, end_date),
  INDEX idx_leave_applied_by (applied_by),
  INDEX idx_leave_approved_by (approved_by),
  INDEX idx_leave_student_status (student_id, status)
);
```

### Usage Examples

#### Applying for Leave

```typescript
const leave = await leaveApplicationService.applyForLeave(
  {
    studentId: 1,
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-01-17'),
    startDateBS: '2080-10-01',
    endDateBS: '2080-10-03',
    reason: 'Family emergency requiring immediate attention',
    remarks: 'Will submit medical certificate upon return'
  },
  parentUserId
);
```

#### Approving Leave

```typescript
const approvedLeave = await leaveApplicationService.approveLeave(
  leaveId,
  teacherUserId,
  'Approved. Please submit medical certificate.'
);

// Attendance is automatically marked as EXCUSED for Jan 15, 16, 17
```

#### Rejecting Leave

```typescript
const rejectedLeave = await leaveApplicationService.rejectLeave(
  leaveId,
  teacherUserId,
  'Insufficient documentation provided'
);
```

#### Getting Pending Leaves

```typescript
// Get all pending leaves
const pendingLeaves = await leaveApplicationService.getPendingLeaves();

// Get pending leaves for a specific student
const studentPendingLeaves = await leaveApplicationService.getPendingLeaves(studentId);
```

#### Getting Leave Statistics

```typescript
const stats = await leaveApplicationService.getLeaveStatistics(
  studentId,
  new Date('2024-01-01'),
  new Date('2024-12-31')
);

console.log(`Pending: ${stats.pending}`);
console.log(`Approved: ${stats.approved}`);
console.log(`Rejected: ${stats.rejected}`);
console.log(`Total approved days: ${stats.totalApprovedDays}`);
```

### Model Helper Methods

The `LeaveApplication` model includes convenient helper methods:

```typescript
// Status checks
leave.isPending()    // true if status is PENDING
leave.isApproved()   // true if status is APPROVED
leave.isRejected()   // true if status is REJECTED

// Duration calculation
leave.getDurationInDays()  // Returns number of days (inclusive)

// Date formatting
leave.getDateRangeString()    // Returns "2024-01-15 to 2024-01-17"
leave.getDisplayDateRange()   // Returns BS dates if available, otherwise AD

// Edit/cancel checks
leave.canEdit()      // true if status is PENDING
leave.canCancel()    // true if status is PENDING
```

### Notifications

The system automatically sends SMS notifications:

**On Application Submission**:
- Notifies class teachers and admins
- Message includes student name, date range, and reason

**On Approval**:
- Notifies parents
- Message confirms approval

**On Rejection**:
- Notifies parents
- Message includes rejection reason

### Testing

Unit tests are provided in `__tests__/leaveApplication.service.test.ts`.

To run tests:

```bash
npm test -- leaveApplication.service.test.ts
```

## Related Modules

- **Student Module**: Provides student data for attendance marking
- **Academic Module**: Provides class and timetable information
- **Auth Module**: Provides teacher/user information for audit trail
- **Notification Module**: Will send alerts for low attendance
