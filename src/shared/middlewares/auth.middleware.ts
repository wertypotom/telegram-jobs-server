import { envConfig } from '@config/env.config';
import { UnauthorizedError } from '@utils/errors';
import { NextFunction, Request, Response } from 'express';
import { getToken } from 'next-auth/jwt';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

/**
 * Middleware to authenticate requests using NextAuth session
 * Works with NextAuth v4 JWT strategy
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Use NextAuth's getToken to decode the encrypted session token
    const token = await getToken({
      req: req as any,
      secret: process.env.NEXTAUTH_SECRET || envConfig.jwtSecret,
    });

    if (!token || !token.sub) {
      throw new UnauthorizedError('No valid session found');
    }

    // NextAuth stores user ID in 'sub' field (subject)
    req.userId = token.sub;
    req.userEmail = token.email as string | undefined;

    next();
  } catch (error) {
    // Pass error to Express error handler (don't throw)
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Invalid or expired session'));
    }
  }
};
