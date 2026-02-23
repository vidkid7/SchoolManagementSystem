import sequelize from '../config/database';
import { logger } from '../utils/logger';

/**
 * Simple Leave Applications Seeder
 * Directly inserts leave application data using raw SQL
 */
async function seedLeaves() {
  try {
    logger.info('Starting leave applications seeding...');

    // Check if we have students and users
    const [students]: any = await sequelize.query(
      'SELECT student_id FROM students LIMIT 10'
    );

    const [users]: any = await sequelize.query(
      "SELECT user_id FROM users WHERE role IN ('student', 'parent') LIMIT 5"
    );

    const [admins]: any = await sequelize.query(
      "SELECT user_id FROM users WHERE role IN ('admin', 'teacher') LIMIT 3"
    );

    if (students.length === 0) {
      logger.error('No students found. Please seed students first.');
      process.exit(1);
    }

    if (users.length === 0) {
      logger.error('No users found. Please seed users first.');
      process.exit(1);
    }

    logger.info(`Found ${students.length} students, ${users.length} users, ${admins.length} admins`);

    // Sample data
    const reasons = [
      'Medical appointment with family doctor',
      'Family emergency - need to travel to hometown',
      'Fever and cold - doctor advised rest',
      'Attending family wedding ceremony',
      'Religious festival celebration',
      'Stomach infection - need bed rest',
      'Dental treatment scheduled',
      'Participating in district sports competition',
      'Grandfather health condition - need to visit',
      'Severe headache and body pain'
    ];

    const remarks = [
      'Medical certificate attached',
      'Will complete missed assignments',
      'Parent will collect homework',
      null,
      null
    ];

    // Generate leave applications
    const leaves = [];
    for (let i = 0; i < 30; i++) {
      const student = students[i % students.length];
      const appliedBy = users[i % users.length];
      const approvedBy = admins.length > 0 ? admins[i % admins.length] : null;

      // Random dates
      const daysOffset = Math.floor(Math.random() * 60) - 30; // -30 to +30 days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + daysOffset);

      const duration = Math.floor(Math.random() * 4) + 1; // 1-4 days
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + duration);

      const appliedAt = new Date(startDate);
      appliedAt.setDate(startDate.getDate() - Math.floor(Math.random() * 7) - 1);

      // Determine status
      let status = 'pending';
      let approvedAt = null;
      let rejectionReason = null;

      const rand = Math.random();
      if (daysOffset < -5) {
        // Past leaves - mostly approved
        status = rand > 0.1 ? 'approved' : 'rejected';
        approvedAt = new Date(appliedAt);
        approvedAt.setHours(appliedAt.getHours() + Math.floor(Math.random() * 48));
        if (status === 'rejected') {
          rejectionReason = 'Insufficient notice period provided';
        }
      } else if (daysOffset < 0) {
        // Recent past - mix
        if (rand > 0.6) {
          status = 'approved';
          approvedAt = new Date(appliedAt);
          approvedAt.setHours(appliedAt.getHours() + Math.floor(Math.random() * 24));
        } else if (rand > 0.3) {
          status = 'pending';
        } else {
          status = 'rejected';
          approvedAt = new Date(appliedAt);
          approvedAt.setHours(appliedAt.getHours() + Math.floor(Math.random() * 24));
          rejectionReason = 'Already exceeded leave quota for this month';
        }
      } else {
        // Future - mostly pending
        status = rand > 0.3 ? 'pending' : 'approved';
        if (status === 'approved') {
          approvedAt = new Date(appliedAt);
          approvedAt.setHours(appliedAt.getHours() + Math.floor(Math.random() * 12));
        }
      }

      leaves.push({
        studentId: student.student_id,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        reason: reasons[i % reasons.length],
        appliedBy: appliedBy.user_id,
        appliedAt: appliedAt.toISOString().replace('T', ' ').split('.')[0],
        status,
        approvedBy: (status !== 'pending' && approvedBy) ? approvedBy.user_id : null,
        approvedAt: approvedAt ? approvedAt.toISOString().replace('T', ' ').split('.')[0] : null,
        rejectionReason,
        remarks: remarks[i % remarks.length]
      });
    }

    // Insert leaves one by one
    let successCount = 0;
    for (const leave of leaves) {
      try {
        await sequelize.query(
          `INSERT INTO leave_applications (
            student_id, start_date, end_date, reason, applied_by, applied_at,
            status, approved_by, approved_at, rejection_reason, remarks,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          {
            replacements: [
              leave.studentId,
              leave.startDate,
              leave.endDate,
              leave.reason,
              leave.appliedBy,
              leave.appliedAt,
              leave.status,
              leave.approvedBy,
              leave.approvedAt,
              leave.rejectionReason,
              leave.remarks
            ]
          }
        );
        successCount++;
      } catch (error: any) {
        logger.error(`Failed to insert leave: ${error.message}`);
      }
    }

    logger.info(`Successfully seeded ${successCount} leave applications`);

    // Show summary
    const [summary]: any = await sequelize.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM leave_applications
      GROUP BY status
    `);

    console.log('\nLeave Applications Summary:');
    console.table(summary);

    process.exit(0);
  } catch (error) {
    logger.error('Error seeding leave applications:', error);
    process.exit(1);
  }
}

seedLeaves();
