/**
 * COMPREHENSIVE DATABASE SEED SCRIPT
 * Covers ALL 14 roles, ALL tables, with realistic Nepali education data.
 *
 * Usage:
 *   Local:   node backend/seed-comprehensive.js
 *   Railway: DATABASE_URL="mysql://user:pass@host:port/db" node backend/seed-comprehensive.js
 */

require('dotenv').config({ path: './backend/.env' });
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// ─── DB CONNECTION ────────────────────────────────────────────────────────────
async function getConnection() {
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    return mysql.createConnection({
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: { rejectUnauthorized: false },
      multipleStatements: true,
    });
  }
  return mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system',
    multipleStatements: true,
  });
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const SALT_ROUNDS = 10;
async function hashPw(pw) { return bcrypt.hash(pw, SALT_ROUNDS); }

const NEPALI_FIRST_NAMES = ['Aarav','Arjun','Bibek','Bikash','Deepak','Dinesh','Ganesh','Hemanta','Ishaan','Kamal','Lokesh','Manish','Nabin','Niraj','Prabhat','Pratik','Ramesh','Sagar','Sandesh','Santosh','Shrijan','Sujal','Suresh','Ujwal','Vijay','Aakriti','Anita','Bimala','Deepa','Gita','Hema','Kabita','Kritika','Laxmi','Mamata','Mina','Nisha','Puja','Rekha','Sabin','Sabina','Sandhya','Seema','Shanti','Sunita','Sushma','Urmila'];
const NEPALI_LAST_NAMES = ['Adhikari','Acharya','Bajracharya','Basnet','Bhattarai','Bishwokarma','Chaudhary','Dahal','Ghimire','Gurung','Joshi','Khadka','Koirala','Lama','Limbu','Magar','Maharjan','Oli','Paudel','Rai','Regmi','Shah','Sharma','Shrestha','Subedi','Tamang','Thapa','Tiwari','Upreti','Yadav'];

function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rndInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pad(n, len=2) { return String(n).padStart(len, '0'); }

function nepaliBSDate(yearBS, monthBS, dayBS) {
  return `${yearBS}-${pad(monthBS)}-${pad(dayBS)}`;
}
// Approximate AD year from BS (BS - 56.7 years)
function bsToAD(yearBS) { return yearBS - 57; }
function adDate(yearAD, month, day) {
  return `${yearAD}-${pad(month)}-${pad(day)}`;
}

// Generate a date N days ago
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function bsDateForToday(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  // Approximate BS date: AD + 56 years 8.5 months
  const adYear = d.getFullYear();
  const bsYear = adYear + 56;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  // Rough BS month mapping
  const bsMonth = ((month + 8) % 12) + 1;
  return `${bsYear}-${pad(bsMonth)}-${pad(day)}`;
}

// ─── DATA DEFINITIONS ─────────────────────────────────────────────────────────
const MUNICIPALITIES = [
  { id: uuidv4(), code: 'KMC', nameEn: 'Kathmandu Metropolitan City', nameNp: 'काठमाडौं महानगरपालिका', district: 'Kathmandu', province: 'Bagmati Province', address: 'Bagdurbar, Kathmandu', phone: '+977-1-4211673', email: 'info@kathmandu.gov.np' },
  { id: uuidv4(), code: 'LMC', nameEn: 'Lalitpur Metropolitan City', nameNp: 'ललितपुर महानगरपालिका', district: 'Lalitpur', province: 'Bagmati Province', address: 'Pulchok, Lalitpur', phone: '+977-1-5521010', email: 'info@lalitpur.gov.np' },
];

const SCHOOLS_TEMPLATE = [
  { codeSuffix: 'SCH1', nameEn: '{mun} Model Secondary School', nameNp: '{mun} मोडेल माध्यमिक विद्यालय', email: 'model@{slug}.edu.np', phone: '+977-1-4500001' },
  { codeSuffix: 'SCH2', nameEn: '{mun} International Academy', nameNp: '{mun} इन्टरनेशनल एकेडेमी', email: 'academy@{slug}.edu.np', phone: '+977-1-4500002' },
];

const NEPALI_SUBJECTS = [
  { code: 'NEP', nameEn: 'Nepali', nameNp: 'नेपाली', type: 'compulsory', fullMarks: 100, passMarks: 40, theoryMarks: 75, practicalMarks: 25 },
  { code: 'ENG', nameEn: 'English', nameNp: 'अंग्रेजी', type: 'compulsory', fullMarks: 100, passMarks: 40, theoryMarks: 75, practicalMarks: 25 },
  { code: 'MATH', nameEn: 'Mathematics', nameNp: 'गणित', type: 'compulsory', fullMarks: 100, passMarks: 40, theoryMarks: 75, practicalMarks: 25 },
  { code: 'SCI', nameEn: 'Science', nameNp: 'विज्ञान', type: 'compulsory', fullMarks: 100, passMarks: 40, theoryMarks: 75, practicalMarks: 25 },
  { code: 'SS', nameEn: 'Social Studies', nameNp: 'सामाजिक अध्ययन', type: 'compulsory', fullMarks: 100, passMarks: 40, theoryMarks: 75, practicalMarks: 25 },
  { code: 'HPE', nameEn: 'Health & Physical Education', nameNp: 'स्वास्थ्य तथा शारीरिक शिक्षा', type: 'compulsory', fullMarks: 50, passMarks: 20, theoryMarks: 25, practicalMarks: 25 },
  { code: 'COMP', nameEn: 'Computer Science', nameNp: 'सूचना तथा सञ्चार प्रविधि', type: 'optional', fullMarks: 100, passMarks: 40, theoryMarks: 50, practicalMarks: 50 },
  { code: 'OMATH', nameEn: 'Optional Mathematics', nameNp: 'ऐच्छिक गणित', type: 'optional', fullMarks: 100, passMarks: 40, theoryMarks: 75, practicalMarks: 25 },
  { code: 'ACC', nameEn: 'Account', nameNp: 'लेखाशास्त्र', type: 'optional', fullMarks: 100, passMarks: 40, theoryMarks: 75, practicalMarks: 25 },
  { code: 'ECO', nameEn: 'Economics', nameNp: 'अर्थशास्त्र', type: 'optional', fullMarks: 100, passMarks: 40, theoryMarks: 75, practicalMarks: 25 },
];

const GRADE_LEVELS = [6, 7, 8, 9, 10];
const SECTIONS = ['A', 'B'];

const ACADEMIC_YEARS = [
  { name: 'AY 2079/80', startBS: '2079-04-01', endBS: '2080-03-31', startAD: '2022-07-17', endAD: '2023-07-16', isCurrent: false },
  { name: 'AY 2080/81', startBS: '2080-04-01', endBS: '2081-03-31', startAD: '2023-07-17', endAD: '2024-07-15', isCurrent: true },
  { name: 'AY 2081/82', startBS: '2081-04-01', endBS: '2082-03-31', startAD: '2024-07-17', endAD: '2025-07-15', isCurrent: false },
];

// Role definitions with credentials
const STAFF_ROLES = [
  { role: 'Class_Teacher',      suffix: 'ct',      password: 'Teacher@123',      firstName: 'Ram',    lastName: 'Prasad',  dept: 'Academics',    pos: 'Class Teacher',      cat: 'teaching' },
  { role: 'Subject_Teacher',    suffix: 'st',      password: 'Teacher@123',      firstName: 'Sita',   lastName: 'Sharma',  dept: 'Academics',    pos: 'Subject Teacher',    cat: 'teaching' },
  { role: 'Department_Head',    suffix: 'dh',      password: 'DeptHead@123',     firstName: 'Hari',   lastName: 'Prasad',  dept: 'Science',      pos: 'Department Head',    cat: 'teaching' },
  { role: 'ECA_Coordinator',    suffix: 'eca',     password: 'ECACoord@123',     firstName: 'Kiran',  lastName: 'Thapa',   dept: 'Extra-Curricular', pos: 'ECA Coordinator', cat: 'non_teaching' },
  { role: 'Sports_Coordinator', suffix: 'sc',      password: 'SportsCoord@123',  firstName: 'Bikash', lastName: 'Rai',     dept: 'Sports',       pos: 'Sports Coordinator', cat: 'non_teaching' },
  { role: 'Librarian',          suffix: 'lib',     password: 'Librarian@123',    firstName: 'Anita',  lastName: 'Gurung',  dept: 'Library',      pos: 'Librarian',          cat: 'non_teaching' },
  { role: 'Accountant',         suffix: 'acc',     password: 'Accountant@123',   firstName: 'Sunita', lastName: 'Koirala', dept: 'Finance',      pos: 'Accountant',         cat: 'non_teaching' },
  { role: 'Transport_Manager',  suffix: 'tm',      password: 'Transport@123',    firstName: 'Dinesh', lastName: 'Basnet',  dept: 'Transport',    pos: 'Transport Manager',  cat: 'non_teaching' },
  { role: 'Hostel_Warden',      suffix: 'hw',      password: 'Hostel@123',       firstName: 'Mohan',  lastName: 'Khadka',  dept: 'Hostel',       pos: 'Hostel Warden',      cat: 'non_teaching' },
  { role: 'Non_Teaching_Staff', suffix: 'nts',     password: 'Staff@123',        firstName: 'Gita',   lastName: 'Tamang',  dept: 'Administration', pos: 'Office Staff',     cat: 'non_teaching' },
];

const NEPALI_EVENTS = [
  { title: 'Annual Sports Day', titleNp: 'वार्षिक खेल दिवस', category: 'sports', color: '#e74c3c' },
  { title: 'Science Exhibition', titleNp: 'विज्ञान प्रदर्शनी', category: 'academic', color: '#3498db' },
  { title: 'Cultural Program', titleNp: 'सांस्कृतिक कार्यक्रम', category: 'cultural', color: '#9b59b6' },
  { title: 'Parent-Teacher Meeting', titleNp: 'अभिभावक-शिक्षक भेट', category: 'meeting', color: '#27ae60' },
  { title: 'Republic Day Celebration', titleNp: 'गणतन्त्र दिवस समारोह', category: 'holiday', color: '#f39c12', isHoliday: true },
  { title: 'Annual Prize Distribution', titleNp: 'वार्षिक पुरस्कार वितरण', category: 'academic', color: '#1abc9c' },
];

const TERM_NAMES = ['First Term', 'Second Term', 'Third Term'];

// ─── MAIN SEEDER ──────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Starting comprehensive database seeding...\n');
  const conn = await getConnection();
  await conn.connect();
  console.log('✅ Database connected\n');

  try {
    // ── STEP 1: CLEAN EXISTING DATA ──────────────────────────────────────────
    console.log('🗑️  Clearing existing data...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    const tablesToClear = [
      'syllabus_topics', 'syllabi', 'periods', 'timetables',
      'group_messages', 'group_members', 'group_conversations',
      'messages', 'conversations',
      'document_access_logs', 'documents', 'certificate_templates', 'certificates',
      'audit_logs', 'grades', 'exam_schedules', 'exams',
      'attendance', 'fee_reminders', 'invoices', 'fee_components', 'fee_structures',
      'class_subjects', 'terms', 'grading_schemes',
      'students', 'staff', 'classes', 'academic_years', 'subjects',
      'events', 'users', 'school_config', 'municipalities',
    ];

    for (const t of tablesToClear) {
      await conn.query(`DELETE FROM \`${t}\``);
    }
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Existing data cleared\n');

    // ── STEP 2: SEED MUNICIPALITIES ───────────────────────────────────────────
    console.log('🏙️  Seeding municipalities...');
    for (const mun of MUNICIPALITIES) {
      await conn.query(
        'INSERT INTO municipalities (id, name_en, name_np, code, district, province, address, contact_phone, contact_email, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())',
        [mun.id, mun.nameEn, mun.nameNp, mun.code, mun.district, mun.province, mun.address, mun.phone, mun.email]
      );
    }
    console.log(`   ✅ Created ${MUNICIPALITIES.length} municipalities`);

    // ── STEP 3: SEED SCHOOLS ─────────────────────────────────────────────────
    console.log('🏫  Seeding schools...');
    const schools = [];
    for (const mun of MUNICIPALITIES) {
      for (const sch of SCHOOLS_TEMPLATE) {
        const slug = mun.code.toLowerCase();
        const schoolId = uuidv4();
        const schoolCode = `${mun.code}-${sch.codeSuffix}`;
        const nameEn = sch.nameEn.replace('{mun}', mun.nameEn.split(' ')[0]);
        const nameNp = sch.nameNp.replace('{mun}', mun.nameNp.split(' ')[0]);
        const email = sch.email.replace('{slug}', slug);
        await conn.query(
          'INSERT INTO school_config (id, school_name_en, school_name_np, school_code, municipality_id, address_en, phone, email, is_active, academic_year_start_month, academic_year_duration_months, terms_per_year, default_calendar_system, default_language, timezone, currency, date_format, time_format, number_format, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 4, 12, 3, "BS", "nepali", "Asia/Kathmandu", "NPR", "YYYY-MM-DD", "HH:mm", "en-US", NOW(), NOW())',
          [schoolId, nameEn, nameNp, schoolCode, mun.id, mun.address, sch.phone, email]
        );
        schools.push({ id: schoolId, code: schoolCode, nameEn, municipalityId: mun.id, munCode: mun.code });
      }
    }
    console.log(`   ✅ Created ${schools.length} schools\n`);

    // ── STEP 4: SEED GRADING SCHEMES ─────────────────────────────────────────
    console.log('📊  Seeding grading scheme...');
    const gradingSchemeId = uuidv4();
    const gradingData = JSON.stringify([
      { grade: 'A+', minMark: 90, maxMark: 100, gradePoint: 4.0, description: 'Outstanding' },
      { grade: 'A',  minMark: 80, maxMark: 89,  gradePoint: 3.6, description: 'Excellent' },
      { grade: 'B+', minMark: 70, maxMark: 79,  gradePoint: 3.2, description: 'Very Good' },
      { grade: 'B',  minMark: 60, maxMark: 69,  gradePoint: 2.8, description: 'Good' },
      { grade: 'C+', minMark: 50, maxMark: 59,  gradePoint: 2.4, description: 'Satisfactory' },
      { grade: 'C',  minMark: 40, maxMark: 49,  gradePoint: 2.0, description: 'Acceptable' },
      { grade: 'D',  minMark: 30, maxMark: 39,  gradePoint: 1.6, description: 'Partially Met' },
      { grade: 'E',  minMark: 0,  maxMark: 29,  gradePoint: 0.0, description: 'Not Sufficient' },
    ]);
    await conn.query(
      'INSERT INTO grading_schemes (id, name, description, is_default, is_active, grades, created_at, updated_at) VALUES (?, ?, ?, 1, 1, ?, NOW(), NOW())',
      [gradingSchemeId, 'Nepal SEE Grading', 'Standard grading scheme for Nepal secondary education', gradingData]
    );
    console.log('   ✅ Grading scheme created');

    // ── STEP 5: SEED ATTENDANCE RULES ─────────────────────────────────────────
    await conn.query(
      'INSERT INTO attendance_rules (id, name, description, minimum_attendance_percentage, low_attendance_threshold, critical_attendance_threshold, correction_window_hours, allow_teacher_correction, allow_admin_correction, max_leave_days_per_month, max_leave_days_per_year, require_leave_approval, enable_low_attendance_alerts, alert_parents, alert_admins, is_active, created_at, updated_at) VALUES (?, ?, ?, 75, 80, 60, 24, 1, 1, 3, 30, 1, 1, 1, 1, 1, NOW(), NOW())',
      [uuidv4(), 'Standard Attendance Rules', 'Default attendance tracking rules for Nepal schools']
    );
    console.log('   ✅ Attendance rules created\n');

    // ── STEP 6: SEED ACADEMIC YEARS ───────────────────────────────────────────
    console.log('📅  Seeding academic years...');
    const academicYearIds = [];
    let currentAYId = null;
    for (const ay of ACADEMIC_YEARS) {
      const [result] = await conn.query(
        'INSERT INTO academic_years (name, start_date_bs, end_date_bs, start_date_ad, end_date_ad, is_current, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [ay.name, ay.startBS, ay.endBS, ay.startAD, ay.endAD, ay.isCurrent ? 1 : 0]
      );
      const ayId = result.insertId;
      academicYearIds.push({ id: ayId, ...ay });
      if (ay.isCurrent) currentAYId = ayId;

      // Seed 3 terms per academic year
      const [ayStartYear] = ay.startAD.split('-').map(Number);
      for (let t = 0; t < 3; t++) {
        const termStartMonth = 7 + t * 4; // July, November, March (AD)
        const termEndMonth = termStartMonth + 3;
        const startY = termStartMonth > 12 ? ayStartYear + 1 : ayStartYear;
        const endY = termEndMonth > 12 ? ayStartYear + 1 : ayStartYear;
        const sM = ((termStartMonth - 1) % 12) + 1;
        const eM = ((termEndMonth - 1) % 12) + 1;
        await conn.query(
          'INSERT INTO terms (academic_year_id, name, start_date, end_date, exam_start_date, exam_end_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
          [ayId, TERM_NAMES[t], adDate(startY, sM, 1), adDate(endY, eM, 28), adDate(endY, eM, 20), adDate(endY, eM, 28)]
        );
      }
    }
    console.log(`   ✅ ${ACADEMIC_YEARS.length} academic years + terms created\n`);

    // ── STEP 7: SEED SUBJECTS ─────────────────────────────────────────────────
    console.log('📚  Seeding subjects...');
    const subjectIds = [];
    for (const subj of NEPALI_SUBJECTS) {
      const classes = JSON.stringify(GRADE_LEVELS);
      const [result] = await conn.query(
        'INSERT INTO subjects (code, name_en, name_np, type, stream, credit_hours, theory_marks, practical_marks, pass_marks, full_marks, applicable_classes, created_at, updated_at) VALUES (?, ?, ?, ?, NULL, 5, ?, ?, ?, ?, ?, NOW(), NOW())',
        [subj.code, subj.nameEn, subj.nameNp, subj.type, subj.theoryMarks, subj.practicalMarks, subj.passMarks, subj.fullMarks, classes]
      );
      subjectIds.push({ id: result.insertId, ...subj });
    }
    console.log(`   ✅ ${NEPALI_SUBJECTS.length} subjects created\n`);

    // ── STEP 8: SEED CERTIFICATE TEMPLATES ───────────────────────────────────
    console.log('📜  Seeding certificate templates...');
    for (const type of ['character', 'transfer', 'bonafide', 'academic_excellence']) {
      await conn.query(
        'INSERT INTO certificate_templates (name, type, template_html, variables, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 1, NOW(), NOW())',
        [`${type.charAt(0).toUpperCase()+type.slice(1)} Certificate`, type,
         `<div class="certificate"><h1>{{schoolName}}</h1><p>This is to certify that {{studentName}} has been a student of this institution.</p></div>`,
         JSON.stringify(['schoolName', 'studentName', 'className', 'date'])]
      );
    }
    console.log('   ✅ 4 certificate templates created\n');

    // ── STEP 9: SEED USERS, STAFF, CLASSES, STUDENTS PER SCHOOL ─────────────
    const allStaffBySchool = {}; // schoolId → { roleKey → { userId, staffId } }
    const allStudentsBySchool = {}; // schoolId → [{ studentId, userId, classId }]
    const allClassesBySchool = {}; // schoolId → [{ classId, gradeLevel, section }]
    const munAdminIds = {}; // munCode → userId

    // First create municipality admins (one per municipality)
    console.log('👑  Seeding municipality admins...');
    for (const mun of MUNICIPALITIES) {
      const slug = mun.code.toLowerCase();
      const username = `munadmin_${slug}`;
      const hashedPw = await hashPw('Municipality@123');
      const [result] = await conn.query(
        'INSERT INTO users (username, email, password, role, status, phone_number, municipality_id, school_config_id, failed_login_attempts, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 0, NOW(), NOW())',
        [username, `${username}@${slug}.edu.np`, hashedPw, 'Municipality_Admin', 'active', '+977-9800000001', mun.id]
      );
      munAdminIds[mun.code] = result.insertId;
      console.log(`   ✅ Municipality Admin: ${username} / Municipality@123`);
    }
    console.log();

    // Process each school
    for (let schoolIdx = 0; schoolIdx < schools.length; schoolIdx++) {
      const school = schools[schoolIdx];
      // Each school gets unique sections to avoid unique constraint clash
      const schoolSections = SECTIONS.map(s => s + String(schoolIdx + 1)); // A1,B1 / A2,B2 etc.
      console.log(`\n🏫  Seeding school: ${school.nameEn} (${school.code})`);
      const slug = school.code.toLowerCase().replace(/-/g, '_');
      allStaffBySchool[school.id] = {};
      allClassesBySchool[school.id] = [];
      allStudentsBySchool[school.id] = [];

      // ── School Admin ──────────────────────────────────────────────────────
      const adminUsername = `admin_${slug}`;
      const adminPw = await hashPw('Admin@123');
      const [adminResult] = await conn.query(
        'INSERT INTO users (username, email, password, role, status, phone_number, municipality_id, school_config_id, failed_login_attempts, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())',
        [adminUsername, `admin@${slug}.edu.np`, adminPw, 'School_Admin', 'active', '+977-9800000010', school.municipalityId, school.id]
      );
      const adminUserId = adminResult.insertId;
      const [adminStaffResult] = await conn.query(
        'INSERT INTO staff (user_id, staff_code, first_name_en, last_name_en, first_name_np, last_name_np, date_of_birth_ad, gender, category, position, department, employment_type, join_date, salary, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [adminUserId, `${slug.toUpperCase()}-ADM-001`, 'School', 'Administrator', 'विद्यालय', 'प्रशासक', '1980-01-15', 'male', 'administrative', 'School Administrator', 'Administration', 'full_time', '2015-04-01', 60000, 'active']
      );
      allStaffBySchool[school.id]['admin'] = { userId: adminUserId, staffId: adminStaffResult.insertId };
      console.log(`   ✅ School Admin: ${adminUsername} / Admin@123`);

      // ── Staff for each role ────────────────────────────────────────────────
      for (let i = 0; i < STAFF_ROLES.length; i++) {
        const sr = STAFF_ROLES[i];
        const username = `${sr.suffix}_${slug}`;
        const hashedPw = await hashPw(sr.password);
        const [uResult] = await conn.query(
          'INSERT INTO users (username, email, password, role, status, phone_number, municipality_id, school_config_id, failed_login_attempts, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())',
          [username, `${username}@${slug}.edu.np`, hashedPw, sr.role, 'active', `+977-980000${pad(i+20)}`, school.municipalityId, school.id]
        );
        const [sResult] = await conn.query(
          'INSERT INTO staff (user_id, staff_code, first_name_en, last_name_en, first_name_np, last_name_np, date_of_birth_ad, gender, category, position, department, employment_type, join_date, salary, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
          [uResult.insertId, `${slug.toUpperCase()}-${sr.suffix.toUpperCase()}-001`, sr.firstName, sr.lastName,
           `${sr.firstName} (नेपाली)`, `${sr.lastName} (नेपाली)`, '1985-06-15', i % 2 === 0 ? 'male' : 'female',
           sr.cat === 'teaching' ? 'teaching' : 'non_teaching', sr.pos, sr.dept, 'full_time', '2018-04-01', 45000 + i * 2000, 'active']
        );
        allStaffBySchool[school.id][sr.suffix] = { userId: uResult.insertId, staffId: sResult.insertId };
        console.log(`   ✅ ${sr.role}: ${username} / ${sr.password}`);
      }

      // ── Classes ─────────────────────────────────────────────────────────
      const classTeacherStaffId = allStaffBySchool[school.id]['ct'].staffId;
      for (const grade of GRADE_LEVELS) {
        for (const section of schoolSections) {
          const [cResult] = await conn.query(
            'INSERT INTO classes (academic_year_id, grade_level, section, shift, class_teacher_id, capacity, current_strength, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
            [currentAYId, grade, section, 'morning', classTeacherStaffId, 40, 0]
          );
          allClassesBySchool[school.id].push({ classId: cResult.insertId, grade, section });
        }
      }
      console.log(`   ✅ ${GRADE_LEVELS.length * schoolSections.length} classes created`);

      // ── Timetables & Periods ──────────────────────────────────────────────
      const subjectTeacherStaffId = allStaffBySchool[school.id]['st'].staffId;
      const coreSubjects = subjectIds.filter(s => s.type === 'compulsory').slice(0, 6);
      const DAYS = [1, 2, 3, 4, 5]; // Mon–Fri
      for (const cls of allClassesBySchool[school.id]) {
        const [ttResult] = await conn.query(
          'INSERT INTO timetables (class_id, academic_year_id, day_of_week, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
          [cls.classId, currentAYId, 1]
        );
        const ttId = ttResult.insertId;
        for (let p = 0; p < Math.min(coreSubjects.length, 6); p++) {
          const startHour = 10 + Math.floor(p / 2);
          const startMin = (p % 2) * 30;
          const endHour = startHour + (startMin === 30 ? 1 : 0);
          const endMin = startMin === 30 ? 0 : 30;
          await conn.query(
            'INSERT INTO periods (timetable_id, period_number, start_time, end_time, subject_id, teacher_id, room_number, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
            [ttId, p + 1, `${pad(startHour)}:${pad(startMin)}`, `${pad(endHour)}:${pad(endMin)}`,
             coreSubjects[p].id, subjectTeacherStaffId, `Room-${cls.grade}${cls.section}`]
          );
        }
      }

      // ── Class Subjects ────────────────────────────────────────────────────
      for (const cls of allClassesBySchool[school.id]) {
        for (const subj of subjectIds.slice(0, 7)) {
          await conn.query(
            'INSERT INTO class_subjects (class_id, subject_id, teacher_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
            [cls.classId, subj.id, subjectTeacherStaffId]
          );
          // Syllabi
          await conn.query(
            'INSERT INTO syllabi (subject_id, class_id, academic_year_id, completed_percentage, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
            [subj.id, cls.classId, currentAYId, rndInt(30, 85)]
          );
        }
      }
      console.log(`   ✅ Class subjects & syllabi created`);

      // ── Fee Structures ────────────────────────────────────────────────────
      const feeStructureIds = {};
      for (const ay of academicYearIds) {
        const [fsResult] = await conn.query(
          'INSERT INTO fee_structures (name, applicable_classes, applicable_shifts, academic_year_id, total_amount, is_active, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, NOW(), NOW())',
          [`Annual Fee Structure ${ay.name.split('/')[0].slice(-4)}/${ay.name.split('/')[1].slice(-2)}`,
           JSON.stringify(GRADE_LEVELS), JSON.stringify(['morning', 'day']),
           ay.id, 25000, `Annual fee for academic year ${ay.name}`]
        );
        feeStructureIds[ay.id] = fsResult.insertId;
        // Fee components
        const components = [
          ['Tuition Fee', 'annual', 15000, 'annual'],
          ['Library Fee', 'library', 2000, 'annual'],
          ['Sports Fee', 'eca', 1500, 'annual'],
          ['Examination Fee', 'exam', 3000, 'annual'],
          ['Development Fee', 'development', 3500, 'annual'],
        ];
        for (const [name, type, amount, freq] of components) {
          await conn.query(
            'INSERT INTO fee_components (fee_structure_id, name, type, amount, frequency, is_mandatory, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, NOW(), NOW())',
            [fsResult.insertId, name, type, amount, freq, `${name} for ${ay.name}`]
          );
        }
      }
      console.log(`   ✅ Fee structures created`);

      // ── Students + Parents ────────────────────────────────────────────────
      let studentCount = 0;
      const studentPw = await hashPw('Student@123');
      const parentPw = await hashPw('Parent@123');

      for (let clsIdx = 0; clsIdx < allClassesBySchool[school.id].length; clsIdx++) {
        const cls = allClassesBySchool[school.id][clsIdx];
        const studentsPerClass = 15;

        for (let s = 0; s < studentsPerClass; s++) {
          const firstName = rnd(NEPALI_FIRST_NAMES);
          const lastName = rnd(NEPALI_LAST_NAMES);
          const globalIdx = studentCount + 1;
          const studentUsername = `stu_${slug}_${pad(globalIdx, 3)}`;
          const rollNum = s + 1;
          const dobYear = 2060 + (10 - cls.grade); // older students in higher grades
          const dobBs = nepaliBSDate(dobYear, rndInt(1, 12), rndInt(1, 28));
          const dobAd = adDate(bsToAD(dobYear), rndInt(1, 12), rndInt(1, 28));

          const [suResult] = await conn.query(
            'INSERT INTO users (username, email, password, role, status, phone_number, municipality_id, school_config_id, failed_login_attempts, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())',
            [studentUsername, `${studentUsername}@student.${slug}.edu.np`, studentPw, 'Student', 'active', null, school.municipalityId, school.id]
          );
          const [stResult] = await conn.query(
            'INSERT INTO students (user_id, student_code, first_name_en, last_name_en, first_name_np, last_name_np, date_of_birth_bs, date_of_birth_ad, gender, address_en, father_name, father_phone, mother_name, mother_phone, emergency_contact, current_class_id, roll_number, admission_date, admission_class, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
            [suResult.insertId, `${slug.toUpperCase()}-STU-${pad(globalIdx, 4)}`,
             firstName, lastName, `${firstName} (नेपाली)`, `${lastName} (नेपाली)`,
             dobBs, dobAd + ' 00:00:00', s % 2 === 0 ? 'male' : 'female',
             `${rndInt(1,100)} Ward, ${school.nameEn} Area, Nepal`,
             `${rnd(NEPALI_FIRST_NAMES)} ${lastName}`, `+977-98${pad(rndInt(10000000,99999999),8)}`,
             `${rnd(NEPALI_FIRST_NAMES)} ${lastName}`, `+977-98${pad(rndInt(10000000,99999999),8)}`,
             `+977-98${pad(rndInt(10000000,99999999),8)}`,
             cls.classId, rollNum, '2075-04-01 00:00:00', cls.grade, 'active']
          );
          // Update class strength
          await conn.query('UPDATE classes SET current_strength = current_strength + 1 WHERE class_id = ?', [cls.classId]);

          allStudentsBySchool[school.id].push({ studentId: stResult.insertId, userId: suResult.insertId, classId: cls.classId });

          // Create parent user for first 3 students per class
          if (s < 3) {
            const pFirstName = rnd(NEPALI_FIRST_NAMES);
            const pLastName = lastName;
            const parentUsername = `par_${slug}_${pad(globalIdx, 3)}`;
            await conn.query(
              'INSERT INTO users (username, email, password, role, status, phone_number, municipality_id, school_config_id, failed_login_attempts, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())',
              [parentUsername, `${parentUsername}@parent.${slug}.edu.np`, parentPw, 'Parent', 'active', `+977-98${pad(rndInt(10000000, 99999999), 8)}`, school.municipalityId, school.id]
            );
          }
          studentCount++;
        }
      }
      console.log(`   ✅ ${studentCount} students + parents created`);

      // ── Attendance (last 45 days for all students) ────────────────────────
      console.log(`   📋 Seeding attendance...`);
      const schoolAdminUserId = allStaffBySchool[school.id]['admin'].userId;
      let attendanceCount = 0;
      for (const stu of allStudentsBySchool[school.id]) {
        for (let day = 1; day <= 45; day++) {
          const dateAD = daysAgo(day);
          const d = new Date(dateAD);
          if (d.getDay() === 0 || d.getDay() === 6) continue; // Skip weekends
          const statuses = ['present', 'present', 'present', 'present', 'absent', 'late'];
          const status = rnd(statuses);
          const dateBS = bsDateForToday(day);
          await conn.query(
            'INSERT INTO attendance (student_id, class_id, date, date_bs, status, period_number, marked_by, marked_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())',
            [stu.studentId, stu.classId, dateAD, dateBS, status, 1, schoolAdminUserId]
          );
          attendanceCount++;
        }
      }
      console.log(`   ✅ ${attendanceCount} attendance records created`);

      // ── Exams & Grades ────────────────────────────────────────────────────
      console.log(`   📝 Seeding exams & grades...`);
      const [termRows] = await conn.query(
        'SELECT term_id FROM terms WHERE academic_year_id = ? ORDER BY start_date LIMIT 3', [currentAYId]
      );
      let examCount = 0, gradeCount = 0;

      for (const cls of allClassesBySchool[school.id]) {
        for (let ti = 0; ti < Math.min(termRows.length, 2); ti++) {
          const termId = termRows[ti].term_id;
          // Create exams for first 4 compulsory subjects
          for (const subj of subjectIds.slice(0, 4)) {
            const examDate = adDate(2024, 3 + ti * 4, rndInt(10, 20));
            const [eResult] = await conn.query(
              'INSERT INTO exams (name, type, subject_id, class_id, academic_year_id, term_id, exam_date, duration, full_marks, pass_marks, theory_marks, practical_marks, weightage, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
              [`${TERM_NAMES[ti]} Exam - ${subj.nameEn}`, ti === 0 ? 'first_terminal' : 'second_terminal',
               subj.id, cls.classId, currentAYId, termId, examDate, 3,
               subj.fullMarks, subj.passMarks, subj.theoryMarks, subj.practicalMarks, 100,
               ti === 0 ? 'scheduled' : 'completed']
            );
            examCount++;

            // Grades for each student in this class
            const classStudents = allStudentsBySchool[school.id].filter(s => s.classId === cls.classId);
            for (const stu of classStudents) {
              const theoryScore = rndInt(Math.floor(subj.passMarks * 0.8), subj.theoryMarks);
              const practScore = rndInt(10, subj.practicalMarks);
              const totalMarks = theoryScore + practScore;
              let grade = 'NG', gradePoint = 0.0;
              if (totalMarks >= 90) { grade = 'A+'; gradePoint = 4.0; }
              else if (totalMarks >= 80) { grade = 'A'; gradePoint = 3.6; }
              else if (totalMarks >= 70) { grade = 'B+'; gradePoint = 3.2; }
              else if (totalMarks >= 60) { grade = 'B'; gradePoint = 2.8; }
              else if (totalMarks >= 50) { grade = 'C+'; gradePoint = 2.4; }
              else if (totalMarks >= 40) { grade = 'C'; gradePoint = 2.0; }
              else if (totalMarks >= 30) { grade = 'D'; gradePoint = 1.6; }
              else { grade = 'NG'; gradePoint = 0.0; }

              await conn.query(
                'INSERT INTO grades (exam_id, student_id, theory_marks, practical_marks, total_marks, grade, grade_point, entered_by, entered_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())',
                [eResult.insertId, stu.studentId, theoryScore, practScore, totalMarks, grade, gradePoint, schoolAdminUserId]
              );
              gradeCount++;
            }
          }
        }
      }
      console.log(`   ✅ ${examCount} exams, ${gradeCount} grades created`);

      // ── Invoices ──────────────────────────────────────────────────────────
      console.log(`   💰 Seeding invoices...`);
      let invoiceCount = 0;
      const currentFeeStructId = feeStructureIds[currentAYId];
      for (const stu of allStudentsBySchool[school.id]) {
        const invoiceNum = `INV-${slug.toUpperCase()}-${pad(++invoiceCount, 4)}`;
        const total = 25000;
        const paid = rndInt(0, 1) ? total : rndInt(5000, 20000);
        const balance = total - paid;
        const status = balance === 0 ? 'paid' : (paid > 0 ? 'partial' : 'pending');
        await conn.query(
          'INSERT INTO invoices (invoice_number, student_id, fee_structure_id, academic_year_id, due_date, subtotal, discount, total_amount, paid_amount, balance, status, generated_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())',
          [invoiceNum, stu.studentId, currentFeeStructId, currentAYId, adDate(2024, 6, 30), total, 0, total, paid, balance, status]
        );
      }
      console.log(`   ✅ ${invoiceCount} invoices created`);

      // ── Events ────────────────────────────────────────────────────────────
      console.log(`   🎉 Seeding events...`);
      for (let i = 0; i < NEPALI_EVENTS.length; i++) {
        const ev = NEPALI_EVENTS[i];
        const eventDate = adDate(2024, 4 + i, rndInt(10, 25));
        await conn.query(
          'INSERT INTO events (title, title_np, description, description_np, category, start_date, start_date_bs, end_date, end_date_bs, start_time, end_time, venue, venue_np, is_holiday, target_audience, color, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
          [ev.title, ev.titleNp, `${ev.title} event for ${school.nameEn}`, `${ev.titleNp} कार्यक्रम`, ev.category,
           eventDate, bsDateForToday(30 - i * 5), eventDate, bsDateForToday(30 - i * 5),
           '10:00', '16:00', `${school.nameEn} Ground`, 'विद्यालय मैदान',
           ev.isHoliday ? 1 : 0, 'all', ev.color, 'scheduled', schoolAdminUserId]
        );
      }
      console.log(`   ✅ ${NEPALI_EVENTS.length} events created`);

      // ── Conversations & Messages ──────────────────────────────────────────
      console.log(`   💬 Seeding conversations...`);
      const firstStudent = allStudentsBySchool[school.id][0];
      const ctUserId = allStaffBySchool[school.id]['ct'].userId;
      if (firstStudent) {
        const [convResult] = await conn.query(
          'INSERT INTO conversations (participant1_id, participant2_id, unread_count_user1, unread_count_user2, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
          [ctUserId, firstStudent.userId, 0, 1]
        );
        const convId = convResult.insertId;
        const [msgResult] = await conn.query(
          'INSERT INTO messages (conversation_id, sender_id, recipient_id, content, is_read, sent_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW(), NOW())',
          [convId, ctUserId, firstStudent.userId, 'Namaste! Please bring your assignment tomorrow.', 0]
        );
        await conn.query('UPDATE conversations SET last_message_id = ? WHERE conversation_id = ?', [msgResult.insertId, convId]);

        // Group conversation for the first class
        const firstClass = allClassesBySchool[school.id][0];
        const [gcResult] = await conn.query(
          'INSERT INTO group_conversations (name, type, description, class_id, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
          [`Grade ${firstClass.grade}${firstClass.section} - Class Group`, 'class', 'Official class communication group', firstClass.classId, ctUserId]
        );
        await conn.query(
          'INSERT INTO group_members (group_conversation_id, user_id, role, joined_at, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW(), NOW())',
          [gcResult.insertId, ctUserId, 'admin']
        );
        const [gmResult] = await conn.query(
          'INSERT INTO group_messages (group_conversation_id, sender_id, content, sent_at, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW(), NOW())',
          [gcResult.insertId, ctUserId, 'Welcome to the class group! All important notices will be shared here.']
        );
        await conn.query('UPDATE group_conversations SET last_message_id = ? WHERE group_conversation_id = ?', [gmResult.insertId, gcResult.insertId]);
      }
      console.log(`   ✅ Conversations & messages created`);

      // ── Documents ─────────────────────────────────────────────────────────
      await conn.query(
        'INSERT INTO documents (document_number, name, original_name, description, category, mime_type, size, compressed_size, storage_path, uploaded_by, access_level, is_compressed, compression_ratio, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [`DOC-${slug.toUpperCase()}-001`, 'School Calendar 2081', 'school_calendar_2081.pdf', 'Academic calendar for 2081',
         'academic', 'application/pdf', 204800, 102400, `uploads/documents/${slug}/calendar.pdf`,
         schoolAdminUserId, 'public', 1, 0.5, 'active']
      );
      console.log(`   ✅ Documents created`);

      // ── Audit logs ─────────────────────────────────────────────────────────
      const firstStu = allStudentsBySchool[school.id][0];
      if (firstStu) {
        await conn.query(
          'INSERT INTO audit_logs (user_id, entity_type, entity_id, action, ip_address, user_agent, timestamp, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
          [schoolAdminUserId, 'Student', String(firstStu.studentId), 'create', '127.0.0.1', 'Seed Script/1.0']
        );
      }
    } // end for each school

    // ── PRINT SUMMARY ──────────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(70));
    console.log('🎉  SEEDING COMPLETE!\n');
    console.log('📋  LOGIN CREDENTIALS\n');
    console.log('MUNICIPALITY ADMINS:');
    for (const mun of MUNICIPALITIES) {
      const slug = mun.code.toLowerCase();
      console.log(`  munadmin_${slug}  /  Municipality@123  (${mun.nameEn})`);
    }
    console.log('\nSCHOOL ADMINS (one per school):');
    for (const sch of schools) {
      const slug = sch.code.toLowerCase().replace(/-/g, '_');
      console.log(`  admin_${slug}  /  Admin@123  (${sch.nameEn})`);
    }
    console.log('\nSTAFF (per school, replace {sch} with school slug e.g. kmc_sch1):');
    console.log('  ct_{sch}      /  Teacher@123        (Class Teacher)');
    console.log('  st_{sch}      /  Teacher@123        (Subject Teacher)');
    console.log('  dh_{sch}      /  DeptHead@123       (Department Head)');
    console.log('  eca_{sch}     /  ECACoord@123       (ECA Coordinator)');
    console.log('  sc_{sch}      /  SportsCoord@123    (Sports Coordinator)');
    console.log('  lib_{sch}     /  Librarian@123      (Librarian)');
    console.log('  acc_{sch}     /  Accountant@123     (Accountant)');
    console.log('  tm_{sch}      /  Transport@123      (Transport Manager)');
    console.log('  hw_{sch}      /  Hostel@123         (Hostel Warden)');
    console.log('  nts_{sch}     /  Staff@123          (Non-Teaching Staff)');
    console.log('\nSTUDENTS (per school):');
    console.log('  stu_{sch}_001 to stu_{sch}_150  /  Student@123');
    console.log('\nPARENTS (per school):');
    console.log('  par_{sch}_001 to par_{sch}_045  /  Parent@123');
    console.log('\nExample school slugs: kmc_kmc_sch1, kmc_kmc_sch2, lmc_lmc_sch1, lmc_lmc_sch2');

    // Quick DB counts
    const countTables = ['municipalities','school_config','users','students','staff','classes','academic_years','subjects','exams','grades','attendance','invoices','events'];
    console.log('\n📊  DATA COUNTS:');
    for (const t of countTables) {
      const [rows] = await conn.query('SELECT COUNT(*) as cnt FROM '+t);
      console.log(`  ${t}: ${rows[0].cnt}`);
    }
    console.log('═'.repeat(70));

  } catch (err) {
    console.error('\n❌ Seeding failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

main();
