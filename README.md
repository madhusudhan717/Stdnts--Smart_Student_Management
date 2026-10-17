# STDNTS — Smart Student Management System

A modern, high-performance Student Management Web Portal built with React, Vite, Node.js, Express, and a local SQLite database engine.

---

## 1. Demo Credentials

The database is pre-seeded with a comprehensive demo student record and realistic academic datasets.

| Field | Demo Credential |
| :--- | :--- |
| **Student ID** | `STU2026001` |
| **Email** | `student@example.com` |
| **Password** | `Student@123` |

> *Tip:* On the login screen, convenient **"Fill Student ID"** and **"Fill Email"** buttons are available for instant testing.

---

## 2. Key Modules & Features

1. **Personalized Dashboard**
   - Time-aware welcome message: *"Good morning/afternoon/evening, Alex"*
   - Key academic KPIs: **3.84 / 4.00 CGPA** (sample data), **14-day study streak**, **3 pending assignments**, **4 upcoming exams**, **92% attendance**.
   - Today's dynamic lecture timetable with room and faculty assignments.
   - Upcoming exams timeline with automated days-remaining countdowns.
   - Priority coursework deliverables with instant completion toggles.

2. **Signature Pomodoro Focus Session Widget**
   - Sleek dark productivity widget.
   - Standard 25-minute focus intervals, 5-minute short breaks, 15-minute long breaks.
   - Start, pause, resume, and reset states.
   - Course association dropdown (links sessions to active courses like *Data Structures* or *DBMS*).
   - Celebration confetti animation and automated session logging to SQLite upon timer completion.
   - Tracks today's completed sessions and total minutes studied.

3. **Upcoming Exams & Exam Scheduling**
   - Full exam management module with chronological ordering.
   - Fields: Exam ID, Subject Name, Subject Code, Date, Start/End Time, Venue, Examination Type (*Midterm, Internal, Practical, Semester*), Preparation Status, Notes.
   - Interactive syllabus prep checklist with check/uncheck persistence.
   - Automated "Days Remaining" countdown badges (highlighting exams within 3 days).
   - Filtering by Exam Type and Subject; full-text search across topics and names.
   - Dedicated "Past & Concluded Examinations" section.

4. **Assignments & Tasks**
   - Coursework deliverable tracker with Priority badges (*High, Medium, Low*).
   - Dynamic deadline tracking with *Overdue* and *Due in X days* warnings.
   - One-click checkbox completion directly from the table or cards.
   - Filter by status (*Pending, In Progress, Completed, Overdue*) and priority.

5. **Courses & Enrolled Subjects**
   - Catalog of registered courses (e.g. `CSE301`, `CSE302`, `CSE303`, `CSE304`, `MAT301`, `CSE305L`).
   - Displays credits, primary faculty, course syllabus descriptions, and per-course attendance rates.
   - Detailed course modal with next scheduled exam alerts.

6. **Dynamic Attendance Tracker**
   - Overall compliance badge with the institutional 75% minimum eligibility threshold.
   - Course-by-course attendance progress bars.
   - Dynamic calculations: classes attended, total held, classes missed.
   - Deficit recovery advisor: calculates exact number of consecutive classes required to restore eligibility if attendance falls below 75%.
   - Quick testing actions: **"Present (+1)"** and **"Absent (+1)"** buttons to test dynamic recalculation in real time.

7. **Results & Transcripts (4.0 GPA)**
   - Cumulative GPA calculated dynamically from semester credit weights ($CGPA = \frac{\sum (GradePoint \times Credits)}{\sum Credits}$).
   - Transcripts grouped by semester (Semester 4, Semester 3, etc.).
   - Letter grade distribution ($A+, A, B+, B, C+, C, D, F$).
   - Full CRUD support: Add, edit, and delete grade records with automatic letter grade derivation.

8. **Notes & Study Resources**
   - Categorized by subject and searchable by keywords or hashtags.
   - Study Notes tab with formatted Markdown and code block view.
   - Course Materials & Handouts tab with simulated document reader and file downloaders.

9. **Weekly Class Schedule & Calendar**
   - Day-by-day timetable tabs (Monday through Saturday).
   - Displays lecture time blocks, room numbers, faculty names, and session types (*Lecture, Lab, Tutorial, Seminar*).
   - Cross-references upcoming exams and deliverables for the selected week.

10. **Student Profile**
    - Student ID, Full Name, Program, Department, Semester, Batch, and Academic Year.
    - Editable contact details (phone number, dorm address, avatar URL).
    - Database persistence status indicator.

---

## 3. Technology Architecture

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React icons, Canvas Confetti.
- **Backend**: Node.js, Express.js.
- **Database**: SQLite stored locally at `server/database/student_management.db` via `sql.js` (WebAssembly SQLite engine).
- **Authentication**: `bcryptjs` password hashing (passwords never stored in plaintext), JSON Web Tokens (`jsonwebtoken`).
- **Security**: Protected `/api/*` endpoints with token verification middleware; strict student ID ownership filtering on every SQL query.

---

## 4. Local Execution Instructions (Windows / Mac / Linux)

### Prerequisites
- Node.js LTS (v18 or higher recommended)
- Git (optional)

### Step-by-Step Setup
1. **Clone or open project directory in VS Code**:
   ```bash
   cd student-management-system
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Verify `.env` configuration**:
   Ensure `.env` exists (copied from `.env.example`):
   ```env
   JWT_SECRET="stdnts-super-secret-jwt-key-2026-academic-portal"
   PORT=3000
   NODE_ENV="development"
   ```

4. **Start the application**:
   ```bash
   npm run dev
   ```
   *Note:* The SQLite database file (`server/database/student_management.db`) is automatically initialized, schema-migrated, and pre-seeded with demo records on the very first boot. No manual SQL imports are required.

5. **Open in browser**:
   Navigate to `http://localhost:3000`

---

## 5. Testing & Validation Checklist

- [x] **Demo Login**: Sign in with `STU2026001` and `Student@123` (or use the one-click fill button).
- [x] **Invalid Login Rejection**: Try incorrect passwords; verify error banner appears.
- [x] **Protected Routes**: API requests without valid bearer tokens return 401 Unauthorized.
- [x] **Exams Management**: Create a new exam, toggle syllabus checklist items, verify countdown badge.
- [x] **Assignments**: Mark a task completed; verify counters update on the dashboard and assignments tab.
- [x] **Focus Session**: Start the Pomodoro timer, test break mode, complete a cycle, and verify session logs to SQLite with confetti.
- [x] **Attendance**: Click "Present (+1)" on a course; observe dynamic percentage and overall compliance updating immediately.
- [x] **Persistence**: Restart the server; all added exams, notes, attendance numbers, and profile changes remain safely in `server/database/student_management.db`.
