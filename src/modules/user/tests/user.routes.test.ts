import mongoose from 'mongoose';
import { getToken } from 'next-auth/jwt';
import request from 'supertest';

import app from '../../../app';

// Mock next-auth/jwt
jest.mock('next-auth/jwt');

describe('User Routes Integration Tests', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockUserEmail = 'test@example.com';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users/preferences/filters', () => {
    it('should return 401 if not authenticated', async () => {
      (getToken as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/users/preferences/filters');

      expect(response.status).toBe(401);
    });

    it('should return default filters for new user', async () => {
      (getToken as jest.Mock).mockResolvedValue({
        sub: mockUserId,
        email: mockUserEmail,
      });

      const response = await request(app).get('/api/users/preferences/filters');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({
        jobFunction: [],
        level: [],
        stack: [],
        locationType: [],
        excludedTitles: [],
        muteKeywords: [],
      });
    });
  });

  describe('PUT /api/users/preferences/filters', () => {
    const newFilters = {
      stack: ['Node.js'],
      level: ['Senior'],
      locationType: ['Remote'],
      jobFunction: ['Backend'],
      excludedTitles: [],
      muteKeywords: [],
    };

    it('should save and return updated filters', async () => {
      (getToken as jest.Mock).mockResolvedValue({
        sub: mockUserId,
        email: mockUserEmail,
      });

      const response = await request(app)
        .put('/api/users/preferences/filters')
        .send({ filters: newFilters });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(expect.objectContaining(newFilters));
    });
  });
});
