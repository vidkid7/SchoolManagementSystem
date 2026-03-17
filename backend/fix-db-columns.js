/**
 * Railway DB fix script - runs before server startup
 * Adds missing tenant isolation columns and sets up municipality
 */
const { Sequelize } = require('sequelize');

async function fixDatabase() {
  if (!process.env.DATABASE_URL) {
    console.log('No DATABASE_URL, skipping DB fix');
    return;
  }

  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    logging: false
  });

  try {
    await sequelize.authenticate();
    console.log('🔧 Running database fixes...');

    // Fix users table columns
    const [userCols] = await sequelize.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME IN ('password_reset_token', 'password_reset_expires')"
    );
    const existingUserCols = userCols.map(c => c.COLUMN_NAME);
    if (!existingUserCols.includes('password_reset_token')) {
      await sequelize.query('ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255) NULL');
      console.log('  Added password_reset_token to users');
    }
    if (!existingUserCols.includes('password_reset_expires')) {
      await sequelize.query('ALTER TABLE users ADD COLUMN password_reset_expires DATETIME NULL');
      console.log('  Added password_reset_expires to users');
    }

    // Fix tenant isolation columns on all tenant tables
    const tenantTables = [
      'admissions', 'academic_years', 'terms', 'classes', 'subjects', 'class_subjects',
      'students', 'staff', 'staff_assignments', 'staff_documents', 'staff_attendance',
      'attendance', 'leave_applications', 'exams', 'exam_schedules', 'grades',
      'fee_structures', 'fee_components', 'invoices', 'invoice_items', 'payments',
      'installment_plans', 'refunds', 'fee_reminders', 'books', 'circulations',
      'reservations', 'library_fines', 'sports', 'teams', 'tournaments',
      'sports_enrollments', 'sports_achievements', 'ecas', 'eca_events',
      'eca_enrollments', 'eca_achievements', 'events', 'certificates',
      'grading_schemes', 'notification_templates', 'audit_logs', 'archive_metadata',
      'certificate_templates', 'documents', 'document_access_logs', 'timetables',
      'academic_history', 'assignments', 'assignment_submissions', 'lesson_plans',
      'syllabus_progress', 'hostel_rooms', 'hostel_residents', 'hostel_incidents',
      'hostel_visitors'
    ];

    for (const table of tenantTables) {
      try {
        const [existingTables] = await sequelize.query(
          `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${table}'`
        );
        if (existingTables.length === 0) continue;

        const [cols] = await sequelize.query(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${table}' AND COLUMN_NAME IN ('municipality_id', 'school_config_id')`
        );
        const colNames = cols.map(c => c.COLUMN_NAME);
        if (!colNames.includes('municipality_id')) {
          await sequelize.query(`ALTER TABLE \`${table}\` ADD COLUMN municipality_id CHAR(36) NULL`);
          console.log(`  Added municipality_id to ${table}`);
        }
        if (!colNames.includes('school_config_id')) {
          await sequelize.query(`ALTER TABLE \`${table}\` ADD COLUMN school_config_id CHAR(36) NULL`);
          console.log(`  Added school_config_id to ${table}`);
        }
      } catch (tableErr) {
        console.log(`  Warning (${table}): ${tableErr.message}`);
      }
    }

    // Reset account locks
    await sequelize.query(
      'UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL WHERE failed_login_attempts > 0 OR account_locked_until IS NOT NULL'
    );
    console.log('  Reset account locks');

    // Ensure municipalities table exists
    await sequelize.query(`CREATE TABLE IF NOT EXISTS municipalities (
      municipality_id CHAR(36) PRIMARY KEY,
      name_en VARCHAR(255) NOT NULL,
      name_ne VARCHAR(255),
      code VARCHAR(50) NOT NULL UNIQUE,
      province VARCHAR(100),
      district VARCHAR(100),
      type VARCHAR(50),
      total_wards INT DEFAULT 0,
      is_active TINYINT(1) DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL
    )`);

    // Ensure a municipality exists
    const [munis] = await sequelize.query('SELECT municipality_id, code FROM municipalities LIMIT 1');
    let municipalityId = null;

    if (munis.length > 0) {
      municipalityId = munis[0].municipality_id;
      console.log(`  Found municipality: ${munis[0].code}`);
    } else {
      const crypto = require('crypto');
      municipalityId = crypto.randomUUID();
      await sequelize.query(
        `INSERT INTO municipalities (municipality_id, name_en, name_ne, code, province, district, type, total_wards, created_at, updated_at) VALUES ('${municipalityId}', 'Kathmandu Metropolitan City', 'काठमाडौं महानगरपालिका', 'KMC', 'Bagmati', 'Kathmandu', 'Metropolitan', 32, NOW(), NOW())`
      );
      console.log(`  Created municipality KMC (${municipalityId})`);
    }

    // Link municipality admin users
    if (municipalityId) {
      const [updateResult] = await sequelize.query(
        `UPDATE users SET municipality_id = '${municipalityId}' WHERE role = 'Municipality_Admin' AND (municipality_id IS NULL OR municipality_id = '')`
      );
      console.log(`  Municipality admin linkage: ${updateResult.affectedRows || 0} users updated`);
    }

    console.log('✅ Database fixes completed');
  } catch (err) {
    console.log('⚠️ DB fix error:', err.message);
  } finally {
    await sequelize.close();
  }
}

fixDatabase();
