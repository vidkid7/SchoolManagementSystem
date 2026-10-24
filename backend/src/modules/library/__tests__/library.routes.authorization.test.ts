import express from 'express';
import request from 'supertest';
import libraryRoutes from '../library.routes';
import { errorHandler } from '../../../middleware/errorHandler';

jest.mock('../../../middleware/auth', () => {
  const actual = jest.requireActual('../../../middleware/auth');
  return {
    ...actual,
    authenticate: (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const role = req.header('x-test-role');
      if (!role) {
        res.status(401).json({ success: false });
        return;
      }
      req.user = { userId: 1, username: 'test', role } as express.Request['user'];
      next();
    },
  };
});

jest.mock('../library.controller', () => {
  const handler = (_req: express.Request, res: express.Response) => res.status(200).json({ success: true });
  return {
    libraryController: new Proxy({}, { get: () => handler }),
  };
});

const app = express();
app.use(express.json());
app.use('/api/v1/library', libraryRoutes);
app.use(errorHandler);

const managementEndpoints = [
  ['POST', '/api/v1/library/renew', { circulationId: 12 }],
  ['POST', '/api/v1/library/reserve', { bookId: 10, studentId: 20 }],
  ['GET', '/api/v1/library/reservations?studentId=20', undefined],
  ['GET', '/api/v1/library/reservations?bookId=10', undefined],
  ['PUT', '/api/v1/library/reservations/30/cancel', { reason: 'test' }],
  ['GET', '/api/v1/library/fines', undefined],
  ['GET', '/api/v1/library/fines/20', undefined],
  ['GET', '/api/v1/library/issued?studentId=20', undefined],
  ['GET', '/api/v1/library/overdue', undefined],
] as const;

describe('library management endpoint authorization', () => {
  it.each(managementEndpoints)('%s %s rejects teacher, student, and parent roles', async (method, path, body) => {
    for (const role of ['Class_Teacher', 'Student', 'Parent']) {
      const response = await (request(app) as any)[method.toLowerCase()](path)
        .set('x-test-role', role)
        .send(body);
      expect(response.status).toBe(403);
    }
  });

  it.each(managementEndpoints)('%s %s remains available to school admins and librarians', async (method, path, body) => {
    for (const role of ['School_Admin', 'Librarian']) {
      const response = await (request(app) as any)[method.toLowerCase()](path)
        .set('x-test-role', role)
        .send(body);
      expect(response.status).toBe(200);
    }
  });
});
