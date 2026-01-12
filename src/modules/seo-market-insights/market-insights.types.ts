/**
 * Market Insights Module - TypeScript Interfaces
 *
 * Purpose: Define types for market insights pages that display
 * live job market statistics and trends from Job + ArchivedJob collections
 */

export type InsightsTemplate =
  | 'category-region' // "Python Jobs in Europe"
  | 'region-only' // "Jobs in Europe"
  | 'category-only' // "Python Jobs Worldwide"
  | 'remote-jobs' // "Remote Developer Jobs"
  | 'general-insight'; // "Top Programming Languages 2026"

export interface InsightsFilters {
  category?: string; // Tech stack or job function (e.g., "python", "react")
  region?: string; // Geographic region ('europe', 'worldwide', etc)
  remote?: boolean; // Remote-only filter
}

export interface InsightsPageMeta {
  h1: string; // Page heading
  title: string; // SEO title tag
  description: string; // Meta description
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface InsightsPageConfig {
  slug: string; // URL slug: "python", "europe", "python/europe"
  template: InsightsTemplate;
  filters: InsightsFilters;
  meta: {
    en: InsightsPageMeta;
    ru: InsightsPageMeta;
  };
  faq: {
    en: FaqItem[];
    ru: FaqItem[];
  };
  priority: number; // 0-10 for sitemap ordering
  isActive: boolean;
  minJobCount: number; // Minimum jobs required to activate page (default: 20)
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Market statistics aggregated from Job + ArchivedJob collections
 */
export interface MarketStats {
  totalJobs: number; // Active + archived (all-time)
  jobsLast7Days: number; // Active jobs only (freshness signal)
  avgSalary: string | null;
  topSkills: { name: string; count: number }[];
  salaryBands: { band: string; count: number }[];
  experienceLevels: { level: string; count: number }[];
  trendData: { date: string; jobs: number }[]; // Last 7 days posting volume
  updatedAt: string; // Relative time: "2 hours ago"
}
