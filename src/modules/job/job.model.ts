import mongoose, { Schema, Document } from 'mongoose';
import { IJob, ParsedJobData } from '@shared/types/common.types';

export interface IJobDocument extends Omit<IJob, '_id'>, Document {}

const parsedJobDataSchema = new Schema<ParsedJobData>(
  {
    jobTitle: String,
    company: String,
    techStack: [String],
    salary: String,
    contactMethod: String,
    isRemote: Boolean,
    level: String,
  },
  { _id: false }
);

const jobSchema = new Schema<IJobDocument>(
  {
    telegramMessageId: {
      type: String,
      required: true,
      unique: true,
    },
    channelId: {
      type: String,
      required: true,
    },
    rawText: {
      type: String,
      required: true,
    },
    parsedData: {
      type: parsedJobDataSchema,
    },
    status: {
      type: String,
      enum: ['pending_parse', 'parsed', 'failed'],
      default: 'pending_parse',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
jobSchema.index({ channelId: 1, createdAt: -1 });
jobSchema.index({ 'parsedData.techStack': 1 });
jobSchema.index({ status: 1 });

export const Job = mongoose.model<IJobDocument>('Job', jobSchema);
