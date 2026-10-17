import React, { useState, useEffect } from 'react';
import {
  CalendarCheck2,
  Search,
  Plus,
  Clock,
  MapPin,
  FileText,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Filter,
} from 'lucide-react';
import { Exam } from '../types/index.ts';
import { api } from '../services/api.ts';

interface ExamsViewProps {
  onOpenAddModal: () => void;
  onEditExam: (exam: Exam) => void;
}

export const ExamsView: React.FC<ExamsViewProps> = ({
  onOpenAddModal,
  onEditExam,
}) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [pastExams, setPastExams] = useState<Exam[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isLoading, setIsLoading] = useState(true);

  const loadExams = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (subjectFilter !== 'all') params.set('subject', subjectFilter);

      const res = await api.get<{ exams: Exam[]; upcoming: Exam[]; past: Exam[] }>(
        `/exams?${params.toString()}`
      );
      setExams(res.exams);
      setUpcomingExams(res.upcoming);
      setPastExams(res.past);
    } catch (err) {
      console.error('Failed to load exams:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, [search, typeFilter, subjectFilter]);

  const handleDeleteExam = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this exam record?')) return;
    try {
      await api.delete(`/exams/${id}`);
      loadExams();
    } catch (err) {
      console.error('Failed to delete exam:', err);
    }
  };

  const handleToggleChecklist = async (exam: Exam, itemId: string) => {
    try {
      const updatedChecklist = (exam.syllabus_checklist || []).map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );
      await api.put(`/exams/${exam.id}`, { syllabus_checklist: updatedChecklist });
      loadExams();
    } catch (err) {
      console.error('Failed to update syllabus checklist:', err);
    }
  };

  const handleStatusChange = async (exam: Exam, newStatus: string) => {
    try {
      await api.put(`/exams/${exam.id}`, { preparation_status: newStatus });
      loadExams();
    } catch (err) {
      console.error('Failed to update prep status:', err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Upcoming Exams & Schedule
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage Midterms, Internals, and Semester tests with syllabus checklists & countdowns
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Exam</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search exams by subject name, code, or topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Exam Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-slate-900"
          >
            <option value="all">All Exam Types</option>
            <option value="Midterm">Midterm</option>
            <option value="Internal">Internal</option>
            <option value="Practical">Practical</option>
            <option value="Semester">Semester</option>
          </select>

          {/* Subject filter */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-slate-900"
          >
            <option value="all">All Subjects</option>
            <option value="CSE301">CSE301 - Data Structures</option>
            <option value="CSE302">CSE302 - DBMS</option>
            <option value="CSE303">CSE303 - Operating Systems</option>
            <option value="CSE304">CSE304 - Artificial Intelligence</option>
            <option value="MAT301">MAT301 - Discrete Math</option>
          </select>
        </div>
      </div>

      {/* Main Section: Upcoming Exams */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck2 className="w-4 h-4 text-rose-500" />
            <span>Upcoming Exams ({upcomingExams.length})</span>
          </h3>
          <span className="text-xs text-slate-400">
            Dates sorted chronologically
          </span>
        </div>

        {upcomingExams.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
            <CalendarCheck2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">No Upcoming Exams Found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are currently no exams matching your search or filters. Click "Schedule New Exam" to log an exam.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {upcomingExams.map((exam) => {
              const checklist = exam.syllabus_checklist || [];
              const completedCount = checklist.filter((i) => i.completed).length;

              return (
                <div
                  key={exam.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                    exam.isHappeningSoon
                      ? 'border-amber-300/80 ring-1 ring-amber-300/40'
                      : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div>
                    {/* Header line: code, countdown badge, actions */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                          {exam.subject_code}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {exam.exam_type}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full tabular-nums ${
                            exam.daysRemaining! <= 3
                              ? 'bg-rose-100 text-rose-700 animate-pulse'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {exam.daysRemaining === 0
                            ? 'Exam Today!'
                            : exam.daysRemaining === 1
                            ? 'Tomorrow'
                            : `${exam.daysRemaining} days remaining`}
                        </span>

                        <button
                          onClick={() => onEditExam(exam)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit exam"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExam(exam.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete exam"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 mt-1">
                      {exam.subject_name}
                    </h4>

                    {/* Meta info grid */}
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{exam.exam_date} · {exam.start_time} - {exam.end_time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Venue: {exam.venue}</span>
                      </div>
                    </div>

                    {/* Topics */}
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <span className="font-semibold text-slate-700">Topics: </span>
                      <span className="text-slate-600">{exam.topics}</span>
                    </div>

                    {/* Syllabus Checklist preview */}
                    {checklist.length > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                          <span>Preparation Checklist</span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {completedCount}/{checklist.length} completed
                          </span>
                        </div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {checklist.map((item) => (
                            <label
                              key={item.id}
                              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 text-xs cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={item.completed}
                                onChange={() => handleToggleChecklist(exam, item.id)}
                                className="rounded text-slate-900 focus:ring-0"
                              />
                              <span
                                className={`truncate ${
                                  item.completed ? 'line-through text-slate-400' : 'text-slate-700'
                                }`}
                              >
                                {item.text}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {exam.notes && (
                      <p className="text-[11px] text-slate-400 italic mt-2">
                        Note: {exam.notes}
                      </p>
                    )}
                  </div>

                  {/* Footer status selector */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Readiness:</span>
                    <select
                      value={exam.preparation_status}
                      onChange={(e) => handleStatusChange(exam, e.target.value)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:outline-none"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Ready">Ready</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past / Completed Exams Accordion */}
      {pastExams.length > 0 && (
        <div className="pt-4">
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Past & Completed Examinations ({pastExams.length})</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pastExams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white/80 p-4 rounded-xl border border-slate-200/60 opacity-80 hover:opacity-100 transition-opacity"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-slate-500">{exam.subject_code}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Concluded
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">{exam.subject_name}</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Held on {exam.exam_date} · {exam.venue}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
