import { Router, Response } from 'express';
import { queryAll } from '../database/db.ts';
import { authMiddleware, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/courses
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const studentId = req.studentId!;

  const courses = queryAll(
    `SELECT c.id, c.code, c.name, c.faculty, c.credits, c.color, c.description,
            COALESCE(a.attended_classes, 0) as attended_classes,
            COALESCE(a.total_classes, 0) as total_classes
     FROM courses c
     JOIN student_courses sc ON c.code = sc.course_code
     LEFT JOIN attendance a ON a.student_id = sc.student_id AND a.course_code = c.code
     WHERE sc.student_id = ?
     ORDER BY c.code ASC`,
    [studentId]
  );

  const enriched = courses.map((c: any) => {
    const attendancePct = c.total_classes > 0
      ? Math.round((c.attended_classes / c.total_classes) * 100)
      : 100;

    // Get assignments count for this course
    const pendingAssignments = queryAll(
      `SELECT COUNT(*) as count FROM assignments WHERE student_id = ? AND subject_code = ? AND status != 'Completed'`,
      [studentId, c.code]
    )[0]?.count || 0;

    // Get next upcoming exam
    const nextExam = queryAll(
      `SELECT * FROM exams WHERE student_id = ? AND subject_code = ? AND exam_date >= date('now') ORDER BY exam_date ASC LIMIT 1`,
      [studentId, c.code]
    )[0] || null;

    return {
      ...c,
      attendancePercentage: attendancePct,
      pendingAssignments,
      nextExam,
    };
  });

  res.json({
    courses: enriched,
    totalCredits: enriched.reduce((sum: number, c: any) => sum + (c.credits || 0), 0),
  });
});

export default router;
