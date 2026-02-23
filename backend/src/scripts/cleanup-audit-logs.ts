import auditLogger from '@utils/auditLogger';
import { logger } from '@utils/logger';
import sequelize from '@config/database';

/**
 * Cleanup Old Audit Logs Script
 * Removes audit logs older than 1 year as per retention policy
 * 
 * Requirements: 38.6
 * 
 * Usage:
 * - Run manually: npx ts-node src/scripts/cleanup-audit-logs.ts
 * - Schedule as cron job: Run daily/weekly via cron or task scheduler
 */

async function cleanupAuditLogs(): Promise<void> {
  try {
    logger.info('Starting audit log cleanup...');

    // Ensure database connection
    await sequelize.authenticate();
    logger.info('Database connection established');

    // Clean up old logs (older than 1 year)
    const deletedCount = await auditLogger.cleanupOldLogs();

    logger.info('Audit log cleanup completed', { deletedCount });

    // Close database connection
    await sequelize.close();
    
    process.exit(0);
  } catch (error) {
    logger.error('Error during audit log cleanup', { error });
    process.exit(1);
  }
}

// Run the cleanup
cleanupAuditLogs();
