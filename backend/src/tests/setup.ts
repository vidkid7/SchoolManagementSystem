/**
 * Jest Test Setup
 * Runs before all tests
 */

import { Request, Response } from 'express';
import { initializeAssociations } from '@models/associations';

// Initialize model associations
initializeAssociations();

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_min_32_characters_long_for_testing';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_min_32_characters_long_for_testing';
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.SESSION_SECRET = 'test_session_secret';

// Set database environment variables for tests
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_NAME = 'school_management_system';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = 'Dhire12345@@';
process.env.DB_POOL_MIN = '2';
process.env.DB_POOL_MAX = '10';

// Increase timeout for integration tests
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Global test utilities
export const mockRequest = (data: Partial<Request> = {}): Partial<Request> => ({
  body: {},
  query: {},
  params: {},
  headers: {},
  user: undefined,
  ...data
} as Partial<Request>);

export const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    removeHeader: jest.fn().mockReturnThis()
  } as Partial<Response>;
  return res;
};

export const mockNext = (): jest.Mock => jest.fn();
