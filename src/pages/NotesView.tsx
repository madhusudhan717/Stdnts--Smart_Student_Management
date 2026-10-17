import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Plus,
  Download,
  Eye,
  Trash2,
  Edit2,
  Tag,
  BookOpen,
} from 'lucide-react';
import { StudyNote, StudyMaterial } from '../types/index.ts';
import { api } from '../services/api.ts';

interface NotesViewProps {
  onOpenAddNoteModal: () => void;
  onEditNote: (note: StudyNote) => void;
  onViewMaterial: (material: StudyMaterial) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  onOpenAddNoteModal,
  onEditNote,
  onViewMaterial,
}) => {
  const [tab, setTab] = useState<'notes' | 'materials'>('notes');
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (subjectFilter !== 'all') params.set('subject', subjectFilter);

      const [notesRes, materialsRes] = await Promise.all([
        api.get<{ notes: StudyNote[] }>(`/notes?${params.toString()}`),
        api.get<{ materials: StudyMaterial[] }>(`/materials?${params.toString()}`),
      ]);
      setNotes(notesRes.notes);
      setMaterials(materialsRes.materials);
    } catch (err) {
      console.error('Failed to load notes & materials:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, subjectFilter]);

  const handleDeleteNote = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this study note?')) return;
    try {
      await api.delete(`/notes/${id}`);
      loadData();
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const handleDeleteMaterial = async (id: number) => {
    if (!window.confirm('Delete this study resource reference?')) return;
    try {
      await api.delete(`/materials/${id}`);
      loadData();
    } catch (err) {
      console.error('Failed to delete material:', err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Notes & Study Materials
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Course revision summaries, lecture slides, and digital handouts
          </p>
        </div>
        <button
          onClick={onOpenAddNoteModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Study Note</span>
        </button>
      </div>

      {/* Tabs and Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200/80 w-fit">
          <button
            onClick={() => setTab('notes')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === 'notes'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Study Notes ({notes.length})
          </button>
          <button
            onClick={() => setTab('materials')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === 'materials'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Course Materials & Slides ({materials.length})
          </button>
        </div>

        {/* Search and Subject filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Search notes or materials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-slate-900"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:border-slate-900"
          >
            <option value="all">All Courses</option>
            <option value="CSE301">CSE301 - Data Structures</option>
            <option value="CSE302">CSE302 - DBMS</option>
            <option value="CSE303">CSE303 - Operating Systems</option>
            <option value="CSE304">CSE304 - Artificial Intelligence</option>
            <option value="MAT301">MAT301 - Discrete Math</option>
            <option value="CSE305L">CSE305L - Systems Lab</option>
          </select>
        </div>
      </div>

      {/* Content Rendering based on active tab */}
      {tab === 'notes' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.length === 0 ? (
            <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No Study Notes Found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Capture your first lecture note, formula, or exam summary by clicking "Create Study Note".
              </p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {note.subject_code}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditNote(note)}
                        className="p-1 text-slate-400 hover:text-slate-800 rounded-md transition-colors"
                        title="Edit note"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {note.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{note.subject}</p>

                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 font-mono text-xs text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                    {note.content}
                  </div>
                </div>

                {note.tags && note.tags.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1">
                    {note.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.length === 0 ? (
            <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No Course Materials Found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No materials currently match the selected subject or search query.
              </p>
            </div>
          ) : (
            materials.map((mat) => (
              <div
                key={mat.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {mat.subject_code}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {mat.file_type}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {mat.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{mat.subject}</p>

                  <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                    {mat.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">
                    {mat.file_size}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onViewMaterial(mat)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Read</span>
                    </button>
                    <button
                      onClick={() => handleDeleteMaterial(mat.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Delete material"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
