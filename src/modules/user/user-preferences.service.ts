import {
  UserPreferencesRepository,
  JobFilters,
} from './user-preferences.repository';

export class UserPreferencesService {
  private preferencesRepository: UserPreferencesRepository;

  constructor() {
    this.preferencesRepository = new UserPreferencesRepository();
  }

  async getFilters(userId: string): Promise<JobFilters> {
    const preferences = await this.preferencesRepository.findByUserId(userId);

    if (!preferences) {
      // Return default empty filters
      return {
        jobFunction: [],
        level: [],
        stack: [],
        locationType: [],
        excludedTitles: [],
        muteKeywords: [],
      };
    }

    return preferences.jobFilters;
  }

  async saveFilters(userId: string, filters: JobFilters): Promise<JobFilters> {
    const preferences = await this.preferencesRepository.upsertFilters(
      userId,
      filters
    );
    return preferences.jobFilters;
  }
}
