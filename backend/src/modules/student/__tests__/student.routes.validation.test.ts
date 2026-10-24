import express, { Express, Request, Response } from 'express';
import request from 'supertest';
import { errorHandler } from '@middleware/errorHandler';

const mockCreateHandler = jest.fn((req: Request, res: Response) =>
  res.status(201).json({ success: true, data: req.body }),
);
const mockBulkCreateHandler = jest.fn((req: Request, res: Response) =>
  res.status(201).json({ success: true, data: req.body }),
);
const mockTransferHistoryHandler = jest.fn((_req: Request, res: Response) =>
  res.status(200).json({ success: true, data: [{ reason: 'section change' }] }),
);

jest.mock('@middleware/auth', () => ({
  authenticate: (req: Request, _res: Response, next: express.NextFunction) => {
    req.user = {
      userId: 1,
      username: 'qa-admin',
      email: 'qa@example.test',
      role: 'School_Admin',
      permissions: [],
    } as Request['user'];
    next();
  },
  authorize: () => (_req: Request, _res: Response, next: express.NextFunction) => next(),
}));

jest.mock('../student.controller', () => {
  const fallbackHandler = (_req: Request, res: Response) => res.sendStatus(204);
  const controller = new Proxy({ create: mockCreateHandler, bulkCreate: mockBulkCreateHandler, getTransferHistory: mockTransferHistoryHandler }, {
    get(target, property: string) {
      return target[property as keyof typeof target] || fallbackHandler;
    },
  });
  return { __esModule: true, default: controller };
});

jest.mock('../photo.service', () => {
  const passthrough = (_req: Request, _res: Response, next: express.NextFunction) => next();
  const upload = { single: () => passthrough, array: () => passthrough };
  return { photoUpload: upload, documentUpload: upload };
});

import studentRoutes from '../student.routes';

const app: Express = express();
app.use(express.json());
app.use('/api/v1/students', studentRoutes);
app.use(errorHandler);

const validStudentPayload = {
  firstNameEn: 'QA',
  lastNameEn: 'Student',
  dateOfBirthBS: '2065-01-19',
  dateOfBirthAD: '2008-04-01',
  gender: 'male',
  addressEn: 'Test Street',
  emergencyContact: '9801110001',
  fatherName: 'QA Father',
  fatherPhone: '9801110002',
  motherName: 'QA Mother',
  motherPhone: '9801110003',
  admissionDate: '2026-01-01',
  admissionClass: 1,
};

describe('POST /api/v1/students validation contract', () => {
  beforeEach(() => jest.clearAllMocks());

  it('accepts the required create payload and forwards the sanitized fields to the controller', async () => {
    const response = await request(app)
      .post('/api/v1/students')
      .send({ ...validStudentPayload, unexpectedField: 'discard me' });

    expect(response.status).toBe(201);
    expect(response.body.data).toEqual({
      ...validStudentPayload,
      dateOfBirthAD: '2008-04-01T00:00:00.000Z',
      admissionDate: '2026-01-01T00:00:00.000Z',
    });
    expect(mockCreateHandler).toHaveBeenCalledTimes(1);
  });

  it('returns a field validation error without invoking the create handler when a required phone is missing', async () => {
    const invalidPayload = Object.fromEntries(
      Object.entries(validStudentPayload).filter(([field]) => field !== 'fatherPhone'),
    );
    const response = await request(app).post('/api/v1/students').send(invalidPayload);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
    expect(response.body.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'fatherPhone' }),
    ]));
    expect(mockCreateHandler).not.toHaveBeenCalled();
  });

  it('rejects malformed birth dates before invoking the create handler', async () => {
    const response = await request(app)
      .post('/api/v1/students')
      .send({ ...validStudentPayload, dateOfBirthBS: 'not-a-bs-date' });

    expect(response.status).toBe(400);
    expect(mockCreateHandler).not.toHaveBeenCalled();
  });
});

describe('POST /api/v1/students/bulk-create validation contract', () => {
  beforeEach(() => jest.clearAllMocks());

  it('accepts valid records and strips unknown fields before calling the bulk handler', async () => {
    const response = await request(app)
      .post('/api/v1/students/bulk-create')
      .send({ students: [{ ...validStudentPayload, unexpectedField: 'discard me' }] });

    expect(response.status).toBe(201);
    expect(response.body.data.students).toHaveLength(1);
    expect(response.body.data.students[0]).not.toHaveProperty('unexpectedField');
    expect(mockBulkCreateHandler).toHaveBeenCalledTimes(1);
  });

  it('rejects an invalid student before invoking the bulk handler', async () => {
    const response = await request(app)
      .post('/api/v1/students/bulk-create')
      .send({ students: [{ ...validStudentPayload, fatherPhone: 'not-a-phone' }] });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
    expect(response.body.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'students.0.fatherPhone' }),
    ]));
    expect(mockBulkCreateHandler).not.toHaveBeenCalled();
  });

  it('rejects an empty bulk payload before invoking the bulk handler', async () => {
    const response = await request(app).post('/api/v1/students/bulk-create').send({ students: [] });

    expect(response.status).toBe(400);
    expect(mockBulkCreateHandler).not.toHaveBeenCalled();
  });
});

describe('GET /api/v1/students/:id/transfer-history route contract', () => {
  beforeEach(() => jest.clearAllMocks());

  it('routes a valid student ID to the protected history handler', async () => {
    const response = await request(app).get('/api/v1/students/42/transfer-history');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([{ reason: 'section change' }]);
    expect(mockTransferHistoryHandler).toHaveBeenCalledTimes(1);
  });

  it('rejects an invalid student ID before calling the history handler', async () => {
    const response = await request(app).get('/api/v1/students/0/transfer-history');

    expect(response.status).toBe(400);
    expect(mockTransferHistoryHandler).not.toHaveBeenCalled();
  });
});
