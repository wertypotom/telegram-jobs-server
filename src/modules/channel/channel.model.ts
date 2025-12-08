import mongoose, { Schema, Document } from 'mongoose';
import { IChannel } from '@shared/types/common.types';

export interface IChannelDocument extends Omit<IChannel, '_id'>, Document {}

const channelSchema = new Schema<IChannelDocument>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    memberCount: {
      type: Schema.Types.Mixed, // Can be Number or String (e.g., "80K+")
    },
    category: {
      type: String,
      required: true,
      default: 'General IT',
    },
    tags: {
      type: [String],
      default: [],
    },
    isMonitored: {
      type: Boolean,
      default: true,
    },
    lastScrapedAt: {
      type: Date,
    },
    stats: {
      dailyJobCount: {
        type: Number,
        default: 0,
      },
      lastCalculated: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
channelSchema.index({ username: 1 });
channelSchema.index({ isMonitored: 1 });
channelSchema.index({ category: 1 });
channelSchema.index({ tags: 1 });

export const Channel = mongoose.model<IChannelDocument>(
  'Channel',
  channelSchema
);
