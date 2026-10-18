import { QueryInterface } from 'sequelize';
import createStudentCVTable from './031-create-student-cv-table';

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tables = await queryInterface.showAllTables();
  const tableNames = tables.map((table) => String(table));

  if (!tableNames.some((tableName) => tableName.toLowerCase() === 'student_cv')) {
    await createStudentCVTable.up(queryInterface);
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const tables = await queryInterface.showAllTables();
  const exists = tables.some((table) => String(table).toLowerCase() === 'student_cv');

  if (exists) {
    await queryInterface.dropTable('student_cv');
  }
}
