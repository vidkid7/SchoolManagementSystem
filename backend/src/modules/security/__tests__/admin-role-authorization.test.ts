import express from 'express';
import request from 'supertest';
import authRoutes from '../../auth/auth.routes';
import userRoutes from '../../user/user.routes';
import { errorHandler } from '../../../middleware/errorHandler';
import authController from '../../auth/auth.controller';
import userController from '../../user/user.controller';

jest.mock('@middleware/auth', () => {
  const actual = jest.requireActual('@middleware/auth');
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
    }
  };
});

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
    }
  };
});

jest.mock('../../auth/auth.controller', () => ({
  __esModule: true,
  default: {
    register: jest.fn((_req, res) => res.status(201).json({ success: true })),
    login: jest.fn((_req, res) => res.status(200).json({ success: true })),
    refreshToken: jest.fn((_req, res) => res.status(200).json({ success: true })),
    logout: jest.fn((_req, res) => res.status(200).json({ success: true })),
    changePassword: jest.fn((_req, res) => res.status(200).json({ success: true })),
    getProfile: jest.fn((_req, res) => res.status(200).json({ success: true })),
    forgotPassword: jest.fn((_req, res) => res.status(200).json({ success: true })),
    resetPassword: jest.fn((_req, res) => res.status(200).json({ success: true }))
  }
}));

jest.mock('../../user/user.controller', () => ({
  __esModule: true,
  default: {
    getUserStats: jest.fn((_req, res) => res.status(200).json({ success: true })),
    getAllUsers: jest.fn((_req, res) => res.status(200).json({ success: true })),
    createUser: jest.fn((_req, res) => res.status(201).json({ success: true })),
    getUserById: jest.fn((_req, res) => res.status(200).json({ success: true })),
    updateUser: jest.fn((_req, res) => res.status(200).json({ success: true })),
    deleteUser: jest.fn((_req, res) => res.status(200).json({ success: true })),
    resetPassword: jest.fn((_req, res) => res.status(200).json({ success: true })),
    getUserActivity: jest.fn((_req, res) => res.status(200).json({ success: true }))
  }
}));

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use(errorHandler);

const registration = {
  username: 'newteacher',
  email: 'newteacher@example.com',
  password: 'SecurePassword123!',
  confirmPassword: 'SecurePassword123!',
  role: 'Class_Teacher'
};

describe('privileged account authorization', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects public registration before the registration controller runs', async () => {
    const response = await request(app).post('/api/v1/auth/register').send(registration);

    expect(response.status).toBe(401);
    expect(authController.register).not.toHaveBeenCalled();
  });

  it('rejects registration by a non-admin account', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .set('x-test-role', 'Student')
      .send(registration);

    expect(response.status).toBe(403);
    expect(authController.register).not.toHaveBeenCalled();
  });

  it('rejects municipality-admin assignment through school registration', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .set('x-test-role', 'School_Admin')
      .send({ ...registration, role: 'Municipality_Admin' });

    expect(response.status).toBe(400);
    expect(authController.register).not.toHaveBeenCalled();
  });

  it('rejects school-admin assignment through generic registration', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .set('x-test-role', 'School_Admin')
      .send({ ...registration, role: 'School_Admin' });

    expect(response.status).toBe(400);
    expect(authController.register).not.toHaveBeenCalled();
  });

  it('preserves school-admin account provisioning for regular staff roles', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .set('x-test-role', 'School_Admin')
      .send(registration);

    expect(response.status).toBe(201);
    expect(authController.register).toHaveBeenCalledTimes(1);
  });

  it('rejects non-admin access to user management', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .set('x-test-role', 'Class_Teacher')
      .send({ username: 'promoted', roleId: 'School_Admin' });

    expect(response.status).toBe(403);
    expect(userController.createUser).not.toHaveBeenCalled();
  });

  it('preserves school-admin user management', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .set('x-test-role', 'School_Admin')
      .send({ username: 'staff-user', roleId: 'Class_Teacher' });

    expect(response.status).toBe(201);
    expect(userController.createUser).toHaveBeenCalledTimes(1);
  });

  it('does not grant municipality admins access to the generic school user API', async () => {
    const response = await request(app)
      .get('/api/v1/users')
      .set('x-test-role', 'Municipality_Admin');

    expect(response.status).toBe(403);
    expect(userController.getAllUsers).not.toHaveBeenCalled();
  });
});
