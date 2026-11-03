/**
 * User & Account Models for rJobs
 */

export type UserRole = 'jobseeker' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  plan: 'free' | 'pro';
  college?: string;
  gradYear?: number;
  emailVerified: boolean;
}

export interface AuthSession {
  token: string;
  user: User;
  expiresAt: string;
}
