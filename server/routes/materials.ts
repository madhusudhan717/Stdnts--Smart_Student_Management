import { Router, Response } from 'express';
import { queryAll, queryOne, run } from '../database/db.ts';
import { authMiddleware, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/materials
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const studentId = req.studentId!;
  const { search, type, subject } = req.query;

  let sql = 'SELECT * FROM study_materials WHERE student_id = ?';
  const params: any[] = [studentId];

  if (search) {
    sql += ' AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(subject) LIKE ?)';
    const searchPattern = `%${String(search).toLowerCase()}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  if (type && type !== 'all') {
    sql += ' AND file_type = ?';
    params.push(type);
  }

  if (subject && subject !== 'all') {
    sql += ' AND (subject_code = ? OR subject = ?)';
    params.push(subject, subject);
  }

  sql += ' ORDER BY id DESC';

  const rows = queryAll(sql, params);
  res.json({ materials: rows, total: rows.length });
});

// POST /api/materials
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const studentId = req.studentId!;
  const {
    title,
    subject,
    subject_code = '',
    description = '',
    file_type = 'PDF',
    file_url = '',
    file_size = '1.0 MB',
  } = req.body;

  if (!title || !subject) {
    res.status(400).json({ error: 'Title and subject are required.' });
    return;
  }

  const result = run(
    `INSERT INTO study_materials (student_id, title, subject, subject_code, description, file_type, file_url, file_size)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      studentId,
      title.trim(),
      subject.trim(),
      subject_code.trim(),
      description.trim(),
      file_type.trim(),
      file_url.trim(),
      file_size.trim(),
    ]
  );

  const created = queryOne('SELECT * FROM study_materials WHERE id = ?', [result.lastInsertRowId]);
  res.status(201).json({ message: 'Study material uploaded successfully', material: created });
});

// DELETE /api/materials/:id
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const studentId = req.studentId!;
  const id = parseInt(req.params.id, 10);

  const existing = queryOne('SELECT id FROM study_materials WHERE id = ? AND student_id = ?', [id, studentId]);
  if (!existing) {
    res.status(404).json({ error: 'Material not found or unauthorized.' });
    return;
  }

  run('DELETE FROM study_materials WHERE id = ? AND student_id = ?', [id, studentId]);
  res.json({ message: 'Study material deleted successfully', id });
});

export default router;
