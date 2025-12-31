import { Document, model, Schema } from 'mongoose';

export interface IUserPreferences extends Document {
  userId: Schema.Types.ObjectId;
  jobFilters: {
    jobFunction: string[];
    level: string[];
    stack: string[];
    locationType: string[];
    excludedTitles: string[];
    muteKeywords: string[];
    experienceYears?: { min: number; max: number };
  };
  createdAt: Date;
  updatedAt: Date;
}

const userPreferencesSchema = new Schema<IUserPreferences>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    jobFilters: {
      jobFunction: { type: [String], default: [] },
      level: { type: [String], default: [] },
      stack: { type: [String], default: [] },
      locationType: { type: [String], default: [] },
      excludedTitles: { type: [String], default: [] },
      muteKeywords: { type: [String], default: [] },
      experienceYears: {
        type: {
          min: { type: Number, default: 0 },
          max: { type: Number, default: 10 },
        },
        required: false,
        default: { min: 0, max: 10 },
      },
    },
  },
  {
    timestamps: true,
  }
);

export const UserPreferences = model<IUserPreferences>('UserPreferences', userPreferencesSchema);
