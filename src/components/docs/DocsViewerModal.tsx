import React, { useState } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Badge } from '../ui/Badge.tsx';
import { BookOpen, FileText, Cpu, Terminal, Shield, List } from 'lucide-react';

interface DocsViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDoc?: 'ARCHITECTURE' | 'DECISIONS' | 'RUNBOOK' | 'API' | 'SCRAPER_SOURCES';
}

const DOCS_CONTENT = {
  ARCHITECTURE: {
    title: 'ARCHITECTURE.md',
    subtitle: 'High-Level System Design, Data Flow & Sandboxing',
    badge: 'System Design',
    icon: <Cpu className="w-4 h-4 text-indigo-400" />,
    content: `# rJobs System Architecture & Component Design

### 1. High-Level Flow
rJobs connects three capabilities through a unified Candidate Profile / Resume JSON:
1. **Resume Studio**: LaTeX compilation engine running in an isolated Docker container (Tectonic/TeX Live) with zero-network egress and strict 5-second CPU limit.
2. **Job Radar**: Polite ingestion pipelines with per-platform adapters for 34+ top employers in India (Workday, Amazon, Eightfold, Oracle HCM, Phenom, SuccessFactors).
3. **Apply Assist**: Browser extension with Human-In-The-Loop review gate. Zero unattended auto-submits.

### 2. Candidate Profile & Resume JSON
Every resume version branches from the Master Resume without overwriting original records. AI tailoring produces a structured diff proposal that requires explicit user acceptance.

### 3. Security Boundaries
- LaTeX Sanitization: Special characters escaped (&, %, $, #, _, {, }, ~, ^, \\) and dangerous primitives (\\input, \\write18, \\openin) strictly blocked.
- PII Redaction: Logger automatically scrubs passwords, authorization tokens, and credentials.
- Compliance: India DPDP Act and GDPR compliant data export and deletion endpoints.`,
  },
  DECISIONS: {
    title: 'DECISIONS.md',
    subtitle: 'Architectural Decision Records (ADR 001 - 006)',
    badge: 'Architecture Records',
    icon: <FileText className="w-4 h-4 text-emerald-400" />,
    content: `# Architectural Decision Records (ADRs)

- **ADR-001 (Monorepo with Shared Schemas):** Unified Zod schemas across Web, API, and Chrome Extension to guarantee zero schema drift.
- **ADR-002 (Resume JSON Single Source of Truth):** Master record branches into tailored variants per job; prevents data loss.
- **ADR-003 (Sandboxed LaTeX Execution):** Compile worker isolated in non-networked container with read-only root and input sanitization.
- **ADR-004 (Anti-Fabrication Guardrail):** AI tailoring verifier blocks hallucinated employers, degrees, or metrics before saving.
- **ADR-005 (Respectful Scraping & Rate Limiting):** Direct public JSON APIs first, robots.txt compliance, staggered 3-6 hour polling, circuit breakers.
- **ADR-006 (Human Confirmation Gate):** Apply Assist stops at "Ready for your review". Final submit is always executed by the candidate.`,
  },
  RUNBOOK: {
    title: 'RUNBOOK.md',
    subtitle: 'Deployment, Local Dev, Testing & Incident Response',
    badge: 'DevOps & Ops',
    icon: <Terminal className="w-4 h-4 text-amber-400" />,
    content: `# rJobs Runbook & Operations

### Local Development Quickstart
\`\`\`bash
# 1. Start Postgres (pgvector), Redis, MinIO, and LaTeX compiler
docker-compose up -d

# 2. Run unit tests
node --test

# 3. Start development server
npm run dev
\`\`\`

### Circuit Breaker Recovery
When a scraper source encounters 5 consecutive network or parsing failures, it trips to \`circuit_breaker_open\`. Run \`scripts/fingerprint-sources.js --source=<name>\` to verify endpoint changes before resetting the counter.`,
  },
  API: {
    title: 'API.md',
    subtitle: 'REST / OpenAPI Specification for rJobs Endpoints',
    badge: 'REST API',
    icon: <List className="w-4 h-4 text-sky-400" />,
    content: `# rJobs REST API Reference (v1)

- **Auth**: \`POST /auth/register\`, \`POST /auth/login\`, \`POST /auth/google\`, \`POST /auth/refresh\`
- **Profile**: \`GET /profile/me\`, \`PUT /profile/me\`, \`GET /profile/export\`, \`DELETE /profile/me\`
- **Resumes**: \`GET /resumes\`, \`POST /resumes\`, \`POST /resumes/:id/compile\`, \`POST /resumes/tailor\`
- **Job Radar**: \`GET /jobs\`, \`GET /jobs/matches\`, \`POST /jobs/:id/feedback\`
- **Applications**: \`GET /applications\`, \`POST /applications\`, \`PATCH /applications/:id\`
- **Answers Bank**: \`GET /answers\`, \`POST /answers\``,
  },
  SCRAPER_SOURCES: {
    title: 'SCRAPER_SOURCES.md',
    subtitle: 'Catalog of 34+ Monitored Employers in India',
    badge: 'Scraper Catalog',
    icon: <Shield className="w-4 h-4 text-purple-400" />,
    content: `# Seed Employer Registry & Platform Status (34 Companies)

1. **Google**: Custom REST API (/about/careers/applications/jobs/results)
2. **Microsoft**: Eightfold AI REST endpoint
3. **Amazon**: Amazon Jobs public JSON API (/en/search.json)
4. **Nvidia**: Workday REST adapter (nvidia.wd5.myworkdayjobs.com)
5. **Apple / Oracle**: Direct requisition APIs
6. **Program Trackers**: Infosys InStep, TCS Internship, Goldman Sachs Student Programs, JP Morgan Student Programs (Content-diff monitor)
7. **Consulting & Tech Services**: Deloitte, PwC, EY, KPMG, Accenture, Capgemini, Cognizant, Wipro.

Strict User-Agent: \`rJobsBot/1.0 (+https://rjobs.dev/bot)\` with 2s domain delay.`,
  },
};

type DocKey = keyof typeof DOCS_CONTENT;

export const DocsViewerModal: React.FC<DocsViewerModalProps> = ({
  isOpen,
  onClose,
  defaultDoc = 'ARCHITECTURE',
}) => {
  const [activeDoc, setActiveDoc] = useState<DocKey>(defaultDoc);

  const doc = DOCS_CONTENT[activeDoc];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="rJobs Engineering Documentation"
      description="Live specification, ADRs, runbooks, and source registry (docs/)"
      maxWidth="4xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
          {(Object.keys(DOCS_CONTENT) as DocKey[]).map((key) => {
            const item = DOCS_CONTENT[key];
            const isSelected = activeDoc === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveDoc(key)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {item.icon}
                  <span className="truncate">{item.title}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Document Content View */}
        <div className="md:col-span-3 bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col max-h-[65vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">{doc.title}</h3>
                <Badge variant="purple" size="sm">
                  {doc.badge}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{doc.subtitle}</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none text-xs text-slate-300 leading-relaxed space-y-3 font-mono whitespace-pre-wrap bg-slate-900/50 p-4 rounded-lg border border-slate-800/80">
            {doc.content}
          </div>
        </div>
      </div>
    </Modal>
  );
};
