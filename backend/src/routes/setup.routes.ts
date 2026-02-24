import { Router, Request, Response } from 'express';
import { sequelize } from '@config/database';
import bcrypt from 'bcrypt';
import { logger } from '@utils/logger';

const router = Router();

/**
 * ONE-TIME SETUP ENDPOINT
 * This endpoint creates/resets the admin user
 * Should be disabled in production after initial setup
 */
router.post('/reset-admin', async (req: Request, res: Response) => {
  try {
    // Only allow in production for Railway setup
    if (process.env.NODE_ENV !== 'production') {
      return res.status(403).json({ error: 'Only available in production for initial setup' });
    }

    logger.info('🔧 Resetting admin user...');

    // Check if admin exists
    const [admins] = await sequelize.query("SELECT user_id FROM users WHERE username = 'admin'");

    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    if (!admins || admins.length === 0) {
      // Create admin
      await sequelize.query(`
        INSERT INTO users (username, email, password, role, status, created_at, updated_at)
        VALUES ('admin', 'admin@school.com', ?, 'school_admin', 'active', NOW(), NOW())
      `, {
        replacements: [hashedPassword]
      });

      logger.info('✅ Admin user created');
      return res.json({
        success: true,
        message: 'Admin user created successfully',
        credentials: {
          username: 'admin',
          password: 'Admin@123'
        }
      });
    } else {
      // Reset admin password
      await sequelize.query(`
        UPDATE users 
        SET password = ?, 
            status = 'active',
            failed_login_attempts = 0,
            account_locked_until = NULL
        WHERE username = 'admin'
      `, {
        replacements: [hashedPassword]
      });

      logger.info('✅ Admin password reset');
      return res.json({
        success: true,
        message: 'Admin password reset successfully',
        credentials: {
          username: 'admin',
          password: 'Admin@123'
        }
      });
    }
  } catch (error: any) {
    logger.error('Setup error:', error);
    return res.status(500).json({
      error: 'Setup failed',
      details: error.message
    });
  }
});

export default router;
