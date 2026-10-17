import { Router, Response } from 'express';
import { queryAll, queryOne, run } from '../database/db.ts';
import { authMiddleware, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/notes
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const studentId = req.studentId!;
  const { search, subject } = req.query;

  let sql = 'SELECT * FROM study_notes WHERE student_id = ?';
  const params: any[] = [studentId];

  if (search) {
    sql += ' AND (LOWER(title) LIKE ? OR LOWER(content) LIKE ? OR LOWER(subject) LIKE ?)';
    const searchPattern = `%${String(search).toLowerCase()}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  if (subject && subject !== 'all') {
    sql += ' AND (subject_code = ? OR subject = ?)';
    params.push(subject, subject);
  }

  sql += ' ORDER BY updated_at DESC, id DESC';

  const rows = queryAll(sql, params).map((n: any) => ({
    ...n,
    tags: JSON.parse(n.tags || '[]'),
  }));

  res.json({ notes: rows, total: rows.length });
});

// POST /api/notes
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const studentId = req.studentId!;
  const { title, subject, subject_code, content, tags = [] } = req.body;

  if (!title || !subject || !content) {
    res.status(400).json({ error: 'Title, subject, and content are required.' });
    return;
  }

  const tagsJson = typeof tags === 'string' ? tags : JSON.stringify(tags);

  const result = run(
    `INSERT INTO study_notes (student_id, title, subject, subject_code, content, tags)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [studentId, title.trim(), subject.trim(), (subject_code || '').trim(), content.trim(), tagsJson]
  );

  const created = queryOne('SELECT * FROM study_notes WHERE id = ?', [result.lastInsertRowId]);
  res.status(201).json({
    message: 'Note created successfully',
    note: { ...created, tags: JSON.parse(created.tags || '[]') },
  });
});

// PUT /api/notes/:id
router.put('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const studentId = req.studentId!;
  const id = parseInt(req.params.id, 10);

  const existing = queryOne('SELECT * FROM study_notes WHERE id = ? AND student_id = ?', [id, studentId]);
  if (!existing) {
    res.status(404).json({ error: 'Note not found or unauthorized.' });
    return;
  }

  const { title, subject, subject_code, content, tags } = req.body;

  const tagsJson = tags !== undefined
    ? (typeof tags === 'string' ? tags : JSON.stringify(tags))
    : existing.tags;

  run(
    `UPDATE study_notes
     SET title = COALESCE(?, title),
         subject = COALESCE(?, subject),
         subject_code = COALESCE(?, subject_code),
         content = COALESCE(?, content),
         tags = ?,
         updated_at = datetime('now')
     WHERE id = ? AND student_id = ?`,
    [title, subject, subject_code, content, tagsJson, id, studentId]
  );

  const updated = queryOne('SELECT * FROM study_notes WHERE id = ?', [id]);
  res.json({
    message: 'Note updated successfully',
    note: { ...updated, tags: JSON.parse(updated.tags || '[]') },
  });
});

// DELETE /api/notes/:id
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const studentId = req.studentId!;
  const id = parseInt(req.params.id, 10);

  const existing = queryOne('SELECT id FROM study_notes WHERE id = ? AND student_id = ?', [id, studentId]);
  if (!existing) {
    res.status(404).json({ error: 'Note not found or unauthorized.' });
    return;
  }

  run('DELETE FROM study_notes WHERE id = ? AND student_id = ?', [id, studentId]);
  res.json({ message: 'Note deleted successfully', id });
});

export default router;
