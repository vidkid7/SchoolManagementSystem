# Comprehensive Audit Logging System

## Overview

The School Management System implements comprehensive audit logging to track all critical system activities including authentication attempts, data modifications, administrative actions, and financial transactions. This provides complete accountability and enables security monitoring, compliance, and troubleshooting.

**Requirements:** 38.1, 38.2, 38.3, 38.4

## Features

### 1. Authentication Logging (Requirement 38.1)

All authentication attempts are automatically logged with detailed information:

- **Successful logins**: Username, timestamp, IP address, user agent
- **Failed logins**: Username, failure reason, failed attempt count
- **Account lockouts**: Lockout trigger, duration, failed attempts
- **Password changes**: User ID, timestamp
- **Password resets**: Email, token generation, reset completion

**Implementation**: Handled by `auth.service.ts` using `logSecurityEvent()` function.

### 2. Data Modification Logging (Requirement 38.2)

All create, update, and delete operations on critical entities are logged:

**Logged Entities:**
- Students (create, update, delete, restore, promotion)
- Staff (create, update, delete, assignments)
- Academic data (classes, subjects, timetables, syllabus)
- Attendance records
- Examinations and grades
- Library circulation
- ECA and Sports activities
- Certificates
- Documents

**Logged Information:**
- Entity type and ID
- Action (create, update, delete, restore)
- Old value (for updates and deletes)
- New value (for creates and updates)
- Changed fields (for updates)
- User who performed the action
- Timestamp
- IP address and user agent

**Implementation**: 
- Automatic via `auditMiddleware` for API requests
- Manual via `auditLogger` service in repositories

### 3. Administrative Action Logging (Requirement 38.3)

All administrative actions are logged with full context:

**Logged Actions:**
- Role creation, updates, and deletion
- Permission assignments and removals
- System configuration changes
- Grading scheme modifications
- Attendance rule changes
- Notification template updates
- User registration and role changes
- School information updates

**Implementation**: Handled by `config` module services with explicit audit logging.

### 4. Financial Transaction Logging (Requirement 38.4)

All financial operations are logged for audit trail and compliance:

**Logged Transactions:**
- Payment creation (cash, bank transfer, online)
- Payment refunds
- Invoice generation and updates
- Fee structure changes
- Payment gateway transactions (eSewa, Khalti, IME Pay)
- Installment plan creation and updates
- Fee concessions and waivers

**Logged Information:**
- Transaction type and ID
- Amount and currency
- Payment method
- Student and invoice details
- Receipt number
- Transaction ID (for online payments)
- User who processed the transaction
- Timestamp and IP address

**Implementation**: Enhanced `payment.service.ts` with explicit audit logging.

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Audit Middleware                          │ │
│  │  • Intercepts all modification requests                │ │
│  │  • Categorizes actions (admin, financial, data)        │ │
│  │  • Extracts entity info and user context               │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Audit Logger Service                      │ │
│  │  • logCreate(), logUpdate(), logDelete()               │ │
│  │  • Changed field detection                             │ │
│  │  • IP and user agent extraction                        │ │
│  │  • Query and retention management                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  audit_logs     │
                    │  MySQL Table    │
                    └─────────────────┘
```

### Database Schema

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

### Automatic Logging via Middleware

The audit middleware automatically logs all modification requests:

```typescript
// In app.ts or server.ts
import { auditMiddleware } from '@middleware/auditMiddleware';

app.use(auditMiddleware);
```

The middleware automatically:
- Detects modification operations (POST, PUT, PATCH, DELETE)
- Categorizes actions (administrative, financial, data modification)
- Extracts entity type and ID from the request
- Logs successful operations (2xx status codes)
- Captures IP address and user agent

### Manual Logging in Services

For explicit control, use the audit logger directly:

```typescript
import auditLogger from '@utils/auditLogger';

// Log payment creation
await auditLogger.logCreate(
  'payment',
  payment.paymentId,
  {
    receiptNumber: payment.receiptNumber,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod
  },
  userId
);

// Log configuration update
await auditLogger.logUpdate(
  'system_config',
  configId,
  oldConfig,
  newConfig,
  userId
);

// Log data deletion
await auditLogger.logDelete(
  'student',
  studentId,
  studentData,
  userId
);
```

### Querying Audit Logs

```typescript
// Get all logs for a specific entity
const { logs, total } = await auditLogger.getEntityAuditLogs(
  'student',
  studentId,
  {
    limit: 50,
    offset: 0,
    action: AuditAction.UPDATE  // optional filter
  }
);

// Get all actions by a specific user
const { logs, total } = await auditLogger.getUserAuditLogs(
  userId,
  {
    limit: 50,
    offset: 0,
    entityType: 'payment',      // optional filter
    action: AuditAction.CREATE  // optional filter
  }
);
```

## Audit Log Categories

### 1. Authentication Logs

```json
{
  "entityType": "authentication",
  "action": "create",
  "newValue": {
    "username": "john.doe",
    "success": true,
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

### 2. Data Modification Logs

```json
{
  "entityType": "student",
  "entityId": 123,
  "action": "update",
  "oldValue": {
    "email": "old@example.com",
    "phone": "1234567890"
  },
  "newValue": {
    "email": "new@example.com",
    "phone": "0987654321"
  },
  "changedFields": ["email", "phone"],
  "userId": 1
}
```

### 3. Administrative Action Logs

```json
{
  "entityType": "role",
  "entityId": 5,
  "action": "update",
  "oldValue": {
    "name": "Custom Role",
    "permissions": ["read:students"]
  },
  "newValue": {
    "name": "Updated Role",
    "permissions": ["read:students", "write:students"]
  },
  "changedFields": ["name", "permissions"],
  "metadata": {
    "category": "administrative_action"
  }
}
```

### 4. Financial Transaction Logs

```json
{
  "entityType": "payment",
  "entityId": 456,
  "action": "create",
  "newValue": {
    "receiptNumber": "RCP-2024-00001",
    "amount": 5000,
    "paymentMethod": "esewa",
    "transactionId": "ESW-TXN-123456"
  },
  "metadata": {
    "category": "financial_transaction"
  }
}
```

## Retention and Cleanup

### Retention Policy

- **Default retention**: 1 year (configurable)
- **Automatic cleanup**: Scheduled job removes logs older than retention period
- **Hard delete**: Old logs are permanently removed (not soft deleted)

### Manual Cleanup

```bash
# Run cleanup script manually
npx ts-node src/scripts/cleanup-audit-logs.ts

# Schedule as cron job (recommended: weekly)
0 2 * * 0 cd /path/to/backend && npx ts-node src/scripts/cleanup-audit-logs.ts
```

### Programmatic Cleanup

```typescript
const deletedCount = await auditLogger.cleanupOldLogs();
console.log(`Deleted ${deletedCount} old audit logs`);
```

## Security Considerations

### Immutability

- Audit logs cannot be modified once created
- No update or delete operations allowed on audit logs
- Only cleanup script can remove old logs

### Access Control

- Only School_Admin can view audit logs
- Audit log viewing requires special permission
- API endpoints are protected with role-based authorization

### Data Protection

- Sensitive data (passwords, tokens) is never logged
- Personal information is logged only when necessary
- IP addresses and user agents are captured for security

### Integrity

- All logs include timestamp and user attribution
- Changed fields are automatically detected
- Complete before/after state is preserved

## Monitoring and Alerting

### Key Metrics to Monitor

1. **Failed authentication attempts**: Alert on multiple failures
2. **Unusual activity patterns**: Bulk deletions, after-hours changes
3. **Financial anomalies**: Large refunds, unusual payment patterns
4. **Administrative changes**: Role modifications, permission changes
5. **Data modifications**: Bulk updates, deletions of critical data

### Sample Monitoring Queries

```sql
-- Failed login attempts in last 24 hours
SELECT * FROM audit_logs
WHERE entity_type = 'authentication'
  AND JSON_EXTRACT(new_value, '$.success') = false
  AND timestamp > DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY timestamp DESC;

-- Large financial transactions
SELECT * FROM audit_logs
WHERE entity_type = 'payment'
  AND JSON_EXTRACT(new_value, '$.amount') > 50000
  AND timestamp > DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY timestamp DESC;

-- Administrative changes
SELECT * FROM audit_logs
WHERE entity_type IN ('role', 'permission', 'system_config')
  AND timestamp > DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY timestamp DESC;

-- Bulk deletions
SELECT entity_type, COUNT(*) as delete_count
FROM audit_logs
WHERE action = 'delete'
  AND timestamp > DATE_SUB(NOW(), INTERVAL 1 DAY)
GROUP BY entity_type
HAVING delete_count > 10;
```

## Performance Optimization

### Indexing Strategy

- **Entity lookup**: Index on (entity_type, entity_id)
- **User activity**: Index on (user_id, timestamp)
- **Time-based queries**: Index on timestamp
- **Action filtering**: Index on action

### Query Optimization

- Use pagination for large result sets
- Filter by date range to limit scope
- Use specific entity types when possible
- Leverage composite indexes for common queries

### Storage Management

- Regular cleanup of old logs
- Consider archiving to external storage
- Monitor table size and growth rate
- Use JSON compression for large values

## Compliance and Reporting

### Audit Reports

Generate audit reports for compliance:

```typescript
// Generate monthly audit report
const startDate = new Date('2024-01-01');
const endDate = new Date('2024-01-31');

const logs = await AuditLog.findAll({
  where: {
    timestamp: {
      [Op.between]: [startDate, endDate]
    }
  },
  order: [['timestamp', 'DESC']]
});

// Export to CSV or PDF
```

### Compliance Requirements

- **Data Protection**: Track all access to personal data
- **Financial Audit**: Complete trail of all transactions
- **Security Audit**: All authentication and authorization events
- **Change Management**: All configuration and administrative changes

## Troubleshooting

### Common Issues

**Issue**: Audit logs not being created
- Check that audit middleware is registered
- Verify database connection
- Check for errors in application logs
- Ensure audit_logs table exists

**Issue**: Performance degradation
- Check table size and indexes
- Run cleanup script to remove old logs
- Optimize queries with proper filters
- Consider archiving old data

**Issue**: Missing audit logs
- Verify middleware is before route handlers
- Check that operations are successful (2xx status)
- Ensure entity type and ID are correctly extracted
- Review error logs for audit logging failures

### Debug Mode

Enable detailed audit logging:

```typescript
// In development environment
logger.level = 'debug';

// Audit logger will output detailed information
```

## Future Enhancements

Potential improvements:

- Real-time audit log streaming
- Advanced analytics and visualization
- Anomaly detection using ML
- Export to external SIEM systems
- Configurable retention policies per entity type
- Audit log encryption at rest
- Blockchain-based immutability proof

## References

- Requirements: 38.1, 38.2, 38.3, 38.4
- Implementation: `backend/src/middleware/auditMiddleware.ts`
- Service: `backend/src/utils/auditLogger.ts`
- Model: `backend/src/models/AuditLog.model.ts`
- Tests: `backend/src/utils/__tests__/auditLogger.integration.test.ts`
