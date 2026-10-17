import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { StudyNote } from '../../types/index.ts';
import { api } from '../../services/api.ts';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  noteToEdit?: StudyNote | null;
}

export const AddNoteModal: React.FC<AddNoteModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  noteToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Data Structures & Algorithms');
  const [subjectCode, setSubjectCode] = useState('CSE301');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title);
      setSubject(noteToEdit.subject);
      setSubjectCode(noteToEdit.subject_code);
      setContent(noteToEdit.content);
      setTagsInput(noteToEdit.tags?.join(', ') || '');
    } else {
      setTitle('');
      setSubject('Data Structures & Algorithms');
      setSubjectCode('CSE301');
      setContent('');
      setTagsInput('Algorithms, Lecture Notes');
    }
    setError(null);
  }, [noteToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubjectChange = (val: string) => {
    setSubject(val);
    switch (val) {
      case 'Data Structures & Algorithms':
        setSubjectCode('CSE301');
        break;
      case 'Database Management Systems':
        setSubjectCode('CSE302');
        break;
      case 'Operating Systems':
        setSubjectCode('CSE303');
        break;
      case 'Artificial Intelligence':
        setSubjectCode('CSE304');
        break;
      case 'Discrete Mathematics & Graph Theory':
        setSubjectCode('MAT301');
        break;
      case 'Systems Programming Lab':
        setSubjectCode('CSE305L');
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const payload = {
        title,
        subject,
        subject_code: subjectCode,
        content,
        tags,
      };

      if (noteToEdit) {
        await api.put(`/notes/${noteToEdit.id}`, payload);
      } else {
        await api.post('/notes', payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save note');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {noteToEdit ? 'Edit Study Note' : 'Create Study Note'}
            </h3>
            <p className="text-xs text-slate-400">
              {noteToEdit ? 'Update your course revisions and notes' : 'Capture lecture notes, formulas, and revision summaries'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Note Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. B-Trees & Multi-Level Indexing Rules"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Course Subject *
              </label>
              <select
                value={subject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900 bg-white"
              >
                <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                <option value="Database Management Systems">Database Management Systems</option>
                <option value="Operating Systems">Operating Systems</option>
                <option value="Artificial Intelligence">Artificial Intelligence</option>
                <option value="Discrete Mathematics & Graph Theory">Discrete Mathematics</option>
                <option value="Systems Programming Lab">Systems Programming Lab</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Course Code
              </label>
              <input
                type="text"
                readOnly
                value={subjectCode}
                className="w-full px-3 py-2 rounded-xl border border-slate-100 bg-slate-50 text-xs text-slate-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Content / Notes *
            </label>
            <textarea
              rows={6}
              required
              placeholder="Write Markdown or plain text notes, equations, key definitions, or algorithmic proofs..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Trees, Algorithms, Midterm Prep"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : noteToEdit ? 'Save Changes' : 'Save Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
