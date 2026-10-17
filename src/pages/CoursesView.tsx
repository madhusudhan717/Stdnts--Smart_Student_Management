import React, { useState, useEffect } from 'react';
import { BookOpen, User, Award, CheckCircle, Calendar, ArrowRight, X } from 'lucide-react';
import { Course } from '../types/index.ts';
import { api } from '../services/api.ts';

export const CoursesView: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [totalCredits, setTotalCredits] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadCourses = async () => {
    try {
      const res = await api.get<{ courses: Course[]; totalCredits: number }>('/courses');
      setCourses(res.courses);
      setTotalCredits(res.totalCredits);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Enrolled Academic Courses
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Semester 5 · Total Registered Credits:{' '}
            <strong className="text-slate-900 font-mono">{totalCredits} Credits</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700">
            {courses.length} Active Courses
          </span>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                  {course.code}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  {course.credits} Credits
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {course.name}
              </h3>

              <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Instructor: {course.faculty}</span>
              </div>

              <p className="text-xs text-slate-600 mt-3 line-clamp-2">
                {course.description}
              </p>

              {/* Attendance progress bar */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500">Attendance:</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {course.attendancePercentage}% ({course.attended_classes}/{course.total_classes})
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      (course.attendancePercentage || 0) >= 85
                        ? 'bg-emerald-500'
                        : (course.attendancePercentage || 0) >= 75
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, course.attendancePercentage || 0)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {course.pendingAssignments || 0} tasks pending
              </span>
              <button
                onClick={() => setSelectedCourse(course)}
                className="text-xs font-semibold text-slate-800 hover:text-slate-950 flex items-center gap-1 transition-colors"
              >
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-slate-500">
                  {selectedCourse.code} · {selectedCourse.credits} Credits
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {selectedCourse.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Course Overview & Syllabus</h4>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedCourse.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Primary Faculty</span>
                  <p className="font-bold text-slate-900">{selectedCourse.faculty}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Current Attendance</span>
                  <p className="font-bold text-slate-900">
                    {selectedCourse.attendancePercentage}% ({selectedCourse.attended_classes}/{selectedCourse.total_classes} sessions)
                  </p>
                </div>
              </div>

              {selectedCourse.nextExam && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                  <span className="font-bold block">Next Upcoming Exam</span>
                  <p className="mt-0.5">
                    {selectedCourse.nextExam.subject_name} on {selectedCourse.nextExam.exam_date} ({selectedCourse.nextExam.exam_type}) in {selectedCourse.nextExam.venue}.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedCourse(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
