-- Add deleted_at column to staff table for soft delete support
-- Requirements: 40.3 - Soft delete preservation

USE school_management_system;

-- Check if column exists before adding
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'school_management_system' 
  AND TABLE_NAME = 'staff' 
  AND COLUMN_NAME = 'deleted_at';

-- Add column if it doesn't exist
SET @query = IF(@col_exists = 0,
  'ALTER TABLE staff ADD COLUMN deleted_at DATETIME NULL AFTER updated_at',
  'SELECT "Column deleted_at already exists" AS message');

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Migration completed successfully' AS status;
