
import cors from 'cors';
import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { getDb, saveDb } from './server/database/db.ts';

// API Routes
import authRouter from './server/routes/auth.ts';
import dashboardRouter from './server/routes/dashboard.ts';
import examsRouter from './server/routes/exams.ts';
import assignmentsRouter from './server/routes/assignments.ts';
import coursesRouter from './server/routes/courses.ts';
import timetableRouter from './server/routes/timetable.ts';
import attendanceRouter from './server/routes/attendance.ts';
import gradesRouter from './server/routes/grades.ts';
import notesRouter from './server/routes/notes.ts';
import materialsRouter from './server/routes/materials.ts';
import focusRouter from './server/routes/focus.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Initialize database and seed demo data
  await getDb();

  // Configure CORS before API routes
  const allowedOrigins = [
    'https://stdnts-smart-student-management.vercel.app',
    'https://stdnts-smart-student-management-phn0wglde.vercel.app',
    'https://stdnts-smart-student-management-khxgss75t.vercel.app',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests without an Origin header, such as server-side tools
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Origin not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json());

  // Mount API routes
  app.use('/api/auth', authRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/exams', examsRouter);
  app.use('/api/assignments', assignmentsRouter);
  app.use('/api/courses', coursesRouter);
  app.use('/api/timetable', timetableRouter);
  app.use('/api/attendance', attendanceRouter);
  app.use('/api/grades', gradesRouter);
  app.use('/api/notes', notesRouter);
  app.use('/api/materials', materialsRouter);
  app.use('/api/focus-sessions', focusRouter);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');

    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // Vite build output directory
    const distPath = path.resolve(process.cwd(), 'dist');

    app.use(express.static(distPath));

    // SPA fallback; don't serve index.html for unknown API routes
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }

      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Graceful shutdown
  process.on('SIGINT', () => {
    saveDb();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    saveDb();
    process.exit(0);
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`STDNTS Backend Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
