import { createServer } from 'http';
import app from './app';
import { env, validateEnv } from '@config/env';
import { sequelize, testConnection, closeConnection } from '@config/database';
import { connectRedis, closeRedis } from '@config/redis';
import { logger } from '@utils/logger';
import { socketService } from '@services/socket.service';
import { backupJob } from './jobs/backupJob';
import { enableSlowQueryLogging } from '@middleware/queryLogger';
import { initializeAssociations } from '@models/associations';
import { initCirculation } from '@models/Circulation.model';
import { initLibraryFine } from '@models/LibraryFine.model';
import { initECA } from '@models/ECA.model';
import { initECAEnrollment } from '@models/ECAEnrollment.model';
import { initSport } from '@models/Sport.model';
import { initSportsEnrollment } from '@models/SportsEnrollment.model';
import { initNotification } from '@models/Notification.model';
import { initEvent } from '@models/Event.model';
import { initStaffAttendance } from '@models/StaffAttendance.model';
import { initLeaveApplication } from '@models/LeaveApplication.model';
import { initArchiveMetadata } from '@models/ArchiveMetadata.model';
import { initDocument } from '@models/Document.model';
import { initDocumentAccessLog } from '@models/DocumentAccessLog.model';

/**
 * Server Entry Point
 */

// Validate environment variables
try {
  validateEnv();
  logger.info('✅ Environment variables validated');
} catch (error) {
  logger.error('❌ Environment validation failed:', error);
  process.exit(1);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', error);
  process.exit(1);
});

// Start server
// eslint-disable-next-line max-lines-per-function
const startServer = async (): Promise<void> => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // Fix missing columns from failed migrations (Railway compatibility)
    try {
      const [columns] = await sequelize.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME IN ('password_reset_token', 'password_reset_expires')"
      );
      
      const existingColumns = (columns as any[]).map(c => c.COLUMN_NAME);
      
      if (!existingColumns.includes('password_reset_token')) {
        await sequelize.query('ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255) NULL');
        logger.info('✅ Added missing password_reset_token column');
      }
      
      if (!existingColumns.includes('password_reset_expires')) {
        await sequelize.query('ALTER TABLE users ADD COLUMN password_reset_expires DATETIME NULL');
        logger.info('✅ Added missing password_reset_expires column');
      }
    } catch (fixError) {
      // Ignore errors if table doesn't exist yet or columns already exist
      logger.debug('Column fix check:', fixError);
    }

    // Ensure admin user exists with correct password
    try {
      const [adminUsers] = await sequelize.query("SELECT user_id FROM users WHERE username = 'admin' LIMIT 1");
      if (!adminUsers || adminUsers.length === 0) {
        logger.info('⚠️  Admin user not found, will be created during seeding');
      }
    } catch (adminCheckError) {
      logger.debug('Admin check skipped (table may not exist yet)');
    }

    // Auto-setup: Run migrations and seeding if database is empty
    try {
      const [tables] = await sequelize.query("SHOW TABLES LIKE 'users'");
      if (!tables || tables.length === 0) {
        logger.info('🔧 Database is empty. Running auto-setup...');
        
        // Run migrations
        logger.info('📦 Running migrations...');
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        try {
          await execAsync('node dist/scripts/run-migrations.js up', { cwd: __dirname + '/..' });
          logger.info('✅ Migrations completed');
        } catch (migError: any) {
          logger.warn('Migration warning:', migError.stderr || migError.message);
        }
        
        // Seed database
        logger.info('🌱 Seeding database...');
        try {
          await execAsync('node dist/scripts/seed-database.js', { cwd: __dirname + '/..' });
          logger.info('✅ Database seeded');
          logger.info('');
          logger.info('📝 Default Login Credentials:');
          logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          logger.info('Admin: admin / Admin@123');
          logger.info('Teacher: teacher1 / Teacher@123');
          logger.info('Student: student1 / Student@123');
          logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        } catch (seedError: any) {
          logger.warn('Seeding warning:', seedError.message);
        }
      }
    } catch (setupError) {
      logger.warn('Auto-setup check failed, continuing...', setupError);
    }

    // Initialize models that need explicit initialization
    initCirculation(sequelize);
    initLibraryFine(sequelize);
    initECA(sequelize);
    initECAEnrollment(sequelize);
    initSport(sequelize);
    initSportsEnrollment(sequelize);
    initNotification(sequelize);
    initEvent(sequelize);
    initStaffAttendance(sequelize);
    initLeaveApplication(sequelize);
    initArchiveMetadata(sequelize);
    initDocument(sequelize);
    initDocumentAccessLog(sequelize);

    // Wait a tick to ensure all models are fully initialized
    await new Promise(resolve => setImmediate(resolve));

    // Initialize model associations
    initializeAssociations();
    logger.info('✅ Models initialized and associations configured');

    // Enable slow query logging
    enableSlowQueryLogging(sequelize);

    // Connect to Redis
    try {
      await connectRedis();
    } catch (error) {
      logger.warn('⚠️  Redis connection failed. Continuing without Redis...', error);
    }

    // Start Express server
    const httpServer = createServer(app);
    
    // Initialize Socket.IO
    socketService.initialize(httpServer);
    
    // Start backup job
    try {
      await backupJob.start();
      logger.info('✅ Backup job initialized');
    } catch (error) {
      logger.warn('⚠️  Backup job initialization failed. Continuing without automated backups...', error);
    }
    
    const server = httpServer.listen(env.PORT, () => {
      logger.info(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🏫 School Management System API                         ║
║                                                            ║
║   Environment: ${env.NODE_ENV.padEnd(43)}║
║   Port: ${String(env.PORT).padEnd(50)}║
║   API Base: ${env.API_BASE_URL.padEnd(46)}║
║                                                            ║
║   Health Check: http://localhost:${env.PORT}/health${' '.repeat(19)}║
║   API Docs: http://localhost:${env.PORT}/api/v1/docs${' '.repeat(15)}║
║   Socket.IO: ✅ Enabled                                    ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string): void => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      // Stop backup job
      backupJob.stop();

      server.close(() => {
        logger.info('HTTP server closed');

        Promise.all([closeConnection(), closeRedis()])
          .then(() => {
            logger.info('✅ Graceful shutdown completed');
            process.exit(0);
          })
          .catch((error) => {
            logger.error('Error during shutdown:', error);
            process.exit(1);
          });
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: Error) => {
      logger.error('UNHANDLED REJECTION! 💥 Shutting down...', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
