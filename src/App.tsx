import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Login } from './pages/Login.tsx';
import { Sidebar, NavView } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';

// Pages
import { DashboardView } from './pages/DashboardView.tsx';
import { ExamsView } from './pages/ExamsView.tsx';
import { AssignmentsView } from './pages/AssignmentsView.tsx';
import { CoursesView } from './pages/CoursesView.tsx';
import { AttendanceView } from './pages/AttendanceView.tsx';
import { GradesView } from './pages/GradesView.tsx';
import { NotesView } from './pages/NotesView.tsx';
import { CalendarView } from './pages/CalendarView.tsx';
import { ProfileView } from './pages/ProfileView.tsx';

// Modals
import { AddExamModal } from './components/modals/AddExamModal.tsx';
import { AddAssignmentModal } from './components/modals/AddAssignmentModal.tsx';
import { AddNoteModal } from './components/modals/AddNoteModal.tsx';
import { AddAttendanceModal } from './components/modals/AddAttendanceModal.tsx';
import { AddGradeModal } from './components/modals/AddGradeModal.tsx';
import { AddClassModal } from './components/modals/AddClassModal.tsx';
import { ViewDocumentModal } from './components/modals/ViewDocumentModal.tsx';

import { Exam, Assignment, StudyNote, GradeItem, StudyMaterial } from './types/index.ts';

function MainApp() {
  const { isAuthenticated, isLoading, student } = useAuth();
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal States
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [examToEdit, setExamToEdit] = useState<Exam | null>(null);

  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [assignmentToEdit, setAssignmentToEdit] = useState<Assignment | null>(null);

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<StudyNote | null>(null);

  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);

  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [gradeToEdit, setGradeToEdit] = useState<GradeItem | null>(null);

  const [classModalOpen, setClassModalOpen] = useState(false);

  const [viewingMaterial, setViewingMaterial] = useState<StudyMaterial | null>(null);

  // Key to force refresh child views when a modal modifies data
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Connecting to Student Portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const handleQuickAdd = (type: 'exam' | 'assignment' | 'note' | 'attendance') => {
    switch (type) {
      case 'exam':
        setExamToEdit(null);
        setExamModalOpen(true);
        break;
      case 'assignment':
        setAssignmentToEdit(null);
        setAssignmentModalOpen(true);
        break;
      case 'note':
        setNoteToEdit(null);
        setNoteModalOpen(true);
        break;
      case 'attendance':
        setAttendanceModalOpen(true);
        break;
    }
  };

  const getPageMeta = (): { title: string; subtitle?: string } => {
    switch (currentView) {
      case 'dashboard':
        return {
          title: 'Dashboard Overview',
          subtitle: `Welcome back, ${student?.full_name || 'Student'} · Semester ${student?.semester || 5}`,
        };
      case 'exams':
        return {
          title: 'Examination Schedule',
          subtitle: 'Upcoming midterms, internal assessments, and preparation checklists',
        };
      case 'assignments':
        return {
          title: 'Assignments & Coursework',
          subtitle: 'Track assignments, deadlines, priority tasks, and submission links',
        };
      case 'courses':
        return {
          title: 'Academic Courses',
          subtitle: 'Enrolled subjects, credit allocations, and faculty instructors',
        };
      case 'attendance':
        return {
          title: 'Attendance Tracker',
          subtitle: 'Monitor held and attended classes with 75% eligibility compliance',
        };
      case 'grades':
        return {
          title: 'Academic Transcripts & Grades',
          subtitle: 'Semester grades, grade points, and cumulative 4.0 GPA calculation',
        };
      case 'notes':
        return {
          title: 'Notes & Study Resources',
          subtitle: 'Course revision notes, downloadable handouts, and lecture slides',
        };
      case 'calendar':
        return {
          title: 'Timetable & Calendar',
          subtitle: 'Weekly class schedule, lecture halls, and academic dates',
        };
      case 'profile':
        return {
          title: 'Student Profile & Details',
          subtitle: 'Identity verification, enrollment metadata, and contact preferences',
        };
      default:
        return { title: 'Academic Portal' };
    }
  };

  const meta = getPageMeta();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <Header
          title={meta.title}
          subtitle={meta.subtitle}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onQuickAdd={handleQuickAdd}
        />

        <main className="flex-1 pb-16">
          {currentView === 'dashboard' && (
            <DashboardView
              key={refreshKey}
              onNavigate={setCurrentView}
              onQuickAdd={handleQuickAdd}
              onViewMaterial={(mat) => setViewingMaterial(mat)}
            />
          )}

          {currentView === 'exams' && (
            <ExamsView
              key={refreshKey}
              onOpenAddModal={() => {
                setExamToEdit(null);
                setExamModalOpen(true);
              }}
              onEditExam={(exam) => {
                setExamToEdit(exam);
                setExamModalOpen(true);
              }}
            />
          )}

          {currentView === 'assignments' && (
            <AssignmentsView
              key={refreshKey}
              onOpenAddModal={() => {
                setAssignmentToEdit(null);
                setAssignmentModalOpen(true);
              }}
              onEditAssignment={(assignment) => {
                setAssignmentToEdit(assignment);
                setAssignmentModalOpen(true);
              }}
            />
          )}

          {currentView === 'courses' && <CoursesView key={refreshKey} />}

          {currentView === 'attendance' && (
            <AttendanceView
              key={refreshKey}
              onOpenAddModal={() => setAttendanceModalOpen(true)}
            />
          )}

          {currentView === 'grades' && (
            <GradesView
              key={refreshKey}
              onOpenAddModal={() => {
                setGradeToEdit(null);
                setGradeModalOpen(true);
              }}
              onEditGrade={(g) => {
                setGradeToEdit(g);
                setGradeModalOpen(true);
              }}
            />
          )}

          {currentView === 'notes' && (
            <NotesView
              key={refreshKey}
              onOpenAddNoteModal={() => {
                setNoteToEdit(null);
                setNoteModalOpen(true);
              }}
              onEditNote={(n) => {
                setNoteToEdit(n);
                setNoteModalOpen(true);
              }}
              onViewMaterial={(mat) => setViewingMaterial(mat)}
            />
          )}

          {currentView === 'calendar' && (
            <CalendarView
              key={refreshKey}
              onOpenAddClassModal={() => setClassModalOpen(true)}
            />
          )}

          {currentView === 'profile' && <ProfileView key={refreshKey} />}
        </main>
      </div>

      {/* Global Modals */}
      <AddExamModal
        isOpen={examModalOpen}
        onClose={() => setExamModalOpen(false)}
        onSaved={triggerRefresh}
        examToEdit={examToEdit}
      />

      <AddAssignmentModal
        isOpen={assignmentModalOpen}
        onClose={() => setAssignmentModalOpen(false)}
        onSaved={triggerRefresh}
        assignmentToEdit={assignmentToEdit}
      />

      <AddNoteModal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        onSaved={triggerRefresh}
        noteToEdit={noteToEdit}
      />

      <AddAttendanceModal
        isOpen={attendanceModalOpen}
        onClose={() => setAttendanceModalOpen(false)}
        onSaved={triggerRefresh}
      />

      <AddGradeModal
        isOpen={gradeModalOpen}
        onClose={() => setGradeModalOpen(false)}
        onSaved={triggerRefresh}
        gradeToEdit={gradeToEdit}
      />

      <AddClassModal
        isOpen={classModalOpen}
        onClose={() => setClassModalOpen(false)}
        onSaved={triggerRefresh}
      />

      <ViewDocumentModal
        isOpen={!!viewingMaterial}
        onClose={() => setViewingMaterial(null)}
        material={viewingMaterial}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
