import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Initialize SQLite database & seed demo data
  await getDb();

  app.use(express.json());

  // Mount API routers
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

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Graceful shutdown handling to persist DB
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
