import { IJob, ParsedJobData } from '@shared/types/common.types';
import mongoose, { Document, Schema } from 'mongoose';

export interface IJobDocument extends Omit<IJob, '_id'>, Document {}

const contactInfoSchema = new Schema(
  {
    telegram: String,
    email: String,
    applicationUrl: String,
    other: String,
  },
  { _id: false }
);

const parsedJobDataSchema = new Schema<ParsedJobData>(
  {
    jobTitle: String,
    normalizedJobTitle: String, // English normalized title for filtering
    company: String,
    techStack: [String],
    salary: String,
    contactInfo: contactInfoSchema,
    isRemote: Boolean,
    level: String,
    employmentType: String,
    location: String,
    candidateLocation: String,
    responsibilities: [String],
    requiredQualifications: [String],
    preferredQualifications: [String],
    benefits: [String],
    description: String,
    experienceYears: Number,
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
    senderUserId: {
      type: String, // Telegram user ID
    },
    senderUsername: {
      type: String, // @username for DM contact
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
    telegramMessageDate: {
      type: Date,
      required: true,
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
