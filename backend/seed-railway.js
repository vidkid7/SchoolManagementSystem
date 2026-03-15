/**
 * RAILWAY DATABASE SEED SCRIPT
 * Tailored to the exact Railway MySQL schema.
 *
 * Usage:
 *   DATABASE_URL="mysql://..." node backend/seed-railway.js
 */

require('dotenv').config({ path: './backend/.env' });
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const SCHOOL_CONFIG_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

// ─── DB CONNECTION ─────────────────────────────────────────────────────────────
async function getConnection() {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    const url = new URL(dbUrl);
    return mysql.createConnection({
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: { rejectUnauthorized: false },
      multipleStatements: false,
    });
  }
  return mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'railway',
  });
}

// ─── HASH ──────────────────────────────────────────────────────────────────────
async function h(pw) { return bcrypt.hash(pw, 10); }

// ─── HELPERS ───────────────────────────────────────────────────────────────────
function pad(n, len = 3) { return String(n).padStart(len, '0'); }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function sqlDate(dateStr) { return dateStr + ' 00:00:00'; }

// Bulk insert helper: splits rows into chunks and inserts them
async function bulkInsert(conn, table, columns, rows, chunkSize = 500) {
  if (rows.length === 0) return;
  const colStr = columns.map(c => `\`${c}\``).join(', ');
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const placeholders = chunk.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');
    const values = chunk.flat();
    await conn.query(`INSERT INTO \`${table}\` (${colStr}) VALUES ${placeholders}`, values);
  }
}

// ─── CONSTANTS ─────────────────────────────────────────────────────────────────
const GRADE_LEVELS = [6, 7, 8, 9, 10];
const SECTIONS = ['A', 'B'];
const STUDENTS_PER_CLASS = 15;

const ACADEMIC_YEARS = [
  { name: 'AY 2079/80', start_bs: '2079-04-01', end_bs: '2080-03-31', start_ad: '2022-07-17 00:00:00', end_ad: '2023-07-15 00:00:00', is_current: 0 },
  { name: 'AY 2080/81', start_bs: '2080-04-01', end_bs: '2081-03-31', start_ad: '2023-07-17 00:00:00', end_ad: '2024-07-15 00:00:00', is_current: 0 },
  { name: 'AY 2081/82', start_bs: '2081-04-01', end_bs: '2082-03-31', start_ad: '2024-07-16 00:00:00', end_ad: '2025-07-15 00:00:00', is_current: 1 },
];

const SUBJECTS = [
  { code: 'NEP101', name_en: 'Nepali', name_np: 'नेपाली', type: 'compulsory', classes: [6,7,8,9,10] },
  { code: 'ENG101', name_en: 'English', name_np: 'अंग्रेजी', type: 'compulsory', classes: [6,7,8,9,10] },
  { code: 'MAT101', name_en: 'Mathematics', name_np: 'गणित', type: 'compulsory', classes: [6,7,8,9,10] },
  { code: 'SCI101', name_en: 'Science', name_np: 'विज्ञान', type: 'compulsory', classes: [6,7,8,9,10] },
  { code: 'SST101', name_en: 'Social Studies', name_np: 'सामाजिक अध्ययन', type: 'compulsory', classes: [6,7,8,9,10] },
  { code: 'HPE101', name_en: 'Health & PE', name_np: 'स्वास्थ्य तथा शारीरिक शिक्षा', type: 'compulsory', classes: [6,7,8,9,10] },
  { code: 'COM101', name_en: 'Computer Science', name_np: 'कम्प्युटर विज्ञान', type: 'optional', classes: [7,8,9,10] },
  { code: 'ART101', name_en: 'Art & Music', name_np: 'कला तथा संगीत', type: 'optional', classes: [6,7,8] },
  { code: 'PHY101', name_en: 'Physics', name_np: 'भौतिक शास्त्र', type: 'optional', classes: [9,10] },
  { code: 'CHM101', name_en: 'Chemistry', name_np: 'रसायन शास्त्र', type: 'optional', classes: [9,10] },
];

const STAFF_ROLES = [
  { role: 'School_Admin',        suffix: 'admin',  password: 'Admin@123',      position: 'School Administrator', employment_type: 'permanent' },
  { role: 'Class_Teacher',       suffix: 'ct',     password: 'Teacher@123',     position: 'Class Teacher',        employment_type: 'permanent' },
  { role: 'Subject_Teacher',     suffix: 'st',     password: 'Teacher@123',     position: 'Subject Teacher',      employment_type: 'permanent' },
  { role: 'Department_Head',     suffix: 'dh',     password: 'DeptHead@123',    position: 'Department Head',      employment_type: 'permanent' },
  { role: 'ECA_Coordinator',     suffix: 'eca',    password: 'ECACoord@123',    position: 'ECA Coordinator',      employment_type: 'permanent' },
  { role: 'Sports_Coordinator',  suffix: 'sc',     password: 'SportsCoord@123', position: 'Sports Coordinator',   employment_type: 'permanent' },
  { role: 'Librarian',           suffix: 'lib',    password: 'Librarian@123',   position: 'Librarian',            employment_type: 'permanent' },
  { role: 'Accountant',          suffix: 'acc',    password: 'Accountant@123',  position: 'Accountant',           employment_type: 'permanent' },
  { role: 'Transport_Manager',   suffix: 'tm',     password: 'Transport@123',   position: 'Transport Manager',    employment_type: 'contract'  },
  { role: 'Hostel_Warden',       suffix: 'hw',     password: 'Hostel@123',      position: 'Hostel Warden',        employment_type: 'permanent' },
  { role: 'Non_Teaching_Staff',  suffix: 'nts',    password: 'Staff@123',       position: 'Office Staff',         employment_type: 'temporary' },
];

// ─── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Starting Railway database seeding...');
  const conn = await getConnection();
  console.log('✅ Connected to Railway database');

  try {
    // ── CLEAR ───────────────────────────────────────────────────────────────────
    console.log('\n🗑️  Clearing existing data...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    const clearTables = [
      'refunds', 'payments', 'invoice_items', 'invoices',
      'eca_enrollments', 'sports_enrollments', 'circulations',
      'certificates', 'group_messages', 'group_members', 'group_conversations',
      'messages', 'conversations', 'grades', 'exams',
      'periods', 'timetables', 'syllabus_topics', 'syllabi',
      'attendance', 'students', 'classes', 'ecas', 'sports', 'books',
      'terms', 'academic_years', 'staff', 'users', 'subjects',
      'grading_schemes', 'attendance_rules', 'certificate_templates',
    ];
    for (const t of clearTables) {
      await conn.query(`TRUNCATE TABLE \`${t}\``);
    }
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ All tables cleared');

    // ── GRADING SCHEME ──────────────────────────────────────────────────────────
    const gradingSchemeId = uuidv4();
    await conn.query(
      'INSERT INTO grading_schemes (id, name, description, is_default, is_active, grades, created_at, updated_at) VALUES (?, ?, ?, 1, 1, ?, NOW(), NOW())',
      [gradingSchemeId, 'NEB Grading System', 'National Examination Board grading',
        JSON.stringify([
          { grade: 'A+', min: 90, max: 100, gpa: 4.0, remarks: 'Outstanding' },
          { grade: 'A',  min: 80, max: 89,  gpa: 3.6, remarks: 'Excellent' },
          { grade: 'B+', min: 70, max: 79,  gpa: 3.2, remarks: 'Very Good' },
          { grade: 'B',  min: 60, max: 69,  gpa: 2.8, remarks: 'Good' },
          { grade: 'C+', min: 50, max: 59,  gpa: 2.4, remarks: 'Satisfactory' },
          { grade: 'C',  min: 40, max: 49,  gpa: 2.0, remarks: 'Acceptable' },
          { grade: 'D',  min: 35, max: 39,  gpa: 1.6, remarks: 'Partially Acceptable' },
          { grade: 'NG', min: 0,  max: 34,  gpa: 0.0, remarks: 'Not Graded' },
        ])
      ]
    );
    console.log('✅ Grading scheme created');

    // ── ATTENDANCE RULES ────────────────────────────────────────────────────────
    const attendanceRulesId = uuidv4();
    await conn.query(
      'INSERT INTO attendance_rules (id, name, description, minimum_attendance_percentage, low_attendance_threshold, critical_attendance_threshold, correction_window_hours, allow_teacher_correction, allow_admin_correction, max_leave_days_per_month, max_leave_days_per_year, require_leave_approval, enable_low_attendance_alerts, alert_parents, alert_admins, is_active, created_at, updated_at) VALUES (?, ?, ?, 75, 75, 60, 24, 1, 1, 5, 30, 1, 1, 1, 1, 1, NOW(), NOW())',
      [attendanceRulesId, 'Default Attendance Policy', 'Standard attendance rules for Nepalese schools']
    );
    console.log('✅ Attendance rules created');

    // ── CERTIFICATE TEMPLATES ───────────────────────────────────────────────────
    const certTypes = ['character', 'transfer', 'academic_excellence', 'bonafide'];
    const certTemplateIds = [];
    for (const ct of certTypes) {
      const [r] = await conn.query(
        'INSERT INTO certificate_templates (name, type, template_html, variables, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 1, NOW(), NOW())',
        [`${ct.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())} Certificate`, ct,
          `<html><body><h1>${ct} Certificate</h1><p>This is to certify that {{student_name}} has {{achievement}}.</p></body></html>`,
          JSON.stringify(['student_name', 'achievement', 'date', 'school_name'])]
      );
      certTemplateIds.push(r.insertId);
    }
    console.log('✅ Certificate templates created');

    // ── ACADEMIC YEARS & TERMS ──────────────────────────────────────────────────
    const academicYearIds = [];
    for (const ay of ACADEMIC_YEARS) {
      const [r] = await conn.query(
        'INSERT INTO academic_years (name, start_date_bs, end_date_bs, start_date_ad, end_date_ad, is_current, status, school_config_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [ay.name, ay.start_bs, ay.end_bs, ay.start_ad, ay.end_ad, ay.is_current, ay.is_current ? 'active' : 'completed', SCHOOL_CONFIG_ID]
      );
      academicYearIds.push(r.insertId);
      // 3 terms per academic year
      const termNames = ['First Term', 'Second Term', 'Third Term'];
      const [startY, startM] = ay.start_ad.split('-').map(Number);
      for (let ti = 0; ti < 3; ti++) {
        const termStart = new Date(startY, startM - 1 + ti * 4, 1);
        const termEnd   = new Date(startY, startM - 1 + ti * 4 + 3, 30);
        const examStart = new Date(startY, startM - 1 + ti * 4 + 3, 15);
        const examEnd   = new Date(startY, startM - 1 + ti * 4 + 3, 28);
        await conn.query(
          'INSERT INTO terms (academic_year_id, name, start_date, end_date, exam_start_date, exam_end_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
          [r.insertId, termNames[ti],
            termStart.toISOString().slice(0,19).replace('T',' '),
            termEnd.toISOString().slice(0,19).replace('T',' '),
            examStart.toISOString().slice(0,19).replace('T',' '),
            examEnd.toISOString().slice(0,19).replace('T',' ')]
        );
      }
    }
    const currentAYId = academicYearIds[2]; // 2081/82 is current
    // Get term IDs for current AY
    const [termRows] = await conn.query('SELECT term_id FROM terms WHERE academic_year_id = ? ORDER BY term_id', [currentAYId]);
    const termIds = termRows.map(r => r.term_id);
    console.log(`✅ 3 academic years + 9 terms created`);

    // ── SUBJECTS ────────────────────────────────────────────────────────────────
    const subjectIds = [];
    for (const s of SUBJECTS) {
      const [r] = await conn.query(
        'INSERT INTO subjects (code, name_en, name_np, type, credit_hours, theory_marks, practical_marks, pass_marks, full_marks, applicable_classes, description, created_at, updated_at) VALUES (?, ?, ?, ?, 5, 75, 25, 35, 100, ?, ?, NOW(), NOW())',
        [s.code, s.name_en, s.name_np, s.type, JSON.stringify(s.classes), `${s.name_en} curriculum for grades ${s.classes.join(',')}`]
      );
      subjectIds.push({ id: r.insertId, ...s });
    }
    console.log(`✅ ${SUBJECTS.length} subjects created`);

    // ── STAFF USERS ──────────────────────────────────────────────────────────────
    const staffByRole = {};
    for (const sr of STAFF_ROLES) {
      const username = `${sr.suffix}_school`;
      const email = `${sr.suffix}@school.edu.np`;
      const [uRes] = await conn.query(
        'INSERT INTO users (username, email, password, role, status, municipality_id, school_config_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [username, email, await h(sr.password), sr.role, 'active', null, SCHOOL_CONFIG_ID]
      );
      const userId = uRes.insertId;
      const staffCode = `STF-${sr.suffix.toUpperCase()}-001`;
      const [sRes] = await conn.query(
        'INSERT INTO staff (user_id, staff_code, first_name, last_name, date_of_birth, gender, address, phone, email, emergency_contact, join_date, position, department, employment_type, status, school_config_id, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [userId, staffCode,
          sr.position.split(' ')[0], sr.position.split(' ').slice(1).join(' ') || 'Staff',
          '1985-06-15 00:00:00', 'male',
          'Kathmandu, Nepal', '9800000001', email,
          '9800000099', '2015-07-16 00:00:00',
          sr.position, sr.role === 'School_Admin' ? 'Administration' : 'Academic',
          sr.employment_type, 'active', SCHOOL_CONFIG_ID, sr.role]
      );
      staffByRole[sr.suffix] = { userId, staffId: sRes.insertId };
      console.log(`   ✅ ${sr.role}: ${username} / ${sr.password}`);
    }

    // ── CLASSES ──────────────────────────────────────────────────────────────────
    const classIds = [];
    const classTeacherId = staffByRole['ct'].staffId;
    for (const grade of GRADE_LEVELS) {
      for (const section of SECTIONS) {
        const [r] = await conn.query(
          'INSERT INTO classes (academic_year_id, grade_level, section, shift, class_teacher_id, capacity, current_strength, school_config_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 40, 0, ?, NOW(), NOW())',
          [currentAYId, grade, section, 'morning', classTeacherId, SCHOOL_CONFIG_ID]
        );
        classIds.push({ classId: r.insertId, grade, section });
      }
    }
    console.log(`✅ ${classIds.length} classes created`);

    // ── TIMETABLES & PERIODS ─────────────────────────────────────────────────────
    const subjectTeacherId = staffByRole['st'].staffId;
    const compulsorySubjects = subjectIds.filter(s => s.type === 'compulsory');
    const DAYS = [1, 2, 3, 4, 5];
    const PERIOD_TIMES = [
      ['06:30','07:15'],['07:15','08:00'],['08:00','08:45'],
      ['08:45','09:30'],['09:30','10:15'],['10:15','11:00'],
    ];
    for (const cls of classIds) {
      for (const day of DAYS) {
        const [ttRes] = await conn.query(
          'INSERT INTO timetables (class_id, academic_year_id, day_of_week, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
          [cls.classId, currentAYId, day]
        );
        const ttId = ttRes.insertId;
        for (let pi = 0; pi < Math.min(6, compulsorySubjects.length); pi++) {
          const [st, et] = PERIOD_TIMES[pi];
          await conn.query(
            'INSERT INTO periods (timetable_id, period_number, start_time, end_time, subject_id, teacher_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
            [ttId, pi + 1, st, et, compulsorySubjects[pi % compulsorySubjects.length].id, subjectTeacherId]
          );
        }
      }
    }
    console.log(`✅ Timetables & periods created`);

    // ── SYLLABI ──────────────────────────────────────────────────────────────────
    for (const cls of classIds) {
      const applicableSubjects = subjectIds.filter(s => s.classes.includes(cls.grade));
      for (const subj of applicableSubjects) {
        const [sylRes] = await conn.query(
          'INSERT INTO syllabi (subject_id, class_id, academic_year_id, completed_percentage, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
          [subj.id, cls.classId, currentAYId, randomInt(30, 90)]
        );
        const sylId = sylRes.insertId;
        const topicTitles = ['Introduction', 'Core Concepts', 'Advanced Topics', 'Practical Applications', 'Review & Assessment'];
        for (const title of topicTitles) {
          const status = ['completed','completed','in_progress','not_started','not_started'][topicTitles.indexOf(title)];
          await conn.query(
            'INSERT INTO syllabus_topics (syllabus_id, title, description, estimated_hours, completed_hours, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
            [sylId, `${title} - ${subj.name_en}`, `${title} module for ${subj.name_en}`,
              randomInt(5, 15), status === 'completed' ? randomInt(5,15) : status === 'in_progress' ? randomInt(2,4) : 0, status]
          );
        }
      }
    }
    console.log(`✅ Syllabi & topics created`);

    // ── STUDENTS & PARENTS ───────────────────────────────────────────────────────
    console.log(`\n📋 Seeding students & parents...`);
    const allStudentIds = [];
    const FIRST_NAMES = ['Aarav','Priya','Rohan','Sita','Kiran','Anita','Bikash','Sunita','Dipak','Nisha','Suresh','Laxmi','Rajan','Maya','Arjun'];
    const LAST_NAMES  = ['Sharma','Thapa','Gurung','Poudel','Adhikari','Karki','Shrestha','Tamang','Rai','Magar','Limbu','Chhetri','Pandey','Bista','Maharjan'];
    const stuHashedPw = await h('Student@123');
    const parHashedPw = await h('Parent@123');

    let stuCounter = 1;
    for (const cls of classIds) {
      // Bulk-insert student users first (need insertId per row, so we insert one by one but bcrypt is pre-computed)
      for (let i = 1; i <= STUDENTS_PER_CLASS; i++, stuCounter++) {
        const stuCode = `STU-${pad(stuCounter, 4)}`;
        const firstName = FIRST_NAMES[(i - 1) % 15];
        const lastName  = LAST_NAMES[(i + cls.grade) % 15];
        const dob_ad = `${2000 + (i % 10)}-${pad((i % 12) + 1, 2)}-${pad((i % 28) + 1, 2)} 00:00:00`;
        const dob_bs = `207${i % 9}-${pad((i % 12) + 1, 2)}-${pad((i % 30) + 1, 2)}`;
        const phone = `980${pad(stuCounter, 7)}`;

        const [uRes] = await conn.query(
          'INSERT INTO users (username, email, password, role, status, school_config_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
          [`student_${pad(stuCounter, 4)}`, `student${pad(stuCounter, 4)}@school.edu.np`, stuHashedPw, 'Student', 'active', SCHOOL_CONFIG_ID]
        );
        const [sRes] = await conn.query(
          'INSERT INTO students (user_id, student_code, first_name_en, last_name_en, date_of_birth_bs, date_of_birth_ad, gender, address_en, father_name, father_phone, mother_name, mother_phone, emergency_contact, admission_date, admission_class, current_class_id, roll_number, status, school_config_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
          [uRes.insertId, stuCode, firstName, lastName, dob_bs, dob_ad,
           i % 3 === 0 ? 'female' : 'male', `Ward ${i % 10 + 1}, Kathmandu`,
           `${lastName} Sr.`, phone, `Gita ${lastName}`, phone,
           phone, '2022-04-16 00:00:00', 6, cls.classId, i, 'active', SCHOOL_CONFIG_ID]
        );
        allStudentIds.push({ studentId: sRes.insertId, classId: cls.classId, userId: uRes.insertId });

        if (i % 3 === 1) {
          await conn.query(
            'INSERT INTO users (username, email, password, role, status, school_config_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
            [`parent_${pad(stuCounter, 4)}`, `parent${pad(stuCounter, 4)}@mail.com`, parHashedPw, 'Parent', 'active', SCHOOL_CONFIG_ID]
          );
        }
      }
    }
    console.log(`✅ ${allStudentIds.length} students + parents created`);

    for (const cls of classIds) {
      await conn.query('UPDATE classes SET current_strength = ? WHERE class_id = ?', [STUDENTS_PER_CLASS, cls.classId]);
    }

    // ── ATTENDANCE (BULK) ────────────────────────────────────────────────────────
    console.log(`\n📋 Seeding attendance (bulk)...`);
    const adminUserId = staffByRole['admin'].userId;
    const schoolDays = [];
    let d = new Date('2025-02-01');
    while (schoolDays.length < 20) {
      if (d.getDay() !== 0 && d.getDay() !== 6) schoolDays.push(d.toISOString().slice(0,10));
      d.setDate(d.getDate() + 1);
    }
    const attendanceRows = [];
    const now = new Date().toISOString().slice(0,19).replace('T',' ');
    for (const stuInfo of allStudentIds) {
      for (const day of schoolDays) {
        const status = Math.random() > 0.1 ? 'present' : (Math.random() > 0.5 ? 'absent' : 'late');
        attendanceRows.push([stuInfo.studentId, stuInfo.classId, sqlDate(day), '2081-10-15', status, adminUserId, now, SCHOOL_CONFIG_ID, 'synced', now, now]);
      }
    }
    await bulkInsert(conn, 'attendance', ['student_id','class_id','date','date_bs','status','marked_by','marked_at','school_config_id','sync_status','created_at','updated_at'], attendanceRows);
    console.log(`✅ ${attendanceRows.length} attendance records created`);

    // ── EXAMS & GRADES (BULK) ────────────────────────────────────────────────────
    console.log(`\n📝 Seeding exams & grades...`);
    const examTypes = ['first_terminal', 'second_terminal', 'final'];
    let totalExams = 0, totalGrades = 0;
    for (const cls of classIds) {
      const clsSubjects = subjectIds.filter(s => s.classes.includes(cls.grade)).slice(0, 4);
      for (let ei = 0; ei < examTypes.length; ei++) {
        const termId = termIds[ei] || termIds[0];
        for (const subj of clsSubjects) {
          const examDate = new Date('2025-02-01');
          examDate.setDate(examDate.getDate() + ei * 60 + clsSubjects.indexOf(subj));
          const [exRes] = await conn.query(
            'INSERT INTO exams (name, type, subject_id, class_id, academic_year_id, term_id, exam_date, duration, full_marks, pass_marks, theory_marks, practical_marks, weightage, status, school_config_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 100, 35, 75, 25, 100.00, ?, ?, NOW(), NOW())',
            [`${examTypes[ei].replace(/_/g,' ')} - ${subj.name_en}`, examTypes[ei],
             subj.id, cls.classId, currentAYId, termId,
             examDate.toISOString().slice(0,19).replace('T',' '),
             90, 'completed', SCHOOL_CONFIG_ID]
          );
          const examId = exRes.insertId;
          totalExams++;

          // Bulk grades for each student in class
          const clsStudents = allStudentIds.filter(s => s.classId === cls.classId);
          const gradeRows = [];
          for (const stuInfo of clsStudents) {
            const theory = randomInt(40, 75);
            const practical = randomInt(10, 25);
            const total = theory + practical;
            let grade = 'NG', gp = 0.0;
            if (total >= 90) { grade = 'A+'; gp = 4.0; }
            else if (total >= 80) { grade = 'A';  gp = 3.6; }
            else if (total >= 70) { grade = 'B+'; gp = 3.2; }
            else if (total >= 60) { grade = 'B';  gp = 2.8; }
            else if (total >= 50) { grade = 'C+'; gp = 2.4; }
            else if (total >= 40) { grade = 'C';  gp = 2.0; }
            else if (total >= 35) { grade = 'D';  gp = 1.6; }
            gradeRows.push([examId, stuInfo.studentId, theory, practical, total, grade, gp, adminUserId, now, SCHOOL_CONFIG_ID, now, now]);
            totalGrades++;
          }
          await bulkInsert(conn, 'grades', ['exam_id','student_id','theory_marks','practical_marks','total_marks','grade','grade_point','entered_by','entered_at','school_config_id','created_at','updated_at'], gradeRows);
        }
      }
    }
    console.log(`✅ ${totalExams} exams, ${totalGrades} grades created`);

    // ── INVOICES & PAYMENTS (BULK) ───────────────────────────────────────────────
    console.log(`\n💰 Seeding invoices & payments...`);
    const invoiceItemRows = [];
    const paymentRows = [];
    for (let i = 0; i < allStudentIds.length; i++) {
      const { studentId } = allStudentIds[i];
      const invoiceNum = `INV-2081-${pad(i + 1, 4)}`;
      const totalAmt = randomInt(5000, 15000);
      const paidAmt = Math.random() > 0.3 ? totalAmt : Math.round(totalAmt * 0.5);
      const dueAmt = totalAmt - paidAmt;
      const status = dueAmt === 0 ? 'paid' : paidAmt > 0 ? 'partial' : 'pending';
      const [invRes] = await conn.query(
        'INSERT INTO invoices (invoice_number, student_id, academic_year_id, school_config_id, total_amount, paid_amount, due_amount, status, due_date, issued_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [invoiceNum, studentId, currentAYId, SCHOOL_CONFIG_ID, totalAmt, paidAmt, dueAmt, status, '2025-04-15', '2025-01-16']
      );
      const invId = invRes.insertId;
      invoiceItemRows.push([invId, 'Tuition Fee', Math.round(totalAmt * 0.7), 1]);
      invoiceItemRows.push([invId, 'Exam Fee', Math.round(totalAmt * 0.3), 1]);
      if (paidAmt > 0) {
        paymentRows.push([invId, studentId, SCHOOL_CONFIG_ID, paidAmt, 'cash', '2025-01-20', 'completed']);
      }
    }
    await bulkInsert(conn, 'invoice_items', ['invoice_id','description','amount','quantity'], invoiceItemRows);
    await bulkInsert(conn, 'payments', ['invoice_id','student_id','school_config_id','amount','payment_method','payment_date','status'], paymentRows);
    console.log(`✅ ${allStudentIds.length} invoices + ${paymentRows.length} payments created`);

    // ── BOOKS & CIRCULATIONS ─────────────────────────────────────────────────────
    const bookTitles = [
      ['Class 6 Nepali Textbook','NEB',2079,'Language',5],
      ['Class 6 English Grammar','Oxford',2079,'Language',4],
      ['Mathematics Grade 7','NEB',2079,'Science',6],
      ['Science Explorer Grade 8','NEB',2080,'Science',5],
      ['Social Studies Grade 9','NEB',2080,'Social',4],
      ['Physics Grade 10','NEB',2080,'Science',3],
      ['Chemistry Basics','NEB',2081,'Science',3],
      ['Computer Fundamentals','TechBooks',2081,'Technology',4],
      ['Nepali Literature','Manka',2079,'Literature',2],
      ['English Literature','Penguin',2080,'Literature',3],
      ['Health Education','NEB',2079,'Health',4],
      ['Art & Craft Handbook','Creative',2081,'Arts',3],
    ];
    const bookIds = [];
    for (const [title, publisher, year, category, copies] of bookTitles) {
      const [r] = await conn.query(
        'INSERT INTO books (title, author, isbn, publisher, publication_year, category, total_copies, available_copies, school_config_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [title, publisher, `ISBN-${randomInt(1000000,9999999)}`, publisher, year, category, copies, copies - 1, SCHOOL_CONFIG_ID]
      );
      bookIds.push(r.insertId);
    }
    // 30 circulations (bulk)
    const circulationRows = [];
    for (let i = 0; i < 30; i++) {
      const stuInfo = allStudentIds[i % allStudentIds.length];
      circulationRows.push([bookIds[i % bookIds.length], stuInfo.userId, 'student',
        '2025-01-10', '2025-01-31',
        i % 3 === 0 ? null : '2025-01-28',
        i % 3 === 0 ? 'issued' : 'returned', SCHOOL_CONFIG_ID]);
    }
    await bulkInsert(conn, 'circulations', ['book_id','user_id','user_type','issue_date','due_date','return_date','status','school_config_id'], circulationRows);
    console.log(`✅ ${bookTitles.length} books + 30 circulations created`);

    // ── ECAs ─────────────────────────────────────────────────────────────────────
    const ecaCoordId = staffByRole['eca'].userId;
    const ecaNames = ['Photography Club', 'Drama Club', 'Debate Society', 'Science Club', 'Music Band'];
    const ecaIds = [];
    for (const name of ecaNames) {
      const [r] = await conn.query(
        'INSERT INTO ecas (name, description, coordinator_id, academic_year_id, school_config_id, max_students, schedule, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, `${name} - extracurricular activity`, ecaCoordId, currentAYId, SCHOOL_CONFIG_ID, 30, 'Every Friday 3-5 PM', 'active']
      );
      ecaIds.push(r.insertId);
    }
    const ecaEnrollRows = [];
    for (let i = 0; i < Math.min(40, allStudentIds.length); i++) {
      ecaEnrollRows.push([ecaIds[i % ecaIds.length], allStudentIds[i].studentId, '2025-01-20', 'active']);
    }
    await bulkInsert(conn, 'eca_enrollments', ['eca_id','student_id','enrollment_date','status'], ecaEnrollRows);
    console.log(`✅ ${ecaNames.length} ECAs + 40 enrollments created`);

    // ── SPORTS ───────────────────────────────────────────────────────────────────
    const sportsCoordId = staffByRole['sc'].userId;
    const sportNames = ['Football', 'Basketball', 'Volleyball', 'Athletics', 'Cricket'];
    const sportIds = [];
    for (const name of sportNames) {
      const [r] = await conn.query(
        'INSERT INTO sports (name, description, coordinator_id, academic_year_id, school_config_id, max_students, schedule, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, `${name} team and training`, sportsCoordId, currentAYId, SCHOOL_CONFIG_ID, 25, 'Mon/Wed/Fri 4-6 PM', 'active']
      );
      sportIds.push(r.insertId);
    }
    const sportsEnrollRows = [];
    for (let i = 0; i < Math.min(40, allStudentIds.length); i++) {
      sportsEnrollRows.push([sportIds[i % sportIds.length], allStudentIds[i].studentId, '2025-01-20', 'active']);
    }
    await bulkInsert(conn, 'sports_enrollments', ['sport_id','student_id','enrollment_date','status'], sportsEnrollRows);
    console.log(`✅ ${sportNames.length} sports + 40 enrollments created`);

    // ── CERTIFICATES ─────────────────────────────────────────────────────────────
    const certStudents = allStudentIds.slice(0, 10);
    for (let i = 0; i < certStudents.length; i++) {
      const { studentId } = certStudents[i];
      const certType = certTypes[i % certTypes.length];
      const templateId = certTemplateIds[i % certTemplateIds.length];
      await conn.query(
        'INSERT INTO certificates (certificate_number, template_id, student_id, type, issued_date, issued_date_bs, data, pdf_url, qr_code, issued_by, verification_url, status, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [`CERT-2081-${pad(i+1,4)}`, templateId, studentId, certType,
         '2081-10-15',
         JSON.stringify({ student_name: `Student ${i+1}`, achievement: 'completing the academic year', date: '2081-10-15', school_name: 'Model Secondary School' }),
         `/certificates/CERT-2081-${pad(i+1,4)}.pdf`,
         `QR-${uuidv4()}`,
         adminUserId,
         `/verify/CERT-2081-${pad(i+1,4)}`,
         'active']
      );
    }
    console.log(`✅ ${certStudents.length} certificates created`);

    // ── GROUP CONVERSATIONS & MESSAGES ───────────────────────────────────────────
    for (const cls of classIds.slice(0, 4)) {
      const [gcRes] = await conn.query(
        'INSERT INTO group_conversations (name, type, description, class_id, created_by, is_announcement_only, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, 1, NOW(), NOW())',
        [`Grade ${cls.grade} Section ${cls.section} Chat`, 'class', `Class chat for Grade ${cls.grade}-${cls.section}`, cls.classId, staffByRole['ct'].userId]
      );
      const gcId = gcRes.insertId;
      // Add teacher as admin member
      await conn.query(
        'INSERT INTO group_members (group_conversation_id, user_id, role, joined_at, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW(), NOW())',
        [gcId, staffByRole['ct'].userId, 'admin']
      );
      // Add some students as members
      const clsStudents = allStudentIds.filter(s => s.classId === cls.classId).slice(0, 5);
      for (const stuInfo of clsStudents) {
        await conn.query(
          'INSERT INTO group_members (group_conversation_id, user_id, role, joined_at, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW(), NOW())',
          [gcId, stuInfo.userId, 'member']
        );
      }
      // Messages
      const msgTexts = [
        'Welcome to the class group!',
        'Please submit your homework by Friday.',
        'Exam schedule has been posted on the notice board.',
        'Parents meeting is scheduled for next Saturday.',
        'Happy to announce our class topped the school in last exam!',
      ];
      for (const txt of msgTexts) {
        await conn.query(
          'INSERT INTO group_messages (group_conversation_id, sender_id, content, sent_at, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW(), NOW())',
          [gcId, staffByRole['ct'].userId, txt]
        );
      }
    }
    // Direct conversations
    const stu1 = allStudentIds[0];
    const stu2 = allStudentIds[1];
    const [convRes] = await conn.query(
      'INSERT INTO conversations (participant1_id, participant2_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
      [staffByRole['ct'].userId, stu1.userId]
    );
    const convId = convRes.insertId;
    await conn.query(
      'INSERT INTO messages (conversation_id, sender_id, recipient_id, content, sent_at, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW(), NOW())',
      [convId, staffByRole['ct'].userId, stu1.userId, 'Please bring your textbook tomorrow.']
    );
    await conn.query(
      'INSERT INTO messages (conversation_id, sender_id, recipient_id, content, sent_at, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW(), NOW())',
      [convId, stu1.userId, staffByRole['ct'].userId, 'Yes sir, I will bring it.']
    );
    console.log(`✅ Group conversations & messages created`);

    // ── SUMMARY ──────────────────────────────────────────────────────────────────
    const counts = {};
    const countTables = ['users','students','staff','classes','academic_years','terms','subjects','exams','grades','attendance','invoices','books','circulations','ecas','eca_enrollments','sports','sports_enrollments','certificates'];
    for (const t of countTables) {
      const [[row]] = await conn.query(`SELECT COUNT(*) AS cnt FROM \`${t}\``);
      counts[t] = row.cnt;
    }

    console.log('\n' + '═'.repeat(70));
    console.log('🎉  RAILWAY SEEDING COMPLETE!\n');
    console.log('📋  LOGIN CREDENTIALS\n');
    console.log('SCHOOL ADMIN:');
    console.log('  admin_school     /  Admin@123');
    console.log('\nSTAFF ACCOUNTS:');
    console.log('  ct_school        /  Teacher@123        (Class Teacher)');
    console.log('  st_school        /  Teacher@123        (Subject Teacher)');
    console.log('  dh_school        /  DeptHead@123       (Department Head)');
    console.log('  eca_school       /  ECACoord@123       (ECA Coordinator)');
    console.log('  sc_school        /  SportsCoord@123    (Sports Coordinator)');
    console.log('  lib_school       /  Librarian@123      (Librarian)');
    console.log('  acc_school       /  Accountant@123     (Accountant)');
    console.log('  tm_school        /  Transport@123      (Transport Manager)');
    console.log('  hw_school        /  Hostel@123         (Hostel Warden)');
    console.log('  nts_school       /  Staff@123          (Non-Teaching Staff)');
    console.log('\nSTUDENTS:');
    console.log('  student_0001 to student_' + pad(allStudentIds.length, 4) + '  /  Student@123');
    console.log('\nPARENTS:');
    console.log('  parent_0001, parent_0004, parent_0007, ...  /  Parent@123');
    console.log('\n📊  DATA COUNTS:');
    for (const [t, cnt] of Object.entries(counts)) {
      console.log(`  ${t.padEnd(22)}: ${cnt}`);
    }
    console.log('═'.repeat(70));

  } catch (err) {
    console.error('\n❌ Seeding failed:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

main();
