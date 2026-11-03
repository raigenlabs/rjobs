/**
 * Job Radar Data Models & Types
 */

export type ScraperPlatform =
  | 'workday'
  | 'eightfold'
  | 'amazon_json'
  | 'oracle_hcm'
  | 'phenom'
  | 'successfactors'
  | 'greenhouse'
  | 'program_tracker'
  | 'custom_rest';

export type SourceStatus = 'healthy' | 'polling' | 'degraded' | 'blocked';

export interface JobSource {
  id: string;
  company: string;
  roleLabel: string;
  careersUrl: string;
  platform: ScraperPlatform;
  status: SourceStatus;
  pollIntervalHours: number;
  lastSuccessAt: string;
  jobsCount: number;
  latencyMs: number;
  consecutiveFailures: number;
  robotsCompliance: {
    status: 'allowed' | 'restricted' | 'program_page';
    userAgentChecked: string;
    rateLimitMs: number;
    notes: string;
  };
}

export interface JobOpening {
  id: string;
  sourceId: string;
  company: string;
  title: string;
  location: string;
  employmentType: 'internship' | 'fresher' | 'full_time';
  url: string;
  postedAt: string;
  firstSeenAt: string;
  isProgramPage?: boolean;
  programDeadline?: string;
  skills: string[];
  description: string;
  stipendOrSalary?: string;
  matchScore: number;
  matchReasons: string[];
  isSaved?: boolean;
  isDismissed?: boolean;
}

export interface MatchPreferences {
  targetLocations: string[];
  targetRoles: string[];
  targetCompanies: string[];
  minMatchScore: number;
  alertFrequency: 'instant' | 'daily' | 'weekly';
  channels: Array<'in_app' | 'email' | 'whatsapp'>;
  quietHours: {
    enabled: boolean;
    start: string; // "23:00"
    end: string; // "08:00"
  };
}
