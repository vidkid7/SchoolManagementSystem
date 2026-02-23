import AuditLog, { AuditAction, AuditLogCreationAttributes } from '@models/AuditLog.model';
import { logger } from '@utils/logger';
import { Request } from 'express';
import { Op } from 'sequelize';

/**
 * Audit Logger Service
 * Provides functionality to log all create, update, delete operations
 * with field-level change history
 * 
 * Requirements: 2.9, 38.1, 38.2, 38.6
 */

interface AuditLogOptions {
  userId?: number | null;
  entityType: string;
  entityId: number;
  action: AuditAction;
  oldValue?: unknown | null;
  newValue?: unknown | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

class AuditLoggerService {
  /**
   * Log an audit entry
   * @param options - Audit log options
   * @returns Created audit log entry
   */
  async log(options: AuditLogOptions): Promise<AuditLog> {
    try {
      // Calculate changed fields for update actions
      let changedFields: string[] | null = null;
      if (options.action === AuditAction.UPDATE && options.oldValue && options.newValue) {
        changedFields = this.getChangedFields(options.oldValue, options.newValue);
      }

      const auditLogData: AuditLogCreationAttributes = {
        userId: options.userId || null,
        entityType: options.entityType,
        entityId: options.entityId,
        action: options.action,
        oldValue: options.oldValue || null,
        newValue: options.newValue || null,
        changedFields,
        ipAddress: options.ipAddress || null,
        userAgent: options.userAgent || null,
        metadata: options.metadata || null,
        timestamp: new Date()
      };

      const auditLog = await AuditLog.create(auditLogData);

      logger.info('Audit log created', {
        auditLogId: auditLog.auditLogId,
        entityType: options.entityType,
        entityId: options.entityId,
        action: options.action,
        userId: options.userId
      });

      return auditLog;
    } catch (error) {
      logger.error('Error creating audit log', { error, options });
      // Don't throw error to prevent audit logging from breaking main operations
      throw error;
    }
  }

  /**
   * Log a create operation
   * @param entityType - Type of entity (e.g., 'student', 'staff')
   * @param entityId - ID of the created entity
   * @param newValue - New entity data
   * @param userId - User who performed the action
   * @param req - Express request object (optional)
   * @returns Created audit log entry
   */
  logCreate(
    entityType: string,
    entityId: number,
    newValue: unknown,
    userId?: number | null,
    req?: Request
  ): Promise<AuditLog> {
    return this.log({
      userId,
      entityType,
      entityId,
      action: AuditAction.CREATE,
      newValue,
      ipAddress: req ? this.getIpAddress(req) : null,
      userAgent: req?.get('user-agent') || null
    });
  }

  /**
   * Log an update operation
   * @param entityType - Type of entity
   * @param entityId - ID of the updated entity
   * @param oldValue - Previous entity data
   * @param newValue - New entity data
   * @param userId - User who performed the action
   * @param req - Express request object (optional)
   * @returns Created audit log entry
   */
  logUpdate(
    entityType: string,
    entityId: number,
    oldValue: unknown,
    newValue: unknown,
    userId?: number | null,
    req?: Request
  ): Promise<AuditLog> {
    return this.log({
      userId,
      entityType,
      entityId,
      action: AuditAction.UPDATE,
      oldValue,
      newValue,
      ipAddress: req ? this.getIpAddress(req) : null,
      userAgent: req?.get('user-agent') || null
    });
  }

  /**
   * Log a delete operation
   * @param entityType - Type of entity
   * @param entityId - ID of the deleted entity
   * @param oldValue - Entity data before deletion
   * @param userId - User who performed the action
   * @param req - Express request object (optional)
   * @returns Created audit log entry
   */
  logDelete(
    entityType: string,
    entityId: number,
    oldValue: unknown,
    userId?: number | null,
    req?: Request
  ): Promise<AuditLog> {
    return this.log({
      userId,
      entityType,
      entityId,
      action: AuditAction.DELETE,
      oldValue,
      ipAddress: req ? this.getIpAddress(req) : null,
      userAgent: req?.get('user-agent') || null
    });
  }

  /**
   * Log a restore operation
   * @param entityType - Type of entity
   * @param entityId - ID of the restored entity
   * @param newValue - Restored entity data
   * @param userId - User who performed the action
   * @param req - Express request object (optional)
   * @returns Created audit log entry
   */
  logRestore(
    entityType: string,
    entityId: number,
    newValue: unknown,
    userId?: number | null,
    req?: Request
  ): Promise<AuditLog> {
    return this.log({
      userId,
      entityType,
      entityId,
      action: AuditAction.RESTORE,
      newValue,
      ipAddress: req ? this.getIpAddress(req) : null,
      userAgent: req?.get('user-agent') || null
    });
  }

  /**
   * Get audit logs for a specific entity
   * @param entityType - Type of entity
   * @param entityId - ID of the entity
   * @param options - Query options
   * @returns Array of audit logs
   */
  async getEntityAuditLogs(
    entityType: string,
    entityId: number,
    options?: {
      limit?: number;
      offset?: number;
      action?: AuditAction;
    }
  ): Promise<{ logs: AuditLog[]; total: number }> {
    try {
      const where: Record<string, unknown> = {
        entityType,
        entityId
      };

      if (options?.action) {
        where.action = options.action;
      }

      const limit = Math.min(options?.limit || 50, 100);
      const offset = options?.offset || 0;

      const { rows: logs, count: total } = await AuditLog.findAndCountAll({
        where,
        limit,
        offset,
        order: [['timestamp', 'DESC']]
      });

      return { logs, total };
    } catch (error) {
      logger.error('Error fetching entity audit logs', { error, entityType, entityId });
      throw error;
    }
  }

  /**
   * Get audit logs for a specific user
   * @param userId - User ID
   * @param options - Query options
   * @returns Array of audit logs
   */
  async getUserAuditLogs(
    userId: number,
    options?: {
      limit?: number;
      offset?: number;
      entityType?: string;
      action?: AuditAction;
    }
  ): Promise<{ logs: AuditLog[]; total: number }> {
    try {
      const where: Record<string, unknown> = { userId };

      if (options?.entityType) {
        where.entityType = options.entityType;
      }

      if (options?.action) {
        where.action = options.action;
      }

      const limit = Math.min(options?.limit || 50, 100);
      const offset = options?.offset || 0;

      const { rows: logs, count: total } = await AuditLog.findAndCountAll({
        where,
        limit,
        offset,
        order: [['timestamp', 'DESC']]
      });

      return { logs, total };
    } catch (error) {
      logger.error('Error fetching user audit logs', { error, userId });
      throw error;
    }
  }

  /**
   * Clean up old audit logs (retention policy: 1 year)
   * @returns Number of deleted logs
   */
  async cleanupOldLogs(): Promise<number> {
    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const deletedCount = await AuditLog.destroy({
        where: {
          timestamp: {
            [Op.lt]: oneYearAgo
          }
        },
        force: true // Hard delete
      });

      logger.info('Old audit logs cleaned up', { 
        deletedCount, 
        cutoffDate: oneYearAgo 
      });

      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning up old audit logs', { error });
      throw error;
    }
  }

  /**
   * Get changed fields between old and new values
   * @param oldValue - Previous entity data
   * @param newValue - New entity data
   * @returns Array of changed field names
   */
  private getChangedFields(
    oldValue: unknown,
    newValue: unknown
  ): string[] {
    const changedFields: string[] = [];

    // Ensure both values are objects
    if (typeof oldValue !== 'object' || typeof newValue !== 'object' || 
        oldValue === null || newValue === null) {
      return changedFields;
    }

    const oldObj = oldValue as Record<string, unknown>;
    const newObj = newValue as Record<string, unknown>;

    // Check all fields in newValue
    for (const key in newObj) {
      if (Object.prototype.hasOwnProperty.call(newObj, key)) {
        // Skip timestamp fields
        if (key === 'updatedAt' || key === 'updated_at') {
          continue;
        }

        const oldVal = oldObj[key];
        const newVal = newObj[key];

        // Compare values (handle null, undefined, and different types)
        if (!this.areValuesEqual(oldVal, newVal)) {
          changedFields.push(key);
        }
      }
    }

    return changedFields;
  }

  /**
   * Compare two values for equality
   * @param val1 - First value
   * @param val2 - Second value
   * @returns True if values are equal
   */
  private areValuesEqual(val1: unknown, val2: unknown): boolean {
    // Handle null and undefined
    if (val1 === null && val2 === null) return true;
    if (val1 === undefined && val2 === undefined) return true;
    if (val1 === null || val1 === undefined || val2 === null || val2 === undefined) {
      return false;
    }

    // Handle dates
    if (val1 instanceof Date && val2 instanceof Date) {
      return val1.getTime() === val2.getTime();
    }

    // Handle objects and arrays
    if (typeof val1 === 'object' && typeof val2 === 'object') {
      return JSON.stringify(val1) === JSON.stringify(val2);
    }

    // Handle primitives
    return val1 === val2;
  }

  /**
   * Extract IP address from request
   * @param req - Express request object
   * @returns IP address
   */
  private getIpAddress(req: Request): string | null {
    // Check for proxy headers first
    const forwarded = req.get('x-forwarded-for');
    if (forwarded) {
      // x-forwarded-for can contain multiple IPs, take the first one
      return forwarded.split(',')[0].trim();
    }

    // Check for other common proxy headers
    const realIp = req.get('x-real-ip');
    if (realIp) {
      return realIp;
    }

    // Fall back to direct connection IP
    return req.ip || req.socket.remoteAddress || null;
  }
}

export default new AuditLoggerService();
