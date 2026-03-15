-- Add municipality_id and school_config_id columns to classes table for tenant isolation

ALTER TABLE `classes`
ADD COLUMN `municipality_id` CHAR(36) NULL AFTER `deleted_at`,
ADD COLUMN `school_config_id` CHAR(36) NULL AFTER `municipality_id`,
ADD INDEX `idx_classes_municipality` (`municipality_id`),
ADD INDEX `idx_classes_school_config` (`school_config_id`);

-- Update existing records to set municipality_id and school_config_id from related data
-- This assumes you want to backfill from existing academic_years or other related tables
-- Adjust as needed based on your data structure

UPDATE `classes` c
INNER JOIN `academic_years` ay ON c.academic_year_id = ay.academic_year_id
SET 
  c.municipality_id = ay.municipality_id,
  c.school_config_id = ay.school_config_id
WHERE c.municipality_id IS NULL OR c.school_config_id IS NULL;
