import { AppError } from '@utils/errors';
import { Logger } from '@utils/logger';
import { NextFunction, Request, Response } from 'express';
import { getToken } from 'next-auth/jwt';

import { authenticate } from '../auth.middleware';
import { errorHandler } from '../error.middleware';

// Mock next-auth/jwt
jest.mock('next-auth/jwt');

// Manual mock for Logger to ensure it's completely replaced
jest.mock('@utils/logger', () => ({
  Logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Middleware Unit Tests', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('Auth Middleware', () => {
    it('should call next() if token is valid', async () => {
      (getToken as jest.Mock).mockResolvedValue({
        sub: 'user-id-123',
        email: 'test@example.com',
      });

      await authenticate(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      // The middleware assigns userId to the request object
      expect((req as any).userId).toBe('user-id-123');
    });

    it('should call next with 401 if no token found', async () => {
      (getToken as jest.Mock).mockResolvedValue(null);

      await authenticate(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = (next as jest.Mock).mock.calls[0][0];
      // Check properties instead of instanceof to avoid compilation/mocking issues
      expect(error).toBeDefined();
      expect(error.statusCode).toBe(401);
    });

    it('should call next with 401 if token has no sub', async () => {
      (getToken as jest.Mock).mockResolvedValue({
        email: 'no-sub@example.com',
      });

      await authenticate(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = (next as jest.Mock).mock.calls[0][0];
      expect(error).toBeDefined();
      expect(error.statusCode).toBe(401);
    });
  });

  describe('Error Handler Middleware', () => {
    it('should handle AppError correctly', () => {
      const error = new AppError(400, 'Test error', 'TEST_ERROR' as any);

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TEST_ERROR',
          message: 'Test error',
          statusCode: 400,
        },
      });
    });

    it('should handle generic Error as 500', () => {
      const error = new Error('Something went wrong');

      errorHandler(error, req as Request, res as Response, next);

      expect(Logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            statusCode: 500,
            message: expect.any(String),
          }),
        })
      );
    });
  });
});
