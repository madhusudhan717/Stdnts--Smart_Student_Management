import React, { useState } from 'react';
import { Menu, Plus, Calendar, Bell, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu: () => void;
  onQuickAdd: (type: 'exam' | 'assignment' | 'note' | 'attendance') => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenMobileMenu,
  onQuickAdd,
}) => {
  const { student } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Formatted date
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-400 font-medium hidden sm:block truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Date, Quick Add, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Date display */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{todayFormatted}</span>
        </div>

        {/* Quick Add Button with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Quick Add</span>
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40 text-xs text-slate-700">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onQuickAdd('assignment');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>New Assignment</span>
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onQuickAdd('exam');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Schedule Exam</span>
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onQuickAdd('note');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Create Study Note</span>
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onQuickAdd('attendance');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Log Attendance</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Notifications preview */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors relative"
            aria-label="Academic alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
          </button>

          {notifOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setNotifOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-40 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 font-semibold text-slate-900">
                  <span>Academic Alerts</span>
                  <span className="text-[11px] text-slate-400">Semester 5</span>
                </div>
                <div className="space-y-3 pt-3">
                  <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-100/80">
                    <p className="font-semibold text-amber-900">Midterm Exam in 8 Days</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Data Structures (CSE301) on Oct 25, 10:00 AM in Room 301.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100/80">
                    <p className="font-semibold text-blue-900">Assignment Approaching</p>
                    <p className="text-[11px] text-blue-700 mt-0.5">
                      DSA Problem Set is due in 3 days (Oct 20).
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Student Avatar */}
        <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
          <img
            src={student?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80'}
            alt={student?.full_name || 'Student Avatar'}
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full object-cover border border-slate-200"
          />
        </div>
      </div>
    </header>
  );
};
