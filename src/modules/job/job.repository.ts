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

  async updateById(id: string, data: Partial<IJob>): Promise<IJobDocument | null> {
    return await Job.findByIdAndUpdate(id, data, { new: true });
  }

  async findWithFilters(options: JobFilterOptions): Promise<{ jobs: IJobDocument[]; total: number }> {
    const { stack, level, isRemote, jobFunction, excludedTitles, locationType, limit = 20, offset = 0 } = options;

    const query: any = { status: 'parsed' };

    if (stack) {
      query['parsedData.techStack'] = { $regex: stack, $options: 'i' };
    }

    if (level) {
      query['parsedData.level'] = { $regex: level, $options: 'i' };
    }

    if (isRemote !== undefined) {
      query['parsedData.isRemote'] = isRemote;
    }

    // Job Function filter
    if (jobFunction) {
      query['parsedData.jobTitle'] = { $regex: jobFunction, $options: 'i' };
    }

    // Excluded Titles filter
    if (excludedTitles && excludedTitles.length > 0) {
      query['parsedData.jobTitle'] = {
        ...query['parsedData.jobTitle'],
        $not: { $regex: excludedTitles.join('|'), $options: 'i' },
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
