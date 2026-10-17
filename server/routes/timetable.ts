import { Router, Response } from 'express';
import { queryAll, queryOne, run } from '../database/db.ts';
import { authMiddleware, AuthRequest } from '../middleware/auth.ts';

const router = Router();

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// GET /api/timetable
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const studentId = req.studentId!;
  const { day } = req.query;

  let sql = 'SELECT * FROM timetable WHERE student_id = ?';
  const params: any[] = [studentId];

  if (day && day !== 'all') {
    sql += ' AND LOWER(day) = LOWER(?)';
    params.push(day);
  }

  sql += ' ORDER BY start_time ASC';

  const rows = queryAll(sql, params);

  // Group by day for weekly view
  const weeklyMap: Record<string, any[]> = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  };

  for (const r of rows) {
    if (weeklyMap[r.day]) {
      weeklyMap[r.day].push(r);
    }
  }

  const currentDayName = DAYS_ORDER[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const todaySlots = weeklyMap[currentDayName] || [];

  res.json({
    slots: rows,
    weekly: weeklyMap,
    today: {
      day: currentDayName,
      slots: todaySlots,
    },
  });
});

// POST /api/timetable
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const studentId = req.studentId!;
  const { day, subject, course_code, start_time, end_time, classroom, faculty_name, type = 'Lecture' } = req.body;

  if (!day || !subject || !start_time || !end_time || !classroom) {
    res.status(400).json({ error: 'Day, subject, start time, end time, and classroom are required.' });
    return;
  }

  const result = run(
    `INSERT INTO timetable (
      student_id, day, subject, course_code, start_time, end_time, classroom, faculty_name, type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      studentId,
      day.trim(),
      subject.trim(),
      (course_code || '').trim(),
      start_time.trim(),
      end_time.trim(),
      classroom.trim(),
      (faculty_name || '').trim(),
      type.trim(),
    ]
  );

  const created = queryOne('SELECT * FROM timetable WHERE id = ?', [result.lastInsertRowId]);
  res.status(201).json({ message: 'Timetable class scheduled successfully', slot: created });
});

// PUT /api/timetable/:id
router.put('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const studentId = req.studentId!;
  const id = parseInt(req.params.id, 10);

  const existing = queryOne('SELECT * FROM timetable WHERE id = ? AND student_id = ?', [id, studentId]);
  if (!existing) {
    res.status(404).json({ error: 'Timetable slot not found or unauthorized.' });
    return;
  }

  const { day, subject, course_code, start_time, end_time, classroom, faculty_name, type } = req.body;

  run(
    `UPDATE timetable
     SET day = COALESCE(?, day),
         subject = COALESCE(?, subject),
         course_code = COALESCE(?, course_code),
         start_time = COALESCE(?, start_time),
         end_time = COALESCE(?, end_time),
         classroom = COALESCE(?, classroom),
         faculty_name = COALESCE(?, faculty_name),
         type = COALESCE(?, type)
     WHERE id = ? AND student_id = ?`,
    [day, subject, course_code, start_time, end_time, classroom, faculty_name, type, id, studentId]
  );

  const updated = queryOne('SELECT * FROM timetable WHERE id = ?', [id]);
  res.json({ message: 'Timetable class updated successfully', slot: updated });
});

// DELETE /api/timetable/:id
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const studentId = req.studentId!;
  const id = parseInt(req.params.id, 10);

  const existing = queryOne('SELECT id FROM timetable WHERE id = ? AND student_id = ?', [id, studentId]);
  if (!existing) {
    res.status(404).json({ error: 'Timetable slot not found or unauthorized.' });
    return;
  }

  run('DELETE FROM timetable WHERE id = ? AND student_id = ?', [id, studentId]);
  res.json({ message: 'Timetable class removed successfully', id });
});

export default router;
