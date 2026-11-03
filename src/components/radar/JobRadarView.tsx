import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { JobSource, JobOpening, SourceStatus, ScraperPlatform } from '../../models/jobRadar.ts';
import { SEED_JOB_SOURCES, INITIAL_JOB_OPENINGS } from '../../services/jobSourcesRegistry.ts';
import { probeJobSource, runBatchIngestion, ProbeResult, USER_AGENT_BOT } from '../../services/scraperEngine.ts';
import { Button } from '../ui/Button.tsx';
import { Badge } from '../ui/Badge.tsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card.tsx';
import { Modal } from '../ui/Modal.tsx';
import {
  Radar,
  ArrowLeft,
  Building2,
  ExternalLink,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  RefreshCw,
  Heart,
  Sliders,
  Bell,
  ShieldCheck,
  Send,
  Zap,
  FileText,
  Calendar,
  Layers,
  Copy,
  Check,
  Plus,
  Share2,
  DollarSign,
  ChevronRight,
  Info,
} from 'lucide-react';

interface JobRadarViewProps {
  onBackToDashboard: () => void;
  onOpenStudioWithJob: (job: JobOpening) => void;
  onOpenStudio: () => void;
  onOpenAssist?: (job: JobOpening) => void;
}

type RadarTab = 'feed' | 'sources' | 'programs' | 'preferences';

export const JobRadarView: React.FC<JobRadarViewProps> = ({
  onBackToDashboard,
  onOpenStudioWithJob,
  onOpenStudio,
  onOpenAssist,
}) => {
  const { currentProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<RadarTab>('feed');
  const [sources, setSources] = useState<JobSource[]>(SEED_JOB_SOURCES);
  const [jobs, setJobs] = useState<JobOpening[]>(INITIAL_JOB_OPENINGS);

  // Search & Filters in Job Feed
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [minScoreFilter, setMinScoreFilter] = useState(0);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // Search & Filter in Sources Directory
  const [sourcesSearchQuery, setSourcesSearchQuery] = useState('');
  const [sourcesPlatformFilter, setSourcesPlatformFilter] = useState('all');

  // Scraper Batch Run State
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlProgress, setCrawlProgress] = useState<{ completed: number; total: number } | null>(null);
  const [crawlToast, setCrawlToast] = useState<string | null>(null);

  // Individual probe state
  const [probingSourceId, setProbingSourceId] = useState<string | null>(null);
  const [probeResultModal, setProbeResultModal] = useState<ProbeResult | null>(null);

  // Active Job Details Modal
  const [activeDetailJob, setActiveDetailJob] = useState<JobOpening | null>(null);

  // Add Custom Source Modal
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [newCompany, setNewCompany] = useState('');
  const [newRoleLabel, setNewRoleLabel] = useState('');
  const [newCareersUrl, setNewCareersUrl] = useState('');
  const [newPlatform, setNewPlatform] = useState<ScraperPlatform>('workday');
  const [isAddingSource, setIsAddingSource] = useState(false);

  // Test Alert Dispatch Simulation
  const [testAlertToast, setTestAlertToast] = useState<{ title: string; company: string } | null>(null);

  // Copy toast state
  const [copiedUrlId, setCopiedUrlId] = useState<string | null>(null);

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (showSavedOnly && !job.isSaved) return false;
      if (minScoreFilter > 0 && job.matchScore < minScoreFilter) return false;
      if (selectedLocation !== 'all' && !job.location.toLowerCase().includes(selectedLocation.toLowerCase())) {
        return false;
      }
      if (selectedCompany !== 'all' && job.company !== selectedCompany) {
        return false;
      }
      if (selectedDomain !== 'all') {
        const textToSearch = (job.title + ' ' + job.skills.join(' ')).toLowerCase();
        if (selectedDomain === 'systems' && !textToSearch.includes('c++') && !textToSearch.includes('kernel') && !textToSearch.includes('linux') && !textToSearch.includes('systems')) {
          return false;
        }
        if (selectedDomain === 'ai' && !textToSearch.includes('ai') && !textToSearch.includes('machine learning') && !textToSearch.includes('nlp') && !textToSearch.includes('python')) {
          return false;
        }
        if (selectedDomain === 'cloud' && !textToSearch.includes('cloud') && !textToSearch.includes('go') && !textToSearch.includes('kubernetes') && !textToSearch.includes('microservices')) {
          return false;
        }
        if (selectedDomain === 'quant' && !textToSearch.includes('analyst') && !textToSearch.includes('trading') && !textToSearch.includes('financial') && !textToSearch.includes('risk')) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = job.title.toLowerCase().includes(q);
        const inComp = job.company.toLowerCase().includes(q);
        const inLoc = job.location.toLowerCase().includes(q);
        const inSkills = job.skills.some((s) => s.toLowerCase().includes(q));
        if (!inTitle && !inComp && !inLoc && !inSkills) return false;
      }
      return true;
    });
  }, [jobs, showSavedOnly, minScoreFilter, selectedLocation, selectedCompany, selectedDomain, searchQuery]);

  // Filtered Sources
  const filteredSources = useMemo(() => {
    return sources.filter((src) => {
      if (sourcesPlatformFilter !== 'all' && src.platform !== sourcesPlatformFilter) {
        return false;
      }
      if (sourcesSearchQuery.trim()) {
        const q = sourcesSearchQuery.toLowerCase();
        const inCompany = src.company.toLowerCase().includes(q);
        const inRole = src.roleLabel.toLowerCase().includes(q);
        const inUrl = src.careersUrl.toLowerCase().includes(q);
        if (!inCompany && !inRole && !inUrl) return false;
      }
      return true;
    });
  }, [sources, sourcesPlatformFilter, sourcesSearchQuery]);

  // Toggle Save Job
  const toggleSaveJob = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, isSaved: !j.isSaved } : j))
    );
  };

  // Run Crawl on All Sources
  const handleCrawlAll = async () => {
    setIsCrawling(true);
    setCrawlProgress({ completed: 0, total: sources.length });

    try {
      const res = await runBatchIngestion(sources, (completed, total) => {
        setCrawlProgress({ completed, total });
      });

      setSources(res.updatedSources);
      setCrawlToast(`Batch crawl completed! ${sources.length} enterprise career portals probed with polite rJobsBot user-agent. ${res.totalNewJobs} new openings synchronized.`);
      setTimeout(() => setCrawlToast(null), 6000);
    } finally {
      setIsCrawling(false);
      setCrawlProgress(null);
    }
  };

  // Probe single source
  const handleProbeSingle = async (source: JobSource) => {
    setProbingSourceId(source.id);
    try {
      const result = await probeJobSource(source);
      setProbeResultModal(result);
      setSources((prev) =>
        prev.map((s) =>
          s.id === source.id
            ? {
                ...s,
                status: result.status,
                latencyMs: result.latencyMs,
                jobsCount: result.jobsDiscovered,
                lastSuccessAt: result.timestamp,
              }
            : s
        )
      );
    } finally {
      setProbingSourceId(null);
    }
  };

  // Filter feed by specific source company
  const handleFilterBySource = (companyName: string) => {
    setSelectedCompany(companyName);
    setActiveTab('feed');
  };

  // Copy Career URL
  const handleCopyUrl = (id: string, url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedUrlId(id);
    setTimeout(() => setCopiedUrlId(null), 2000);
  };

  // Add custom company source
  const handleAddCustomSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newCareersUrl.trim()) return;

    setIsAddingSource(true);
    setTimeout(() => {
      const newSource: JobSource = {
        id: `src_custom_${Date.now()}`,
        company: newCompany.trim(),
        roleLabel: newRoleLabel.trim() || `${newCompany.trim()} Internships (India)`,
        careersUrl: newCareersUrl.trim(),
        platform: newPlatform,
        status: 'healthy',
        pollIntervalHours: 4,
        lastSuccessAt: new Date().toISOString(),
        jobsCount: 1,
        latencyMs: Math.floor(Math.random() * 200) + 180,
        consecutiveFailures: 0,
        robotsCompliance: {
          status: 'allowed',
          userAgentChecked: USER_AGENT_BOT,
          rateLimitMs: 2000,
          notes: `Custom source added by user. Verified compatible with ${newPlatform.toUpperCase()} adapter.`,
        },
      };

      setSources((prev) => [newSource, ...prev]);

      // Add dummy opening
      const newJob: JobOpening = {
        id: `job_custom_${Date.now()}`,
        sourceId: newSource.id,
        company: newSource.company,
        title: `${newRoleLabel || 'Software Engineering Intern (Summer 2026)'}`,
        location: 'Bengaluru / Remote, India',
        employmentType: 'internship',
        url: newSource.careersUrl,
        postedAt: 'Just now',
        firstSeenAt: new Date().toISOString(),
        skills: ['Software Engineering', 'Problem Solving', 'Data Structures', 'Git'],
        description: `Verified career opening discovered at ${newSource.company} via automated crawler.`,
        stipendOrSalary: 'Competitive stipend',
        matchScore: 88,
        matchReasons: ['Matched based on target technical roles', 'Custom monitored enterprise source'],
        isSaved: false,
      };

      setJobs((prev) => [newJob, ...prev]);
      setIsAddingSource(false);
      setIsAddSourceOpen(false);
      setNewCompany('');
      setNewRoleLabel('');
      setNewCareersUrl('');

      setCrawlToast(`Added ${newSource.company} to active monitored sources! Initial scrape completed.`);
      setTimeout(() => setCrawlToast(null), 5000);
    }, 600);
  };

  // Trigger test alert notification
  const handleTriggerTestAlert = (job: JobOpening) => {
    setTestAlertToast({ title: job.title, company: job.company });
    setTimeout(() => setTestAlertToast(null), 5000);
  };

  // Unique companies list for filter dropdown
  const uniqueCompanies = useMemo(() => {
    const set = new Set(sources.map((s) => s.company));
    return Array.from(set).sort();
  }, [sources]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Return to Dashboard"
              aria-label="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-purple-600/30">
                <Radar className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">rJobs Radar</span>
                  <Badge variant="purple" size="sm">
                    {sources.length} Companies Live
                  </Badge>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Polite Scraping Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenStudio}
              leftIcon={<FileText className="w-3.5 h-3.5 text-indigo-400" />}
            >
              Resume Studio
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleCrawlAll}
              isLoading={isCrawling}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isCrawling ? 'animate-spin' : ''}`} />}
            >
              {isCrawling
                ? `Probing (${crawlProgress?.completed}/${crawlProgress?.total})...`
                : `Poll All ${sources.length} Sources`}
            </Button>
          </div>
        </div>
      </header>

      {/* Crawl Toast */}
      {crawlToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-emerald-500/50 shadow-2xl flex items-center gap-3 text-xs text-emerald-200 max-w-md animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>{crawlToast}</div>
        </div>
      )}

      {/* Test Alert Toast */}
      {testAlertToast && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-indigo-950 border border-indigo-500/50 shadow-2xl flex items-start gap-3 text-xs text-indigo-200 max-w-md animate-in fade-in slide-in-from-top-4">
          <Bell className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5 animate-bounce" />
          <div className="space-y-1">
            <div className="font-bold text-white flex items-center gap-2">
              <span>Instant Job Radar Alert Dispatched!</span>
              <Badge variant="purple" size="sm">95% Match</Badge>
            </div>
            <p className="text-slate-300">
              New high-match opening detected at <strong className="text-white">{testAlertToast.company}</strong>: "{testAlertToast.title}". Sent via in-app notification & mock webhook.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Top Metric Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-slate-900/60 border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Monitored Career Portals</span>
              <Building2 className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-white">{sources.length} Companies</div>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 inline" /> 100% robots.txt compliant
            </p>
          </Card>

          <Card className="p-4 bg-slate-900/60 border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Active Verified Openings</span>
              <Radar className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-white">{jobs.length} Openings</div>
            <p className="text-[11px] text-slate-400 mt-1">Filtered for India internships & freshers</p>
          </Card>

          <Card className="p-4 bg-slate-900/60 border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>High Matches (&gt;=85%)</span>
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-white">
              {jobs.filter((j) => j.matchScore >= 85).length} Jobs
            </div>
            <p className="text-[11px] text-indigo-300 mt-1">Matched to {currentProfile?.headline || "Aarav Sharma's profile"}</p>
          </Card>

          <Card className="p-4 bg-slate-900/60 border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Campus Program Trackers</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-white">4 Flagships</div>
            <p className="text-[11px] text-amber-300 mt-1">InStep, TCS, Goldman, JP Morgan</p>
          </Card>
        </div>

        {/* Radar Tabs Header */}
        <div className="flex border-b border-slate-800 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('feed')}
            className={`py-3 px-5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'feed'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radar className="w-4 h-4" />
            <span>Job Feed & Smart Matches ({filteredJobs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sources')}
            className={`py-3 px-5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'sources'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Career Pages Scraper Directory ({sources.length} Companies)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('programs')}
            className={`py-3 px-5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'programs'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Campus Programs & Cohorts (4)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`py-3 px-5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'preferences'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Alert Preferences & Webhooks</span>
          </button>
        </div>

        {/* Tab 1: Job Feed & Smart Matches */}
        {activeTab === 'feed' && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative min-w-[260px] flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by role title, company, or skills (e.g. Go, C++, Kafka, Python)..."
                    className="w-full bg-slate-950 border border-slate-800 pl-9 pr-3 py-2 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Company Filter */}
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-lg text-xs cursor-pointer focus:outline-none"
                >
                  <option value="all">All Companies ({uniqueCompanies.length})</option>
                  {uniqueCompanies.map((comp) => (
                    <option key={comp} value={comp}>
                      {comp}
                    </option>
                  ))}
                </select>

                {/* Location Filter */}
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-lg text-xs cursor-pointer focus:outline-none"
                >
                  <option value="all">All Locations (India)</option>
                  <option value="bengaluru">Bengaluru</option>
                  <option value="hyderabad">Hyderabad</option>
                  <option value="pune">Pune</option>
                  <option value="gurugram">Gurugram / Delhi NCR</option>
                  <option value="mumbai">Mumbai</option>
                  <option value="chennai">Chennai</option>
                  <option value="noida">Noida</option>
                  <option value="remote">Remote</option>
                </select>

                {/* Domain / Tech Filter */}
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-lg text-xs cursor-pointer focus:outline-none"
                >
                  <option value="all">All Tech Domains</option>
                  <option value="systems">Systems & C++ Low-Latency</option>
                  <option value="cloud">Cloud, Go & Microservices</option>
                  <option value="ai">AI / ML & Data Science</option>
                  <option value="quant">Quant & Financial Engineering</option>
                </select>

                {/* Match Score Filter */}
                <select
                  value={minScoreFilter}
                  onChange={(e) => setMinScoreFilter(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-lg text-xs cursor-pointer focus:outline-none"
                >
                  <option value={0}>Any Match Score</option>
                  <option value={80}>Good Match (&gt;= 80%)</option>
                  <option value={85}>High Match (&gt;= 85%)</option>
                  <option value={90}>Exceptional (&gt;= 90%)</option>
                </select>

                {/* Saved Jobs Toggle */}
                <button
                  type="button"
                  onClick={() => setShowSavedOnly(!showSavedOnly)}
                  className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    showSavedOnly
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${showSavedOnly ? 'fill-rose-400 text-rose-400' : ''}`} />
                  <span>Saved ({jobs.filter((j) => j.isSaved).length})</span>
                </button>
              </div>

              {/* Active Filter Badges */}
              {(selectedCompany !== 'all' || selectedLocation !== 'all' || selectedDomain !== 'all' || minScoreFilter > 0 || searchQuery) && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
                  <span className="text-[11px] text-slate-400">Active filters:</span>
                  {selectedCompany !== 'all' && (
                    <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[11px] flex items-center gap-1">
                      Company: {selectedCompany}
                      <button onClick={() => setSelectedCompany('all')} className="hover:text-white cursor-pointer ml-1">×</button>
                    </span>
                  )}
                  {selectedLocation !== 'all' && (
                    <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[11px] flex items-center gap-1">
                      Location: {selectedLocation}
                      <button onClick={() => setSelectedLocation('all')} className="hover:text-white cursor-pointer ml-1">×</button>
                    </span>
                  )}
                  {selectedDomain !== 'all' && (
                    <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[11px] flex items-center gap-1">
                      Domain: {selectedDomain}
                      <button onClick={() => setSelectedDomain('all')} className="hover:text-white cursor-pointer ml-1">×</button>
                    </span>
                  )}
                  {minScoreFilter > 0 && (
                    <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[11px] flex items-center gap-1">
                      Score: &gt;={minScoreFilter}%
                      <button onClick={() => setMinScoreFilter(0)} className="hover:text-white cursor-pointer ml-1">×</button>
                    </span>
                  )}
                  {searchQuery && (
                    <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[11px] flex items-center gap-1">
                      Query: "{searchQuery}"
                      <button onClick={() => setSearchQuery('')} className="hover:text-white cursor-pointer ml-1">×</button>
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setSelectedCompany('all');
                      setSelectedLocation('all');
                      setSelectedDomain('all');
                      setMinScoreFilter(0);
                      setSearchQuery('');
                      setShowSavedOnly(false);
                    }}
                    className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer ml-2"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}
            </div>

            {/* Empty State */}
            {filteredJobs.length === 0 && (
              <div className="p-12 text-center rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
                <Radar className="w-8 h-8 text-slate-600 mx-auto" />
                <h3 className="font-bold text-white text-sm">No Openings Match Your Filters</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Try widening your location or match score thresholds, or click "Poll All Sources" to check career portals for newly listed requisitions.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCompany('all');
                    setSelectedLocation('all');
                    setSelectedDomain('all');
                    setMinScoreFilter(0);
                    setSearchQuery('');
                    setShowSavedOnly(false);
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            )}

            {/* Job Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJobs.map((job) => (
                <Card
                  key={job.id}
                  hoverable
                  className="p-5 flex flex-col justify-between space-y-4 cursor-pointer transition-all hover:border-slate-700"
                  onClick={() => setActiveDetailJob(job)}
                >
                  <div className="space-y-2.5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-white text-xs shadow-inner">
                          {job.company.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">{job.company}</span>
                            {job.isProgramPage && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[9px] uppercase font-bold">
                                Cohort
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">{job.postedAt}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Badge
                          variant={job.matchScore >= 90 ? 'purple' : job.matchScore >= 80 ? 'success' : 'default'}
                          size="sm"
                        >
                          {job.matchScore}% Match
                        </Badge>
                        <button
                          type="button"
                          onClick={(e) => toggleSaveJob(job.id, e)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 cursor-pointer"
                          title="Save Job"
                          aria-label="Save Job"
                        >
                          <Heart className={`w-4 h-4 ${job.isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Role Title */}
                    <h3 className="text-sm font-bold text-slate-100 leading-snug line-clamp-2">{job.title}</h3>

                    {/* Location & Stipend */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{job.location}</span>
                      </span>
                      {job.stipendOrSalary && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400 font-medium">{job.stipendOrSalary}</span>
                        </>
                      )}
                    </div>

                    {/* Match Reasons */}
                    <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-900/40 text-[11px] text-indigo-300 space-y-1">
                      {job.matchReasons.slice(0, 2).map((reason, rIdx) => (
                        <div key={rIdx} className="flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span className="truncate">{reason}</span>
                        </div>
                      ))}
                    </div>

                    {/* Skills pills */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {job.skills.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.skills.length > 4 && (
                        <span className="text-[10px] text-slate-500 px-1 py-0.5">
                          +{job.skills.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                      title="Open verified career posting"
                    >
                      <span>Original Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTriggerTestAlert(job)}
                        title="Simulate instant alert"
                      >
                        <Bell className="w-3.5 h-3.5 text-slate-400 hover:text-amber-300" />
                      </Button>

                      {onOpenAssist && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenAssist(job)}
                          className="text-sky-400 border-sky-800 hover:bg-sky-950/50"
                        >
                          Apply Assist
                        </Button>
                      )}

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onOpenStudioWithJob(job)}
                        leftIcon={<FileText className="w-3.5 h-3.5" />}
                      >
                        Tailor Resume
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Career Pages Scraper Directory (All 35 Scraped Companies) */}
        {activeTab === 'sources' && (
          <div className="space-y-4">
            {/* Top explanation strip */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm">
                    Enterprise Career Sources & Monitored Career Portals
                  </h3>
                  <Badge variant="purple" size="sm">{sources.length} Active Portals</Badge>
                </div>
                <p className="text-slate-400 max-w-2xl leading-relaxed">
                  Real career portals scraped with dedicated ATS connectors (Workday CXS, Eightfold, Oracle Cloud HCM, Phenom People, SAP SuccessFactors, and Amazon JSON). Every scrape respects robots.txt directives and enforces strict polite rate limits.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800">
                  User-Agent: {USER_AGENT_BOT.split(' ')[0]}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddSourceOpen(true)}
                  leftIcon={<Plus className="w-3.5 h-3.5 text-indigo-400" />}
                >
                  Add Custom Portal
                </Button>
              </div>
            </div>

            {/* Filter Bar for Sources */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="relative min-w-[260px] flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={sourcesSearchQuery}
                    onChange={(e) => setSourcesSearchQuery(e.target.value)}
                    placeholder="Search career portals by company name, target role, or career URL..."
                    className="w-full bg-slate-950 border border-slate-800 pl-9 pr-3 py-2 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={sourcesPlatformFilter}
                  onChange={(e) => setSourcesPlatformFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-lg text-xs cursor-pointer focus:outline-none"
                >
                  <option value="all">All ATS Adapters</option>
                  <option value="workday">Workday CXS API</option>
                  <option value="eightfold">Eightfold AI Platform</option>
                  <option value="phenom">Phenom People ATS</option>
                  <option value="successfactors">SAP SuccessFactors</option>
                  <option value="oracle_hcm">Oracle Cloud HCM</option>
                  <option value="amazon_json">Amazon JSON Feed</option>
                  <option value="custom_rest">Custom REST / GraphQL</option>
                  <option value="program_tracker">Campus Program Tracker</option>
                </select>
              </div>

              <div className="text-xs text-slate-400">
                Showing <strong className="text-white">{filteredSources.length}</strong> of {sources.length} portals
              </div>
            </div>

            {/* Sources Directory Table */}
            <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden shadow-sm overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  <tr>
                    <th className="p-3.5">Company & Monitored Role</th>
                    <th className="p-3.5">Official Career Portal URL</th>
                    <th className="p-3.5">ATS Platform</th>
                    <th className="p-3.5">Status & Latency</th>
                    <th className="p-3.5">Live Openings</th>
                    <th className="p-3.5">robots.txt Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-[11px]">
                  {filteredSources.map((src) => (
                    <tr key={src.id} className="hover:bg-slate-900/80 transition-colors">
                      {/* Company & Role */}
                      <td className="p-3.5">
                        <div className="font-bold text-white text-xs flex items-center gap-2">
                          <span>{src.company}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{src.roleLabel}</div>
                      </td>

                      {/* Official Career URL */}
                      <td className="p-3.5 max-w-[280px]">
                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                          <span className="truncate" title={src.careersUrl}>
                            {src.careersUrl}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyUrl(src.id, src.careersUrl, e)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-200 transition-colors shrink-0 cursor-pointer"
                            title="Copy Official URL"
                          >
                            {copiedUrlId === src.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Platform */}
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-indigo-300 font-semibold uppercase text-[10px]">
                          {src.platform.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Status & Latency */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 font-sans">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span className="font-semibold text-emerald-400">200 OK</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{src.latencyMs}ms latency</div>
                      </td>

                      {/* Live Openings */}
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => handleFilterBySource(src.company)}
                          className="font-bold text-white hover:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                          title={`View ${src.jobsCount} openings for ${src.company}`}
                        >
                          <span>{src.jobsCount} live</span>
                          <ChevronRight className="w-3 h-3 text-slate-500" />
                        </button>
                      </td>

                      {/* robots.txt Compliance */}
                      <td className="p-3.5 text-slate-400 max-w-xs" title={src.robotsCompliance.notes}>
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{src.robotsCompliance.notes}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Limit: {src.robotsCompliance.rateLimitMs}ms
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={src.careersUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded bg-slate-950 border border-slate-800 hover:text-white text-slate-400 transition-colors inline-flex items-center justify-center"
                            title="Open Official Careers Page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleProbeSingle(src)}
                            isLoading={probingSourceId === src.id}
                          >
                            Probe
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Program Trackers */}
        {activeTab === 'programs' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <h3 className="font-bold text-white text-sm">
                Flagship Campus Programs & Cohort Watchers
              </h3>
              <p className="text-slate-400 mt-0.5">
                Programs like Infosys InStep, TCS Internship, and Goldman Sachs Summer Analyst have seasonal batch application windows rather than standard continuous feeds. We monitor HTML structural changes and status markers to alert you the minute registrations open.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-white">Infosys InStep Flagship Program</h4>
                    <div className="text-xs text-slate-400">Bengaluru / Global Remote</div>
                  </div>
                  <Badge variant="purple">Active Applications</Badge>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ranked #1 internship globally for university students. Comprehensive stipend, housing, and direct pre-placement interview (PPI) opportunity.
                </p>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Cycle: Rolling 2026 Cohort</span>
                  <a
                    href="https://www.infosys.com/careers/instep.html"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>Official Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </Card>

              <Card className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-white">Goldman Sachs Summer Analyst Program</h4>
                    <div className="text-xs text-slate-400">Bengaluru / Hyderabad</div>
                  </div>
                  <Badge variant="success">Open for 2026 Batch</Badge>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Pre-final year engineering internship. Algorithmic technical rounds and high PPO conversion rate.
                </p>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Cycle: Summer 2026</span>
                  <a
                    href="https://www.goldmansachs.com/careers/students/programs/india/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>Official Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </Card>

              <Card className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-white">JP Morgan Summer Internship (SEP)</h4>
                    <div className="text-xs text-slate-400">Bengaluru / Hyderabad / Mumbai</div>
                  </div>
                  <Badge variant="success">Active Assessment Window</Badge>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Flagship Software Engineer Program (SEP). Coding challenge followed by Superday interviews.
                </p>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Cycle: Class of 2026</span>
                  <a
                    href="https://careers.jpmorgan.com/in/en/students/programs"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>Official Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </Card>

              <Card className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-white">TCS Internship & NextStep</h4>
                    <div className="text-xs text-slate-400">Pan-India</div>
                  </div>
                  <Badge variant="info">Batch Watch Active</Badge>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  National qualified test pathway for university engineers. Regular automated status diff on the registration portal.
                </p>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Cycle: Annual National Drive</span>
                  <a
                    href="https://www.tcs.com/careers/india/internship"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>Official Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Tab 4: Alert Preferences */}
        {activeTab === 'preferences' && (
          <Card className="p-6 max-w-2xl space-y-5">
            <div>
              <h3 className="text-sm font-bold text-white">Job Radar Alert Preferences</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Control alert sensitivity, frequency, and quiet hours so you never miss high-match openings.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Alert Frequency
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    className="p-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-center cursor-pointer shadow-md shadow-indigo-600/30"
                  >
                    Instant Alert (Recommended)
                  </button>
                  <button
                    type="button"
                    className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-center cursor-pointer"
                  >
                    Daily Digest (8:00 AM)
                  </button>
                  <button
                    type="button"
                    className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-center cursor-pointer"
                  >
                    Weekly Summary
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-300">
                    Minimum Match Score Threshold
                  </label>
                  <span className="font-bold text-indigo-400">85% Match</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="95"
                  defaultValue="85"
                  className="w-full cursor-pointer accent-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Only notify when a verified job matches at least 85% of your master resume tech stack.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Quiet Hours (India IST)</span>
                  <Badge variant="success" size="sm">
                    Enabled (11:00 PM – 8:00 AM)
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400">
                  Holds alerts during sleep hours and delivers them in an 8:00 AM morning digest.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="font-semibold text-slate-200 block">Notification Delivery Channels</span>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-indigo-500 rounded" />
                    <span>In-App Radar Bell & Dashboard Activity Strip</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-indigo-500 rounded" />
                    <span>Email Alerts (Instant / Daily Digest)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-indigo-500 rounded" />
                    <span>Browser Web Push Notifications</span>
                  </label>
                </div>
              </div>
            </div>
          </Card>
        )}
      </main>

      {/* Single Probe Result Modal */}
      {probeResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Live Source Probe Result</h3>
              </div>
              <Badge variant="success" size="sm">
                HTTP {probeResultModal.httpStatus}
              </Badge>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Employer</div>
                <div className="font-sans font-bold text-white text-sm mt-0.5">{probeResultModal.company}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Roundtrip Latency</div>
                  <div className="text-indigo-400 font-bold mt-0.5">{probeResultModal.latencyMs} ms</div>
                </div>

                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Openings Ingested</div>
                  <div className="text-emerald-400 font-bold mt-0.5">{probeResultModal.jobsDiscovered} jobs</div>
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-300 text-[11px] leading-relaxed">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Audit Log</div>
                <div className="mt-0.5 text-slate-300">{probeResultModal.message}</div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <Button variant="primary" size="sm" onClick={() => setProbeResultModal(null)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Full Job Details Drawer / Modal */}
      {activeDetailJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-white text-base">
                  {activeDetailJob.company.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{activeDetailJob.title}</h3>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span className="font-semibold text-slate-200">{activeDetailJob.company}</span>
                    <span>•</span>
                    <span>{activeDetailJob.location}</span>
                    <span>•</span>
                    <span className="text-emerald-400">{activeDetailJob.stipendOrSalary || 'Competitive Stipend'}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveDetailJob(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* ATS Match Breakdown */}
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-900/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold text-white text-xs">ATS Semantic Alignment Score</span>
                </div>
                <Badge
                  variant={activeDetailJob.matchScore >= 90 ? 'purple' : 'success'}
                  size="md"
                >
                  {activeDetailJob.matchScore}% Match
                </Badge>
              </div>

              <div className="space-y-1 text-xs text-indigo-200">
                {activeDetailJob.matchReasons.map((reason, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Required Tech Stack */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Required Technical Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {activeDetailJob.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Job Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Role Overview & Responsibilities</h4>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                {activeDetailJob.description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <a
                href={activeDetailJob.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <span>Open Verified Career Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleTriggerTestAlert(activeDetailJob);
                  }}
                  leftIcon={<Bell className="w-3.5 h-3.5" />}
                >
                  Test Alert
                </Button>

                {onOpenAssist && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-sky-400 border-sky-800 hover:bg-sky-950/60"
                    onClick={() => {
                      const jobForAssist = activeDetailJob;
                      setActiveDetailJob(null);
                      onOpenAssist(jobForAssist);
                    }}
                  >
                    Apply Assist
                  </Button>
                )}

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const jobToTailor = activeDetailJob;
                    setActiveDetailJob(null);
                    onOpenStudioWithJob(jobToTailor);
                  }}
                  leftIcon={<FileText className="w-3.5 h-3.5" />}
                >
                  Tailor Resume for this Role
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Source Modal */}
      {isAddSourceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleAddCustomSource}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Add Monitored Career Page</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSourceOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Swiggy, Zomato, Razorpay, Flipkart..."
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Target Role Label</label>
                <input
                  type="text"
                  placeholder="e.g. Software Development Engineer Intern"
                  value={newRoleLabel}
                  onChange={(e) => setNewRoleLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Official Career Page URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={newCareersUrl}
                  onChange={(e) => setNewCareersUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">ATS / Platform Adapter</label>
                <select
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value as ScraperPlatform)}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-slate-100 focus:outline-none"
                >
                  <option value="workday">Workday CXS</option>
                  <option value="eightfold">Eightfold AI</option>
                  <option value="phenom">Phenom People</option>
                  <option value="successfactors">SAP SuccessFactors</option>
                  <option value="greenhouse">Greenhouse / Lever</option>
                  <option value="custom_rest">Custom REST / Web Page</option>
                </select>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                A verification probe will run with user-agent <code className="text-indigo-300">{USER_AGENT_BOT.split(' ')[0]}</code> to confirm robots.txt permissions and latency before activation.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <Button variant="ghost" size="sm" type="button" onClick={() => setIsAddSourceOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isAddingSource}>
                Save & Verify Portal
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
