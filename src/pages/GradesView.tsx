import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  Info,
  Award,
} from 'lucide-react';
import { GradeItem, SemesterGradeGroup } from '../types/index.ts';
import { api } from '../services/api.ts';

interface GradesViewProps {
  onOpenAddModal: () => void;
  onEditGrade: (grade: GradeItem) => void;
}

export const GradesView: React.FC<GradesViewProps> = ({
  onOpenAddModal,
  onEditGrade,
}) => {
  const [cumulativeGpa, setCumulativeGpa] = useState<number>(3.84);
  const [cumulativeCredits, setCumulativeCredits] = useState<number>(37);
  const [semesters, setSemesters] = useState<SemesterGradeGroup[]>([]);
  const [totalCourses, setTotalCourses] = useState<number>(9);
  const [gradingNote, setGradingNote] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const loadGrades = async () => {
    try {
      const res = await api.get<{
        cumulativeGpa: number;
        cumulativeCredits: number;
        totalCourses: number;
        semesters: SemesterGradeGroup[];
        gradingScaleNote: string;
      }>('/grades');
      setCumulativeGpa(res.cumulativeGpa);
      setCumulativeCredits(res.cumulativeCredits);
      setTotalCourses(res.totalCourses);
      setSemesters(res.semesters);
      setGradingNote(res.gradingScaleNote);
    } catch (err) {
      console.error('Failed to load grades:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGrades();
  }, []);

  const handleDeleteGrade = async (id: number) => {
    if (!window.confirm('Delete this grade record?')) return;
    try {
      await api.delete(`/grades/${id}`);
      loadGrades();
    } catch (err) {
      console.error('Failed to delete grade:', err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Academic Performance & Results
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Semester transcripts, credit points, and cumulative grade point average
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Record Course Grade</span>
        </button>
      </div>

      {/* GPA Aggregate Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-2xl font-mono shrink-0 border border-blue-100">
              {cumulativeGpa.toFixed(2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900">
                  Cumulative Grade Point Average (CGPA)
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  Scale 4.00
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Total Earned Credits: <strong className="text-slate-900 font-mono">{cumulativeCredits}</strong> across {totalCourses} courses
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 max-w-md flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span className="text-[11px] leading-relaxed">
              {gradingNote || 'Calculated using standard 4.0 weighted credit grade point method.'}
            </span>
          </div>
        </div>
      </div>

      {/* Semesters Grouping */}
      <div className="space-y-6">
        {semesters.map((group) => (
          <div
            key={group.semester}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
          >
            {/* Semester Header */}
            <div className="p-4 sm:px-6 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Semester {group.semester} Results
                </h3>
                <span className="text-xs text-slate-500">
                  {group.courses.length} courses · {group.totalCredits} Credits
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Semester GPA</span>
                <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
                  {group.semesterGpa.toFixed(2)} / 4.00
                </span>
              </div>
            </div>

            {/* Courses Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 text-slate-400 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-4 sm:px-6">Course</th>
                    <th className="py-2.5 px-4">Credits</th>
                    <th className="py-2.5 px-4">Marks</th>
                    <th className="py-2.5 px-4">Percentage</th>
                    <th className="py-2.5 px-4">Letter Grade</th>
                    <th className="py-2.5 px-4">Grade Point</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {group.courses.map((course) => (
                    <tr key={course.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 sm:px-6 font-medium text-slate-900">
                        <div className="font-bold">{course.course_name}</div>
                        <span className="font-mono text-[11px] text-slate-400">
                          {course.course_code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {course.credits}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-800 tabular-nums">
                        {course.marks_obtained} / {course.max_marks}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 tabular-nums">
                        {course.percentage}%
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                          {course.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 tabular-nums">
                        {course.grade_point.toFixed(1)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditGrade(course)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit grade record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteGrade(course.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete grade record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
