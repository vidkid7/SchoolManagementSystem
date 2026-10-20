import express from 'express';
import request from 'supertest';
import { UserRole } from '@models/User.model';

jest.mock('../../../middleware/auth', () => {
  const actual = jest.requireActual('../../../middleware/auth');
  return {
    ...actual,
    authenticate: (req: any, _res: any, next: () => void) => {
      req.user = {
        userId: 7,
        username: 'qa-user',
        role: req.header('x-test-role') || 'teacher',
      };
      next();
    },
  };
});

jest.mock('../communication.controller', () => ({
  communicationController: new Proxy({}, {
    get: () => (_req: any, res: any) => res.status(200).json({ success: true }),
  }),
}));

jest.mock('../attachment.service', () => ({
  attachmentUpload: new Proxy({}, {
    get: () => () => (_req: any, _res: any, next: () => void) => next(),
  }),
}));

jest.mock('../communication.validation', () => ({
  communicationValidation: new Proxy({}, { get: () => [] }),
}));

jest.mock('../../../middleware/validation', () => ({
  validate: () => (_req: any, _res: any, next: () => void) => next(),
}));

import communicationRoutes from '../communication.routes';

describe('communication settings route authorization', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/communication', communicationRoutes);

  it.each([
    ['GET', '/api/v1/communication/settings'],
    ['PUT', '/api/v1/communication/settings'],
  ])('%s %s denies authenticated non-admins', async (method, path) => {
    const response = method === 'GET'
      ? await request(app).get(path).set('x-test-role', 'teacher')
      : await request(app).put(path).set('x-test-role', 'teacher').send({});

    expect(response.status).toBe(403);
  });

  it.each([
    ['GET', '/api/v1/communication/settings'],
    ['PUT', '/api/v1/communication/settings'],
  ])('%s %s remains available to school admins', async (method, path) => {
    const response = method === 'GET'
      ? await request(app).get(path).set('x-test-role', UserRole.SCHOOL_ADMIN)
      : await request(app).put(path).set('x-test-role', UserRole.SCHOOL_ADMIN).send({});

    expect(response.status).toBe(200);
  });
});
