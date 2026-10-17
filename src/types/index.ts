export interface Student {
  id: number;
  student_id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  program: string;
  semester: number;
  academic_year: string;
  department: string;
  batch?: string;
  phone?: string;
  address?: string;
  created_at?: string;
}

export interface SyllabusItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Exam {
  id: number;
  student_id: string;
  subject_name: string;
  subject_code: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  exam_type: 'Midterm' | 'Internal' | 'Practical' | 'Semester';
  venue: string;
  topics: string;
  preparation_status: 'Not Started' | 'In Progress' | 'Ready' | 'Completed';
  syllabus_checklist: SyllabusItem[];
  notes?: string;
  daysRemaining?: number;
  isPast?: boolean;
  isHappeningSoon?: boolean;
  created_at?: string;
}

export interface Assignment {
  id: number;
  student_id: string;
  title: string;
  subject: string;
  subject_code: string;
  description?: string;
  due_date: string;
  due_time: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  submission_notes?: string;
  daysLeft?: number;
  isOverdue?: boolean;
  isApproaching?: boolean;
  created_at?: string;
}

export interface Course {
  id: number;
  code: string;
  name: string;
  faculty: string;
  credits: number;
  color?: string;
  description?: string;
  attended_classes?: number;
  total_classes?: number;
  attendancePercentage?: number;
  pendingAssignments?: number;
  nextExam?: Exam | null;
}

export interface TimetableSlot {
  id: number;
  student_id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  subject: string;
  course_code: string;
  start_time: string;
  end_time: string;
  classroom: string;
  faculty_name: string;
  type: 'Lecture' | 'Lab' | 'Tutorial' | 'Seminar';
}

export interface AttendanceRecord {
  id: number;
  student_id: string;
  course_code: string;
  course_name: string;
  total_classes: number;
  attended_classes: number;
  percentage?: number;
  missed_classes?: number;
  status?: 'Excellent' | 'Good' | 'Critical';
  classesNeededFor75?: number;
  last_updated?: string;
}

export interface GradeItem {
  id: number;
  student_id: string;
  course_code: string;
  course_name: string;
  semester: number;
  credits: number;
  marks_obtained: number;
  max_marks: number;
  grade: string;
  grade_point: number;
  percentage?: number;
}

export interface SemesterGradeGroup {
  semester: number;
  courses: GradeItem[];
  totalCredits: number;
  semesterGpa: number;
}

export interface StudyNote {
  id: number;
  student_id: string;
  title: string;
  subject: string;
  subject_code: string;
  content: string;
  tags: string[];
  created_at?: string;
  updated_at?: string;
}

export interface StudyMaterial {
  id: number;
  student_id: string;
  title: string;
  subject: string;
  subject_code: string;
  description: string;
  file_type: 'PDF' | 'Slide Deck' | 'Code Zip' | 'Notes Doc' | 'Link';
  file_url: string;
  file_size: string;
  created_at?: string;
}

export interface FocusSession {
  id: number;
  student_id: string;
  session_type: string;
  duration_minutes: number;
  subject?: string;
  notes?: string;
  completed_at: string;
}

export interface DashboardMetrics {
  gpa: number;
  maxGpa: number;
  isSampleGpa: boolean;
  studyStreakDays: number;
  pendingAssignments: number;
  upcomingExams: number;
  attendancePercentage: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  todaySchedule: {
    day: string;
    slots: TimetableSlot[];
  };
  upcomingExams: Exam[];
  priorityAssignments: Assignment[];
  recentMaterials: StudyMaterial[];
  latestGrades: GradeItem[];
  todayFocus: {
    completedSessions: number;
    totalMinutes: number;
  };
}
