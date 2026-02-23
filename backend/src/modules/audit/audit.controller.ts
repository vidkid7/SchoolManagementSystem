import { Request, Response, NextFunction } from 'express';
import auditService from './audit.service';
import { AuditLogQueryParams, AuditLogFilters } from './audit.types';
import { AuditAction } from '@models/AuditLog.model';
import { logger } from '@utils/logger';

/**
 * Audit Controller
 * Handles HTTP requests for audit log viewing
 * Requirements: 38.5, 38.6, 38.7
 */

class AuditController {
  /**
   * Get audit logs with filtering and pagination
   * GET /api/v1/audit/logs
   */
  async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = req.query as AuditLogQueryParams;

      // Parse filters
      const filters: AuditLogFilters = {};

      if (params.userId) {
        filters.userId = parseInt(params.userId, 10);
      }

      if (params.entityType) {
        filters.entityType = params.entityType;
      }

      if (params.entityId) {
        filters.entityId = parseInt(params.entityId, 10);
      }

      if (params.action) {
        filters.action = params.action as AuditAction;
      }

      if (params.startDate) {
        filters.startDate = new Date(params.startDate);
      }

      if (params.endDate) {
        filters.endDate = new Date(params.endDate);
      }

      if (params.ipAddress) {
        filters.ipAddress = params.ipAddress;
      }

      if (params.search) {
        filters.search = params.search;
      }

      // Parse pagination
      const page = params.page ? parseInt(params.page.toString(), 10) : 1;
      const limit = params.limit ? parseInt(params.limit.toString(), 10) : 20;

      // Parse sorting
      const sortBy = params.sortBy || 'timestamp';
      const sortOrder = params.sortOrder || 'DESC';

      const result = await auditService.getAuditLogs(
        filters,
        page,
        limit,
        sortBy,
        sortOrder
      );

      res.status(200).json({
        success: true,
        data: result.logs,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error in getAuditLogs controller', { error });
      next(error);
    }
  }

  /**
   * Get audit log by ID
   * GET /api/v1/audit/logs/:id
   */
  async getAuditLogById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const auditLogId = parseInt(req.params.id, 10);

      const log = await auditService.getAuditLogById(auditLogId);

      if (!log) {
        res.status(404).json({
          success: false,
          error: {
            code: 'AUDIT_LOG_NOT_FOUND',
            message: 'Audit log not found'
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: log
      });
    } catch (error) {
      logger.error('Error in getAuditLogById controller', { error });
      next(error);
    }
  }

  /**
   * Get audit logs for a specific entity
   * GET /api/v1/audit/entity/:entityType/:entityId
   */
  async getEntityAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { entityType, entityId } = req.params;
      const page = req.query.page ? parseInt(req.query.page.toString(), 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit.toString(), 10) : 20;

      const result = await auditService.getEntityAuditLogs(
        entityType,
        parseInt(entityId, 10),
        page,
        limit
      );

      res.status(200).json({
        success: true,
        data: result.logs,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error in getEntityAuditLogs controller', { error });
      next(error);
    }
  }

  /**
   * Get audit logs for a specific user
   * GET /api/v1/audit/user/:userId
   */
  async getUserAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(req.params.userId, 10);
      const page = req.query.page ? parseInt(req.query.page.toString(), 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit.toString(), 10) : 20;

      const result = await auditService.getUserAuditLogs(userId, page, limit);

      res.status(200).json({
        success: true,
        data: result.logs,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error in getUserAuditLogs controller', { error });
      next(error);
    }
  }

  /**
   * Get audit log statistics
   * GET /api/v1/audit/stats
   */
  async getAuditLogStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await auditService.getAuditLogStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error in getAuditLogStats controller', { error });
      next(error);
    }
  }

  /**
   * Rotate audit logs (delete old logs)
   * POST /api/v1/audit/rotate
   */
  async rotateAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const retentionDays = req.body.retentionDays || 365;

      const stats = await auditService.rotateAuditLogs(retentionDays);

      res.status(200).json({
        success: true,
        message: 'Audit logs rotated successfully',
        data: stats
      });
    } catch (error) {
      logger.error('Error in rotateAuditLogs controller', { error });
      next(error);
    }
  }

  /**
   * Export audit logs
   * GET /api/v1/audit/export
   */
  async exportAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = req.query as AuditLogQueryParams;

      // Parse filters
      const filters: AuditLogFilters = {};

      if (params.userId) {
        filters.userId = parseInt(params.userId, 10);
      }

      if (params.entityType) {
        filters.entityType = params.entityType;
      }

      if (params.entityId) {
        filters.entityId = parseInt(params.entityId, 10);
      }

      if (params.action) {
        filters.action = params.action as AuditAction;
      }

      if (params.startDate) {
        filters.startDate = new Date(params.startDate);
      }

      if (params.endDate) {
        filters.endDate = new Date(params.endDate);
      }

      const logs = await auditService.exportAuditLogs(filters);

      res.status(200).json({
        success: true,
        data: logs,
        count: logs.length
      });
    } catch (error) {
      logger.error('Error in exportAuditLogs controller', { error });
      next(error);
    }
  }
}

export default new AuditController();
