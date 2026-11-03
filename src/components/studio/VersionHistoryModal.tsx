import React from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Button } from '../ui/Button.tsx';
import { Badge } from '../ui/Badge.tsx';
import { ResumeDocument } from '../../models/resume.ts';
import { FileText, Copy, Trash2, CheckCircle, ExternalLink, Calendar, Star } from 'lucide-react';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumes: ResumeDocument[];
  currentResumeId: string;
  onSelectResume: (id: string) => void;
  onDuplicateResume: (resume: ResumeDocument) => void;
  onDeleteResume: (id: string) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  resumes,
  currentResumeId,
  onSelectResume,
  onDuplicateResume,
  onDeleteResume,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Resume Versions & Tailored Branches"
      description="Manage your Master Technical Resume and per-job tailored variants. Tailored variants never overwrite the master."
      maxWidth="3xl"
    >
      <div className="space-y-3">
        {resumes.map((resume) => {
          const isSelected = resume.id === currentResumeId;
          return (
            <div
              key={resume.id}
              className={`p-4 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-slate-900 border-indigo-500 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-sm font-bold text-white">{resume.title}</h4>
                    {resume.isMaster && (
                      <Badge variant="purple" size="sm">
                        <Star className="w-3 h-3 mr-1 fill-indigo-400" /> Master
                      </Badge>
                    )}
                    {resume.targetCompany && (
                      <Badge variant="info" size="sm">
                        {resume.targetCompany}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span>Template: {resume.templateId}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      Updated: {new Date(resume.updatedAt).toLocaleDateString()}
                    </span>
                    {resume.matchScore && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold">
                          ATS Match: {resume.matchScore}%
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {isSelected ? (
                    <Badge variant="success" size="md">
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Active in Studio
                    </Badge>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        onSelectResume(resume.id);
                        onClose();
                      }}
                    >
                      Load in Studio
                    </Button>
                  )}

                  <button
                    type="button"
                    onClick={() => onDuplicateResume(resume)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Duplicate version"
                    aria-label="Duplicate version"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {!resume.isMaster && (
                    <button
                      type="button"
                      onClick={() => onDeleteResume(resume.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete version"
                      aria-label="Delete version"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};
