/**
 * Railway DB fix script - runs before server startup
 * Adds missing tenant isolation columns and sets up municipality
 */
const { Sequelize } = require('sequelize');

async function fixDatabase() {
  let sequelize;
  
  if (process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'mysql',
      logging: false
    });
  } else if (process.env.DB_HOST && process.env.DB_NAME) {
    sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false
      }
    );
  } else {
    console.log('No database configuration found, skipping DB fix');
    return;
  }

  try {
    await sequelize.authenticate();
    console.log('🔧 Running database fixes...');

    // Fix users table columns
    console.log('  Checking users table columns...');
    const [userCols] = await sequelize.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME IN ('password_reset_token', 'password_reset_expires', 'municipality_id', 'school_config_id')"
    );
    const existingUserCols = userCols.map(c => c.COLUMN_NAME);
    console.log('  Existing user columns:', existingUserCols);
    
    if (!existingUserCols.includes('password_reset_token')) {
      await sequelize.query('ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255) NULL');
      console.log('  Added password_reset_token to users');
    }
    if (!existingUserCols.includes('password_reset_expires')) {
      await sequelize.query('ALTER TABLE users ADD COLUMN password_reset_expires DATETIME NULL');
      console.log('  Added password_reset_expires to users');
    }
    if (!existingUserCols.includes('municipality_id')) {
      await sequelize.query('ALTER TABLE users ADD COLUMN municipality_id CHAR(36) NULL');
      console.log('  Added municipality_id to users');
    }
    if (!existingUserCols.includes('school_config_id')) {
      await sequelize.query('ALTER TABLE users ADD COLUMN school_config_id CHAR(36) NULL');
      console.log('  Added school_config_id to users');
    }

    // Fix tenant isolation columns on all tenant tables
    console.log('  Processing tenant tables...');
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
    console.log('  Tenant tables processing complete');

    // Reset account locks (only if columns exist)
    console.log('  Checking for account lock columns...');
    const [lockCols] = await sequelize.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME IN ('failed_login_attempts', 'account_locked_until')"
    );
    console.log('  Lock columns found:', lockCols.map(c => c.COLUMN_NAME));
    if (lockCols.length > 0) {
      console.log('  Resetting account locks...');
      await sequelize.query(
        'UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL WHERE failed_login_attempts > 0 OR account_locked_until IS NOT NULL'
      );
      console.log('  Reset account locks');
    }

    // Ensure municipalities table exists
    console.log('  Checking municipalities table...');
    
    // Check if municipalities table exists
    const [existingMuniTable] = await sequelize.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'municipalities'"
    );
    
    if (existingMuniTable.length === 0) {
      // Create table if it doesn't exist
      await sequelize.query(`CREATE TABLE municipalities (
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
      console.log('  Created municipalities table');
    } else {
      // Check and add missing columns if table exists
      const [muniCols] = await sequelize.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'municipalities'"
      );
      const muniColNames = muniCols.map(c => c.COLUMN_NAME);
      
      if (!muniColNames.includes('municipality_id')) {
        // Check if there's already a primary key
        const [pkInfo] = await sequelize.query(
          "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'municipalities' AND CONSTRAINT_NAME = 'PRIMARY'"
        );
        
        if (pkInfo.length === 0) {
          // No primary key, add municipality_id as primary key
          await sequelize.query('ALTER TABLE municipalities ADD COLUMN municipality_id CHAR(36) PRIMARY KEY FIRST');
          console.log('  Added municipality_id as primary key to municipalities');
        } else {
          // Primary key exists, just add as regular column
          await sequelize.query('ALTER TABLE municipalities ADD COLUMN municipality_id CHAR(36) NULL FIRST');
          console.log('  Added municipality_id to municipalities');
        }
      }
      if (!muniColNames.includes('name_en')) {
        await sequelize.query('ALTER TABLE municipalities ADD COLUMN name_en VARCHAR(255) NULL');
        console.log('  Added name_en to municipalities');
      }
      if (!muniColNames.includes('name_ne')) {
        await sequelize.query('ALTER TABLE municipalities ADD COLUMN name_ne VARCHAR(255) NULL');
        console.log('  Added name_ne to municipalities');
      }
      if (!muniColNames.includes('code')) {
        await sequelize.query('ALTER TABLE municipalities ADD COLUMN code VARCHAR(50) NULL');
        console.log('  Added code to municipalities');
      }
      if (!muniColNames.includes('province')) {
        await sequelize.query('ALTER TABLE municipalities ADD COLUMN province VARCHAR(100) NULL');
        console.log('  Added province to municipalities');
      }
      if (!muniColNames.includes('district')) {
        await sequelize.query('ALTER TABLE municipalities ADD COLUMN district VARCHAR(100) NULL');
        console.log('  Added district to municipalities');
      }
      if (!muniColNames.includes('type')) {
        await sequelize.query('ALTER TABLE municipalities ADD COLUMN type VARCHAR(50) NULL');
        console.log('  Added type to municipalities');
      }
      if (!muniColNames.includes('total_wards')) {
        await sequelize.query('ALTER TABLE municipalities ADD COLUMN total_wards INT DEFAULT 0');
        console.log('  Added total_wards to municipalities');
      }
    }

    // Ensure a municipality exists
    console.log('  Checking for existing municipalities...');
    
    // First check what columns actually exist
    const [finalMuniCols] = await sequelize.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'municipalities'"
    );
    const finalColNames = finalMuniCols.map(c => c.COLUMN_NAME);
    console.log('  Available municipality columns:', finalColNames);
    
    const [munis] = await sequelize.query('SELECT * FROM municipalities WHERE municipality_id IS NOT NULL LIMIT 1');
    let municipalityId = null;

    if (munis.length > 0) {
      municipalityId = munis[0].municipality_id;
      console.log(`  Found municipality: ${munis[0].code || munis[0].municipality_id}`);
    } else {
      console.log('  Creating default municipality...');
      const crypto = require('crypto');
      municipalityId = crypto.randomUUID();
      
      try {
        // Build INSERT based on available columns
        let insertCols = ['municipality_id'];
        let insertVals = [`'${municipalityId}'`];
        
        if (finalColNames.includes('id')) {
          insertCols.push('id');
          insertVals.push('1');
        }
        if (finalColNames.includes('name_en')) {
          insertCols.push('name_en');
          insertVals.push("'Kathmandu Metropolitan City'");
        }
        if (finalColNames.includes('name_ne')) {
          insertCols.push('name_ne');
          insertVals.push("'काठमाडौं महानगरपालिका'");
        }
        if (finalColNames.includes('code')) {
          insertCols.push('code');
          insertVals.push("'KMC'");
        }
        if (finalColNames.includes('province')) {
          insertCols.push('province');
          insertVals.push("'Bagmati'");
        }
        if (finalColNames.includes('district')) {
          insertCols.push('district');
          insertVals.push("'Kathmandu'");
        }
        if (finalColNames.includes('type')) {
          insertCols.push('type');
          insertVals.push("'Metropolitan'");
        }
        if (finalColNames.includes('total_wards')) {
          insertCols.push('total_wards');
          insertVals.push('32');
        }
        if (finalColNames.includes('created_at')) {
          insertCols.push('created_at');
          insertVals.push('NOW()');
        }
        if (finalColNames.includes('updated_at')) {
          insertCols.push('updated_at');
          insertVals.push('NOW()');
        }
        
        await sequelize.query(
          `INSERT INTO municipalities (${insertCols.join(', ')}) VALUES (${insertVals.join(', ')})`
        );
        console.log(`  Created municipality KMC (${municipalityId})`);
      } catch (insertErr) {
        console.log(`  Warning: Could not create municipality: ${insertErr.message}`);
      }
    }

    // Link municipality admin users
    if (municipalityId) {
      try {
        // Verify municipality_id column exists in users table before updating
        const [muniCol] = await sequelize.query(
          "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'municipality_id'"
        );
        
        if (muniCol.length > 0) {
          const [updateResult] = await sequelize.query(
            `UPDATE users SET municipality_id = '${municipalityId}' WHERE role = 'Municipality_Admin' AND (municipality_id IS NULL OR municipality_id = '')`
          );
          console.log(`  Municipality admin linkage: ${updateResult.affectedRows || 0} users updated`);
        } else {
          console.log('  Skipping municipality admin linkage (municipality_id column not found)');
        }
      } catch (linkErr) {
        console.log(`  Warning: Could not link municipality admins: ${linkErr.message}`);
      }
    }

    console.log('✅ Database fixes completed');
  } catch (err) {
    console.log('⚠️ DB fix error:', err.message);
  } finally {
    await sequelize.close();
  }
}

fixDatabase();
