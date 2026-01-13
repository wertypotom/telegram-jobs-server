import { NotFoundError } from '@utils/errors';
import { Logger } from '@utils/logger';

import { InsightsFilters, MarketStats } from './market-insights.types';
import { MarketInsightsConfigRepository } from './market-insights-config.repository';
import { MarketInsightsJobRepository } from './market-insights-job.repository';
import { MarketInsightsStatsRepository } from './market-insights-stats.repository';

export class MarketInsightsService {
  private configRepo: MarketInsightsConfigRepository;
  private statsRepo: MarketInsightsStatsRepository;
  private jobRepo: MarketInsightsJobRepository;

  constructor() {
    this.configRepo = new MarketInsightsConfigRepository();
    this.statsRepo = new MarketInsightsStatsRepository();
    this.jobRepo = new MarketInsightsJobRepository();
  }

  /**
   * Get complete insights page data
   * @param slug - Page slug (e.g., "python", "europe", "python/europe")
   * @param locale - Language locale ("en" or "ru")
   */
  async getPageData(slug: string, locale: string) {
    const config = await this.configRepo.findBySlug(slug);
    if (!config) {
      throw new NotFoundError(`Insights page not found: ${slug}`);
    }

    const [stats, jobs] = await Promise.all([
      this.statsRepo.computeStats(config.filters),
      this.jobRepo.findRecentJobs(config.filters, 5),
    ]);

    // Validate minimum job count
    if (stats.totalJobs < config.minJobCount) {
      Logger.warn(`Insights page has insufficient jobs`, {
        slug,
        totalJobs: stats.totalJobs,
        required: config.minJobCount,
      });
    }

    // Type-safe locale access
    const validLocale = locale === 'ru' ? 'ru' : 'en';

    return {
      config: {
        slug: config.slug,
        template: config.template,
      },
      meta: config.meta[validLocale],
      faq: config.faq[validLocale],
      stats,
      jobs,
    };
  }

  /**
   * Get all active page slugs for sitemap generation
   */
  async getAllPageSlugs(): Promise<string[]> {
    const configs = await this.configRepo.findAllActive();
    return configs.map((c) => c.slug);
  }

  /**
   * Compute stats for specific filters (used by seed validation)
   */
  async computeStatsForFilters(filters: InsightsFilters): Promise<MarketStats> {
    return this.statsRepo.computeStats(filters);
  }
}
