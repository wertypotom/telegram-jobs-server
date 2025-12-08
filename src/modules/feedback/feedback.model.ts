import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback {
  _id: string;
  userId?: string;
  telegramChatId?: string;
  message: string;
  rating?: number; // 1-5 stars
  category: 'bug' | 'feature' | 'general' | 'complaint' | 'praise';
  status: 'new' | 'reviewed' | 'resolved';
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
      enum: ['bug', 'feature', 'general', 'complaint', 'praise'],
      default: 'general',
    },
    status: {
      type: String,
      enum: ['new', 'reviewed', 'resolved'],
      default: 'new',
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
