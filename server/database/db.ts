import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_DIR = path.resolve(process.cwd(), 'server', 'database');
const DB_FILE = path.join(DB_DIR, 'student_management.db');

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (err) {
      console.error('Failed to read existing DB file, creating a fresh one', err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  initSchema(dbInstance);
  await seedDemoData(dbInstance);
  saveDb();

  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to persist database to file:', err);
  }
}

// Helpers for type-safe query execution
export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  if (!dbInstance) throw new Error('Database not initialized');
  const stmt = dbInstance.prepare(sql);
  try {
    if (params.length > 0) {
      stmt.bind(params);
    }
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as T);
    }
    return results;
  } finally {
    stmt.free();
  }
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const rows = queryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function run(sql: string, params: any[] = []): { changes: number; lastInsertRowId: number } {
  if (!dbInstance) throw new Error('Database not initialized');
  dbInstance.run(sql, params);
  
  // Get last insert rowid and changes
  const rowIdResult = queryOne<{ id: number }>('SELECT last_insert_rowid() AS id');
  const changesResult = queryOne<{ changes: number }>('SELECT changes() AS changes');
  
  saveDb();
  return {
    lastInsertRowId: rowIdResult?.id || 0,
    changes: changesResult?.changes || 0,
  };
}

function initSchema(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      avatar_url TEXT,
      program TEXT NOT NULL,
      semester INTEGER NOT NULL,
      academic_year TEXT NOT NULL,
      department TEXT NOT NULL,
      batch TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      faculty TEXT NOT NULL,
      credits INTEGER NOT NULL,
      color TEXT,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS student_courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      course_code TEXT NOT NULL,
      enrollment_date TEXT,
      UNIQUE(student_id, course_code)
    );

    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      subject_code TEXT NOT NULL,
      exam_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      exam_type TEXT NOT NULL,
      venue TEXT NOT NULL,
      topics TEXT NOT NULL,
      preparation_status TEXT NOT NULL DEFAULT 'In Progress',
      syllabus_checklist TEXT DEFAULT '[]',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      subject_code TEXT NOT NULL,
      description TEXT,
      due_date TEXT NOT NULL,
      due_time TEXT DEFAULT '11:59 PM',
      priority TEXT NOT NULL DEFAULT 'Medium',
      status TEXT NOT NULL DEFAULT 'Pending',
      submission_notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS timetable (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      day TEXT NOT NULL,
      subject TEXT NOT NULL,
      course_code TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      classroom TEXT NOT NULL,
      faculty_name TEXT NOT NULL,
      type TEXT DEFAULT 'Lecture',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      course_code TEXT NOT NULL,
      course_name TEXT NOT NULL,
      total_classes INTEGER NOT NULL DEFAULT 0,
      attended_classes INTEGER NOT NULL DEFAULT 0,
      last_updated TEXT DEFAULT (datetime('now')),
      UNIQUE(student_id, course_code)
    );

    CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      course_code TEXT NOT NULL,
      course_name TEXT NOT NULL,
      semester INTEGER NOT NULL,
      credits INTEGER NOT NULL,
      marks_obtained REAL NOT NULL,
      max_marks REAL NOT NULL DEFAULT 100,
      grade TEXT NOT NULL,
      grade_point REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS study_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      subject_code TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS study_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      subject_code TEXT NOT NULL,
      description TEXT,
      file_type TEXT NOT NULL,
      file_url TEXT,
      file_size TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS focus_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      session_type TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      subject TEXT,
      notes TEXT,
      completed_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

async function seedDemoData(db: Database) {
  // Check if student exists
  const stmt = db.prepare('SELECT count(*) as count FROM students WHERE student_id = ?');
  stmt.bind(['STU2026001']);
  let hasStudent = false;
  if (stmt.step()) {
    const res = stmt.getAsObject() as { count: number };
    hasStudent = res.count > 0;
  }
  stmt.free();

  if (hasStudent) {
    return;
  }

  console.log('Seeding demo student and academic records into SQLite...');
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('Student@123', salt);

  // 1. Insert Demo Student
  db.run(
    `INSERT INTO students (
      student_id, email, password_hash, full_name, avatar_url,
      program, semester, academic_year, department, batch, phone, address
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'STU2026001',
      'student@example.com',
      passwordHash,
      'Alex Morgan',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      'B.Tech Computer Science & Engineering',
      5,
      '2026-2027',
      'Department of Computer Science & Engineering',
      '2024-2028',
      '+1 (555) 392-8172',
      '42 University Avenue, Cambridge, MA'
    ]
  );

  // 2. Insert Standard Courses
  const courses = [
    {
      code: 'CSE301',
      name: 'Data Structures & Algorithms',
      faculty: 'Dr. Robert Lang',
      credits: 4,
      color: '#3b82f6',
      description: 'Advanced data structures including AVL trees, B-Trees, Graph traversals, DP algorithms, and amortized complexity.'
    },
    {
      code: 'CSE302',
      name: 'Database Management Systems',
      faculty: 'Prof. Elena Rostova',
      credits: 4,
      color: '#10b981',
      description: 'Relational algebra, normalization (1NF-BCNF), concurrency control, ACID properties, and indexing optimizations.'
    },
    {
      code: 'CSE303',
      name: 'Operating Systems',
      faculty: 'Dr. Marcus Vance',
      credits: 4,
      color: '#8b5cf6',
      description: 'Process scheduling, virtual memory paging, multithreading synchronization, mutex semaphores, and file system architecture.'
    },
    {
      code: 'CSE304',
      name: 'Artificial Intelligence',
      faculty: 'Dr. Sarah Chen',
      credits: 4,
      color: '#f59e0b',
      description: 'State space search (A*, minimax, alpha-beta), knowledge representation, Bayesian networks, and machine learning fundamentals.'
    },
    {
      code: 'MAT301',
      name: 'Discrete Mathematics & Graph Theory',
      faculty: 'Prof. David Kumar',
      credits: 3,
      color: '#ec4899',
      description: 'Combinatorics, recurrences, graph colorings, planar graphs, network flows, and formal proofs.'
    },
    {
      code: 'CSE305L',
      name: 'Systems Programming Lab',
      faculty: 'Prof. Elena Rostova',
      credits: 2,
      color: '#06b6d4',
      description: 'Hands-on socket programming, POSIX threads, memory leak profiling, and Linux kernel module basics.'
    }
  ];

  for (const c of courses) {
    db.run(
      `INSERT OR IGNORE INTO courses (code, name, faculty, credits, color, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [c.code, c.name, c.faculty, c.credits, c.color, c.description]
    );

    db.run(
      `INSERT OR IGNORE INTO student_courses (student_id, course_code, enrollment_date)
       VALUES (?, ?, ?)`,
      ['STU2026001', c.code, '2026-08-15']
    );
  }

  // 3. Insert Demo Exams
  const demoExams = [
    {
      subject_name: 'Data Structures',
      subject_code: 'CSE301',
      exam_date: '2026-10-25',
      start_time: '10:00 AM',
      end_time: '1:00 PM',
      exam_type: 'Midterm',
      venue: 'Room 301',
      topics: 'Trees, Graphs, Sorting',
      preparation_status: 'In Progress',
      checklist: JSON.stringify([
        { id: '1', text: 'Review Red-Black tree rotations and balancing', completed: true },
        { id: '2', text: 'Practice Dijkstra and Bellman-Ford shortest paths', completed: true },
        { id: '3', text: 'Solve past papers on QuickSort worst-case proofs', completed: false },
        { id: '4', text: 'Brush up Disjoint Set Union (DSU) rank heuristics', completed: false }
      ]),
      notes: 'Bring scientific calculator and university identity card. Formula sheet will be provided.'
    },
    {
      subject_name: 'Database Management Systems',
      subject_code: 'CSE302',
      exam_date: '2026-10-28',
      start_time: '2:00 PM',
      end_time: '5:00 PM',
      exam_type: 'Internal',
      venue: 'Room 204',
      topics: 'SQL, Normalization, Transactions',
      preparation_status: 'In Progress',
      checklist: JSON.stringify([
        { id: '1', text: 'Practice SQL nested subqueries & window functions', completed: true },
        { id: '2', text: 'Verify 3NF and BCNF decomposition rules', completed: false },
        { id: '3', text: 'Review Two-Phase Locking and serializability graphs', completed: false }
      ]),
      notes: 'Internal evaluation test. Counts 25% towards final continuous assessment.'
    },
    {
      subject_name: 'Operating Systems',
      subject_code: 'CSE303',
      exam_date: '2026-11-02',
      start_time: '10:00 AM',
      end_time: '1:00 PM',
      exam_type: 'Midterm',
      venue: 'Room 105',
      topics: 'Processes, Scheduling, Deadlocks',
      preparation_status: 'Not Started',
      checklist: JSON.stringify([
        { id: '1', text: 'Understand Bankers Algorithm for deadlock avoidance', completed: false },
        { id: '2', text: 'Compare round-robin vs multi-level feedback queues', completed: false },
        { id: '3', text: 'Trace producer-consumer semaphore implementation', completed: false }
      ]),
      notes: 'Focus on chapters 3, 5, and 7 of Silberschatz textbook.'
    },
    {
      subject_name: 'Artificial Intelligence',
      subject_code: 'CSE304',
      exam_date: '2026-11-06',
      start_time: '9:30 AM',
      end_time: '12:30 PM',
      exam_type: 'Internal',
      venue: 'Room 302',
      topics: 'Search Algorithms, Machine Learning Basics',
      preparation_status: 'Not Started',
      checklist: JSON.stringify([
        { id: '1', text: 'Derive heuristic admissibility for A* search', completed: false },
        { id: '2', text: 'Alpha-beta pruning tree traversal practice', completed: false },
        { id: '3', text: 'Naive Bayes classifier probability calculation', completed: false }
      ]),
      notes: 'Mid-semester review test with Professor Sarah Chen.'
    }
  ];

  for (const e of demoExams) {
    db.run(
      `INSERT INTO exams (
        student_id, subject_name, subject_code, exam_date, start_time, end_time,
        exam_type, venue, topics, preparation_status, syllabus_checklist, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'STU2026001', e.subject_name, e.subject_code, e.exam_date, e.start_time, e.end_time,
        e.exam_type, e.venue, e.topics, e.preparation_status, e.checklist, e.notes
      ]
    );
  }

  // 4. Insert Demo Assignments
  const demoAssignments = [
    {
      title: 'Complete DSA Problem Set',
      subject: 'Data Structures & Algorithms',
      subject_code: 'CSE301',
      description: 'Implement AVL tree rebalancing and solve 4 competitive programming problems on graph cycle detection.',
      due_date: '2026-10-20',
      due_time: '11:59 PM',
      priority: 'High',
      status: 'Pending',
      submission_notes: 'Submit GitHub repository link and PDF report on Course Portal.'
    },
    {
      title: 'DBMS SQL Practice',
      subject: 'Database Management Systems',
      subject_code: 'CSE302',
      description: 'Write complex analytical queries using window functions (RANK, DENSE_RANK, PARTITION BY) on university schema.',
      due_date: '2026-10-22',
      due_time: '05:00 PM',
      priority: 'Medium',
      status: 'In Progress',
      submission_notes: 'Includes DDL script and query output verification logs.'
    },
    {
      title: 'AI Mini Project Proposal',
      subject: 'Artificial Intelligence',
      subject_code: 'CSE304',
      description: 'Submit 2-page project proposal on heuristic search pathfinding for robotic autonomous navigation in warehouse grids.',
      due_date: '2026-10-24',
      due_time: '11:59 PM',
      priority: 'High',
      status: 'Pending',
      submission_notes: 'Team submission (Alex Morgan & Maya Lin). Include dataset references.'
    },
    {
      title: 'OS Semaphore Simulation Lab',
      subject: 'Operating Systems',
      subject_code: 'CSE303',
      description: 'Simulate dining philosophers problem using C POSIX mutexes and avoid circular wait conditions.',
      due_date: '2026-10-29',
      due_time: '11:59 PM',
      priority: 'Low',
      status: 'In Progress',
      submission_notes: 'Tested on Ubuntu 24.04 LTS environment with Valgrind.'
    }
  ];

  for (const a of demoAssignments) {
    db.run(
      `INSERT INTO assignments (
        student_id, title, subject, subject_code, description, due_date, due_time,
        priority, status, submission_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'STU2026001', a.title, a.subject, a.subject_code, a.description, a.due_date, a.due_time,
        a.priority, a.status, a.submission_notes
      ]
    );
  }

  // 5. Insert Timetable
  const timetableSlots = [
    // Monday
    { day: 'Monday', subject: 'Data Structures & Algorithms', course_code: 'CSE301', start_time: '09:00 AM', end_time: '10:30 AM', classroom: 'Room 301', faculty_name: 'Dr. Robert Lang', type: 'Lecture' },
    { day: 'Monday', subject: 'Operating Systems', course_code: 'CSE303', start_time: '11:00 AM', end_time: '12:30 PM', classroom: 'Room 105', faculty_name: 'Dr. Marcus Vance', type: 'Lecture' },
    { day: 'Monday', subject: 'Systems Programming Lab', course_code: 'CSE305L', start_time: '02:00 PM', end_time: '04:30 PM', classroom: 'Computing Lab 4', faculty_name: 'Prof. Elena Rostova', type: 'Lab' },
    
    // Tuesday
    { day: 'Tuesday', subject: 'Database Management Systems', course_code: 'CSE302', start_time: '09:30 AM', end_time: '11:00 AM', classroom: 'Room 204', faculty_name: 'Prof. Elena Rostova', type: 'Lecture' },
    { day: 'Tuesday', subject: 'Artificial Intelligence', course_code: 'CSE304', start_time: '11:30 AM', end_time: '01:00 PM', classroom: 'Room 302', faculty_name: 'Dr. Sarah Chen', type: 'Lecture' },
    { day: 'Tuesday', subject: 'Discrete Mathematics', course_code: 'MAT301', start_time: '02:30 PM', end_time: '04:00 PM', classroom: 'Room 210', faculty_name: 'Prof. David Kumar', type: 'Tutorial' },

    // Wednesday
    { day: 'Wednesday', subject: 'Data Structures & Algorithms', course_code: 'CSE301', start_time: '09:00 AM', end_time: '10:30 AM', classroom: 'Room 301', faculty_name: 'Dr. Robert Lang', type: 'Lecture' },
    { day: 'Wednesday', subject: 'Database Management Systems', course_code: 'CSE302', start_time: '11:00 AM', end_time: '12:30 PM', classroom: 'Room 204', faculty_name: 'Prof. Elena Rostova', type: 'Lecture' },
    { day: 'Wednesday', subject: 'Operating Systems Discussion', course_code: 'CSE303', start_time: '02:00 PM', end_time: '03:30 PM', classroom: 'Room 105', faculty_name: 'Dr. Marcus Vance', type: 'Tutorial' },

    // Thursday
    { day: 'Thursday', subject: 'Artificial Intelligence', course_code: 'CSE304', start_time: '09:30 AM', end_time: '11:00 AM', classroom: 'Room 302', faculty_name: 'Dr. Sarah Chen', type: 'Lecture' },
    { day: 'Thursday', subject: 'Discrete Mathematics', course_code: 'MAT301', start_time: '11:30 AM', end_time: '01:00 PM', classroom: 'Room 210', faculty_name: 'Prof. David Kumar', type: 'Lecture' },
    { day: 'Thursday', subject: 'Research & Project Seminar', course_code: 'CSE304', start_time: '02:30 PM', end_time: '04:00 PM', classroom: 'Auditorium B', faculty_name: 'Dr. Sarah Chen', type: 'Seminar' },

    // Friday
    { day: 'Friday', subject: 'Data Structures Tutorial', course_code: 'CSE301', start_time: '10:00 AM', end_time: '11:30 AM', classroom: 'Room 301', faculty_name: 'Dr. Robert Lang', type: 'Tutorial' },
    { day: 'Friday', subject: 'Database Lab Practice', course_code: 'CSE302', start_time: '01:30 PM', end_time: '03:30 PM', classroom: 'Database Lab 2', faculty_name: 'Prof. Elena Rostova', type: 'Lab' }
  ];

  for (const t of timetableSlots) {
    db.run(
      `INSERT INTO timetable (
        student_id, day, subject, course_code, start_time, end_time, classroom, faculty_name, type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['STU2026001', t.day, t.subject, t.course_code, t.start_time, t.end_time, t.classroom, t.faculty_name, t.type]
    );
  }

  // 6. Insert Attendance records (Calculating ~92%)
  const attendanceRecords = [
    { course_code: 'CSE301', course_name: 'Data Structures & Algorithms', total: 30, attended: 28 },
    { course_code: 'CSE302', course_name: 'Database Management Systems', total: 30, attended: 27 },
    { course_code: 'CSE303', course_name: 'Operating Systems', total: 28, attended: 26 },
    { course_code: 'CSE304', course_name: 'Artificial Intelligence', total: 27, attended: 25 },
    { course_code: 'MAT301', course_name: 'Discrete Mathematics & Graph Theory', total: 26, attended: 24 },
    { course_code: 'CSE305L', course_name: 'Systems Programming Lab', total: 15, attended: 14 }
  ];

  for (const att of attendanceRecords) {
    db.run(
      `INSERT INTO attendance (student_id, course_code, course_name, total_classes, attended_classes)
       VALUES (?, ?, ?, ?, ?)`,
      ['STU2026001', att.course_code, att.course_name, att.total, att.attended]
    );
  }

  // 7. Insert Academic Grades (Historical records resulting in Cumulative GPA: 3.84)
  const grades = [
    // Semester 4 (Recent)
    { course_code: 'CSE201', course_name: 'Design and Analysis of Algorithms', semester: 4, credits: 4, marks_obtained: 94, max_marks: 100, grade: 'A+', grade_point: 4.0 },
    { course_code: 'CSE202', course_name: 'Computer Organization & Architecture', semester: 4, credits: 4, marks_obtained: 88, max_marks: 100, grade: 'A', grade_point: 3.7 },
    { course_code: 'CSE203', course_name: 'Object Oriented Software Engineering', semester: 4, credits: 3, marks_obtained: 92, max_marks: 100, grade: 'A+', grade_point: 4.0 },
    { course_code: 'MAT201', course_name: 'Linear Algebra & Probability', semester: 4, credits: 4, marks_obtained: 86, max_marks: 100, grade: 'B+', grade_point: 3.3 },
    { course_code: 'CSE204L', course_name: 'Algorithm Implementation Lab', semester: 4, credits: 2, marks_obtained: 96, max_marks: 100, grade: 'A+', grade_point: 4.0 },

    // Semester 3
    { course_code: 'CSE103', course_name: 'Digital Logic and Microprocessors', semester: 3, credits: 4, marks_obtained: 90, max_marks: 100, grade: 'A', grade_point: 3.7 },
    { course_code: 'CSE104', course_name: 'Theory of Computation', semester: 3, credits: 4, marks_obtained: 91, max_marks: 100, grade: 'A', grade_point: 3.7 },
    { course_code: 'MAT102', course_name: 'Differential Equations and Transforms', semester: 3, credits: 4, marks_obtained: 89, max_marks: 100, grade: 'A', grade_point: 3.7 },
    { course_code: 'HSS101', course_name: 'Technical Writing & Academic Ethics', semester: 3, credits: 2, marks_obtained: 95, max_marks: 100, grade: 'A+', grade_point: 4.0 }
  ];

  for (const g of grades) {
    db.run(
      `INSERT INTO grades (
        student_id, course_code, course_name, semester, credits, marks_obtained, max_marks, grade, grade_point
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['STU2026001', g.course_code, g.course_name, g.semester, g.credits, g.marks_obtained, g.max_marks, g.grade, g.grade_point]
    );
  }

  // 8. Insert Study Notes
  const notes = [
    {
      title: 'AVL Trees & Rotations Cheat Sheet',
      subject: 'Data Structures & Algorithms',
      subject_code: 'CSE301',
      tags: JSON.stringify(['Trees', 'Self-Balancing', 'Complexity']),
      content: `### AVL Tree Self-Balancing Rules
1. **Balance Factor (BF)** = height(left_subtree) - height(right_subtree)
   - Valid AVL node: BF in {-1, 0, +1}
2. **Rotation Cases**:
   - **Left-Left (LL)**: Single Right Rotation at unbalanced node.
   - **Right-Right (RR)**: Single Left Rotation at unbalanced node.
   - **Left-Right (LR)**: Left rotation on child, then Right rotation on parent.
   - **Right-Left (RL)**: Right rotation on child, then Left rotation on parent.
3. **Time Complexity**:
   - Search: O(log n)
   - Insertion: O(log n) + at most 2 rotations
   - Deletion: O(log n) + up to O(log n) rotations`
    },
    {
      title: 'SQL Normalization: 1NF to BCNF Summary',
      subject: 'Database Management Systems',
      subject_code: 'CSE302',
      tags: JSON.stringify(['Normalization', 'Relational', 'SQL']),
      content: `### Database Normalization Hierarchy
- **1NF**: Atomic attributes, no repeating groups.
- **2NF**: In 1NF + No partial dependencies (every non-prime attribute is fully functionally dependent on candidate key).
- **3NF**: In 2NF + No transitive dependencies (for X -> A, either X is superkey or A is prime attribute).
- **BCNF**: Strictly for every non-trivial FD X -> Y, X MUST be a superkey.
- **Lossless Decomposition Check**: R1 ∩ R2 -> R1 or R1 ∩ R2 -> R2.`
    },
    {
      title: 'CPU Scheduling Algorithms Comparison',
      subject: 'Operating Systems',
      subject_code: 'CSE303',
      tags: JSON.stringify(['CPU', 'Scheduling', 'Processes']),
      content: `### Comparative Analysis
- **FCFS**: Non-preemptive, suffers from Convoy Effect.
- **SJF**: Optimal average waiting time, difficult to predict next CPU burst.
- **Round Robin**: Preemptive, quantum selection is critical (too small -> overhead, too large -> FCFS).
- **Priority Inversion**: Solved by Priority Inheritance Protocol.`
    }
  ];

  for (const n of notes) {
    db.run(
      `INSERT INTO study_notes (student_id, title, subject, subject_code, content, tags)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['STU2026001', n.title, n.subject, n.subject_code, n.content, n.tags]
    );
  }

  // 9. Insert Study Materials
  const materials = [
    {
      title: 'Graph Algorithms Lecture Slides (Week 7)',
      subject: 'Data Structures & Algorithms',
      subject_code: 'CSE301',
      description: 'Comprehensive slides on BFS, DFS, Topological Sorting, and strongly connected components with Tarjan.',
      file_type: 'Slide Deck',
      file_url: '#download-cse301-w7',
      file_size: '4.8 MB'
    },
    {
      title: 'Relational Algebra & SQL Cheatsheet',
      subject: 'Database Management Systems',
      subject_code: 'CSE302',
      description: 'Quick reference guide with syntax examples for joins, group by, aggregation, and subqueries.',
      file_type: 'PDF',
      file_url: '#download-cse302-sql',
      file_size: '2.1 MB'
    },
    {
      title: 'POSIX Threads Synchronization Code Examples',
      subject: 'Systems Programming Lab',
      subject_code: 'CSE305L',
      description: 'C code demonstrations for pthread_create, pthread_join, pthread_mutex_lock, and condition variables.',
      file_type: 'Code Zip',
      file_url: '#download-cse305l-threads',
      file_size: '1.2 MB'
    },
    {
      title: 'A* Search Implementation Guide',
      subject: 'Artificial Intelligence',
      subject_code: 'CSE304',
      description: 'Python implementation breakdown of priority queue heuristics for grid map navigation.',
      file_type: 'PDF',
      file_url: '#download-cse304-astar',
      file_size: '3.4 MB'
    }
  ];

  for (const m of materials) {
    db.run(
      `INSERT INTO study_materials (student_id, title, subject, subject_code, description, file_type, file_url, file_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['STU2026001', m.title, m.subject, m.subject_code, m.description, m.file_type, m.file_url, m.file_size]
    );
  }

  // 10. Insert Focus Sessions (Simulating 14-day streak, 2 sessions today)
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const demoSessions = [
    { session_type: 'Pomodoro Focus', duration_minutes: 25, subject: 'Data Structures (Trees & Graphs)', notes: 'Practiced AVL tree rotations', completed_at: `${todayStr} 09:30:00` },
    { session_type: 'Pomodoro Focus', duration_minutes: 25, subject: 'Database Management (SQL)', notes: 'Completed practice problem set 3', completed_at: `${todayStr} 11:15:00` },
    { session_type: 'Pomodoro Focus', duration_minutes: 25, subject: 'Operating Systems (Paging)', notes: 'Reviewed virtual memory equations', completed_at: `${todayStr} 15:45:00` }
  ];

  for (const s of demoSessions) {
    db.run(
      `INSERT INTO focus_sessions (student_id, session_type, duration_minutes, subject, notes, completed_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['STU2026001', s.session_type, s.duration_minutes, s.subject, s.notes, s.completed_at]
    );
  }

  console.log('Demo student database successfully initialized!');
}
