import express from 'express';
import request from 'supertest';
import { Op } from 'sequelize';
import { errorHandler } from '@middleware/errorHandler';
import BehaviorRecord from '@models/BehaviorRecord.model';
import Student from '@models/Student.model';
import teacherService from '../teacher.service';

jest.mock('@middleware/auth', () => {
  const actual = jest.requireActual('@middleware/auth') as typeof import('@middleware/auth');
  return {
    ...actual,
    authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
      req.user = { userId: 22, username: 'qa-teacher', role: 'Class_Teacher' } as express.Request['user'];
      next();
    },
  };
});

jest.mock('../teacher.service', () => ({
  __esModule: true,
  default: {
    getStaffFromUserId: jest.fn(),
    getMyClass: jest.fn(),
  },
}));

jest.mock('@models/BehaviorRecord.model', () => ({
  __esModule: true,
  default: { create: jest.fn(), findAll: jest.fn() },
}));

jest.mock('@models/Student.model', () => ({
  __esModule: true,
  default: { findByPk: jest.fn() },
  StudentStatus: { ACTIVE: 'active' },
}));

import teacherRoutes from '../teacher.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/teachers', teacherRoutes);
app.use(errorHandler);

const mockedService = jest.mocked(teacherService);
const mockedBehaviorRecord = jest.mocked(BehaviorRecord);

describe('teacher behavior-record route validation', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    ['missing student ID', { category: 'conduct', description: 'Helpful' }],
    ['nonnumeric student ID', { studentId: 'abc', category: 'conduct', description: 'Helpful' }],
    ['invalid behavior type', { studentId: 7, type: 'excellent', category: 'conduct', description: 'Helpful' }],
    ['blank category', { studentId: 7, category: '  ', description: 'Helpful' }],
    ['missing description', { studentId: 7, category: 'conduct' }],
    ['invalid date', { studentId: 7, category: 'conduct', description: 'Helpful', date: '2026-02-30' }],
    ['oversized category', { studentId: 7, category: 'x'.repeat(101), description: 'Helpful' }],
  ])('rejects a payload with %s before database access', async (_label, body) => {
    const response = await request(app).post('/api/v1/teachers/behavior-records').send(body);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
    expect(mockedService.getStaffFromUserId).not.toHaveBeenCalled();
    expect(mockedBehaviorRecord.create).not.toHaveBeenCalled();
  });

  it('accepts a valid record for a student assigned to the teacher and normalizes input', async () => {
    mockedService.getStaffFromUserId.mockResolvedValue({ staffId: 4 } as never);
    mockedService.getMyClass.mockResolvedValue({
      students: [{ studentId: 7, firstNameEn: 'Ari', lastNameEn: 'Test' }],
    } as never);
    mockedBehaviorRecord.create.mockResolvedValue({
      get: () => ({
        id: 9, studentId: 7, type: 'positive', category: 'conduct', description: 'Helpful',
        actionTaken: '', date: '2026-10-23',
      }),
    } as never);

    const response = await request(app).post('/api/v1/teachers/behavior-records').send({
      studentId: '7', category: ' conduct ', description: ' Helpful ', date: '2026-10-23',
      unexpected: 'discarded',
    });

    expect(response.status).toBe(201);
    expect(mockedBehaviorRecord.create).toHaveBeenCalledWith(expect.objectContaining({
      studentId: 7,
      type: 'neutral',
      category: 'conduct',
      description: 'Helpful',
      date: '2026-10-23',
      recordedBy: 22,
    }));
    expect(response.body.data.studentName).toBe('Ari Test');
    expect(jest.mocked(Student.findByPk)).not.toHaveBeenCalled();
  });

  it('rejects an out-of-class student before looking up or writing that student', async () => {
    mockedService.getStaffFromUserId.mockResolvedValue({ staffId: 4 } as never);
    mockedService.getMyClass.mockResolvedValue({ students: [{ studentId: 8 }] } as never);

    const response = await request(app).post('/api/v1/teachers/behavior-records').send({
      studentId: 7,
      category: 'conduct',
      description: 'Test access boundary',
    });

    expect(response.status).toBe(403);
    expect(jest.mocked(Student.findByPk)).not.toHaveBeenCalled();
    expect(mockedBehaviorRecord.create).not.toHaveBeenCalled();
  });

  it('limits behavior-record reads to the authenticated teacher class roster', async () => {
    mockedService.getStaffFromUserId.mockResolvedValue({ staffId: 4 } as never);
    mockedService.getMyClass.mockResolvedValue({ students: [{ studentId: 7 }, { studentId: 9 }] } as never);
    mockedBehaviorRecord.findAll.mockResolvedValue([] as never);

    const response = await request(app).get('/api/v1/teachers/behavior-records');

    expect(response.status).toBe(200);
    expect(mockedBehaviorRecord.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { studentId: { [Op.in]: [7, 9] } },
    }));
  });
});
