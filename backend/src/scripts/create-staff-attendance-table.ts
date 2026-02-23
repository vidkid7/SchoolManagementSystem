import 'dotenv/config';
import { sequelize } from '../config/database';
import { logger } from '../utils/logger';

async function createStaffAttendanceTable() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS staff_attendance (
        staff_attendance_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        staff_id INT UNSIGNED NOT NULL,
        date DATE NOT NULL,
        status ENUM('present', 'absent', 'late', 'on_leave', 'half_day') NOT NULL DEFAULT 'present',
        check_in_time TIME,
        check_out_time TIME,
        working_hours DECIMAL(4,2),
        remarks TEXT,
        marked_by INT UNSIGNED,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_staff_attendance_staff_id (staff_id),
        INDEX idx_staff_attendance_date (date),
        INDEX idx_staff_attendance_status (status),
        INDEX idx_staff_attendance_staff_date (staff_id, date),
        FOREIGN KEY (staff_id) REFERENCES staff(staff_id) ON DELETE CASCADE,
        FOREIGN KEY (marked_by) REFERENCES users(user_id) ON DELETE SET NULL,
        UNIQUE KEY unique_staff_date (staff_id, date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    logger.info('✅ Staff attendance table created successfully');
  } catch (error) {
    logger.error('❌ Error creating staff attendance table:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

createStaffAttendanceTable();
