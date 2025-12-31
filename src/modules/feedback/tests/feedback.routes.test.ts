import request from 'supertest';
import app from '../../../app';
import { getToken } from 'next-auth/jwt';
import { Feedback } from '../feedback.model';

// Mock dependencies
jest.mock('next-auth/jwt');
jest.mock('../feedback.model');

describe('Feedback Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getToken as jest.Mock).mockResolvedValue({
      sub: 'user-1',
      email: 'test@example.com',
    });
    // Mock save
    (Feedback.prototype.save as jest.Mock).mockResolvedValue(true);
  });

  describe('POST /api/feedback', () => {
    it('should submit feedback successfully', async () => {
      const response = await request(app).post('/api/feedback').send({
        category: 'bug',
        message: 'Found a bug',
        contactConsent: true,
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(Feedback.prototype.save).toHaveBeenCalled();
    });

    it('should fail with missing fields', async () => {
      const response = await request(app).post('/api/feedback').send({
        category: 'bug',
        // message missing
      });

      expect(response.status).toBe(400);
    });
  });
});
