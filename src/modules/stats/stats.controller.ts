import { ApiResponse } from '@utils/response';
import { NextFunction, Request, Response } from 'express';

import { StatsService } from './stats.service';

export class StatsController {
  private statsService: StatsService;

  constructor() {
    this.statsService = new StatsService();
  }

  /**
   * GET /api/stats/platform
   * Public endpoint - no authentication required
   */
  getPlatformStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.statsService.getPlatformStats();
      ApiResponse.success(res, stats, 'Platform stats retrieved');
    } catch (error) {
      next(error);
    }
  };
}
