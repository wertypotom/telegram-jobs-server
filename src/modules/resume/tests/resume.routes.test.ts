import mongoose from 'mongoose';
import { getToken } from 'next-auth/jwt';
import request from 'supertest';

import app from '../../../app';
import { UserRepository } from '../../user/user.repository';
import { FileExtractorService } from '../services/file-extractor.service';

// Mock dependencies
jest.mock('next-auth/jwt');
jest.mock('../../user/user.repository'); // Mock repo entirely to control state
jest.mock('../services/file-extractor.service');

describe('Resume Routes Integration Tests', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
    (getToken as jest.Mock).mockResolvedValue({
      sub: mockUserId,
      email: 'test@example.com',
    });

    // Mock FileExtractor to return dummy text
    (FileExtractorService.prototype.extractText as jest.Mock).mockResolvedValue(
      'Mocked Resume Content'
    );

    // Mock user repo findById
    (UserRepository.prototype.findById as jest.Mock).mockResolvedValue({
      _id: mockUserId,
      email: 'test@example.com',
    });
    // Mock user repo updateById
    (UserRepository.prototype.updateById as jest.Mock).mockResolvedValue(true);
  });

  describe('POST /api/resume/upload', () => {
    it('should upload resume file and return extracted text', async () => {
      // Create a buffer to simulate a file
      const fileBuffer = Buffer.from('dummy pdf content');

      const response = await request(app)
        .post('/api/resume/upload')
        .attach('resume', fileBuffer, 'resume.pdf');

      expect(response.status).toBe(200);
      expect(response.body.data.message).toContain('processed successfully');
      expect(FileExtractorService.prototype.extractText).toHaveBeenCalled();
      expect(UserRepository.prototype.updateById).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({ masterResumeText: 'Mocked Resume Content' })
      );
    });

    it('should handle missing file upload', async () => {
      const response = await request(app).post('/api/resume/upload'); // No attachment

      // Multer usually throws 400 or 500 depending on config/middleware
      // In this app, the validator might catch it, or service checks logic
      expect(response.status).not.toBe(200);
    });
  });
});
