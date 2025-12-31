import { BadRequestError } from '@utils/errors';
import { NextFunction, Request, Response } from 'express';
import { Schema } from 'joi';

export const validate = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      throw new BadRequestError('Validation failed');
    }

    req.body = value;
    next();
  };
};
