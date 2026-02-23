/**
 * Seed Script for Reports Data
 * Populates Library, ECA, and Sports data for testing reports
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import sequelize from '../config/database';
import { logger } from '../utils/logger';
import Book from '../models/Book.model';
import { Circulation, initCirculation } from '../models/Circulation.model';
import { LibraryFine, initLibraryFine } from '../models/LibraryFine.model';
import { ECA, initECA } from '../models/ECA.model';
import { ECAEnrollment, initECAEnrollment } from '../models/ECAEnrollment.model';
import { Sport, initSport } from '../models/Sport.model';
import { SportsEnrollment, initSportsEnrollment } from '../models/SportsEnrollment.model';
import Student from '../models/Student.model';

async function seedReportsData(): Promise<void> {
  try {
    logger.info('Starting reports data seeding...');

    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established');

    // Initialize models
    initCirculation(sequelize);
    initLibraryFine(sequelize);
    initECA(sequelize);
    initECAEnrollment(sequelize);
    initSport(sequelize);
    initSportsEnrollment(sequelize);
    logger.info('All models initialized');

    // Get some students for enrollments
    const students = await Student.findAll({ limit: 20 });
    
    if (students.length === 0) {
      logger.warn('No students found in database. Please add students first.');
      process.exit(0);
    }

    logger.info(`Found ${students.length} students for seeding`);

    // Seed Books
    logger.info('Seeding books...');
    const books = await Book.bulkCreate([
      {
        title: 'Introduction to Computer Science',
        author: 'John Smith',
        isbn: '978-0-123456-78-9',
        category: 'Computer Science',
        publisher: 'Tech Publishers',
        publicationYear: 2020,
        availableCopies: 7,
        location: 'Shelf A1',
      },
      {
        title: 'Advanced Mathematics',
        author: 'Jane Doe',
        isbn: '978-0-987654-32-1',
        category: 'Mathematics',
        publisher: 'Academic Press',
        publicationYear: 2019,
        availableCopies: 5,
        location: 'Shelf B2',
      },
      {
        title: 'Physics Fundamentals',
        author: 'Robert Johnson',
        isbn: '978-0-111222-33-4',
        category: 'Physics',
        publisher: 'Science Books',
        publicationYear: 2021,
        availableCopies: 9,
        location: 'Shelf C3',
      },
      {
        title: 'English Literature',
        author: 'Emily Brown',
        isbn: '978-0-444555-66-7',
        category: 'Literature',
        publisher: 'Literary House',
        publicationYear: 2018,
        availableCopies: 12,
        location: 'Shelf D4',
      },
      {
        title: 'Nepali Grammar',
        author: 'Ram Sharma',
        isbn: '978-0-777888-99-0',
        category: 'Language',
        publisher: 'Nepal Publishers',
        publicationYear: 2022,
        availableCopies: 18,
        location: 'Shelf E5',
      },
    ] as any, { ignoreDuplicates: true });

    logger.info(`Seeded ${books.length} books`);

    // Seed Circulations
    logger.info('Seeding circulations...');
    const circulations = [];
    
    // Get the first user ID for issuedBy field
    const firstUserId = students[0].userId || 1;
    
    for (let i = 0; i < Math.min(15, students.length); i++) {
      const student = students[i];
      const book = books[i % books.length];
      const issueDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const isReturned = i % 3 === 0;
      
      circulations.push({
        bookId: book.bookId,
        studentId: student.studentId,
        issueDate: issueDate,
        dueDate: new Date(issueDate.getTime() + 14 * 24 * 60 * 60 * 1000),
        status: isReturned ? 'returned' : (i % 3 === 1 ? 'borrowed' : 'overdue'),
        returnDate: isReturned ? new Date() : null,
        renewalCount: 0,
        maxRenewals: 2,
        issuedBy: firstUserId!,
        returnedBy: isReturned ? firstUserId! : null,
        conditionOnIssue: 'good',
        conditionOnReturn: isReturned ? 'good' : null,
        fine: 0,
        finePaid: false,
      });
    }

    await Circulation.bulkCreate(circulations as any, { ignoreDuplicates: true });
    logger.info(`Seeded ${circulations.length} circulations`);

    // Seed Library Fines
    logger.info('Seeding library fines...');
    const fines = [];
    for (let i = 0; i < Math.min(5, students.length); i++) {
      fines.push({
        studentId: students[i].studentId,
        circulationId: i + 1,
        fineAmount: 50 + Math.floor(Math.random() * 200),
        paidAmount: i % 2 === 0 ? 50 + Math.floor(Math.random() * 200) : 0,
        status: i % 2 === 0 ? 'paid' : 'pending',
        fineReason: 'Late return',
        paidDate: i % 2 === 0 ? new Date() : null,
      });
    }

    await LibraryFine.bulkCreate(fines as any, { ignoreDuplicates: true });
    logger.info(`Seeded ${fines.length} library fines`);

    // Seed ECAs
    logger.info('Seeding ECAs...');
    const ecas = await ECA.bulkCreate([
      {
        name: 'Debate Club',
        description: 'Develop public speaking and critical thinking skills',
        category: 'club',
        incharge: 'Mr. Sharma',
        schedule: 'Every Friday 3-5 PM',
        maxParticipants: 30,
        status: 'active',
      },
      {
        name: 'Science Club',
        description: 'Hands-on science experiments and projects',
        category: 'club',
        incharge: 'Ms. Patel',
        schedule: 'Every Wednesday 4-6 PM',
        maxParticipants: 25,
        status: 'active',
      },
      {
        name: 'Music Band',
        description: 'Learn and perform various musical instruments',
        category: 'cultural',
        incharge: 'Mr. Thapa',
        schedule: 'Every Tuesday and Thursday 3-5 PM',
        maxParticipants: 20,
        status: 'active',
      },
      {
        name: 'Drama Club',
        description: 'Theater and acting workshops',
        category: 'cultural',
        incharge: 'Ms. Gurung',
        schedule: 'Every Monday 4-6 PM',
        maxParticipants: 35,
        status: 'active',
      },
      {
        name: 'Coding Club',
        description: 'Learn programming and software development',
        category: 'club',
        incharge: 'Mr. Rai',
        schedule: 'Every Saturday 10 AM-12 PM',
        maxParticipants: 40,
        status: 'active',
      },
    ] as any, { ignoreDuplicates: true });

    logger.info(`Seeded ${ecas.length} ECAs`);

    // Seed ECA Enrollments
    logger.info('Seeding ECA enrollments...');
    const ecaEnrollments = [];
    for (let i = 0; i < Math.min(20, students.length); i++) {
      const student = students[i];
      const eca = ecas[i % ecas.length];
      
      ecaEnrollments.push({
        ecaId: eca.ecaId,
        studentId: student.studentId,
        enrollmentDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
        status: 'active' as const,
        performanceRating: Math.floor(Math.random() * 5) + 1,
      });
    }

    await ECAEnrollment.bulkCreate(ecaEnrollments as any, { ignoreDuplicates: true });
    logger.info(`Seeded ${ecaEnrollments.length} ECA enrollments`);

    // Seed Sports
    logger.info('Seeding sports...');
    const sports = await Sport.bulkCreate([
      {
        name: 'Football',
        description: 'School football team and training',
        category: 'team',
        coach: 'Coach Kumar',
        schedule: 'Every day 4-6 PM',
        maxParticipants: 25,
        status: 'active',
        venue: 'Main Ground',
      },
      {
        name: 'Basketball',
        description: 'Basketball team and practice sessions',
        category: 'team',
        coach: 'Coach Singh',
        schedule: 'Monday, Wednesday, Friday 3-5 PM',
        maxParticipants: 15,
        status: 'active',
        venue: 'Basketball Court',
      },
      {
        name: 'Cricket',
        description: 'Cricket team training and matches',
        category: 'team',
        coach: 'Coach Adhikari',
        schedule: 'Tuesday, Thursday, Saturday 4-6 PM',
        maxParticipants: 20,
        status: 'active',
        venue: 'Cricket Ground',
      },
      {
        name: 'Table Tennis',
        description: 'Table tennis training and tournaments',
        category: 'individual',
        coach: 'Coach Lama',
        schedule: 'Every day 3-5 PM',
        maxParticipants: 30,
        status: 'active',
        venue: 'Sports Hall',
      },
      {
        name: 'Athletics',
        description: 'Track and field events training',
        category: 'individual',
        coach: 'Coach Tamang',
        schedule: 'Monday to Friday 5-7 AM',
        maxParticipants: 40,
        status: 'active',
        venue: 'Athletic Track',
      },
    ] as any, { ignoreDuplicates: true });

    logger.info(`Seeded ${sports.length} sports`);

    // Seed Sports Enrollments
    logger.info('Seeding sports enrollments...');
    const sportsEnrollments = [];
    for (let i = 0; i < Math.min(20, students.length); i++) {
      const student = students[i];
      const sport = sports[i % sports.length];
      
      sportsEnrollments.push({
        sportId: sport.sportId,
        studentId: student.studentId,
        enrollmentDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
        status: 'active' as const,
        performanceLevel: ['Beginner', 'Intermediate', 'Advanced'][Math.floor(Math.random() * 3)],
        achievements: i % 3 === 0 ? 'Won inter-school competition' : null,
      });
    }

    await SportsEnrollment.bulkCreate(sportsEnrollments as any, { ignoreDuplicates: true });
    logger.info(`Seeded ${sportsEnrollments.length} sports enrollments`);

    logger.info('✅ All reports data seeded successfully!');
    logger.info('Summary:');
    logger.info(`  - Books: ${books.length}`);
    logger.info(`  - Circulations: ${circulations.length}`);
    logger.info(`  - Library Fines: ${fines.length}`);
    logger.info(`  - ECAs: ${ecas.length}`);
    logger.info(`  - ECA Enrollments: ${ecaEnrollments.length}`);
    logger.info(`  - Sports: ${sports.length}`);
    logger.info(`  - Sports Enrollments: ${sportsEnrollments.length}`);

    process.exit(0);
  } catch (error) {
    logger.error('Reports data seeding failed:', error);
    process.exit(1);
  }
}

seedReportsData();
