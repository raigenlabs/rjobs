export const RESUME_SCHEMA_VERSION = '1.0.0';


export interface ResumeBasics {
  name: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  linkedin?: string;
  github?: string;
  leetcode?: string;
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  location: string;
  startDate: string;
  endDate: string;
  grade?: string; // CGPA / %
  highlights?: string[];
}

export interface ExperienceEntry {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  bullets: string[];
  techStack?: string[];
}

export interface ProjectEntry {
  id: string;
  title: string;
  subtitle?: string;
  link?: string;
  github?: string;
  startDate?: string;
  endDate?: string;
  bullets: string[];
  technologies: string[];
}

export interface SkillCategory {
  id: string;
  categoryName: string; // e.g. "Languages", "Frameworks & Tools", "Databases & Cloud"
  skills: string[];
}

export interface AchievementEntry {
  id: string;
  title: string;
  issuer?: string;
  date?: string;
  description: string;
}

export interface CustomSection {
  id: string;
  heading: string;
  items: string[];
}

export interface ResumeData {
  schemaVersion: '1.0.0';
  basics: ResumeBasics;
  summary: string;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  skills: SkillCategory[];
  achievements: AchievementEntry[];
  certifications: string[];
  customSections?: CustomSection[];
  sectionOrder: Array<
    'education' | 'experience' | 'projects' | 'skills' | 'achievements' | 'certifications' | 'custom'
  >;
}

export interface ResumeDocument {
  id: string;
  userId: string;
  title: string;
  templateId: 'classic-single' | 'modern-accent' | 'compact-onepage' | 'academic' | 'minimalist';
  data: ResumeData;
  customLatex?: string;
  isMaster: boolean;
  parentResumeId?: string;
  targetJobId?: string;
  targetJobTitle?: string;
  targetCompany?: string;
  matchScore?: number;
  atsScore?: number;
  createdAt: string;
  updatedAt: string;
}
