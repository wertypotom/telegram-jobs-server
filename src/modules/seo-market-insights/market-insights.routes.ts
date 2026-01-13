import { Router } from 'express';

import { MarketInsightsController } from './market-insights.controller';

const router = Router();
const controller = new MarketInsightsController();

/**
 * Public endpoints - no authentication required
 */

// Get insights page data
router.get('/page/:slug', controller.getPageData);

// Get all slugs for sitemap generation
router.get('/slugs', controller.getAllSlugs);

export default router;
