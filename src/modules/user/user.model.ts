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
