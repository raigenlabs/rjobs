import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../models/user.ts';
import { CandidateProfile } from '../models/profile.ts';
import { SEED_USERS, SEED_PROFILES } from '../services/candidateData.ts';
import { logger } from '../lib/logger.ts';

interface AuthContextType {
  currentUser: User | null;
  currentProfile: CandidateProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, pass: string, college?: string, gradYear?: number) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchAccount: (accountKey: 'aarav-sharma' | 'priya-patel' | 'admin-user') => void;
  updateProfile: (profile: Partial<CandidateProfile>) => void;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'signup' | 'forgot';
  openAuthModal: (tab?: 'login' | 'signup' | 'forgot') => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER = 'rjobs_auth_user';
const STORAGE_KEY_PROFILES = 'rjobs_profiles';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USER);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      logger.error('Failed to load user from localStorage', e as Error);
    }
    // Default to Aarav Sharma for instant, frictionless preview
    return SEED_USERS['aarav-sharma'];
  });

  const [profiles, setProfiles] = useState<Record<string, CandidateProfile>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PROFILES);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      logger.error('Failed to load profiles from localStorage', e as Error);
    }
    return SEED_PROFILES;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup' | 'forgot'>('login');

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
  }, [profiles]);

  const currentProfile = currentUser ? profiles[currentUser.id] || null : null;

  const login = async (email: string, _pass: string) => {
    logger.info('User login attempted', { email });
    const foundUser = Object.values(SEED_USERS).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (foundUser) {
      setCurrentUser(foundUser);
      setIsAuthModalOpen(false);
      return { success: true };
    }

    // Dynamic mock user for custom email
    const dynamicUser: User = {
      id: `user_${Date.now()}`,
      email,
      name: email.split('@')[0].replace(/[._]/g, ' '),
      role: 'jobseeker',
      plan: 'free',
      createdAt: new Date().toISOString(),
      emailVerified: true,
    };
    setCurrentUser(dynamicUser);
    setIsAuthModalOpen(false);
    return { success: true };
  };

  const signup = async (
    name: string,
    email: string,
    _pass: string,
    college?: string,
    gradYear?: number
  ) => {
    logger.info('User registration', { email, college, gradYear });
    const newUser: User = {
      id: `user_${Date.now()}`,
      email,
      name,
      role: 'jobseeker',
      college: college || 'University in India',
      gradYear: gradYear || 2026,
      plan: 'free',
      createdAt: new Date().toISOString(),
      emailVerified: true,
    };

    const newProfile: CandidateProfile = {
      userId: newUser.id,
      headline: `${college || 'Student'} | Aspiring Software Engineer`,
      phone: '+91 98765 00000',
      location: 'Bengaluru, India',
      degree: 'B.Tech in Computer Science',
      college: college || 'University in India',
      graduationYear: gradYear || 2026,
      cgpaOrPercentage: '8.5 / 10 CGPA',
      links: {},
      targetRoles: ['Software Development Engineer Intern', 'Backend Engineer'],
      targetLocations: ['Bengaluru', 'Hyderabad', 'Remote'],
      experienceLevel: 'internship',
      noticePeriodDays: 0,
      workAuthorization: 'india_citizen',
      preferences: {
        remoteAllowed: true,
        jobAlertsEnabled: true,
        alertFrequency: 'instant',
      },
    };

    setProfiles((prev) => ({ ...prev, [newUser.id]: newProfile }));
    setCurrentUser(newUser);
    setIsAuthModalOpen(false);
    return { success: true };
  };

  const logout = () => {
    logger.info('User logged out', { userId: currentUser?.id });
    setCurrentUser(null);
  };

  const switchAccount = (accountKey: 'aarav-sharma' | 'priya-patel' | 'admin-user') => {
    const user = SEED_USERS[accountKey];
    if (user) {
      logger.info('Switched demo account', { accountKey, email: user.email });
      setCurrentUser(user);
    }
  };

  const updateProfile = (patch: Partial<CandidateProfile>) => {
    if (!currentUser) return;
    setProfiles((prev) => {
      const existing = prev[currentUser.id] || {
        userId: currentUser.id,
        headline: '',
        phone: '',
        location: '',
        degree: '',
        college: '',
        graduationYear: 2026,
        cgpaOrPercentage: '',
        links: {},
        targetRoles: [],
        targetLocations: [],
        experienceLevel: 'internship',
        noticePeriodDays: 0,
        workAuthorization: 'india_citizen',
        preferences: {
          remoteAllowed: true,
          jobAlertsEnabled: true,
          alertFrequency: 'daily',
        },
      };
      return {
        ...prev,
        [currentUser.id]: {
          ...existing,
          ...patch,
        },
      };
    });
  };

  const openAuthModal = (tab: 'login' | 'signup' | 'forgot' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentProfile,
        isAuthenticated: !!currentUser,
        isAdmin: currentUser?.role === 'admin',
        login,
        signup,
        logout,
        switchAccount,
        updateProfile,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
