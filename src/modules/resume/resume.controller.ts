import { AuthRequest } from '@shared/middlewares/auth.middleware';
import { BadRequestError } from '@utils/errors';
import { ApiResponse } from '@utils/response';
import { NextFunction, Response } from 'express';

import { ResumeService } from './resume.service';

export class ResumeController {
  private resumeService: ResumeService;

  constructor() {
    this.resumeService = new ResumeService();
  }

  uploadResume = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new BadRequestError('No file uploaded');
      }

      const userId = req.userId!;
      const filePath = req.file.path;
      const mimeType = req.file.mimetype;

      const result = await this.resumeService.uploadResume(userId, filePath, mimeType);
      ApiResponse.success(res, result, 'Resume uploaded successfully');
    } catch (error) {
      next(error);
    }
  };
}
