import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback {
  _id: string;
  userId?: string;
  telegramChatId?: string;
  source: 'WEB' | 'TELEGRAM';
  message: string;
  rating?: number; // 1-5 stars (optional, mainly for bot)
  category: 'BUG' | 'FEATURE' | 'UX' | 'SUBSCRIPTION' | 'OTHER';
  contactConsent: boolean;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED';
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeedbackDocument extends Omit<IFeedback, '_id'>, Document {}

const feedbackSchema = new Schema<IFeedbackDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    telegramChatId: {
      type: String,
    },
    source: {
      type: String,
      enum: ['WEB', 'TELEGRAM'],
      required: true,
      default: 'TELEGRAM', // Default for backward compatibility if any
    },
    message: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    category: {
      type: String,
      enum: ['BUG', 'FEATURE', 'UX', 'SUBSCRIPTION', 'OTHER'],
      default: 'OTHER',
    },
    contactConsent: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['PENDING', 'REVIEWED', 'RESOLVED'],
      default: 'PENDING',
    },
  },
  {
    timestamps: true,
  }
);

export const Feedback = mongoose.model<IFeedbackDocument>(
  'Feedback',
  feedbackSchema
);
