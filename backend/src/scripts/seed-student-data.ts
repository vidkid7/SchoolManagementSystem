/**
 * Comprehensive Student Data Seeding Script
 * 
 * Seeds all related data for complete Student Management Module testing:
 * - Attendance records
 * - Exam grades
 * - Fee invoices and payments
 * - ECA and Sports participation
 * - Library borrowing records
 * - Student documents
 * - Certificates
 * - Teacher remarks
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize';
import Student, { StudentStatus } from '../models/Student.model';
import { logger } from '../utils/logger';

// Database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'school_management_system',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
  }
);

// Helper functions
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function seedAttendanceRecords(studentId: number) {
  const records = [];
  const startDate = new Date('2024-01-01');
  const endDate = new Date();
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;

  for (let i = 0; i < Math.min(totalDays, 200); i++) {
    const date = addDays(startDate, i);
    const dayOfWeek = date.getDay();
    
    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const rand = Math.random();
    let status = 'present';
    
    if (rand > 0.95) {
      status = 'absent';
      absentCount++;
    } else if (rand > 0.90) {
      status = 'late';
      lateCount++;
    } else {
      presentCount++;
    }

    records.push({
      studentId,
      date: date.toISOString().split('T')[0],
      status,
      period: Math.floor(Math.random() * 7) + 1,
      remarks: status === 'absent' ? randomItem(['Sick', 'Family emergency', 'No reason provided']) : null,
    });
  }

  const percentage = ((presentCount / (presentCount + absentCount + lateCount)) * 100).toFixed(2);

  return {
    records,
    summary: {
      percentage: parseFloat(percentage),
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      total: presentCount + absentCount + lateCount,
    }
  };
}

async function seedGradeRecords(_studentId: number, classGrade: number) {
  const subjects = [
    'English', 'Nepali', 'Mathematics', 'Science', 'Social Studies',
    'Computer Science', 'Health & Physical Education', 'Optional Mathematics'
  ];

  const exams = ['First Terminal', 'Second Terminal', 'Final Exam'];
  const grades = [];
  let totalMarks = 0;
  let obtainedMarks = 0;

  for (const exam of exams) {
    for (const subject of subjects.slice(0, classGrade >= 9 ? 8 : 7)) {
      const fullMarks = 100;
      const obtained = Math.floor(Math.random() * 40) + 50; // 50-90 marks
      const grade = obtained >= 90 ? 'A+' : obtained >= 80 ? 'A' : obtained >= 70 ? 'B+' : obtained >= 60 ? 'B' : obtained >= 50 ? 'C+' : 'C';

      grades.push({
        id: grades.length + 1,
        examName: exam,
        subjectName: subject,
        fullMarks,
        obtainedMarks: obtained,
        grade,
      });

      totalMarks += fullMarks;
      obtainedMarks += obtained;
    }
  }

  const averageMarks = (obtainedMarks / grades.length).toFixed(2);

  return {
    grades,
    summary: {
      totalExams: exams.length,
      averageMarks: parseFloat(averageMarks),
      totalMarks: obtainedMarks,
    }
  };
}

async function seedFeeRecords(_studentId: number) {
  const invoices = [];
  let totalAmount = 0;
  let paidAmount = 0;

  for (let i = 0; i < 6; i++) {
    const amount = 5000 + Math.floor(Math.random() * 3000); // 5000-8000
    const dueDate = addDays(new Date('2024-01-01'), i * 30);
    const isPaid = Math.random() > 0.2; // 80% paid
    const status = isPaid ? 'paid' : (new Date() > dueDate ? 'overdue' : 'pending');

    invoices.push({
      id: i + 1,
      invoiceNumber: `INV-2081-${String(i + 1).padStart(4, '0')}`,
      amount,
      dueDate: dueDate.toISOString().split('T')[0],
      status,
    });

    totalAmount += amount;
    if (isPaid) paidAmount += amount;
  }

  return {
    invoices,
    summary: {
      totalAmount,
      paidAmount,
      pendingAmount: totalAmount - paidAmount,
    }
  };
}

async function seedECARecords(_studentId: number) {
  const ecaActivities = ['Debate Club', 'Drama Club', 'Music Club', 'Art Club', 'Science Club', 'Literary Club'];
  const sportsActivities = ['Football', 'Basketball', 'Cricket', 'Volleyball', 'Badminton', 'Table Tennis'];
  
  const ecaCount = Math.floor(Math.random() * 3) + 1; // 1-3 ECAs
  const sportsCount = Math.floor(Math.random() * 2) + 1; // 1-2 Sports

  const eca = [];
  const sports = [];
  const achievements = [];

  // ECA Participation
  for (let i = 0; i < ecaCount; i++) {
    const activity = randomItem(ecaActivities);
    eca.push({
      id: i + 1,
      activityName: activity,
      position: Math.random() > 0.7 ? randomItem(['President', 'Vice President', 'Secretary', 'Member']) : 'Member',
      achievement: Math.random() > 0.6 ? randomItem(['First Prize', 'Second Prize', 'Participation']) : null,
    });

    if (Math.random() > 0.5) {
      achievements.push({
        id: achievements.length + 1,
        title: `${activity} Competition`,
        type: 'ECA',
        level: randomItem(['School', 'District', 'National']),
        position: randomItem(['First', 'Second', 'Third', 'Participation']),
        date: randomDate(new Date('2023-01-01'), new Date()).toISOString().split('T')[0],
      });
    }
  }

  // Sports Participation
  for (let i = 0; i < sportsCount; i++) {
    const sport = randomItem(sportsActivities);
    sports.push({
      id: i + 1,
      activityName: sport,
      position: Math.random() > 0.8 ? randomItem(['Captain', 'Vice Captain', 'Player']) : 'Player',
      achievement: Math.random() > 0.6 ? randomItem(['Gold Medal', 'Silver Medal', 'Bronze Medal']) : null,
    });

    if (Math.random() > 0.5) {
      achievements.push({
        id: achievements.length + 1,
        title: `${sport} Tournament`,
        type: 'Sports',
        level: randomItem(['School', 'District', 'National']),
        position: randomItem(['First', 'Second', 'Third']),
        medal: randomItem(['Gold', 'Silver', 'Bronze']),
        date: randomDate(new Date('2023-01-01'), new Date()).toISOString().split('T')[0],
      });
    }
  }

  return {
    eca,
    sports,
    summary: {
      totalECAs: eca.length,
      totalSports: sports.length,
      totalAchievements: achievements.length,
      highLevelAchievements: achievements.filter(a => a.level === 'National').length,
    }
  };
}

async function seedLibraryRecords(_studentId: number) {
  const books = [
    { title: 'Introduction to Computer Science', code: 'CS-101', author: 'John Doe' },
    { title: 'Advanced Mathematics', code: 'MATH-201', author: 'Jane Smith' },
    { title: 'Physics Fundamentals', code: 'PHY-101', author: 'Robert Johnson' },
    { title: 'English Literature', code: 'ENG-301', author: 'Emily Brown' },
    { title: 'Nepali Grammar', code: 'NEP-101', author: 'Ram Sharma' },
    { title: 'World History', code: 'HIST-201', author: 'David Wilson' },
  ];

  const records = [];
  const borrowCount = Math.floor(Math.random() * 10) + 5; // 5-15 books
  let returnedCount = 0;
  let overdueCount = 0;
  let totalFines = 0;

  for (let i = 0; i < borrowCount; i++) {
    const book = randomItem(books);
    const borrowDate = randomDate(new Date('2023-06-01'), new Date());
    const dueDate = addDays(borrowDate, 14); // 2 weeks borrowing period
    const isReturned = Math.random() > 0.3; // 70% returned
    const returnDate = isReturned ? randomDate(borrowDate, addDays(dueDate, 10)) : null;
    
    let status = 'borrowed';
    let fine = 0;

    if (isReturned) {
      status = 'returned';
      returnedCount++;
      // Calculate fine if returned late
      if (returnDate && returnDate > dueDate) {
        const daysLate = Math.floor((returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        fine = daysLate * 5; // Rs. 5 per day
        totalFines += fine;
      }
    } else if (new Date() > dueDate) {
      status = 'overdue';
      overdueCount++;
      const daysLate = Math.floor((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      fine = daysLate * 5;
      totalFines += fine;
    }

    records.push({
      id: i + 1,
      bookTitle: book.title,
      bookCode: book.code,
      author: book.author,
      borrowDate: borrowDate.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      returnDate: returnDate ? returnDate.toISOString().split('T')[0] : null,
      status,
      fine: fine > 0 ? fine : null,
    });
  }

  return {
    records,
    stats: {
      totalBorrowed: borrowCount,
      currentlyBorrowed: borrowCount - returnedCount,
      returned: returnedCount,
      overdue: overdueCount,
      totalFines,
    }
  };
}

async function seedCertificates(_studentId: number) {
  const certificateTypes = [
    'Character Certificate',
    'Transfer Certificate',
    'Migration Certificate',
    'Provisional Certificate',
    'Completion Certificate',
  ];

  const certificates = [];
  const count = Math.floor(Math.random() * 3) + 1; // 1-3 certificates

  for (let i = 0; i < count; i++) {
    certificates.push({
      id: i + 1,
      certificateNumber: `CERT-2081-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
      type: randomItem(certificateTypes),
      issuedDate: randomDate(new Date('2023-01-01'), new Date()).toISOString().split('T')[0],
      status: 'active',
    });
  }

  return {
    certificates,
    summary: {
      totalCount: certificates.length,
    }
  };
}

async function seedRemarks(_studentId: number) {
  const goodRemarks = [
    'Excellent performance in class',
    'Very attentive and participative',
    'Shows great leadership qualities',
    'Consistently submits homework on time',
    'Helpful to classmates',
  ];

  const badRemarks = [
    'Needs to improve attendance',
    'Should focus more in class',
    'Homework submission is irregular',
    'Needs to participate more',
    'Should improve behavior',
  ];

  const remarks = [];
  const goodCount = Math.floor(Math.random() * 5) + 3; // 3-7 good remarks
  const badCount = Math.floor(Math.random() * 2); // 0-1 bad remarks

  for (let i = 0; i < goodCount; i++) {
    remarks.push({
      id: remarks.length + 1,
      type: 'good',
      remark: randomItem(goodRemarks),
      teacherName: randomItem(['Mr. Sharma', 'Mrs. Poudel', 'Mr. Thapa', 'Mrs. Shrestha']),
      date: randomDate(new Date('2023-06-01'), new Date()).toISOString().split('T')[0],
      subject: randomItem(['English', 'Mathematics', 'Science', 'Social Studies']),
    });
  }

  for (let i = 0; i < badCount; i++) {
    remarks.push({
      id: remarks.length + 1,
      type: 'bad',
      remark: randomItem(badRemarks),
      teacherName: randomItem(['Mr. Sharma', 'Mrs. Poudel', 'Mr. Thapa', 'Mrs. Shrestha']),
      date: randomDate(new Date('2023-06-01'), new Date()).toISOString().split('T')[0],
      subject: randomItem(['English', 'Mathematics', 'Science', 'Social Studies']),
    });
  }

  return {
    remarks,
    summary: {
      goodRemarks: goodCount,
      badRemarks: badCount,
    }
  };
}

async function seedAllStudentData() {
  try {
    logger.info('Starting comprehensive student data seeding...');

    await sequelize.authenticate();
    logger.info('Database connection established');

    // Get all active students
    const students = await Student.findAll({
      where: { status: StudentStatus.ACTIVE },
      limit: 20, // Seed data for first 20 students
    });

    if (students.length === 0) {
      logger.error('No students found. Please run seed-student-module.ts first');
      return;
    }

    logger.info(`Found ${students.length} students. Generating comprehensive data...`);

    const allData: any = {};

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const studentId = student.studentId;
      const classGrade = 10; // Default grade for testing

      logger.info(`\nProcessing student ${i + 1}/${students.length}: ${student.firstNameEn} ${student.lastNameEn}`);

      // Generate all data
      const attendance = await seedAttendanceRecords(studentId);
      const grades = await seedGradeRecords(studentId, classGrade);
      const fees = await seedFeeRecords(studentId);
      const eca = await seedECARecords(studentId);
      const library = await seedLibraryRecords(studentId);
      const certificates = await seedCertificates(studentId);
      const remarks = await seedRemarks(studentId);

      allData[studentId] = {
        studentId,
        studentName: `${student.firstNameEn} ${student.lastNameEn}`,
        attendance,
        grades,
        fees,
        eca,
        library,
        certificates,
        remarks,
      };

      logger.info(`  ✅ Attendance: ${attendance.summary.present} present, ${attendance.summary.absent} absent`);
      logger.info(`  ✅ Grades: ${grades.summary.totalExams} exams, avg ${grades.summary.averageMarks}`);
      logger.info(`  ✅ Fees: Rs. ${fees.summary.paidAmount}/${fees.summary.totalAmount} paid`);
      logger.info(`  ✅ ECA: ${eca.summary.totalECAs} activities, ${eca.summary.totalAchievements} achievements`);
      logger.info(`  ✅ Library: ${library.stats.totalBorrowed} books borrowed`);
      logger.info(`  ✅ Certificates: ${certificates.summary.totalCount} certificates`);
      logger.info(`  ✅ Remarks: ${remarks.summary.goodRemarks} good, ${remarks.summary.badRemarks} needs improvement`);
    }

    // Save to JSON file for API mock responses
    const fs = require('fs');
    const path = require('path');
    const dataDir = path.join(__dirname, '../data');
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(dataDir, 'student-mock-data.json'),
      JSON.stringify(allData, null, 2)
    );

    logger.info('\n✅ Successfully generated comprehensive data for all students');
    logger.info(`📁 Mock data saved to: backend/src/data/student-mock-data.json`);
    logger.info('\n📝 You can now test all Student Management features!');

  } catch (error) {
    logger.error('Error seeding student data:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the seeding
if (require.main === module) {
  seedAllStudentData()
    .then(() => {
      logger.info('Student data seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Student data seeding failed:', error);
      process.exit(1);
    });
}

export default seedAllStudentData;
