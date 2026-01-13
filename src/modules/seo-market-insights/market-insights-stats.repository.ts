import type { IArchivedJobDocument } from '@modules/job/archived-job.model';
import type { IJobDocument } from '@modules/job/job.model';
import { FilterQuery } from 'mongoose';

import { InsightsFilters, MarketStats } from './market-insights.types';

/**
 * Repository for Market Statistics
 * Aggregates data from BOTH Job and ArchivedJob collections
 */
export class MarketInsightsStatsRepository {
  /**
   * Compute comprehensive market stats for given filters
   * Aggregates active + archived jobs for rich historical data
   */
  async computeStats(filters: InsightsFilters): Promise<MarketStats> {
    const matchStage = this.buildMatchStage(filters);

    const [totalJobs, jobsLast7Days, topSkills, salaryBands, experienceLevels, trendData] =
      await Promise.all([
        this.getTotalJobs(matchStage),
        this.getJobsLast7Days(matchStage),
        this.getTopSkills(matchStage),
        this.getSalaryBands(matchStage),
        this.getExperienceLevels(matchStage),
        this.getTrendData(matchStage),
      ]);

    return {
      totalJobs,
      jobsLast7Days,
      avgSalary: this.computeAvgSalary(salaryBands),
      topSkills: topSkills.slice(0, 10),
      salaryBands,
      experienceLevels,
      trendData,
      updatedAt: this.getRelativeTime(new Date()),
    };
  }

  /**
   * Build MongoDB match stage from filters
   */
  private buildMatchStage(filters: InsightsFilters) {
    const match: any = {};

    if (filters.category) {
      // Match jobs that contain the category in techStack OR in normalizedJobTitle
      const categoryRegex = new RegExp(filters.category, 'i');
      match.$or = [
        { 'parsedData.techStack': { $in: [categoryRegex] } },
        { 'parsedData.normalizedJobTitle': categoryRegex },
      ];
    }

    if (filters.region === 'europe') {
      // Match European countries
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
      match['parsedData.location'] = {
        $regex: new RegExp(europeanCountries.join('|'), 'i'),
      };
    } else if (filters.region && filters.region !== 'worldwide') {
      match['parsedData.location'] = new RegExp(filters.region, 'i');
    }

    if (filters.remote === true) {
      match['parsedData.isRemote'] = true;
    }

    return match;
  }

  /**
   * Get total jobs count (active + archived)
   * Following stats.service.ts pattern for consistency
   */
  private async getTotalJobs(
    matchStage: FilterQuery<IJobDocument | IArchivedJobDocument>
  ): Promise<number> {
    const { Job } = await import('@modules/job/job.model');
    const { ArchivedJob } = await import('@modules/job/archived-job.model');

    const [activeCount, archivedCount] = await Promise.all([
      Job.countDocuments(matchStage),
      ArchivedJob.countDocuments(matchStage),
    ]);

    return activeCount + archivedCount;
  }

  /**
   * Get jobs posted in last 7 days (active jobs only)
   * Provides freshness signal for SEO
   */
  private async getJobsLast7Days(
    matchStage: FilterQuery<IJobDocument | IArchivedJobDocument>
  ): Promise<number> {
    const { Job } = await import('@modules/job/job.model');
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return Job.countDocuments({
      ...matchStage,
      telegramMessageDate: { $gte: last7Days },
    });
  }

  /**
   * Get top skills across active + archived jobs
   * Merges counts from both collections
   */
  private async getTopSkills(
    matchStage: FilterQuery<IJobDocument | IArchivedJobDocument>
  ): Promise<Array<{ name: string; count: number }>> {
    const { Job } = await import('@modules/job/job.model');
    const { ArchivedJob } = await import('@modules/job/archived-job.model');

    const [activeSkills, archivedSkills] = await Promise.all([
      Job.aggregate([
        { $match: matchStage },
        { $unwind: '$parsedData.techStack' },
        { $group: { _id: '$parsedData.techStack', count: { $sum: 1 } } },
        { $project: { name: '$_id', count: 1, _id: 0 } },
      ]),
      ArchivedJob.aggregate([
        { $match: matchStage },
        { $unwind: '$parsedData.techStack' },
        { $group: { _id: '$parsedData.techStack', count: { $sum: 1 } } },
        { $project: { name: '$_id', count: 1, _id: 0 } },
      ]),
    ]);

    // Merge and sum counts
    const skillsMap = new Map<string, number>();
    [...activeSkills, ...archivedSkills].forEach(
      ({ name, count }: { name: string; count: number }) => {
        skillsMap.set(name, (skillsMap.get(name) || 0) + count);
      }
    );

    return Array.from(skillsMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }

  /**
   * Get salary distribution bands
   * TODO: Implement salary parsing and grouping
   */
  private async getSalaryBands(
    matchStage: FilterQuery<IJobDocument | IArchivedJobDocument>
  ): Promise<{ band: string; count: number }[]> {
    const { Job: JobModel } = await import('@modules/job/job.model');
    const { ArchivedJob: ArchivedJobModel } = await import('@modules/job/archived-job.model');

    // Aggregate salary data from both collections
    const activeResults = await JobModel.aggregate([
      { $match: matchStage },
      {
        $match: {
          'parsedData.salary': { $exists: true, $ne: null },
        },
      },
      {
        $project: {
          salary: '$parsedData.salary',
        },
      },
    ]);

    const archivedResults = await ArchivedJobModel.aggregate([
      { $match: matchStage },
      {
        $match: {
          'parsedData.salary': { $exists: true, $ne: null },
        },
      },
      {
        $project: {
          salary: '$parsedData.salary',
        },
      },
    ]);

    // Combine and parse salaries
    const allSalaries = [...activeResults, ...archivedResults];
    const parsedSalaries = allSalaries
      .map((doc) => this.parseSalary(doc.salary))
      .filter((amount): amount is number => amount !== null);

    if (parsedSalaries.length === 0) {
      return [];
    }

    // Group into bands
    const bands = [
      { min: 0, max: 1000, label: '$0-1k' },
      { min: 1000, max: 2000, label: '$1k-2k' },
      { min: 2000, max: 3000, label: '$2k-3k' },
      { min: 3000, max: 4000, label: '$3k-4k' },
      { min: 4000, max: 5000, label: '$4k-5k' },
      { min: 5000, max: 7000, label: '$5k-7k' },
      { min: 7000, max: 10000, label: '$7k-10k' },
      { min: 10000, max: Infinity, label: '$10k+' },
    ];

    return bands
      .map((band) => ({
        band: band.label,
        count: parsedSalaries.filter((s) => s >= band.min && s < band.max).length,
      }))
      .filter((b) => b.count > 0);
  }

  /**
   * Get experience level distribution (active + archived)
   */
  private async getExperienceLevels(
    matchStage: FilterQuery<IJobDocument | IArchivedJobDocument>
  ): Promise<Array<{ level: string; count: number }>> {
    const { Job } = await import('@modules/job/job.model');
    const { ArchivedJob } = await import('@modules/job/archived-job.model');

    const [activeLevels, archivedLevels] = await Promise.all([
      Job.aggregate([
        { $match: matchStage },
        { $group: { _id: '$parsedData.level', count: { $sum: 1 } } },
        { $project: { level: '$_id', count: 1, _id: 0 } },
      ]),
      ArchivedJob.aggregate([
        { $match: matchStage },
        { $group: { _id: '$parsedData.level', count: { $sum: 1 } } },
        { $project: { level: '$_id', count: 1, _id: 0 } },
      ]),
    ]);

    // Merge counts
    const levelsMap = new Map<string, number>();
    [...activeLevels, ...archivedLevels].forEach(
      ({ level, count }: { level: string; count: number }) => {
        if (level) levelsMap.set(level, (levelsMap.get(level) || 0) + count);
      }
    );

    return Array.from(levelsMap.entries())
      .map(([level, count]) => ({ level, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get 7-day trend data (active jobs only)
   * Shows recent posting velocity for market insights
   * Fills missing days with zero counts for consistent chart rendering
   */
  private async getTrendData(
    matchStage: FilterQuery<IJobDocument | IArchivedJobDocument>
  ): Promise<Array<{ date: string; jobs: number }>> {
    const { Job } = await import('@modules/job/job.model');
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const results = await Job.aggregate([
      {
        $match: {
          ...matchStage,
          telegramMessageDate: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$telegramMessageDate' },
          },
          jobs: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', jobs: 1, _id: 0 } },
    ]);

    // Create map of existing data
    const dataMap = new Map<string, number>();
    results.forEach(({ date, jobs }) => {
      dataMap.set(date, jobs);
    });

    // Fill in all 7 days (missing days get 0 jobs)
    const fullTrendData: Array<{ date: string; jobs: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      fullTrendData.push({
        date: dateStr,
        jobs: dataMap.get(dateStr) || 0,
      });
    }

    return fullTrendData;
  }

  /**
   * Compute average salary from salary bands
   * Uses weighted average based on band midpoints and counts
   */
  private computeAvgSalary(salaryBands: Array<{ band: string; count: number }>): string | null {
    if (!salaryBands || salaryBands.length === 0) {
      return null;
    }

    // Map bands to midpoints
    const bandMidpoints: Record<string, number> = {
      '$0-1k': 500,
      '$1k-2k': 1500,
      '$2k-3k': 2500,
      '$3k-4k': 3500,
      '$4k-5k': 4500,
      '$5k-7k': 6000,
      '$7k-10k': 8500,
      '$10k+': 12000, // Estimate for 10k+ band
    };

    let totalWeighted = 0;
    let totalCount = 0;

    salaryBands.forEach(({ band, count }) => {
      const midpoint = bandMidpoints[band];
      if (midpoint) {
        totalWeighted += midpoint * count;
        totalCount += count;
      }
    });

    if (totalCount === 0) {
      return null;
    }

    const avgSalary = Math.round(totalWeighted / totalCount);

    // Format as readable string (e.g., "$4,500/mo")
    return `$${avgSalary.toLocaleString()}/mo`;
  }

  /**
   * Parse salary string to monthly USD amount
   * Examples:
   * - "$5000" → 5000
   * - "€3000-4000" → 3500 (average)
   * - "200k RUB" → ~2100 (converted)
   * - "$80/hour" → ~13,867 (monthly)
   */
  private parseSalary(salaryStr: string): number | null {
    if (!salaryStr || typeof salaryStr !== 'string') return null;

    const normalized = salaryStr.toLowerCase().trim();

    // Extract numbers
    const numbers = normalized.match(/\d+(?:,\d{3})*(?:\.\d+)?/g);
    if (!numbers || numbers.length === 0) return null;

    const amounts = numbers.map((n) => parseFloat(n.replace(/,/g, '')));

    // Handle ranges (e.g., "3000-5000")
    const averageAmount = amounts.reduce((sum, num) => sum + num, 0) / amounts.length;

    // Detect currency and convert to USD monthly
    let usdMonthly = averageAmount;

    // Handle hourly rates (convert to monthly: hourly * 173 hours)
    if (/hour|hr|ч|час/.test(normalized)) {
      usdMonthly = averageAmount * 173; // Average 173 work hours/month
    }
    // Handle annual salaries (divide by 12)
    else if (/year|yr|annual|год/.test(normalized) || /\d{6,}/.test(normalized)) {
      usdMonthly = averageAmount / 12;
    }

    // Currency conversions (approximate rates)
    if (/€|eur|euro/.test(normalized)) {
      usdMonthly *= 1.1; // EUR to USD
    } else if (/£|gbp|pound/.test(normalized)) {
      usdMonthly *= 1.27; // GBP to USD
    } else if (/₽|rub|руб/.test(normalized)) {
      usdMonthly *= 0.011; // RUB to USD (~90 RUB = 1 USD)
    } else if (/тг|kzt|tenge/.test(normalized)) {
      usdMonthly *= 0.0022; // KZT to USD (~450 KZT = 1 USD)
    }
    // Default: assume USD if no currency specified

    // Sanity check: monthly salary should be between $100 and $50,000
    if (usdMonthly < 100 || usdMonthly > 50000) {
      return null;
    }

    return Math.round(usdMonthly);
  }

  /**
   * Get relative time string ("2 hours ago")
   */
  private getRelativeTime(date: Date): string {
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  }
}
