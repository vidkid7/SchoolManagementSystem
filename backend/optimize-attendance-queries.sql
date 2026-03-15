-- Optimize attendance table queries
-- Add indexes for frequently queried columns

-- Index for date range queries with status
CREATE INDEX IF NOT EXISTS idx_attendance_date_status 
ON attendance(date, status, deleted_at);

-- Index for tenant isolation with date
CREATE INDEX IF NOT EXISTS idx_attendance_tenant_date 
ON attendance(municipality_id, school_config_id, date, deleted_at);

-- Composite index for the exact query pattern being used
CREATE INDEX IF NOT EXISTS idx_attendance_tenant_date_status 
ON attendance(municipality_id, school_config_id, date, status, deleted_at);

-- Index for student lookups
CREATE INDEX IF NOT EXISTS idx_attendance_student 
ON attendance(student_id, date, deleted_at);

-- Index for class lookups
CREATE INDEX IF NOT EXISTS idx_attendance_class 
ON attendance(class_id, date, deleted_at);

-- Show existing indexes
SHOW INDEX FROM attendance;
