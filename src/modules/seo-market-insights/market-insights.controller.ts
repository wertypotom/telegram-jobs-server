import { Logger } from '@utils/logger';
import { ApiResponse } from '@utils/response';
import { NextFunction, Request, Response } from 'express';

import { MarketInsightsService } from './market-insights.service';

/**
 * Market Insights Controller
 * HTTP request handlers for insights API endpoints
 */
export class MarketInsightsController {
  private insightsService: MarketInsightsService;

  constructor() {
    this.insightsService = new MarketInsightsService();
  }

  /**
   * GET /api/market-insights/page/:slug
   * Get insights page data with stats
   */
  getPageData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const locale = (req.query.locale as string) || 'en';

      Logger.info('Fetching insights page', { slug, locale });

      const data = await this.insightsService.getPageData(slug, locale);

      ApiResponse.success(res, data);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/market-insights/slugs
   * Get all active page slugs for sitemap generation
   */
  getAllSlugs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      Logger.info('Fetching all insights slugs');

      const slugs = await this.insightsService.getAllPageSlugs();
      ApiResponse.success(res, { slugs });
    } catch (error) {
      next(error);
    }
  };
}
