import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../errorHandler';

const createResponse = () => {
  const res = {
    locals: {},
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

describe('errorHandler auth errors crossing module boundaries', () => {
  const req = { path: '/api/v1/protected', method: 'POST', ip: '127.0.0.1' } as Request;
  const next = jest.fn() as NextFunction;

  it('returns 401 for a named auth error that is not this module AppError instance', () => {
    const res = createResponse();
    const error = Object.assign(new Error('No token provided'), { name: 'AuthenticationError' });

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'No token provided',
      code: 'AUTHENTICATION_REQUIRED',
    });
  });

  it('returns 403 for a named authorization error that is not this module AppError instance', () => {
    const res = createResponse();
    const error = Object.assign(new Error('Role is not allowed'), { name: 'AuthorizationError' });

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Role is not allowed',
      code: 'PERMISSION_DENIED',
    });
  });
});
