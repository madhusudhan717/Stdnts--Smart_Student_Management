import { Router, Response } from 'express';
import { queryAll, queryOne, run } from '../database/db.ts';
import { authMiddleware, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/attendance
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const studentId = req.studentId!;

  const records = queryAll(
    `SELECT * FROM attendance WHERE student_id = ? ORDER BY course_code ASC`,
    [studentId]
  );

  let totalAttended = 0;
  let totalClasses = 0;

  const enriched = records.map((r: any) => {
    const pct = r.total_classes > 0
      ? Math.round((r.attended_classes / r.total_classes) * 100)
      : 100;

    totalAttended += r.attended_classes;
    totalClasses += r.total_classes;

    // Calculate how many more classes needed to reach 75% if below 75%
    let classesNeededFor75 = 0;
    if (pct < 75 && r.total_classes > 0) {
      // (attended + x) / (total + x) >= 0.75 => attended + x >= 0.75 total + 0.75 x => 0.25 x >= 0.75 total - attended => x >= 3 total - 4 attended
      classesNeededFor75 = Math.max(0, Math.ceil(3 * r.total_classes - 4 * r.attended_classes));
    }

    return {
      ...r,
      percentage: pct,
      missed_classes: Math.max(0, r.total_classes - r.attended_classes),
      status: pct >= 85 ? 'Excellent' : pct >= 75 ? 'Good' : 'Critical',
      classesNeededFor75,
    };
  });

  const overallPct = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 100;

  res.json({
    records: enriched,
    summary: {
      overallPercentage: overallPct,
      totalClasses,
      totalAttended,
      totalMissed: Math.max(0, totalClasses - totalAttended),
      isCompliant: overallPct >= 75,
    },
  });
});

// POST /api/attendance
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const studentId = req.studentId!;
  const { course_code, course_name, total_classes = 0, attended_classes = 0 } = req.body;

  if (!course_code || !course_name) {
    res.status(400).json({ error: 'Course code and course name are required.' });
    return;
  }

  const result = run(
    `INSERT INTO attendance (student_id, course_code, course_name, total_classes, attended_classes)
     VALUES (?, ?, ?, ?, ?)`,
    [studentId, course_code.trim(), course_name.trim(), parseInt(total_classes, 10), parseInt(attended_classes, 10)]
  );

  const created = queryOne('SELECT * FROM attendance WHERE id = ?', [result.lastInsertRowId]);
  res.status(201).json({ message: 'Attendance record created', record: created });
});

// PUT /api/attendance/:id
router.put('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const studentId = req.studentId!;
  const id = parseInt(req.params.id, 10);

  const existing = queryOne('SELECT * FROM attendance WHERE id = ? AND student_id = ?', [id, studentId]);
  if (!existing) {
    res.status(404).json({ error: 'Attendance record not found or unauthorized.' });
    return;
  }

  const { total_classes, attended_classes, action } = req.body;

  let newTotal = total_classes !== undefined ? parseInt(total_classes, 10) : existing.total_classes;
  let newAttended = attended_classes !== undefined ? parseInt(attended_classes, 10) : existing.attended_classes;

  // Support quick actions
  if (action === 'mark_present') {
    newAttended += 1;
    newTotal += 1;
  } else if (action === 'mark_absent') {
    newTotal += 1;
  }

  run(
    `UPDATE attendance
     SET total_classes = ?,
         attended_classes = ?,
         last_updated = datetime('now')
     WHERE id = ? AND student_id = ?`,
    [newTotal, Math.min(newAttended, newTotal), id, studentId]
  );

  const updated = queryOne('SELECT * FROM attendance WHERE id = ?', [id]);
  res.json({ message: 'Attendance updated successfully', record: updated });
});

// DELETE /api/attendance/:id
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const studentId = req.studentId!;
  const id = parseInt(req.params.id, 10);

  const existing = queryOne('SELECT id FROM attendance WHERE id = ? AND student_id = ?', [id, studentId]);
  if (!existing) {
    res.status(404).json({ error: 'Record not found or unauthorized.' });
    return;
  }

  run('DELETE FROM attendance WHERE id = ? AND student_id = ?', [id, studentId]);
  res.json({ message: 'Attendance record removed', id });
});

export default router;
