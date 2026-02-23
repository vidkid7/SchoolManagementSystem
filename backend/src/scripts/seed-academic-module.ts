/**
 * Seed Academic Module Data
 * 
 * Seeds:
 * - Academic Years (2080-2081, 2081-2082)
 * - Terms (First Term, Second Term, Third Term)
 * - Classes (1-12 with sections A, B, C)
 * - Subjects (Nepali, English, Math, Science, Social Studies, etc.)
 * - Class-Subject Assignments
 * - Sample Calendar Events
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import sequelize from '../config/database';
import { AcademicYear, Term } from '../models/AcademicYear.model';
import Class from '../models/Class.model';
import { Subject, ClassSubject } from '../models/Subject.model';
// import { initEvent } from '../models/Event.model'; // Commented out - events table not created yet
import { logger } from '../utils/logger';

// Initialize Event model - Commented out until events table is created
// const Event = initEvent(sequelize);

async function seedAcademicModule(): Promise<void> {
  try {
    logger.info('Starting academic module seeding...');

    await sequelize.authenticate();
    logger.info('Database connection established');

    // 1. Seed Academic Years
    logger.info('Seeding academic years...');
    const academicYears = await AcademicYear.bulkCreate([
      {
        name: '2080-2081',
        startDateBS: '2080-04-01',
        endDateBS: '2081-03-32',
        startDateAD: new Date('2023-07-17'),
        endDateAD: new Date('2024-07-15'),
        isCurrent: false,
      },
      {
        name: '2081-2082',
        startDateBS: '2081-04-01',
        endDateBS: '2082-03-32',
        startDateAD: new Date('2024-07-16'),
        endDateAD: new Date('2025-07-15'),
        isCurrent: true,
      },
    ], { ignoreDuplicates: true });

    logger.info(`Created ${academicYears.length} academic years`);

    // Get current academic year
    const currentYear = await AcademicYear.findOne({ where: { isCurrent: true } });
    if (!currentYear) {
      throw new Error('No current academic year found');
    }

    // 2. Seed Terms
    logger.info('Seeding terms...');
    const terms = await Term.bulkCreate([
      {
        academicYearId: currentYear.academicYearId,
        name: 'First Term',
        startDate: new Date('2024-07-16'),
        endDate: new Date('2024-11-15'),
        examStartDate: new Date('2024-11-01'),
        examEndDate: new Date('2024-11-15'),
      },
      {
        academicYearId: currentYear.academicYearId,
        name: 'Second Term',
        startDate: new Date('2024-11-16'),
        endDate: new Date('2025-03-15'),
        examStartDate: new Date('2025-03-01'),
        examEndDate: new Date('2025-03-15'),
      },
      {
        academicYearId: currentYear.academicYearId,
        name: 'Third Term',
        startDate: new Date('2025-03-16'),
        endDate: new Date('2025-07-15'),
        examStartDate: new Date('2025-07-01'),
        examEndDate: new Date('2025-07-15'),
      },
    ], { ignoreDuplicates: true });

    logger.info(`Created ${terms.length} terms`);

    // 3. Seed Classes (Grades 1-12 with sections A, B, C)
    logger.info('Seeding classes...');
    const classesData = [];
    for (let grade = 1; grade <= 12; grade++) {
      for (const section of ['A', 'B', 'C']) {
        classesData.push({
          academicYearId: currentYear.academicYearId,
          gradeLevel: grade,
          section,
          shift: 'day',
          capacity: 40,
          currentStrength: 0,
        });
      }
    }

    const classes = await Class.bulkCreate(classesData, { ignoreDuplicates: true });
    logger.info(`Created ${classes.length} classes`);

    // 4. Seed Subjects
    logger.info('Seeding subjects...');
    const subjects = await Subject.bulkCreate([
      // Primary Level (1-5)
      {
        code: 'NEP-101',
        nameEn: 'Nepali',
        nameNp: 'नेपाली',
        type: 'compulsory',
        creditHours: 6,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 40,
      },
      {
        code: 'ENG-101',
        nameEn: 'English',
        nameNp: 'अंग्रेजी',
        type: 'compulsory',
        creditHours: 6,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 40,
      },
      {
        code: 'MTH-101',
        nameEn: 'Mathematics',
        nameNp: 'गणित',
        type: 'compulsory',
        creditHours: 6,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 40,
      },
      {
        code: 'SCI-101',
        nameEn: 'Science',
        nameNp: 'विज्ञान',
        type: 'compulsory',
        creditHours: 5,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 40,
      },
      {
        code: 'SOC-101',
        nameEn: 'Social Studies',
        nameNp: 'सामाजिक अध्ययन',
        type: 'compulsory',
        creditHours: 4,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 40,
      },
      {
        code: 'HPE-101',
        nameEn: 'Health & Physical Education',
        nameNp: 'स्वास्थ्य तथा शारीरिक शिक्षा',
        type: 'compulsory',
        creditHours: 2,
        theoryMarks: 50,
        practicalMarks: 50,
        passMarks: 40,
      },

      // Secondary Level (6-10)
      {
        code: 'NEP-201',
        nameEn: 'Nepali',
        nameNp: 'नेपाली',
        type: 'compulsory',
        creditHours: 6,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 40,
      },
      {
        code: 'ENG-201',
        nameEn: 'English',
        nameNp: 'अंग्रेजी',
        type: 'compulsory',
        creditHours: 5,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 40,
      },
      {
        code: 'MTH-201',
        nameEn: 'Mathematics',
        nameNp: 'गणित',
        type: 'compulsory',
        creditHours: 6,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 40,
      },
      {
        code: 'SCI-201',
        nameEn: 'Science',
        nameNp: 'विज्ञान',
        type: 'compulsory',
        creditHours: 6,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 40,
      },
      {
        code: 'SOC-201',
        nameEn: 'Social Studies',
        nameNp: 'सामाजिक अध्ययन',
        type: 'compulsory',
        creditHours: 4,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 40,
      },
      {
        code: 'ACC-201',
        nameEn: 'Accountancy',
        nameNp: 'लेखा',
        type: 'optional',
        creditHours: 4,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 40,
      },
      {
        code: 'COM-201',
        nameEn: 'Computer Science',
        nameNp: 'कम्प्युटर विज्ञान',
        type: 'optional',
        creditHours: 4,
        theoryMarks: 50,
        practicalMarks: 50,
        passMarks: 40,
      },

      // Higher Secondary - Science Stream (11-12)
      {
        code: 'PHY-301',
        nameEn: 'Physics',
        nameNp: 'भौतिक विज्ञान',
        type: 'compulsory',
        stream: 'science',
        creditHours: 6,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 40,
      },
      {
        code: 'CHE-301',
        nameEn: 'Chemistry',
        nameNp: 'रसायन विज्ञान',
        type: 'compulsory',
        stream: 'science',
        creditHours: 6,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 40,
      },
      {
        code: 'BIO-301',
        nameEn: 'Biology',
        nameNp: 'जीवविज्ञान',
        type: 'optional',
        stream: 'science',
        creditHours: 6,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 40,
      },
      {
        code: 'MTH-301',
        nameEn: 'Mathematics',
        nameNp: 'गणित',
        type: 'compulsory',
        stream: 'science',
        creditHours: 6,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 40,
      },

      // Higher Secondary - Management Stream (11-12)
      {
        code: 'ACC-401',
        nameEn: 'Accountancy',
        nameNp: 'लेखा',
        type: 'compulsory',
        stream: 'management',
        creditHours: 6,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 40,
      },
      {
        code: 'ECO-401',
        nameEn: 'Economics',
        nameNp: 'अर्थशास्त्र',
        type: 'compulsory',
        stream: 'management',
        creditHours: 5,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 40,
      },
      {
        code: 'BUS-401',
        nameEn: 'Business Studies',
        nameNp: 'व्यवसाय अध्ययन',
        type: 'compulsory',
        stream: 'management',
        creditHours: 5,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 40,
      },
      {
        code: 'MTH-401',
        nameEn: 'Business Mathematics',
        nameNp: 'व्यावसायिक गणित',
        type: 'compulsory',
        stream: 'management',
        creditHours: 5,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 40,
      },
    ], { ignoreDuplicates: true });

    logger.info(`Created ${subjects.length} subjects`);

    // 5. Assign Subjects to Classes
    logger.info('Assigning subjects to classes...');
    const allClasses = await Class.findAll({ where: { academicYearId: currentYear.academicYearId } });
    const allSubjects = await Subject.findAll();

    logger.info(`Found ${allClasses.length} classes and ${allSubjects.length} subjects`);

    const classSubjectAssignments = [];

    for (const cls of allClasses) {
      const gradeLevel = cls.gradeLevel;

      // Primary Level (1-5)
      if (gradeLevel >= 1 && gradeLevel <= 5) {
        const primarySubjects = allSubjects.filter(s => 
          ['NEP-101', 'ENG-101', 'MTH-101', 'SCI-101', 'SOC-101', 'HPE-101'].includes(s.code)
        );
        for (const subject of primarySubjects) {
          classSubjectAssignments.push({
            classId: cls.classId,
            subjectId: subject.subjectId,
          });
        }
      }

      // Secondary Level (6-10)
      if (gradeLevel >= 6 && gradeLevel <= 10) {
        const secondarySubjects = allSubjects.filter(s => 
          ['NEP-201', 'ENG-201', 'MTH-201', 'SCI-201', 'SOC-201', 'COM-201'].includes(s.code)
        );
        for (const subject of secondarySubjects) {
          classSubjectAssignments.push({
            classId: cls.classId,
            subjectId: subject.subjectId,
          });
        }
      }

      // Higher Secondary - Science (11-12)
      if (gradeLevel >= 11 && gradeLevel <= 12 && cls.section === 'A') {
        const scienceSubjects = allSubjects.filter(s => 
          ['PHY-301', 'CHE-301', 'BIO-301', 'MTH-301', 'ENG-201', 'NEP-201'].includes(s.code)
        );
        for (const subject of scienceSubjects) {
          classSubjectAssignments.push({
            classId: cls.classId,
            subjectId: subject.subjectId,
          });
        }
      }

      // Higher Secondary - Management (11-12)
      if (gradeLevel >= 11 && gradeLevel <= 12 && cls.section === 'B') {
        const managementSubjects = allSubjects.filter(s => 
          ['ACC-401', 'ECO-401', 'BUS-401', 'MTH-401', 'ENG-201', 'NEP-201'].includes(s.code)
        );
        for (const subject of managementSubjects) {
          classSubjectAssignments.push({
            classId: cls.classId,
            subjectId: subject.subjectId,
          });
        }
      }
    }

    logger.info(`Prepared ${classSubjectAssignments.length} class-subject assignments to insert`);
    const result = await ClassSubject.bulkCreate(classSubjectAssignments, { ignoreDuplicates: true });
    logger.info(`Created ${result.length} class-subject assignments in database`);

    // 6. Seed Calendar Events - SKIPPED (events table not created yet)
    // Events seeding commented out until events table is created via migrations
    logger.info('Skipped calendar events seeding (events table not created yet)');

    // 7. Seed Sample Timetables - SKIPPED (timetables table not created yet)
    logger.info('Skipped timetable seeding (timetables table not created yet)');

    // 8. Seed Sample Syllabus - SKIPPED (syllabus table not created yet)
    logger.info('Skipped syllabus seeding (syllabus table not created yet)');

    // Summary
    
    // Get sample classes
    const class1A = await Class.findOne({ 
      where: { 
        gradeLevel: 1, 
        section: 'A',
        academicYearId: currentYear.academicYearId 
      } 
    });
    
    const class10A = await Class.findOne({ 
      where: { 
        gradeLevel: 10, 
        section: 'A',
        academicYearId: currentYear.academicYearId 
      } 
    });

    if (class1A && class10A) {
      const { Timetable, Period } = await import('../models/Timetable.model');
      
      // Create timetables for 5 days (Monday to Friday)
      const timetableData = [];
      for (let day = 0; day < 5; day++) {
        // Class 1-A timetable
        timetableData.push({
          classId: class1A.classId,
          academicYearId: currentYear.academicYearId,
          dayOfWeek: day,
        });
        
        // Class 10-A timetable
        timetableData.push({
          classId: class10A.classId,
          academicYearId: currentYear.academicYearId,
          dayOfWeek: day,
        });
      }

      const timetables = await Timetable.bulkCreate(timetableData, { ignoreDuplicates: true });
      logger.info(`Created ${timetables.length} timetables`);

      // Add periods to timetables
      const periodData = [];
      const primarySubjects = allSubjects.filter(s => 
        ['NEP-101', 'ENG-101', 'MTH-101', 'SCI-101', 'SOC-101', 'HPE-101'].includes(s.code)
      );
      const secondarySubjects = allSubjects.filter(s => 
        ['NEP-201', 'ENG-201', 'MTH-201', 'SCI-201', 'SOC-201', 'COM-201'].includes(s.code)
      );

      // Period timings
      const periods = [
        { number: 1, start: '08:00', end: '08:45' },
        { number: 2, start: '08:45', end: '09:30' },
        { number: 3, start: '09:30', end: '10:15' },
        { number: 4, start: '10:30', end: '11:15' },
        { number: 5, start: '11:15', end: '12:00' },
        { number: 6, start: '12:00', end: '12:45' },
      ];

      // Create periods for Class 1-A
      const class1ATimetables = timetables.filter(t => t.classId === class1A.classId);
      for (const tt of class1ATimetables) {
        for (let i = 0; i < periods.length; i++) {
          const period = periods[i];
          const subject = primarySubjects[i % primarySubjects.length];
          
          periodData.push({
            timetableId: tt.timetableId,
            periodNumber: period.number,
            startTime: period.start,
            endTime: period.end,
            subjectId: subject.subjectId,
            roomNumber: `Room ${100 + i}`,
          });
        }
      }

      // Create periods for Class 10-A
      const class10ATimetables = timetables.filter(t => t.classId === class10A.classId);
      for (const tt of class10ATimetables) {
        for (let i = 0; i < periods.length; i++) {
          const period = periods[i];
          const subject = secondarySubjects[i % secondarySubjects.length];
          
          periodData.push({
            timetableId: tt.timetableId,
            periodNumber: period.number,
            startTime: period.start,
            endTime: period.end,
            subjectId: subject.subjectId,
            roomNumber: `Room ${200 + i}`,
          });
        }
      }

      await Period.bulkCreate(periodData, { ignoreDuplicates: true });
      logger.info(`Created ${periodData.length} periods`);
    }

    // 8. Seed Sample Syllabus (for a few class-subject combinations)
    logger.info('Seeding sample syllabus...');
    
    const { Syllabus, SyllabusTopic } = await import('../models/Timetable.model');
    
    // Create syllabus for Class 1-A Nepali
    const class1ANepali = allSubjects.find(s => s.code === 'NEP-101');
    if (class1A && class1ANepali) {
      const syllabus1 = await Syllabus.create({
        subjectId: class1ANepali.subjectId,
        classId: class1A.classId,
        academicYearId: currentYear.academicYearId,
      });

      await SyllabusTopic.bulkCreate([
        {
          syllabusId: syllabus1.syllabusId,
          title: 'Nepali Alphabet (स्वर र व्यञ्जन)',
          description: 'Introduction to Nepali vowels and consonants',
          estimatedHours: 20,
          completedHours: 20,
          orderIndex: 1,
        },
        {
          syllabusId: syllabus1.syllabusId,
          title: 'Basic Words and Sentences',
          description: 'Learning simple Nepali words and sentence formation',
          estimatedHours: 15,
          completedHours: 10,
          orderIndex: 2,
        },
        {
          syllabusId: syllabus1.syllabusId,
          title: 'Reading Practice',
          description: 'Reading simple Nepali stories and poems',
          estimatedHours: 25,
          completedHours: 5,
          orderIndex: 3,
        },
      ], { ignoreDuplicates: true });
    }

    // Create syllabus for Class 10-A Mathematics
    const class10AMath = allSubjects.find(s => s.code === 'MTH-201');
    if (class10A && class10AMath) {
      const syllabus2 = await Syllabus.create({
        subjectId: class10AMath.subjectId,
        classId: class10A.classId,
        academicYearId: currentYear.academicYearId,
      });

      await SyllabusTopic.bulkCreate([
        {
          syllabusId: syllabus2.syllabusId,
          title: 'Algebra - Linear Equations',
          description: 'Solving linear equations in one and two variables',
          estimatedHours: 12,
          completedHours: 12,
          orderIndex: 1,
        },
        {
          syllabusId: syllabus2.syllabusId,
          title: 'Algebra - Quadratic Equations',
          description: 'Understanding and solving quadratic equations',
          estimatedHours: 15,
          completedHours: 8,
          orderIndex: 2,
        },
        {
          syllabusId: syllabus2.syllabusId,
          title: 'Geometry - Triangles',
          description: 'Properties of triangles, congruence, and similarity',
          estimatedHours: 18,
          completedHours: 5,
          orderIndex: 3,
        },
        {
          syllabusId: syllabus2.syllabusId,
          title: 'Trigonometry Basics',
          description: 'Introduction to trigonometric ratios and identities',
          estimatedHours: 20,
          completedHours: 0,
          orderIndex: 4,
        },
        {
          syllabusId: syllabus2.syllabusId,
          title: 'Statistics and Probability',
          description: 'Data analysis, mean, median, mode, and basic probability',
          estimatedHours: 15,
          completedHours: 0,
          orderIndex: 5,
        },
      ], { ignoreDuplicates: true });
    }

    // Create syllabus for Class 10-A Science
    const class10AScience = allSubjects.find(s => s.code === 'SCI-201');
    if (class10A && class10AScience) {
      const syllabus3 = await Syllabus.create({
        subjectId: class10AScience.subjectId,
        classId: class10A.classId,
        academicYearId: currentYear.academicYearId,
      });

      await SyllabusTopic.bulkCreate([
        {
          syllabusId: syllabus3.syllabusId,
          title: 'Physics - Motion and Force',
          description: 'Laws of motion, force, and momentum',
          estimatedHours: 16,
          completedHours: 16,
          orderIndex: 1,
        },
        {
          syllabusId: syllabus3.syllabusId,
          title: 'Chemistry - Periodic Table',
          description: 'Understanding periodic table and chemical properties',
          estimatedHours: 14,
          completedHours: 10,
          orderIndex: 2,
        },
        {
          syllabusId: syllabus3.syllabusId,
          title: 'Biology - Cell Structure',
          description: 'Cell structure, functions, and cell division',
          estimatedHours: 12,
          completedHours: 6,
          orderIndex: 3,
        },
        {
          syllabusId: syllabus3.syllabusId,
          title: 'Physics - Electricity',
          description: `Electric current, circuits, and Ohm's law`,
          estimatedHours: 18,
          completedHours: 0,
          orderIndex: 4,
        },
      ], { ignoreDuplicates: true });
    }

    logger.info('Created sample syllabus with topics');

    // Summary
    logger.info('\n=== Academic Module Seeding Complete ===');
    logger.info(`Academic Years: ${academicYears.length}`);
    logger.info(`Terms: ${terms.length}`);
    logger.info(`Classes: ${classes.length}`);
    logger.info(`Subjects: ${subjects.length}`);
    logger.info(`Class-Subject Assignments: ${classSubjectAssignments.length}`);
    logger.info(`Calendar Events: 0 (skipped - table not created)`);
    logger.info('Timetables: Created for 2 sample classes');
    logger.info('Syllabus: Created for 3 class-subject combinations');
    logger.info('========================================\n');

    process.exit(0);
  } catch (error) {
    logger.error('Error seeding academic module:', error);
    process.exit(1);
  }
}

// Run the seeder
seedAcademicModule();
