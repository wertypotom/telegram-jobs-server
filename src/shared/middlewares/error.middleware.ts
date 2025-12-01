import { Request, Response, NextFunction } from 'express';
import { AppError } from '@utils/errors';
import { ApiResponse } from '@utils/response';
import { Logger } from '@utils/logger';
import { envConfig } from '@config/env.config';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    Logger.error(`Operational error: ${err.message}`, {
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    });

    ApiResponse.error(res, err.message, err.statusCode);
    return;
  }

  // Unhandled errors
  Logger.error('Unhandled error:', err);

  const statusCode = 500;
  const message = envConfig.nodeEnv === 'development' 
    ? err.message 
    : 'Internal Server Error';

  const response: any = {
    success: false,
    message,
  };

  if (envConfig.nodeEnv === 'development') {
    response.stack = err.stack;
    response.error = err.message;
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  ApiResponse.error(res, `Route ${req.originalUrl} not found`, 404);
};
