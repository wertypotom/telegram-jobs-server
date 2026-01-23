import { Job } from '@modules/job/job.model';

import { InsightsFilters } from './market-insights.types';

/**
 * Dedicated repository for SEO Market Insights job queries
 * Follows Single Responsibility Principle - separate from JobRepository
 * which handles user dashboard queries
 */
export class MarketInsightsJobRepository {
  /**
   * Find recent jobs for insights pages with lean projection
   * Excludes heavy fields (rawText, company, techStack) for SEO pages
   */
  async findRecentJobs(filters: InsightsFilters, limit: number = 10): Promise<any[]> {
    const query = this.buildQuery(filters);

    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select({
        // Lean projection for insights pages
        _id: 1,
        createdAt: 1,
        telegramMessageDate: 1,
        'parsedData.jobTitle': 1,
        'parsedData.salary': 1,
        'parsedData.level': 1,
        'parsedData.candidateLocation': 1,
        'parsedData.location': 1,
        'parsedData.isRemote': 1,
        'parsedData.employmentType': 1,
        'parsedData.contactInfo': 1,
      })
      .lean();

    return jobs;
  }

  /**
   * Build MongoDB query from insights filters
   * Private method - encapsulates query building logic
   */
  private buildQuery(filters: InsightsFilters): any {
    const query: any = {};

    if (filters.category) {
      const categoryRegex = new RegExp(filters.category, 'i');
      query.$or = [
        { 'parsedData.techStack': { $in: [categoryRegex] } },
        { 'parsedData.normalizedJobTitle': categoryRegex },
      ];
    }

    if (filters.region === 'europe') {
      const europeanCountries = [
        'germany',
        'france',
        'spain',
        'italy',
        'netherlands',
        'poland',
        'sweden',
        'norway',
        'denmark',
        'switzerland',
        'austria',
        'belgium',
        'portugal',
        'czech',
        'greece',
        'romania',
        'hungary',
        'finland',
        'ireland',
      ];
      query['parsedData.location'] = {
        $regex: new RegExp(europeanCountries.join('|'), 'i'),
      };
    } else if (filters.region && filters.region !== 'worldwide') {
      query['parsedData.location'] = new RegExp(filters.region, 'i');
    }

    if (filters.remote === true) {
      query['parsedData.isRemote'] = true;
    }

    if (filters.level) {
      query['parsedData.level'] = new RegExp(filters.level, 'i');
    }

    return query;
  }
}
