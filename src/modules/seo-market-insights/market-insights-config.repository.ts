import { InsightsPageConfigModel } from './market-insights.model';
import { InsightsPageConfig } from './market-insights.types';

/**
 * Repository for Insights Page Configuration
 * Data access layer for CRUD operations on page configs
 */
export class MarketInsightsConfigRepository {
  /**
   * Find active page config by slug
   */
  async findBySlug(slug: string): Promise<InsightsPageConfig | null> {
    return InsightsPageConfigModel.findOne({ slug, isActive: true }).lean();
  }

  /**
   * Find all active page configs, sorted by priority
   */
  async findAllActive(): Promise<InsightsPageConfig[]> {
    return InsightsPageConfigModel.find({ isActive: true }).sort({ priority: -1, slug: 1 }).lean();
  }

  /**
   * Create new page config
   */
  async create(config: Partial<InsightsPageConfig>): Promise<InsightsPageConfig> {
    const doc = await InsightsPageConfigModel.create(config);
    return doc.toObject();
  }

  /**
   * Update existing page config
   */
  async update(
    slug: string,
    updates: Partial<InsightsPageConfig>
  ): Promise<InsightsPageConfig | null> {
    const doc = await InsightsPageConfigModel.findOneAndUpdate(
      { slug },
      { $set: updates },
      { new: true }
    );
    return doc?.toObject() || null;
  }

  /**
   * Count total active pages
   */
  async countActive(): Promise<number> {
    return InsightsPageConfigModel.countDocuments({ isActive: true });
  }
}
