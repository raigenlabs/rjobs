import { z } from 'zod';

/**
 * Security: LaTeX Character Escaping & Hostile Command Neutralization
 */

const LATEX_ESCAPE_MAP: Record<string, string> = {
  '&': '\\&',
  '%': '\\%',
  '$': '\\$',
  '#': '\\#',
  '_': '\\_',
  '{': '\\{',
  '}': '\\}',
  '~': '\\textasciitilde{}',
  '^': '\\textasciicircum{}',
  '\\': '\\textbackslash{}',
};

// Dangerous macros that could attempt file inclusion or shell escape
const FORBIDDEN_LATEX_COMMANDS = [
  /\\input\s*\{/gi,
  /\\include\s*\{/gi,
  /\\write18/gi,
  /\\immediate\s*\\write/gi,
  /\\openin/gi,
  /\\openout/gi,
  /\\catcode/gi,
  /\\csname/gi,
  /\\def/gi,
  /\\let/gi,
  /\\edef/gi,
];

/**
 * Escapes plain text for safe inclusion in LaTeX templates.
 * Neutralizes any hostile injection attempts.
 */
export function escapeLatex(text: string): string {
  if (!text) return '';
  
  let sanitized = text;

  // 1. Strip or neutralize forbidden command attempts
  for (const pattern of FORBIDDEN_LATEX_COMMANDS) {
    sanitized = sanitized.replace(pattern, '[BLOCKED-CMD]');
  }

  // 2. Escape special LaTeX characters
  return sanitized.replace(/[&%$#_{}~^\\]/g, (match) => LATEX_ESCAPE_MAP[match] || match);
}

/**
 * Formats and validates Indian phone numbers (+91 XXXXX XXXXX)
 */
export function formatIndianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    const raw = digits.slice(2);
    return `+91 ${raw.slice(0, 5)} ${raw.slice(5)}`;
  }
  return phone;
}

/**
 * Zod Schemas for Runtime Validation
 */

export const UserRegistrationSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  college: z.string().optional(),
  gradYear: z.number().int().min(2020).max(2035).optional(),
});

export const ProfileUpdateSchema = z.object({
  headline: z.string().max(160, 'Headline must be under 160 characters'),
  phone: z.string().min(10, 'Valid phone number required'),
  location: z.string().min(2, 'Location is required'),
  degree: z.string().min(2, 'Degree is required'),
  college: z.string().min(2, 'College name is required'),
  graduationYear: z.number().int().min(2020).max(2035),
  cgpaOrPercentage: z.string().min(1, 'CGPA or Percentage is required'),
  targetRoles: z.array(z.string()).min(1, 'Select at least one target role'),
  targetLocations: z.array(z.string()).min(1, 'Select at least one target location'),
  experienceLevel: z.enum(['internship', 'fresher', '1-2_years']),
  workAuthorization: z.enum(['india_citizen', 'requires_sponsorship', 'has_valid_visa']),
});
