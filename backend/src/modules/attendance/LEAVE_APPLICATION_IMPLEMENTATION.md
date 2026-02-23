# Leave Application Implementation Summary

## Task 13.7: Create Leave Application Functionality

**Status**: ✅ Completed

**Requirements**: 6.11, 6.12

## Overview

This implementation provides a complete leave application workflow for the School Management System, allowing students and parents to apply for leave, teachers to approve/reject applications, and automatically marking attendance as "excused" for approved leave dates.

## Implementation Details

### 1. Database Schema

**Table**: `leave_applications`

Created migration file: `014-create-leave-applications-table.ts`

**Fields**:
- `leave_id`: Primary key (auto-increment)
- `student_id`: Foreign key to students table
- `start_date`, `end_date`: Leave date range (AD)
- `start_date_bs`, `end_date_bs`: Leave date range (Bikram Sambat) - optional
- `reason`: Text field for leave reason (required, 10-1000 characters)
- `applied_by`: Foreign key to users table (student or parent)
- `applied_at`: Timestamp when leave was applied
- `status`: ENUM('pending', 'approved', 'rejected')
- `approved_by`: Foreign key to users table (teacher/admin who approved/rejected)
- `approved_at`: Timestamp when leave was approved/rejected
- `rejection_reason`: Text field for rejection reason (if rejected)
- `remarks`: Additional remarks or notes
- Soft delete support with `deleted_at`
- Audit timestamps: `created_at`, `updated_at`

**Indexes**:
- `idx_leave_student_id`: For student queries
- `idx_leave_status`: For status filtering
- `idx_leave_dates`: For date range queries
- `idx_leave_applied_by`: For applicant queries
- `idx_leave_approved_by`: For approver queries
- `idx_leave_student_status`: Composite index for student + status queries

### 2. Model Layer

**File**: `backend/src/models/LeaveApplication.model.ts`

**Features**:
- TypeScript interfaces for type safety
- Sequelize model with validation
- Helper methods:
  - `isPending()`, `isApproved()`, `isRejected()`: Status checks
  - `getDurationInDays()`: Calculate leave duration
  - `getDateRangeString()`: Format date range
  - `getDisplayDateRange()`: Display BS dates if available
  - `canEdit()`, `canCancel()`: Check if leave can be modified

**Validation**:
- End date must be after or equal to start date (validated in service layer)
- Reason must be 10-1000 characters
- BS dates must match YYYY-MM-DD format

### 3. Repository Layer

**File**: `backend/src/modules/attendance/leaveApplication.repository.ts`

**Features**:
- Complete CRUD operations with audit logging
- Specialized query methods:
  - `findPending()`: Get pending leave applications
  - `findByStudent()`: Get all leaves for a student
  - `findOverlapping()`: Find overlapping leave applications
  - `countByStatusForStudent()`: Get leave statistics
- Pagination support with metadata
- Parameterized queries for SQL injection prevention
- Soft delete support

### 4. Service Layer

**File**: `backend/src/modules/attendance/leaveApplication.service.ts`

**Core Features**:

#### Leave Application Submission
- `applyForLeave()`: Submit new leave application
  - Validates date ranges
  - Checks for overlapping approved leaves
  - Creates leave with PENDING status
  - Sends notifications to teachers and admins

#### Approval Workflow
- `approveLeave()`: Approve a leave application
  - Updates status to APPROVED
  - **Auto-marks attendance as EXCUSED** for all dates in leave period
  - Handles both new and existing attendance records
  - Sends approval notification to parents via SMS

- `rejectLeave()`: Reject a leave application
  - Updates status to REJECTED
  - Requires rejection reason
  - Sends rejection notification to parents via SMS

#### Auto-Attendance Marking (Requirement 6.12)
When a leave is approved, the system automatically:
1. Retrieves student's current class ID
2. Generates all dates in the leave period (inclusive)
3. For each date:
   - Checks if attendance record exists
   - If exists: Updates status to EXCUSED
   - If not exists: Creates new attendance record with EXCUSED status
   - Adds remarks: "Leave approved: [reason]"
4. Logs all operations for audit trail

#### Query Methods
- `getLeaveById()`: Get leave by ID
- `getLeaveApplications()`: Get all leaves with filters and pagination
- `getPendingLeaves()`: Get pending leaves (optionally filtered by student)
- `getStudentLeaves()`: Get all leaves for a student
- `getLeaveStatistics()`: Get leave statistics including total approved days

#### Cancellation
- `cancelLeave()`: Cancel a pending leave application
- Only pending applications can be cancelled
- Soft delete with audit trail

### 5. Notifications (Requirement 6.12)

**SMS Notifications** are sent automatically:

1. **On Application Submission**:
   - Recipients: Class teachers and school admins
   - Message: Student name, date range, and reason

2. **On Approval**:
   - Recipients: Parents (father's phone, then mother's phone)
   - Message: Confirmation of approval

3. **On Rejection**:
   - Recipients: Parents
   - Message: Rejection with reason

**Implementation**:
- Uses existing `smsService` for SMS delivery
- Graceful failure handling (notification failures don't fail main operation)
- Comprehensive logging for debugging

### 6. Testing

**File**: `backend/src/modules/attendance/__tests__/leaveApplication.service.test.ts`

**Test Coverage**: 14 unit tests covering:
- Leave application submission
  - ✅ Successful creation
  - ✅ Date validation (end date before start date)
  - ✅ Overlapping leave detection
- Leave approval
  - ✅ Successful approval with auto-attendance marking
  - ✅ Leave not found error
  - ✅ Non-pending leave error
  - ✅ Updating existing attendance records
- Leave rejection
  - ✅ Successful rejection with reason
  - ✅ Empty rejection reason error
- Pending leaves retrieval
  - ✅ Get all pending leaves
  - ✅ Filter by student ID
- Leave cancellation
  - ✅ Successful cancellation
  - ✅ Non-pending leave error
- Leave statistics
  - ✅ Calculate statistics with approved days

**Test Results**: ✅ All 14 tests passing

### 7. Documentation

**Updated Files**:
- `backend/src/modules/attendance/README.md`: Added comprehensive leave application documentation
  - Database schema
  - Usage examples
  - API documentation
  - Model helper methods
  - Notification details

## Requirements Validation

### Requirement 6.11: Support leave application submission by students/parents
✅ **Implemented**:
- Students/parents can submit leave applications via `applyForLeave()`
- Validates date ranges and checks for overlapping leaves
- Tracks who applied (student or parent)
- Sends notifications to teachers and admins

### Requirement 6.12: Auto-mark attendance as "excused" for approved leave dates
✅ **Implemented**:
- When leave is approved, system automatically marks attendance as EXCUSED
- Handles all dates in the leave period (inclusive)
- Creates new attendance records or updates existing ones
- Adds remarks with leave reason
- Sends notifications to parents on status changes

## Files Created

1. **Model**: `backend/src/models/LeaveApplication.model.ts`
2. **Migration**: `backend/src/migrations/014-create-leave-applications-table.ts`
3. **Repository**: `backend/src/modules/attendance/leaveApplication.repository.ts`
4. **Service**: `backend/src/modules/attendance/leaveApplication.service.ts`
5. **Tests**: `backend/src/modules/attendance/__tests__/leaveApplication.service.test.ts`
6. **Migration Script**: `backend/src/scripts/run-leave-migration.ts`
7. **Documentation**: Updated `backend/src/modules/attendance/README.md`

## Database Migration

Migration successfully executed:
```bash
npx ts-node src/scripts/run-leave-migration.ts up
```

Table `leave_applications` created with all indexes.

## Usage Example

```typescript
// 1. Student/Parent applies for leave
const leave = await leaveApplicationService.applyForLeave(
  {
    studentId: 1,
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-01-17'),
    reason: 'Family emergency requiring immediate attention'
  },
  parentUserId
);
// Status: PENDING
// Notifications sent to teachers and admins

// 2. Teacher approves leave
const approvedLeave = await leaveApplicationService.approveLeave(
  leave.leaveId,
  teacherUserId,
  'Approved. Please submit medical certificate.'
);
// Status: APPROVED
// Attendance automatically marked as EXCUSED for Jan 15, 16, 17
// Notification sent to parents

// 3. Check attendance
const attendance = await attendanceRepository.findByStudentAndDate(
  1,
  new Date('2024-01-15')
);
// attendance.status === AttendanceStatus.EXCUSED
// attendance.remarks === "Leave approved: Family emergency requiring immediate attention"
```

## Integration Points

### Existing Modules
- **Attendance Module**: Auto-marks attendance as EXCUSED
- **Student Module**: Retrieves student details and class information
- **User Module**: Retrieves teacher and admin information for notifications
- **SMS Service**: Sends notifications to parents, teachers, and admins
- **Audit Logger**: Logs all create, update, and delete operations

### Future API Endpoints (Not Implemented Yet)
The following API endpoints should be created in a future task:
- `POST /api/v1/attendance/leave/apply`: Apply for leave
- `GET /api/v1/attendance/leave/pending`: Get pending leave applications
- `PUT /api/v1/attendance/leave/:id/approve`: Approve leave
- `PUT /api/v1/attendance/leave/:id/reject`: Reject leave
- `GET /api/v1/attendance/leave/student/:studentId`: Get student's leaves
- `DELETE /api/v1/attendance/leave/:id`: Cancel leave
- `GET /api/v1/attendance/leave/:id`: Get leave details
- `GET /api/v1/attendance/leave/statistics/:studentId`: Get leave statistics

## Security Considerations

1. **Authorization**: Future API implementation should verify:
   - Students/parents can only apply for their own leaves
   - Teachers can approve/reject leaves for their assigned classes
   - Admins can approve/reject any leave

2. **Validation**:
   - Date ranges validated (end >= start)
   - Overlapping leaves prevented
   - Rejection reason required for rejections
   - Only pending leaves can be approved/rejected/cancelled

3. **Audit Trail**:
   - All operations logged with user ID and timestamp
   - Soft delete preserves historical data
   - Complete change history maintained

## Performance Considerations

1. **Indexes**: Comprehensive indexes for efficient queries
2. **Pagination**: All list queries support pagination (default 20, max 100)
3. **Bulk Operations**: Auto-attendance marking processes multiple dates efficiently
4. **Caching**: Future enhancement could cache pending leave counts

## Error Handling

All service methods include comprehensive error handling:
- Validation errors with descriptive messages
- Database errors logged and re-thrown
- Notification failures logged but don't fail main operation
- Transaction support for data consistency (future enhancement)

## Testing Strategy

- **Unit Tests**: Service layer fully tested with mocked dependencies
- **Integration Tests**: Future enhancement to test with real database
- **Property-Based Tests**: Future enhancement for date range validation

## Next Steps

1. **API Layer**: Create REST API endpoints (controller and routes)
2. **Frontend**: Create UI for leave application submission and approval
3. **Validation Middleware**: Add request validation schemas
4. **Authorization**: Implement role-based access control
5. **Reporting**: Add leave reports and analytics
6. **Email Notifications**: Add email support alongside SMS
7. **Bulk Operations**: Add bulk approval/rejection for admins
8. **Calendar Integration**: Show leaves on calendar view

## Conclusion

Task 13.7 has been successfully completed with full implementation of leave application functionality including:
- ✅ Complete database schema with migration
- ✅ Model, repository, and service layers
- ✅ Approval workflow (pending → approved/rejected)
- ✅ Auto-marking attendance as EXCUSED for approved leaves
- ✅ SMS notifications on status changes
- ✅ Comprehensive unit tests (14 tests, all passing)
- ✅ Complete documentation

The implementation follows best practices:
- Clean architecture with separation of concerns
- Type safety with TypeScript
- Comprehensive error handling
- Audit logging for all operations
- Parameterized queries for security
- Soft delete for data preservation
- Extensive documentation

**Requirements 6.11 and 6.12 are fully satisfied.**
