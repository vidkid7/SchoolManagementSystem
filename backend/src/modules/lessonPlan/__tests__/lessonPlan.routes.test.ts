import express from 'express';
import request from 'supertest';
import { errorHandler } from '@middleware/errorHandler';
import LessonPlan from '@models/LessonPlan.model';
import SyllabusProgress from '@models/SyllabusProgress.model';

jest.mock('@middleware/auth', () => {
  const actual = jest.requireActual('@middleware/auth') as typeof import('@middleware/auth');
  return {
    ...actual,
    authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
      req.user = { userId: 22, username: 'qa-teacher', role: 'Subject_Teacher' } as express.Request['user'];
      next();
    },
  };
});

jest.mock('@models/LessonPlan.model', () => ({
  __esModule: true,
  default: {
    count: jest.fn(),
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('@models/SyllabusProgress.model', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findOrCreate: jest.fn(),
  },
}));

import lessonPlanRoutes from '../lessonPlan.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/lesson-plans', lessonPlanRoutes);
app.use(errorHandler);

const mockedLessonPlan = jest.mocked(LessonPlan);
const mockedSyllabusProgress = jest.mocked(SyllabusProgress);

describe('lesson plan route validation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects invalid pagination and lesson-plan filters before querying', async () => {
    const response = await request(app).get('/api/v1/lesson-plans?page=0&limit=1000&status=unknown');

    expect(response.status).toBe(400);
    expect(mockedLessonPlan.findAndCountAll).not.toHaveBeenCalled();
  });

  it('uses bounded default pagination and ignores an unknown list query field', async () => {
    mockedLessonPlan.findAndCountAll.mockResolvedValue({ count: 0, rows: [] } as never);
    const response = await request(app).get('/api/v1/lesson-plans?extra=ignored');

    expect(response.status).toBe(200);
    expect(mockedLessonPlan.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 20, offset: 0 }));
  });

  it('rejects malformed IDs before record lookup', async () => {
    const response = await request(app).get('/api/v1/lesson-plans/not-an-id');

    expect(response.status).toBe(400);
    expect(mockedLessonPlan.findByPk).not.toHaveBeenCalled();
  });

  it.each([
    ['missing subject', { topic: 'Fractions' }],
    ['missing topic', { subject: 'Mathematics' }],
    ['bad date', { subject: 'Mathematics', topic: 'Fractions', date: 'not-a-date' }],
    ['invalid status', { subject: 'Mathematics', topic: 'Fractions', status: 'published' }],
    ['invalid duration', { subject: 'Mathematics', topic: 'Fractions', duration: 0 }],
  ])('rejects lesson-plan create payload with %s before writing', async (_case, body) => {
    const response = await request(app).post('/api/v1/lesson-plans').send(body);

    expect(response.status).toBe(400);
    expect(mockedLessonPlan.create).not.toHaveBeenCalled();
  });

  it('creates a valid plan with authenticated creator and accepts the UI empty-date value', async () => {
    mockedLessonPlan.create.mockResolvedValue({ id: 7, createdBy: 22 } as never);
    const response = await request(app).post('/api/v1/lesson-plans').send({
      subject: 'Mathematics',
      className: 'Class 5 - Section A',
      topic: 'Fractions',
      date: '',
      duration: '45',
      objectives: ['Compare fractions'],
      methodology: 'Demonstration',
      assessment: '',
      status: 'draft',
      createdBy: 999,
      schoolConfigId: 'attacker-supplied-tenant',
    });

    expect(response.status).toBe(201);
    expect(mockedLessonPlan.create).toHaveBeenCalledWith(expect.objectContaining({
      subject: 'Mathematics',
      topic: 'Fractions',
      duration: 45,
      status: 'draft',
      createdBy: 22,
    }));
    expect(mockedLessonPlan.create).toHaveBeenCalledWith(expect.not.objectContaining({
      schoolConfigId: 'attacker-supplied-tenant',
      createdBy: 999,
    }));
  });

  it('rejects unsupported status updates before looking up a plan', async () => {
    const response = await request(app).patch('/api/v1/lesson-plans/7/status').send({ status: 'published' });

    expect(response.status).toBe(400);
    expect(mockedLessonPlan.findByPk).not.toHaveBeenCalled();
  });

  it('rejects invalid syllabus progress and status values before persistence', async () => {
    const invalidProgress = await request(app).post('/api/v1/lesson-plans/syllabus-progress').send({
      subject: 'Mathematics', unit: 'Fractions', progress: 101,
    });
    const invalidStatus = await request(app).post('/api/v1/lesson-plans/syllabus-progress').send({
      subject: 'Mathematics', unit: 'Fractions', status: 'published',
    });

    expect(invalidProgress.status).toBe(400);
    expect(invalidStatus.status).toBe(400);
    expect(mockedSyllabusProgress.findOrCreate).not.toHaveBeenCalled();
  });
});
