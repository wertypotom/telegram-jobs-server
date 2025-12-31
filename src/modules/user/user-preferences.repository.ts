import { IUserPreferences, UserPreferences } from './user-preferences.model';

export interface JobFilters {
  jobFunction: string[];
  level: string[];
  stack: string[];
  locationType: string[];
  excludedTitles: string[];
  muteKeywords: string[];
}

export class UserPreferencesRepository {
  async findByUserId(userId: string): Promise<IUserPreferences | null> {
    return await UserPreferences.findOne({ userId });
  }

  async upsertFilters(userId: string, filters: JobFilters): Promise<IUserPreferences> {
    return await UserPreferences.findOneAndUpdate(
      { userId },
      {
        $set: {
          jobFilters: filters,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );
  }
}
