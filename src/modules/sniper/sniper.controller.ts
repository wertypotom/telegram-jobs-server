import { Request, Response, NextFunction } from 'express';
import { SniperService } from './sniper.service';
import { ApiResponse } from '@utils/response';
import { AuthRequest } from '@middlewares/auth.middleware';
import { TailorResumeRequest } from './sniper.types';

export class SniperController {
  private sniperService: SniperService;

  constructor() {
    this.sniperService = new SniperService();
  }

  generateTailoredResume = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.userId!;
      const { jobId }: TailorResumeRequest = req.body;

      const result = await this.sniperService.generateTailoredResume(userId, jobId);
      ApiResponse.success(res, result, 'Tailored resume generated successfully');
    } catch (error) {
      next(error);
    }
  };
}
