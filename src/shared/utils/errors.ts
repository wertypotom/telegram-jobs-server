import { ErrorCode } from '../types/error-codes';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    code?: ErrorCode, // Optional for backward compatibility
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    // Default codes based on status if not provided
    this.code = code || this.getDefaultCode(statusCode);
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  private getDefaultCode(statusCode: number): ErrorCode {
    if (statusCode === 400) return ErrorCode.VALIDATION_ERROR;
    if (statusCode === 401) return ErrorCode.UNAUTHORIZED;
    if (statusCode === 403) return ErrorCode.FORBIDDEN;
    if (statusCode === 404) return ErrorCode.RESOURCE_NOT_FOUND;
    if (statusCode === 409) return ErrorCode.RESOURCE_ALREADY_EXISTS;
    if (statusCode === 429) return ErrorCode.RATE_LIMIT_EXCEEDED;
    return ErrorCode.INTERNAL_SERVER_ERROR;
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', code?: ErrorCode) {
    super(400, message, code || ErrorCode.VALIDATION_ERROR);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code?: ErrorCode) {
    super(401, message, code || ErrorCode.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code?: ErrorCode) {
    super(403, message, code || ErrorCode.FORBIDDEN);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code?: ErrorCode) {
    super(404, message, code || ErrorCode.RESOURCE_NOT_FOUND);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', code?: ErrorCode) {
    super(409, message, code || ErrorCode.RESOURCE_ALREADY_EXISTS);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(429, message, ErrorCode.RATE_LIMIT_EXCEEDED);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error', code?: ErrorCode) {
    super(500, message, code || ErrorCode.INTERNAL_SERVER_ERROR);
  }
}
