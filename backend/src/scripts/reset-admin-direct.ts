import 'dotenv/config';
import sequelize from '../config/database';
import User, { UserRole, UserStatus } from '../models/User.model';
import { logger } from '../utils/logger';

/**
 * Explicitly confirmed administrator password reset. Does not use a fixed default password.
 */

async function resetAdminPassword(): Promise<void> {
  try {
    logger.info('Starting confirmed administrator password reset...');

    const username = process.env.ADMIN_USERNAME?.trim();
    const newPassword = process.env.ADMIN_RESET_PASSWORD;
    if (process.env.CONFIRM_ADMIN_PASSWORD_RESET !== 'true' || !username || !newPassword || newPassword.length < 14) {
      throw new Error('Set CONFIRM_ADMIN_PASSWORD_RESET=true, ADMIN_USERNAME, and a 14+ character ADMIN_RESET_PASSWORD.');
    }

    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established');

    const admin = await User.findOne({ where: { username } });
    if (!admin || ![UserRole.SCHOOL_ADMIN, UserRole.MUNICIPALITY_ADMIN].includes(admin.role)) {
      throw new Error('Selected administrator account was not found.');
    }

    admin.password = newPassword;
    admin.status = UserStatus.ACTIVE;
    admin.failedLoginAttempts = 0;
    admin.accountLockedUntil = undefined;
    await admin.save();
    logger.info('Administrator password updated successfully', { username });

    process.exit(0);
  } catch (error) {
    logger.error('Direct admin password reset failed:', error);
    process.exit(1);
  }
}

resetAdminPassword();
