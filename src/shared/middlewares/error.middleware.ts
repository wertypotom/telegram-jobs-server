import { Request, Response, NextFunction } from 'express';
import { AppError } from '@utils/errors';
import { ErrorCode } from '../types/error-codes';
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
      code: err.code,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    });

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
      },
    });
    return;
  }

  // Unhandled errors (programming errors)
  Logger.error('Unhandled error:', err);

  const statusCode = 500;
  const message =
    envConfig.nodeEnv === 'development' ? err.message : 'Internal Server Error';

  const response: any = {
    success: false,
    error: {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message,
      statusCode,
    },
  };

  if (envConfig.nodeEnv === 'development') {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: {
      code: ErrorCode.RESOURCE_NOT_FOUND,
      message: `Route ${req.originalUrl} not found`,
      statusCode: 404,
    },
  });
};
