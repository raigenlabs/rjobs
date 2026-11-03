/**
 * Candidate Profile Schema
 * Represents the single source of truth for the candidate's career preferences,
 * education credentials, contact information, and target parameters.
 */

export interface CandidateProfile {
  userId: string;
  headline: string;
  phone: string; // E.g. +91 98765 43210
  location: string; // E.g. Bengaluru, India
  degree: string; // E.g. B.Tech in Computer Science & Engineering
  college: string; // E.g. IIT Delhi / NIT Trichy / BITS Pilani
  graduationYear: number;
  cgpaOrPercentage: string; // E.g. "8.84 / 10 CGPA"
  links: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
    leetcode?: string;
    codeforces?: string;
  };
  targetRoles: string[]; // E.g. ["Software Engineer Intern", "Backend Engineer", "Data Engineer"]
  targetLocations: string[]; // E.g. ["Bengaluru", "Hyderabad", "Pune", "Gurugram", "Remote"]
  experienceLevel: 'internship' | 'fresher' | '1-2_years';
  noticePeriodDays: number;
  workAuthorization: 'india_citizen' | 'requires_sponsorship' | 'has_valid_visa';
  preferences: {
    minStipendPerMonthInr?: number; // E.g. 50000
    expectedCtcInrLpa?: number; // E.g. 15
    remoteAllowed: boolean;
    jobAlertsEnabled: boolean;
    alertFrequency: 'instant' | 'daily' | 'weekly';
  };
}
