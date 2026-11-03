import React, { useState, useMemo } from 'react';
import { ResumeDocument, ResumeData, ExperienceEntry, ProjectEntry, EducationEntry, SkillCategory, AchievementEntry } from '../../models/resume.ts';
import { TEMPLATES, TemplateMeta, generateLatexSource } from '../../services/latexTemplates.ts';
import { generateResumePdfBlob, calculatePageFit, downloadFile } from '../../services/pdfGenerator.ts';
import { improveBulletPoint, AssistMode } from '../../services/aiAssist.ts';
import { TailorModal } from './TailorModal.tsx';
import { ImportModal } from './ImportModal.tsx';
import { VersionHistoryModal } from './VersionHistoryModal.tsx';
import { ResumeAiChatbot } from './ResumeAiChatbot.tsx';
import { parseLatexToResumeData } from '../../services/latexParser.ts';
import { validateLatexSyntax } from '../../services/latexAiEngine.ts';
import { Button } from '../ui/Button.tsx';
import { Badge } from '../ui/Badge.tsx';
import { Input } from '../ui/Input.tsx';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.tsx';
import {
  FileText,
  Download,
  Copy,
  Check,
  Sparkles,
  ArrowLeft,
  Plus,
  Trash2,
  ChevronDown,
  Layers,
  Code2,
  Eye,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FolderOpen,
  Send,
  MoveUp,
  MoveDown,
} from 'lucide-react';

interface ResumeStudioProps {
  onBackToDashboard: () => void;
  initialResume: ResumeDocument;
}

type BuilderTab = 'basics' | 'summary' | 'education' | 'experience' | 'projects' | 'skills' | 'achievements' | 'order';

export const ResumeStudio: React.FC<ResumeStudioProps> = ({
  onBackToDashboard,
  initialResume,
}) => {
  // Resume versions in state
  const [resumes, setResumes] = useState<ResumeDocument[]>([
    initialResume,
    {
      ...initialResume,
      id: 'resume_google_tailored_01',
      title: 'Google SDE Intern (Tailored)',
      isMaster: false,
      parentResumeId: initialResume.id,
      targetCompany: 'Google',
      targetJobTitle: 'Software Engineering Intern',
      matchScore: 96,
      updatedAt: '2026-10-16T12:00:00.000Z',
    },
  ]);
  const [currentResumeId, setCurrentResumeId] = useState(initialResume.id);

  // Active resume being edited
  const currentResume = resumes.find((r) => r.id === currentResumeId) || resumes[0];

  // Builder tab
  const [activeTab, setActiveTab] = useState<BuilderTab>('experience');

  // Preview view mode ('document' | 'latex')
  const [previewMode, setPreviewMode] = useState<'document' | 'latex'>('document');

  // Modals state
  const [isTailorOpen, setIsTailorOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Manual LaTeX editing buffer & sync toast
  const [latexEditBuffer, setLatexEditBuffer] = useState<string | null>(null);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Copy toast
  const [copiedTex, setCopiedTex] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // AI Assist diff modal state
  const [aiDiff, setAiDiff] = useState<{
    original: string;
    improved: string;
    explanation: string;
    applyCallback: (improved: string) => void;
  } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Mutate current resume data
  const updateResumeData = (updater: (prev: ResumeData) => ResumeData) => {
    setResumes((prev) =>
      prev.map((r) => {
        if (r.id === currentResume.id) {
          const updatedData = updater(r.data);
          return {
            ...r,
            data: updatedData,
            customLatex: undefined, // regenerate LaTeX from structured form if form is edited
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );
    setLatexEditBuffer(null);
  };

  const updateTemplate = (templateId: TemplateMeta['id']) => {
    setResumes((prev) =>
      prev.map((r) => (r.id === currentResume.id ? { ...r, templateId, customLatex: undefined } : r))
    );
    setLatexEditBuffer(null);
  };

  const updateTitle = (title: string) => {
    setResumes((prev) =>
      prev.map((r) => (r.id === currentResume.id ? { ...r, title } : r))
    );
  };

  // Base generated LaTeX code from structured data
  const defaultLatexSource = useMemo(() => {
    return generateLatexSource(currentResume.data, currentResume.templateId);
  }, [currentResume.data, currentResume.templateId]);

  // Active LaTeX: either custom edited LaTeX or default template
  const activeLatex = currentResume.customLatex || defaultLatexSource;
  const currentBufferValue = latexEditBuffer !== null ? latexEditBuffer : activeLatex;

  // Handle AI LaTeX Chatbot updates
  const handleApplyLatexFromAi = (updatedLatex: string, parsedData: ResumeData) => {
    setResumes((prev) =>
      prev.map((r) => {
        if (r.id === currentResume.id) {
          const oldName = r.data.basics.name;
          const newName = parsedData.basics.name;
          let newTitle = r.title;
          if (newName && newName !== oldName && (r.isMaster || r.title.includes(oldName))) {
            newTitle = r.isMaster ? `${newName} - Master Resume` : r.title.replace(oldName, newName);
          }
          return {
            ...r,
            title: newTitle,
            customLatex: updatedLatex,
            data: JSON.parse(JSON.stringify(parsedData)),
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );
    setLatexEditBuffer(updatedLatex);
    setSyncToast('Applied AI modifications to LaTeX & ATS Preview!');
    setTimeout(() => setSyncToast(null), 3500);
  };

  // Handle manual edits in the LaTeX code textarea
  const handleSyncManualLatex = () => {
    if (!latexEditBuffer) return;
    const parsedData = parseLatexToResumeData(latexEditBuffer, currentResume.data);
    setResumes((prev) =>
      prev.map((r) => {
        if (r.id === currentResume.id) {
          return {
            ...r,
            customLatex: latexEditBuffer,
            data: parsedData,
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );
    setSyncToast('Saved manual edits and synced ATS Preview!');
    setTimeout(() => setSyncToast(null), 3000);
  };

  // Reset custom LaTeX back to template-generated version
  const handleResetLatexToTemplate = () => {
    setResumes((prev) =>
      prev.map((r) => (r.id === currentResume.id ? { ...r, customLatex: undefined } : r))
    );
    setLatexEditBuffer(null);
    setSyncToast('Reset LaTeX code to standard template generator.');
    setTimeout(() => setSyncToast(null), 3000);
  };

  // Page Fit Estimate
  const pageFit = useMemo(() => {
    return calculatePageFit(currentResume.data);
  }, [currentResume.data]);

  // Handle PDF Download
  const handleDownloadPdf = () => {
    setDownloadingPdf(true);
    try {
      const blob = generateResumePdfBlob(currentResume.data, currentResume.templateId);
      const filename = `${currentResume.title.replace(/\s+/g, '_')}.pdf`;
      downloadFile(blob, filename);
    } finally {
      setTimeout(() => setDownloadingPdf(false), 500);
    }
  };

  // Handle .tex download
  const handleDownloadTex = () => {
    const blob = new Blob([activeLatex], { type: 'application/x-tex;charset=utf-8' });
    const filename = `${currentResume.title.replace(/\s+/g, '_')}.tex`;
    downloadFile(blob, filename);
  };

  // Copy LaTeX code
  const handleCopyLatex = () => {
    navigator.clipboard.writeText(activeLatex);
    setCopiedTex(true);
    setTimeout(() => setCopiedTex(false), 2000);
  };

  // AI Assist trigger
  const handleTriggerAiAssist = async (
    bullet: string,
    mode: AssistMode,
    applyCallback: (improved: string) => void
  ) => {
    setIsAiLoading(true);
    try {
      const res = await improveBulletPoint(bullet, mode, currentResume.targetJobTitle);
      setAiDiff({
        original: bullet,
        improved: res.improved,
        explanation: res.explanation,
        applyCallback,
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // Save new tailored resume from TailorModal
  const handleSaveTailored = (tailored: ResumeDocument) => {
    setResumes((prev) => [tailored, ...prev]);
    setCurrentResumeId(tailored.id);
  };

  // Import parsed resume
  const handleImportResume = (importedData: ResumeData, title: string) => {
    const newDoc: ResumeDocument = {
      id: `resume_imported_${Date.now()}`,
      userId: currentResume.userId,
      title,
      templateId: 'classic-single',
      data: importedData,
      isMaster: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setResumes((prev) => [newDoc, ...prev]);
    setCurrentResumeId(newDoc.id);
  };

  // Duplicate resume
  const handleDuplicate = (target: ResumeDocument) => {
    const dup: ResumeDocument = {
      ...JSON.parse(JSON.stringify(target)),
      id: `resume_${Date.now()}`,
      title: `${target.title} (Copy)`,
      isMaster: false,
      updatedAt: new Date().toISOString(),
    };
    setResumes((prev) => [...prev, dup]);
    setCurrentResumeId(dup.id);
  };

  // Delete resume
  const handleDelete = (id: string) => {
    setResumes((prev) => prev.filter((r) => r.id !== id));
    if (currentResumeId === id) {
      setCurrentResumeId(resumes[0].id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Studio Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Back & Title */}
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
              <input
                type="text"
                value={currentResume.title}
                onChange={(e) => updateTitle(e.target.value)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-sm font-bold text-white focus:outline-none transition-colors w-48 sm:w-64"
                title="Edit Resume Title"
              />
              {currentResume.isMaster && (
                <Badge variant="purple" size="sm">
                  Master
                </Badge>
              )}
            </div>
          </div>

          {/* Center: Template & Page Fit indicator */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Template Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-400 font-medium">Template:</span>
              <select
                value={currentResume.templateId}
                onChange={(e) => updateTemplate(e.target.value as TemplateMeta['id'])}
                className="bg-transparent text-slate-100 font-semibold focus:outline-none cursor-pointer"
              >
                {TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-slate-100">
                    {t.name} (ATS {t.atsScoreEstimate})
                  </option>
                ))}
              </select>
            </div>

            {/* Page Count Fit Pill */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
                pageFit.isOverOnePage
                  ? 'bg-amber-950/60 border-amber-800/80 text-amber-300'
                  : 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
              }`}
              title={pageFit.recommendations.join('\n')}
            >
              {pageFit.isOverOnePage ? (
                <AlertTriangle className="w-3.5 h-3.5" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>{pageFit.estimatedPages} Page (ATS Optimal)</span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsChatbotOpen(!isChatbotOpen)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-600/25 flex items-center gap-1.5 cursor-pointer transition-all border border-indigo-400/30"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>AI LaTeX Co-Pilot</span>
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTailorOpen(true)}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
            >
              Tailor for JD
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsVersionsOpen(true)}
              leftIcon={<Layers className="w-3.5 h-3.5" />}
            >
              Versions ({resumes.length})
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLatex}
              leftIcon={copiedTex ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copiedTex ? 'Copied .tex' : 'Copy LaTeX'}
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadPdf}
              isLoading={downloadingPdf}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export PDF
            </Button>
          </div>
        </div>
      </header>

      {/* Main Studio Split Layout */}
      <div className="flex-1 max-w-[1700px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Pane: Guided Builder Wizard (Cols 5) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Builder Step Tabs */}
          <div className="flex flex-wrap gap-1 p-1 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
            {(
              [
                { id: 'basics', label: 'Basics' },
                { id: 'summary', label: 'Summary' },
                { id: 'education', label: 'Education' },
                { id: 'experience', label: 'Experience' },
                { id: 'projects', label: 'Projects' },
                { id: 'skills', label: 'Skills' },
                { id: 'achievements', label: 'Honors' },
                { id: 'order', label: 'Reorder' },
              ] as { id: BuilderTab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Builder Form Content Card */}
          <Card className="flex-1 overflow-y-auto max-h-[calc(100vh-160px)] p-5">
            {/* 1. Basics Tab */}
            {activeTab === 'basics' && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Contact Information & Header
                </div>
                <Input
                  label="Candidate Full Name"
                  value={currentResume.data.basics.name}
                  onChange={(e) =>
                    updateResumeData((d) => ({
                      ...d,
                      basics: { ...d.basics, name: e.target.value },
                    }))
                  }
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Email Address"
                    value={currentResume.data.basics.email}
                    onChange={(e) =>
                      updateResumeData((d) => ({
                        ...d,
                        basics: { ...d.basics, email: e.target.value },
                      }))
                    }
                    required
                  />
                  <Input
                    label="Phone (+91 format)"
                    value={currentResume.data.basics.phone}
                    onChange={(e) =>
                      updateResumeData((d) => ({
                        ...d,
                        basics: { ...d.basics, phone: e.target.value },
                      }))
                    }
                    required
                  />
                </div>
                <Input
                  label="Location"
                  value={currentResume.data.basics.location}
                  onChange={(e) =>
                    updateResumeData((d) => ({
                      ...d,
                      basics: { ...d.basics, location: e.target.value },
                    }))
                  }
                  placeholder="e.g. New Delhi / Bengaluru, India"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="GitHub URL"
                    value={currentResume.data.basics.github || ''}
                    onChange={(e) =>
                      updateResumeData((d) => ({
                        ...d,
                        basics: { ...d.basics, github: e.target.value },
                      }))
                    }
                  />
                  <Input
                    label="LinkedIn URL"
                    value={currentResume.data.basics.linkedin || ''}
                    onChange={(e) =>
                      updateResumeData((d) => ({
                        ...d,
                        basics: { ...d.basics, linkedin: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="LeetCode Profile"
                    value={currentResume.data.basics.leetcode || ''}
                    onChange={(e) =>
                      updateResumeData((d) => ({
                        ...d,
                        basics: { ...d.basics, leetcode: e.target.value },
                      }))
                    }
                  />
                  <Input
                    label="Portfolio Website"
                    value={currentResume.data.basics.website || ''}
                    onChange={(e) =>
                      updateResumeData((d) => ({
                        ...d,
                        basics: { ...d.basics, website: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            )}

            {/* 2. Summary Tab */}
            {activeTab === 'summary' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Professional Summary Statement
                  </span>
                  <Badge variant="default" size="sm">
                    {currentResume.data.summary.length} chars
                  </Badge>
                </div>
                <textarea
                  rows={6}
                  value={currentResume.data.summary}
                  onChange={(e) =>
                    updateResumeData((d) => ({ ...d, summary: e.target.value }))
                  }
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 text-slate-200 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  placeholder="Summarize your engineering expertise, academic pedigree, and core technical competencies..."
                />
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400">
                  Tip: A concise 2-3 line summary keeps your resume strictly within the 1-page ATS threshold.
                </div>
              </div>
            )}

            {/* 3. Education Tab */}
            {activeTab === 'education' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Education Entries
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateResumeData((d) => ({
                        ...d,
                        education: [
                          ...d.education,
                          {
                            id: `edu_${Date.now()}`,
                            institution: 'New University',
                            degree: 'Bachelor of Technology',
                            fieldOfStudy: 'Computer Science',
                            location: 'City, India',
                            startDate: '2022',
                            endDate: '2026',
                            grade: '8.5 / 10 CGPA',
                          },
                        ],
                      }))
                    }
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add Institution
                  </Button>
                </div>

                {currentResume.data.education.map((edu, idx) => (
                  <div key={edu.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-400">Education #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateResumeData((d) => ({
                            ...d,
                            education: d.education.filter((e) => e.id !== edu.id),
                          }))
                        }
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <Input
                      label="Institution / University Name"
                      value={edu.institution}
                      onChange={(e) =>
                        updateResumeData((d) => ({
                          ...d,
                          education: d.education.map((item) =>
                            item.id === edu.id ? { ...item, institution: e.target.value } : item
                          ),
                        }))
                      }
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Degree"
                        value={edu.degree}
                        onChange={(e) =>
                          updateResumeData((d) => ({
                            ...d,
                            education: d.education.map((item) =>
                              item.id === edu.id ? { ...item, degree: e.target.value } : item
                            ),
                          }))
                        }
                      />
                      <Input
                        label="Field of Study"
                        value={edu.fieldOfStudy}
                        onChange={(e) =>
                          updateResumeData((d) => ({
                            ...d,
                            education: d.education.map((item) =>
                              item.id === edu.id ? { ...item, fieldOfStudy: e.target.value } : item
                            ),
                          }))
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        label="Start Date"
                        value={edu.startDate}
                        onChange={(e) =>
                          updateResumeData((d) => ({
                            ...d,
                            education: d.education.map((item) =>
                              item.id === edu.id ? { ...item, startDate: e.target.value } : item
                            ),
                          }))
                        }
                      />
                      <Input
                        label="End Date"
                        value={edu.endDate}
                        onChange={(e) =>
                          updateResumeData((d) => ({
                            ...d,
                            education: d.education.map((item) =>
                              item.id === edu.id ? { ...item, endDate: e.target.value } : item
                            ),
                          }))
                        }
                      />
                      <Input
                        label="CGPA / Grade"
                        value={edu.grade || ''}
                        onChange={(e) =>
                          updateResumeData((d) => ({
                            ...d,
                            education: d.education.map((item) =>
                              item.id === edu.id ? { ...item, grade: e.target.value } : item
                            ),
                          }))
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 4. Experience Tab */}
            {activeTab === 'experience' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Work & Internship Experience
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateResumeData((d) => ({
                        ...d,
                        experience: [
                          ...d.experience,
                          {
                            id: `exp_${Date.now()}`,
                            company: 'Company Name',
                            position: 'Software Engineer Intern',
                            location: 'Bengaluru, India',
                            startDate: 'May 2025',
                            endDate: 'July 2025',
                            isCurrent: false,
                            bullets: [
                              'Engineered scalable microservices in Go, reducing processing latency by 35%.',
                            ],
                            techStack: ['Go', 'Docker', 'PostgreSQL'],
                          },
                        ],
                      }))
                    }
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add Experience
                  </Button>
                </div>

                {currentResume.data.experience.map((exp) => (
                  <div key={exp.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="text-xs font-bold text-indigo-300">{exp.company}</div>
                      <button
                        type="button"
                        onClick={() =>
                          updateResumeData((d) => ({
                            ...d,
                            experience: d.experience.filter((e) => e.id !== exp.id),
                          }))
                        }
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                        title="Remove Experience"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Company Name"
                        value={exp.company}
                        onChange={(e) =>
                          updateResumeData((d) => ({
                            ...d,
                            experience: d.experience.map((item) =>
                              item.id === exp.id ? { ...item, company: e.target.value } : item
                            ),
                          }))
                        }
                      />
                      <Input
                        label="Role / Position"
                        value={exp.position}
                        onChange={(e) =>
                          updateResumeData((d) => ({
                            ...d,
                            experience: d.experience.map((item) =>
                              item.id === exp.id ? { ...item, position: e.target.value } : item
                            ),
                          }))
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        label="Location"
                        value={exp.location}
                        onChange={(e) =>
                          updateResumeData((d) => ({
                            ...d,
                            experience: d.experience.map((item) =>
                              item.id === exp.id ? { ...item, location: e.target.value } : item
                            ),
                          }))
                        }
                      />
                      <Input
                        label="Start Date"
                        value={exp.startDate}
                        onChange={(e) =>
                          updateResumeData((d) => ({
                            ...d,
                            experience: d.experience.map((item) =>
                              item.id === exp.id ? { ...item, startDate: e.target.value } : item
                            ),
                          }))
                        }
                      />
                      <Input
                        label="End Date"
                        value={exp.endDate}
                        onChange={(e) =>
                          updateResumeData((d) => ({
                            ...d,
                            experience: d.experience.map((item) =>
                              item.id === exp.id ? { ...item, endDate: e.target.value } : item
                            ),
                          }))
                        }
                      />
                    </div>

                    {/* Bullet Points with 1-click AI Assist */}
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-300">
                          Bullet Points (Quantifiable achievements)
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateResumeData((d) => ({
                              ...d,
                              experience: d.experience.map((item) =>
                                item.id === exp.id
                                  ? {
                                      ...item,
                                      bullets: [
                                        ...item.bullets,
                                        'Engineered scalable microservice reducing system latency by 25%.',
                                      ],
                                    }
                                  : item
                              ),
                            }))
                          }
                          className="text-indigo-400 hover:text-indigo-300 text-[11px] font-semibold cursor-pointer"
                        >
                          + Add Bullet
                        </button>
                      </div>

                      {exp.bullets.map((bullet, bIdx) => (
                        <div key={bIdx} className="space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                          <div className="flex items-start gap-2">
                            <textarea
                              rows={2}
                              value={bullet}
                              onChange={(e) => {
                                const newBullets = [...exp.bullets];
                                newBullets[bIdx] = e.target.value;
                                updateResumeData((d) => ({
                                  ...d,
                                  experience: d.experience.map((item) =>
                                    item.id === exp.id ? { ...item, bullets: newBullets } : item
                                  ),
                                }));
                              }}
                              className="flex-1 bg-slate-950 border border-slate-800 text-xs text-slate-200 p-2 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newBullets = exp.bullets.filter((_, i) => i !== bIdx);
                                updateResumeData((d) => ({
                                  ...d,
                                  experience: d.experience.map((item) =>
                                    item.id === exp.id ? { ...item, bullets: newBullets } : item
                                  ),
                                }));
                              }}
                              className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                              title="Delete Bullet"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* AI Action helpers */}
                          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
                            <span>{bullet.length} chars</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500 font-medium">AI Assist:</span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleTriggerAiAssist(bullet, 'action_verb', (improved) => {
                                    const newBullets = [...exp.bullets];
                                    newBullets[bIdx] = improved;
                                    updateResumeData((d) => ({
                                      ...d,
                                      experience: d.experience.map((item) =>
                                        item.id === exp.id ? { ...item, bullets: newBullets } : item
                                      ),
                                    }));
                                  })
                                }
                                className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-900 hover:bg-indigo-900/50 cursor-pointer"
                              >
                                Verb + Metric
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleTriggerAiAssist(bullet, 'shorten', (improved) => {
                                    const newBullets = [...exp.bullets];
                                    newBullets[bIdx] = improved;
                                    updateResumeData((d) => ({
                                      ...d,
                                      experience: d.experience.map((item) =>
                                        item.id === exp.id ? { ...item, bullets: newBullets } : item
                                      ),
                                    }));
                                  })
                                }
                                className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                              >
                                Shorten
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleTriggerAiAssist(bullet, 'ats_optimize', (improved) => {
                                    const newBullets = [...exp.bullets];
                                    newBullets[bIdx] = improved;
                                    updateResumeData((d) => ({
                                      ...d,
                                      experience: d.experience.map((item) =>
                                        item.id === exp.id ? { ...item, bullets: newBullets } : item
                                      ),
                                    }));
                                  })
                                }
                                className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                              >
                                ATS Polish
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 5. Projects Tab */}
            {activeTab === 'projects' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Technical Projects
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateResumeData((d) => ({
                        ...d,
                        projects: [
                          ...d.projects,
                          {
                            id: `proj_${Date.now()}`,
                            title: 'Project Title',
                            technologies: ['C++', 'Go', 'Linux'],
                            bullets: ['Implemented core algorithms and optimized runtime performance.'],
                          },
                        ],
                      }))
                    }
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add Project
                  </Button>
                </div>

                {currentResume.data.projects.map((proj) => (
                  <div key={proj.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-300">{proj.title}</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateResumeData((d) => ({
                            ...d,
                            projects: d.projects.filter((p) => p.id !== proj.id),
                          }))
                        }
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                        title="Remove Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <Input
                      label="Project Title"
                      value={proj.title}
                      onChange={(e) =>
                        updateResumeData((d) => ({
                          ...d,
                          projects: d.projects.map((p) =>
                            p.id === proj.id ? { ...p, title: e.target.value } : p
                          ),
                        }))
                      }
                    />

                    <Input
                      label="Tech Stack (comma-separated)"
                      value={proj.technologies ? proj.technologies.join(', ') : ''}
                      onChange={(e) =>
                        updateResumeData((d) => ({
                          ...d,
                          projects: d.projects.map((p) =>
                            p.id === proj.id
                              ? {
                                  ...p,
                                  technologies: e.target.value
                                    .split(',')
                                    .map((t) => t.trim())
                                    .filter(Boolean),
                                }
                              : p
                          ),
                        }))
                      }
                    />

                    {/* Bullets */}
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-300">Project Bullets</span>
                      {proj.bullets.map((b, bIdx) => (
                        <div key={bIdx} className="space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                          <textarea
                            rows={2}
                            value={b}
                            onChange={(e) => {
                              const newBullets = [...proj.bullets];
                              newBullets[bIdx] = e.target.value;
                              updateResumeData((d) => ({
                                ...d,
                                projects: d.projects.map((p) =>
                                  p.id === proj.id ? { ...p, bullets: newBullets } : p
                                ),
                              }));
                            }}
                            className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 p-2 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 6. Skills Tab */}
            {activeTab === 'skills' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Technical Skills (Categorized)
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateResumeData((d) => ({
                        ...d,
                        skills: [
                          ...d.skills,
                          {
                            id: `skill_${Date.now()}`,
                            categoryName: 'Frameworks & Tools',
                            skills: ['Docker', 'Kubernetes', 'Git'],
                          },
                        ],
                      }))
                    }
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add Category
                  </Button>
                </div>

                {currentResume.data.skills.map((cat) => (
                  <div key={cat.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-300">{cat.categoryName}</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateResumeData((d) => ({
                            ...d,
                            skills: d.skills.filter((s) => s.id !== cat.id),
                          }))
                        }
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                        title="Remove Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <Input
                      label="Category Name"
                      value={cat.categoryName}
                      onChange={(e) =>
                        updateResumeData((d) => ({
                          ...d,
                          skills: d.skills.map((s) =>
                            s.id === cat.id ? { ...s, categoryName: e.target.value } : s
                          ),
                        }))
                      }
                    />

                    <Input
                      label="Skills (comma-separated)"
                      value={cat.skills.join(', ')}
                      onChange={(e) =>
                        updateResumeData((d) => ({
                          ...d,
                          skills: d.skills.map((s) =>
                            s.id === cat.id
                              ? {
                                  ...s,
                                  skills: e.target.value
                                    .split(',')
                                    .map((item) => item.trim())
                                    .filter(Boolean),
                                }
                              : s
                          ),
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 7. Achievements Tab */}
            {activeTab === 'achievements' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Honors, Contests & Certifications
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateResumeData((d) => ({
                        ...d,
                        achievements: [
                          ...d.achievements,
                          {
                            id: `ach_${Date.now()}`,
                            title: 'Contest / Award Title',
                            description: 'Brief description of ranking, contest, or competitive score.',
                          },
                        ],
                      }))
                    }
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add Honor
                  </Button>
                </div>

                {currentResume.data.achievements.map((ach) => (
                  <div key={ach.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-300">{ach.title}</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateResumeData((d) => ({
                            ...d,
                            achievements: d.achievements.filter((a) => a.id !== ach.id),
                          }))
                        }
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                        title="Remove Honor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <Input
                      label="Title"
                      value={ach.title}
                      onChange={(e) =>
                        updateResumeData((d) => ({
                          ...d,
                          achievements: d.achievements.map((a) =>
                            a.id === ach.id ? { ...a, title: e.target.value } : a
                          ),
                        }))
                      }
                    />

                    <Input
                      label="Description / Impact"
                      value={ach.description}
                      onChange={(e) =>
                        updateResumeData((d) => ({
                          ...d,
                          achievements: d.achievements.map((a) =>
                            a.id === ach.id ? { ...a, description: e.target.value } : a
                          ),
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 8. Reorder Tab */}
            {activeTab === 'order' && (
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Customize Section Order
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Students applying for software engineering roles typically position Education or Technical Projects above Experience.
                </p>
                <div className="space-y-2">
                  {(currentResume.data.sectionOrder || ['education', 'experience', 'projects', 'skills', 'achievements']).map(
                    (sec, sIdx, arr) => (
                      <div
                        key={sec}
                        className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs capitalize font-semibold text-slate-200"
                      >
                        <span>
                          {sIdx + 1}. {sec === 'projects' ? 'Technical Projects' : sec}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={sIdx === 0}
                            onClick={() => {
                              const newOrder = [...arr];
                              const temp = newOrder[sIdx - 1];
                              newOrder[sIdx - 1] = newOrder[sIdx];
                              newOrder[sIdx] = temp;
                              updateResumeData((d) => ({ ...d, sectionOrder: newOrder }));
                            }}
                            className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={sIdx === arr.length - 1}
                            onClick={() => {
                              const newOrder = [...arr];
                              const temp = newOrder[sIdx + 1];
                              newOrder[sIdx + 1] = newOrder[sIdx];
                              newOrder[sIdx] = temp;
                              updateResumeData((d) => ({ ...d, sectionOrder: newOrder }));
                            }}
                            className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Pane: Live Interactive Document / LaTeX Preview (Cols 7) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Preview Controls Bar */}
          <div className="flex items-center justify-between p-2 bg-slate-900/80 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPreviewMode('document')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  previewMode === 'document'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>ATS PDF Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('latex')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  previewMode === 'latex'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>LaTeX (.tex) Source</span>
              </button>
              <button
                type="button"
                onClick={() => setIsChatbotOpen(!isChatbotOpen)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isChatbotOpen
                    ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/20'
                    : 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>AI Co-Pilot</span>
                {currentResume.customLatex && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Custom AI modifications active" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {currentResume.customLatex ? (
                <span className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" /> AI Customized LaTeX
                </span>
              ) : (
                <span className="text-[11px] text-emerald-400 hidden sm:inline flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 inline" /> TeX Live Sandboxed
                </span>
              )}
              <Button variant="ghost" size="sm" onClick={handleDownloadTex}>
                Download .tex
              </Button>
            </div>
          </div>

          {/* Sync Status Banner */}
          {syncToast && (
            <div className="flex items-center justify-between px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 shadow-md">
              <span className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{syncToast}</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80">
                Live Preview & Forms Synced
              </span>
            </div>
          )}

          {/* Preview Content Area */}
          <div className="flex-1 bg-slate-900/40 rounded-2xl border border-slate-800/80 p-4 sm:p-6 overflow-y-auto max-h-[calc(100vh-160px)] flex justify-center">
            {previewMode === 'document' ? (
              /* High-Fidelity Paper Simulation Container */
              <div className="w-full max-w-[800px] bg-white text-slate-900 rounded-sm shadow-2xl p-8 sm:p-12 font-serif text-[13px] leading-normal min-h-[960px] border border-slate-200">
                {/* Document Header */}
                <div className="text-center pb-2 border-b border-slate-300">
                  <h1 className="text-2xl font-bold tracking-tight text-black font-sans uppercase">
                    {currentResume.data.basics.name}
                  </h1>
                  <div className="text-xs text-slate-600 mt-1 font-sans">
                    {currentResume.data.basics.phone} &nbsp;|&nbsp; {currentResume.data.basics.email} &nbsp;|&nbsp;{' '}
                    {currentResume.data.basics.location}
                  </div>
                  <div className="text-[11px] text-indigo-700 mt-0.5 font-sans">
                    {currentResume.data.basics.github && (
                      <span className="mr-3">{currentResume.data.basics.github.replace('https://', '')}</span>
                    )}
                    {currentResume.data.basics.linkedin && (
                      <span className="mr-3">{currentResume.data.basics.linkedin.replace('https://', '')}</span>
                    )}
                    {currentResume.data.basics.leetcode && (
                      <span>{currentResume.data.basics.leetcode.replace('https://', '')}</span>
                    )}
                  </div>
                </div>

                {/* Summary */}
                {currentResume.data.summary && (
                  <div className="mt-3 text-xs text-slate-700 italic border-l-2 border-slate-300 pl-3">
                    {currentResume.data.summary}
                  </div>
                )}

                {/* Render Sections in Dynamic Order */}
                {(currentResume.data.sectionOrder || ['education', 'experience', 'projects', 'skills', 'achievements']).map(
                  (sec) => {
                    if (sec === 'education' && currentResume.data.education.length > 0) {
                      return (
                        <div key="edu" className="mt-4">
                          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 font-sans">
                            Education
                          </h2>
                          <div className="mt-2 space-y-2.5">
                            {currentResume.data.education.map((edu) => (
                              <div key={edu.id} className="font-sans">
                                <div className="flex justify-between font-bold text-black text-xs">
                                  <span>{edu.institution}</span>
                                  <span>{edu.location}</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-700 italic">
                                  <span>
                                    {edu.degree}
                                    {edu.fieldOfStudy ? ' in ' + edu.fieldOfStudy : ''}
                                    {edu.grade ? ' | ' + edu.grade : ''}
                                  </span>
                                  <span>
                                    {edu.startDate} – {edu.endDate}
                                  </span>
                                </div>
                                {edu.highlights && (
                                  <ul className="list-disc pl-4 mt-1 text-[12px] text-slate-800 space-y-0.5">
                                    {edu.highlights.map((h, i) => (
                                      <li key={i}>{h}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (sec === 'experience' && currentResume.data.experience.length > 0) {
                      return (
                        <div key="exp" className="mt-4">
                          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 font-sans">
                            Experience
                          </h2>
                          <div className="mt-2 space-y-3">
                            {currentResume.data.experience.map((exp) => (
                              <div key={exp.id} className="font-sans">
                                <div className="flex justify-between font-bold text-black text-xs">
                                  <span>{exp.position}</span>
                                  <span>
                                    {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}
                                  </span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-700 italic">
                                  <span>{exp.company}</span>
                                  <span>{exp.location}</span>
                                </div>
                                <ul className="list-disc pl-4 mt-1 text-[12px] text-slate-800 space-y-1">
                                  {exp.bullets.map((b, i) => (
                                    <li key={i}>{b}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (sec === 'projects' && currentResume.data.projects.length > 0) {
                      return (
                        <div key="proj" className="mt-4">
                          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 font-sans">
                            Technical Projects
                          </h2>
                          <div className="mt-2 space-y-2.5">
                            {currentResume.data.projects.map((proj) => (
                              <div key={proj.id} className="font-sans">
                                <div className="flex justify-between font-bold text-black text-xs">
                                  <span>
                                    {proj.title}
                                    {proj.technologies && (
                                      <span className="font-normal italic text-slate-600">
                                        {' '}
                                        | {proj.technologies.join(', ')}
                                      </span>
                                    )}
                                  </span>
                                  {proj.startDate && (
                                    <span>
                                      {proj.startDate} – {proj.endDate || 'Present'}
                                    </span>
                                  )}
                                </div>
                                <ul className="list-disc pl-4 mt-1 text-[12px] text-slate-800 space-y-1">
                                  {proj.bullets.map((b, i) => (
                                    <li key={i}>{b}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (sec === 'skills' && currentResume.data.skills.length > 0) {
                      return (
                        <div key="skills" className="mt-4">
                          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 font-sans">
                            Technical Skills
                          </h2>
                          <div className="mt-1.5 space-y-1 text-[12px] font-sans">
                            {currentResume.data.skills.map((cat) => (
                              <div key={cat.id}>
                                <strong className="font-bold text-black">{cat.categoryName}: </strong>
                                <span className="text-slate-800">{cat.skills.join(', ')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (sec === 'achievements' && currentResume.data.achievements?.length > 0) {
                      return (
                        <div key="ach" className="mt-4">
                          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 font-sans">
                            Honors & Achievements
                          </h2>
                          <ul className="list-disc pl-4 mt-1 text-[12px] text-slate-800 space-y-1 font-sans">
                            {currentResume.data.achievements.map((ach) => (
                              <li key={ach.id}>
                                <strong className="font-bold text-black">{ach.title}: </strong>
                                <span>{ach.description}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    }

                    return null;
                  }
                )}
              </div>
            ) : (
              /* Interactive LaTeX Code Studio */
              <div className="w-full flex flex-col bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
                {/* Editor Header Toolbar */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-indigo-400" /> main.tex
                    </span>
                    {currentResume.customLatex ? (
                      <Badge variant="purple" size="sm">
                        AI Customized
                      </Badge>
                    ) : (
                      <Badge variant="info" size="sm">
                        Generated from Template
                      </Badge>
                    )}
                    {latexEditBuffer !== null && latexEditBuffer !== activeLatex && (
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                        Unsaved Edits
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsChatbotOpen(true)}
                      className="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" /> Ask AI to Edit
                    </button>
                    {currentResume.customLatex && (
                      <button
                        type="button"
                        onClick={handleResetLatexToTemplate}
                        className="px-2 py-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 text-xs transition-colors cursor-pointer"
                        title="Revert custom LaTeX code back to template generated code"
                      >
                        Reset to Template
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSyncManualLatex}
                      disabled={latexEditBuffer === null || latexEditBuffer === activeLatex}
                      className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Sync ATS Preview
                    </button>
                  </div>
                </div>

                {/* Editor Body */}
                <div className="relative flex-1 min-h-[560px]">
                  <textarea
                    value={currentBufferValue}
                    onChange={(e) => setLatexEditBuffer(e.target.value)}
                    spellCheck={false}
                    className="w-full h-full min-h-[560px] p-4 bg-slate-950 font-mono text-xs text-slate-200 leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>

                {/* Editor Footer Status */}
                <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border-t border-slate-800 text-[11px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <span>{currentBufferValue.split('\n').length} lines</span>
                    <span>{currentBufferValue.length} characters</span>
                    {syncToast && (
                      <span className="text-emerald-400 font-medium flex items-center gap-1 animate-pulse">
                        <CheckCircle2 className="w-3 h-3" /> {syncToast}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">TeX Live 2026 Compatible</span>
                    <button
                      type="button"
                      onClick={handleCopyLatex}
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Assist Diff Modal */}
      {aiDiff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-sm font-bold text-indigo-300">
              <Sparkles className="w-4 h-4" />
              <span>AI Bullet Enhancement Diff</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 text-rose-300">
                <div className="text-[10px] uppercase font-bold text-rose-400 mb-1">Original</div>
                <div>{aiDiff.original}</div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/50 text-emerald-300">
                <div className="text-[10px] uppercase font-bold text-emerald-400 mb-1">
                  Sharpened Truth
                </div>
                <div className="font-medium">{aiDiff.improved}</div>
              </div>

              <p className="text-[11px] text-slate-400 italic">{aiDiff.explanation}</p>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setAiDiff(null)}>
                Discard
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  aiDiff.applyCallback(aiDiff.improved);
                  setAiDiff(null);
                }}
              >
                Accept Improvement
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <TailorModal
        isOpen={isTailorOpen}
        onClose={() => setIsTailorOpen(false)}
        masterResume={currentResume}
        onSaveTailoredResume={handleSaveTailored}
      />

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportResume={handleImportResume}
      />

      <VersionHistoryModal
        isOpen={isVersionsOpen}
        onClose={() => setIsVersionsOpen(false)}
        resumes={resumes}
        currentResumeId={currentResume.id}
        onSelectResume={(id) => setCurrentResumeId(id)}
        onDuplicateResume={handleDuplicate}
        onDeleteResume={handleDelete}
      />

      {/* AI Resume & LaTeX Co-Pilot Chatbot */}
      <ResumeAiChatbot
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        currentLatex={activeLatex}
        currentResumeData={currentResume.data}
        onApplyLatex={handleApplyLatexFromAi}
        contextRole={currentResume.targetJobTitle || 'Software Engineering Intern'}
        targetCompany={currentResume.targetCompany || 'Google'}
      />
    </div>
  );
};
