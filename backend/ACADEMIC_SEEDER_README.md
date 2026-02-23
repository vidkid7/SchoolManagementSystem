# Academic Module Seeder

This seeder populates the database with comprehensive academic data for testing and development.

## What Gets Seeded

### 1. Academic Years (2 years)
- **2080-2081** (2023-2024 AD) - Previous year
- **2081-2082** (2024-2025 AD) - Current year ✓

### 2. Terms (3 per academic year)
- **First Term**: July - November (Exam: Nov 1-15)
- **Second Term**: November - March (Exam: Mar 1-15)
- **Third Term**: March - July (Exam: Jul 1-15)

### 3. Classes (36 classes)
- **Grades**: 1 through 12
- **Sections**: A, B, C for each grade
- **Capacity**: 40 students per class
- **Total**: 36 classes (12 grades × 3 sections)

### 4. Subjects (20 subjects)

#### Primary Level (Grades 1-5)
- Nepali (नेपाली)
- English (अंग्रेजी)
- Mathematics (गणित)
- Science (विज्ञान)
- Social Studies (सामाजिक अध्ययन)
- Health & Physical Education (स्वास्थ्य तथा शारीरिक शिक्षा)

#### Secondary Level (Grades 6-10)
- Nepali (नेपाली)
- English (अंग्रेजी)
- Mathematics (गणित)
- Science (विज्ञान)
- Social Studies (सामाजिक अध्ययन)
- Computer Science (कम्प्युटर विज्ञान)
- Accountancy (लेखा) - Optional

#### Higher Secondary - Science Stream (Grades 11-12, Section A)
- Physics (भौतिक विज्ञान)
- Chemistry (रसायन विज्ञान)
- Biology (जीवविज्ञान)
- Mathematics (गणित)
- English (अंग्रेजी)
- Nepali (नेपाली)

#### Higher Secondary - Management Stream (Grades 11-12, Section B)
- Accountancy (लेखा)
- Economics (अर्थशास्त्र)
- Business Studies (व्यवसाय अध्ययन)
- Business Mathematics (व्यावसायिक गणित)
- English (अंग्रेजी)
- Nepali (नेपाली)

### 5. Class-Subject Assignments (~200 assignments)
Automatically assigns appropriate subjects to each class based on:
- Grade level (Primary, Secondary, Higher Secondary)
- Stream (Science, Management for grades 11-12)
- Section (A = Science, B = Management for grades 11-12)

### 6. Calendar Events (14 events)

#### Academic Events
- Academic Year Opening Ceremony
- Parent-Teacher Meeting
- First Term Examination
- Second Term Examination
- Annual Examination

#### Sports Events
- Inter-House Sports Competition
- District Level Football Tournament

#### Cultural Events
- Dashain Festival Celebration
- Tihar Festival Celebration
- Annual Cultural Program

#### Holidays (Nepal Government Holidays)
- Dashain Holiday (10 days)
- Tihar Holiday (3 days)
- Maghe Sankranti
- Holi Holiday

### 7. Sample Timetables (2 classes) ✨ NEW
- **Class 1-A**: Complete 5-day timetable with 6 periods per day
- **Class 10-A**: Complete 5-day timetable with 6 periods per day
- Includes subject assignments and room numbers
- Total: 60 periods (2 classes × 5 days × 6 periods)

### 8. Sample Syllabus (3 class-subject combinations) ✨ NEW

#### Class 1-A - Nepali
- 3 topics with progress tracking
- Topics: Alphabet, Basic Words, Reading Practice
- Total: 60 estimated hours, 35 completed

#### Class 10-A - Mathematics
- 5 topics with progress tracking
- Topics: Linear Equations, Quadratic Equations, Geometry, Trigonometry, Statistics
- Total: 80 estimated hours, 25 completed

#### Class 10-A - Science
- 4 topics with progress tracking
- Topics: Motion & Force, Periodic Table, Cell Structure, Electricity
- Total: 60 estimated hours, 32 completed

## How to Run

### Method 1: Using PowerShell Script (Recommended)
```powershell
cd backend
.\seed-academic.ps1
```

### Method 2: Using npm script
```bash
cd backend
npm run seed:academic
```

### Method 3: Direct execution
```bash
cd backend
npx ts-node -r tsconfig-paths/register src/scripts/seed-academic-module.ts
```

## Prerequisites

1. **Database Connection**: Ensure your database is running and `.env` file is configured
2. **Migrations**: Run all migrations first
   ```bash
   npm run migrate:up
   ```
3. **Dependencies**: Install all npm packages
   ```bash
   npm install
   ```

## Expected Output

```
Starting academic module seeding...
Database connection established
Seeding academic years...
Created 2 academic years
Seeding terms...
Created 3 terms
Seeding classes...
Created 36 classes
Seeding subjects...
Created 20 subjects
Assigning subjects to classes...
Created ~200 class-subject assignments
Seeding calendar events...
Created 14 calendar events
Seeding sample timetables...
Created 10 timetables
Created 60 periods
Seeding sample syllabus...
Created sample syllabus with topics

=== Academic Module Seeding Complete ===
Academic Years: 2
Terms: 3
Classes: 36
Subjects: 20
Class-Subject Assignments: ~200
Calendar Events: 14
Timetables: Created for 2 sample classes
Syllabus: Created for 3 class-subject combinations
========================================
```

## Verification

After seeding, verify the data:

### 1. Check Academic Years
```bash
# Navigate to: http://localhost:5173/academic/years
# You should see 2 academic years with 2081-2082 marked as current
```

### 2. Check Classes & Subjects
```bash
# Navigate to: http://localhost:5173/academic
# Classes tab: Should show 36 classes (Grades 1-12, Sections A-C)
# Subjects tab: Should show 20 subjects
```

### 3. Check Calendar Events
```bash
# Navigate to: http://localhost:5173/academic/calendar
# Should show 14 events including exams, holidays, and cultural events
```

### 4. Database Queries
```sql
-- Check academic years
SELECT * FROM academic_years;

-- Check terms
SELECT * FROM terms;

-- Check classes
SELECT * FROM classes WHERE academic_year_id = (SELECT academic_year_id FROM academic_years WHERE is_current = true);

-- Check subjects
SELECT * FROM subjects;

-- Check class-subject assignments
SELECT COUNT(*) FROM class_subjects;

-- Check calendar events
SELECT * FROM events;
```

## Data Structure

### Academic Year Structure
```typescript
{
  name: '2081-2082',
  startDateBS: '2081-04-01',
  endDateBS: '2082-03-32',
  startDateAD: Date,
  endDateAD: Date,
  isCurrent: true
}
```

### Class Structure
```typescript
{
  academicYearId: number,
  gradeLevel: 1-12,
  section: 'A' | 'B' | 'C',
  shift: 'day',
  capacity: 40,
  currentStrength: 0
}
```

### Subject Structure
```typescript
{
  code: 'NEP-101',
  nameEn: 'Nepali',
  nameNp: 'नेपाली',
  type: 'compulsory' | 'optional',
  stream?: 'science' | 'management',
  creditHours: number,
  theoryMarks: number,
  practicalMarks: number,
  passMarks: number
}
```

## Customization

To customize the seeded data, edit `src/scripts/seed-academic-module.ts`:

### Add More Academic Years
```typescript
const academicYears = await AcademicYear.bulkCreate([
  // ... existing years
  {
    name: '2082-2083',
    startDateBS: '2082-04-01',
    endDateBS: '2083-03-32',
    startDateAD: new Date('2025-07-16'),
    endDateAD: new Date('2026-07-15'),
    isCurrent: false,
  },
]);
```

### Add More Subjects
```typescript
const subjects = await Subject.bulkCreate([
  // ... existing subjects
  {
    code: 'ART-101',
    nameEn: 'Art & Craft',
    nameNp: 'कला तथा शिल्प',
    type: 'optional',
    creditHours: 2,
    theoryMarks: 50,
    practicalMarks: 50,
    passMarks: 40,
  },
]);
```

### Add More Events
```typescript
const events = await Event.bulkCreate([
  // ... existing events
  {
    title: 'Science Fair',
    description: 'Annual science exhibition',
    startDate: new Date('2025-04-15'),
    endDate: new Date('2025-04-15'),
    category: 'academic',
    targetAudience: 'students',
    venue: 'School Campus',
    isHoliday: false,
    status: 'scheduled',
    createdBy: 1,
  },
]);
```

## Troubleshooting

### Error: "No current academic year found"
- The seeder creates academic years but if none is marked as current, it will fail
- Solution: Ensure at least one academic year has `isCurrent: true`

### Error: "Foreign key constraint fails"
- Migrations may not be up to date
- Solution: Run `npm run migrate:up` before seeding

### Error: "Duplicate entry"
- Data already exists in database
- Solution: The seeder uses `ignoreDuplicates: true`, so it should skip existing records
- If you want to re-seed, truncate the tables first (be careful!)

### Error: "Cannot find module"
- TypeScript paths not resolved
- Solution: Use `-r tsconfig-paths/register` flag when running ts-node

## Re-seeding

To re-seed the data:

1. **Option 1**: Truncate tables (destructive)
   ```sql
   TRUNCATE TABLE class_subjects;
   TRUNCATE TABLE events;
   TRUNCATE TABLE subjects;
   TRUNCATE TABLE classes;
   TRUNCATE TABLE terms;
   TRUNCATE TABLE academic_years;
   ```

2. **Option 2**: Drop and recreate database
   ```bash
   npm run migrate:down
   npm run migrate:up
   npm run seed:academic
   ```

## Integration with Other Seeders

This seeder works alongside:
- `seed-database.ts` - Main database seeder
- `seed-staff.ts` - Staff data seeder
- `seed-nepal-holidays.ts` - Nepal holidays seeder

Run in order:
```bash
npm run migrate:up
npm run seed              # Main seeder (users, etc.)
npm run seed:staff        # Staff data
npm run seed:academic     # Academic data
npm run seed:holidays     # Holidays
```

## Notes

- All dates are in Nepal timezone
- BS (Bikram Sambat) dates are used alongside AD dates
- Subject codes follow pattern: `[SUBJECT]-[LEVEL]` (e.g., NEP-101, MTH-201)
- Class-subject assignments are automatic based on grade level
- Events include both school events and Nepal government holidays
- The seeder is idempotent - safe to run multiple times

## Support

For issues or questions:
1. Check the logs in `backend/logs/combined.log`
2. Verify database connection in `.env`
3. Ensure all migrations are up to date
4. Check that required tables exist

## License

Part of School Management System - Internal Use Only
