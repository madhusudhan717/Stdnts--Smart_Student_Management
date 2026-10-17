import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Flame,
  CheckSquare,
  CalendarCheck2,
  UserCheck,
  Clock,
  ArrowRight,
  BookOpen,
  FileText,
  AlertCircle,
  Plus,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { DashboardData } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { FocusSessionWidget } from '../components/FocusSessionWidget.tsx';
import { NavView } from '../components/Sidebar.tsx';

interface DashboardViewProps {
  onNavigate: (view: NavView) => void;
  onQuickAdd: (type: 'exam' | 'assignment' | 'note' | 'attendance') => void;
  onViewMaterial: (material: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onQuickAdd,
  onViewMaterial,
}) => {
  const { student } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      const res = await api.get<DashboardData>('/dashboard');
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleToggleAssignment = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
      await api.put(`/assignments/${id}`, { status: newStatus });
      loadDashboard();
    } catch (err) {
      console.error('Failed to update assignment status:', err);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-20 bg-slate-200/60 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-slate-200/60 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-200/60 rounded-2xl animate-pulse" />
          <div className="h-96 bg-slate-200/60 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const { metrics, todaySchedule, upcomingExams, priorityAssignments, recentMaterials } = data;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Welcome Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {student?.program || 'B.Tech CSE'} · Sem {student?.semester || 5}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ID: {student?.student_id || 'STU2026001'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            {getGreeting()}, {student?.full_name?.split(' ')[0] || 'Student'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            You have <strong className="text-slate-900">{metrics.pendingAssignments} pending assignments</strong> and{' '}
            <strong className="text-slate-900">{metrics.upcomingExams} upcoming exams</strong> this semester.
          </p>
        </div>

        {/* Quick action buttons row */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onQuickAdd('assignment')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-slate-600" />
            <span>Add Assignment</span>
          </button>
          <button
            onClick={() => onQuickAdd('exam')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Exam</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics 5-Card Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* GPA */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Cumulative GPA</span>
            <GraduationCap className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight tabular-nums">
              {metrics.gpa.toFixed(2)}
              <span className="text-xs text-slate-400 font-normal ml-1">/ 4.00</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">
              {metrics.isSampleGpa ? 'Sample Academic Data' : 'Calculated Weighted'}
            </p>
          </div>
        </div>

        {/* Streak */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Study Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight tabular-nums">
              {metrics.studyStreakDays}
              <span className="text-xs text-slate-400 font-normal ml-1">Days</span>
            </div>
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5 truncate">
              Consistent active streak
            </p>
          </div>
        </div>

        {/* Pending Assignments */}
        <div
          onClick={() => onNavigate('assignments')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between cursor-pointer hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Assignments</span>
            <CheckSquare className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight tabular-nums">
              {metrics.pendingAssignments}
              <span className="text-xs text-slate-400 font-normal ml-1">Pending</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">
              Nearest due in 3 days
            </p>
          </div>
        </div>

        {/* Upcoming Exams */}
        <div
          onClick={() => onNavigate('exams')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between cursor-pointer hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Upcoming Exams</span>
            <CalendarCheck2 className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight tabular-nums">
              {metrics.upcomingExams}
              <span className="text-xs text-slate-400 font-normal ml-1">Scheduled</span>
            </div>
            <p className="text-[10px] text-rose-600 font-medium mt-0.5 truncate">
              First test Oct 25
            </p>
          </div>
        </div>

        {/* Attendance */}
        <div
          onClick={() => onNavigate('attendance')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between cursor-pointer hover:border-slate-300 transition-colors col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Attendance</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight tabular-nums">
              {metrics.attendancePercentage}%
            </div>
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5 truncate">
              Above 75% threshold
            </p>
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Schedule, Upcoming Exams, Priority Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Schedule */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-600" />
                  <span>Today's Classes & Schedule</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {todaySchedule.day} · Timetable for your registered semester courses
                </p>
              </div>
              <button
                onClick={() => onNavigate('calendar')}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
              >
                <span>Full Timetable</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {todaySchedule.slots.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
                <p className="font-semibold text-slate-700">No scheduled classes for today</p>
                <p className="mt-0.5">Enjoy your free study block or schedule an exam prep session.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todaySchedule.slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/70 border border-slate-200/60 transition-all gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-bold font-mono px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 shrink-0">
                        {slot.start_time} - {slot.end_time}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span>{slot.subject}</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            ({slot.course_code})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {slot.classroom} · {slot.faculty_name}
                        </div>
                      </div>
                    </div>
                    <span className="self-start sm:self-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                      {slot.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Exams Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CalendarCheck2 className="w-4 h-4 text-rose-500" />
                  <span>Upcoming Examination Dates</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calculated days remaining and preparation syllabus
                </p>
              </div>
              <button
                onClick={() => onNavigate('exams')}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
              >
                <span>View All Exams</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {upcomingExams.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
                <p className="font-semibold text-slate-700">No upcoming exams recorded</p>
                <p className="mt-0.5">Click "Schedule Exam" to log your midterm or internal dates.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {upcomingExams.slice(0, 4).map((exam) => (
                  <div
                    key={exam.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[11px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {exam.subject_code}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums ${
                            exam.daysRemaining! <= 3
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {exam.daysRemaining === 0
                            ? 'Today!'
                            : exam.daysRemaining === 1
                            ? 'Tomorrow'
                            : `In ${exam.daysRemaining} days`}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {exam.subject_name}
                      </h4>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {exam.exam_date} · {exam.start_time} - {exam.end_time}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Venue: {exam.venue} · {exam.exam_type}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Prep Status:</span>
                      <span className="font-semibold text-slate-800">
                        {exam.preparation_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Priority Assignments */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                  <span>Priority Assignments & Submissions</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track upcoming task deadlines and progress
                </p>
              </div>
              <button
                onClick={() => onNavigate('assignments')}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
              >
                <span>All Assignments</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {priorityAssignments.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
                <p className="font-semibold text-slate-700">No pending assignments</p>
                <p className="mt-0.5">Great job! All your coursework is up to date.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {priorityAssignments.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/60 border border-slate-200/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={task.status === 'Completed'}
                        onChange={() => handleToggleAssignment(task.id, task.status)}
                        className="rounded text-slate-900 focus:ring-0 cursor-pointer w-4 h-4"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {task.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {task.subject} ({task.subject_code}) · Due {task.due_date}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          task.priority === 'High'
                            ? 'bg-rose-100 text-rose-700'
                            : task.priority === 'Medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Dark Focus Timer Widget + Recent Materials */}
        <div className="space-y-6">
          {/* Dark Focus Session Widget */}
          <FocusSessionWidget
            onSessionComplete={loadDashboard}
            initialCompletedSessions={data.todayFocus.completedSessions}
            initialTotalMinutes={data.todayFocus.totalMinutes}
          />

          {/* Recent Study Materials Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Recent Materials</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Course handouts & slides</p>
              </div>
              <button
                onClick={() => onNavigate('notes')}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-0.5 transition-colors"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {recentMaterials.map((mat) => (
                <div
                  key={mat.id}
                  onClick={() => onViewMaterial(mat)}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 transition-colors cursor-pointer flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {mat.title}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {mat.subject_code} · {mat.file_type} · {mat.file_size}
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
