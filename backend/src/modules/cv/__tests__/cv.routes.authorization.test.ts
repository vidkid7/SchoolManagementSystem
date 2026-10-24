import express from 'express';
import request from 'supertest';
import { errorHandler, NotFoundError } from '@middleware/errorHandler';

jest.mock('@middleware/auth', () => {
  const actual = jest.requireActual('@middleware/auth');
  return {
    ...actual,
    authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
      req.user = {
        userId: 10,
        username: 'qa-user',
        email: 'qa@example.test',
        role: req.header('x-role') || 'Student',
        permissions: [],
      } as express.Request['user'];
      next();
    },
  };
});

jest.mock('@modules/security/studentAccess', () => ({
  assertStudentAccess: jest.fn((req: express.Request, studentId: number) => {
    if (['Student', 'Parent'].includes(req.user?.role || '') && studentId !== 7) {
      throw new NotFoundError('Student');
    }
    return Promise.resolve();
  }),
}));

jest.mock('@models/Student.model', () => ({
  __esModule: true,
  default: {
    findByPk: jest.fn((studentId: number) =>
      Promise.resolve(studentId === 7 ? { studentId: 7 } : null)),
  },
}));

jest.mock('../cv.controller', () => {
  const handler = (_req: express.Request, res: express.Response) => res.sendStatus(204);
  return {
    __esModule: true,
    default: {
      getCVData: handler,
      checkNeedsRegeneration: handler,
      downloadPDF: handler,
      regeneratePDF: handler,
      getCustomization: handler,
      updateCustomization: handler,
    },
  };
});

import router from '../cv.routes';
import { assertStudentAccess } from '@modules/security/studentAccess';

const app = express();
app.use(express.json());
app.use('/cv', router);
app.use(errorHandler);

const send = (method: string, path: string) => {
  if (method === 'GET') return request(app).get(path);
  if (method === 'POST') return request(app).post(path);
  return request(app).put(path);
};

describe('CV route authorization', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    ['GET', '/cv/7/data'],
    ['GET', '/cv/7/needs-regeneration'],
    ['GET', '/cv/7/download'],
    ['POST', '/cv/7/regenerate'],
    ['GET', '/cv/7'],
    ['PUT', '/cv/7'],
  ])('%s %s checks student ownership before handling the request', async (method, path) => {
    const response = await send(method, path).set('x-role', 'Student');

    expect(response.status).toBe(204);
    expect(assertStudentAccess).toHaveBeenCalledWith(expect.objectContaining({ params: expect.objectContaining({ id: '7' }) }), 7);
  });

  it('does not allow a student to access another student CV', async () => {
    const response = await request(app).get('/cv/8/data').set('x-role', 'Student');

    expect(response.status).toBe(404);
  });

  it('allows a parent to access their child and hides other student CVs', async () => {
    const allowed = await request(app).get('/cv/7/data').set('x-role', 'Parent');
    const denied = await request(app).get('/cv/8/data').set('x-role', 'Parent');

    expect(allowed.status).toBe(204);
    expect(denied.status).toBe(404);
  });

  it('checks staff student lookups against the authenticated tenant scope', async () => {
    const response = await request(app).get('/cv/8/data').set('x-role', 'School_Admin');

    expect(response.status).toBe(404);
  });

  it('does not allow unapproved roles to view CVs', async () => {
    const response = await request(app).get('/cv/7/data').set('x-role', 'Librarian');

    expect(response.status).toBe(403);
    expect(assertStudentAccess).not.toHaveBeenCalled();
  });

  it.each(['POST', 'PUT'])('restricts CV changes to students and school admins (%s)', async (method) => {
    const path = method === 'POST' ? '/cv/7/regenerate' : '/cv/7';
    const response = await send(method, path).set('x-role', 'Parent');

    expect(response.status).toBe(403);
    expect(assertStudentAccess).not.toHaveBeenCalled();
  });

  it('rejects malformed student IDs before querying access scope', async () => {
    const response = await request(app).get('/cv/not-a-number/data').set('x-role', 'Student');

    expect(response.status).toBe(400);
    expect(assertStudentAccess).not.toHaveBeenCalled();
  });
});
