import mongoose, { Document, Schema } from 'mongoose';

/**
 * Archived Job Document Interface
 * Lightweight metadata-only schema for historical job statistics and SEO
 */
export interface IArchivedJobDocument extends Document {
  telegramMessageId: string;
  channelId: string;
  parsedData?: {
    jobTitle?: string;
    normalizedJobTitle?: string;
    company?: string;
    techStack?: string[];
    salary?: string;
    level?: string;
    isRemote?: boolean;
    experienceYears?: number;
  };
  status: 'pending_parse' | 'parsed' | 'failed';
  telegramMessageDate: Date;
  archivedAt: Date;
  createdAt: Date;
}

const archivedParsedDataSchema = new Schema(
  {
    jobTitle: String,
    normalizedJobTitle: String,
    company: String,
    techStack: [String],
    salary: String,
    level: String,
    isRemote: Boolean,
    experienceYears: Number,
  },
  { _id: false }
);

const archivedJobSchema = new Schema<IArchivedJobDocument>(
  {
    telegramMessageId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    channelId: {
      type: String,
      required: true,
      index: true,
    },
    parsedData: {
      type: archivedParsedDataSchema,
    },
    status: {
      type: String,
      enum: ['pending_parse', 'parsed', 'failed'],
      default: 'parsed',
    },
    telegramMessageDate: {
      type: Date,
      required: true,
      index: true,
    },
    archivedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
archivedJobSchema.index({ channelId: 1, archivedAt: -1 });
archivedJobSchema.index({ status: 1 });
archivedJobSchema.index({ 'parsedData.techStack': 1 });

export const ArchivedJob = mongoose.model<IArchivedJobDocument>('ArchivedJob', archivedJobSchema);
