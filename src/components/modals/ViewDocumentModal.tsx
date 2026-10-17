import React from 'react';
import { X, Download, FileText, CheckCircle, ExternalLink } from 'lucide-react';
import { StudyMaterial } from '../../types/index.ts';

interface ViewDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: StudyMaterial | null;
}

export const ViewDocumentModal: React.FC<ViewDocumentModalProps> = ({
  isOpen,
  onClose,
  material,
}) => {
  if (!isOpen || !material) return null;

  const handleDownload = () => {
    // Generate simulated document blob download
    const dummyContent = `# ${material.title}\nSubject: ${material.subject} (${material.subject_code})\nType: ${material.file_type}\n\nDescription:\n${material.description}\n\n[STDNTS Academic Study Resource — Downloaded for offline revision]`;
    const blob = new Blob([dummyContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${material.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {material.title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {material.subject} ({material.subject_code}) · {material.file_type} · {material.file_size}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Content / Reader Preview */}
        <div className="flex-1 overflow-y-auto my-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 font-mono text-xs text-slate-800 space-y-4">
          <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
            <h4 className="font-bold text-slate-900 text-sm font-sans mb-1">
              Resource Summary & Learning Objectives
            </h4>
            <p className="text-slate-600 font-sans leading-relaxed text-xs">
              {material.description || 'Verified course revision material uploaded by department faculty.'}
            </p>
          </div>

          <div className="space-y-2 font-sans text-xs">
            <div className="font-semibold text-slate-900">Key Takeaways & Formulae:</div>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Comprehensive theoretical breakdown with practical code examples.</li>
              <li>Includes past university examination questions and step-by-step solutions.</li>
              <li>Recommended reading for continuous internal evaluations and end-semester tests.</li>
            </ul>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 font-sans text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Verified syllabus material for academic session 2026-2027.</span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
          <span className="text-xs text-slate-400">
            Local SQLite Document Reference
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Resource</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
