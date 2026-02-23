import sequelize from '../config/database';
import { initLeaveApplication } from '@models/LeaveApplication.model';
import { LeaveStatus } from '@models/LeaveApplication.model';
import { logger } from '../utils/logger';

/**
 * Seed Leave Applications
 * Creates sample leave application data for testing
 */
async function seedLeaveApplications() {
  try {
    logger.info('Starting leave applications seeding...');

    // Initialize model
    initLeaveApplication(sequelize);

    // Get some students and users from the database
    const [students] = await sequelize.query(`
      SELECT student_id FROM students LIMIT 10
    `);

    const [users] = await sequelize.query(`
      SELECT user_id FROM users WHERE role IN ('admin', 'teacher', 'parent') LIMIT 5
    `);

    if (!students || students.length === 0) {
      logger.error('No students found in database. Please seed students first.');
      return;
    }

    if (!users || users.length === 0) {
      logger.error('No users found in database. Please seed users first.');
      return;
    }

    logger.info(`Found ${students.length} students and ${users.length} users`);

    // Sample leave reasons
    const leaveReasons = [
      'Medical appointment with family doctor',
      'Family emergency - need to travel to hometown',
      'Fever and cold - doctor advised rest',
      'Attending family wedding ceremony',
      'Religious festival celebration',
      'Stomach infection - need bed rest',
      'Dental treatment scheduled',
      'Participating in district sports competition',
      'Grandfather\'s health condition - need to visit',
      'Severe headache and body pain',
      'Eye checkup at hospital',
      'Cultural program participation',
      'Family function in village',
      'Seasonal flu - doctor prescribed rest',
      'Attending cousin\'s marriage',
      'Injury during sports - need physiotherapy',
      'Visiting sick relative in hospital',
      'Traditional ceremony at home',
      'Throat infection - unable to speak',
      'School trip with another institution'
    ];

    const remarks = [
      'Medical certificate attached',
      'Will complete missed assignments',
      'Parent will collect homework',
      'Doctor\'s note provided',
      'Emergency situation',
      null,
      'Prior approval from class teacher',
      'Will attend makeup classes',
      null,
      'Family matter'
    ];

    // Create leave applications with various statuses and dates
    const leaveApplications = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const student = students[Math.floor(Math.random() * students.length)] as any;
      const appliedByUser = users[Math.floor(Math.random() * users.length)] as any;
      const approvedByUser = users[Math.floor(Math.random() * users.length)] as any;

      // Random dates - some past, some future
      const daysOffset = Math.floor(Math.random() * 60) - 30; // -30 to +30 days
      const startDate = new Date(today);
      startDate.setDate(today.getDate() + daysOffset);

      const duration = Math.floor(Math.random() * 5) + 1; // 1-5 days
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + duration - 1);

      // Applied date (before start date)
      const appliedAt = new Date(startDate);
      appliedAt.setDate(startDate.getDate() - Math.floor(Math.random() * 7) - 1);

      // Determine status based on date
      let status: LeaveStatus;
      let approvedBy: number | undefined;
      let approvedAt: Date | undefined;
      let rejectionReason: string | undefined;

      if (daysOffset < -5) {
        // Past leaves - mostly approved
        status = Math.random() > 0.1 ? LeaveStatus.APPROVED : LeaveStatus.REJECTED;
        approvedBy = approvedByUser.user_id;
        approvedAt = new Date(appliedAt);
        approvedAt.setHours(appliedAt.getHours() + Math.floor(Math.random() * 48));
        
        if (status === LeaveStatus.REJECTED) {
          rejectionReason = 'Insufficient notice period provided';
        }
      } else if (daysOffset < 0) {
        // Recent past - mix of statuses
        const rand = Math.random();
        if (rand > 0.6) {
          status = LeaveStatus.APPROVED;
          approvedBy = approvedByUser.user_id;
          approvedAt = new Date(appliedAt);
          approvedAt.setHours(appliedAt.getHours() + Math.floor(Math.random() * 24));
        } else if (rand > 0.3) {
          status = LeaveStatus.PENDING;
        } else {
          status = LeaveStatus.REJECTED;
          approvedBy = approvedByUser.user_id;
          approvedAt = new Date(appliedAt);
          approvedAt.setHours(appliedAt.getHours() + Math.floor(Math.random() * 24));
          rejectionReason = 'Already exceeded leave quota for this month';
        }
      } else {
        // Future leaves - mostly pending
        status = Math.random() > 0.3 ? LeaveStatus.PENDING : LeaveStatus.APPROVED;
        if (status === LeaveStatus.APPROVED) {
          approvedBy = approvedByUser.user_id;
          approvedAt = new Date(appliedAt);
          approvedAt.setHours(appliedAt.getHours() + Math.floor(Math.random() * 12));
        }
      }

      leaveApplications.push({
        student_id: student.student_id,
        start_date: startDate,
        end_date: endDate,
        reason: leaveReasons[Math.floor(Math.random() * leaveReasons.length)],
        applied_by: appliedByUser.user_id,
        applied_at: appliedAt,
        status: status,
        approved_by: approvedBy,
        approved_at: approvedAt,
        rejection_reason: rejectionReason,
        remarks: remarks[Math.floor(Math.random() * remarks.length)]
      });
    }

    // Insert leave applications
    const insertQuery = `
      INSERT INTO leave_applications (
        student_id, start_date, end_date, reason, applied_by, applied_at,
        status, approved_by, approved_at, rejection_reason, remarks,
        created_at, updated_at
      ) VALUES ?
    `;

    const values = leaveApplications.map(leave => [
      leave.student_id,
      leave.start_date,
      leave.end_date,
      leave.reason,
      leave.applied_by,
      leave.applied_at,
      leave.status,
      leave.approved_by || null,
      leave.approved_at || null,
      leave.rejection_reason || null,
      leave.remarks || null,
      new Date(),
      new Date()
    ]);

    // Use raw query for bulk insert
    await sequelize.query(
      insertQuery.replace('?', values.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ')),
      {
        replacements: values.flat()
      }
    );

    logger.info(`Successfully seeded ${leaveApplications.length} leave applications`);

    // Show summary
    const [summary] = await sequelize.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM leave_applications
      GROUP BY status
    `);

    logger.info('Leave applications summary:', summary);

    process.exit(0);
  } catch (error) {
    logger.error('Error seeding leave applications:', error);
    process.exit(1);
  }
}

// Run the seeder
seedLeaveApplications();
