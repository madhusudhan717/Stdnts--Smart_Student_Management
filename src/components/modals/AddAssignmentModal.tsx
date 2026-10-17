import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Assignment } from '../../types/index.ts';
import { api } from '../../services/api.ts';

interface AddAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  assignmentToEdit?: Assignment | null;
}

export const AddAssignmentModal: React.FC<AddAssignmentModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  assignmentToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Data Structures & Algorithms');
  const [subjectCode, setSubjectCode] = useState('CSE301');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('11:59 PM');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [status, setStatus] = useState<'Pending' | 'In Progress' | 'Completed'>('Pending');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (assignmentToEdit) {
      setTitle(assignmentToEdit.title);
      setSubject(assignmentToEdit.subject);
      setSubjectCode(assignmentToEdit.subject_code);
      setDescription(assignmentToEdit.description || '');
      setDueDate(assignmentToEdit.due_date);
      setDueTime(assignmentToEdit.due_time || '11:59 PM');
      setPriority(assignmentToEdit.priority);
      setStatus(assignmentToEdit.status as any);
      setSubmissionNotes(assignmentToEdit.submission_notes || '');
    } else {
      setTitle('');
      setSubject('Data Structures & Algorithms');
      setSubjectCode('CSE301');
      setDescription('');
      setDueDate(new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]);
      setDueTime('11:59 PM');
      setPriority('High');
      setStatus('Pending');
      setSubmissionNotes('');
    }
    setError(null);
  }, [assignmentToEdit, isOpen]);

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
      default:
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        title,
        subject,
        subject_code: subjectCode,
        description,
        due_date: dueDate,
        due_time: dueTime,
        priority,
        status,
        submission_notes: submissionNotes,
      };

      if (assignmentToEdit) {
        await api.put(`/assignments/${assignmentToEdit.id}`, payload);
      } else {
        await api.post('/assignments', payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save assignment');
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
              {assignmentToEdit ? 'Edit Assignment' : 'New Assignment / Task'}
            </h3>
            <p className="text-xs text-slate-400">
              {assignmentToEdit ? 'Update assignment deliverables and deadline' : 'Track pending academic work and deadlines'}
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
              Assignment Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Implement AVL Tree and Balanced Rotations"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subject Course *
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
                Subject Code
              </label>
              <input
                type="text"
                readOnly
                value={subjectCode}
                className="w-full px-3 py-2 rounded-xl border border-slate-100 bg-slate-50 text-xs text-slate-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Due Time
              </label>
              <input
                type="text"
                placeholder="11:59 PM"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900 bg-white"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900 bg-white"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Task Instructions
            </label>
            <textarea
              rows={3}
              placeholder="Detailed instructions, questions to answer, deliverables..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Submission Notes / Link
            </label>
            <input
              type="text"
              placeholder="e.g. Upload PDF report on university portal or GitHub repo link"
              value={submissionNotes}
              onChange={(e) => setSubmissionNotes(e.target.value)}
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
              {isSubmitting ? 'Saving...' : assignmentToEdit ? 'Save Changes' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
