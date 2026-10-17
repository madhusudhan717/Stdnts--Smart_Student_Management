import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  UserX,
} from 'lucide-react';
import { AttendanceRecord } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AttendanceViewProps {
  onOpenAddModal: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ onOpenAddModal }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<{
    overallPercentage: number;
    totalClasses: number;
    totalAttended: number;
    totalMissed: number;
    isCompliant: boolean;
  }>({
    overallPercentage: 92,
    totalClasses: 156,
    totalAttended: 144,
    totalMissed: 12,
    isCompliant: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadAttendance = async () => {
    try {
      const res = await api.get<{
        records: AttendanceRecord[];
        summary: any;
      }>('/attendance');
      setRecords(res.records);
      setSummary(res.summary);
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const handleQuickAction = async (id: number, action: 'mark_present' | 'mark_absent') => {
    try {
      await api.put(`/attendance/${id}`, { action });
      loadAttendance();
    } catch (err) {
      console.error('Failed to update attendance:', err);
    }
  };

  const handleDeleteRecord = async (id: number) => {
    if (!window.confirm('Delete this course attendance entry?')) return;
    try {
      await api.delete(`/attendance/${id}`);
      loadAttendance();
    } catch (err) {
      console.error('Failed to delete attendance record:', err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Academic Attendance Tracker
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Minimum 75% attendance is required to qualify for semester examinations
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Course Attendance</span>
        </button>
      </div>

      {/* Aggregate Overview Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-2xl font-mono shrink-0 border border-emerald-100">
              {summary.overallPercentage}%
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900">
                  Overall Academic Attendance
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Eligible (&gt;75%)</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Total Classes: {summary.totalClasses} · Attended: {summary.totalAttended} · Missed: {summary.totalMissed}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Attendance Threshold</span>
              <span className="text-xs font-bold text-slate-900">75% Institutional Minimum</span>
            </div>
          </div>
        </div>
      </div>

      {/* Course Attendance List */}
      <div className="space-y-3">
        {records.map((rec) => {
          const isCritical = (rec.percentage || 0) < 75;
          return (
            <div
              key={rec.id}
              className={`p-4 sm:p-5 rounded-2xl border bg-white shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isCritical
                  ? 'border-rose-300 ring-1 ring-rose-300/40'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                    {rec.course_code}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      (rec.percentage || 0) >= 85
                        ? 'bg-emerald-100 text-emerald-800'
                        : (rec.percentage || 0) >= 75
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {rec.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{rec.course_name}</h3>

                {isCritical && rec.classesNeededFor75 && rec.classesNeededFor75 > 0 && (
                  <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Must attend the next {rec.classesNeededFor75} consecutive classes to reach 75%.
                    </span>
                  </p>
                )}

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3 max-w-md">
                  <div
                    className={`h-full rounded-full ${
                      (rec.percentage || 0) >= 85
                        ? 'bg-emerald-500'
                        : (rec.percentage || 0) >= 75
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, rec.percentage || 0)}%` }}
                  />
                </div>
              </div>

              {/* Numbers & Live Mark Buttons */}
              <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                <div className="text-right">
                  <div className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                    {rec.percentage}%
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    {rec.attended_classes} / {rec.total_classes} held
                  </span>
                </div>

                {/* Quick Live Actions for testing */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleQuickAction(rec.id, 'mark_present')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors border border-emerald-200"
                    title="Mark class attended (+1 present)"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Present (+1)</span>
                  </button>
                  <button
                    onClick={() => handleQuickAction(rec.id, 'mark_absent')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold transition-colors border border-rose-200"
                    title="Mark class missed (+1 absent)"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Absent</span>
                  </button>
                  <button
                    onClick={() => handleDeleteRecord(rec.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors ml-1"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
