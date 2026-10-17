import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { GradeItem } from '../../types/index.ts';
import { api } from '../../services/api.ts';

interface AddGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  gradeToEdit?: GradeItem | null;
}

export const AddGradeModal: React.FC<AddGradeModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  gradeToEdit,
}) => {
  const [courseCode, setCourseCode] = useState('CSE301');
  const [courseName, setCourseName] = useState('Data Structures & Algorithms');
  const [semester, setSemester] = useState('5');
  const [credits, setCredits] = useState('4');
  const [marksObtained, setMarksObtained] = useState('92');
  const [maxMarks, setMaxMarks] = useState('100');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (gradeToEdit) {
      setCourseCode(gradeToEdit.course_code);
      setCourseName(gradeToEdit.course_name);
      setSemester(String(gradeToEdit.semester));
      setCredits(String(gradeToEdit.credits));
      setMarksObtained(String(gradeToEdit.marks_obtained));
      setMaxMarks(String(gradeToEdit.max_marks));
    } else {
      setCourseCode('CSE301');
      setCourseName('Data Structures & Algorithms');
      setSemester('5');
      setCredits('4');
      setMarksObtained('90');
      setMaxMarks('100');
    }
    setError(null);
  }, [gradeToEdit, isOpen]);

  if (!isOpen) return null;

  const calculatePreview = () => {
    const marks = parseFloat(marksObtained) || 0;
    const max = parseFloat(maxMarks) || 100;
    const pct = max > 0 ? (marks / max) * 100 : 0;
    if (pct >= 90) return { grade: 'A+', points: 4.0 };
    if (pct >= 85) return { grade: 'A', points: 3.7 };
    if (pct >= 80) return { grade: 'B+', points: 3.3 };
    if (pct >= 75) return { grade: 'B', points: 3.0 };
    if (pct >= 70) return { grade: 'C+', points: 2.7 };
    if (pct >= 65) return { grade: 'C', points: 2.3 };
    if (pct >= 60) return { grade: 'D', points: 2.0 };
    return { grade: 'F', points: 0.0 };
  };

  const preview = calculatePreview();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        course_code: courseCode,
        course_name: courseName,
        semester: parseInt(semester, 10),
        credits: parseInt(credits, 10),
        marks_obtained: parseFloat(marksObtained),
        max_marks: parseFloat(maxMarks),
        grade: preview.grade,
        grade_point: preview.points,
      };

      if (gradeToEdit) {
        await api.put(`/grades/${gradeToEdit.id}`, payload);
      } else {
        await api.post('/grades', payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save grade record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {gradeToEdit ? 'Edit Academic Grade' : 'Add Course Grade'}
            </h3>
            <p className="text-xs text-slate-400">Record semester marks and calculate GPA</p>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Course Code *
              </label>
              <input
                type="text"
                required
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Semester *
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900 bg-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Course Title *
            </label>
            <input
              type="text"
              required
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Credits *
              </label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Marks Got *
              </label>
              <input
                type="number"
                min="0"
                required
                value={marksObtained}
                onChange={(e) => setMarksObtained(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Max Marks *
              </label>
              <input
                type="number"
                min="1"
                required
                value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          {/* Auto calculated grade preview */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500">Calculated Letter Grade:</span>
              <span className="font-bold text-slate-900 text-sm ml-2">{preview.grade}</span>
            </div>
            <div>
              <span className="text-slate-500">Grade Point:</span>
              <span className="font-bold text-slate-900 text-sm ml-2">{preview.points.toFixed(1)} / 4.0</span>
            </div>
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
              {isSubmitting ? 'Saving...' : gradeToEdit ? 'Save Changes' : 'Record Grade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
