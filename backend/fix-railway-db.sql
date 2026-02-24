-- Fix Railway Database - Add missing columns
-- Run this if migrations didn't complete properly

-- Add password reset fields if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS password_reset_expires DATETIME NULL;

-- Add index for password reset token
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);

-- Verify the fix
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE
FROM 
    INFORMATION_SCHEMA.COLUMNS 
WHERE 
    TABLE_NAME = 'users' 
    AND COLUMN_NAME IN ('password_reset_token', 'password_reset_expires');
