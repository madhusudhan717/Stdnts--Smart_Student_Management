import { Router, Response } from 'express';
import { queryAll, queryOne, run } from '../database/db.ts';
import { authMiddleware, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/exams
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const studentId = req.studentId!;
  const { search, type, subject, status } = req.query;

  let sql = 'SELECT * FROM exams WHERE student_id = ?';
  const params: any[] = [studentId];

  if (search) {
    sql += ' AND (LOWER(subject_name) LIKE ? OR LOWER(subject_code) LIKE ? OR LOWER(topics) LIKE ?)';
    const searchPattern = `%${String(search).toLowerCase()}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  if (type && type !== 'all') {
    sql += ' AND exam_type = ?';
    params.push(type);
  }

  if (subject && subject !== 'all') {
    sql += ' AND subject_code = ?';
    params.push(subject);
  }

  if (status && status !== 'all') {
    sql += ' AND preparation_status = ?';
    params.push(status);
  }

  sql += ' ORDER BY exam_date ASC, start_time ASC';

  const rows = queryAll(sql, params);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const enriched = rows.map((e: any) => {
    const examDate = new Date(e.exam_date + 'T00:00:00');
    const diffTime = examDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isPast = daysRemaining < 0;

    return {
      ...e,
      daysRemaining: isPast ? 0 : daysRemaining,
      isPast,
      isHappeningSoon: !isPast && daysRemaining <= 3,
      syllabus_checklist: JSON.parse(e.syllabus_checklist || '[]'),
    };
  });

  const upcoming = enriched.filter((e: any) => !e.isPast);
  const past = enriched.filter((e: any) => e.isPast);

  res.json({
    exams: enriched,
    upcoming,
    past,
    total: enriched.length,
  });
});

// POST /api/exams
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const studentId = req.studentId!;
  const {
    subject_name,
    subject_code,
    exam_date,
    start_time,
    end_time,
    exam_type,
    venue,
    topics,
    preparation_status = 'In Progress',
    syllabus_checklist = [],
    notes = '',
  } = req.body;

  if (!subject_name || !subject_code || !exam_date || !start_time || !end_time || !exam_type || !venue) {
    res.status(400).json({ error: 'Please provide all required exam fields.' });
    return;
  }

  const checklistJson = typeof syllabus_checklist === 'string' ? syllabus_checklist : JSON.stringify(syllabus_checklist);

  const result = run(
    `INSERT INTO exams (
      student_id, subject_name, subject_code, exam_date, start_time, end_time,
      exam_type, venue, topics, preparation_status, syllabus_checklist, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      studentId,
      subject_name.trim(),
      subject_code.trim(),
      exam_date,
      start_time.trim(),
      end_time.trim(),
      exam_type.trim(),
      venue.trim(),
      (topics || '').trim(),
      preparation_status,
      checklistJson,
      (notes || '').trim(),
    ]
  );

  const newExam = queryOne('SELECT * FROM exams WHERE id = ?', [result.lastInsertRowId]);
  res.status(201).json({
    message: 'Exam created successfully',
    exam: {
      ...newExam,
      syllabus_checklist: JSON.parse(newExam.syllabus_checklist || '[]'),
    },
  });
});

// PUT /api/exams/:id
router.put('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const studentId = req.studentId!;
  const examId = parseInt(req.params.id, 10);

  const existing = queryOne('SELECT * FROM exams WHERE id = ? AND student_id = ?', [examId, studentId]);
  if (!existing) {
    res.status(404).json({ error: 'Exam not found or you do not have permission to modify it.' });
    return;
  }

  const {
    subject_name,
    subject_code,
    exam_date,
    start_time,
    end_time,
    exam_type,
    venue,
    topics,
    preparation_status,
    syllabus_checklist,
    notes,
  } = req.body;

  const checklistJson = syllabus_checklist !== undefined
    ? (typeof syllabus_checklist === 'string' ? syllabus_checklist : JSON.stringify(syllabus_checklist))
    : existing.syllabus_checklist;

  run(
    `UPDATE exams
     SET subject_name = COALESCE(?, subject_name),
         subject_code = COALESCE(?, subject_code),
         exam_date = COALESCE(?, exam_date),
         start_time = COALESCE(?, start_time),
         end_time = COALESCE(?, end_time),
         exam_type = COALESCE(?, exam_type),
         venue = COALESCE(?, venue),
         topics = COALESCE(?, topics),
         preparation_status = COALESCE(?, preparation_status),
         syllabus_checklist = ?,
         notes = COALESCE(?, notes),
         updated_at = datetime('now')
     WHERE id = ? AND student_id = ?`,
    [
      subject_name,
      subject_code,
      exam_date,
      start_time,
      end_time,
      exam_type,
      venue,
      topics,
      preparation_status,
      checklistJson,
      notes,
      examId,
      studentId,
    ]
  );

  const updated = queryOne('SELECT * FROM exams WHERE id = ?', [examId]);
  res.json({
    message: 'Exam updated successfully',
    exam: {
      ...updated,
      syllabus_checklist: JSON.parse(updated.syllabus_checklist || '[]'),
    },
  });
});

// DELETE /api/exams/:id
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const studentId = req.studentId!;
  const examId = parseInt(req.params.id, 10);

  const existing = queryOne('SELECT id FROM exams WHERE id = ? AND student_id = ?', [examId, studentId]);
  if (!existing) {
    res.status(404).json({ error: 'Exam not found or unauthorized.' });
    return;
  }

  run('DELETE FROM exams WHERE id = ? AND student_id = ?', [examId, studentId]);
  res.json({ message: 'Exam deleted successfully', id: examId });
});

export default router;
