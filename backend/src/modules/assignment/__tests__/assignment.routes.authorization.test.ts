import express from 'express';
import request from 'supertest';
import assignmentRoutes from '../assignment.routes';
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

jest.mock('../assignment.controller', () => {
  const handler = (_req: express.Request, res: express.Response) => res.status(200).json({ success: true });
  return {
    __esModule: true,
    default: new Proxy({}, { get: () => handler }),
  };
});

const app = express();
app.use(express.json());
app.use('/api/v1/assignments', assignmentRoutes);
app.use(errorHandler);

describe('assignment read-route authorization', () => {
  it.each(['/api/v1/assignments', '/api/v1/assignments/31'])('%s denies student and parent access to unscoped reads', async (path) => {
    for (const role of ['Student', 'Parent']) {
      const response = await request(app).get(path).set('x-test-role', role);
      expect(response.status).toBe(403);
    }
  });

  it.each(['/api/v1/assignments', '/api/v1/assignments/31'])('%s remains available to teaching staff', async (path) => {
    for (const role of ['School_Admin', 'Class_Teacher', 'Subject_Teacher', 'Department_Head']) {
      const response = await request(app).get(path).set('x-test-role', role);
      expect(response.status).toBe(200);
    }
  });

  it('preserves the student-owned assignments endpoint', async () => {
    const response = await request(app).get('/api/v1/assignments/my').set('x-test-role', 'Student');
    expect(response.status).toBe(200);
  });
});
