/**
 * Apply Assist Model Definitions
 * Types for ATS form autofill mapping, human-in-the-loop review gates,
 * application tracking, and answers bank.
 */

export type AtsPlatform = 
  | 'workday'
  | 'greenhouse'
  | 'lever'
  | 'amazon_jobs'
  | 'oracle_hcm'
  | 'eightfold'
  | 'successfactors'
  | 'phenom'
  | 'generic';

export type ApplicationStatus = 
  | 'draft'
  | 'ready'
  | 'applied'
  | 'oa_pending'
  | 'interview'
  | 'offer'
  | 'rejected';

export interface ApplicationRecord {
  id: string;
  jobId?: string;
  company: string;
  role: string;
  location: string;
  portalUrl: string;
  appliedDate: string; // ISO date string or formatted date
  status: ApplicationStatus;
  resumeUsedTitle: string;
  resumeId?: string;
  notes: string;
  oaDeadline?: string;
  followUpDate?: string;
  atsPlatform: AtsPlatform;
}

export interface AtsFormField {
  id: string;
  category: 'personal' | 'education' | 'experience' | 'links' | 'legal' | 'question';
  label: string;
  systemKey: string;
  value: string;
  isSensitive: boolean;
  isVerifiedByUser: boolean;
  selectorWorkday?: string;
  selectorGreenhouse?: string;
  selectorLever?: string;
}

export interface AnswerBankItem {
  id: string;
  question: string;
  promptKey: string;
  answer: string;
  contextSources: string[];
  lastUpdated: string;
}

export interface LegalDisclosures {
  workAuthorization: 'india_citizen' | 'requires_sponsorship' | 'has_valid_visa';
  noticePeriodDays: number;
  expectedCtcInrLpa: number;
  availableFromImmediate: boolean;
  willingToRelocate: boolean;
  collegeNocAvailable: boolean;
  disabilityDeclaration: 'prefer_not_to_say' | 'no' | 'yes';
  genderDeclaration: 'prefer_not_to_say' | 'male' | 'female' | 'non_binary';
  confirmedReviewedByUser: boolean;
}
