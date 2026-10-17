import { Router, Response } from 'express';
import { queryAll, queryOne, run } from '../database/db.ts';
import { authMiddleware, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/focus-sessions
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const studentId = req.studentId!;
  const todayStr = new Date().toISOString().split('T')[0];

  const sessions = queryAll(
    `SELECT * FROM focus_sessions WHERE student_id = ? ORDER BY completed_at DESC LIMIT 50`,
    [studentId]
  );

  const todayStats = queryOne<{ completed: number; total_minutes: number }>(
    `SELECT COUNT(*) as completed, COALESCE(SUM(duration_minutes), 0) as total_minutes
     FROM focus_sessions
     WHERE student_id = ? AND date(completed_at) = ?`,
    [studentId, todayStr]
  );

  const allTimeStats = queryOne<{ total_sessions: number; all_minutes: number }>(
    `SELECT COUNT(*) as total_sessions, COALESCE(SUM(duration_minutes), 0) as all_minutes
     FROM focus_sessions
     WHERE student_id = ?`,
    [studentId]
  );

  res.json({
    sessions,
    today: {
      completedSessions: todayStats?.completed || 0,
      totalMinutes: todayStats?.total_minutes || 0,
      todayStr,
    },
    allTime: {
      totalSessions: allTimeStats?.total_sessions || 0,
      allMinutes: allTimeStats?.all_minutes || 0,
    },
  });
});

// POST /api/focus-sessions
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const studentId = req.studentId!;
  const { session_type = 'Pomodoro Focus', duration_minutes = 25, subject = 'General Study', notes = '' } = req.body;

  const result = run(
    `INSERT INTO focus_sessions (student_id, session_type, duration_minutes, subject, notes, completed_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    [studentId, session_type, parseInt(duration_minutes, 10), (subject || '').trim(), (notes || '').trim()]
  );

  const created = queryOne('SELECT * FROM focus_sessions WHERE id = ?', [result.lastInsertRowId]);
  res.status(201).json({ message: 'Focus session recorded', session: created });
});

export default router;
