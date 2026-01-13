import mongoose, { Document, Schema } from 'mongoose';

import { InsightsPageConfig } from './market-insights.types';

export interface IInsightsPageConfigDocument extends Document, InsightsPageConfig {}

const FaqSchema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false }
);

const MetaSchema = new Schema(
  {
    h1: { type: String, required: true },
    title: { type: String, required: true, maxlength: 60 },
    description: { type: String, required: true, maxlength: 160 },
  },
  { _id: false }
);

const InsightsPageConfigSchema = new Schema<IInsightsPageConfigDocument>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true, // Fast lookup when user visits /insights/{slug}
    },
    template: {
      type: String,
      required: true,
      enum: ['category-region', 'region-only', 'category-only', 'remote-jobs', 'general-insight'],
    },
    filters: {
      category: String,
      region: String,
      remote: Boolean,
    },
    meta: {
      en: { type: MetaSchema, required: true },
      ru: { type: MetaSchema, required: true },
    },
    faq: {
      en: [FaqSchema],
      ru: [FaqSchema],
    },
    priority: {
      type: Number,
      default: 5,
      min: 0,
      max: 10,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true, // Filter active pages for sitemap generation
    },
    minJobCount: {
      type: Number,
      default: 20,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

InsightsPageConfigSchema.index({ isActive: 1, priority: -1 });

export const InsightsPageConfigModel = mongoose.model<IInsightsPageConfigDocument>(
  'InsightsPageConfig',
  InsightsPageConfigSchema
);
