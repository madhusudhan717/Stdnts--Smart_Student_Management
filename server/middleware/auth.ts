import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { queryOne } from '../database/db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'stdnts-super-secret-jwt-key-2026-academic-portal';

export interface AuthRequest extends Request {
  studentId?: string;
  student?: {
    id: number;
    student_id: string;
    email: string;
    full_name: string;
    program: string;
    semester: number;
    academic_year: string;
    department: string;
    avatar_url: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'] as string;
  }

  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please log in with valid credentials.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { studentId: string; email: string };
    const student = queryOne<{
      id: number;
      student_id: string;
      email: string;
      full_name: string;
      program: string;
      semester: number;
      academic_year: string;
      department: string;
      avatar_url: string;
    }>(
      'SELECT id, student_id, email, full_name, program, semester, academic_year, department, avatar_url FROM students WHERE student_id = ?',
      [decoded.studentId]
    );

    if (!student) {
      res.status(401).json({ error: 'Student account not found or has been removed.' });
      return;
    }

    req.studentId = student.student_id;
    req.student = student;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
  }
}
