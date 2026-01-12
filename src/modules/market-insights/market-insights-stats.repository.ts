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
  private buildMatchStage(
    filters: InsightsFilters
  ): FilterQuery<IJobDocument | IArchivedJobDocument> {
    const match: FilterQuery<IJobDocument | IArchivedJobDocument> = {
      status: 'parsed',
    };

    if (filters.category) {
      // Match tech stack OR job function
      match.$or = [
        {
          'parsedData.techStack': { $in: [new RegExp(filters.category, 'i')] },
        },
        { 'parsedData.jobFunction': new RegExp(filters.category, 'i') },
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
    _matchStage: FilterQuery<IJobDocument | IArchivedJobDocument>
  ): Promise<Array<{ range: string; count: number }>> {
    // Placeholder - implement salary parsing logic
    return [];
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

    return results;
  }

  /**
   * Compute average salary from salary bands
   */
  private computeAvgSalary(_salaryBands: Array<{ range: string; count: number }>): string | null {
    // Placeholder - implement salary calculation
    return null;
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
