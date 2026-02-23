# Audit Logging System

## Overview

The audit logging system provides comprehensive tracking of all create, update, delete, and restore operations on student records (and can be extended to other entities). It maintains a complete field-level change history with user attribution, IP addresses, and timestamps.

**Requirements:** 2.9, 38.1, 38.2, 38.6

## Features

- **Complete Audit Trail**: Logs all CRUD operations with before/after states
- **Field-Level Tracking**: Identifies exactly which fields changed in update operations
- **User Attribution**: Tracks which user performed each action
- **IP Address Logging**: Records IP address from request (supports proxy headers)
- **User Agent Tracking**: Stores browser/client information
- **Retention Policy**: Automatically removes logs older than 1 year
- **Efficient Querying**: Indexed for fast retrieval by entity, user, or time range

## Database Schema

```sql
CREATE TABLE audit_logs (
  audit_log_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT UNSIGNED NOT NULL,
  action ENUM('create', 'update', 'delete', 'restore') NOT NULL,
  old_value JSON,
  new_value JSON,
  changed_fields JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSON,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_audit_logs_user_id (user_id),
  INDEX idx_audit_logs_entity (entity_type, entity_id),
  INDEX idx_audit_logs_action (action),
  INDEX idx_audit_logs_timestamp (timestamp),
  INDEX idx_audit_logs_entity_timestamp (entity_type, entity_id, timestamp),
  INDEX idx_audit_logs_user_timestamp (user_id, timestamp)
);
```

## Usage

### Basic Logging

```typescript
import auditLogger from '@utils/auditLogger';

// Log a create operation
await auditLogger.logCreate(
  'student',           // entity type
  studentId,           // entity ID
  student.toJSON(),    // new value
  userId,              // user who performed the action
  req                  // Express request object (optional)
);

// Log an update operation
await auditLogger.logUpdate(
  'student',
  studentId,
  oldValue,            // previous state
  newValue,            // new state
  userId,
  req
);

// Log a delete operation
await auditLogger.logDelete(
  'student',
  studentId,
  oldValue,            // state before deletion
  userId,
  req
);

// Log a restore operation
await auditLogger.logRestore(
  'student',
  studentId,
  newValue,            // restored state
  userId,
  req
);
```

### Repository Integration

The student repository automatically logs all operations:

```typescript
// Create student (automatically logged)
const student = await studentRepository.create(
  studentData,
  userId,
  req
);

// Update student (automatically logged with field-level changes)
const updatedStudent = await studentRepository.update(
  studentId,
  updateData,
  userId,
  req
);

// Delete student (automatically logged)
await studentRepository.delete(studentId, userId, req);

// Restore student (automatically logged)
await studentRepository.restore(studentId, userId, req);
```

### Querying Audit Logs

```typescript
// Get all audit logs for a specific student
const { logs, total } = await auditLogger.getEntityAuditLogs(
  'student',
  studentId,
  {
    limit: 50,
    offset: 0,
    action: AuditAction.UPDATE  // optional filter
  }
);

// Get all actions performed by a specific user
const { logs, total } = await auditLogger.getUserAuditLogs(
  userId,
  {
    limit: 50,
    offset: 0,
    entityType: 'student',      // optional filter
    action: AuditAction.CREATE  // optional filter
  }
);
```

### Cleanup Old Logs

The system includes a cleanup script for the 1-year retention policy:

```bash
# Run manually
npx ts-node src/scripts/cleanup-audit-logs.ts

# Or schedule as a cron job (recommended: run weekly)
0 2 * * 0 cd /path/to/backend && npx ts-node src/scripts/cleanup-audit-logs.ts
```

## Audit Log Structure

Each audit log entry contains:

```typescript
{
  auditLogId: number;           // Unique identifier
  userId: number | null;        // User who performed the action
  entityType: string;           // Type of entity (e.g., 'student')
  entityId: number;             // ID of the entity
  action: AuditAction;          // 'create', 'update', 'delete', 'restore'
  oldValue: unknown | null;     // Previous state (null for create)
  newValue: unknown | null;     // New state (null for delete)
  changedFields: string[];      // Array of changed field names (for updates)
  ipAddress: string | null;     // IP address of the user
  userAgent: string | null;     // Browser/client information
  metadata: object | null;      // Additional context data
  timestamp: Date;              // When the action was performed
  createdAt: Date;              // When the log was created
}
```

## Changed Fields Detection

For update operations, the system automatically detects which fields changed:

- Compares old and new values field by field
- Handles primitives, dates, objects, and arrays
- Excludes timestamp fields (`updatedAt`, `updated_at`)
- Handles null and undefined values correctly

Example:
```typescript
// Old value
{ name: 'John Doe', email: 'john@example.com', phone: '1234567890' }

// New value
{ name: 'John Smith', email: 'john.smith@example.com', phone: '1234567890' }

// Changed fields
['name', 'email']  // phone is unchanged
```

## IP Address Extraction

The system extracts IP addresses from requests with proxy support:

1. Checks `x-forwarded-for` header (takes first IP if multiple)
2. Checks `x-real-ip` header
3. Falls back to `req.ip`
4. Falls back to `req.socket.remoteAddress`

This ensures accurate IP tracking even behind proxies or load balancers.

## Performance Considerations

- **Indexes**: Multiple indexes ensure fast queries by entity, user, or time
- **Async Logging**: Audit logging doesn't block main operations
- **Batch Cleanup**: Old logs are removed in batches to avoid performance impact
- **JSON Storage**: Uses MySQL JSON type for efficient storage and querying

## Security

- **Immutable Logs**: Audit logs cannot be modified once created
- **User Attribution**: Every action is linked to a user (or null for system actions)
- **IP Tracking**: Helps identify suspicious activity
- **Retention Policy**: Automatic cleanup prevents indefinite data growth

## Extending to Other Entities

To add audit logging to other entities (staff, users, etc.):

1. Update the repository methods to accept `userId` and `req` parameters
2. Call `auditLogger.logCreate/Update/Delete/Restore` in the repository
3. Use the same entity type consistently (e.g., 'staff', 'user')

Example:
```typescript
// In staff.repository.ts
async create(staffData: StaffCreationAttributes, userId?: number, req?: Request): Promise<Staff> {
  const staff = await Staff.create(staffData);
  
  await auditLogger.logCreate(
    'staff',
    staff.staffId,
    staff.toJSON(),
    userId,
    req
  );
  
  return staff;
}
```

## Testing

Comprehensive unit tests are provided in `src/utils/__tests__/auditLogger.test.ts`:

```bash
# Run audit logger tests
npm test -- auditLogger.test.ts

# Run with coverage
npm test -- auditLogger.test.ts --coverage
```

Tests cover:
- All CRUD operations
- Changed fields detection
- IP address extraction
- Pagination and filtering
- Cleanup functionality
- Edge cases (null values, dates, objects)

## Monitoring

Monitor audit logs for:
- Unusual activity patterns
- Failed operations
- Bulk changes
- After-hours modifications
- Changes by specific users

Example query for monitoring:
```sql
-- Find all deletions in the last 24 hours
SELECT * FROM audit_logs
WHERE action = 'delete'
  AND timestamp > DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY timestamp DESC;

-- Find all changes by a specific user
SELECT * FROM audit_logs
WHERE user_id = 123
  AND timestamp > DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY timestamp DESC;
```

## Troubleshooting

### Logs not being created

1. Check that the `audit_logs` table exists
2. Verify the migration ran successfully
3. Ensure `userId` and `req` are passed to repository methods
4. Check application logs for errors

### Performance issues

1. Verify indexes are created
2. Run cleanup script to remove old logs
3. Consider archiving very old logs to a separate table
4. Monitor query performance with `EXPLAIN`

### Disk space concerns

1. Run cleanup script more frequently
2. Adjust retention policy if needed
3. Consider compressing old logs
4. Archive to external storage if necessary

## Future Enhancements

Potential improvements:
- Compress old logs before deletion
- Archive to external storage (S3, etc.)
- Real-time audit log streaming
- Audit log viewer UI in Admin Portal
- Configurable retention policies per entity type
- Audit log export functionality
