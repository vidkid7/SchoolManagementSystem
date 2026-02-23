import 'dotenv/config';
import sequelize from '../config/database';
import User, { UserStatus } from '../models/User.model';
import { logger } from '../utils/logger';

/**
 * Update Admin Password Script
 * Updates the admin user password to Admin@123 and ensures account is active
 */

async function updateAdminPassword(): Promise<void> {
  try {
    logger.info('Starting admin password update...');

    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established');

    // Find admin user
    const admin = await User.findOne({
      where: { username: 'admin' }
    });

    if (!admin) {
      logger.error('Admin user not found!');
      logger.info('Please run the seed script first: npm run seed');
      process.exit(1);
    }

    // Update password and ensure account is active
    admin.password = 'Admin@123';
    admin.status = UserStatus.ACTIVE;
    admin.failedLoginAttempts = 0;
    admin.accountLockedUntil = undefined;
    await admin.save();

    logger.info('✓ Admin account updated successfully');
    logger.info('Username: admin');
    logger.info('Email: admin@school.edu.np');
    logger.info('Password: Admin@123');
    logger.info('Status: ACTIVE');
    logger.info('⚠️  IMPORTANT: Change this password immediately in production!');

    process.exit(0);
  } catch (error) {
    logger.error('Admin password update failed:', error);
    process.exit(1);
  }
}

updateAdminPassword();
