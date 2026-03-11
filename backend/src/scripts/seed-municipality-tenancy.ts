#!/usr/bin/env ts-node
/**
 * Comprehensive Municipality Seed Script
 *
 * Creates deterministic, municipality-scoped test data with full referential integrity.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register src/scripts/seed-municipality-tenancy.ts [options]
 *
 * Options:
 *   --municipalityCount N          Number of municipalities (default: 3)
 *   --schoolsPerMunicipality N     Schools per municipality (default: 4)
 *   --clean                        Drop and recreate seeded data
 *   --output <path>                Output JSON manifest (default: seed-manifest.json)
 */

import { Sequelize, Op } from 'sequelize';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';

// ---------- Nepali date helper ----------
let NepaliDate: any;
try {
  NepaliDate = require('nepali-date-converter');
  if (NepaliDate.default) NepaliDate = NepaliDate.default;
} catch {
  console.warn('[seed] nepali-date-converter not found – using fallback BS dates');
  NepaliDate = null;
}

// ---------- CLI args ----------
const args = process.argv.slice(2);
function getArg(name: string, fallback: string): string {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback;
}
const MUNICIPALITY_COUNT = parseInt(getArg('municipalityCount', '3'), 10);
const SCHOOLS_PER_MUNICIPALITY = parseInt(getArg('schoolsPerMunicipality', '4'), 10);
const CLEAN = args.includes('--clean');
const OUTPUT_PATH = getArg('output', path.join(process.cwd(), 'seed-manifest.json'));

// ---------- Database connection ----------
const DATABASE_URL = process.env.DATABASE_URL;
const sequelize = DATABASE_URL
  ? new Sequelize(DATABASE_URL, {
      dialect: 'mysql',
      logging: false,
      timezone: '+05:45',
      dialectOptions: { connectTimeout: 30000 },
    })
  : new Sequelize({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      database: process.env.DB_NAME || 'school_management_system',
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      dialect: 'mysql',
      logging: false,
      timezone: '+05:45',
    });

// ---------- Deterministic UUID ----------
function deterministicUUID(seed: string): string {
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  // Format as UUID v4-like
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16),
    '8' + hash.substring(17, 20),
    hash.substring(20, 32),
  ].join('-');
}

// ---------- Password (computed once) ----------
const SEED_PASSWORD = bcrypt.hashSync('SeedPass123!', 12);

// ---------- BS date helpers ----------
interface AcademicYearDates {
  name: string;
  startBs: string;
  endBs: string;
  startAd: string;
  endAd: string;
}

function getAcademicYearDates(bsYear: number): AcademicYearDates {
  const name = `${bsYear}-${bsYear + 1} BS`;
  if (NepaliDate) {
    try {
      const start = new NepaliDate(bsYear, 0, 1); // Baisakh 1
      const end = new NepaliDate(bsYear, 11, 29); // Chaitra ~29 (safe value)
      const startAd = start.toJsDate();
      const endAd = end.toJsDate();
      return {
        name,
        startBs: `${bsYear}-01-01`,
        endBs: `${bsYear}-12-29`,
        startAd: startAd.toISOString().split('T')[0],
        endAd: endAd.toISOString().split('T')[0],
      };
    } catch {
      // fallback below
    }
  }
  // Fallback: approximate AD dates (BS year − 57 ≈ AD)
  const adYear = bsYear - 57;
  return {
    name,
    startBs: `${bsYear}-01-01`,
    endBs: `${bsYear}-12-30`,
    startAd: `${adYear}-04-14`,
    endAd: `${adYear + 1}-04-13`,
  };
}

function getBsDateString(bsYear: number, bsMonth: number, bsDay: number): string {
  return `${bsYear}-${String(bsMonth).padStart(2, '0')}-${String(bsDay).padStart(2, '0')}`;
}

function bsToAd(bsYear: number, bsMonth: number, bsDay: number): string {
  if (NepaliDate) {
    try {
      const nd = new NepaliDate(bsYear, bsMonth - 1, bsDay);
      return nd.toJsDate().toISOString().split('T')[0];
    } catch { /* fallback */ }
  }
  const adYear = bsYear - 57;
  return `${adYear}-${String(bsMonth + 3 > 12 ? bsMonth + 3 - 12 : bsMonth + 3).padStart(2, '0')}-${String(bsDay).padStart(2, '0')}`;
}

// ---------- Seeder helpers ----------
const DISTRICTS = [
  'Kathmandu', 'Lalitpur', 'Bhaktapur', 'Kaski', 'Chitwan',
  'Morang', 'Sunsari', 'Rupandehi', 'Banke', 'Kailali',
];
const PROVINCES = ['Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim'];

const FIRST_NAMES = [
  'Ram', 'Shyam', 'Hari', 'Sita', 'Gita', 'Krishna', 'Anita', 'Bikash',
  'Deepa', 'Raj', 'Sunita', 'Prakash', 'Kamala', 'Binod', 'Mina', 'Suresh',
  'Sapana', 'Nabin', 'Puja', 'Arun', 'Laxmi', 'Dipak', 'Nirmala', 'Kiran',
  'Sarita', 'Bijay', 'Rekha', 'Manoj', 'Devi', 'Ganesh', 'Indra', 'Jyoti',
];
const LAST_NAMES = [
  'Sharma', 'Thapa', 'Gurung', 'Tamang', 'Rai', 'Magar', 'Adhikari', 'Poudel',
  'Basnet', 'Shrestha', 'KC', 'Bhandari', 'Karki', 'Chhetri', 'Dahal', 'Pandit',
];

function pickName(seedStr: string, list: string[]): string {
  const hash = crypto.createHash('md5').update(seedStr).digest();
  return list[hash[0] % list.length];
}

const EVENT_TYPES = [
  'holiday', 'exam', 'sports_day', 'cultural_program',
  'parent_meeting', 'field_trip', 'workshop', 'assembly',
];
const ATTENDANCE_STATUSES = ['present', 'present', 'present', 'present', 'present', 'present', 'present', 'present', 'absent', 'late', 'excused', 'present'];
const GRADE_MAP: Record<string, { grade: string; gradePoint: number }> = {
  A_PLUS: { grade: 'A+', gradePoint: 4.0 },
  A: { grade: 'A', gradePoint: 3.6 },
  B_PLUS: { grade: 'B+', gradePoint: 3.2 },
  B: { grade: 'B', gradePoint: 2.8 },
  C_PLUS: { grade: 'C+', gradePoint: 2.4 },
  C: { grade: 'C', gradePoint: 2.0 },
  D: { grade: 'D', gradePoint: 1.6 },
  NG: { grade: 'NG', gradePoint: 0.0 },
};

function calculateGrade(percentage: number): { grade: string; gradePoint: number } {
  if (percentage >= 90) return GRADE_MAP.A_PLUS;
  if (percentage >= 80) return GRADE_MAP.A;
  if (percentage >= 70) return GRADE_MAP.B_PLUS;
  if (percentage >= 60) return GRADE_MAP.B;
  if (percentage >= 50) return GRADE_MAP.C_PLUS;
  if (percentage >= 40) return GRADE_MAP.C;
  if (percentage >= 35) return GRADE_MAP.D;
  return GRADE_MAP.NG;
}

// ---------- SUBJECTS (shared) ----------
const SUBJECTS_DEF = [
  { code: 'SEED-ENG', nameEn: 'English', nameNp: 'अंग्रेजी', type: 'compulsory', theoryMarks: 75, practicalMarks: 25 },
  { code: 'SEED-NEP', nameEn: 'Nepali', nameNp: 'नेपाली', type: 'compulsory', theoryMarks: 75, practicalMarks: 25 },
  { code: 'SEED-MAT', nameEn: 'Mathematics', nameNp: 'गणित', type: 'compulsory', theoryMarks: 75, practicalMarks: 25 },
  { code: 'SEED-SCI', nameEn: 'Science', nameNp: 'विज्ञान', type: 'compulsory', theoryMarks: 75, practicalMarks: 25 },
  { code: 'SEED-SOC', nameEn: 'Social Studies', nameNp: 'सामाजिक अध्ययन', type: 'compulsory', theoryMarks: 75, practicalMarks: 25 },
  { code: 'SEED-COM', nameEn: 'Computer Science', nameNp: 'कम्प्युटर', type: 'optional', theoryMarks: 50, practicalMarks: 50 },
];

// ---------- Main seeder ----------
async function main(): Promise<void> {
  console.log('=== Municipality Seed Script ===');
  console.log(`Municipalities: ${MUNICIPALITY_COUNT}, Schools/Mun: ${SCHOOLS_PER_MUNICIPALITY}, Clean: ${CLEAN}`);

  await sequelize.authenticate();
  console.log('[seed] Database connected');

  if (CLEAN) {
    console.log('[seed] Cleaning seeded data...');
    await sequelize.query(`DELETE FROM users WHERE username LIKE 'seed-%'`);
    await sequelize.query(`DELETE FROM subjects WHERE code LIKE 'SEED-%'`);
    // Delete municipalities last (cascading should handle children)
    await sequelize.query(`DELETE FROM municipalities WHERE code LIKE 'SEED-%'`);
    console.log('[seed] Clean complete');
  }

  // Ensure subjects exist
  const subjectIds: number[] = [];
  for (const sub of SUBJECTS_DEF) {
    const [rows] = await sequelize.query(
      `SELECT subject_id FROM subjects WHERE code = :code LIMIT 1`,
      { replacements: { code: sub.code } }
    );
    if ((rows as any[]).length > 0) {
      subjectIds.push((rows as any)[0].subject_id);
    } else {
      const [result] = await sequelize.query(
        `INSERT INTO subjects (code, name_en, name_np, type, credit_hours, theory_marks, practical_marks, pass_marks, full_marks, applicable_classes, created_at, updated_at)
         VALUES (:code, :nameEn, :nameNp, :type, 100, :theoryMarks, :practicalMarks, 35, 100, :classes, NOW(), NOW())`,
        {
          replacements: {
            ...sub,
            classes: JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
          },
        }
      );
      subjectIds.push((result as number));
    }
  }
  // Re-fetch to get definitive IDs
  const [subjectRows] = await sequelize.query(
    `SELECT subject_id, code FROM subjects WHERE code LIKE 'SEED-%' ORDER BY subject_id`
  );
  const subjectMap = new Map<string, number>();
  for (const row of subjectRows as any[]) {
    subjectMap.set(row.code, row.subject_id);
  }
  console.log(`[seed] ${subjectMap.size} subjects ready`);

  const manifest: any = { generatedAt: new Date().toISOString(), municipalities: [] };

  for (let m = 1; m <= MUNICIPALITY_COUNT; m++) {
    const mPad = String(m).padStart(3, '0');
    const munCode = `SEED-MUN-${mPad}`;
    const munId = deterministicUUID(`municipality-${munCode}`);

    console.log(`\n[seed] === Municipality ${m}/${MUNICIPALITY_COUNT}: ${munCode} ===`);
    const transaction = await sequelize.transaction();

    try {
      // ---- Municipality ----
      await sequelize.query(
        `INSERT INTO municipalities (id, name_en, name_np, code, district, province, address, contact_phone, contact_email, is_active, created_at, updated_at)
         VALUES (:id, :nameEn, :nameNp, :code, :district, :province, :address, :phone, :email, 1, NOW(), NOW())
         ON DUPLICATE KEY UPDATE name_en = VALUES(name_en)`,
        {
          replacements: {
            id: munId,
            nameEn: `Seed Municipality ${m}`,
            nameNp: `सीड नगरपालिका ${m}`,
            code: munCode,
            district: DISTRICTS[(m - 1) % DISTRICTS.length],
            province: PROVINCES[(m - 1) % PROVINCES.length],
            address: `Ward ${m}, Test District`,
            phone: `+977-1-400${mPad}`,
            email: `admin@${munCode.toLowerCase()}.gov.np`,
          },
          transaction,
        }
      );

      const munManifest: any = { id: munId, code: munCode, schools: [], users: {} };

      // ---- Municipality Admin Users ----
      // 1 super-admin + 2 municipality admins = 3 users
      const munAdminUserIds: number[] = [];
      for (let a = 0; a < 3; a++) {
        const username = a === 0 ? `seed-superadmin-mun-${m}` : `seed-munadmin-${m}-${a}`;
        const email = `${username}@seed.test`;
        const [result] = await sequelize.query(
          `INSERT INTO users (username, email, password, role, status, municipality_id, phone_number, created_at, updated_at)
           VALUES (:username, :email, :password, 'Municipality_Admin', 'active', :munId, :phone, NOW(), NOW())
           ON DUPLICATE KEY UPDATE municipality_id = VALUES(municipality_id)`,
          {
            replacements: { username, email, password: SEED_PASSWORD, munId, phone: `+977-98${m}${a}000001` },
            transaction,
          }
        );
        const [[userRow]] = await sequelize.query(
          `SELECT user_id FROM users WHERE username = :username LIMIT 1`,
          { replacements: { username }, transaction }
        ) as [any[], unknown];
        munAdminUserIds.push(userRow.user_id);
      }
      munManifest.users.municipalityAdmins = munAdminUserIds;

      // ---- Schools ----
      for (let s = 1; s <= SCHOOLS_PER_MUNICIPALITY; s++) {
        const sPad = String(s).padStart(2, '0');
        const schoolCode = `SEED-SCH-${mPad}-${sPad}`;
        const schoolId = deterministicUUID(`school-${schoolCode}`);

        await sequelize.query(
          `INSERT INTO school_config (id, municipality_id, school_name_en, school_name_np, school_code, academic_year_start_month, terms_per_year, default_calendar_system, default_language, timezone, currency, is_active, created_at, updated_at)
           VALUES (:id, :munId, :nameEn, :nameNp, :code, 1, 3, 'BS', 'nepali', 'Asia/Kathmandu', 'NPR', 1, NOW(), NOW())
           ON DUPLICATE KEY UPDATE municipality_id = VALUES(municipality_id)`,
          {
            replacements: {
              id: schoolId,
              munId,
              nameEn: `Seed School ${s} (Mun ${m})`,
              nameNp: `सीड विद्यालय ${s}`,
              code: schoolCode,
            },
            transaction,
          }
        );

        const schoolManifest: any = { id: schoolId, code: schoolCode, users: {}, classes: [], academicYears: [] };

        // ---- Principal (School_Admin) ----
        const principalUsername = `seed-principal-${m}-${s}`;
        await sequelize.query(
          `INSERT INTO users (username, email, password, role, status, municipality_id, school_config_id, phone_number, created_at, updated_at)
           VALUES (:username, :email, :password, 'School_Admin', 'active', :munId, :schoolId, :phone, NOW(), NOW())
           ON DUPLICATE KEY UPDATE school_config_id = VALUES(school_config_id)`,
          {
            replacements: {
              username: principalUsername,
              email: `${principalUsername}@seed.test`,
              password: SEED_PASSWORD,
              munId, schoolId,
              phone: `+977-98${m}${s}100001`,
            },
            transaction,
          }
        );

        // ---- Teachers (4 per school) ----
        const teacherUserIds: number[] = [];
        const teacherStaffIds: number[] = [];
        for (let t = 1; t <= 4; t++) {
          const tUsername = `seed-teacher-${m}-${s}-${t}`;
          const firstName = pickName(`teacher-${m}-${s}-${t}-fn`, FIRST_NAMES);
          const lastName = pickName(`teacher-${m}-${s}-${t}-ln`, LAST_NAMES);
          const role = t <= 2 ? 'Subject_Teacher' : 'Class_Teacher';

          await sequelize.query(
            `INSERT INTO users (username, email, password, role, status, municipality_id, school_config_id, phone_number, created_at, updated_at)
             VALUES (:username, :email, :password, :role, 'active', :munId, :schoolId, :phone, NOW(), NOW())
             ON DUPLICATE KEY UPDATE school_config_id = VALUES(school_config_id)`,
            {
              replacements: {
                username: tUsername, email: `${tUsername}@seed.test`,
                password: SEED_PASSWORD, role, munId, schoolId,
                phone: `+977-98${m}${s}2${String(t).padStart(4, '0')}`,
              },
              transaction,
            }
          );
          const [[tUser]] = await sequelize.query(
            `SELECT user_id FROM users WHERE username = :username LIMIT 1`,
            { replacements: { username: tUsername }, transaction }
          ) as [any[], unknown];
          teacherUserIds.push(tUser.user_id);

          // Staff record
          const staffCode = `SEED-STF-${mPad}-${sPad}-${String(t).padStart(2, '0')}`;
          await sequelize.query(
            `INSERT INTO staff (user_id, staff_code, first_name_en, last_name_en, category, position, department, employment_type, join_date, status, school_config_id, municipality_id, email, phone, created_at, updated_at)
             VALUES (:userId, :staffCode, :firstName, :lastName, 'teaching', :position, 'Academic', 'full_time', '2023-04-14', 'active', :schoolId, :munId, :email, :phone, NOW(), NOW())
             ON DUPLICATE KEY UPDATE school_config_id = VALUES(school_config_id)`,
            {
              replacements: {
                userId: tUser.user_id, staffCode, firstName, lastName,
                position: role === 'Class_Teacher' ? 'Class Teacher' : 'Subject Teacher',
                schoolId, munId, email: `${tUsername}@seed.test`,
                phone: `+977-98${m}${s}2${String(t).padStart(4, '0')}`,
              },
              transaction,
            }
          );
          const [[staffRow]] = await sequelize.query(
            `SELECT staff_id FROM staff WHERE staff_code = :staffCode LIMIT 1`,
            { replacements: { staffCode }, transaction }
          ) as [any[], unknown];
          teacherStaffIds.push(staffRow.staff_id);
        }
        schoolManifest.users.teachers = teacherUserIds;

        // ---- Academic Years (3) ----
        const academicYearIds: number[] = [];
        for (let ay = 0; ay < 3; ay++) {
          const bsYear = 2080 + ay;
          const dates = getAcademicYearDates(bsYear);
          const isCurrent = bsYear === 2081 ? 1 : 0;

          await sequelize.query(
            `INSERT INTO academic_years (name, start_date_bs, end_date_bs, start_date_ad, end_date_ad, is_current, school_config_id, municipality_id, created_at, updated_at)
             VALUES (:name, :startBs, :endBs, :startAd, :endAd, :isCurrent, :schoolId, :munId, NOW(), NOW())`,
            {
              replacements: { ...dates, isCurrent, schoolId, munId },
              transaction,
            }
          );
          const [[ayRow]] = await sequelize.query(
            `SELECT academic_year_id FROM academic_years WHERE name = :name AND school_config_id = :schoolId ORDER BY academic_year_id DESC LIMIT 1`,
            { replacements: { name: dates.name, schoolId }, transaction }
          ) as [any[], unknown];
          academicYearIds.push(ayRow.academic_year_id);
          schoolManifest.academicYears.push({ id: ayRow.academic_year_id, name: dates.name, isCurrent: !!isCurrent });
        }
        const currentAyId = academicYearIds[1]; // 2081-2082

        // ---- Terms (3 per current academic year) ----
        const termIds: number[] = [];
        const termNames = ['First Terminal', 'Second Terminal', 'Final'];
        for (let ti = 0; ti < 3; ti++) {
          const termStartMonth = ti * 4 + 1;
          const termEndMonth = (ti + 1) * 4;
          await sequelize.query(
            `INSERT INTO terms (academic_year_id, name, start_date, end_date, created_at, updated_at)
             VALUES (:ayId, :name, :startDate, :endDate, NOW(), NOW())`,
            {
              replacements: {
                ayId: currentAyId,
                name: termNames[ti],
                startDate: bsToAd(2081, termStartMonth, 1),
                endDate: bsToAd(2081, termEndMonth, 28),
              },
              transaction,
            }
          );
          const [[termRow]] = await sequelize.query(
            `SELECT term_id FROM terms WHERE academic_year_id = :ayId AND name = :name ORDER BY term_id DESC LIMIT 1`,
            { replacements: { ayId: currentAyId, name: termNames[ti] }, transaction }
          ) as [any[], unknown];
          termIds.push(termRow.term_id);
        }

        // ---- Classes (3 per school: grade 1-3, section A) ----
        const classIds: number[] = [];
        for (let g = 1; g <= 3; g++) {
          const classTeacherId = teacherStaffIds[g - 1] || teacherStaffIds[0];
          await sequelize.query(
            `INSERT INTO classes (academic_year_id, grade_level, section, shift, class_teacher_id, capacity, current_strength, school_config_id, municipality_id, created_at, updated_at)
             VALUES (:ayId, :grade, 'A', 'morning', :teacherId, 40, 0, :schoolId, :munId, NOW(), NOW())`,
            {
              replacements: { ayId: currentAyId, grade: g, teacherId: classTeacherId, schoolId, munId },
              transaction,
            }
          );
          const [[classRow]] = await sequelize.query(
            `SELECT class_id FROM classes WHERE academic_year_id = :ayId AND grade_level = :grade AND section = 'A' AND school_config_id = :schoolId ORDER BY class_id DESC LIMIT 1`,
            { replacements: { ayId: currentAyId, grade: g, schoolId }, transaction }
          ) as [any[], unknown];
          classIds.push(classRow.class_id);
          schoolManifest.classes.push({ id: classRow.class_id, grade: g, section: 'A' });
        }

        // ---- Class-Subject junction ----
        const subjectCodes = Array.from(subjectMap.keys());
        for (const classId of classIds) {
          for (let si = 0; si < subjectCodes.length; si++) {
            const subjId = subjectMap.get(subjectCodes[si])!;
            const teacherStaffId = teacherStaffIds[si % teacherStaffIds.length];
            await sequelize.query(
              `INSERT INTO class_subjects (class_id, subject_id, teacher_id, school_config_id, municipality_id, created_at, updated_at)
               VALUES (:classId, :subjId, :teacherId, :schoolId, :munId, NOW(), NOW())
               ON DUPLICATE KEY UPDATE teacher_id = VALUES(teacher_id)`,
              {
                replacements: { classId, subjId, teacherId: teacherStaffId, schoolId, munId },
                transaction,
              }
            );
          }
        }

        // ---- Students (80 per school, ~27 per class) ----
        const studentIds: number[] = [];
        for (let st = 1; st <= 80; st++) {
          const stPad = String(st).padStart(3, '0');
          const studentCode = `SEED-STU-${mPad}-${sPad}-${stPad}`;
          const firstName = pickName(`student-${m}-${s}-${st}-fn`, FIRST_NAMES);
          const lastName = pickName(`student-${m}-${s}-${st}-ln`, LAST_NAMES);
          const classIdx = (st - 1) % classIds.length;
          const classId = classIds[classIdx];
          const gradeLevel = classIdx + 1;
          const gender = st % 3 === 0 ? 'female' : st % 5 === 0 ? 'other' : 'male';
          const dobBsYear = 2068 + (st % 5);
          const dobBsMonth = ((st * 3) % 12) + 1;
          const dobBsDay = (st % 28) + 1;

          // Create student user
          const stuUsername = `seed-student-${m}-${s}-${st}`;
          await sequelize.query(
            `INSERT INTO users (username, email, password, role, status, municipality_id, school_config_id, phone_number, created_at, updated_at)
             VALUES (:username, :email, :password, 'Student', 'active', :munId, :schoolId, :phone, NOW(), NOW())
             ON DUPLICATE KEY UPDATE school_config_id = VALUES(school_config_id)`,
            {
              replacements: {
                username: stuUsername, email: `${stuUsername}@seed.test`,
                password: SEED_PASSWORD, munId, schoolId,
                phone: `+977-98${m}${s}3${stPad}`,
              },
              transaction,
            }
          );
          const [[stuUser]] = await sequelize.query(
            `SELECT user_id FROM users WHERE username = :username LIMIT 1`,
            { replacements: { username: stuUsername }, transaction }
          ) as [any[], unknown];

          await sequelize.query(
            `INSERT INTO students (user_id, student_code, first_name_en, last_name_en, date_of_birth_bs, date_of_birth_ad, gender, address_en, father_name, father_phone, mother_name, mother_phone, admission_date, admission_class, current_class_id, roll_number, status, school_config_id, municipality_id, emergency_contact, email, created_at, updated_at)
             VALUES (:userId, :code, :firstName, :lastName, :dobBs, :dobAd, :gender, :address, :fatherName, :fatherPhone, :motherName, :motherPhone, '2024-04-14', :gradeLevel, :classId, :rollNo, 'active', :schoolId, :munId, :emergencyPhone, :email, NOW(), NOW())
             ON DUPLICATE KEY UPDATE current_class_id = VALUES(current_class_id)`,
            {
              replacements: {
                userId: stuUser.user_id, code: studentCode, firstName, lastName,
                dobBs: getBsDateString(dobBsYear, dobBsMonth, dobBsDay),
                dobAd: bsToAd(dobBsYear, dobBsMonth, dobBsDay),
                gender, address: `Ward ${st % 10 + 1}, Test Area`,
                fatherName: `${pickName(`father-${m}-${s}-${st}`, FIRST_NAMES)} ${lastName}`,
                fatherPhone: `+977-98${m}${s}4${stPad}`,
                motherName: `${pickName(`mother-${m}-${s}-${st}`, FIRST_NAMES)} ${lastName}`,
                motherPhone: `+977-98${m}${s}5${stPad}`,
                gradeLevel, classId, rollNo: st,
                schoolId, munId,
                emergencyPhone: `+977-98${m}${s}6${stPad}`,
                email: `${stuUsername}@seed.test`,
              },
              transaction,
            }
          );
          const [[stuRow]] = await sequelize.query(
            `SELECT student_id FROM students WHERE student_code = :code LIMIT 1`,
            { replacements: { code: studentCode }, transaction }
          ) as [any[], unknown];
          studentIds.push(stuRow.student_id);
        }

        // Update class strengths
        for (let ci = 0; ci < classIds.length; ci++) {
          const count = studentIds.filter((_, idx) => idx % classIds.length === ci).length;
          await sequelize.query(
            `UPDATE classes SET current_strength = :count WHERE class_id = :classId`,
            { replacements: { count, classId: classIds[ci] }, transaction }
          );
        }

        schoolManifest.users.students = studentIds.length;

        // ---- Events (12 per school) ----
        const markerUserId = munAdminUserIds[0];
        for (let ev = 1; ev <= 12; ev++) {
          const bsMonth = ((ev - 1) % 12) + 1;
          const eventDate = bsToAd(2081, bsMonth, 15);
          const eventType = EVENT_TYPES[(ev - 1) % EVENT_TYPES.length];
          await sequelize.query(
            `INSERT INTO events (title, description, event_date, event_type, created_by, school_config_id, municipality_id, created_at, updated_at)
             VALUES (:title, :desc, :eventDate, :eventType, :createdBy, :schoolId, :munId, NOW(), NOW())`,
            {
              replacements: {
                title: `${eventType.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} - ${schoolCode}`,
                desc: `Seed event ${ev} for school ${schoolCode}`,
                eventDate,
                eventType,
                createdBy: markerUserId,
                schoolId, munId,
              },
              transaction,
            }
          );
        }

        // ---- Attendance (240 per school = 80 students × 3 days) ----
        const teacherMarker = teacherUserIds[0];
        for (let day = 1; day <= 3; day++) {
          const attDateAd = bsToAd(2081, 6, day + 10); // Aswin 11-13
          const attDateBs = getBsDateString(2081, 6, day + 10);
          for (const studentId of studentIds) {
            const classId = classIds[(studentIds.indexOf(studentId)) % classIds.length];
            const statusIdx = (studentId + day) % ATTENDANCE_STATUSES.length;
            await sequelize.query(
              `INSERT INTO attendance (student_id, class_id, date, date_bs, status, marked_by, marked_at, school_config_id, municipality_id, created_at, updated_at)
               VALUES (:studentId, :classId, :date, :dateBs, :status, :markedBy, NOW(), :schoolId, :munId, NOW(), NOW())`,
              {
                replacements: {
                  studentId, classId,
                  date: attDateAd, dateBs: attDateBs,
                  status: ATTENDANCE_STATUSES[statusIdx],
                  markedBy: teacherMarker,
                  schoolId, munId,
                },
                transaction,
              }
            );
          }
        }

        // ---- Exams & Grades ----
        // 2 exams per subject (unit_test + first_terminal) = 12 exams per class, 36 per school
        let gradeCount = 0;
        for (const classId of classIds) {
          for (const [subCode, subjId] of subjectMap) {
            for (let examIdx = 0; examIdx < 2; examIdx++) {
              const examType = examIdx === 0 ? 'unit_test' : 'first_terminal';
              const examName = `${examType === 'unit_test' ? 'Unit Test' : 'First Terminal'} - ${subCode.replace('SEED-', '')}`;
              const examDate = bsToAd(2081, examIdx === 0 ? 3 : 7, 15);

              await sequelize.query(
                `INSERT INTO exams (name, type, subject_id, class_id, academic_year_id, term_id, exam_date, duration, full_marks, pass_marks, theory_marks, practical_marks, status, school_config_id, municipality_id, created_at, updated_at)
                 VALUES (:name, :type, :subjId, :classId, :ayId, :termId, :examDate, 120, 100, 35, 75, 25, 'completed', :schoolId, :munId, NOW(), NOW())`,
                {
                  replacements: {
                    name: examName, type: examType, subjId, classId,
                    ayId: currentAyId, termId: termIds[examIdx],
                    examDate, schoolId, munId,
                  },
                  transaction,
                }
              );
              const [[examRow]] = await sequelize.query(
                `SELECT exam_id FROM exams WHERE name = :name AND class_id = :classId AND school_config_id = :schoolId ORDER BY exam_id DESC LIMIT 1`,
                { replacements: { name: examName, classId, schoolId }, transaction }
              ) as [any[], unknown];

              // Grades for each student in this class
              const classStudentIds = studentIds.filter((_, idx) => idx % classIds.length === classIds.indexOf(classId));
              for (const studentId of classStudentIds) {
                const seed = studentId * 7 + examRow.exam_id * 13;
                const theoryMarks = Math.round(30 + (seed % 46)); // 30-75
                const practicalMarks = Math.round(10 + (seed % 16)); // 10-25
                const totalMarks = theoryMarks + practicalMarks;
                const { grade, gradePoint } = calculateGrade(totalMarks);

                await sequelize.query(
                  `INSERT INTO grades (exam_id, student_id, theory_marks, practical_marks, total_marks, grade, grade_point, entered_by, entered_at, school_config_id, municipality_id, created_at, updated_at)
                   VALUES (:examId, :studentId, :theory, :practical, :total, :grade, :gp, :enteredBy, NOW(), :schoolId, :munId, NOW(), NOW())`,
                  {
                    replacements: {
                      examId: examRow.exam_id, studentId,
                      theory: theoryMarks, practical: practicalMarks,
                      total: totalMarks, grade, gp: gradePoint,
                      enteredBy: teacherMarker, schoolId, munId,
                    },
                    transaction,
                  }
                );
                gradeCount++;
              }
            }
          }
        }

        console.log(`  [school ${s}] ${schoolCode}: 1 principal, 4 teachers, ${studentIds.length} students, 3 classes, 12 events, ${studentIds.length * 3} attendance, ${gradeCount} grades`);
        munManifest.schools.push(schoolManifest);
      }

      await transaction.commit();
      manifest.municipalities.push(munManifest);
      console.log(`[seed] Municipality ${munCode} committed successfully`);
    } catch (error) {
      await transaction.rollback();
      console.error(`[seed] Municipality ${munCode} FAILED - rolled back:`, (error as Error).message);
    }
  }

  // Write manifest
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\n[seed] Manifest written to ${OUTPUT_PATH}`);

  // Summary
  console.log('\n=== SEED SUMMARY ===');
  console.log(`Municipalities created: ${manifest.municipalities.length}`);
  console.log(`Schools per municipality: ${SCHOOLS_PER_MUNICIPALITY}`);
  console.log(`Default password: SeedPass123!`);
  console.log(`Manifest: ${OUTPUT_PATH}`);

  await sequelize.close();
  process.exit(0);
}

main().catch(err => {
  console.error('[seed] Fatal error:', err);
  process.exit(1);
});
