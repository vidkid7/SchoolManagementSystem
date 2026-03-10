import express from 'express';
import request from 'supertest';
import authRoutes from '../auth.routes';
import { errorHandler } from '@middleware/errorHandler';
import User from '@models/User.model';
import smsService from '@services/sms.service';

jest.mock('@models/User.model', () => ({
  __esModule: true,
  UserRole: {
    MUNICIPALITY_ADMIN: 'Municipality_Admin',
    SCHOOL_ADMIN: 'School_Admin',
    SUBJECT_TEACHER: 'Subject_Teacher',
    CLASS_TEACHER: 'Class_Teacher',
    DEPARTMENT_HEAD: 'Department_Head',
    ECA_COORDINATOR: 'ECA_Coordinator',
    SPORTS_COORDINATOR: 'Sports_Coordinator',
    STUDENT: 'Student',
    PARENT: 'Parent',
    LIBRARIAN: 'Librarian',
    ACCOUNTANT: 'Accountant',
    TRANSPORT_MANAGER: 'Transport_Manager',
    HOSTEL_WARDEN: 'Hostel_Warden',
    NON_TEACHING_STAFF: 'Non_Teaching_Staff'
  },
  default: {
    findOne: jest.fn()
  }
}));

jest.mock('@services/sms.service', () => ({
  __esModule: true,
  default: {
    sendSMS: jest.fn()
  }
}));

describe('POST /api/v1/auth/forgot-password SMS dispatch', () => {
  const app = express();

  beforeAll(() => {
    app.use(express.json());
    app.use('/api/v1/auth', authRoutes);
    app.use(errorHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'development';
    process.env.FRONTEND_URL = 'http://localhost:5173';
    (smsService.sendSMS as jest.Mock).mockResolvedValue({ success: true, messageId: 'sms-id' });
  });

  it('sends reset SMS when user exists and has phone number', async () => {
    (User.findOne as jest.Mock).mockResolvedValue({
      userId: 1,
      email: 'user@example.com',
      phoneNumber: '9800000000',
      generatePasswordResetToken: jest.fn().mockResolvedValue('plain-token')
    });

    const response = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'user@example.com' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(smsService.sendSMS).toHaveBeenCalledTimes(1);
    expect(smsService.sendSMS).toHaveBeenCalledWith(
      '9800000000',
      expect.stringContaining('plain-token')
    );
  });

  it('returns generic success and does not send SMS for unknown email', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);

    const response = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'missing@example.com' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(smsService.sendSMS).not.toHaveBeenCalled();
  });

  it('does not send SMS when user has no phone number', async () => {
    (User.findOne as jest.Mock).mockResolvedValue({
      userId: 2,
      email: 'nophone@example.com',
      phoneNumber: null,
      generatePasswordResetToken: jest.fn().mockResolvedValue('plain-token')
    });

    const response = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nophone@example.com' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(smsService.sendSMS).not.toHaveBeenCalled();
  });
});
