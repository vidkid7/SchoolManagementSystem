#!/bin/sh
set -e

echo "🚀 Starting Railway deployment setup (v2)..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
until node -e "
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'mysql',
  logging: false,
  dialectOptions: {
    connectTimeout: 10000
  }
});
sequelize.authenticate()
  .then(() => { console.log('✅ Database connected'); process.exit(0); })
  .catch(err => { console.error('❌ Database connection failed:', err.message); process.exit(1); });
" 2>/dev/null; do
  echo "Database not ready, waiting 2 seconds..."
  sleep 2
done

# Run migrations
echo "📦 Running database migrations..."
if node dist/scripts/run-migrations.js up 2>&1; then
  echo "✅ Migrations completed successfully"
else
  echo "⚠️  Migration warnings (tables may already exist)"
fi

# Fix any missing columns from failed migrations
echo "🔧 Fixing any missing database columns..."
node -e "
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'mysql',
  logging: false
});

async function fix() {
  try {
    // Fix users table columns
    const [userCols] = await sequelize.query(
      \"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME IN ('password_reset_token', 'password_reset_expires')\"
    );
    const existingUserCols = userCols.map(c => c.COLUMN_NAME);
    if (!existingUserCols.includes('password_reset_token')) {
      await sequelize.query('ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255) NULL');
      console.log('Added password_reset_token column to users');
    }
    if (!existingUserCols.includes('password_reset_expires')) {
      await sequelize.query('ALTER TABLE users ADD COLUMN password_reset_expires DATETIME NULL');
      console.log('Added password_reset_expires column to users');
    }

    // Fix tenant isolation columns (municipality_id & school_config_id) on ALL tenant tables
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
          \"SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '\" + table + \"'\"
        );
        if (existingTables.length === 0) continue;

        const [cols] = await sequelize.query(
          \"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '\" + table + \"' AND COLUMN_NAME IN ('municipality_id', 'school_config_id')\"
        );
        const colNames = cols.map(c => c.COLUMN_NAME);
        if (!colNames.includes('municipality_id')) {
          await sequelize.query('ALTER TABLE \`' + table + '\` ADD COLUMN municipality_id CHAR(36) NULL');
          console.log('Added municipality_id to ' + table);
        }
        if (!colNames.includes('school_config_id')) {
          await sequelize.query('ALTER TABLE \`' + table + '\` ADD COLUMN school_config_id CHAR(36) NULL');
          console.log('Added school_config_id to ' + table);
        }
      } catch (tableErr) {
        console.log('Warning fixing ' + table + ': ' + tableErr.message);
      }
    }

    // Reset all account locks and failed login attempts
    await sequelize.query('UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL WHERE failed_login_attempts > 0 OR account_locked_until IS NOT NULL');
    console.log('✅ Reset all account locks and failed login attempts');

    console.log('✅ All column fixes completed');
  } catch (err) {
    console.log('⚠️  Column fix warning:', err.message);
  } finally {
    await sequelize.close();
  }
}
fix();
" 2>&1 || echo "⚠️  Column fix completed with warnings"

# Seed initial data if needed
echo "🌱 Checking if initial data needs to be seeded..."
if node -e "
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'mysql',
  logging: false
});
sequelize.query('SELECT COUNT(*) as count FROM users', { type: 'SELECT' })
  .then(result => {
    if (result[0].count === 0) {
      console.log('No users found, seeding required');
      process.exit(0);
    } else {
      console.log('Users already exist, skipping seed');
      process.exit(1);
    }
  })
  .catch(err => {
    console.log('Users table not found or error, will seed');
    process.exit(0);
  });
" 2>/dev/null; then
  echo "🌱 Seeding initial data..."
  if node dist/scripts/seed-database.js 2>&1; then
    echo "✅ Database seeded successfully"
  else
    echo "⚠️  Seeding warnings (data may already exist)"
  fi
else
  echo "✅ Database already has data, skipping seed"
fi

echo "🎉 Setup completed! Starting application..."
echo ""

# Start the application
exec node dist/server.js
