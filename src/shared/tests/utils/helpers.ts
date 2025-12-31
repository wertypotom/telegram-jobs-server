import { envConfig } from '@config/env.config';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

export const generateTestToken = (userId?: string | Types.ObjectId) => {
  const payload = {
    userId: userId || new Types.ObjectId(),
  };

  return jwt.sign(payload, envConfig.jwtSecret, { expiresIn: '1h' });
};

export const createTestUser = (overrides = {}) => {
  return {
    _id: new Types.ObjectId(),
    email: 'test@example.com',
    name: 'Test User',
    ...overrides,
  };
};
