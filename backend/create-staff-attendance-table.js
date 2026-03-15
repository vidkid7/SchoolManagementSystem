const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'school_management_system',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: console.log,
  }
);

async function createStaffAttendanceTable() {
  try {
    console.log('Creating staff_attendance table...\n');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS staff_attendance (
        staff_attendance_id INT AUTO_INCREMENT PRIMARY KEY,
        staff_id INT NOT NULL,
        date DATE NOT NULL,
        date_bs VARCHAR(20),
        status ENUM('present', 'absent', 'late', 'on_leave', 'half_day') NOT NULL DEFAULT 'present',
        check_in_time TIME,
        check_out_time TIME,
        working_hours DECIMAL(5,2),
        leave_type ENUM('sick', 'casual', 'earned', 'maternity', 'paternity', 'unpaid', 'other'),
        leave_reason TEXT,
        marked_by INT,
        marked_at DATETIME,
        approved_by INT,
        approved_at DATETIME,
        remarks TEXT,
        sync_status ENUM('synced', 'pending', 'failed') DEFAULT 'synced',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME,
        municipality_id VARCHAR(36) NOT NULL,
        school_config_id VARCHAR(36) NOT NULL,
        
        INDEX idx_staff_id (staff_id),
        INDEX idx_date (date),
        INDEX idx_status (status),
        INDEX idx_municipality (municipality_id),
        INDEX idx_school (school_config_id),
        INDEX idx_deleted (deleted_at),
        UNIQUE KEY unique_staff_date (staff_id, date, school_config_id, deleted_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✓ staff_attendance table created successfully\n');

    // Check if we have any staff to seed sample data
    const [staff] = await sequelize.query(`
      SELECT staff_id, municipality_id, school_config_id 
      FROM staff 
      WHERE deleted_at IS NULL 
      LIMIT 5
    `);

    if (staff.length > 0) {
      console.log(`Found ${staff.length} staff members. Creating sample attendance records...\n`);

      // Create sample attendance for the last 7 days
      const dates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }

      let insertedCount = 0;
      for (const staffMember of staff) {
        for (const date of dates) {
          const status = Math.random() > 0.1 ? 'present' : (Math.random() > 0.5 ? 'absent' : 'late');
          const checkInTime = status === 'present' || status === 'late' ? '09:00:00' : null;
          const checkOutTime = status === 'present' ? '17:00:00' : null;
          const workingHours = status === 'present' ? 8 : (status === 'late' ? 7.5 : 0);

          try {
            await sequelize.query(`
              INSERT INTO staff_attendance (
                staff_id, date, status, check_in_time, check_out_time, 
                working_hours, marked_at, municipality_id, school_config_id
              ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)
              ON DUPLICATE KEY UPDATE status = VALUES(status)
            `, {
              replacements: [
                staffMember.staff_id,
                date,
                status,
                checkInTime,
                checkOutTime,
                workingHours,
                staffMember.municipality_id,
                staffMember.school_config_id
              ]
            });
            insertedCount++;
          } catch (err) {
            // Skip duplicates
          }
        }
      }

      console.log(`✓ Created ${insertedCount} sample staff attendance records\n`);
    } else {
      console.log('No staff found. Skipping sample data creation.\n');
    }

    // Verify the table
    const [result] = await sequelize.query(`
      SELECT COUNT(*) as count FROM staff_attendance
    `);

    console.log(`Total staff attendance records: ${result[0].count}\n`);
    console.log('✓ Staff attendance table setup complete!');

  } catch (error) {
    console.error('Error creating staff_attendance table:', error);
  } finally {
    await sequelize.close();
  }
}

createStaffAttendanceTable();
