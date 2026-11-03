import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Button } from '../ui/Button.tsx';
import { Badge } from '../ui/Badge.tsx';
import { Card, CardContent } from '../ui/Card.tsx';
import {
  FileText,
  Radar,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Code2,
  ExternalLink,
  BookOpen,
  Zap,
  Lock,
  Layers,
  Award,
  Sliders,
  ChevronRight,
} from 'lucide-react';

interface LandingPageProps {
  onGoToDashboard: () => void;
  onOpenDocs: () => void;
  onOpenProfile: () => void;
  onOpenStudio?: () => void;
  onOpenRadar?: () => void;
  onOpenAssist?: () => void;
}

const SEED_COMPANIES = [
  'Google',
  'Microsoft',
  'Amazon',
  'Nvidia',
  'Apple',
  'Oracle',
  'Qualcomm',
  'Goldman Sachs',
  'JP Morgan',
  'Uber',
  'Adobe',
  'Salesforce',
  'Infosys InStep',
  'TCS',
  'Barclays',
  'Sony Research',
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoToDashboard,
  onOpenDocs,
  onOpenProfile,
  onOpenStudio,
  onOpenRadar,
  onOpenAssist,
}) => {
  const { currentUser, openAuthModal, isAuthenticated, switchAccount } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Banner for Indian Students */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border-b border-indigo-900/50 py-1.5 px-4 text-center text-xs text-indigo-200">
        <span className="font-semibold text-white">Campus & Off-Campus Hiring Cycle 2025-2026:</span>{' '}
        Monitoring active openings at 35 top employers across India.
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center font-extrabold text-white shadow-lg shadow-indigo-600/30">
              rJ
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white">rJobs</span>
              <span className="ml-1.5 text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800/60">
                SaaS
              </span>
            </div>
          </div>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <button
              type="button"
              onClick={onOpenStudio || onGoToDashboard}
              className="hover:text-white transition-colors cursor-pointer text-indigo-300 font-bold"
            >
              Resume Studio
            </button>
            <button
              type="button"
              onClick={onOpenRadar || onGoToDashboard}
              className="hover:text-white transition-colors cursor-pointer text-purple-300 font-bold"
            >
              Job Radar (35 Co)
            </button>
            <button
              type="button"
              onClick={onOpenAssist || onGoToDashboard}
              className="hover:text-white transition-colors cursor-pointer text-sky-300 font-bold"
            >
              Apply Assist
            </button>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing (INR)
            </a>
            <button
              type="button"
              onClick={onOpenDocs}
              className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Specs & Docs</span>
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 transition-colors cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold">
                    {currentUser?.name.charAt(0)}
                  </div>
                  <span className="truncate max-w-[120px]">{currentUser?.name}</span>
                </button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onGoToDashboard}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Dashboard
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openAuthModal('login')}
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => openAuthModal('signup')}
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-xs font-semibold text-indigo-300 mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Built for Indian University Students & Early-Career Tech Job Seekers</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
            Spend minutes, not hours, on each application with a{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200">
              resume that fits every job.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            One shared candidate profile connects an Overleaf-grade LaTeX resume studio, automated career radar alerts from 34+ top companies in India, and an assisted form-filling extension with guaranteed human review.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={onGoToDashboard}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Open Candidate Workspace
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={onOpenDocs}
              leftIcon={<BookOpen className="w-4 h-4 text-indigo-400" />}
            >
              System Specs & Architecture
            </Button>
          </div>

          {/* Quick Demo Switcher Strip */}
          <div className="mt-10 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="font-semibold text-slate-200">Try Live Demo:</span>
              <span>Loaded with real IIT/BITS candidate records</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => switchAccount('aarav-sharma')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors cursor-pointer"
              >
                Aarav (IIT Delhi SDE)
              </button>
              <button
                type="button"
                onClick={() => switchAccount('priya-patel')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors cursor-pointer"
              >
                Priya (BITS AI/ML)
              </button>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-xs font-medium text-slate-400">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero Fabricated Data</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              <span>Sandboxed TeX Live</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400" />
              <span>Human-in-the-Loop Gate</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>DPDP Act Compliant</span>
            </div>
          </div>
        </div>
      </section>

      {/* Monitored Companies Marquee */}
      <section className="py-8 bg-slate-900/40 border-y border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Monitoring active openings & programs at 34+ Top Tech Employers
          </p>
          <div className="flex flex-wrap justify-center items-center gap-2.5 sm:gap-4">
            {SEED_COMPANIES.map((company) => (
              <span
                key={company}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 shadow-sm"
              >
                {company}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* The 3 Connected Capabilities */}
      <section id="features" className="py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="purple" size="md">
            The Three Pillars
          </Badge>
          <h2 className="text-3xl font-black text-white mt-3">
            One Candidate Profile. Three Connected Capabilities.
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Never copy-paste between fragmented tools. Your Master Resume branches seamlessly into tailored resumes, monitors alerts, and autofills verified applications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pillar 1 */}
          <Card hoverable className="flex flex-col justify-between" id="studio">
            <CardContent className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">1. Resume Studio</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Build ATS-optimized LaTeX resumes compiled with Tectonic / TeX Live. Tailor to any job description truthfully with our anti-fabrication verifier.
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>5 Overleaf-grade LaTeX templates</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Sub-5-second secure PDF compilation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Anti-fabrication change proposals</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Pillar 2 */}
          <Card hoverable className="flex flex-col justify-between" id="radar">
            <CardContent className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400">
                <Radar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">2. Job Radar</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated career page monitors for Workday, Amazon, Oracle HCM, and Eightfold. Get alerted when an opening matches your skills before LinkedIn sees it.
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>34+ Seed company adapters in India</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Program pages & internship trackers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Semantic pgvector matching score</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Pillar 3 */}
          <Card hoverable className="flex flex-col justify-between" id="assist">
            <CardContent className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-sky-950/80 border border-sky-800/60 flex items-center justify-center text-sky-400">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">3. Apply Assist (Beta)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Smart browser extension that autofills complex ATS application forms (Workday, Greenhouse, Lever) using your Candidate Profile and Answers Bank.
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Hard confirmation gate (never auto-submits)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Sensitive legal/visa questions protected</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Auto-logs to Application Kanban tracker</span>
                </li>
              </ul>
              {onOpenAssist && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-sky-400 border-sky-800 hover:bg-sky-950/60"
                    onClick={onOpenAssist}
                  >
                    Launch Apply Assist
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section (INR & Student Friendly) */}
      <section id="pricing" className="py-20 bg-slate-900/30 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="info" size="md">
              Transparent Pricing
            </Badge>
            <h2 className="text-3xl font-black text-white mt-3">
              Fair, Student-First Plans in Indian Rupees (INR)
            </h2>
            <p className="text-xs text-slate-400 mt-2">
              Free forever for building your master resume. Upgrade to Pro for unlimited exports and real-time radar alerts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">Student Free</h3>
                  <Badge variant="default">Basic</Badge>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-black text-white">₹0</span>
                  <span className="text-xs text-slate-400"> / forever</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Everything you need to build and export your core master resume.
                </p>
                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>1 Master Resume with full Candidate Profile</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>3 PDF Exports per month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>3 Job Description Tailorings / month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>5 Job Radar alerts per week</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Basic Kanban Application Tracker</span>
                  </li>
                </ul>
              </div>
              <Button
                variant="outline"
                className="w-full mt-8"
                onClick={() => {
                  switchAccount('priya-patel');
                  onGoToDashboard();
                }}
              >
                Use Free Tier
              </Button>
            </Card>

            {/* Pro Plan */}
            <Card className="p-6 border-indigo-500/50 bg-gradient-to-b from-indigo-950/40 to-slate-900/90 flex flex-col justify-between relative shadow-xl shadow-indigo-500/10">
              <div className="absolute top-4 right-4">
                <Badge variant="purple">Recommended for Placements</Badge>
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">Campus Pro</h3>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-black text-white">₹499</span>
                  <span className="text-xs text-indigo-300 font-semibold"> / quarter</span>
                  <span className="text-[11px] text-slate-400 ml-2">(₹166/month)</span>
                </div>
                <p className="text-xs text-slate-300 mt-2">
                  Complete firepower for campus placements and off-campus internship drives.
                </p>
                <ul className="mt-6 space-y-3 text-xs text-slate-200">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    <span><strong>Unlimited</strong> PDF & LaTeX (.tex) exports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    <span><strong>30 Job Tailorings</strong> / month with anti-fabrication check</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    <span><strong>Instant Job Radar Alerts</strong> (WhatsApp & Email options)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    <span>All 5 Overleaf-grade ATS LaTeX templates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    <span>Apply Assist Chrome extension access</span>
                  </li>
                </ul>
              </div>
              <Button
                variant="primary"
                className="w-full mt-8"
                onClick={() => {
                  switchAccount('aarav-sharma');
                  onGoToDashboard();
                }}
              >
                Experience Pro Features
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-950 border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                  rJ
                </div>
                <span className="text-base font-bold text-white">rJobs</span>
              </div>
              <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                The career copilot for Indian engineering students and fresh graduates. LaTeX resumes, automated career radar, and assisted application workflows.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Product</h4>
              <ul className="mt-3 space-y-2 text-xs text-slate-400">
                <li><a href="#studio" className="hover:text-white">Resume Studio</a></li>
                <li><a href="#radar" className="hover:text-white">Job Radar</a></li>
                <li><a href="#assist" className="hover:text-white">Apply Assist (Beta)</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Engineering</h4>
              <ul className="mt-3 space-y-2 text-xs text-slate-400">
                <li>
                  <button type="button" onClick={onOpenDocs} className="hover:text-white cursor-pointer">
                    Architecture & ADRs
                  </button>
                </li>
                <li>
                  <button type="button" onClick={onOpenDocs} className="hover:text-white cursor-pointer">
                    API Reference
                  </button>
                </li>
                <li>
                  <button type="button" onClick={onOpenDocs} className="hover:text-white cursor-pointer">
                    Scraper Registry (34+ Co)
                  </button>
                </li>
                <li>
                  <button type="button" onClick={onOpenDocs} className="hover:text-white cursor-pointer">
                    Runbook & Operations
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Compliance & Legal</h4>
              <ul className="mt-3 space-y-2 text-xs text-slate-400">
                <li><span>DPDP Act 2023 Compliant</span></li>
                <li><span>No Data Selling Guarantee</span></li>
                <li><span>Terms of Service</span></li>
                <li><span>Security & Sandboxing</span></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
            <div>© 2026 rJobs Inc. All rights reserved. Built with precision for job seekers.</div>
            <div className="mt-2 sm:mt-0">Phase 0: Foundation Verified</div>
          </div>
        </div>
      </footer>
    </div>
  );
};
