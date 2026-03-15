#!/usr/bin/env ts-node
/**
 * Comprehensive Municipality Seed Script
 *
 * Seeds municipalities, schools, users, academic data, students, staff,
 * attendance, exams, grades, and events with deterministic, identifiable data.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register src/scripts/seed-municipality-tenancy.ts [options]
 *
 * Options:
 *   --municipalityCount N         Number of municipalities (default: 3)
 *   --schoolsPerMunicipality N    Schools per municipality (default: 4)
 *   --clean                       Drop and recreate seeded data (identified by SEED- prefix)
 *   --output manifest.json        Output file for UUID manifest
 */

import 'dotenv/config';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { Op, Transaction } from 'sequelize';
import NepaliDate from 'nepali-date-converter';

import sequelize from '../config/database';
import Municipality from '../models/Municipality.model';
import SchoolConfig from '../models/SchoolConfig.model';
import User, { UserRole, UserStatus } from '../models/User.model';
import { AcademicYear, Term } from '../models/AcademicYear.model';
import Class from '../models/Class.model';
import Student, { StudentStatus, Gender } from '../models/Student.model';
import Staff, { StaffCategory, EmploymentType, StaffStatus } from '../models/Staff.model';
import AttendanceRecord, { AttendanceStatus, SyncStatus } from '../models/AttendanceRecord.model';
import Exam, { ExamType, ExamStatus } from '../models/Exam.model';
import Grade, { NEBGrade } from '../models/Grade.model';
import { Event as SchoolEvent, initEvent } from '../models/Event.model';
import { Subject, ClassSubject, SubjectType } from '../models/Subject.model';

// Initialize Event model (deferred init pattern)
initEvent(sequelize);

/* ═══════════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════════ */

const SEED_PASSWORD = 'SeedPass123!';
const HASHED_PASSWORD = bcrypt.hashSync(SEED_PASSWORD, 12);

const STUDENTS_PER_SCHOOL = 80;
const TEACHERS_PER_SCHOOL = 4;
const CLASSES_PER_SCHOOL = 3;
const GRADES_IN_SCHOOL = [1, 2, 3];
const ATTENDANCE_DAYS = 12;
const ATTENDANCE_STUDENTS_PER_SCHOOL = 20;
const EVENTS_PER_SCHOOL = 12;

const SUBJECT_DEFS = [
  { code: 'SEED-ENG', nameEn: 'English',          nameNp: '\u0905\u0902\u0917\u094D\u0930\u0947\u091C\u0940',                         type: SubjectType.COMPULSORY },
  { code: 'SEED-NEP', nameEn: 'Nepali',           nameNp: '\u0928\u0947\u092A\u093E\u0932\u0940',                                     type: SubjectType.COMPULSORY },
  { code: 'SEED-MAT', nameEn: 'Mathematics',      nameNp: '\u0917\u0923\u093F\u0924',                                                 type: SubjectType.COMPULSORY },
  { code: 'SEED-SCI', nameEn: 'Science',           nameNp: '\u0935\u093F\u091C\u094D\u091E\u093E\u0928',                               type: SubjectType.COMPULSORY },
  { code: 'SEED-SOC', nameEn: 'Social Studies',    nameNp: '\u0938\u093E\u092E\u093E\u091C\u093F\u0915 \u0905\u0927\u094D\u092F\u092F\u0928', type: SubjectType.COMPULSORY },
  { code: 'SEED-CMP', nameEn: 'Computer Science',  nameNp: '\u0915\u092E\u094D\u092A\u094D\u092F\u0941\u091F\u0930 \u0935\u093F\u091C\u094D\u091E\u093E\u0928',   type: SubjectType.OPTIONAL },
];

const ACADEMIC_YEAR_DEFS = [
  { bsYear: 2080, name: '2080-2081 BS', isCurrent: false },
  { bsYear: 2081, name: '2081-2082 BS', isCurrent: true },
  { bsYear: 2082, name: '2082-2083 BS', isCurrent: false },
];

const TERM_NAMES = ['First Terminal', 'Second Terminal', 'Final'];

const EVENT_TEMPLATES: Array<{ title: string; category: string; isHoliday: boolean }> = [
  { title: 'Annual Sports Day',      category: 'sports',   isHoliday: false },
  { title: 'Dashain Holiday',        category: 'holiday',  isHoliday: true },
  { title: 'Tihar Holiday',          category: 'holiday',  isHoliday: true },
  { title: 'First Terminal Exam',    category: 'exam',     isHoliday: false },
  { title: 'Second Terminal Exam',   category: 'exam',     isHoliday: false },
  { title: 'Final Exam',             category: 'exam',     isHoliday: false },
  { title: 'Cultural Program',       category: 'cultural', isHoliday: false },
  { title: 'Parent-Teacher Meeting', category: 'meeting',  isHoliday: false },
  { title: 'Science Exhibition',     category: 'academic', isHoliday: false },
  { title: 'Republic Day',           category: 'holiday',  isHoliday: true },
  { title: 'Saraswati Puja',         category: 'cultural', isHoliday: true },
  { title: 'Annual Day Celebration', category: 'cultural', isHoliday: false },
];

const FIRST_NAMES = [
  'Aarav','Aasha','Bibek','Binita','Chandra','Deepa',
  'Ganesh','Gita','Hari','Indira','Kiran','Lakshmi',
  'Manish','Nisha','Om','Puja','Ram','Sita',
  'Sunil','Tulsi','Ujwal','Binod','Kabita','Nabin',
  'Pratima','Rajesh','Sabina','Santosh','Uma','Yogesh',
];

const LAST_NAMES = [
  'Adhikari','Basnet','Chhetri','Dahal','Gautam',
  'Gurung','Karki','Koirala','Lamichhane','Magar',
  'Maharjan','Neupane','Pandey','Pokharel','Rai',
  'Sharma','Shrestha','Subedi','Tamang','Thapa',
];

/* ═══════════════════════════════════════════════════════════════════
   CLI Argument Parsing
   ═══════════════════════════════════════════════════════════════════ */

interface CliArgs {
  municipalityCount: number;
  schoolsPerMunicipality: number;
  clean: boolean;
  output: string | null;
}

function parseArgs(): CliArgs {
  const argv = process.argv.slice(2);
  const result: CliArgs = {
    municipalityCount: 3,
    schoolsPerMunicipality: 4,
    clean: false,
    output: null,
  };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--municipalityCount':
        result.municipalityCount = parseInt(argv[++i], 10) || 3;
        break;
      case '--schoolsPerMunicipality':
        result.schoolsPerMunicipality = parseInt(argv[++i], 10) || 4;
        break;
      case '--clean':
        result.clean = true;
        break;
      case '--output':
        result.output = argv[++i] || null;
        break;
    }
  }
  return result;
}

/* ═══════════════════════════════════════════════════════════════════
   Utility Functions
   ═══════════════════════════════════════════════════════════════════ */

function log(msg: string): void {
  console.log(`[SEED ${new Date().toISOString()}] ${msg}`);
}

function logError(msg: string, err?: unknown): void {
  console.error(`[SEED ERROR ${new Date().toISOString()}] ${msg}`);
  if (err instanceof Error) console.error(err.message, err.stack);
  else if (err) console.error(err);
}

/** Deterministic UUID from a seed string (idempotent across runs). */
function deterministicUUID(seedStr: string): string {
  const hex = crypto.createHash('sha256').update(seedStr).digest('hex').substring(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function pad(n: number, w: number): string {
  return String(n).padStart(w, '0');
}

/** Deterministic integer in [min, max] derived from a seed string. */
function seedInt(seed: string, min: number, max: number): number {
  const buf = crypto.createHash('md5').update(seed).digest();
  return min + (buf.readUInt32BE(0) % (max - min + 1));
}

/** Convert a BS date to an AD Date object via nepali-date-converter. */
function bsToAd(year: number, monthIdx0: number, day: number): Date {
  try {
    return new NepaliDate(year, monthIdx0, day).toJsDate();
  } catch {
    // Fallback: some BS day counts vary; try day 1 of the same month
    return new NepaliDate(year, monthIdx0, 1).toJsDate();
  }
}

/** Format a JS Date as YYYY-MM-DD. */
function fmtDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

/** BS date string in DB format (YYYY-MM-DD, 1-indexed month). */
function bsDateStr(year: number, month1: number, day: number): string {
  return `${year}-${pad(month1, 2)}-${pad(day, 2)}`;
}

/** Convert an AD date to a BS date string via nepali-date-converter. */
function adToBsStr(d: Date): string {
  try {
    const nd = new NepaliDate(d);
    return nd.format('YYYY-MM-DD');
  } catch {
    return '2081-02-01';
  }
}

/** NEB grade from a percentage (0-100). */
function calcGrade(pct: number): { grade: NEBGrade; gradePoint: number } {
  if (pct >= 90) return { grade: NEBGrade.A_PLUS, gradePoint: 4.0 };
  if (pct >= 80) return { grade: NEBGrade.A,      gradePoint: 3.6 };
  if (pct >= 70) return { grade: NEBGrade.B_PLUS, gradePoint: 3.2 };
  if (pct >= 60) return { grade: NEBGrade.B,      gradePoint: 2.8 };
  if (pct >= 50) return { grade: NEBGrade.C_PLUS, gradePoint: 2.4 };
  if (pct >= 40) return { grade: NEBGrade.C,      gradePoint: 2.0 };
  if (pct >= 35) return { grade: NEBGrade.D,      gradePoint: 1.6 };
  return { grade: NEBGrade.NG, gradePoint: 0.0 };
}

/** Deterministic attendance status: 80% present, 10% absent, 5% late, 5% excused. */
function attendanceStatusFromSeed(seed: string): AttendanceStatus {
  const v = seedInt(seed, 0, 19);
  if (v < 16) return AttendanceStatus.PRESENT;
  if (v < 18) return AttendanceStatus.ABSENT;
  if (v < 19) return AttendanceStatus.LATE;
  return AttendanceStatus.EXCUSED;
}

function pickFirst(seed: string): string {
  return FIRST_NAMES[seedInt(seed, 0, FIRST_NAMES.length - 1)];
}

function pickLast(seed: string): string {
  return LAST_NAMES[seedInt(seed, 0, LAST_NAMES.length - 1)];
}

/** Generate school days (skip Saturday — Nepal weekly holiday). */
function generateSchoolDays(startAd: Date, count: number): Date[] {
  const result: Date[] = [];
  const d = new Date(startAd);
  while (result.length < count) {
    if (d.getDay() !== 6) result.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return result;
}

/**
 * Set municipality_id and school_config_id on a tenant table via raw SQL.
 * Silently skips if the columns don't exist (migration not yet run).
 */
async function setTenantColumns(
  table: string,
  idCol: string,
  ids: (number | string)[],
  munId: string,
  schId: string,
  tx: Transaction,
): Promise<void> {
  if (ids.length === 0) return;
  try {
    await sequelize.query(
      `UPDATE \`${table}\` SET municipality_id = :munId, school_config_id = :schId WHERE \`${idCol}\` IN (:ids)`,
      { replacements: { munId, schId, ids }, transaction: tx },
    );
  } catch (err: any) {
    if (!err.message?.includes('Unknown column')) throw err;
    // Columns don't exist yet — skip silently
  }
}

/* ═══════════════════════════════════════════════════════════════════
   Clean Mode
   ═══════════════════════════════════════════════════════════════════ */

async function cleanSeedData(): Promise<void> {
  log('\uD83E\uDDF9 Starting clean mode \u2013 removing all SEED-* data \u2026');
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  try {
    // Identify seed municipality UUIDs
    const [munRows] = (await sequelize.query(
      `SELECT id FROM municipalities WHERE code LIKE 'SEED-%'`,
    )) as [Array<{ id: string }>, unknown];
    const munIds = munRows.map((r) => r.id);

    if (munIds.length > 0) {
      // Delete from all tenant tables that gained municipality_id via migration
      const tenantTables = [
        'grades', 'exams', 'attendance', 'class_subjects', 'events',
        'students', 'staff', 'classes', 'terms', 'academic_years',
      ];
      for (const tbl of tenantTables) {
        try {
          await sequelize.query(
            `DELETE FROM \`${tbl}\` WHERE municipality_id IN (:munIds)`,
            { replacements: { munIds } },
          );
          log(`  \u2713 Cleaned ${tbl}`);
        } catch (err: any) {
          if (err.message?.includes('Unknown column')) {
            log(`  \u26A0 ${tbl}: no municipality_id column, trying fallback\u2026`);
          } else {
            throw err;
          }
        }
      }
    }

    // Fallback: delete by identifiable SEED codes regardless of tenant columns
    const fallbackQueries = [
      `DELETE FROM grades WHERE student_id IN (SELECT student_id FROM students WHERE student_code LIKE 'SEED-%')`,
      `DELETE FROM attendance WHERE student_id IN (SELECT student_id FROM students WHERE student_code LIKE 'SEED-%')`,
      `DELETE FROM exams WHERE subject_id IN (SELECT subject_id FROM subjects WHERE code LIKE 'SEED-%')`,
      `DELETE FROM class_subjects WHERE subject_id IN (SELECT subject_id FROM subjects WHERE code LIKE 'SEED-%')`,
      `DELETE FROM events WHERE created_by IN (SELECT user_id FROM users WHERE username LIKE 'seed-%')`,
      `DELETE FROM students WHERE student_code LIKE 'SEED-%'`,
      `DELETE FROM staff WHERE staff_code LIKE 'SEED-%'`,
      `DELETE FROM classes WHERE academic_year_id IN (SELECT academic_year_id FROM academic_years WHERE name LIKE '%BS' AND academic_year_id NOT IN (SELECT DISTINCT academic_year_id FROM classes c2 INNER JOIN students s ON s.current_class_id = c2.class_id WHERE s.student_code NOT LIKE 'SEED-%'))`,
      `DELETE FROM terms WHERE academic_year_id IN (SELECT academic_year_id FROM academic_years WHERE name LIKE '%BS')`,
    ];
    for (const q of fallbackQueries) {
      try { await sequelize.query(q); } catch { /* best effort */ }
    }

    // Core seed-identifiable records
    await sequelize.query(`DELETE FROM users WHERE username LIKE 'seed-%'`);
    log('  \u2713 Cleaned users');
    await sequelize.query(`DELETE FROM subjects WHERE code LIKE 'SEED-%'`);
    log('  \u2713 Cleaned subjects');
    await sequelize.query(`DELETE FROM school_config WHERE school_code LIKE 'SEED-%'`);
    log('  \u2713 Cleaned school_config');
    await sequelize.query(`DELETE FROM municipalities WHERE code LIKE 'SEED-%'`);
    log('  \u2713 Cleaned municipalities');

    log('\u2705 Clean mode completed.');
  } finally {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  }
}

/* ═══════════════════════════════════════════════════════════════════
   Create Shared Subjects (findOrCreate — idempotent)
   ═══════════════════════════════════════════════════════════════════ */

async function ensureSubjects(tx: Transaction): Promise<Subject[]> {
  const subjects: Subject[] = [];
  for (const def of SUBJECT_DEFS) {
    const [subj] = await Subject.findOrCreate({
      where: { code: def.code },
      defaults: {
        code: def.code,
        nameEn: def.nameEn,
        nameNp: def.nameNp,
        type: def.type as any,
        creditHours: 100,
        theoryMarks: 75,
        practicalMarks: 25,
        fullMarks: 100,
        passMarks: 35,
        applicableClasses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      } as any,
      transaction: tx,
    });
    subjects.push(subj);
  }
  return subjects;
}

/* ═══════════════════════════════════════════════════════════════════
   Main Seed
   ═══════════════════════════════════════════════════════════════════ */

async function seed(): Promise<void> {
  const args = parseArgs();

  log('\u2550'.repeat(60));
  log(' Municipality Tenancy Seed Script');
  log(`  Municipalities  : ${args.municipalityCount}`);
  log(`  Schools / mun   : ${args.schoolsPerMunicipality}`);
  log(`  Clean mode      : ${args.clean}`);
  log(`  Output file     : ${args.output || '(none)'}`);
  log('\u2550'.repeat(60));

  await sequelize.authenticate();
  log('\u2705 Database connected.');

  // ── Clean ────────────────────────────────────────────────────
  if (args.clean) {
    await cleanSeedData();
  }

  // ── Guard against duplicate run ──────────────────────────────
  const existing = await Municipality.findOne({
    where: { code: { [Op.like]: 'SEED-%' } },
  });
  if (existing) {
    log('\u26A0\uFE0F  Seed data already exists. Use --clean to reset before re-seeding.');
    await sequelize.close();
    process.exit(1);
  }

  // ── Shared subjects ──────────────────────────────────────────
  const subjTx = await sequelize.transaction();
  let subjects: Subject[];
  try {
    subjects = await ensureSubjects(subjTx);
    await subjTx.commit();
    log(`\u2705 Ensured ${subjects.length} shared subjects.`);
  } catch (err) {
    await subjTx.rollback();
    throw err;
  }

  // ── Manifest ─────────────────────────────────────────────────
  const manifest: any = {
    generatedAt: new Date().toISOString(),
    config: {
      municipalityCount: args.municipalityCount,
      schoolsPerMunicipality: args.schoolsPerMunicipality,
      password: SEED_PASSWORD,
    },
    municipalities: [],
  };

  // ═══════════════════════════════════════════════════════════════
  //  Per-Municipality Loop (one transaction each)
  // ═══════════════════════════════════════════════════════════════

  for (let m = 1; m <= args.municipalityCount; m++) {
    const tx = await sequelize.transaction();
    const mPad = pad(m, 3);
    const munCode = `SEED-MUN-${mPad}`;
    const munId = deterministicUUID(`seed-mun-${m}`);

    try {
      log(`\n\u2500\u2500 Municipality ${m}/${args.municipalityCount}: ${munCode} \u2500\u2500`);

      // ── 1. Municipality ────────────────────────────────────────
      await Municipality.create(
        {
          id: munId,
          nameEn: `Seed Municipality ${m}`,
          nameNp: `\u092C\u0940\u091C \u0928\u0917\u0930\u092A\u093E\u0932\u093F\u0915\u093E ${m}`,
          code: munCode,
          district: `Seed District ${m}`,
          province: `Province ${((m - 1) % 7) + 1}`,
          address: `Ward 1, Seed Municipality ${m}`,
          contactPhone: `+977-01-${pad(4400000 + m, 7)}`,
          contactEmail: `info@seed-mun-${m}.gov.np`,
          isActive: true,
        } as any,
        { transaction: tx },
      );
      log('  \u2713 Municipality');

      // ── 2. Schools (SchoolConfig) ──────────────────────────────
      const schools: SchoolConfig[] = [];
      for (let s = 1; s <= args.schoolsPerMunicipality; s++) {
        const sPad = pad(s, 2);
        const schCode = `SEED-SCH-${mPad}-${sPad}`;
        const schId = deterministicUUID(`seed-sch-${m}-${s}`);
        const school = await SchoolConfig.create(
          {
            id: schId,
            municipalityId: munId,
            schoolNameEn: `Seed School ${m}-${s}`,
            schoolNameNp: `\u092C\u0940\u091C \u0935\u093F\u0926\u094D\u092F\u093E\u0932\u092F ${m}-${s}`,
            schoolCode: schCode,
            addressEn: `Ward ${s}, Seed Municipality ${m}`,
            phone: `+977-01-${pad(5500000 + m * 100 + s, 7)}`,
            email: `info@seed-school-${m}-${s}.edu.np`,
            academicYearStartMonth: 1,
            termsPerYear: 3,
            defaultCalendarSystem: 'BS',
            isActive: true,
          } as any,
          { transaction: tx },
        );
        schools.push(school);
      }
      log(`  \u2713 ${schools.length} schools`);

      // ── 3. Users ───────────────────────────────────────────────
      // bulkCreate with hooks:false (password pre-hashed) and validate:false
      // (usernames contain hyphens which fail isAlphanumeric)
      const allUserRows: any[] = [];

      // Super admin
      allUserRows.push({
        username: `seed-superadmin-mun-${m}`,
        email: `seed-superadmin-mun-${m}@seed.test`,
        password: HASHED_PASSWORD,
        role: UserRole.MUNICIPALITY_ADMIN,
        status: UserStatus.ACTIVE,
        municipalityId: munId,
        schoolConfigId: null,
        failedLoginAttempts: 0,
      });

      // Municipality admins
      for (let i = 1; i <= 2; i++) {
        allUserRows.push({
          username: `seed-munadmin-${m}-${i}`,
          email: `seed-munadmin-${m}-${i}@seed.test`,
          password: HASHED_PASSWORD,
          role: UserRole.MUNICIPALITY_ADMIN,
          status: UserStatus.ACTIVE,
          municipalityId: munId,
          schoolConfigId: null,
          failedLoginAttempts: 0,
        });
      }

      // Per-school: principal + teachers + student accounts
      for (let s = 1; s <= args.schoolsPerMunicipality; s++) {
        const schId = schools[s - 1].id;

        // Principal
        allUserRows.push({
          username: `seed-principal-${m}-${s}`,
          email: `seed-principal-${m}-${s}@seed.test`,
          password: HASHED_PASSWORD,
          role: UserRole.SCHOOL_ADMIN,
          status: UserStatus.ACTIVE,
          municipalityId: munId,
          schoolConfigId: schId,
          failedLoginAttempts: 0,
        });

        // Teachers (first 2 Subject_Teacher, next 2 Class_Teacher)
        for (let t = 1; t <= TEACHERS_PER_SCHOOL; t++) {
          allUserRows.push({
            username: `seed-teacher-${m}-${s}-${t}`,
            email: `seed-teacher-${m}-${s}-${t}@seed.test`,
            password: HASHED_PASSWORD,
            role: t <= 2 ? UserRole.SUBJECT_TEACHER : UserRole.CLASS_TEACHER,
            status: UserStatus.ACTIVE,
            municipalityId: munId,
            schoolConfigId: schId,
            failedLoginAttempts: 0,
          });
        }

        // Student user accounts
        for (let i = 1; i <= STUDENTS_PER_SCHOOL; i++) {
          allUserRows.push({
            username: `seed-student-${m}-${s}-${i}`,
            email: `seed-student-${m}-${s}-${i}@seed.test`,
            password: HASHED_PASSWORD,
            role: UserRole.STUDENT,
            status: UserStatus.ACTIVE,
            municipalityId: munId,
            schoolConfigId: schId,
            failedLoginAttempts: 0,
          });
        }
      }

      const createdUsers = await User.bulkCreate(allUserRows, {
        transaction: tx,
        hooks: false,
        validate: false,
      });
      log(`  \u2713 ${createdUsers.length} users`);

      // ── Build user lookup per school ───────────────────────────
      let uIdx = 0;
      const superAdminUser = createdUsers[uIdx++];
      const munAdminUsers = [createdUsers[uIdx++], createdUsers[uIdx++]];

      interface PerSchoolUsers {
        principal: User;
        teachers: User[];
        studentUsers: User[];
      }
      const perSchoolUsers: PerSchoolUsers[] = [];
      for (let s = 0; s < args.schoolsPerMunicipality; s++) {
        const principal = createdUsers[uIdx++];
        const teachers: User[] = [];
        for (let t = 0; t < TEACHERS_PER_SCHOOL; t++) teachers.push(createdUsers[uIdx++]);
        const studentUsers: User[] = [];
        for (let i = 0; i < STUDENTS_PER_SCHOOL; i++) studentUsers.push(createdUsers[uIdx++]);
        perSchoolUsers.push({ principal, teachers, studentUsers });
      }

      // ── 4. Staff records ───────────────────────────────────────
      const staffRows: any[] = [];
      for (let s = 0; s < args.schoolsPerMunicipality; s++) {
        const sPad = pad(s + 1, 2);
        const su = perSchoolUsers[s];

        // Principal as admin staff
        staffRows.push({
          userId: su.principal.userId,
          staffCode: `SEED-STF-${mPad}-${sPad}-P`,
          firstNameEn: pickFirst(`staff-${m}-${s + 1}-P`),
          lastNameEn: pickLast(`staff-${m}-${s + 1}-P`),
          category: StaffCategory.ADMINISTRATIVE,
          position: 'Principal',
          department: 'Administration',
          employmentType: EmploymentType.FULL_TIME,
          joinDate: fmtDate(bsToAd(2078, 0, 1)),
          email: `seed-principal-${m}-${s + 1}@seed.test`,
          phone: `+977-98${pad(41000000 + m * 1000 + (s + 1) * 100, 8)}`,
          status: StaffStatus.ACTIVE,
        });

        // Teaching staff
        for (let t = 0; t < TEACHERS_PER_SCHOOL; t++) {
          staffRows.push({
            userId: su.teachers[t].userId,
            staffCode: `SEED-STF-${mPad}-${sPad}-T${t + 1}`,
            firstNameEn: pickFirst(`staff-${m}-${s + 1}-T${t + 1}`),
            lastNameEn: pickLast(`staff-${m}-${s + 1}-T${t + 1}`),
            category: StaffCategory.TEACHING,
            position: 'Teacher',
            department: SUBJECT_DEFS[t % SUBJECT_DEFS.length].nameEn,
            employmentType: EmploymentType.FULL_TIME,
            joinDate: fmtDate(bsToAd(2079, 0, 1)),
            email: `seed-teacher-${m}-${s + 1}-${t + 1}@seed.test`,
            phone: `+977-98${pad(42000000 + m * 10000 + (s + 1) * 100 + t + 1, 8)}`,
            status: StaffStatus.ACTIVE,
          });
        }
      }

      const createdStaff = await Staff.bulkCreate(staffRows, {
        transaction: tx,
        hooks: false,
        validate: false,
      });
      log(`  \u2713 ${createdStaff.length} staff`);

      // Staff per-school lookup
      let stIdx = 0;
      interface PerSchoolStaff { principal: Staff; teachers: Staff[] }
      const perSchoolStaff: PerSchoolStaff[] = [];
      for (let s = 0; s < args.schoolsPerMunicipality; s++) {
        const principalStaff = createdStaff[stIdx++];
        const teacherStaff: Staff[] = [];
        for (let t = 0; t < TEACHERS_PER_SCHOOL; t++) teacherStaff.push(createdStaff[stIdx++]);
        perSchoolStaff.push({ principal: principalStaff, teachers: teacherStaff });

        // Set tenant columns for this school's staff
        const ids = [principalStaff.staffId, ...teacherStaff.map((ts) => ts.staffId)];
        await setTenantColumns('staff', 'staff_id', ids, munId, schools[s].id, tx);
      }

      // ── 5. Academic Years, Terms, Classes per school ───────────
      interface SchoolAcademicData {
        academicYears: AcademicYear[];
        currentAY: AcademicYear;
        currentTerms: Term[];
        classes: Class[];
      }
      const schoolAcData: SchoolAcademicData[] = [];

      for (let s = 0; s < args.schoolsPerMunicipality; s++) {
        const schId = schools[s].id;

        // Academic years
        const ayRows = ACADEMIC_YEAR_DEFS.map((def) => {
          const startAd = bsToAd(def.bsYear, 0, 1);
          const endAd = new Date(bsToAd(def.bsYear + 1, 0, 1).getTime() - 86400000);
          return {
            name: def.name,
            startDateBS: bsDateStr(def.bsYear, 1, 1),
            endDateBS: bsDateStr(def.bsYear, 12, 30),
            startDateAD: fmtDate(startAd),
            endDateAD: fmtDate(endAd),
            isCurrent: def.isCurrent,
          };
        });
        const createdAYs = await AcademicYear.bulkCreate(ayRows, {
          transaction: tx, hooks: false, validate: false,
        });
        const ayIds = createdAYs.map((a) => a.academicYearId);
        await setTenantColumns('academic_years', 'academic_year_id', ayIds, munId, schId, tx);

        const currentAY = createdAYs.find((a) => a.isCurrent)!;

        // Terms (3 per AY)
        const termRows: any[] = [];
        for (const ay of createdAYs) {
          const bsYear = parseInt(ay.name.split('-')[0], 10);
          for (let tIdx = 0; tIdx < TERM_NAMES.length; tIdx++) {
            const startMonth0 = tIdx * 4;        // 0, 4, 8
            const endMonth0 = startMonth0 + 3;    // 3, 7, 11
            const tStart = bsToAd(bsYear, startMonth0, 1);
            const nextStart =
              endMonth0 < 11
                ? bsToAd(bsYear, endMonth0 + 1, 1)
                : bsToAd(bsYear + 1, 0, 1);
            const tEnd = new Date(nextStart.getTime() - 86400000);
            termRows.push({
              academicYearId: ay.academicYearId,
              name: TERM_NAMES[tIdx],
              startDate: fmtDate(tStart),
              endDate: fmtDate(tEnd),
            });
          }
        }
        const createdTerms = await Term.bulkCreate(termRows, {
          transaction: tx, hooks: false, validate: false,
        });
        const termIds = createdTerms.map((t) => t.termId);
        await setTenantColumns('terms', 'term_id', termIds, munId, schId, tx);

        const currentTerms = createdTerms.filter(
          (t) => t.academicYearId === currentAY.academicYearId,
        );

        // Classes (current AY only)
        const classRows = GRADES_IN_SCHOOL.map((grade, idx) => ({
          academicYearId: currentAY.academicYearId,
          gradeLevel: grade,
          section: 'A',
          shift: 'morning',
          classTeacherId: perSchoolStaff[s].teachers[idx]?.staffId || null,
          capacity: 40,
          currentStrength: 0,
        }));
        const createdClasses = await Class.bulkCreate(classRows, {
          transaction: tx, hooks: false, validate: false,
        });
        const classIds = createdClasses.map((c) => c.classId);
        await setTenantColumns('classes', 'class_id', classIds, munId, schId, tx);

        schoolAcData.push({
          academicYears: createdAYs,
          currentAY,
          currentTerms,
          classes: createdClasses,
        });
      }
      log('  \u2713 Academic years, terms, classes');

      // ── 6. Students ────────────────────────────────────────────
      const allSchoolStudents: Student[][] = [];
      for (let s = 0; s < args.schoolsPerMunicipality; s++) {
        const schId = schools[s].id;
        const classes = schoolAcData[s].classes;
        const studentUserList = perSchoolUsers[s].studentUsers;

        // Distribute 80 students: 27, 27, 26 across 3 classes
        const dist = [27, 27, 26];
        const studentRows: any[] = [];
        let sIdx2 = 0;

        for (let c = 0; c < classes.length; c++) {
          const cls = classes[c];
          for (let roll = 1; roll <= dist[c]; roll++) {
            sIdx2++;
            const seed = `student-${m}-${s + 1}-${sIdx2}`;
            const fn = pickFirst(seed);
            const ln = pickLast(seed);
            const gender = sIdx2 % 2 === 0 ? Gender.FEMALE : Gender.MALE;

            // DOB: grade 1 ~age 6 (born BS 2075), grade 2 ~age 7, grade 3 ~age 8
            const dobBsYear = 2081 - (cls.gradeLevel + 5);
            const dobMonth = seedInt(seed + '-dob-m', 1, 12);
            const dobDay = seedInt(seed + '-dob-d', 1, 28);
            const dobAd = bsToAd(dobBsYear, dobMonth - 1, dobDay);
            const admissionAd = bsToAd(2081, 0, 1);

            studentRows.push({
              userId: studentUserList[sIdx2 - 1]?.userId || null,
              studentCode: `SEED-STD-${mPad}-${pad(s + 1, 2)}-${pad(sIdx2, 3)}`,
              firstNameEn: fn,
              lastNameEn: ln,
              dateOfBirthBS: bsDateStr(dobBsYear, dobMonth, dobDay),
              dateOfBirthAD: dobAd,
              gender,
              addressEn: `Ward ${seedInt(seed + '-w', 1, 15)}, Seed Municipality ${m}`,
              fatherName: `${pickFirst(seed + '-f')} ${ln}`,
              fatherPhone: `+977-98${pad(seedInt(seed + '-fp', 10000000, 99999999), 8)}`,
              motherName: `${pickFirst(seed + '-m')} ${ln}`,
              motherPhone: `+977-98${pad(seedInt(seed + '-mp', 10000000, 99999999), 8)}`,
              admissionDate: admissionAd,
              admissionClass: cls.gradeLevel,
              currentClassId: cls.classId,
              rollNumber: roll,
              emergencyContact: `+977-98${pad(seedInt(seed + '-ec', 10000000, 99999999), 8)}`,
              email: `seed-student-${m}-${s + 1}-${sIdx2}@seed.test`,
              status: StudentStatus.ACTIVE,
            });
          }
        }

        const createdStudents = await Student.bulkCreate(studentRows, {
          transaction: tx, hooks: false, validate: false,
        });
        const stdIds = createdStudents.map((st) => st.studentId);
        await setTenantColumns('students', 'student_id', stdIds, munId, schId, tx);

        // Update class strengths
        for (let c = 0; c < classes.length; c++) {
          await Class.update(
            { currentStrength: dist[c] },
            { where: { classId: classes[c].classId }, transaction: tx },
          );
        }

        allSchoolStudents.push(createdStudents);
      }
      log(`  \u2713 ${allSchoolStudents.flat().length} students`);

      // ── 7. Class-Subject assignments ───────────────────────────
      for (let s = 0; s < args.schoolsPerMunicipality; s++) {
        const schId = schools[s].id;
        const classes = schoolAcData[s].classes;
        const teachers = perSchoolStaff[s].teachers;

        const csRows: any[] = [];
        for (const cls of classes) {
          for (let si = 0; si < subjects.length; si++) {
            csRows.push({
              classId: cls.classId,
              subjectId: subjects[si].subjectId,
              teacherId: teachers[si % teachers.length].staffId,
            });
          }
        }
        const createdCS = await ClassSubject.bulkCreate(csRows, {
          transaction: tx, hooks: false, validate: false,
        });
        const csIds = createdCS.map((c) => c.classSubjectId);
        await setTenantColumns('class_subjects', 'class_subject_id', csIds, munId, schId, tx);
      }
      log('  \u2713 Class-subject assignments');

      // ── 8. Events (12 per school) ──────────────────────────────
      for (let s = 0; s < args.schoolsPerMunicipality; s++) {
        const schId = schools[s].id;
        const principalUser = perSchoolUsers[s].principal;

        const eventRows = EVENT_TEMPLATES.map((tmpl, idx) => {
          const month0 = Math.floor((idx / EVENT_TEMPLATES.length) * 12) % 12;
          const day = seedInt(`event-${m}-${s + 1}-${idx}`, 1, 25);
          const startAd = bsToAd(2081, month0, Math.min(day, 28));
          return {
            title: `${tmpl.title} - School ${s + 1}`,
            description: `${tmpl.title} for Seed School ${m}-${s + 1}`,
            category: tmpl.category,
            startDate: fmtDate(startAd),
            startDateBS: adToBsStr(startAd),
            targetAudience: 'all',
            isHoliday: tmpl.isHoliday,
            isNepalGovernmentHoliday: tmpl.isHoliday,
            isRecurring: false,
            createdBy: principalUser.userId,
            status: 'scheduled',
          };
        });
        const createdEvents = await SchoolEvent.bulkCreate(eventRows as any[], {
          transaction: tx, hooks: false, validate: false,
        });
        const evIds = createdEvents.map((e) => e.eventId);
        await setTenantColumns('events', 'event_id', evIds, munId, schId, tx);
      }
      log(`  \u2713 ${args.schoolsPerMunicipality * EVENTS_PER_SCHOOL} events`);

      // ── 9. Attendance (960 per municipality) ───────────────────
      const attStartAd = bsToAd(2081, 1, 1); // Jestha 1 — a few weeks into the year
      const attDates = generateSchoolDays(attStartAd, ATTENDANCE_DAYS);

      for (let s = 0; s < args.schoolsPerMunicipality; s++) {
        const schId = schools[s].id;
        const studentsForAtt = allSchoolStudents[s].slice(0, ATTENDANCE_STUDENTS_PER_SCHOOL);
        const firstClass = schoolAcData[s].classes[0];
        const markerUser = perSchoolUsers[s].teachers[0];

        const attRows: any[] = [];
        for (const day of attDates) {
          for (const student of studentsForAtt) {
            const seed = `att-${student.studentId}-${fmtDate(day)}`;
            attRows.push({
              studentId: student.studentId,
              classId: firstClass.classId,
              date: day,
              dateBS: adToBsStr(day),
              status: attendanceStatusFromSeed(seed),
              markedBy: markerUser.userId,
              markedAt: day,
              syncStatus: SyncStatus.SYNCED,
            });
          }
        }
        const createdAtt = await AttendanceRecord.bulkCreate(attRows, {
          transaction: tx, hooks: false, validate: false,
        });
        const attIds = createdAtt.map((a) => a.attendanceId);
        await setTenantColumns('attendance', 'attendance_id', attIds, munId, schId, tx);
      }
      log(`  \u2713 ${args.schoolsPerMunicipality * ATTENDANCE_STUDENTS_PER_SCHOOL * ATTENDANCE_DAYS} attendance records`);

      // ── 10 & 11. Exams + Grades ────────────────────────────────
      let totalExams = 0;
      let totalGrades = 0;

      for (let s = 0; s < args.schoolsPerMunicipality; s++) {
        const schId = schools[s].id;
        const { currentAY, currentTerms, classes } = schoolAcData[s];
        const gradeEntryUser = perSchoolUsers[s].teachers[0];

        for (const cls of classes) {
          // 6 exams per class — one per subject
          const examTypes: ExamType[] = [
            ExamType.FIRST_TERMINAL, ExamType.UNIT_TEST,
            ExamType.SECOND_TERMINAL, ExamType.UNIT_TEST,
            ExamType.FINAL, ExamType.UNIT_TEST,
          ];

          const examRows = subjects.map((subj, idx) => {
            const termIdx = Math.floor(idx / 2) % currentTerms.length;
            const monthOff = idx * 2;
            const examDateAd = bsToAd(2081, monthOff % 12, 15);
            return {
              name: `${subj.nameEn} ${examTypes[idx]} Gr${cls.gradeLevel}`,
              type: examTypes[idx],
              subjectId: subj.subjectId,
              classId: cls.classId,
              academicYearId: currentAY.academicYearId,
              termId: currentTerms[termIdx].termId,
              examDate: examDateAd,
              duration: 120,
              fullMarks: 100,
              passMarks: 35,
              theoryMarks: 75,
              practicalMarks: 25,
              weightage: 100.0,
              isInternal: false,
              status: ExamStatus.COMPLETED,
            };
          });

          const createdExams = await Exam.bulkCreate(examRows, {
            transaction: tx, hooks: false, validate: false,
          });
          totalExams += createdExams.length;
          const examIds = createdExams.map((e) => e.examId);
          await setTenantColumns('exams', 'exam_id', examIds, munId, schId, tx);

          // Grades for every student in this class × every exam
          const classStudents = allSchoolStudents[s].filter(
            (st) => st.currentClassId === cls.classId,
          );

          const gradeRows: any[] = [];
          for (const exam of createdExams) {
            for (const student of classStudents) {
              const seed = `grade-${student.studentId}-${exam.examId}`;
              const theory = seedInt(seed + '-th', 20, 75);
              const practical = seedInt(seed + '-pr', 5, 25);
              const total = theory + practical;
              const { grade, gradePoint } = calcGrade(total);
              gradeRows.push({
                examId: exam.examId,
                studentId: student.studentId,
                theoryMarks: theory,
                practicalMarks: practical,
                totalMarks: total,
                grade,
                gradePoint,
                enteredBy: gradeEntryUser.userId,
                enteredAt: new Date(),
              });
            }
          }

          if (gradeRows.length > 0) {
            const createdGrades = await Grade.bulkCreate(gradeRows, {
              transaction: tx, hooks: false, validate: false,
            });
            totalGrades += createdGrades.length;
            const gradeIds = createdGrades.map((g) => g.gradeId);
            await setTenantColumns('grades', 'grade_id', gradeIds, munId, schId, tx);
          }
        }
      }
      log(`  \u2713 ${totalExams} exams, ${totalGrades} grades`);

      // ── Commit ─────────────────────────────────────────────────
      await tx.commit();
      log(`\u2705 Municipality ${munCode} seeded successfully.`);

      // ── Manifest entry ─────────────────────────────────────────
      manifest.municipalities.push({
        id: munId,
        code: munCode,
        users: {
          superAdmin: {
            userId: superAdminUser.userId,
            username: superAdminUser.username,
          },
          municipalityAdmins: munAdminUsers.map((u) => ({
            userId: u.userId,
            username: u.username,
          })),
        },
        schools: schools.map((sch, s) => ({
          id: sch.id,
          code: sch.schoolCode,
          users: {
            principal: {
              userId: perSchoolUsers[s].principal.userId,
              username: perSchoolUsers[s].principal.username,
            },
            teachers: perSchoolUsers[s].teachers.map((t) => ({
              userId: t.userId,
              username: t.username,
              role: t.role,
            })),
          },
          classes: schoolAcData[s].classes.map((c) => ({
            classId: c.classId,
            grade: c.gradeLevel,
            section: c.section,
          })),
          academicYears: schoolAcData[s].academicYears.map((ay) => ({
            academicYearId: ay.academicYearId,
            name: ay.name,
            isCurrent: ay.isCurrent,
          })),
          studentCount: allSchoolStudents[s].length,
        })),
      });
    } catch (error) {
      try { await tx.rollback(); } catch { /* already rolled back */ }
      logError(`Failed for municipality ${munCode}`, error);
    }
  } // end municipality loop

  // ── Output manifest ──────────────────────────────────────────
  if (args.output) {
    const outPath = path.resolve(args.output);
    fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2), 'utf-8');
    log(`\uD83D\uDCC4 Manifest written to ${outPath}`);
  }

  // ── Summary ──────────────────────────────────────────────────
  log('\n' + '\u2550'.repeat(60));
  log(' Seeding complete.');
  log(` Municipalities created : ${manifest.municipalities.length}`);
  log(` Password for all users : ${SEED_PASSWORD}`);
  log('\u2550'.repeat(60));
}

/* ═══════════════════════════════════════════════════════════════════
   Entry Point
   ═══════════════════════════════════════════════════════════════════ */

seed()
  .then(() => {
    log('Done. Closing database connection.');
    return sequelize.close();
  })
  .then(() => process.exit(0))
  .catch((err) => {
    logError('Fatal error:', err);
    sequelize.close().finally(() => process.exit(1));
  });