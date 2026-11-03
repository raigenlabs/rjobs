import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { LandingPage } from './components/landing/LandingPage.tsx';
import { Dashboard } from './components/dashboard/Dashboard.tsx';
import { ResumeStudio } from './components/studio/ResumeStudio.tsx';
import { JobRadarView } from './components/radar/JobRadarView.tsx';
import { ApplyAssistView } from './components/assist/ApplyAssistView.tsx';
import { AuthModal } from './components/auth/AuthModal.tsx';
import { ProfileModal } from './components/profile/ProfileModal.tsx';
import { DocsViewerModal } from './components/docs/DocsViewerModal.tsx';
import { SEED_MASTER_RESUME } from './services/candidateData.ts';
import type { JobOpening } from './models/jobRadar.ts';
import type { ResumeDocument } from './models/resume.ts';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'studio' | 'radar' | 'assist'>('landing');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [activeResume, setActiveResume] = useState<ResumeDocument>(SEED_MASTER_RESUME);
  const [activeJobForAssist, setActiveJobForAssist] = useState<JobOpening | null>(null);

  // Check URL params (?autostart=1 or ?view=dashboard or ?view=studio or ?view=radar or ?view=assist)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam === 'studio') {
      setCurrentView('studio');
    } else if (viewParam === 'radar') {
      setCurrentView('radar');
    } else if (viewParam === 'assist') {
      setCurrentView('assist');
    } else if (params.get('autostart') === '1' || viewParam === 'dashboard') {
      setCurrentView('dashboard');
    }
  }, []);

  const handleOpenStudioWithJob = (job: JobOpening) => {
    // Clone master resume with target job information
    const tailored: ResumeDocument = {
      ...JSON.parse(JSON.stringify(SEED_MASTER_RESUME)),
      id: `resume_tailored_${job.id}`,
      title: `${job.company} ${job.title} (Tailored)`,
      isMaster: false,
      parentResumeId: SEED_MASTER_RESUME.id,
      targetCompany: job.company,
      targetJobTitle: job.title,
      targetJobId: job.id,
      matchScore: job.matchScore,
      updatedAt: new Date().toISOString(),
    };
    setActiveResume(tailored);
    setCurrentView('studio');
  };

  const handleOpenAssistWithJob = (job?: JobOpening) => {
    if (job) {
      setActiveJobForAssist(job);
    }
    setCurrentView('assist');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {currentView === 'landing' ? (
        <LandingPage
          onGoToDashboard={() => setCurrentView('dashboard')}
          onOpenDocs={() => setIsDocsOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenStudio={() => setCurrentView('studio')}
          onOpenRadar={() => setCurrentView('radar')}
          onOpenAssist={() => setCurrentView('assist')}
        />
      ) : currentView === 'studio' ? (
        <ResumeStudio
          onBackToDashboard={() => setCurrentView('dashboard')}
          initialResume={activeResume}
        />
      ) : currentView === 'radar' ? (
        <JobRadarView
          onBackToDashboard={() => setCurrentView('dashboard')}
          onOpenStudio={() => setCurrentView('studio')}
          onOpenStudioWithJob={handleOpenStudioWithJob}
          onOpenAssist={handleOpenAssistWithJob}
        />
      ) : currentView === 'assist' ? (
        <ApplyAssistView
          onBackToDashboard={() => setCurrentView('dashboard')}
          onOpenStudio={() => setCurrentView('studio')}
          onOpenRadar={() => setCurrentView('radar')}
          initialJob={activeJobForAssist}
        />
      ) : (
        <Dashboard
          onBackToLanding={() => setCurrentView('landing')}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenDocs={() => setIsDocsOpen(true)}
          onOpenStudio={() => setCurrentView('studio')}
          onOpenRadar={() => setCurrentView('radar')}
          onOpenAssist={handleOpenAssistWithJob}
        />
      )}

      {/* Global Modals */}
      <AuthModal />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <DocsViewerModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
