import mongoose, { Schema, Document } from 'mongoose';

export interface IBundleDocument extends Document {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  channels: string[];
  isActive: boolean;
  order: number;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

const bundleSchema = new Schema<IBundleDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
      default: 'Code',
    },
    channels: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length <= 5,
        message: 'Bundle cannot have more than 5 channels (free tier limit)',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      default: 'development',
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast querying
bundleSchema.index({ isActive: 1, order: 1 });

export const Bundle = mongoose.model<IBundleDocument>('Bundle', bundleSchema);
