-- Create class_subjects table
CREATE TABLE IF NOT EXISTS `class_subjects` (
  `class_subject_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `class_id` INT UNSIGNED NOT NULL,
  `subject_id` INT UNSIGNED NOT NULL,
  `teacher_id` INT UNSIGNED NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`class_subject_id`),
  UNIQUE KEY `idx_class_subjects_unique` (`class_id`, `subject_id`),
  KEY `idx_class_subjects_class_id` (`class_id`),
  KEY `idx_class_subjects_subject_id` (`subject_id`),
  KEY `idx_class_subjects_teacher_id` (`teacher_id`),
  CONSTRAINT `fk_class_subjects_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_class_subjects_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_class_subjects_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
