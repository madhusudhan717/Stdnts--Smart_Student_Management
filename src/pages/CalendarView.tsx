import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  User,
  Trash2,
  CalendarCheck2,
} from 'lucide-react';
import { TimetableSlot, Exam, Assignment } from '../types/index.ts';
import { api } from '../services/api.ts';

interface CalendarViewProps {
  onOpenAddClassModal: () => void;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const CalendarView: React.FC<CalendarViewProps> = ({ onOpenAddClassModal }) => {
  const [weeklySchedule, setWeeklySchedule] = useState<Record<string, TimetableSlot[]>>({});
  const [activeDay, setActiveDay] = useState<string>('Monday');
  const [exams, setExams] = useState<Exam[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [timetableRes, examsRes, assignRes] = await Promise.all([
        api.get<{ weekly: Record<string, TimetableSlot[]> }>('/timetable'),
        api.get<{ exams: Exam[] }>('/exams'),
        api.get<{ assignments: Assignment[] }>('/assignments'),
      ]);
      setWeeklySchedule(timetableRes.weekly);
      setExams(examsRes.exams);
      setAssignments(assignRes.assignments);

      // Set today's day if Monday-Saturday
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = days[new Date().getDay()];
      if (today !== 'Sunday') {
        setActiveDay(today);
      }
    } catch (err) {
      console.error('Failed to load timetable:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteSlot = async (id: number) => {
    if (!window.confirm('Remove this class from timetable?')) return;
    try {
      await api.delete(`/timetable/${id}`);
      loadData();
    } catch (err) {
      console.error('Failed to delete timetable slot:', err);
    }
  };

  const daySlots = weeklySchedule[activeDay] || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Weekly Class Schedule & Calendar
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lectures, lab sessions, and classroom allocations for Semester 5
          </p>
        </div>
        <button
          onClick={onOpenAddClassModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Class to Timetable</span>
        </button>
      </div>

      {/* Day Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white rounded-2xl border border-slate-200/80 overflow-x-auto shadow-xs">
        {DAYS_OF_WEEK.map((day) => {
          const count = weeklySchedule[day]?.length || 0;
          const isActive = activeDay === day;
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`flex-1 min-w-[90px] py-2 px-3 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>{day}</span>
              <span
                className={`text-[10px] font-normal font-mono mt-0.5 ${
                  isActive ? 'text-white/80' : 'text-slate-400'
                }`}
              >
                {count} {count === 1 ? 'class' : 'classes'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Timetable for active day */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {activeDay}'s Academic Schedule
            </h3>
            <p className="text-xs text-slate-400">
              {daySlots.length} sessions scheduled
            </p>
          </div>
        </div>

        {daySlots.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No scheduled lectures for {activeDay}</p>
            <p className="mt-0.5">Use this day for independent coursework or revision.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {daySlots.map((slot) => (
              <div
                key={slot.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-4">
                  <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono text-xs font-bold shrink-0">
                    {slot.start_time} - {slot.end_time}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {slot.subject}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700">
                        {slot.course_code}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {slot.classroom}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {slot.faculty_name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">
                    {slot.type}
                  </span>
                  <button
                    onClick={() => handleDeleteSlot(slot.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                    title="Delete timetable slot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cross-reference: Exams & Assignments Due Soon */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Exams happening this month */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <CalendarCheck2 className="w-4 h-4 text-rose-500" />
            <span>Upcoming Exam Dates</span>
          </h4>
          <div className="space-y-2">
            {exams.slice(0, 3).map((e) => (
              <div
                key={e.id}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 block">{e.subject_name}</span>
                  <span className="text-[11px] text-slate-400">
                    {e.exam_date} · {e.start_time} ({e.venue})
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  {e.exam_type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Assignments due this month */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Assignment Deadlines</span>
          </h4>
          <div className="space-y-2">
            {assignments.slice(0, 3).map((a) => (
              <div
                key={a.id}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 block">{a.title}</span>
                  <span className="text-[11px] text-slate-400">
                    {a.subject_code} · Due {a.due_date}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {a.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
