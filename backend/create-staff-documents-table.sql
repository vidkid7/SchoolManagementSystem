-- Create staff_documents table with all required columns
CREATE TABLE IF NOT EXISTS `staff_documents` (
  `document_id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `staff_id` INT UNSIGNED NOT NULL,
  `category` ENUM('certificate', 'contract', 'id_proof', 'qualification', 'experience', 'medical', 'other') NOT NULL COMMENT 'Document category',
  `document_name` VARCHAR(200) NOT NULL COMMENT 'User-friendly document name',
  `original_file_name` VARCHAR(255) NOT NULL COMMENT 'Original uploaded file name',
  `document_url` VARCHAR(500) NOT NULL COMMENT 'Relative URL path to the document',
  `file_size` INT UNSIGNED NOT NULL COMMENT 'File size in bytes',
  `mime_type` VARCHAR(100) NOT NULL COMMENT 'MIME type of the document',
  `version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Document version number',
  `is_latest` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Flag indicating if this is the latest version',
  `uploaded_by` INT UNSIGNED NULL COMMENT 'User ID who uploaded the document',
  `description` TEXT NULL COMMENT 'Optional description or notes about the document',
  `expiry_date` DATE NULL COMMENT 'Document expiry date (for contracts, licenses, etc.)',
  `municipality_id` CHAR(36) NULL COMMENT 'Municipality ID for tenant isolation',
  `school_config_id` CHAR(36) NULL COMMENT 'School config ID for tenant isolation',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  
  -- Indexes
  INDEX `idx_staff_documents_staff_id` (`staff_id`),
  INDEX `idx_staff_documents_category` (`category`),
  INDEX `idx_staff_documents_is_latest` (`is_latest`),
  INDEX `idx_staff_documents_staff_category_latest` (`staff_id`, `category`, `is_latest`),
  INDEX `idx_staff_documents_expiry_date` (`expiry_date`),
  INDEX `idx_staff_documents_municipality` (`municipality_id`),
  INDEX `idx_staff_documents_school_config` (`school_config_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
