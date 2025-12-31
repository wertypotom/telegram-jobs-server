import { AuthRequest } from '@shared/middlewares/auth.middleware';
import { ApiResponse } from '@utils/response';
import { NextFunction, Response } from 'express';

import { UserPreferencesService } from './user-preferences.service';

export class UserPreferencesController {
  private preferencesService: UserPreferencesService;

  constructor() {
    this.preferencesService = new UserPreferencesService();
  }

  getFilters = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      const filters = await this.preferencesService.getFilters(userId);
      ApiResponse.success(res, filters, 'Filters retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  saveFilters = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      const { filters } = req.body;

      const savedFilters = await this.preferencesService.saveFilters(userId, filters);

      ApiResponse.success(res, savedFilters, 'Filters saved successfully');
    } catch (error) {
      next(error);
    }
  };
}
