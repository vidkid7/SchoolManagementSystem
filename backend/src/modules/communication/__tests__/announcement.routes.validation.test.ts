import express from 'express';
import request from 'supertest';
import { errorHandler } from '@middleware/errorHandler';

jest.mock('@middleware/auth', () => ({
  authenticate: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  authorize: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

jest.mock('../communication.controller', () => ({
  communicationController: new Proxy({}, {
    get: () => (_req: express.Request, res: express.Response) => res.status(200).json({ success: true }),
  }),
}));

import communicationRoutes from '../communication.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/communication', communicationRoutes);
app.use(errorHandler);

describe('communication announcement request validation', () => {
  it.each([
    ['zero page', '?page=0'],
    ['nonnumeric page', '?page=abc'],
    ['oversized page size', '?limit=101'],
    ['invalid audience', '?targetAudience=everyone'],
  ])('rejects announcement list query with %s before the controller', async (_label, query) => {
    const response = await request(app).get(`/api/v1/communication/announcements${query}`);

    expect(response.status).toBe(400);
  });

  it('accepts bounded announcement list filters', async () => {
    const response = await request(app).get('/api/v1/communication/announcements?page=2&limit=50&targetAudience=teachers');

    expect(response.status).toBe(200);
  });

  it.each(['get', 'put', 'delete'] as const)('rejects invalid announcement IDs on %s', async (method) => {
    let response;
    if (method === 'get') {
      response = await request(app).get('/api/v1/communication/announcements/not-an-id');
    } else if (method === 'put') {
      response = await request(app).put('/api/v1/communication/announcements/not-an-id').send({ title: 'Valid title' });
    } else {
      response = await request(app).delete('/api/v1/communication/announcements/not-an-id');
    }

    expect(response.status).toBe(400);
  });
});
