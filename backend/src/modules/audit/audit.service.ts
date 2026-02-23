import AuditLog, { AuditAction } from '@models/AuditLog.model';
import { AuditLogFilters, AuditLogResponse, LogRotationStats } from './audit.types';
import { logger } from '@utils/logger';
import { Op, WhereOptions } from 'sequelize';

/**
 * Audit Service
 * Handles audit log viewing, filtering, and rotation
 * Requirements: 38.5, 38.6, 38.7
 */

class AuditService {
  /**
   * Get audit logs with filtering and pagination
   * @param filters - Filter criteria
   * @param page - Page number (1-indexed)
   * @param limit - Items per page
   * @param sortBy - Sort field
   * @param sortOrder - Sort direction
   * @returns Paginated audit logs
   */
  async getAuditLogs(
    filters: AuditLogFilters,
    page: number = 1,
    limit: number = 20,
    sortBy: 'timestamp' | 'entityType' | 'action' = 'timestamp',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Promise<AuditLogResponse> {
    try {
      // Build where clause
      const where: WhereOptions<AuditLog> = {};

      if (filters.userId !== undefined) {
        where.userId = filters.userId;
      }

      if (filters.entityType) {
        where.entityType = filters.entityType;
      }

      if (filters.entityId !== undefined) {
        where.entityId = filters.entityId;
      }

      if (filters.action) {
        where.action = filters.action;
      }

      if (filters.ipAddress) {
        where.ipAddress = filters.ipAddress;
      }

      // Date range filter
      if (filters.startDate || filters.endDate) {
        const timestampFilter: any = {};
        if (filters.startDate) {
          timestampFilter[Op.gte] = filters.startDate;
        }
        if (filters.endDate) {
          timestampFilter[Op.lte] = filters.endDate;
        }
        where.timestamp = timestampFilter;
      }

      // Search filter (searches in entity type and changed fields)
      if (filters.search) {
        (where as any)[Op.or] = [
          { entityType: { [Op.like]: `%${filters.search}%` } },
          { changedFields: { [Op.like]: `%${filters.search}%` } }
        ];
      }

      // Pagination
      const offset = (page - 1) * limit;
      const validLimit = Math.min(Math.max(limit, 1), 100); // Max 100 items per page

      // Query
      const { rows: logs, count: total } = await AuditLog.findAndCountAll({
        where,
        limit: validLimit,
        offset,
        order: [[sortBy, sortOrder]]
      });

      const totalPages = Math.ceil(total / validLimit);

      return {
        logs: logs.map(log => ({
          auditLogId: log.auditLogId,
          userId: log.userId,
          entityType: log.entityType,
          entityId: log.entityId,
          action: log.action,
          oldValue: log.oldValue,
          newValue: log.newValue,
          changedFields: log.changedFields,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          metadata: log.metadata,
          timestamp: log.timestamp
        })),
        pagination: {
          page,
          limit: validLimit,
          total,
          totalPages
        }
      };
    } catch (error) {
      logger.error('Error fetching audit logs', { error, filters });
      throw error;
    }
  }

  /**
   * Get audit log by ID
   * @param auditLogId - Audit log ID
   * @returns Audit log or null
   */
  async getAuditLogById(auditLogId: number): Promise<AuditLog | null> {
    try {
      const log = await AuditLog.findByPk(auditLogId);
      return log;
    } catch (error) {
      logger.error('Error fetching audit log by ID', { error, auditLogId });
      throw error;
    }
  }

  /**
   * Get audit logs for a specific entity
   * @param entityType - Entity type
   * @param entityId - Entity ID
   * @param page - Page number
   * @param limit - Items per page
   * @returns Paginated audit logs
   */
  async getEntityAuditLogs(
    entityType: string,
    entityId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<AuditLogResponse> {
    return this.getAuditLogs(
      { entityType, entityId },
      page,
      limit
    );
  }

  /**
   * Get audit logs for a specific user
   * @param userId - User ID
   * @param page - Page number
   * @param limit - Items per page
   * @returns Paginated audit logs
   */
  async getUserAuditLogs(
    userId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<AuditLogResponse> {
    return this.getAuditLogs(
      { userId },
      page,
      limit
    );
  }

  /**
   * Get audit log statistics
   * @returns Statistics about audit logs
   */
  async getAuditLogStats(): Promise<{
    totalLogs: number;
    logsByAction: Record<AuditAction, number>;
    logsByEntityType: Record<string, number>;
    oldestLog: Date | null;
    newestLog: Date | null;
  }> {
    try {
      const totalLogs = await AuditLog.count();

      // Count by action
      const logsByAction: Record<AuditAction, number> = {
        [AuditAction.CREATE]: 0,
        [AuditAction.UPDATE]: 0,
        [AuditAction.DELETE]: 0,
        [AuditAction.RESTORE]: 0
      };

      for (const action of Object.values(AuditAction)) {
        logsByAction[action] = await AuditLog.count({ where: { action } });
      }

      // Count by entity type
      const entityTypeCounts = await AuditLog.findAll({
        attributes: [
          'entityType',
          [AuditLog.sequelize!.fn('COUNT', AuditLog.sequelize!.col('entity_type')), 'count']
        ],
        group: ['entityType'],
        raw: true
      }) as unknown as Array<{ entityType: string; count: number }>;

      const logsByEntityType: Record<string, number> = {};
      entityTypeCounts.forEach(item => {
        logsByEntityType[item.entityType] = Number(item.count);
      });

      // Get oldest and newest logs
      const oldestLog = await AuditLog.findOne({
        order: [['timestamp', 'ASC']],
        attributes: ['timestamp']
      });

      const newestLog = await AuditLog.findOne({
        order: [['timestamp', 'DESC']],
        attributes: ['timestamp']
      });

      return {
        totalLogs,
        logsByAction,
        logsByEntityType,
        oldestLog: oldestLog?.timestamp || null,
        newestLog: newestLog?.timestamp || null
      };
    } catch (error) {
      logger.error('Error fetching audit log stats', { error });
      throw error;
    }
  }

  /**
   * Rotate audit logs (delete old logs based on retention policy)
   * @param retentionDays - Number of days to retain logs (default: 365)
   * @returns Rotation statistics
   */
  async rotateAuditLogs(retentionDays: number = 365): Promise<LogRotationStats> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const deletedCount = await AuditLog.destroy({
        where: {
          timestamp: {
            [Op.lt]: cutoffDate
          }
        },
        force: true // Hard delete
      });

      const stats: LogRotationStats = {
        deletedCount,
        cutoffDate,
        executedAt: new Date()
      };

      logger.info('Audit log rotation completed', stats);

      return stats;
    } catch (error) {
      logger.error('Error rotating audit logs', { error, retentionDays });
      throw error;
    }
  }

  /**
   * Export audit logs to JSON
   * @param filters - Filter criteria
   * @returns Array of audit logs
   */
  async exportAuditLogs(filters: AuditLogFilters): Promise<AuditLog[]> {
    try {
      const where: WhereOptions<AuditLog> = {};

      if (filters.userId !== undefined) {
        where.userId = filters.userId;
      }

      if (filters.entityType) {
        where.entityType = filters.entityType;
      }

      if (filters.entityId !== undefined) {
        where.entityId = filters.entityId;
      }

      if (filters.action) {
        where.action = filters.action;
      }

      if (filters.startDate || filters.endDate) {
        const timestampFilter: any = {};
        if (filters.startDate) {
          timestampFilter[Op.gte] = filters.startDate;
        }
        if (filters.endDate) {
          timestampFilter[Op.lte] = filters.endDate;
        }
        where.timestamp = timestampFilter;
      }

      const logs = await AuditLog.findAll({
        where,
        order: [['timestamp', 'DESC']],
        limit: 10000 // Limit export to 10k records
      });

      return logs;
    } catch (error) {
      logger.error('Error exporting audit logs', { error, filters });
      throw error;
    }
  }
}

export default new AuditService();
