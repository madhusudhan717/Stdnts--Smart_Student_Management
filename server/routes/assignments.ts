import { Router, Response } from 'express';
import { queryAll, queryOne, run } from '../database/db.ts';
import { authMiddleware, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/assignments
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const studentId = req.studentId!;
  const { status, priority, subject, search } = req.query;

  let sql = 'SELECT * FROM assignments WHERE student_id = ?';
  const params: any[] = [studentId];

  if (status && status !== 'all') {
    sql += ' AND status = ?';
    params.push(status);
  }

  if (priority && priority !== 'all') {
    sql += ' AND priority = ?';
    params.push(priority);
  }

  if (subject && subject !== 'all') {
    sql += ' AND subject_code = ?';
    params.push(subject);
  }

  if (search) {
    sql += ' AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(subject) LIKE ?)';
    const searchPattern = `%${String(search).toLowerCase()}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  sql += ` ORDER BY 
    CASE status 
      WHEN 'Pending' THEN 1 
      WHEN 'In Progress' THEN 2 
      WHEN 'Overdue' THEN 3 
      ELSE 4 
    END,
    due_date ASC`;

  const rows = queryAll(sql, params);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const enriched = rows.map((a: any) => {
    const dueDate = new Date(a.due_date + 'T23:59:59');
    const diffTime = dueDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isOverdue = daysLeft < 0 && a.status !== 'Completed';
    const effectiveStatus = isOverdue ? 'Overdue' : a.status;

    return {
      ...a,
      daysLeft,
      isOverdue,
      status: effectiveStatus,
      isApproaching: !isOverdue && a.status !== 'Completed' && daysLeft <= 2,
    };
  });

  res.json({
    assignments: enriched,
    total: enriched.length,
    pendingCount: enriched.filter((a) => a.status !== 'Completed').length,
    completedCount: enriched.filter((a) => a.status === 'Completed').length,
  });
});

// POST /api/assignments
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const studentId = req.studentId!;
  const {
    title,
    subject,
    subject_code,
    description = '',
    due_date,
    due_time = '11:59 PM',
    priority = 'Medium',
    status = 'Pending',
    submission_notes = '',
  } = req.body;

  if (!title || !subject || !due_date) {
    res.status(400).json({ error: 'Title, Subject, and Due Date are required.' });
    return;
  }

  const result = run(
    `INSERT INTO assignments (
      student_id, title, subject, subject_code, description, due_date, due_time,
      priority, status, submission_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      studentId,
      title.trim(),
      subject.trim(),
      (subject_code || '').trim(),
      (description || '').trim(),
      due_date,
      due_time.trim(),
      priority,
      status,
      (submission_notes || '').trim(),
    ]
  );

  const created = queryOne('SELECT * FROM assignments WHERE id = ?', [result.lastInsertRowId]);
  res.status(201).json({ message: 'Assignment created successfully', assignment: created });
});

// PUT /api/assignments/:id
router.put('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const studentId = req.studentId!;
  const id = parseInt(req.params.id, 10);

  const existing = queryOne('SELECT * FROM assignments WHERE id = ? AND student_id = ?', [id, studentId]);
  if (!existing) {
    res.status(404).json({ error: 'Assignment not found or unauthorized.' });
    return;
  }

  const {
    title,
    subject,
    subject_code,
    description,
    due_date,
    due_time,
    priority,
    status,
    submission_notes,
  } = req.body;

  run(
    `UPDATE assignments
     SET title = COALESCE(?, title),
         subject = COALESCE(?, subject),
         subject_code = COALESCE(?, subject_code),
         description = COALESCE(?, description),
         due_date = COALESCE(?, due_date),
         due_time = COALESCE(?, due_time),
         priority = COALESCE(?, priority),
         status = COALESCE(?, status),
         submission_notes = COALESCE(?, submission_notes),
         updated_at = datetime('now')
     WHERE id = ? AND student_id = ?`,
    [
      title,
      subject,
      subject_code,
      description,
      due_date,
      due_time,
      priority,
      status,
      submission_notes,
      id,
      studentId,
    ]
  );

  const updated = queryOne('SELECT * FROM assignments WHERE id = ?', [id]);
  res.json({ message: 'Assignment updated successfully', assignment: updated });
});

// DELETE /api/assignments/:id
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const studentId = req.studentId!;
  const id = parseInt(req.params.id, 10);

  const existing = queryOne('SELECT id FROM assignments WHERE id = ? AND student_id = ?', [id, studentId]);
  if (!existing) {
    res.status(404).json({ error: 'Assignment not found or unauthorized.' });
    return;
  }

  run('DELETE FROM assignments WHERE id = ? AND student_id = ?', [id, studentId]);
  res.json({ message: 'Assignment deleted successfully', id });
});

export default router;
