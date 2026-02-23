# Database Migrations

This directory contains SQL migration scripts for the School Management System database.

## Migration Files

### 001-create-users-table.ts
Creates the users table with authentication fields, roles, and account lockout tracking.

**Features:**
- 13 user roles (School_Admin, Subject_Teacher, Class_Teacher, etc.)
- Password hashing support
- Account lockout mechanism
- Refresh token storage
- Soft delete support (deleted_at column)
- Audit timestamps (created_at, updated_at)
- Indexes on username, email, role, and status

### 002-create-core-tables.ts
Creates core database tables for academic management.

**Tables Created:**
1. **academic_years** - Academic year management with BS/AD calendar support
2. **terms** - Academic terms (First Terminal, Second Terminal, Final)
3. **classes** - Class management with grade level, section, and shift
4. **subjects** - Subject catalog with NEB compliance (credit hours, marks distribution)
5. **students** - Comprehensive student records with bilingual support
6. **staff** - Staff records with qualifications and employment details

**Features:**
- Foreign key constraints for referential integrity
- Soft delete columns (deleted_at) for critical entities
- Audit timestamp columns (created_at, updated_at) on all tables
- Comprehensive indexes for performance:
  - Single column indexes on frequently queried fields
  - Unique constraints on student_code, staff_code, symbol_number, etc.
  - Foreign key indexes for join optimization
- Support for Bikram Sambat (BS) and Anno Domini (AD) calendars
- NEB-compliant subject structure (theory/practical marks, credit hours)
- Bilingual support (English and Nepali) for student names and addresses

### 003-create-attendance-exam-tables.ts
Creates attendance and examination management tables with composite indexes.

**Tables Created:**
1. **attendance** - Student attendance tracking with offline sync support
2. **exams** - Examination management with NEB exam types
3. **grades** - Student grades with NEB grading scale (A+ to NG)

**Features:**
- **Composite index on attendance (student_id, date)** for performance optimization
- **Composite index on exams (class_id, subject_id)** for performance optimization
- Soft delete support on all tables
- Audit timestamps on all tables
- Offline sync status tracking for attendance
- NEB-compliant grading system (A+, A, B+, B, C+, C, D, NG)
- Grade point tracking (0.0 to 4.0 scale)
- Unique constraint to prevent duplicate grades for same student and exam

## Requirements Satisfied

This implementation satisfies the following requirements from the design document:

- **Requirement 40.1**: Unique constraints enforced on student_id, staff_id, email
- **Requirement 40.2**: Foreign key constraints implemented throughout
- **Requirement 40.3**: Soft deletes implemented for critical entities (students, staff, attendance, exams, grades)
- **Requirement 40.8**: NOT NULL constraints enforced on mandatory fields

## Running Migrations

### Apply all migrations:
```bash
npm run migrate:up
```

### Rollback all migrations:
```bash
npm run migrate:down
```

## Database Schema Overview

### Entity Relationships

```
users (authentication)
  ├─> students (user_id FK)
  ├─> staff (user_id FK)
  └─> classes (class_teacher_id FK)

academic_years
  ├─> terms (academic_year_id FK)
  ├─> classes (academic_year_id FK)
  └─> exams (academic_year_id FK)

classes
  ├─> students (current_class_id FK)
  ├─> attendance (class_id FK)
  └─> exams (class_id FK)

subjects
  └─> exams (subject_id FK)

students
  ├─> attendance (student_id FK)
  └─> grades (student_id FK)

exams
  └─> grades (exam_id FK)
```

### Key Indexes for Performance

1. **Composite Indexes:**
   - `idx_attendance_student_date` on attendance(student_id, date)
   - `idx_exams_class_subject` on exams(class_id, subject_id)
   - `idx_grades_exam_student_unique` on grades(exam_id, student_id) - UNIQUE

2. **Foreign Key Indexes:**
   - All foreign key columns have indexes for join optimization

3. **Status Indexes:**
   - Indexes on status columns for filtering active/inactive records

4. **Unique Constraints:**
   - student_code, symbol_number, neb_registration_number
   - staff_code, email
   - subject code
   - username, email (users table)

## Notes

- All tables use InnoDB engine for transaction support and foreign key constraints
- Character set: utf8mb4 with utf8mb4_unicode_ci collation for full Unicode support
- Timezone: +05:45 (Nepal Standard Time)
- All timestamps use MySQL DATETIME type
- Soft deletes use deleted_at column (NULL = not deleted)
- Audit columns (created_at, updated_at) automatically managed by Sequelize
