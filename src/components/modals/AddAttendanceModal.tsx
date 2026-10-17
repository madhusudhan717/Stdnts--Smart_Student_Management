import React, { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../../services/api.ts';

interface AddAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const AddAttendanceModal: React.FC<AddAttendanceModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [courseCode, setCourseCode] = useState('CSE301');
  const [courseName, setCourseName] = useState('Data Structures & Algorithms');
  const [totalClasses, setTotalClasses] = useState('30');
  const [attendedClasses, setAttendedClasses] = useState('28');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCourseChange = (code: string) => {
    setCourseCode(code);
    switch (code) {
      case 'CSE301':
        setCourseName('Data Structures & Algorithms');
        break;
      case 'CSE302':
        setCourseName('Database Management Systems');
        break;
      case 'CSE303':
        setCourseName('Operating Systems');
        break;
      case 'CSE304':
        setCourseName('Artificial Intelligence');
        break;
      case 'MAT301':
        setCourseName('Discrete Mathematics & Graph Theory');
        break;
      case 'CSE305L':
        setCourseName('Systems Programming Lab');
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await api.post('/attendance', {
        course_code: courseCode,
        course_name: courseName,
        total_classes: totalClasses,
        attended_classes: attendedClasses,
      });

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save attendance record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Add / Log Attendance</h3>
            <p className="text-xs text-slate-400">Track held and attended class sessions</p>
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
              Select Course *
            </label>
            <select
              value={courseCode}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900 bg-white"
            >
              <option value="CSE301">CSE301 — Data Structures</option>
              <option value="CSE302">CSE302 — Database Management Systems</option>
              <option value="CSE303">CSE303 — Operating Systems</option>
              <option value="CSE304">CSE304 — Artificial Intelligence</option>
              <option value="MAT301">MAT301 — Discrete Mathematics</option>
              <option value="CSE305L">CSE305L — Systems Programming Lab</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Classes Held *
              </label>
              <input
                type="number"
                min="0"
                required
                value={totalClasses}
                onChange={(e) => setTotalClasses(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Attended Classes *
              </label>
              <input
                type="number"
                min="0"
                required
                value={attendedClasses}
                onChange={(e) => setAttendedClasses(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
            Calculated Attendance:{' '}
            <span className="font-bold text-slate-900 tabular-nums">
              {parseInt(totalClasses, 10) > 0
                ? Math.round((parseInt(attendedClasses, 10) / parseInt(totalClasses, 10)) * 100)
                : 0}
              %
            </span>{' '}
            (Minimum 75% required for exam eligibility)
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
              {isSubmitting ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
