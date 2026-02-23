import 'dotenv/config';
import { sequelize } from '../config/database';
import { logger } from '../utils/logger';

async function createNotificationsTable() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        notification_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED NOT NULL,
        type ENUM('info', 'warning', 'success', 'error') NOT NULL DEFAULT 'info',
        category ENUM('attendance', 'exam', 'fee', 'grade', 'announcement', 'leave', 'library', 'general') NOT NULL DEFAULT 'general',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSON,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        read_at DATETIME,
        expires_at DATETIME,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_notifications_user_id (user_id),
        INDEX idx_notifications_user_read (user_id, is_read),
        INDEX idx_notifications_category (category),
        INDEX idx_notifications_created_at (created_at),
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    logger.info('✅ Notifications table created successfully');
  } catch (error) {
    logger.error('❌ Error creating notifications table:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

createNotificationsTable();
