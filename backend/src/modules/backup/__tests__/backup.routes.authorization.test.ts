import express, { Express, Request, Response } from 'express';
import request from 'supertest';

const mockBackupHandler = jest.fn((_req: Request, res: Response) =>
  res.status(200).json({ success: true, data: 'mocked backup operation' }),
);

jest.mock('../../../middleware/auth', () => ({
  authenticate: (req: Request, res: Response, next: express.NextFunction) => {
    if (req.headers.authorization !== 'Bearer local-qa') {
      res.status(401).json({ success: false, message: 'Unauthenticated' });
      return;
    }
    req.user = {
      userId: 42,
      username: 'local-qa',
      email: 'qa@example.test',
      role: req.headers['x-qa-role'] || 'Teacher',
      isSystemAccount: req.headers['x-qa-system'] === 'true',
      permissions: [],
    } as Request['user'];
    next();
  },
  authorize: (requiredRole: string) => (req: Request, res: Response, next: express.NextFunction) => {
    if (req.user?.role !== requiredRole) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }
    next();
  },
}));

jest.mock('../backup.controller', () => ({
  backupController: new Proxy({}, {
    get: () => mockBackupHandler,
  }),
}));

import backupRoutes from '../backup.routes';

const app: Express = express();
app.use(express.json());
app.use('/api/v1/backup', backupRoutes);

const protectedBackupRoutes = [
  ['post', '/create'],
  ['get', '/list'],
  ['post', '/restore'],
  ['post', '/verify'],
  ['post', '/cleanup'],
  ['get', '/config'],
] as const;

describe('backup route authorization', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each(protectedBackupRoutes)('%s %s rejects unauthenticated requests', async (method, route) => {
    const response = await request(app)[method](`/api/v1/backup${route}`);

    expect(response.status).toBe(401);
    expect(mockBackupHandler).not.toHaveBeenCalled();
  });

  it.each(protectedBackupRoutes)('%s %s rejects authenticated non-admin requests', async (method, route) => {
    const response = await request(app)[method](`/api/v1/backup${route}`)
      .set('Authorization', 'Bearer local-qa')
      .set('x-qa-role', 'Teacher');

    expect(response.status).toBe(403);
    expect(mockBackupHandler).not.toHaveBeenCalled();
  });

  it('blocks legacy whole-database restore for a School_Admin', async () => {
    const response = await request(app)
      .post('/api/v1/backup/restore')
      .set('Authorization', 'Bearer local-qa')
      .set('x-qa-role', 'School_Admin')
      .send({ filename: 'backup_2024-01-01T00-00-00.sql' });

    expect(response.status).toBe(403);
    expect(mockBackupHandler).not.toHaveBeenCalled();
  });

  it('blocks legacy whole-database backup routes even for the protected system account', async () => {
    const response = await request(app)
      .post('/api/v1/backup/create')
      .set('Authorization', 'Bearer local-qa')
      .set('x-qa-role', 'Municipality_Admin')
      .set('x-qa-system', 'true');

    expect(response.status).toBe(403);
    expect(mockBackupHandler).not.toHaveBeenCalled();
  });

  it('allows only the protected system account to reach school-scoped backup creation', async () => {
    const response = await request(app)
      .post('/api/v1/backup/platform/schools/00000000-0000-4000-8000-000000000001/create')
      .set('Authorization', 'Bearer local-qa')
      .set('x-qa-role', 'Municipality_Admin')
      .set('x-qa-system', 'true')
      .send({ passphrase: 'a-safe-test-passphrase' });

    expect(response.status).toBe(200);
    expect(mockBackupHandler).toHaveBeenCalledTimes(1);
  });

  it('rejects school-scoped backup creation for a municipality admin who is not Devuser', async () => {
    const response = await request(app)
      .post('/api/v1/backup/platform/schools/00000000-0000-4000-8000-000000000001/create')
      .set('Authorization', 'Bearer local-qa')
      .set('x-qa-role', 'Municipality_Admin')
      .send({ passphrase: 'a-safe-test-passphrase' });

    expect(response.status).toBe(403);
    expect(mockBackupHandler).not.toHaveBeenCalled();
  });
});
