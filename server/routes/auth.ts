import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryOne, run } from '../database/db.ts';
import { authMiddleware, AuthRequest } from '../middleware/auth.ts';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'stdnts-super-secret-jwt-key-2026-academic-portal';

// POST /api/auth/login
router.post('/login', (req, res: Response) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    res.status(400).json({ error: 'Please provide student ID or email and password.' });
    return;
  }

  const trimmedId = identifier.trim();

  // Find student by student_id or email (case-insensitive)
  const student = queryOne<{
    id: number;
    student_id: string;
    email: string;
    password_hash: string;
    full_name: string;
    avatar_url: string;
    program: string;
    semester: number;
    academic_year: string;
    department: string;
    batch: string;
    phone: string;
    address: string;
  }>(
    'SELECT * FROM students WHERE LOWER(student_id) = LOWER(?) OR LOWER(email) = LOWER(?)',
    [trimmedId, trimmedId]
  );

  if (!student) {
    res.status(401).json({ error: 'Invalid Student ID/Email or password. Please verify your credentials.' });
    return;
  }

  const isPasswordValid = bcrypt.compareSync(password, student.password_hash);
  if (!isPasswordValid) {
    res.status(401).json({ error: 'Invalid Student ID/Email or password. Please verify your credentials.' });
    return;
  }

  // Generate JWT Token
  const token = jwt.sign(
    { studentId: student.student_id, email: student.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Return student info without password hash
  const { password_hash, ...safeStudent } = student;
  res.json({
    message: 'Login successful',
    token,
    student: safeStudent,
  });
});

// GET /api/auth/me (Protected)
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const student = queryOne(
    `SELECT id, student_id, email, full_name, avatar_url, program, semester,
            academic_year, department, batch, phone, address, created_at
     FROM students WHERE student_id = ?`,
    [req.studentId]
  );

  if (!student) {
    res.status(404).json({ error: 'Student not found' });
    return;
  }

  res.json({ student });
});

// PUT /api/auth/profile (Protected)
router.put('/profile', authMiddleware, (req: AuthRequest, res: Response) => {
  const { full_name, phone, address, avatar_url } = req.body;

  run(
    `UPDATE students
     SET full_name = COALESCE(?, full_name),
         phone = COALESCE(?, phone),
         address = COALESCE(?, address),
         avatar_url = COALESCE(?, avatar_url),
         updated_at = datetime('now')
     WHERE student_id = ?`,
    [full_name, phone, address, avatar_url, req.studentId]
  );

  const updatedStudent = queryOne(
    `SELECT id, student_id, email, full_name, avatar_url, program, semester,
            academic_year, department, batch, phone, address
     FROM students WHERE student_id = ?`,
    [req.studentId]
  );

  res.json({ message: 'Profile updated successfully', student: updatedStudent });
});

// POST /api/auth/logout
router.post('/logout', (_req, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
