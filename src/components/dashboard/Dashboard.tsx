import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { SEED_MASTER_RESUME } from '../../services/candidateData.ts';
import { Button } from '../ui/Button.tsx';
import { Badge } from '../ui/Badge.tsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card.tsx';
import {
  FileText,
  Radar,
  Briefcase,
  User,
  ExternalLink,
  Sparkles,
  Download,
  Building2,
  MapPin,
  CheckCircle,
  Clock,
  BookOpen,
  ArrowLeft,
  Calendar,
  LogOut,
  Sliders,
} from 'lucide-react';

interface DashboardProps {
  onBackToLanding: () => void;
  onOpenProfile: () => void;
  onOpenDocs: () => void;
  onOpenStudio: () => void;
  onOpenRadar?: () => void;
  onOpenAssist?: () => void;
}

const RECENT_MATCHES = [
  {
    id: 'job_google_01',
    company: 'Google',
    role: 'Software Engineering Intern - Summer 2026',
    location: 'Bengaluru / Hyderabad, India',
    matchScore: 96,
    reasons: ['Distributed Systems', 'C++', 'Go', 'Data Structures & Algorithms'],
    posted: '2 hours ago',
    url: 'https://careers.google.com/jobs/results/',
  },
  {
    id: 'job_nvidia_02',
    company: 'Nvidia',
    role: 'Systems Software Engineer Intern',
    location: 'Bengaluru, India',
    matchScore: 92,
    reasons: ['Low Latency', 'C++20', 'Operating Systems', 'Linux Perf'],
    posted: '5 hours ago',
    url: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite',
  },
  {
    id: 'job_msft_03',
    company: 'Microsoft',
    role: 'Software Development Engineer - University Graduate',
    location: 'Hyderabad, India',
    matchScore: 88,
    reasons: ['Cloud Services', 'High-Throughput Backend', 'Kafka'],
    posted: '1 day ago',
    url: 'https://jobs.careers.microsoft.com',
  },
];

const RECENT_APPLICATIONS = [
  {
    id: 'app_1',
    company: 'Google',
    role: 'Software Engineering Intern',
    status: 'OA',
    statusBadge: 'warning',
    statusLabel: 'Online Assessment Due in 3 Days',
    appliedDate: 'Oct 12, 2026',
    resumeUsed: 'Master Technical Resume 2026',
  },
  {
    id: 'app_2',
    company: 'Microsoft',
    role: 'Software Engineer (Graduate)',
    status: 'interview',
    statusBadge: 'purple',
    statusLabel: 'Technical Round 1 Scheduled',
    appliedDate: 'Oct 08, 2026',
    resumeUsed: 'Tailored: MSFT Cloud Systems',
  },
  {
    id: 'app_3',
    company: 'Uber',
    role: 'Backend Engineering Intern',
    status: 'applied',
    statusBadge: 'info',
    statusLabel: 'Application Under Review',
    appliedDate: 'Oct 14, 2026',
    resumeUsed: 'Master Technical Resume 2026',
  },
];

export const Dashboard: React.FC<DashboardProps> = ({
  onBackToLanding,
  onOpenProfile,
  onOpenDocs,
  onOpenStudio,
  onOpenRadar,
  onOpenAssist,
}) => {
  const { currentUser, currentProfile, logout, switchAccount } = useAuth();
  const [downloadToast, setDownloadToast] = useState(false);

  const handleDownloadMaster = () => {
    setDownloadToast(true);
    setTimeout(() => setDownloadToast(false), 2500);
  };

  const handleExportData = () => {
    const dataDump = {
      user: currentUser,
      profile: currentProfile,
      masterResume: SEED_MASTER_RESUME,
      recentApplications: RECENT_APPLICATIONS,
      exportedAt: new Date().toISOString(),
      compliance: 'India DPDP Act 2023 - Complete Personal Data Export',
    };
    const blob = new Blob([JSON.stringify(dataDump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rjobs_export_${currentUser?.id || 'candidate'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToLanding}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Back to landing page"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                rJ
              </div>
              <span className="font-bold text-slate-100 text-sm hidden sm:inline">
                rJobs Candidate Workspace
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Demo Switcher */}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-400">Demo User:</span>
              <button
                type="button"
                onClick={() => switchAccount('aarav-sharma')}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  currentUser?.id === 'user_aarav_01'
                    ? 'bg-indigo-600 text-white font-semibold'
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
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Priya (BITS)
              </button>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={onOpenStudio}
              leftIcon={<FileText className="w-3.5 h-3.5" />}
            >
              Resume Studio
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onOpenRadar}
              leftIcon={<Radar className="w-3.5 h-3.5 text-purple-400" />}
            >
              Job Radar (35 Co)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onOpenAssist}
              leftIcon={<Briefcase className="w-3.5 h-3.5 text-sky-400" />}
            >
              Apply Assist
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onOpenDocs}
              leftIcon={<BookOpen className="w-3.5 h-3.5 text-indigo-400" />}
            >
              Docs
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenProfile}
              leftIcon={<User className="w-3.5 h-3.5" />}
            >
              Profile
            </Button>

            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Toast Notification */}
        {downloadToast && (
          <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-emerald-500/50 shadow-2xl flex items-center gap-3 text-xs text-emerald-200">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="font-semibold text-white">LaTeX PDF Compilation Dispatched</div>
              <div className="text-slate-400 text-[11px]">Tectonic compiler worker generated PDF in 1.4s.</div>
            </div>
          </div>
        )}

        {/* Candidate Profile Summary Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-indigo-600/30">
              {currentUser?.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{currentUser?.name}</h1>
                <Badge variant={currentUser?.plan === 'pro' ? 'purple' : 'default'} size="sm">
                  {currentUser?.plan?.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {currentProfile?.headline}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  {currentProfile?.location}
                </span>
                <span>•</span>
                <span>{currentProfile?.college}</span>
                <span>•</span>
                <span className="font-semibold text-slate-200">{currentProfile?.cgpaOrPercentage}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenProfile}
              className="w-full md:w-auto"
            >
              Edit Candidate Profile
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportData}
              className="w-full md:w-auto"
              title="Download full JSON data export under DPDP Act"
            >
              Export JSON
            </Button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
              <span>ATS Health Score</span>
              <FileText className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-white">94/100</div>
            <p className="text-[11px] text-emerald-400 mt-1 font-medium">Overleaf-grade single column</p>
          </Card>

          <Card
            className="p-4 cursor-pointer hover:border-purple-500/50 transition-colors"
            onClick={onOpenRadar}
          >
            <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
              <span>Radar Matches</span>
              <Radar className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-white">42 Jobs</div>
            <p className="text-[11px] text-purple-300 mt-1">35 active employer sources &rarr;</p>
          </Card>

          <Card className="p-4">
            <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
              <span>Active Applications</span>
              <Briefcase className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-white">6 In Pipeline</div>
            <p className="text-[11px] text-indigo-300 mt-1">2 Online Assessments due</p>
          </Card>

          <Card className="p-4">
            <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
              <span>LaTeX Versions</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-white">3 Resumes</div>
            <p className="text-[11px] text-slate-400 mt-1">1 Master, 2 Tailored</p>
          </Card>
        </div>

        {/* 2-Column Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Master Resume & Tailoring Preview */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>Master Technical Resume</span>
                  </CardTitle>
                  <CardDescription>
                    Compiled with sandboxed Tectonic (TeX Live) • Single-Column ATS Template
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">ATS Score: 94</Badge>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onOpenStudio}
                    leftIcon={<FileText className="w-3.5 h-3.5" />}
                  >
                    Open in Studio
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadMaster}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                  >
                    Export PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Simulated Document Preview Card */}
                <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs space-y-4 font-mono shadow-inner">
                  {/* Header */}
                  <div className="text-center border-b border-slate-800 pb-3">
                    <div className="text-base font-bold text-white tracking-wider">
                      {SEED_MASTER_RESUME.data.basics.name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {SEED_MASTER_RESUME.data.basics.location} • {SEED_MASTER_RESUME.data.basics.phone} •{' '}
                      {SEED_MASTER_RESUME.data.basics.email}
                    </div>
                    <div className="text-[10px] text-indigo-400 mt-1">
                      github.com/aarav-sharma-iitd • linkedin.com/in/aarav-sharma-dev • leetcode.com/aarav_codes
                    </div>
                  </div>

                  {/* Education */}
                  <div>
                    <div className="font-bold text-slate-100 uppercase tracking-wider text-[11px] border-b border-slate-800 pb-0.5">
                      Education
                    </div>
                    <div className="flex justify-between items-start mt-1.5 font-sans">
                      <div>
                        <div className="font-semibold text-white">Indian Institute of Technology (IIT) Delhi</div>
                        <div className="text-slate-400">B.Tech in Computer Science and Engineering</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-slate-300">2022 - 2026</div>
                        <div className="text-indigo-400 font-semibold">8.84 / 10 CGPA</div>
                      </div>
                    </div>
                  </div>

                  {/* Experience */}
                  <div>
                    <div className="font-bold text-slate-100 uppercase tracking-wider text-[11px] border-b border-slate-800 pb-0.5">
                      Experience
                    </div>
                    <div className="mt-1.5 font-sans">
                      <div className="flex justify-between font-semibold text-white">
                        <span>Swiggy • Software Development Engineer Intern</span>
                        <span className="text-slate-400 text-[11px]">May 2025 - July 2025</span>
                      </div>
                      <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-300 text-[11px]">
                        <li>
                          Engineered an event-driven inventory reconciliation pipeline in Go and Apache Kafka, processing 1.8M events/day with 99.98% delivery reliability.
                        </li>
                        <li>
                          Optimized PostgreSQL query plans and added Redis cluster caching, reducing p99 latency from 240ms to 42ms for partner store catalog lookup.
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Projects */}
                  <div>
                    <div className="font-bold text-slate-100 uppercase tracking-wider text-[11px] border-b border-slate-800 pb-0.5">
                      Technical Projects
                    </div>
                    <div className="mt-1.5 font-sans space-y-2">
                      <div>
                        <div className="flex justify-between font-semibold text-white">
                          <span>ChronoKV: Distributed Raft-based Key-Value Store</span>
                          <span className="text-indigo-400 text-[10px]">Go, Raft, gRPC, Protobuf</span>
                        </div>
                        <p className="text-slate-300 text-[11px] mt-0.5">
                          Implemented Raft consensus from scratch; benchmarked with Jepsen tests guaranteeing linearizability under 33% node network partitions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Template: <strong className="text-slate-200">Classic Single-Column (Overleaf)</strong></span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Zero anti-fabrication warnings
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Applications Pipeline Preview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-400" />
                    <span>Applications Pipeline</span>
                  </CardTitle>
                  <CardDescription>
                    Tracking campus & off-campus opportunities
                  </CardDescription>
                </div>
                {onOpenAssist && (
                  <Button variant="outline" size="sm" onClick={onOpenAssist}>
                    Open Apply Assist
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {RECENT_APPLICATIONS.map((app) => (
                  <div
                    key={app.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-white text-xs">
                        {app.company.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-white">{app.company}</div>
                        <div className="text-slate-400 text-[11px]">{app.role}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Used: {app.resumeUsed}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <Badge
                        variant={
                          app.statusBadge === 'warning'
                            ? 'warning'
                            : app.statusBadge === 'purple'
                            ? 'purple'
                            : 'info'
                        }
                        size="sm"
                      >
                        {app.statusLabel}
                      </Badge>
                      <div className="text-[10px] text-slate-400 mt-1">Applied: {app.appliedDate}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Job Radar Live Matches */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Radar className="w-4 h-4 text-purple-400" />
                    <span>Job Radar Matches</span>
                  </CardTitle>
                  <CardDescription>
                    Real-time openings matched to your verified master profile
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={onOpenRadar}>
                  View All 35
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {RECENT_MATCHES.map((job) => (
                  <div
                    key={job.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors space-y-2.5"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="font-bold text-white text-xs">{job.company}</div>
                        <h4 className="text-xs font-semibold text-indigo-300 mt-0.5">{job.role}</h4>
                      </div>
                      <Badge variant="purple" size="sm">
                        {job.matchScore}% Match
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{job.location}</span>
                      <span>•</span>
                      <span>{job.posted}</span>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {job.reasons.map((r) => (
                        <span
                          key={r}
                          className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300"
                        >
                          {r}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        <span>Original Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <Button variant="primary" size="sm" onClick={onOpenStudio}>
                        Tailor Resume
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Compliance & Settings Quick Panel */}
            <Card className="p-4 bg-slate-950 border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>India DPDP Act & Privacy Controls</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                You maintain 100% data ownership. No AI training on your personal resume, no automated recruiter submissions without consent.
              </p>
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleExportData}
                  className="text-indigo-400 hover:underline cursor-pointer"
                >
                  Download Data (JSON)
                </button>
                <button
                  type="button"
                  onClick={onOpenDocs}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  Read Security Policy
                </button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
