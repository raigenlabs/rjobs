import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { SEED_JOB_SOURCES, INITIAL_JOB_OPENINGS } from '../../services/jobSourcesRegistry.ts';
import { SEED_MASTER_RESUME } from '../../services/candidateData.ts';
import type { JobOpening, JobSource } from '../../models/jobRadar.ts';
import type {
  AtsPlatform,
  ApplicationRecord,
  AnswerBankItem,
  LegalDisclosures,
  ApplicationStatus,
} from '../../models/applyAssist.ts';
import {
  detectAtsPlatform,
  generateAtsFormFields,
  generateTruthfulAnswersBank,
  generateAutofillBookmarkletScript,
  validateHumanReviewGate,
  calculateFormCompleteness,
} from '../../services/applyAssistEngine.ts';
import { Button } from '../ui/Button.tsx';
import { Badge } from '../ui/Badge.tsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card.tsx';
import {
  Briefcase,
  CheckCircle,
  ExternalLink,
  Copy,
  FileText,
  Radar,
  ArrowLeft,
  Search,
  Download,
  Clock,
  AlertTriangle,
  Check,
  Code2,
  ShieldCheck,
  Send,
  Plus,
  Trash2,
  Filter,
  Globe,
  Building2,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface ApplyAssistViewProps {
  onBackToDashboard: () => void;
  onOpenStudio?: () => void;
  onOpenRadar?: () => void;
  initialJob?: JobOpening | null;
}

const INITIAL_APPLICATIONS: ApplicationRecord[] = [
  {
    id: 'app_google_01',
    jobId: 'job_google_01',
    company: 'Google',
    role: 'Software Engineering Intern - Summer 2026',
    location: 'Bengaluru / Hyderabad, India',
    portalUrl: 'https://www.google.com/about/careers/applications/jobs/results/?location=India&q=intern',
    appliedDate: 'Oct 14, 2026',
    status: 'oa_pending',
    resumeUsedTitle: 'Master Technical Resume 2026',
    notes: 'Online Assessment link received via HackerRank; 2 algorithmic problems due Oct 20.',
    oaDeadline: '2026-10-20',
    atsPlatform: 'generic',
  },
  {
    id: 'app_msft_02',
    jobId: 'job_msft_02',
    company: 'Microsoft',
    role: 'Software Development Engineer - University Graduate',
    location: 'Hyderabad, India',
    portalUrl: 'https://jobs.careers.microsoft.com/global/en/search?q=intern&lc=India',
    appliedDate: 'Oct 10, 2026',
    status: 'interview',
    resumeUsedTitle: 'Tailored: MSFT Cloud Systems',
    notes: 'Round 1 Technical scheduled with Senior SDE on Systems & Concurrency.',
    atsPlatform: 'generic',
  },
  {
    id: 'app_uber_03',
    jobId: 'job_uber_25',
    company: 'Uber',
    role: 'Backend Engineering Intern',
    location: 'Bengaluru / Hyderabad, India',
    portalUrl: 'https://www.uber.com/global/en/careers/list/?q=intern&location=India',
    appliedDate: 'Oct 16, 2026',
    status: 'applied',
    resumeUsedTitle: 'Master Technical Resume 2026',
    notes: 'Form autofilled via rJobs companion; human review gate verified. Under review.',
    atsPlatform: 'phenom',
  },
  {
    id: 'app_nvidia_04',
    jobId: 'job_nvidia_09',
    company: 'Nvidia',
    role: 'AI/ML & Systems Software Engineer Intern',
    location: 'Bengaluru / Pune, India',
    portalUrl: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite?q=intern&location=India',
    appliedDate: 'Oct 17, 2026',
    status: 'ready',
    resumeUsedTitle: 'Tailored: Nvidia Systems AI',
    notes: 'Workday ATS profile bundle staged; awaiting manual review before submission.',
    atsPlatform: 'workday',
  },
];

export const ApplyAssistView: React.FC<ApplyAssistViewProps> = ({
  onBackToDashboard,
  onOpenStudio,
  onOpenRadar,
  initialJob,
}) => {
  const { currentUser, currentProfile, switchAccount } = useAuth();

  // Active view tab
  const [activeTab, setActiveTab] = useState<'autofill' | 'answers' | 'tracker' | 'directory'>('autofill');

  // Selected target job
  const [selectedJobId, setSelectedJobId] = useState<string>(
    initialJob ? initialJob.id : INITIAL_JOB_OPENINGS[0].id
  );
  const [customPortalUrl, setCustomPortalUrl] = useState<string>('');

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Human-in-the-Loop Disclosures State
  const [disclosures, setDisclosures] = useState<LegalDisclosures>({
    workAuthorization: currentProfile?.workAuthorization || 'india_citizen',
    noticePeriodDays: currentProfile?.noticePeriodDays || 0,
    expectedCtcInrLpa: currentProfile?.preferences?.expectedCtcInrLpa || 22,
    availableFromImmediate: true,
    willingToRelocate: true,
    collegeNocAvailable: true,
    disabilityDeclaration: 'no',
    genderDeclaration: 'male',
    confirmedReviewedByUser: true,
  });

  const [humanReviewAcknowledged, setHumanReviewAcknowledged] = useState<boolean>(true);

  // Applications Tracker state
  const [applications, setApplications] = useState<ApplicationRecord[]>(() => {
    const saved = localStorage.getItem('rjobs_applications_tracker');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_APPLICATIONS;
      }
    }
    return INITIAL_APPLICATIONS;
  });

  useEffect(() => {
    localStorage.setItem('rjobs_applications_tracker', JSON.stringify(applications));
  }, [applications]);

  // Current selected job opening
  const currentJob = useMemo(() => {
    const found = INITIAL_JOB_OPENINGS.find((j) => j.id === selectedJobId);
    if (found) return found;
    return INITIAL_JOB_OPENINGS[0];
  }, [selectedJobId]);

  // Detected ATS platform
  const activePortalUrl = customPortalUrl.trim() || currentJob.url;
  const detectedPlatform = useMemo(() => {
    return detectAtsPlatform(activePortalUrl);
  }, [activePortalUrl]);

  // Mapped ATS Form Fields
  const formFields = useMemo(() => {
    if (!currentProfile) return [];
    return generateAtsFormFields(currentProfile, SEED_MASTER_RESUME, disclosures);
  }, [currentProfile, disclosures]);

  // Completeness score
  const completenessPercent = useMemo(() => {
    return calculateFormCompleteness(formFields);
  }, [formFields]);

  // Truthful Answers Bank for current job
  const [answersBank, setAnswersBank] = useState<AnswerBankItem[]>([]);

  useEffect(() => {
    if (currentProfile) {
      const generated = generateTruthfulAnswersBank(
        currentJob.company,
        currentJob.title,
        currentProfile,
        SEED_MASTER_RESUME
      );
      setAnswersBank(generated);
    }
  }, [currentJob, currentProfile]);

  // Copied item indicator
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyText = (key: string, text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Copy Full Bookmarklet Injection Script
  const handleCopyScript = () => {
    const script = generateAutofillBookmarkletScript(detectedPlatform, formFields);
    navigator.clipboard.writeText(script);
    showToast(`Copied ${detectedPlatform.toUpperCase()} autofill script with Human Review gate!`);
  };

  // Export Application JSON Payload
  const handleExportJson = () => {
    const payload = {
      applicationMetadata: {
        company: currentJob.company,
        role: currentJob.title,
        jobUrl: activePortalUrl,
        atsPlatform: detectedPlatform,
        generatedAt: new Date().toISOString(),
        humanReviewGateConfirmed: humanReviewAcknowledged,
      },
      candidateFields: formFields.reduce((acc, f) => {
        acc[f.systemKey] = f.value;
        return acc;
      }, {} as Record<string, string>),
      screeningAnswers: answersBank.map((a) => ({
        question: a.question,
        answer: a.answer,
      })),
      compliance: 'India DPDP Act 2023 - Candidate Self-Directed Ingestion Payload',
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rjobs_autofill_${currentJob.company.toLowerCase().replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported complete application JSON bundle.');
  };

  // Record application in tracker
  const handleMarkAsApplied = (status: ApplicationStatus = 'applied') => {
    const validation = validateHumanReviewGate(disclosures, humanReviewAcknowledged);
    if (!validation.isValid) {
      alert(`Human-in-the-loop Gate: ${validation.missingRequirements.join('. ')}`);
      return;
    }

    const existingIndex = applications.findIndex((a) => a.company === currentJob.company && a.role === currentJob.title);
    if (existingIndex >= 0) {
      const updated = [...applications];
      updated[existingIndex] = {
        ...updated[existingIndex],
        status,
        appliedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };
      setApplications(updated);
      showToast(`Updated application status for ${currentJob.company} to "${status}"`);
    } else {
      const newRecord: ApplicationRecord = {
        id: `app_${Date.now()}`,
        jobId: currentJob.id,
        company: currentJob.company,
        role: currentJob.title,
        location: currentJob.location,
        portalUrl: activePortalUrl,
        appliedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status,
        resumeUsedTitle: `Tailored: ${currentJob.company} Resume`,
        notes: `Application verified via rJobs Apply Assist on ${new Date().toLocaleDateString()}. Human review checklist satisfied.`,
        atsPlatform: detectedPlatform,
      };
      setApplications([newRecord, ...applications]);
      showToast(`Logged application to ${currentJob.company} in Tracker!`);
    }
  };

  // Application tracker filters
  const [trackerStatusFilter, setTrackerStatusFilter] = useState<string>('all');
  const [trackerSearch, setTrackerSearch] = useState<string>('');

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesFilter = trackerStatusFilter === 'all' || app.status === trackerStatusFilter;
      const matchesSearch =
        trackerSearch.trim() === '' ||
        app.company.toLowerCase().includes(trackerSearch.toLowerCase()) ||
        app.role.toLowerCase().includes(trackerSearch.toLowerCase()) ||
        app.notes.toLowerCase().includes(trackerSearch.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [applications, trackerStatusFilter, trackerSearch]);

  // Update application status
  const handleUpdateAppStatus = (appId: string, newStatus: ApplicationStatus) => {
    setApplications(
      applications.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
    );
    showToast(`Updated status to ${newStatus}`);
  };

  // Delete application record
  const handleDeleteApplication = (appId: string) => {
    setApplications(applications.filter((a) => a.id !== appId));
    showToast('Application record removed');
  };

  // Scraper directory search and filter
  const [directorySearch, setDirectorySearch] = useState<string>('');
  const [directoryPlatformFilter, setDirectoryPlatformFilter] = useState<string>('all');

  const filteredSources = useMemo(() => {
    return SEED_JOB_SOURCES.filter((source) => {
      const matchesSearch =
        directorySearch.trim() === '' ||
        source.company.toLowerCase().includes(directorySearch.toLowerCase()) ||
        source.roleLabel.toLowerCase().includes(directorySearch.toLowerCase()) ||
        source.careersUrl.toLowerCase().includes(directorySearch.toLowerCase());
      const matchesPlatform =
        directoryPlatformFilter === 'all' || source.platform === directoryPlatformFilter;
      return matchesSearch && matchesPlatform;
    });
  }, [directorySearch, directoryPlatformFilter]);

  // Quick switch target company from directory
  const handleSelectSourceFromDirectory = (source: JobSource) => {
    const matchingJob = INITIAL_JOB_OPENINGS.find((j) => j.sourceId === source.id);
    if (matchingJob) {
      setSelectedJobId(matchingJob.id);
    }
    setCustomPortalUrl(source.careersUrl);
    setActiveTab('autofill');
    showToast(`Loaded ${source.company} into Apply Assist`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-emerald-500/60 shadow-2xl flex items-center gap-3 text-xs text-emerald-200 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium text-slate-100">{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-sky-600/30">
                AA
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-100 text-sm">Apply Assist</span>
                  <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">
                    SaaS Companion
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Human-in-the-Loop ATS Ingestion & Applications Tracker
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Demo Switcher */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-400">Candidate:</span>
              <button
                type="button"
                onClick={() => switchAccount('aarav-sharma')}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  currentUser?.id === 'user_aarav_01'
                    ? 'bg-sky-600 text-white font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Aarav (IIT-D)
              </button>
              <button
                type="button"
                onClick={() => switchAccount('priya-patel')}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  currentUser?.id === 'user_priya_02'
                    ? 'bg-sky-600 text-white font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Priya (BITS)
              </button>
            </div>

            {onOpenStudio && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenStudio}
                leftIcon={<FileText className="w-3.5 h-3.5 text-indigo-400" />}
              >
                Resume Studio
              </Button>
            )}

            {onOpenRadar && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenRadar}
                leftIcon={<Radar className="w-3.5 h-3.5 text-purple-400" />}
              >
                Job Radar (35 Co)
              </Button>
            )}

            <Button variant="secondary" size="sm" onClick={onBackToDashboard}>
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner with ADR-006 Compliance Guarantee */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-950/80 border border-sky-800/60 flex items-center justify-center text-sky-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white">Apply Assist Engine</h1>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle className="w-3 h-3" />
                  ADR-006 Human Gate Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Autofills Workday, Greenhouse, Lever, and Amazon Jobs without robotic submission violations. You review and verify every answer.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyScript}
              leftIcon={<Code2 className="w-3.5 h-3.5 text-sky-400" />}
              title="Copy JavaScript autofill bookmarklet for browser console"
            >
              Copy Script
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportJson}
              leftIcon={<Download className="w-3.5 h-3.5" />}
              title="Export complete application payload as JSON under DPDP Act"
            >
              Export JSON
            </Button>
          </div>
        </div>

        {/* View Navigation Tabs (Segmented Control - compliant with Frontend Design constitution) */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('autofill')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
              activeTab === 'autofill'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>1. ATS Autofill & Mapper</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('answers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
              activeTab === 'answers'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>2. Truthful Answers Bank</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tracker')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
              activeTab === 'tracker'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>3. Applications Tracker ({applications.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
              activeTab === 'directory'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>4. Scraped Career Directory (35 Companies)</span>
          </button>
        </div>

        {/* TAB 1: ATS AUTOFILL & MAPPER */}
        {activeTab === 'autofill' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Target Job & Form Settings */}
            <div className="lg:col-span-5 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-sky-400" />
                    <span>Target Opportunity</span>
                  </CardTitle>
                  <CardDescription>
                    Select an opening scraped from our 35 enterprise sources or input a custom portal URL
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Select Monitored Opening */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Select Monitored Employer (35 Active)
                    </label>
                    <select
                      value={selectedJobId}
                      onChange={(e) => {
                        setSelectedJobId(e.target.value);
                        setCustomPortalUrl('');
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    >
                      {INITIAL_JOB_OPENINGS.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.company} — {job.title} ({job.location.split(',')[0]})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Or Custom Career Portal URL */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Or Custom Application URL (Workday / Greenhouse / Lever / Amazon)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://company.wd5.myworkdayjobs.com/apply"
                        value={customPortalUrl}
                        onChange={(e) => setCustomPortalUrl(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      />
                      {customPortalUrl && (
                        <button
                          type="button"
                          onClick={() => setCustomPortalUrl('')}
                          className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Detected Platform Card */}
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Target Platform:</span>
                      <span className="font-semibold text-sky-400 uppercase tracking-wider">
                        {detectedPlatform.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Profile Match Completeness:</span>
                      <span className="font-semibold text-emerald-400">{completenessPercent}% mapped</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Target Role:</span>
                      <span className="text-slate-200 truncate max-w-[200px]" title={currentJob.title}>
                        {currentJob.title}
                      </span>
                    </div>
                  </div>

                  {/* Action Link to Official Portal */}
                  <div className="pt-2 flex flex-col gap-2">
                    <a
                      href={activePortalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
                    >
                      <span>Open Official {currentJob.company} Application Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyScript}
                        className="flex-1"
                        leftIcon={<Code2 className="w-3.5 h-3.5 text-sky-400" />}
                      >
                        Copy Ingestion Script
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleMarkAsApplied('applied')}
                        className="flex-1"
                        leftIcon={<Check className="w-3.5 h-3.5 text-emerald-400" />}
                      >
                        Mark as Applied
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sensitive Legal Disclosures & Human-in-the-Loop Review Gate */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Human Review Gate (ADR-006)</span>
                  </CardTitle>
                  <CardDescription>
                    Work authorization, notice period, and mandatory disclosures required by Indian employers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Work Authorization in India */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Work Authorization in India
                    </label>
                    <select
                      value={disclosures.workAuthorization}
                      onChange={(e) =>
                        setDisclosures({
                          ...disclosures,
                          workAuthorization: e.target.value as LegalDisclosures['workAuthorization'],
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                    >
                      <option value="india_citizen">Citizen of India (Authorized without sponsorship)</option>
                      <option value="has_valid_visa">Holds valid work visa in India</option>
                      <option value="requires_sponsorship">Requires employer visa sponsorship</option>
                    </select>
                  </div>

                  {/* Notice Period */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Notice Period
                      </label>
                      <select
                        value={disclosures.noticePeriodDays}
                        onChange={(e) =>
                          setDisclosures({ ...disclosures, noticePeriodDays: Number(e.target.value) })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                      >
                        <option value="0">Immediate (0 days)</option>
                        <option value="15">15 Days</option>
                        <option value="30">30 Days</option>
                        <option value="60">60 Days</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Expected CTC (LPA)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="100"
                        value={disclosures.expectedCtcInrLpa}
                        onChange={(e) =>
                          setDisclosures({ ...disclosures, expectedCtcInrLpa: Number(e.target.value) })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                      />
                    </div>
                  </div>

                  {/* Relocation & NOC Checkboxes */}
                  <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={disclosures.willingToRelocate}
                        onChange={(e) =>
                          setDisclosures({ ...disclosures, willingToRelocate: e.target.checked })
                        }
                        className="rounded border-slate-700 text-sky-600 focus:ring-sky-500"
                      />
                      <span>Willing to relocate (Bengaluru, Hyderabad, Pune, Gurugram)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={disclosures.collegeNocAvailable}
                        onChange={(e) =>
                          setDisclosures({ ...disclosures, collegeNocAvailable: e.target.checked })
                        }
                        className="rounded border-slate-700 text-sky-600 focus:ring-sky-500"
                      />
                      <span>College No Objection Certificate (NOC) available for 6-month internship</span>
                    </label>
                  </div>

                  {/* Mandatory Human Review Checkbox */}
                  <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-xs">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={humanReviewAcknowledged}
                        onChange={(e) => setHumanReviewAcknowledged(e.target.checked)}
                        className="mt-0.5 rounded border-amber-600 text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-amber-200 leading-relaxed font-medium">
                        I confirm that I have reviewed these personal disclosures and truthful entries. rJobs will never auto-submit on my behalf without my explicit inspection.
                      </span>
                    </label>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: ATS Mapped Field Payload */}
            <div className="lg:col-span-7 space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-sky-400" />
                      <span>Standard ATS Form Field Mapping</span>
                    </CardTitle>
                    <CardDescription>
                      Mapped from your verified Master Profile for {currentJob.company} ({formFields.length} fields ready)
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const text = formFields.map((f) => `${f.label}: ${f.value}`).join('\n');
                      handleCopyText('all_fields', text, 'All Mapped Fields');
                    }}
                    leftIcon={<Copy className="w-3.5 h-3.5" />}
                  >
                    Copy All Fields
                  </Button>
                </CardHeader>

                <CardContent className="space-y-3">
                  {formFields.map((field) => (
                    <div
                      key={field.id}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200">{field.label}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-mono">
                            {field.systemKey}
                          </span>
                          {field.isSensitive && (
                            <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/40">
                              Sensitive Legal
                            </span>
                          )}
                        </div>
                        <div className="text-slate-300 font-mono text-[11px] break-all bg-slate-900/60 px-2 py-1 rounded">
                          {field.value || <span className="text-slate-500 italic">Not set</span>}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyText(field.id, field.value, field.label)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                        title={`Copy ${field.label}`}
                      >
                        {copiedKey === field.id ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: TRUTHFUL ANSWERS BANK */}
        {activeTab === 'answers' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>Truthful Application Answers Bank ({currentJob.company})</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  AI-assisted answers grounded strictly in your verified coursework, internships, and projects. Zero hallucinated claims.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const text = answersBank
                      .map((a) => `Q: ${a.question}\n\nA: ${a.answer}\n\n---\n`)
                      .join('\n');
                    handleCopyText('all_answers', text, 'All Answers');
                  }}
                  leftIcon={<Copy className="w-3.5 h-3.5" />}
                >
                  Copy All Answers
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {answersBank.map((item) => (
                <Card key={item.id}>
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div className="space-y-1">
                      <CardTitle className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{item.question}</span>
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                        <span>Grounded in:</span>
                        {item.contextSources.map((source, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-sky-300"
                          >
                            {source}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyText(item.id, item.answer, 'Answer')}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {copiedKey === item.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      rows={4}
                      value={item.answer}
                      onChange={(e) => {
                        const updated = answersBank.map((a) =>
                          a.id === item.id ? { ...a, answer: e.target.value } : a
                        );
                        setAnswersBank(updated);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-sky-500 font-sans"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: APPLICATIONS TRACKER */}
        {activeTab === 'tracker' && (
          <div className="space-y-6">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex flex-1 items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search applications by company, role, or notes..."
                  value={trackerSearch}
                  onChange={(e) => setTrackerSearch(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={trackerStatusFilter}
                  onChange={(e) => setTrackerStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="all">All Statuses ({applications.length})</option>
                  <option value="ready">Autofill Ready</option>
                  <option value="applied">Applied</option>
                  <option value="oa_pending">Online Assessment (OA)</option>
                  <option value="interview">Interview Scheduled</option>
                  <option value="offer">Offer</option>
                </select>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleMarkAsApplied('ready')}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Track Current Job
                </Button>
              </div>
            </div>

            {/* Applications Table / Cards */}
            <div className="space-y-3">
              {filteredApplications.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                  No applications found matching your search.
                </div>
              ) : (
                filteredApplications.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs shrink-0">
                        {app.company.slice(0, 2)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{app.company}</span>
                          <span className="text-slate-400">•</span>
                          <span className="font-medium text-slate-300">{app.role}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2">
                          <span>{app.location}</span>
                          <span>•</span>
                          <span>Applied: {app.appliedDate}</span>
                          <span>•</span>
                          <span>Resume: {app.resumeUsedTitle}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 max-w-xl">
                          {app.notes}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                      <select
                        value={app.status}
                        onChange={(e) =>
                          handleUpdateAppStatus(app.id, e.target.value as ApplicationStatus)
                        }
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold border ${
                          app.status === 'offer'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : app.status === 'interview'
                            ? 'bg-purple-950 text-purple-300 border-purple-800'
                            : app.status === 'oa_pending'
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-slate-950 text-slate-300 border-slate-700'
                        }`}
                      >
                        <option value="draft">Draft</option>
                        <option value="ready">Autofill Ready</option>
                        <option value="applied">Applied</option>
                        <option value="oa_pending">OA Pending</option>
                        <option value="interview">Interview</option>
                        <option value="offer">Offer Received</option>
                        <option value="rejected">Archived</option>
                      </select>

                      <a
                        href={app.portalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Open portal"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleDeleteApplication(app.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Delete application record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SCRAPED CAREER DIRECTORY (ALL 35 ENTERPRISE SOURCES) */}
        {activeTab === 'directory' && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" />
                <h2 className="text-sm font-bold text-white">
                  35 Enterprise Career Portals Monitored & Ingested
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Official career page endpoints scraped for internship and university graduate opportunities across India. Click &quot;Launch Apply Assist&quot; to stage your candidate profile into any employer&apos;s ATS portal.
              </p>
            </div>

            {/* Search and platform filter bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex flex-1 items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search among 35 career pages by company, role, or URL..."
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Platform:</span>
                <select
                  value={directoryPlatformFilter}
                  onChange={(e) => setDirectoryPlatformFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="all">All ATS Adapters ({SEED_JOB_SOURCES.length})</option>
                  <option value="workday">Workday</option>
                  <option value="amazon_jobs">Amazon Jobs</option>
                  <option value="eightfold">Eightfold</option>
                  <option value="oracle_hcm">Oracle HCM</option>
                  <option value="successfactors">SuccessFactors</option>
                  <option value="phenom">Phenom</option>
                  <option value="custom_react">Custom Portal</option>
                </select>
              </div>
            </div>

            {/* Sources Directory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSources.map((source) => (
                <div
                  key={source.id}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs">
                          {source.company.slice(0, 2)}
                        </div>
                        <h3 className="font-bold text-white text-sm">{source.company}</h3>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {source.platform}
                      </span>
                    </div>

                    <div className="text-xs font-medium text-sky-300">
                      {source.roleLabel}
                    </div>

                    <div className="text-[11px] text-slate-400 truncate" title={source.careersUrl}>
                      {source.careersUrl}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <a
                      href={source.careersUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <span>Visit Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSelectSourceFromDirectory(source)}
                      leftIcon={<Send className="w-3 h-3" />}
                    >
                      Launch Assist
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
