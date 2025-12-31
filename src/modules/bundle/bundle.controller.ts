import { ApiResponse } from '@utils/response';
import { NextFunction, Request, Response } from 'express';

import { BundleService } from './bundle.service';

export class BundleController {
  private bundleService: BundleService;

  constructor() {
    this.bundleService = new BundleService();
  }

  /**
   * GET /api/bundles
   * Get all active bundles
   */
  getAllBundles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bundles = await this.bundleService.getAllBundles();
      ApiResponse.success(res, bundles, 'Bundles fetched successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/bundles/:id
   * Get bundle by ID
   */
  getBundleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const bundle = await this.bundleService.getBundleById(id);
      ApiResponse.success(res, bundle, 'Bundle fetched successfully');
    } catch (error) {
      next(error);
    }
  };
}
