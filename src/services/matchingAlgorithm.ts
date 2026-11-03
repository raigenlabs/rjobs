import type { JobOpening, MatchPreferences } from '../models/jobRadar.ts';
import type { CandidateProfile } from '../models/profile.ts';
import type { ResumeData } from '../models/resume.ts';

export interface MatchScoreBreakdown {
  totalScore: number;
  hardFilterPassed: boolean;
  skillsOverlapScore: number;
  locationScore: number;
  roleScore: number;
  reasons: string[];
}

/**
 * Calculates a dynamic 0-100 hybrid match score between a job opening and candidate profile
 */
export function calculateJobMatch(
  job: JobOpening,
  profile: CandidateProfile,
  resumeData?: ResumeData,
  preferences?: MatchPreferences
): MatchScoreBreakdown {
  const reasons: string[] = [];

  // 1. Location match
  const candidateLocations = profile.targetLocations.map((l) => l.toLowerCase());
  const jobLocation = job.location.toLowerCase();
  const locationMatches = candidateLocations.some(
    (l) => jobLocation.includes(l) || (l === 'remote' && jobLocation.includes('remote'))
  );

  let locationScore = 20;
  if (locationMatches) {
    locationScore = 30;
    const matchedCity = profile.targetLocations.find((l) =>
      jobLocation.includes(l.toLowerCase())
    );
    if (matchedCity) reasons.push(`Preferred location: ${matchedCity}`);
  }

  // 2. Role match
  const candidateRoles = profile.targetRoles.map((r) => r.toLowerCase());
  const jobTitle = job.title.toLowerCase();
  const roleMatches = candidateRoles.some(
    (r) =>
      jobTitle.includes(r) ||
      (r.includes('sde') && jobTitle.includes('software')) ||
      (r.includes('backend') && jobTitle.includes('software'))
  );

  let roleScore = 20;
  if (roleMatches) {
    roleScore = 30;
    reasons.push('Aligned with target roles');
  }

  // 3. Technical Skills overlap
  const allCandidateSkills = resumeData
    ? resumeData.skills.flatMap((s) => s.skills).map((s) => s.toLowerCase())
    : ['go', 'c++', 'python', 'distributed systems', 'kafka', 'postgresql', 'redis'];

  const matchedSkills: string[] = [];
  for (const jobSkill of job.skills) {
    if (allCandidateSkills.some((cs) => cs.includes(jobSkill.toLowerCase()) || jobSkill.toLowerCase().includes(cs))) {
      matchedSkills.push(jobSkill);
    }
  }

  const skillCoverage = job.skills.length > 0 ? matchedSkills.length / job.skills.length : 0.7;
  const skillsOverlapScore = Math.round(skillCoverage * 40);

  if (matchedSkills.length > 0) {
    reasons.push(`Matches your ${matchedSkills.slice(0, 3).join(', ')} stack`);
  }

  // Total
  const totalScore = Math.min(99, Math.max(50, locationScore + roleScore + skillsOverlapScore));

  const minThreshold = preferences?.minMatchScore || 70;
  const hardFilterPassed = totalScore >= minThreshold;

  return {
    totalScore,
    hardFilterPassed,
    skillsOverlapScore,
    locationScore,
    roleScore,
    reasons,
  };
}
