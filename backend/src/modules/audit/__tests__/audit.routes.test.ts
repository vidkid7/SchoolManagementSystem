import express, { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { UserRole } from '@models/User.model';
import auditRoutes from '../audit.routes';
import auditController from '../audit.controller';

jest.mock('@middleware/auth', () => {
  const actual = jest.requireActual('@middleware/auth');
  return {
    ...actual,
    authenticate: (req: Request, res: Response, next: NextFunction) => {
      const role = req.header('x-test-role');
      if (!role) return res.status(401).json({ success: false });
      req.user = {
        userId: 1,
        username: 'qa-audit',
        email: 'qa-audit@example.test',
        role: role as UserRole,
      };
      return next();
    },
  };
});

jest.mock('../audit.controller', () => ({
  __esModule: true,
  default: {
    getAuditLogs: jest.fn((_req: Request, res: Response) => res.status(200).json({ success: true })),
    getAuditLogById: jest.fn(),
    getEntityAuditLogs: jest.fn(),
    getUserAuditLogs: jest.fn(),
    getAuditLogStats: jest.fn(),
    rotateAuditLogs: jest.fn(),
    exportAuditLogs: jest.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use('/api/v1/audit', auditRoutes);
app.use((error: { statusCode?: number; message?: string }, _req: Request, res: Response, _next: NextFunction) => {
  res.status(error.statusCode ?? 500).json({ message: error.message });
});

describe('Audit routes authorization and validation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('requires an authenticated caller', async () => {
    await request(app).get('/api/v1/audit/logs').expect(401);
    expect(auditController.getAuditLogs).not.toHaveBeenCalled();
  });

  it('allows only School_Admin to read audit logs', async () => {
    await request(app)
      .get('/api/v1/audit/logs')
      .set('x-test-role', UserRole.SUBJECT_TEACHER)
      .expect(403);
    expect(auditController.getAuditLogs).not.toHaveBeenCalled();

    await request(app)
      .get('/api/v1/audit/logs')
      .set('x-test-role', UserRole.SCHOOL_ADMIN)
      .expect(200);
    expect(auditController.getAuditLogs).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid pagination before the controller runs', async () => {
    await request(app)
      .get('/api/v1/audit/logs?limit=101')
      .set('x-test-role', UserRole.SCHOOL_ADMIN)
      .expect(400);
    expect(auditController.getAuditLogs).not.toHaveBeenCalled();
  });
});
