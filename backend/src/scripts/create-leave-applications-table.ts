import 'dotenv/config';
import { sequelize } from '../config/database';
import { logger } from '../utils/logger';

async function createLeaveApplicationsTable() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS leave_applications (
        leave_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        student_id INT UNSIGNED NOT NULL,
        start_date DATETIME NOT NULL,
        end_date DATETIME NOT NULL,
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
        INDEX idx_leave_student_id (student_id),
        INDEX idx_leave_status (status),
        INDEX idx_leave_dates (start_date, end_date),
        INDEX idx_leave_applied_by (applied_by),
        INDEX idx_leave_approved_by (approved_by),
        INDEX idx_leave_student_status (student_id, status),
        FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
        FOREIGN KEY (applied_by) REFERENCES users(user_id) ON DELETE RESTRICT,
        FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    logger.info('✅ Leave applications table created successfully');
  } catch (error) {
    logger.error('❌ Error creating leave applications table:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

createLeaveApplicationsTable();
