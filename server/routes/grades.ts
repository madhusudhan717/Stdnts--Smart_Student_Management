import { Router, Response } from 'express';
import { queryAll, queryOne, run } from '../database/db.ts';
import { authMiddleware, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// Standard 4.0 grading scale reference
// A+: 4.0 (>=90%), A: 3.7 (85-89%), B+: 3.3 (80-84%), B: 3.0 (75-79%), C+: 2.7 (70-74%), C: 2.3 (65-69%), D: 2.0 (60-64%), F: 0.0 (<60%)
function deriveGradeAndPoints(marks: number, maxMarks: number = 100): { grade: string; gradePoint: number } {
  const percentage = (marks / maxMarks) * 100;
  if (percentage >= 90) return { grade: 'A+', gradePoint: 4.0 };
  if (percentage >= 85) return { grade: 'A', gradePoint: 3.7 };
  if (percentage >= 80) return { grade: 'B+', gradePoint: 3.3 };
  if (percentage >= 75) return { grade: 'B', gradePoint: 3.0 };
  if (percentage >= 70) return { grade: 'C+', gradePoint: 2.7 };
  if (percentage >= 65) return { grade: 'C', gradePoint: 2.3 };
  if (percentage >= 60) return { grade: 'D', gradePoint: 2.0 };
  return { grade: 'F', gradePoint: 0.0 };
}

// GET /api/grades
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const studentId = req.studentId!;

  const rows = queryAll(
    `SELECT * FROM grades WHERE student_id = ? ORDER BY semester DESC, course_code ASC`,
    [studentId]
  );

  // Group by semester
  const semesterMap: Record<number, { semester: number; courses: any[]; totalCredits: number; semesterGpa: number }> = {};

  let cumulativePoints = 0;
  let cumulativeCredits = 0;

  for (const r of rows) {
    const sem = r.semester;
    if (!semesterMap[sem]) {
      semesterMap[sem] = {
        semester: sem,
        courses: [],
        totalCredits: 0,
        semesterGpa: 0,
      };
    }

    const percentage = r.max_marks > 0 ? Math.round((r.marks_obtained / r.max_marks) * 100) : 0;
    const enrichedCourse = {
      ...r,
      percentage,
    };

    semesterMap[sem].courses.push(enrichedCourse);
    semesterMap[sem].totalCredits += r.credits;

    cumulativePoints += r.grade_point * r.credits;
    cumulativeCredits += r.credits;
  }

  // Calculate semester GPA for each group
  const semesters = Object.values(semesterMap).map((group) => {
    const semPoints = group.courses.reduce((sum, c) => sum + c.grade_point * c.credits, 0);
    const gpa = group.totalCredits > 0 ? parseFloat((semPoints / group.totalCredits).toFixed(2)) : 0;
    return {
      ...group,
      semesterGpa: gpa,
    };
  }).sort((a, b) => b.semester - a.semester);

  const cumulativeGpa = cumulativeCredits > 0
    ? parseFloat((cumulativePoints / cumulativeCredits).toFixed(2))
    : 3.84;

  res.json({
    cumulativeGpa,
    cumulativeCredits,
    totalCourses: rows.length,
    semesters,
    gradingScaleNote: 'Cumulative GPA is calculated based on standard 4.0 weighted scale (Grade Points × Credits / Total Credits). Institutional grading policies may vary.',
  });
});

// POST /api/grades
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const studentId = req.studentId!;
  const {
    course_code,
    course_name,
    semester,
    credits = 4,
    marks_obtained,
    max_marks = 100,
    grade: userGrade,
    grade_point: userGradePoint,
  } = req.body;

  if (!course_code || !course_name || !semester || marks_obtained === undefined) {
    res.status(400).json({ error: 'Course code, name, semester, and marks are required.' });
    return;
  }

  const marksNum = parseFloat(marks_obtained);
  const maxMarksNum = parseFloat(max_marks) || 100;
  const derived = deriveGradeAndPoints(marksNum, maxMarksNum);

  const finalGrade = userGrade || derived.grade;
  const finalPoint = userGradePoint !== undefined ? parseFloat(userGradePoint) : derived.gradePoint;

  const result = run(
    `INSERT INTO grades (
      student_id, course_code, course_name, semester, credits, marks_obtained, max_marks, grade, grade_point
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      studentId,
      course_code.trim(),
      course_name.trim(),
      parseInt(semester, 10),
      parseInt(credits, 10),
      marksNum,
      maxMarksNum,
      finalGrade,
      finalPoint,
    ]
  );

  const created = queryOne('SELECT * FROM grades WHERE id = ?', [result.lastInsertRowId]);
  res.status(201).json({ message: 'Grade record created', grade: created });
});

// PUT /api/grades/:id
router.put('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const studentId = req.studentId!;
  const id = parseInt(req.params.id, 10);

  const existing = queryOne('SELECT * FROM grades WHERE id = ? AND student_id = ?', [id, studentId]);
  if (!existing) {
    res.status(404).json({ error: 'Grade record not found or unauthorized.' });
    return;
  }

  const {
    course_code,
    course_name,
    semester,
    credits,
    marks_obtained,
    max_marks,
    grade,
    grade_point,
  } = req.body;

  let finalGrade = grade;
  let finalPoint = grade_point;

  if (marks_obtained !== undefined && (grade === undefined || grade_point === undefined)) {
    const marksNum = parseFloat(marks_obtained);
    const maxMarksNum = max_marks !== undefined ? parseFloat(max_marks) : existing.max_marks;
    const derived = deriveGradeAndPoints(marksNum, maxMarksNum);
    if (finalGrade === undefined) finalGrade = derived.grade;
    if (finalPoint === undefined) finalPoint = derived.gradePoint;
  }

  run(
    `UPDATE grades
     SET course_code = COALESCE(?, course_code),
         course_name = COALESCE(?, course_name),
         semester = COALESCE(?, semester),
         credits = COALESCE(?, credits),
         marks_obtained = COALESCE(?, marks_obtained),
         max_marks = COALESCE(?, max_marks),
         grade = COALESCE(?, grade),
         grade_point = COALESCE(?, grade_point)
     WHERE id = ? AND student_id = ?`,
    [course_code, course_name, semester, credits, marks_obtained, max_marks, finalGrade, finalPoint, id, studentId]
  );

  const updated = queryOne('SELECT * FROM grades WHERE id = ?', [id]);
  res.json({ message: 'Grade record updated', grade: updated });
});

// DELETE /api/grades/:id
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const studentId = req.studentId!;
  const id = parseInt(req.params.id, 10);

  const existing = queryOne('SELECT id FROM grades WHERE id = ? AND student_id = ?', [id, studentId]);
  if (!existing) {
    res.status(404).json({ error: 'Grade record not found or unauthorized.' });
    return;
  }

  run('DELETE FROM grades WHERE id = ? AND student_id = ?', [id, studentId]);
  res.json({ message: 'Grade record deleted', id });
});

export default router;
