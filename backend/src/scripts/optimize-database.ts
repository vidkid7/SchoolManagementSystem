import { sequelize } from '@config/database';
import { logger } from '@utils/logger';

interface IndexDef {
  table: string;
  name: string;
  columns: string[];
  unique?: boolean;
}

const REQUIRED_INDEXES: IndexDef[] = [
  { table: 'students', name: 'idx_students_class_section', columns: ['class_id', 'section'] },
  { table: 'students', name: 'idx_students_admission_date', columns: ['admission_date'] },
  { table: 'students', name: 'idx_students_status', columns: ['status'] },
  { table: 'attendance_records', name: 'idx_attendance_date_class', columns: ['date', 'class_id'] },
  { table: 'attendance_records', name: 'idx_attendance_student_date', columns: ['student_id', 'date'] },
  { table: 'grades', name: 'idx_grades_student_exam', columns: ['student_id', 'exam_id'] },
  { table: 'grades', name: 'idx_grades_exam_subject', columns: ['exam_id', 'subject_id'] },
  { table: 'invoices', name: 'idx_invoices_student_status', columns: ['student_id', 'status'] },
  { table: 'invoices', name: 'idx_invoices_due_date', columns: ['due_date'] },
  { table: 'payments', name: 'idx_payments_invoice', columns: ['invoice_id'] },
  { table: 'payments', name: 'idx_payments_date', columns: ['payment_date'] },
  { table: 'audit_logs', name: 'idx_audit_entity', columns: ['entity_type', 'entity_id'] },
  { table: 'audit_logs', name: 'idx_audit_user', columns: ['user_id'] },
  { table: 'audit_logs', name: 'idx_audit_timestamp', columns: ['timestamp'] },
  { table: 'users', name: 'idx_users_role', columns: ['role'] },
  { table: 'users', name: 'idx_users_email', columns: ['email'], unique: true },
  { table: 'timetables', name: 'idx_timetable_class_day', columns: ['class_id', 'day_of_week'] },
  { table: 'books', name: 'idx_books_isbn', columns: ['isbn'] },
  { table: 'books', name: 'idx_books_title', columns: ['title'] },
];

async function verifyAndCreateIndexes(): Promise<void> {
  logger.info('Starting database index optimization...');
  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const idx of REQUIRED_INDEXES) {
    try {
      const [tables] = await sequelize.query(
        `SHOW TABLES LIKE '${idx.table}'`
      );

      if ((tables as any[]).length === 0) {
        logger.debug(`Table ${idx.table} does not exist, skipping index ${idx.name}`);
        skipped++;
        continue;
      }

      const [existing] = await sequelize.query(
        `SHOW INDEX FROM \`${idx.table}\` WHERE Key_name = '${idx.name}'`
      );

      if ((existing as any[]).length > 0) {
        logger.debug(`Index ${idx.name} already exists on ${idx.table}`);
        skipped++;
        continue;
      }

      const uniqueStr = idx.unique ? 'UNIQUE' : '';
      const cols = idx.columns.map(c => `\`${c}\``).join(', ');
      await sequelize.query(
        `CREATE ${uniqueStr} INDEX \`${idx.name}\` ON \`${idx.table}\` (${cols})`
      );

      logger.info(`Created index ${idx.name} on ${idx.table}`);
      created++;
    } catch (error: any) {
      if (error.message?.includes('Duplicate key name')) {
        skipped++;
      } else {
        logger.warn(`Failed to create index ${idx.name} on ${idx.table}: ${error.message}`);
        failed++;
      }
    }
  }

  logger.info(`Index optimization complete: ${created} created, ${skipped} skipped, ${failed} failed`);
}

async function analyzeSlowQueries(): Promise<void> {
  try {
    const [variables] = await sequelize.query(
      "SHOW VARIABLES LIKE 'slow_query_log'"
    );
    logger.info('Slow query log status:', variables);

    await sequelize.query("SET GLOBAL slow_query_log = 'ON'").catch(() => {
      logger.warn('Could not enable slow query log (insufficient privileges)');
    });

    await sequelize.query("SET GLOBAL long_query_time = 1").catch(() => {
      logger.warn('Could not set long_query_time (insufficient privileges)');
    });
  } catch (error) {
    logger.warn('Could not configure slow query logging:', error);
  }
}

async function main(): Promise<void> {
  try {
    await sequelize.authenticate();
    await verifyAndCreateIndexes();
    await analyzeSlowQueries();
    logger.info('Database optimization script completed');
  } catch (error) {
    logger.error('Database optimization failed:', error);
  } finally {
    await sequelize.close();
  }
}

main();
