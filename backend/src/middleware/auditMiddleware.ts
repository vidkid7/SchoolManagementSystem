import { Request, Response, NextFunction } from 'express';
import auditLogger from '@utils/auditLogger';
import { logger } from '@utils/logger';
import { AuditAction } from '@models/AuditLog.model';

/**
 * Audit Middleware
 * Automatically logs data modifications (POST, PUT, PATCH, DELETE) for audit trail
 * 
 * Requirements: 38.2, 38.3
 */

// Entity type mapping from route paths
const ENTITY_TYPE_MAP: Record<string, string> = {
  '/api/v1/students': 'student',
  '/api/v1/staff': 'staff',
  '/api/v1/academic/years': 'academic_year',
  '/api/v1/academic/terms': 'term',
  '/api/v1/academic/classes': 'class',
  '/api/v1/academic/subjects': 'subject',
  '/api/v1/academic/timetable': 'timetable',
  '/api/v1/academic/syllabus': 'syllabus',
  '/api/v1/attendance/student': 'attendance',
  '/api/v1/attendance/leave': 'leave_application',
  '/api/v1/exams': 'exam',
  '/api/v1/finance/fee-structures': 'fee_structure',
  '/api/v1/finance/invoices': 'invoice',
  '/api/v1/finance/payments': 'payment',
  '/api/v1/library/books': 'book',
  '/api/v1/library/circulation': 'circulation',
  '/api/v1/eca': 'eca',
  '/api/v1/sports': 'sport',
  '/api/v1/config/system-settings': 'system_setting',
  '/api/v1/config/roles': 'role',
  '/api/v1/config/permissions': 'permission',
  '/api/v1/certificates/templates': 'certificate_template',
  '/api/v1/certificates': 'certificate',
  '/api/v1/documents': 'document'
};

// Administrative action patterns
const ADMIN_ACTION_PATTERNS = [
  '/api/v1/config',
  '/api/v1/auth/register',
  '/api/v1/users',
  '/api/v1/config/roles',
  '/api/v1/config/permissions'
];

// Financial transaction patterns
const FINANCIAL_PATTERNS = [
  '/api/v1/finance/payments',
  '/api/v1/finance/invoices',
  '/api/v1/finance/fee-structures',
  '/api/v1/payment-gateway'
];

/**
 * Determine entity type from request path
 */
function getEntityType(path: string): string | null {
  // Try exact match first
  for (const [pattern, entityType] of Object.entries(ENTITY_TYPE_MAP)) {
    if (path.startsWith(pattern)) {
      return entityType;
    }
  }
  return null;
}

/**
 * Extract entity ID from request
 */
function getEntityId(req: Request): number | null {
  // Try to get from params
  if (req.params.id) {
    const id = parseInt(req.params.id, 10);
    if (!isNaN(id)) return id;
  }

  // Try to get from body (for create operations)
  if (req.body && req.body.id) {
    const id = parseInt(req.body.id, 10);
    if (!isNaN(id)) return id;
  }

  // Try to get from response (will be set by controller)
  if (req.auditEntityId) {
    return req.auditEntityId;
  }

  return null;
}

/**
 * Check if request is an administrative action
 */
function isAdminAction(path: string): boolean {
  return ADMIN_ACTION_PATTERNS.some(pattern => path.startsWith(pattern));
}

/**
 * Check if request is a financial transaction
 */
function isFinancialTransaction(path: string): boolean {
  return FINANCIAL_PATTERNS.some(pattern => path.startsWith(pattern));
}

/**
 * Audit logging middleware
 * Logs all data modifications, administrative actions, and financial transactions
 */
export const auditMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Only log modification operations
  const modificationMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!modificationMethods.includes(req.method)) {
    return next();
  }

  // Skip health checks and non-API routes
  if (!req.path.startsWith('/api/') || req.path.includes('/health')) {
    return next();
  }

  // Store original response methods
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  // Capture response data
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let responseData: unknown = null;

  // Override res.json to capture response
  res.json = function (data: unknown) {
    responseData = data;
    return originalJson(data);
  };

  // Override res.send to capture response
  res.send = function (data: unknown) {
    responseData = data;
    return originalSend(data);
  };

  // Wait for response to complete
  res.on('finish', async () => {
    try {
      // Only log successful operations (2xx status codes)
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return;
      }

      const userId = req.user?.userId || null;
      const entityType = getEntityType(req.path);
      const entityId = getEntityId(req);

  // Determine action type
      let action: AuditAction | null = null;
      if (req.method === 'POST') action = AuditAction.CREATE;
      else if (req.method === 'PUT' || req.method === 'PATCH') action = AuditAction.UPDATE;
      else if (req.method === 'DELETE') action = AuditAction.DELETE;

      if (!action) return;

      // Build metadata
      const metadata: Record<string, unknown> = {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode
      };

      // Add category flags
      if (isAdminAction(req.path)) {
        metadata.category = 'administrative_action';
      }

      if (isFinancialTransaction(req.path)) {
        metadata.category = 'financial_transaction';
      }

      // For administrative actions, log even without entity ID
      if (isAdminAction(req.path)) {
        await auditLogger.log({
          userId,
          entityType: entityType || 'system_config',
          entityId: entityId || 0,
          action,
          newValue: req.body,
          ipAddress: getIpAddress(req),
          userAgent: req.get('user-agent') || null,
          metadata
        });

        logger.info('Administrative action logged', {
          userId,
          path: req.path,
          action
        });
        return;
      }

      // For financial transactions, always log
      if (isFinancialTransaction(req.path)) {
        await auditLogger.log({
          userId,
          entityType: entityType || 'financial_transaction',
          entityId: entityId || 0,
          action,
          newValue: req.body,
          ipAddress: getIpAddress(req),
          userAgent: req.get('user-agent') || null,
          metadata
        });

        logger.info('Financial transaction logged', {
          userId,
          path: req.path,
          action,
          amount: req.body?.amount
        });
        return;
      }

      // For regular data modifications, require entity type and ID
      if (entityType && entityId) {
        await auditLogger.log({
          userId,
          entityType,
          entityId,
          action,
          oldValue: req.auditOldValue || null,
          newValue: req.body,
          ipAddress: getIpAddress(req),
          userAgent: req.get('user-agent') || null,
          metadata
        });

        logger.info('Data modification logged', {
          userId,
          entityType,
          entityId,
          action
        });
      }
    } catch (error) {
      // Don't fail the request if audit logging fails
      logger.error('Error in audit middleware', { error, path: req.path });
    }
  });

  next();
};

/**
 * Extract IP address from request
 */
function getIpAddress(req: Request): string | null {
  const forwarded = req.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = req.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return req.ip || req.socket.remoteAddress || null;
}

// Extend Express Request type to include audit fields
declare global {
  namespace Express {
    interface Request {
      auditEntityId?: number;
      auditOldValue?: unknown;
    }
  }
}
