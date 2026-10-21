import { Request, Response, NextFunction } from 'express';
import {
  authenticate,
  authorize,
  requirePermissions,
  optionalAuth,
  requireSelfAccess,
  requireResourceOwnership
} from '../auth';
import { AuthenticationError } from '../errorHandler';
import authService from '@modules/auth/auth.service';
import User, { UserRole, UserStatus } from '@models/User.model';

// Mock dependencies
jest.mock('@modules/auth/auth.service');
jest.mock('@utils/logger');

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      path: '/test',
      method: 'GET',
      ip: '127.0.0.1'
    };
    mockResponse = {};
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate an active user using current database role and scope', async () => {
      const mockDecoded = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'School_Admin' as UserRole
      };
      const currentUser = {
        userId: 1,
        username: 'current-name',
        email: 'current@example.com',
        role: UserRole.TRANSPORT_MANAGER,
        status: UserStatus.ACTIVE,
        municipalityId: 'municipality-1',
        schoolConfigId: 'school-1',
        isAccountLocked: () => false,
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      (authService.verifyAccessToken as jest.Mock).mockReturnValue(mockDecoded);
      jest.spyOn(User, 'findByPk').mockResolvedValue(currentUser as never);

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(authService.verifyAccessToken).toHaveBeenCalledWith('valid-token');
      expect(User.findByPk).toHaveBeenCalledWith(1, expect.objectContaining({
        attributes: expect.arrayContaining(['status', 'role', 'schoolConfigId'])
      }));
      expect(mockRequest.user).toMatchObject({
        userId: 1,
        username: 'current-name',
        email: 'current@example.com',
        role: UserRole.TRANSPORT_MANAGER,
        schoolConfigId: 'school-1',
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it.each([
      ['route params', { params: { municipalityId: 'municipality-other' } }],
      ['request body', { body: { municipality_id: 'municipality-other' } }],
      ['query string', { query: { municipalityId: 'municipality-other' } }],
    ])('should reject an authenticated request with a mismatched municipality in %s', async (_source, requestFields) => {
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      Object.assign(mockRequest, requestFields as Partial<Request>);
      (authService.verifyAccessToken as jest.Mock).mockReturnValue({ userId: 1 });
      jest.spyOn(User, 'findByPk').mockResolvedValue({
        userId: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: UserRole.SCHOOL_ADMIN,
        status: UserStatus.ACTIVE,
        municipalityId: 'municipality-1',
        schoolConfigId: 'school-1',
        isAccountLocked: () => false,
      } as never);

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Access denied: municipality mismatch',
        statusCode: 403,
      }));
    });

    it('should reject a token after the account is deactivated', async () => {
      mockRequest.headers = { authorization: 'Bearer old-token' };
      (authService.verifyAccessToken as jest.Mock).mockReturnValue({ userId: 1 });
      jest.spyOn(User, 'findByPk').mockResolvedValue({
        userId: 1,
        username: 'inactive',
        email: 'inactive@example.com',
        role: UserRole.TRANSPORT_MANAGER,
        status: UserStatus.INACTIVE,
        isAccountLocked: () => false,
      } as never);

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Account is not active',
        statusCode: 401,
      }));
      expect(mockRequest.user).toBeUndefined();
    });

    it('should reject an active school role without a school assignment', async () => {
      mockRequest.headers = { authorization: 'Bearer unscoped-token' };
      (authService.verifyAccessToken as jest.Mock).mockReturnValue({ userId: 2 });
      jest.spyOn(User, 'findByPk').mockResolvedValue({
        userId: 2,
        username: 'unscoped',
        email: 'unscoped@example.com',
        role: UserRole.TRANSPORT_MANAGER,
        status: UserStatus.ACTIVE,
        isAccountLocked: () => false,
      } as never);

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Account is missing a school assignment',
        statusCode: 401,
      }));
      expect(mockRequest.user).toBeUndefined();
    });

    it('should throw error when no authorization header', () => {
      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No token provided'
        })
      );
    });

    it('should throw error when authorization header does not start with Bearer', () => {
      mockRequest.headers = {
        authorization: 'Basic invalid-token'
      };

      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No token provided'
        })
      );
    });

    it('should throw error when token verification fails', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      (authService.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new AuthenticationError('Invalid token');
      });

      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid token'
        })
      );
    });
  });

  describe('authorize', () => {
    it('should allow access when user has required role', () => {
      mockRequest.user = {
        userId: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'School_Admin' as UserRole
      };

      const middleware = authorize('School_Admin' as UserRole);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access when user does not have required role', () => {
      mockRequest.user = {
        userId: 2,
        username: 'teacher',
        email: 'teacher@example.com',
        role: 'Subject_Teacher' as UserRole
      };

      const middleware = authorize('School_Admin' as UserRole);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'You do not have permission to perform this action'
        })
      );
    });

    it('should allow access when user has one of multiple allowed roles', () => {
      mockRequest.user = {
        userId: 2,
        username: 'teacher',
        email: 'teacher@example.com',
        role: 'Subject_Teacher' as UserRole
      };

      const middleware = authorize(
        'School_Admin' as UserRole,
        'Subject_Teacher' as UserRole
      );
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should throw error when user is not authenticated', () => {
      const middleware = authorize('School_Admin' as UserRole);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication required'
        })
      );
    });
  });

  describe('requirePermissions', () => {
    it('should allow access when user has all required permissions', () => {
      mockRequest.user = {
        userId: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'School_Admin' as UserRole,
        permissions: ['read:students', 'write:students', 'delete:students']
      };

      const middleware = requirePermissions('read:students', 'write:students');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access when user lacks required permissions', () => {
      mockRequest.user = {
        userId: 2,
        username: 'teacher',
        email: 'teacher@example.com',
        role: 'Subject_Teacher' as UserRole,
        permissions: ['read:students']
      };

      const middleware = requirePermissions('read:students', 'delete:students');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'You do not have the required permissions'
        })
      );
    });

    it('should deny access when user has no permissions', () => {
      mockRequest.user = {
        userId: 3,
        username: 'student',
        email: 'student@example.com',
        role: 'Student' as UserRole
      };

      const middleware = requirePermissions('read:students');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'You do not have the required permissions'
        })
      );
    });
  });

  describe('optionalAuth', () => {
    it('should attach current active user when a valid token is provided', async () => {
      const mockDecoded = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'School_Admin' as UserRole
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      (authService.verifyAccessToken as jest.Mock).mockReturnValue(mockDecoded);
      jest.spyOn(User, 'findByPk').mockResolvedValue({
        ...mockDecoded,
        status: UserStatus.ACTIVE,
        schoolConfigId: 'school-1',
        isAccountLocked: () => false,
      } as never);

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toMatchObject(mockDecoded);
      expect(mockRequest.user?.schoolConfigId).toBe('school-1');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should not throw error when no token is provided', () => {
      optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should not throw error when invalid token is provided', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      (authService.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('requireSelfAccess', () => {
    it('should allow user to access their own resource', () => {
      mockRequest.user = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'Student' as UserRole
      };
      mockRequest.params = { userId: '1' };

      const middleware = requireSelfAccess();
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow admin to access any resource', () => {
      mockRequest.user = {
        userId: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'School_Admin' as UserRole
      };
      mockRequest.params = { userId: '2' };

      const middleware = requireSelfAccess();
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny user from accessing other user resources', () => {
      mockRequest.user = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'Student' as UserRole
      };
      mockRequest.params = { userId: '2' };

      const middleware = requireSelfAccess();
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'You can only access your own resources'
        })
      );
    });

    it('should handle custom user ID parameter name', () => {
      mockRequest.user = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'Student' as UserRole
      };
      mockRequest.params = { studentId: '1' };

      const middleware = requireSelfAccess('studentId');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('requireResourceOwnership', () => {
    it('should allow owner to access their resource', async () => {
      mockRequest.user = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'Student' as UserRole
      };

      const getOwnerId = jest.fn().mockResolvedValue(1);
      const middleware = requireResourceOwnership(getOwnerId);

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(getOwnerId).toHaveBeenCalledWith(mockRequest);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow admin to access any resource', async () => {
      mockRequest.user = {
        userId: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'School_Admin' as UserRole
      };

      const getOwnerId = jest.fn().mockResolvedValue(2);
      const middleware = requireResourceOwnership(getOwnerId);

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny non-owner from accessing resource', async () => {
      mockRequest.user = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'Student' as UserRole
      };

      const getOwnerId = jest.fn().mockResolvedValue(2);
      const middleware = requireResourceOwnership(getOwnerId);

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'You do not own this resource'
        })
      );
    });

    it('should handle resource not found', async () => {
      mockRequest.user = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'Student' as UserRole
      };

      const getOwnerId = jest.fn().mockResolvedValue(null);
      const middleware = requireResourceOwnership(getOwnerId);

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Resource not found'
        })
      );
    });
  });
});
