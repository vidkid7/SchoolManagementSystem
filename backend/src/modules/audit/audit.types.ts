import { AuditAction } from '@models/AuditLog.model';

/**
 * Audit Module Types
 * Requirements: 38.5, 38.6, 38.7
 */

export interface AuditLogFilters {
  userId?: number;
  entityType?: string;
  entityId?: number;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  search?: string;
}

export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  ipAddress?: string;
  search?: string;
  sortBy?: 'timestamp' | 'entityType' | 'action';
  sortOrder?: 'ASC' | 'DESC';
}

export interface AuditLogResponse {
  logs: Array<{
    auditLogId: number;
    userId: number | null;
    entityType: string;
    entityId: number;
    action: AuditAction;
    oldValue: unknown | null;
    newValue: unknown | null;
    changedFields: string[] | null;
    ipAddress: string | null;
    userAgent: string | null;
    metadata: Record<string, unknown> | null;
    timestamp: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LogRotationStats {
  deletedCount: number;
  cutoffDate: Date;
  executedAt: Date;
}
