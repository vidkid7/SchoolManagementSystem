import { createServer } from 'http';
import app from './app';
import { env, validateEnv } from '@config/env';
import { sequelize, testConnection, closeConnection } from '@config/database';
import { connectRedis, closeRedis } from '@config/redis';
import { logger } from '@utils/logger';
import { socketService } from '@services/socket.service';
import { backupJob } from './jobs/backupJob';
import { academicYearJob } from './jobs/academicYearJob';
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

    // Production DB fixes: add missing tenant columns, create municipality, reset locks
    if (env.NODE_ENV === 'production') {
      try {
        const tenantTables = [
          'admissions', 'academic_years', 'terms', 'classes', 'subjects', 'class_subjects',
          'students', 'staff', 'staff_assignments', 'staff_documents', 'staff_attendance',
          'attendance', 'leave_applications', 'exams', 'exam_schedules', 'grades',
          'fee_structures', 'fee_components', 'invoices', 'invoice_items', 'payments',
          'installment_plans', 'refunds', 'fee_reminders', 'books', 'circulations',
          'reservations', 'library_fines', 'sports', 'teams', 'tournaments',
          'sports_enrollments', 'sports_achievements', 'ecas', 'eca_events',
          'eca_enrollments', 'eca_achievements', 'events', 'certificates',
          'grading_schemes', 'notification_templates', 'audit_logs', 'archive_metadata',
          'certificate_templates', 'documents', 'document_access_logs', 'timetables',
          'academic_history', 'assignments', 'assignment_submissions', 'lesson_plans',
          'syllabus_progress', 'hostel_rooms', 'hostel_residents', 'hostel_incidents',
          'hostel_visitors'
        ];
        for (const table of tenantTables) {
          try {
            const [tables] = await sequelize.query(
              `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${table}'`
            );
            if ((tables as any[]).length === 0) continue;
            const [cols] = await sequelize.query(
              `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${table}' AND COLUMN_NAME IN ('municipality_id', 'school_config_id')`
            );
            const colNames = (cols as any[]).map((c: any) => c.COLUMN_NAME);
            if (!colNames.includes('municipality_id')) {
              await sequelize.query(`ALTER TABLE \`${table}\` ADD COLUMN municipality_id CHAR(36) NULL`);
            }
            if (!colNames.includes('school_config_id')) {
              await sequelize.query(`ALTER TABLE \`${table}\` ADD COLUMN school_config_id CHAR(36) NULL`);
            }
          } catch { /* skip */ }
        }

        // Ensure municipalities table exists with correct schema
        await sequelize.query(`CREATE TABLE IF NOT EXISTS municipalities (
          id CHAR(36) PRIMARY KEY, name_en VARCHAR(255) NOT NULL,
          name_np VARCHAR(255), code VARCHAR(50) NOT NULL UNIQUE,
          province VARCHAR(100), district VARCHAR(100), type VARCHAR(50),
          total_wards INT DEFAULT 0, is_active TINYINT(1) DEFAULT 1,
          address TEXT NULL, contact_phone VARCHAR(20) NULL, contact_email VARCHAR(255) NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          deleted_at DATETIME NULL
        )`);
        // Handle legacy table that may have 'municipality_id' PK instead of 'id'
        try {
          const [muniCols] = await sequelize.query(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'municipalities'"
          );
          const muniColNames = (muniCols as any[]).map((c: any) => c.COLUMN_NAME);
          if (!muniColNames.includes('id') && muniColNames.includes('municipality_id')) {
            await sequelize.query('ALTER TABLE municipalities CHANGE COLUMN municipality_id id CHAR(36)');
            logger.info('Renamed municipality_id to id in municipalities table');
          }
          if (!muniColNames.includes('name_en') && muniColNames.includes('name_ne')) {
            // name_ne exists but name_en doesn't - add it
            await sequelize.query('ALTER TABLE municipalities ADD COLUMN name_en VARCHAR(255) NULL');
          }
          if (!muniColNames.includes('address')) {
            await sequelize.query('ALTER TABLE municipalities ADD COLUMN address TEXT NULL');
          }
          if (!muniColNames.includes('contact_phone')) {
            await sequelize.query('ALTER TABLE municipalities ADD COLUMN contact_phone VARCHAR(20) NULL');
          }
          if (!muniColNames.includes('contact_email')) {
            await sequelize.query('ALTER TABLE municipalities ADD COLUMN contact_email VARCHAR(255) NULL');
          }
          // Model uses name_np but old table might have name_ne
          if (!muniColNames.includes('name_np') && muniColNames.includes('name_ne')) {
            await sequelize.query('ALTER TABLE municipalities CHANGE COLUMN name_ne name_np VARCHAR(255)');
          }
        } catch { /* column fix non-fatal */ }

        // Insert default municipality if none exists
        const [munis] = await sequelize.query('SELECT id, code FROM municipalities LIMIT 1');
        let munId: string | null = null;
        if ((munis as any[]).length > 0) {
          munId = (munis as any[])[0].id;
        } else {
          const { randomUUID } = await import('crypto');
          munId = randomUUID();
          await sequelize.query(
            `INSERT INTO municipalities (id, name_en, name_np, code, province, district, type, total_wards) VALUES ('${munId}', 'Kathmandu Metropolitan City', 'काठमाडौं महानगरपालिका', 'KMC', 'Bagmati', 'Kathmandu', 'Metropolitan', 32)`
          );
          logger.info(`Created default municipality KMC`);
        }

        // Link Municipality_Admin users
        if (munId) {
          await sequelize.query(
            `UPDATE users SET municipality_id = '${munId}' WHERE role = 'Municipality_Admin' AND (municipality_id IS NULL OR municipality_id = '')`
          );
        }

        // Reset account locks
        await sequelize.query(
          'UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL WHERE failed_login_attempts > 0 OR account_locked_until IS NOT NULL'
        );
        logger.info('✅ Production DB fixes applied');
      } catch (dbFixError) {
        logger.warn('⚠️ Production DB fix warning (non-fatal):', dbFixError);
      }
    }

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

    // Auto-detect and activate the correct academic year based on today's BS date
    try {
      const { default: academicService } = await import('./modules/academic/academic.service');
      await academicService.autoDetectCurrentAcademicYear();
      logger.info('✅ Academic year auto-detection completed');
    } catch (error) {
      logger.warn('⚠️  Academic year auto-detection failed. Continuing...', error);
    }

    // Start daily academic year rollover cron job
    academicYearJob.start();
    
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

      // Stop backup job and academic year job
      backupJob.stop();
      academicYearJob.stop();

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
