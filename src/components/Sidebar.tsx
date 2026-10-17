import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck2,
  CheckSquare,
  BookOpen,
  UserCheck,
  GraduationCap,
  FileText,
  Calendar,
  User,
  LogOut,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export type NavView =
  | 'dashboard'
  | 'exams'
  | 'assignments'
  | 'courses'
  | 'attendance'
  | 'grades'
  | 'notes'
  | 'calendar'
  | 'profile';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  pendingAssignmentsCount?: number;
  upcomingExamsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  mobileOpen,
  onCloseMobile,
  pendingAssignmentsCount = 0,
  upcomingExamsCount = 0,
}) => {
  const { student, logout } = useAuth();

  const navItems: { id: NavView; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'exams', label: 'Exam Schedule', icon: CalendarCheck2, badge: upcomingExamsCount },
    { id: 'assignments', label: 'Assignments', icon: CheckSquare, badge: pendingAssignmentsCount },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'attendance', label: 'Attendance', icon: UserCheck },
    { id: 'grades', label: 'Results & Grades', icon: GraduationCap },
    { id: 'notes', label: 'Notes & Materials', icon: FileText },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'profile', label: 'Student Profile', icon: User },
  ];

  const handleNavClick = (view: NavView) => {
    onSelectView(view);
    onCloseMobile();
  };

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold tracking-wider text-base shadow-xs">
            ST
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 tracking-tight leading-none flex items-center gap-1.5">
              STDNTS
              <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600">
                PORTAL
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">Smart Academic System</p>
          </div>
        </div>
        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Academic Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Academic Year Info Banner */}
      <div className="px-4 py-3 mx-3 mb-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Semester 5 · 2026</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5">SQLite Local Storage Active</p>
      </div>

      {/* User Profile & Logout */}
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
          <button
            onClick={() => handleNavClick('profile')}
            className="flex items-center gap-3 text-left min-w-0 flex-1"
          >
            <img
              src={student?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80'}
              alt={student?.full_name || 'Student Avatar'}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {student?.full_name || 'Alex Morgan'}
              </p>
              <p className="text-[11px] text-slate-400 font-mono truncate">
                {student?.student_id || 'STU2026001'}
              </p>
            </div>
          </button>
          <button
            onClick={logout}
            title="Sign out"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 h-screen fixed inset-y-0 left-0 z-30">
        {content}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
