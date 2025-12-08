import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '@shared/types/common.types';

export interface IUserDocument extends Omit<IUser, '_id'>, Document {}

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
    },
    image: {
      type: String,
    },
    emailVerified: {
      type: Date,
    },
    masterResumeText: {
      type: String,
    },
    masterResumeFileUrl: {
      type: String,
    },
    subscribedChannels: {
      type: [String],
      default: [],
    },
    plan: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free',
    },

    hasCompletedOnboarding: {
      type: Boolean,
      default: false,
    },
    viewedJobs: {
      type: [String],
      default: [],
    },

    // Telegram Notifications
    telegramChatId: {
      type: String,
    },
    telegramSubscriptionToken: {
      type: String,
      unique: true,
      sparse: true, // Allow null values
    },
    notificationEnabled: {
      type: Boolean,
      default: false,
    },
    notificationFilters: {
      stack: [String],
      level: [String],
      jobFunction: [String],
      locationType: [String],
      experienceYears: {
        min: Number,
        max: Number,
      },
    },
    quietHours: {
      enabled: { type: Boolean, default: false },
      startHour: { type: Number, default: 22 }, // 10 PM
      endHour: { type: Number, default: 8 }, // 8 AM
      timezone: { type: String, default: 'America/New_York' },
    },
    lastNotificationSent: {
      type: Date,
    },
    notificationCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUserDocument>('User', userSchema);
