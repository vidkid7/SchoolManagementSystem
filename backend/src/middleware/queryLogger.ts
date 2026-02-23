import { Sequelize } from 'sequelize';
import { logger } from '@utils/logger';

const SLOW_QUERY_THRESHOLD_MS = parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000', 10);

export function enableSlowQueryLogging(sequelize: Sequelize): void {
  const originalQuery = sequelize.query.bind(sequelize);

  (sequelize as any).query = async function (...args: any[]) {
    const start = Date.now();
    try {
      const result = await originalQuery(...args);
      const duration = Date.now() - start;

      if (duration >= SLOW_QUERY_THRESHOLD_MS) {
        const sql = typeof args[0] === 'string' ? args[0] : (args[0] as any)?.query || 'unknown';
        logger.warn('Slow query detected', {
          duration: `${duration}ms`,
          threshold: `${SLOW_QUERY_THRESHOLD_MS}ms`,
          sql: sql.substring(0, 500),
        });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - start;
      const sql = typeof args[0] === 'string' ? args[0] : (args[0] as any)?.query || 'unknown';
      
      // Suppress errors for expected missing tables (finance/exam tables that haven't been migrated yet)
      const expectedMissingTables = ['payments', 'invoices', 'grades', 'refunds', 'fee_structures'];
      const isExpectedMissingTable = expectedMissingTables.some(table => 
        (error as any)?.original?.sqlMessage?.includes(`Table 'school_management_system.${table}' doesn't exist`)
      );
      
      if (!isExpectedMissingTable) {
        logger.error('Query error', {
          duration: `${duration}ms`,
          sql: sql.substring(0, 500),
          error,
        });
      }
      
      throw error;
    }
  };

  logger.info(`Slow query logging enabled (threshold: ${SLOW_QUERY_THRESHOLD_MS}ms)`);
}
