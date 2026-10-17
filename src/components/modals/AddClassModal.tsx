import React, { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../../services/api.ts';

interface AddClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const AddClassModal: React.FC<AddClassModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [day, setDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'>('Monday');
  const [subject, setSubject] = useState('Data Structures & Algorithms');
  const [courseCode, setCourseCode] = useState('CSE301');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('10:30 AM');
  const [classroom, setClassroom] = useState('Room 301');
  const [facultyName, setFacultyName] = useState('Dr. Robert Lang');
  const [type, setType] = useState<'Lecture' | 'Lab' | 'Tutorial' | 'Seminar'>('Lecture');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubjectChange = (val: string) => {
    setSubject(val);
    switch (val) {
      case 'Data Structures & Algorithms':
        setCourseCode('CSE301');
        setFacultyName('Dr. Robert Lang');
        setClassroom('Room 301');
        break;
      case 'Database Management Systems':
        setCourseCode('CSE302');
        setFacultyName('Prof. Elena Rostova');
        setClassroom('Room 204');
        break;
      case 'Operating Systems':
        setCourseCode('CSE303');
        setFacultyName('Dr. Marcus Vance');
        setClassroom('Room 105');
        break;
      case 'Artificial Intelligence':
        setCourseCode('CSE304');
        setFacultyName('Dr. Sarah Chen');
        setClassroom('Room 302');
        break;
      case 'Discrete Mathematics & Graph Theory':
        setCourseCode('MAT301');
        setFacultyName('Prof. David Kumar');
        setClassroom('Room 210');
        break;
      case 'Systems Programming Lab':
        setCourseCode('CSE305L');
        setFacultyName('Prof. Elena Rostova');
        setClassroom('Computing Lab 4');
        setType('Lab');
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await api.post('/timetable', {
        day,
        subject,
        course_code: courseCode,
        start_time: startTime,
        end_time: endTime,
        classroom,
        faculty_name: facultyName,
        type,
      });

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add class slot');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Add Class to Timetable</h3>
            <p className="text-xs text-slate-400">Schedule lecture, laboratory, or tutorial session</p>
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
                Day of Week *
              </label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900 bg-white"
              >
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Class Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900 bg-white"
              >
                <option value="Lecture">Lecture</option>
                <option value="Lab">Laboratory</option>
                <option value="Tutorial">Tutorial</option>
                <option value="Seminar">Seminar</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Subject *
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Time *
              </label>
              <input
                type="text"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                End Time *
              </label>
              <input
                type="text"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Classroom / Hall *
              </label>
              <input
                type="text"
                required
                value={classroom}
                onChange={(e) => setClassroom(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Faculty Instructor
              </label>
              <input
                type="text"
                value={facultyName}
                onChange={(e) => setFacultyName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
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
              {isSubmitting ? 'Saving...' : 'Add Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
