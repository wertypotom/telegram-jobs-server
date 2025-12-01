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
    password: {
      type: String,
      required: true,
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
    telegramPhone: {
      type: String,
    },
    telegramSession: {
      type: String,
    },
    telegramUserId: {
      type: String,
    },
    hasCompletedOnboarding: {
      type: Boolean,
      default: false,
    },
    viewedJobs: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUserDocument>('User', userSchema);
