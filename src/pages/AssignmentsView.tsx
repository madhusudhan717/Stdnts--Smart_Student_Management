import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Search,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Assignment } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AssignmentsViewProps {
  onOpenAddModal: () => void;
  onEditAssignment: (assignment: Assignment) => void;
}

export const AssignmentsView: React.FC<AssignmentsViewProps> = ({
  onOpenAddModal,
  onEditAssignment,
}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadAssignments = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);

      const res = await api.get<{ assignments: Assignment[]; pendingCount: number; completedCount: number }>(
        `/assignments?${params.toString()}`
      );
      setAssignments(res.assignments);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [search, statusFilter, priorityFilter]);

  const handleDeleteAssignment = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await api.delete(`/assignments/${id}`);
      loadAssignments();
    } catch (err) {
      console.error('Failed to delete assignment:', err);
    }
  };

  const handleToggleStatus = async (assignment: Assignment) => {
    try {
      const newStatus = assignment.status === 'Completed' ? 'Pending' : 'Completed';
      await api.put(`/assignments/${assignment.id}`, { status: newStatus });
      loadAssignments();
    } catch (err) {
      console.error('Failed to update assignment status:', err);
    }
  };

  const handlePriorityChange = async (assignment: Assignment, newPriority: string) => {
    try {
      await api.put(`/assignments/${assignment.id}`, { priority: newPriority });
      loadAssignments();
    } catch (err) {
      console.error('Failed to update priority:', err);
    }
  };

  const pendingCount = assignments.filter((a) => a.status !== 'Completed').length;
  const completedCount = assignments.filter((a) => a.status === 'Completed').length;
  const overdueCount = assignments.filter((a) => a.isOverdue).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Assignments & Course Tasks
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track coursework deadlines, priority deliverables, and submission links
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Assignment</span>
        </button>
      </div>

      {/* Quick Summary Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Tasks</span>
          <p className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {assignments.length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-medium text-amber-600">Pending / In Progress</span>
          <p className="text-xl font-bold font-mono text-amber-700 mt-1 tabular-nums">
            {pendingCount}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-medium text-emerald-600">Completed</span>
          <p className="text-xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
            {completedCount}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-medium text-rose-600">Overdue</span>
          <p className="text-xl font-bold font-mono text-rose-700 mt-1 tabular-nums">
            {overdueCount}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search assignments by title, description, or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-slate-900"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-slate-900"
          >
            <option value="all">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-3">
        {assignments.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
            <CheckSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">No Assignments Found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You have no assignments matching this filter. Click "New Assignment" to add a course task.
            </p>
          </div>
        ) : (
          assignments.map((assignment) => (
            <div
              key={assignment.id}
              className={`p-4 rounded-2xl border bg-white shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                assignment.status === 'Completed'
                  ? 'border-slate-200/60 opacity-75'
                  : assignment.isOverdue
                  ? 'border-rose-300 bg-rose-50/20'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {/* Checkbox and main details */}
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <input
                  type="checkbox"
                  checked={assignment.status === 'Completed'}
                  onChange={() => handleToggleStatus(assignment)}
                  className="rounded text-slate-900 focus:ring-0 mt-1 w-4 h-4 cursor-pointer"
                  title="Mark as completed / pending"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {assignment.subject_code}
                    </span>
                    <span className="text-xs text-slate-500">
                      {assignment.subject}
                    </span>
                    {assignment.isOverdue && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                        Overdue
                      </span>
                    )}
                    {assignment.isApproaching && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        Due in {assignment.daysLeft} {assignment.daysLeft === 1 ? 'day' : 'days'}
                      </span>
                    )}
                  </div>

                  <h3
                    className={`text-sm font-bold text-slate-900 leading-snug ${
                      assignment.status === 'Completed' ? 'line-through text-slate-400' : ''
                    }`}
                  >
                    {assignment.title}
                  </h3>

                  {assignment.description && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {assignment.description}
                    </p>
                  )}

                  {assignment.submission_notes && (
                    <p className="text-[11px] text-slate-400 mt-1 italic">
                      Submission Notes: {assignment.submission_notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Due date, priority badge, and controls */}
              <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                <div className="text-right">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{assignment.due_date}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {assignment.due_time}
                  </span>
                </div>

                {/* Priority Selector */}
                <select
                  value={assignment.priority}
                  onChange={(e) => handlePriorityChange(assignment, e.target.value)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border focus:outline-none ${
                    assignment.priority === 'High'
                      ? 'border-rose-200 bg-rose-50 text-rose-700'
                      : assignment.priority === 'Medium'
                      ? 'border-amber-200 bg-amber-50 text-amber-800'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditAssignment(assignment)}
                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit assignment"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAssignment(assignment.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete assignment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
