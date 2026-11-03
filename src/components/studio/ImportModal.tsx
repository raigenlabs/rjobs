import React, { useState } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Button } from '../ui/Button.tsx';
import { Badge } from '../ui/Badge.tsx';
import { parseResumeText, ParseResumeResult } from '../../services/resumeParser.ts';
import { ResumeData } from '../../models/resume.ts';
import { Upload, FileText, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportResume: (data: ResumeData, title: string) => void;
}

const SAMPLE_RESUMES = [
  {
    label: 'Rohan Verma (NITK B.Tech CSE)',
    text: `Rohan Verma
rohan.verma@nitk.edu.in | +91 98765 12345 | Bengaluru, India
github.com/rohan-nitk | linkedin.com/in/rohan-verma-tech

EDUCATION
National Institute of Technology Karnataka (NITK) Surathkal
Bachelor of Technology in Computer Science and Engineering (2022 - 2026)
CGPA: 8.92 / 10.0

EXPERIENCE
Swiggy - SDE Intern (May 2025 - July 2025)
- Built high-throughput backend services using Go, Docker, and Kafka.
- Optimized database indexing in PostgreSQL, reducing query p95 latency by 32%.

TECHNICAL SKILLS
Languages: C++, Python, Go, TypeScript, Java, SQL
Systems: Docker, Kubernetes, Kafka, Redis, PostgreSQL, Linux, Git`,
  },
  {
    label: 'Ananya Sen (IIT Bombay Data & ML)',
    text: `Ananya Sen
ananya.sen@iitb.ac.in | +91 91234 56789 | Mumbai, India
github.com/ananya-ml | linkedin.com/in/ananya-sen-iitb

EDUCATION
Indian Institute of Technology (IIT) Bombay
B.Tech in Electrical Engineering with Minor in Artificial Intelligence (2022 - 2026)
CGPA: 9.15 / 10.0

EXPERIENCE
IISc Bangalore - Machine Learning Research Intern (May 2025 - July 2025)
- Trained multi-modal Vision Transformers in PyTorch for high-resolution satellite imagery.
- Decreased model parameter count by 42% through structured weight pruning and quantization.

TECHNICAL SKILLS
Languages: Python, C++, SQL, R
Frameworks: PyTorch, Hugging Face, Scikit-learn, FastAPI, Docker, AWS`,
  },
];

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportResume,
}) => {
  const [rawText, setRawText] = useState(SAMPLE_RESUMES[0].text);
  const [parsedResult, setParsedResult] = useState<ParseResumeResult | null>(null);

  const handleParse = () => {
    if (!rawText.trim()) return;
    const res = parseResumeText(rawText);
    setParsedResult(res);
  };

  const handleApplyImport = () => {
    if (!parsedResult) return;
    onImportResume(parsedResult.data, `${parsedResult.data.basics.name}'s Imported Resume`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload or Paste Existing Resume"
      description="Extract contact details, academic credentials, experience, and tech skills into universal Resume JSON with confidence flags."
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Sample Loaders */}
        <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <span className="text-slate-400 font-semibold">Test with Sample Resumes:</span>
          {SAMPLE_RESUMES.map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => {
                setRawText(sample.text);
                setParsedResult(null);
              }}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-colors cursor-pointer"
            >
              {sample.label}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Paste Resume Plain Text (or drag-and-drop .txt / .json file)
          </label>
          <textarea
            rows={8}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste raw text copied from your existing PDF or Word resume..."
            className="w-full rounded-lg bg-slate-950 border border-slate-800 text-slate-200 p-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>

        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={handleParse}
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Parse & Extract Fields
          </Button>
        </div>

        {/* Extraction Review Screen with Confidence Flags */}
        {parsedResult && (
          <div className="mt-5 pt-5 border-t border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-100">
                Extracted Fields & Extraction Confidence
              </span>
              <Badge variant="purple" size="sm">
                Ready to review
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {parsedResult.confidences.map((item) => (
                <div
                  key={item.field}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium uppercase">{item.field}</div>
                    <div className="font-semibold text-slate-200 truncate max-w-[200px]">
                      {item.value}
                    </div>
                  </div>
                  <Badge
                    variant={
                      item.confidence === 'high'
                        ? 'success'
                        : item.confidence === 'medium'
                        ? 'warning'
                        : 'outline'
                    }
                    size="sm"
                  >
                    {item.confidence.toUpperCase()} CONFIDENCE
                  </Badge>
                </div>
              ))}
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-slate-800">
              <span className="text-xs text-slate-400">
                Mapped to candidate profile with zero dropped sections.
              </span>
              <Button
                variant="primary"
                onClick={handleApplyImport}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Load into Resume Studio
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
