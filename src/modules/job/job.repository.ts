import { Job, IJobDocument } from './job.model';
import { IJob } from '@shared/types/common.types';
import { JobFilterOptions } from './job.types';

export class JobRepository {
  async create(jobData: Partial<IJob>): Promise<IJobDocument> {
    const job = new Job(jobData);
    return await job.save();
  }

  async findById(id: string): Promise<IJobDocument | null> {
    return await Job.findById(id);
  }

  async findByMessageId(messageId: string): Promise<IJobDocument | null> {
    return await Job.findOne({ telegramMessageId: messageId });
  }

  async updateById(
    id: string,
    data: Partial<IJob>
  ): Promise<IJobDocument | null> {
    return await Job.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteById(id: string): Promise<void> {
    await Job.findByIdAndDelete(id);
  }

  async findWithFilters(
    options: JobFilterOptions
  ): Promise<{ jobs: IJobDocument[]; total: number }> {
    const {
      channelIds,
      stack,
      level,
      isRemote,
      jobFunction,
      excludedTitles,
      muteKeywords,
      locationType,
      experienceYears,
      limit = 20,
      offset = 0,
    } = options;

    // All jobs in DB are valid (parse-before-save ensures this)
    const query: any = {};

    // CRITICAL: Filter by subscribed channels
    if (channelIds !== undefined) {
      if (channelIds.length === 0) {
        // User has no subscriptions - return empty feed
        return { jobs: [], total: 0 };
      }
      query.channelId = { $in: channelIds };
    }

    if (stack && stack.length > 0) {
      // Match jobs that contain ANY of the specified technologies
      query['parsedData.techStack'] = {
        $regex: stack.join('|'),
        $options: 'i',
      };
    }

    if (level && level.length > 0) {
      // Match jobs that contain ANY of the specified levels
      query['parsedData.level'] = {
        $regex: level.join('|'),
        $options: 'i',
      };
    }

    if (isRemote !== undefined) {
      query['parsedData.isRemote'] = isRemote;
    }

    // Job Function filter - AND logic for precise matching
    if (jobFunction && jobFunction.length > 0) {
      const importantShortWords = [
        'js',
        'ts',
        'go',
        'c++',
        'c#',
        'ui',
        'ux',
        'qa',
        'ai',
        'ml',
        'ar',
        'vr',
      ];

      // For each selected job function, create AND conditions
      const jobFunctionConditions = jobFunction.map((func) => {
        // Split by spaces, commas, parentheses, slashes, AND dots
        // This makes "Node.js" -> ["Node", "js"] instead of ["Node.js"]
        const keywords = func.split(/[\s,()\/\.]+/).filter((word) => {
          if (!word) return false; // Skip empty strings
          const normalized = word.toLowerCase();
          return word.length > 2 || importantShortWords.includes(normalized);
        });

        // Job must contain ALL keywords from this function
        return {
          $and: keywords.map((keyword) => ({
            'parsedData.jobTitle': {
              $regex: `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
              $options: 'i',
            },
          })),
        };
      });

      // If multiple functions selected, match ANY of them (OR at top level)
      if (jobFunctionConditions.length === 1) {
        Object.assign(query, jobFunctionConditions[0]);
      } else {
        query['$or'] = jobFunctionConditions;
      }
    }

    // Excluded Titles filter
    if (excludedTitles && excludedTitles.length > 0) {
      query['parsedData.jobTitle'] = {
        ...query['parsedData.jobTitle'],
        $not: { $regex: excludedTitles.join('|'), $options: 'i' },
      };
    }

    // Experience Years filter
    if (experienceYears) {
      const { min, max } = experienceYears;
      // Include jobs where:
      // 1. No experience is specified (treated as 0+ / no requirement)
      // 2. Experience is specified AND within the range
      // Exclude jobs that explicitly require MORE than max
      query['$or'] = [
        { 'parsedData.experienceYears': { $exists: false } }, // No experience = 0+ years
        { 'parsedData.experienceYears': null }, // Null = 0+ years
        { 'parsedData.experienceYears': { $lte: max } }, // Requires <= max years
      ];
    }

    // Mute Keywords filter (Negative Filter)
    if (muteKeywords && muteKeywords.length > 0) {
      // Exclude if rawText contains ANY of the keywords
      query['rawText'] = {
        $not: { $regex: muteKeywords.join('|'), $options: 'i' },
      };
    }

    // Location Type filter
    if (locationType && locationType.length > 0) {
      const locationConditions: any[] = [];

      if (locationType.includes('remote')) {
        locationConditions.push({ 'parsedData.isRemote': true });
      }
      if (locationType.includes('on-site') || locationType.includes('hybrid')) {
        // On-site and hybrid are both non-remote
        locationConditions.push({ 'parsedData.isRemote': { $ne: true } });
      }

      if (locationConditions.length > 0) {
        query.$or = locationConditions;
      }
    }

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean() as unknown as Promise<IJobDocument[]>,
      Job.countDocuments(query),
    ]);

    return { jobs, total };
  }

  async findPendingJobs(): Promise<IJobDocument[]> {
    return await Job.find({ status: 'pending_parse' }).limit(10);
  }
}
