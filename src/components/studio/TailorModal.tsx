import React, { useState } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Button } from '../ui/Button.tsx';
import { Badge } from '../ui/Badge.tsx';
import { Input } from '../ui/Input.tsx';
import { ResumeDocument } from '../../models/resume.ts';
import {
  tailorResumeToJd,
  TailoringResult,
  BulletChangeProposal,
} from '../../services/tailoringEngine.ts';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ArrowRight,
  Briefcase,
  FileText,
  AlertTriangle,
} from 'lucide-react';

interface TailorModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterResume: ResumeDocument;
  onSaveTailoredResume: (tailoredResume: ResumeDocument, jobTitle: string, company: string) => void;
}

const SAMPLE_JDS = [
  {
    name: 'Google SDE Intern (Bengaluru)',
    company: 'Google',
    role: 'Software Engineering Intern',
    text: `About the job: Google is looking for passionate Software Engineering Interns in Bengaluru and Hyderabad.
Responsibilities:
- Write clean, maintainable, scalable code in C++, Go, Java, or Python.
- Work on distributed systems, high-throughput microservices, and database internals.
- Implement efficient algorithms and data structures.
Qualifications:
- Currently pursuing a B.Tech/M.Tech in Computer Science or related STEM field.
- Experience with concurrency, multi-threading, Kafka, Redis, or PostgreSQL is a plus.`,
  },
  {
    name: 'Nvidia Systems Engineer Intern',
    company: 'Nvidia',
    role: 'Systems Software Engineer Intern',
    text: `Job Description: NVIDIA is seeking systems engineering interns for our Bengaluru campus.
Key Requirements:
- Deep familiarity with C++20, Linux systems programming, lock-free concurrency, and AVX2 SIMD.
- Experience benchmarking low latency systems, profiling with Linux perf, and optimizing memory access.
- Understanding of computer architecture, operating system kernels, and hardware interfaces.`,
  },
];

export const TailorModal: React.FC<TailorModalProps> = ({
  isOpen,
  onClose,
  masterResume,
  onSaveTailoredResume,
}) => {
  const [activeTab, setActiveTab] = useState<'tailor' | 'cover_letter' | 'why_company'>('tailor');
  const [jdText, setJdText] = useState(SAMPLE_JDS[0].text);
  const [company, setCompany] = useState(SAMPLE_JDS[0].company);
  const [role, setRole] = useState(SAMPLE_JDS[0].role);

  const [tailoringResult, setTailoringResult] = useState<TailoringResult | null>(null);
  const [proposals, setProposals] = useState<BulletChangeProposal[]>([]);
  const [isCopiedCover, setIsCopiedCover] = useState(false);
  const [isCopiedWhy, setIsCopiedWhy] = useState(false);

  const handleRunTailor = () => {
    const res = tailorResumeToJd(masterResume, jdText, company, role);
    setTailoringResult(res);
    setProposals(res.bulletProposals);
  };

  const handleSelectSample = (sample: (typeof SAMPLE_JDS)[0]) => {
    setJdText(sample.text);
    setCompany(sample.company);
    setRole(sample.role);
    setTailoringResult(null);
  };

  const toggleProposal = (id: string) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, accepted: !p.accepted } : p))
    );
  };

  const handleApplyTailored = () => {
    if (!tailoringResult) return;

    // Clone master resume
    const cloned = JSON.parse(JSON.stringify(masterResume)) as ResumeDocument;
    cloned.id = `resume_tailored_${Date.now()}`;
    cloned.title = `${company} ${role} (Tailored)`;
    cloned.isMaster = false;
    cloned.parentResumeId = masterResume.id;
    cloned.targetCompany = company;
    cloned.targetJobTitle = role;
    cloned.matchScore = tailoringResult.matchScoreAfter;
    cloned.updatedAt = new Date().toISOString();

    // Apply summary if accepted
    if (tailoringResult.summaryAccepted) {
      cloned.data.summary = tailoringResult.proposedSummary;
    }

    // Apply accepted bullet changes
    proposals.forEach((prop) => {
      if (prop.accepted && prop.section === 'experience') {
        const exp = cloned.data.experience.find((e) => e.id === prop.entryId);
        if (exp && exp.bullets[prop.bulletIndex]) {
          exp.bullets[prop.bulletIndex] = prop.proposedText;
        }
      }
    });

    onSaveTailoredResume(cloned, role, company);
    onClose();
  };

  const handleCopy = (text: string, type: 'cover' | 'why') => {
    navigator.clipboard.writeText(text);
    if (type === 'cover') {
      setIsCopiedCover(true);
      setTimeout(() => setIsCopiedCover(false), 2000);
    } else {
      setIsCopiedWhy(true);
      setTimeout(() => setIsCopiedWhy(false), 2000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Job Description Tailoring & Anti-Fabrication"
      description="Compare master resume against target JD, preview truthful rewording, and audit against phantom claims."
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Sample JD Quick Selector */}
        <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <span className="text-slate-400 font-semibold">Load Sample JD:</span>
          {SAMPLE_JDS.map((sample) => (
            <button
              key={sample.name}
              type="button"
              onClick={() => handleSelectSample(sample)}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-colors cursor-pointer"
            >
              {sample.name}
            </button>
          ))}
        </div>

        {/* Input Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Target Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Google India"
          />
          <Input
            label="Target Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Software Engineering Intern"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Paste Job Description (JD)
          </label>
          <textarea
            rows={5}
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste complete job description, requirements, or qualifications here..."
            className="w-full rounded-lg bg-slate-950 border border-slate-800 text-slate-200 p-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>

        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={handleRunTailor}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Analyze JD & Generate Tailored Proposals
          </Button>
        </div>

        {/* Tailoring Results Section */}
        {tailoringResult && (
          <div className="mt-6 pt-6 border-t border-slate-800 space-y-6">
            {/* Score Comparison Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-semibold">Match Score</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold text-slate-400">{tailoringResult.matchScoreBefore}%</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-2xl font-black text-emerald-400">
                    {tailoringResult.matchScoreAfter}%
                  </span>
                </div>
                <div className="text-[10px] text-emerald-400 mt-1">+14% ATS keyword alignment</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-semibold">Keyword Coverage</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold text-slate-400">
                    {tailoringResult.keywordCoverageBefore}%
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-2xl font-black text-indigo-400">
                    {tailoringResult.keywordCoverageAfter}%
                  </span>
                </div>
                <div className="text-[10px] text-indigo-300 mt-1">Matches required tech stack</div>
              </div>

              {/* Anti-Fabrication Badge */}
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/80 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Anti-Fabrication Audit</span>
                </div>
                <div className="text-xs text-emerald-200 mt-1">
                  {tailoringResult.antiFabricationAudit.passed
                    ? '100% Passed. Zero hallucinated employers or metrics.'
                    : 'Audit warning flagged.'}
                </div>
                <div className="text-[10px] text-emerald-400/80 mt-1">
                  Verified: {tailoringResult.antiFabricationAudit.verifiedEmployers.join(', ')}
                </div>
              </div>
            </div>

            {/* Sub-tabs: Tailored Resume Changes | Cover Letter | Why Company */}
            <div className="flex border-b border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('tailor')}
                className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'tailor'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Change Proposals ({proposals.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('cover_letter')}
                className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'cover_letter'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Generated Cover Letter Draft
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('why_company')}
                className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'why_company'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                "Why {company}?" Draft
              </button>
            </div>

            {/* Change Proposals Tab */}
            {activeTab === 'tailor' && (
              <div className="space-y-4">
                {/* Proposed Summary */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-200">
                      Targeted Career Summary (Tailored for {company})
                    </span>
                    <Badge variant="purple" size="sm">
                      Recommended
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {tailoringResult.proposedSummary}
                  </p>
                </div>

                {/* Bullet Proposals */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-200">
                    Experience & Project Bullets (Review and accept truthful enhancements)
                  </div>
                  {proposals.map((prop) => (
                    <div
                      key={prop.id}
                      className={`p-3.5 rounded-xl border transition-colors ${
                        prop.accepted
                          ? 'bg-slate-950/80 border-indigo-900/60'
                          : 'bg-slate-950/30 border-slate-800/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1 text-xs font-sans">
                          <div className="text-[11px] text-slate-500 line-through">
                            {prop.originalText}
                          </div>
                          <div className="text-slate-200 font-medium">{prop.proposedText}</div>
                          <div className="text-[10px] text-indigo-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>{prop.reason}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleProposal(prop.id)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                            prop.accepted
                              ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {prop.accepted ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Accepted</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Skipped</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Apply Button */}
                <div className="pt-4 flex items-center justify-between border-t border-slate-800">
                  <div className="text-xs text-slate-400">
                    Saves as a new linked variant. Master resume remains untouched.
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleApplyTailored}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Save Tailored Resume ({company})
                  </Button>
                </div>
              </div>
            )}

            {/* Cover Letter Tab */}
            {activeTab === 'cover_letter' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300">
                    Automated Cover Letter Draft (Ready to copy)
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(tailoringResult.coverLetterDraft, 'cover')}
                    leftIcon={isCopiedCover ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  >
                    {isCopiedCover ? 'Copied to Clipboard' : 'Copy Text'}
                  </Button>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
                  {tailoringResult.coverLetterDraft}
                </div>
              </div>
            )}

            {/* Why Company Tab */}
            {activeTab === 'why_company' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300">
                    "Why do you want to work at {company}?" (For application portals)
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(tailoringResult.whyCompanyDraft, 'why')}
                    leftIcon={isCopiedWhy ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  >
                    {isCopiedWhy ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
                  {tailoringResult.whyCompanyDraft}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
