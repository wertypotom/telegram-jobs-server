import { Request, Response, NextFunction } from 'express';
import { JobService } from './job.service';
import { ApiResponse } from '@utils/response';
import { JobFilterOptions } from './job.types';

export class JobController {
  private jobService: JobService;

  constructor() {
    this.jobService = new JobService();
  }

  getJobs = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const options: JobFilterOptions = {
        stack: req.query.stack
          ? Array.isArray(req.query.stack)
            ? (req.query.stack as string[])
            : [req.query.stack as string]
          : undefined,
        level: req.query.level as string,
        isRemote:
          req.query.isRemote === 'true'
            ? true
            : req.query.isRemote === 'false'
            ? false
            : undefined,
        jobFunction: req.query.jobFunction as string,
        excludedTitles: req.query.excludedTitles
          ? Array.isArray(req.query.excludedTitles)
            ? (req.query.excludedTitles as string[])
            : [req.query.excludedTitles as string]
          : undefined,
        muteKeywords: req.query.muteKeywords
          ? Array.isArray(req.query.muteKeywords)
            ? (req.query.muteKeywords as string[])
            : [req.query.muteKeywords as string]
          : undefined,
        locationType: req.query.locationType
          ? Array.isArray(req.query.locationType)
            ? (req.query.locationType as string[])
            : [req.query.locationType as string]
          : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const userId = (req as any).userId;
      const result = await this.jobService.getJobFeed(options, userId);
      ApiResponse.success(res, result, 'Jobs retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getJobById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const job = await this.jobService.getJobById(id);
      ApiResponse.success(res, job, 'Job retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  markJobAsViewed = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;

      await this.jobService.markJobAsViewed(userId, id);
      ApiResponse.success(res, { success: true }, 'Job marked as viewed');
    } catch (error) {
      next(error);
    }
  };
}
