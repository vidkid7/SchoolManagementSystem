import 'dotenv/config';
import sequelize from '../config/database';
import User, { UserRole, UserStatus } from '../models/User.model';
import { logger } from '../utils/logger';

/**
 * Update Admin Password Script
 * Updates an explicitly selected administrator account using operator-provided credentials.
 */

async function updateAdminPassword(): Promise<void> {
  try {
    logger.info('Starting admin password update...');

    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established');

    const username = process.env.ADMIN_USERNAME?.trim();
    const newPassword = process.env.ADMIN_RESET_PASSWORD;
    if (process.env.CONFIRM_ADMIN_PASSWORD_RESET !== 'true' || !username || !newPassword || newPassword.length < 14) {
      throw new Error('Set CONFIRM_ADMIN_PASSWORD_RESET=true, ADMIN_USERNAME, and a 14+ character ADMIN_RESET_PASSWORD.');
    }

    // Find the explicitly selected administrator; never reset a shared default account silently.
    const admin = await User.findOne({
      where: { username }
    });

    if (!admin) {
      logger.error('Admin user not found!');
      logger.info('Please run the seed script first: npm run seed');
      process.exit(1);
    }

    if (![UserRole.SCHOOL_ADMIN, UserRole.MUNICIPALITY_ADMIN].includes(admin.role)) {
      throw new Error('Selected account is not an administrator.');
    }

    admin.password = newPassword;
    await admin.save();

    logger.info('Administrator password updated successfully', { username });

    process.exit(0);
  } catch (error) {
    logger.error('Administrator password update failed:', error);
    process.exit(1);
  }
}

updateAdminPassword();
