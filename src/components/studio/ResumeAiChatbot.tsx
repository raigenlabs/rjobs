import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronDown,
  ChevronUp,
  Zap,
  Code2,
  FileText,
  Sliders,
  Maximize2,
  Minimize2,
  X,
  PlusCircle,
  Layers,
  User,
  Bot,
} from 'lucide-react';
import { editResumeWithAi, LatexEditResult, DiffItem, validateLatexSyntax } from '../../services/latexAiEngine.ts';
import { parseLatexToResumeData } from '../../services/latexParser.ts';
import type { ResumeData } from '../../models/resume.ts';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  summaryOfChanges?: string[];
  diffs?: DiffItem[];
  modelUsed?: string;
  latexSnapshot?: string;
  previousLatexSnapshot?: string;
  applied?: boolean;
}

interface ResumeAiChatbotProps {
  currentLatex: string;
  currentResumeData: ResumeData;
  onApplyLatex: (updatedLatex: string, parsedData: ResumeData) => void;
  contextRole?: string;
  targetCompany?: string;
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  {
    icon: User,
    label: 'Change Name to Raghvendra Sahu',
    instruction: 'change my name to raghvendra sahu',
  },
  {
    icon: Zap,
    label: 'Condense to 1 Page',
    instruction: 'Condense the resume to fit strictly on 1 page by optimizing margins and tightening bullet spacing.',
  },
  {
    icon: Sparkles,
    label: 'Quantify with XYZ Metrics',
    instruction: 'Enrich my project and experience bullets with quantified engineering metrics using the Google XYZ formula.',
  },
  {
    icon: PlusCircle,
    label: 'Add Go & Redis Project',
    instruction: 'Add a high-throughput Distributed Rate Limiter project in Go, Redis, and Docker with 3 metric-backed bullets.',
  },
  {
    icon: Layers,
    label: 'Tailor for Distributed Systems',
    instruction: 'Tailor my summary and highlight cloud, concurrency, and distributed systems keywords throughout the resume.',
  },
  {
    icon: Code2,
    label: 'Audit & Fix LaTeX Syntax',
    instruction: 'Audit all LaTeX syntax, verify environment balances, and escape any raw special characters like %, &, and _.',
  },
];

export const ResumeAiChatbot: React.FC<ResumeAiChatbotProps> = ({
  currentLatex,
  currentResumeData,
  onApplyLatex,
  contextRole = 'Software Engineering Intern',
  targetCompany = 'Google',
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `Hello! I'm your AI Resume & LaTeX Co-Pilot. Tell me how you'd like to update your resume—add projects, rewrite bullets with metrics, condense to 1 page, or refine technical skills. I will directly edit the LaTeX code and keep your ATS preview in sync.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedDiffs, setExpandedDiffs] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSend = async (instructionText?: string) => {
    const textToSend = (instructionText || input).trim();
    if (!textToSend || isLoading) return;

    const userMsgId = `msg_user_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== 'msg_welcome')
        .map((m) => ({ role: m.sender, content: m.text }));

      const result: LatexEditResult = await editResumeWithAi({
        latex: currentLatex,
        instruction: textToSend,
        contextRole,
        targetCompany,
        conversationHistory: history,
      });

      // Parse updated LaTeX back to ResumeData so ATS preview stays synced
      const parsedData = parseLatexToResumeData(result.updatedLatex, currentResumeData);

      // Auto-apply to live document
      onApplyLatex(result.updatedLatex, parsedData);

      const assistantMsgId = `msg_asst_${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `I've updated your LaTeX code according to: "${textToSend}". All changes have been compiled and applied to your live resume.`,
        summaryOfChanges: result.summaryOfChanges,
        diffs: result.diffs,
        modelUsed: result.modelUsed,
        latexSnapshot: result.updatedLatex,
        previousLatexSnapshot: currentLatex,
        applied: true,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Encountered an issue editing the LaTeX code: ${(err as Error).message}. Please try again or specify the section directly.`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUndo = (msg: ChatMessage) => {
    if (msg.previousLatexSnapshot) {
      const restoredData = parseLatexToResumeData(msg.previousLatexSnapshot, currentResumeData);
      onApplyLatex(msg.previousLatexSnapshot, restoredData);
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, applied: false } : m))
      );
    }
  };

  const handleReapply = (msg: ChatMessage) => {
    if (msg.latexSnapshot) {
      const restoredData = parseLatexToResumeData(msg.latexSnapshot, currentResumeData);
      onApplyLatex(msg.latexSnapshot, restoredData);
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, applied: true } : m))
      );
    }
  };

  const handleCopyLatex = (latex: string, id: string) => {
    navigator.clipboard.writeText(latex);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleDiff = (id: string) => {
    setExpandedDiffs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const syntaxStatus = validateLatexSyntax(currentLatex);

  return (
    <div
      className={`fixed z-50 flex flex-col bg-slate-900 border border-slate-700/80 shadow-2xl transition-all duration-300 ${
        isExpanded
          ? 'inset-4 md:inset-12 rounded-2xl'
          : 'bottom-4 right-4 w-[95vw] sm:w-[480px] md:w-[520px] h-[640px] max-h-[85vh] rounded-2xl'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800 rounded-t-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">AI Resume & LaTeX Co-Pilot</h3>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-300" /> Gemini AI Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Editing for <span className="text-indigo-300 font-medium">{targetCompany || 'Tech'}</span> • {contextRole}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isExpanded ? 'Restore size' : 'Expand panel'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Syntax Status Strip */}
      <div className="px-4 py-1.5 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Code2 className="w-3 h-3 text-indigo-400" />
          <span>LaTeX Document Source:</span>
          <span className="text-slate-300 font-mono text-[10px]">
            {currentLatex.split('\n').length} lines
          </span>
        </div>
        <div className="flex items-center gap-1">
          {syntaxStatus.valid ? (
            <span className="text-emerald-400 flex items-center gap-1 text-[10px]">
              <CheckCircle2 className="w-3 h-3" /> Syntax Verified
            </span>
          ) : (
            <span className="text-amber-400 flex items-center gap-1 text-[10px]" title={syntaxStatus.errors[0]}>
              <AlertCircle className="w-3 h-3" /> Syntax Alert
            </span>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                  : 'bg-slate-800/90 text-slate-200 border border-slate-700/70 rounded-bl-none shadow-md'
              }`}
            >
              {msg.modelUsed && (
                <div className="mb-2">
                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                    {msg.modelUsed.startsWith('gemini') ? `Gemini AI (${msg.modelUsed})` : 'TeX Live Rule Engine'}
                  </span>
                </div>
              )}

              <p className="whitespace-pre-wrap">{msg.text}</p>

              {/* Summary of changes */}
              {msg.summaryOfChanges && msg.summaryOfChanges.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-700/80 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block">
                    Modifications Made:
                  </span>
                  <ul className="space-y-1 pl-1">
                    {msg.summaryOfChanges.map((change, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                        <span className="text-emerald-400 mt-0.5">•</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Diff toggle & Actions */}
              {msg.latexSnapshot && (
                <div className="mt-3 pt-2 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {msg.applied ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" /> Live in Resume
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleReapply(msg)}
                        className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                      >
                        Re-apply Changes
                      </button>
                    )}

                    {msg.previousLatexSnapshot && msg.applied && (
                      <button
                        type="button"
                        onClick={() => handleUndo(msg)}
                        className="inline-flex items-center gap-1 text-[10px] text-amber-300 hover:text-amber-200 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-2.5 h-2.5" /> Undo This Change
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleDiff(msg.id)}
                      className="text-[10px] text-slate-400 hover:text-white flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>{expandedDiffs[msg.id] ? 'Hide TeX' : 'View TeX'}</span>
                      {expandedDiffs[msg.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyLatex(msg.latexSnapshot!, msg.id)}
                      className="text-[10px] text-slate-400 hover:text-white flex items-center gap-0.5 cursor-pointer"
                      title="Copy full LaTeX code"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedId === msg.id ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Collapsible LaTeX snippet view */}
              {msg.latexSnapshot && expandedDiffs[msg.id] && (
                <div className="mt-2 p-2 bg-slate-950 rounded-lg border border-slate-700/80 font-mono text-[10px] text-slate-300 max-h-48 overflow-y-auto whitespace-pre leading-normal">
                  {msg.latexSnapshot}
                </div>
              )}
            </div>

            <span className="text-[10px] text-slate-500 mt-1 px-1">
              {msg.timestamp}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2">
            <div className="bg-slate-800/90 text-slate-200 border border-slate-700/70 rounded-2xl rounded-bl-none px-4 py-3 text-xs shadow-md">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
                <span className="text-slate-300 font-medium">
                  Refactoring LaTeX code with Gemini AI...
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Auditing LaTeX environments, updating document tree, and compiling ATS preview.
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800/80 overflow-x-auto">
        <div className="flex items-center gap-1.5 w-max">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Presets:
          </span>
          {QUICK_PROMPTS.map((qp, idx) => {
            const Icon = qp.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(qp.instruction)}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-medium transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                <Icon className="w-3 h-3 text-indigo-400" />
                <span>{qp.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Box */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 rounded-b-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-end gap-2"
        >
          <div className="flex-1 bg-slate-900 rounded-xl border border-slate-700/80 focus-within:border-indigo-500 p-2 transition-colors">
            <textarea
              ref={textareaRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`e.g., "Change my name to Raghvendra Sahu" or "Condense to 1 page"...`}
              className="w-full bg-transparent border-0 text-xs text-white placeholder-slate-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <span>Edit</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-500">
          <span>Press Enter to send • Shift+Enter for new line</span>
          <span>TeX Live ATS Standard v2026</span>
        </div>
      </div>
    </div>
  );
};
