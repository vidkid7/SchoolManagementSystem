/**
 * Examination Data Seeder
 * Seeds exams, exam schedules, and grades for demonstration
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import Exam, { ExamType, ExamStatus } from '../models/Exam.model';
import Grade, { NEBGrade } from '../models/Grade.model';
import ExamSchedule from '../models/ExamSchedule.model';
import Student from '../models/Student.model';
import { Subject } from '../models/Subject.model';
import Class from '../models/Class.model';
import { AcademicYear } from '../models/AcademicYear.model';
import { logger } from '../utils/logger';

/**
 * Calculate NEB grade based on percentage
 */
function calculateNEBGrade(percentage: number): { grade: NEBGrade; gradePoint: number } {
  if (percentage >= 90) return { grade: NEBGrade.A_PLUS, gradePoint: 4.0 };
  if (percentage >= 80) return { grade: NEBGrade.A, gradePoint: 3.6 };
  if (percentage >= 70) return { grade: NEBGrade.B_PLUS, gradePoint: 3.2 };
  if (percentage >= 60) return { grade: NEBGrade.B, gradePoint: 2.8 };
  if (percentage >= 50) return { grade: NEBGrade.C_PLUS, gradePoint: 2.4 };
  if (percentage >= 40) return { grade: NEBGrade.C, gradePoint: 2.0 };
  if (percentage >= 35) return { grade: NEBGrade.D, gradePoint: 1.6 };
  return { grade: NEBGrade.NG, gradePoint: 0.0 };
}

/**
 * Generate random marks within a range
 */
function randomMarks(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 2) / 2; // Round to 0.5
}

async function seedExaminations() {
  try {
    logger.info('Starting examination data seeding...');

    // Get existing data
    const classes = await Class.findAll({ limit: 5 });
    const subjects = await Subject.findAll({ limit: 10 });
    const students = await Student.findAll({ limit: 50 });

    if (classes.length === 0 || subjects.length === 0 || students.length === 0) {
      logger.error('Required data not found. Please seed classes, subjects, and students first.');
      return;
    }

    logger.info(`Found ${classes.length} classes, ${subjects.length} subjects, ${students.length} students`);

    // Get current academic year
    const currentYear = await AcademicYear.findOne({ where: { isCurrent: true } });
    
    const academicYearId = currentYear?.academicYearId || 10;
    const termId = 1;
    const teacherId = 10126; // Admin user as teacher

    logger.info(`Using academic year ID: ${academicYearId}, term ID: ${termId}`);

    // Clear existing examination data
    logger.info('Clearing existing examination data...');
    await Grade.destroy({ where: {}, force: true });
    await ExamSchedule.destroy({ where: {}, force: true });
    await Exam.destroy({ where: {}, force: true });

    const examsToCreate = [];
    const examSchedulesToCreate = [];

    // Create exams for each class and subject combination
    let examCounter = 0;
    const examTypes = [
      { type: ExamType.UNIT_TEST, name: 'Unit Test 1', fullMarks: 50, duration: 90, status: ExamStatus.COMPLETED },
      { type: ExamType.FIRST_TERMINAL, name: 'First Terminal Exam', fullMarks: 100, duration: 180, status: ExamStatus.COMPLETED },
      { type: ExamType.UNIT_TEST, name: 'Unit Test 2', fullMarks: 50, duration: 90, status: ExamStatus.ONGOING },
      { type: ExamType.SECOND_TERMINAL, name: 'Second Terminal Exam', fullMarks: 100, duration: 180, status: ExamStatus.SCHEDULED },
      { type: ExamType.PRACTICAL, name: 'Practical Exam', fullMarks: 25, duration: 120, status: ExamStatus.SCHEDULED },
    ];

    for (const cls of classes.slice(0, 3)) { // First 3 classes
      for (const subject of subjects.slice(0, 5)) { // First 5 subjects
        for (const examType of examTypes) {
          examCounter++;
          
          const examDate = new Date();
          examDate.setDate(examDate.getDate() + (examCounter * 2)); // Spread exams over time

          const isPractical = examType.type === ExamType.PRACTICAL;
          const theoryMarks = isPractical ? 0 : (examType.fullMarks === 100 ? 75 : examType.fullMarks);
          const practicalMarks = isPractical ? examType.fullMarks : (examType.fullMarks === 100 ? 25 : 0);

          examsToCreate.push({
            name: `${examType.name} - ${subject.nameEn} - Class ${cls.gradeLevel}${cls.section}`,
            type: examType.type,
            subjectId: subject.subjectId,
            classId: cls.classId,
            academicYearId,
            termId,
            examDate,
            duration: examType.duration,
            fullMarks: examType.fullMarks,
            passMarks: Math.round(examType.fullMarks * 0.35), // 35% pass marks
            theoryMarks,
            practicalMarks,
            weightage: examType.type === ExamType.UNIT_TEST ? 25 : 50,
            isInternal: examType.type === ExamType.UNIT_TEST,
            status: examType.status,
          });

          // Create exam schedule
          const scheduleDate = new Date(examDate);
          const startHour = 10 + (examCounter % 3); // Vary start times
          
          examSchedulesToCreate.push({
            examId: examCounter, // Will be updated after exam creation
            subjectId: subject.subjectId,
            date: scheduleDate,
            startTime: `${startHour.toString().padStart(2, '0')}:00`,
            endTime: `${(startHour + Math.floor(examType.duration / 60)).toString().padStart(2, '0')}:${(examType.duration % 60).toString().padStart(2, '0')}`,
            roomNumber: `Room ${101 + (examCounter % 10)}`,
            invigilators: [teacherId],
          });
        }
      }
    }

    // Bulk create exams
    logger.info(`Creating ${examsToCreate.length} exams...`);
    const createdExams = await Exam.bulkCreate(examsToCreate);
    logger.info(`✓ Created ${createdExams.length} exams`);

    // Update exam IDs in schedules
    examSchedulesToCreate.forEach((schedule, index) => {
      schedule.examId = createdExams[index].examId;
    });

    // Bulk create exam schedules
    logger.info(`Creating ${examSchedulesToCreate.length} exam schedules...`);
    const createdSchedules = await ExamSchedule.bulkCreate(examSchedulesToCreate);
    logger.info(`✓ Created ${createdSchedules.length} exam schedules`);

    // Create grades for completed exams
    const completedExams = createdExams.filter(exam => exam.status === ExamStatus.COMPLETED);
    logger.info(`Creating grades for ${completedExams.length} completed exams...`);

    const gradesToCreate = [];
    for (const exam of completedExams) {
      // Get students in this class
      const classStudents = students.filter(s => s.currentClassId === exam.classId);
      
      for (const student of classStudents) {
        // Generate random marks with realistic distribution
        const percentage = randomMarks(30, 95); // 30% to 95%
        const totalMarks = (exam.fullMarks * percentage) / 100;
        
        let theoryMarks: number | undefined;
        let practicalMarks: number | undefined;

        if (exam.theoryMarks > 0 && exam.practicalMarks > 0) {
          // Both theory and practical
          theoryMarks = (exam.theoryMarks * percentage) / 100;
          practicalMarks = (exam.practicalMarks * percentage) / 100;
        } else if (exam.theoryMarks > 0) {
          // Theory only
          theoryMarks = totalMarks;
        } else if (exam.practicalMarks > 0) {
          // Practical only
          practicalMarks = totalMarks;
        }

        const { grade, gradePoint } = calculateNEBGrade(percentage);

        gradesToCreate.push({
          examId: exam.examId,
          studentId: student.studentId,
          theoryMarks,
          practicalMarks,
          totalMarks: Math.round(totalMarks * 2) / 2, // Round to 0.5
          grade,
          gradePoint,
          remarks: percentage >= 80 ? 'Excellent performance' : percentage >= 60 ? 'Good work' : percentage >= 40 ? 'Satisfactory' : 'Needs improvement',
          enteredBy: teacherId,
          enteredAt: new Date(),
        });
      }
    }

    // Bulk create grades
    if (gradesToCreate.length > 0) {
      logger.info(`Creating ${gradesToCreate.length} grade entries...`);
      const createdGrades = await Grade.bulkCreate(gradesToCreate);
      logger.info(`✓ Created ${createdGrades.length} grade entries`);
    }

    // Summary
    logger.info('═══════════════════════════════════════════════════════');
    logger.info('✅ Examination data seeding completed successfully!');
    logger.info('═══════════════════════════════════════════════════════');
    logger.info(`📝 Exams created: ${createdExams.length}`);
    logger.info(`📅 Exam schedules created: ${createdSchedules.length}`);
    logger.info(`📊 Grade entries created: ${gradesToCreate.length}`);
    logger.info('═══════════════════════════════════════════════════════');

    // Show breakdown by status
    const statusCounts = {
      scheduled: createdExams.filter(e => e.status === ExamStatus.SCHEDULED).length,
      ongoing: createdExams.filter(e => e.status === ExamStatus.ONGOING).length,
      completed: createdExams.filter(e => e.status === ExamStatus.COMPLETED).length,
    };
    logger.info('Exam Status Breakdown:');
    logger.info(`  - Scheduled: ${statusCounts.scheduled}`);
    logger.info(`  - Ongoing: ${statusCounts.ongoing}`);
    logger.info(`  - Completed: ${statusCounts.completed}`);

  } catch (error: any) {
    logger.error('Error seeding examination data:', error);
    throw error;
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedExaminations()
    .then(() => {
      logger.info('Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding failed:', error);
      process.exit(1);
    });
}

export default seedExaminations;
