import { AuthRequest } from '@shared/middlewares/auth.middleware';
import { ApiResponse } from '@utils/response';
import { NextFunction, Request, Response } from 'express';

import { JobService } from './job.service';
import { JobFilterOptions } from './job.types';

export class JobController {
  private jobService: JobService;

  constructor() {
    this.jobService = new JobService();
  }

  getJobs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { filters = {}, pagination = {} } = req.body;
      const { limit = 20, offset = 0 } = pagination;
      const userId = req.userId!;

      const options: JobFilterOptions = {
        stack: filters.stack || undefined,
        level: filters.level || undefined,
        jobFunction: filters.jobFunction || undefined,
        locationType: filters.locationType || undefined,
        excludedTitles: filters.excludedTitles || undefined,
        muteKeywords: filters.muteKeywords || undefined,
        experienceYears: filters.experienceYears || undefined,
        isRemote: filters.isRemote,
        limit,
        offset,
      };

      // Service will fetch user and get subscribedChannels
      const result = await this.jobService.getJobFeed(options, userId);
      ApiResponse.success(res, result, 'Jobs retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getJobById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const job = await this.jobService.getJobById(id);
      ApiResponse.success(res, job, 'Job retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  markJobAsViewed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;

      await this.jobService.markJobAsViewed(userId, id);
      ApiResponse.success(res, { success: true }, 'Job marked as viewed');
    } catch (error) {
      next(error);
    }
  };

  searchSkills = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q } = req.query;
      const skills = await this.jobService.searchSkills(q as string);
      ApiResponse.success(res, skills, 'Skills retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  searchJobFunctions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q } = req.query;
      const jobFunctions = await this.jobService.searchJobFunctions(q as string);
      ApiResponse.success(res, jobFunctions, 'Job functions retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}
