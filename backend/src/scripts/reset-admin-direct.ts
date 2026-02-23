import 'dotenv/config';
import sequelize from '../config/database';
import bcrypt from 'bcrypt';
import { logger } from '../utils/logger';

/**
 * Direct Admin Password Reset Script
 * Directly updates the admin password using raw SQL
 */

async function resetAdminPassword(): Promise<void> {
  try {
    logger.info('Starting direct admin password reset...');

    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established');

    // Hash the new password
    const newPassword = 'Admin@123';
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    logger.info('Password hashed successfully');

    // Update admin user directly with raw SQL
    const [results] = await sequelize.query(
      `UPDATE users 
       SET password = :password, 
           status = 'active',
           failed_login_attempts = 0,
           account_locked_until = NULL,
           updated_at = NOW()
       WHERE username = 'admin'`,
      {
        replacements: { password: hashedPassword }
      }
    );

    logger.info('SQL update executed', { affectedRows: results });

    // Verify the update
    const [users] = await sequelize.query(
      `SELECT username, email, status FROM users WHERE username = 'admin'`
    );

    if (users && users.length > 0) {
      logger.info('✓ Admin account updated successfully');
      logger.info('Admin details:', users[0]);
      logger.info('Username: admin');
      logger.info('Password: Admin@123');
      logger.info('⚠️  IMPORTANT: Change this password immediately in production!');
    } else {
      logger.error('Admin user not found after update!');
    }

    process.exit(0);
  } catch (error) {
    logger.error('Direct admin password reset failed:', error);
    process.exit(1);
  }
}

resetAdminPassword();
