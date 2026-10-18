import { QueryInterface, Sequelize } from 'sequelize';
import { up as createExamSchedulesTable } from './022-create-exam-schedules-table';

function normalizeTableName(table: unknown): string {
  if (typeof table === 'string') return table.toLowerCase();
  if (table && typeof table === 'object') {
    const values = Object.values(table as Record<string, unknown>);
    if (typeof values[0] === 'string') return values[0].toLowerCase();
  }
  return '';
}

/** Ensure the schedule table exists; the original 022 migration was not registered in the production runner. */
export async function up(queryInterface: QueryInterface, _sequelize: Sequelize): Promise<void> {
  const tables = (await queryInterface.showAllTables()).map(normalizeTableName);
  if (!tables.includes('exam_schedules')) {
    await createExamSchedulesTable(queryInterface);
  }
}

export async function down(_queryInterface: QueryInterface, _sequelize: Sequelize): Promise<void> {
  throw new Error('The exam schedule table repair migration is non-destructive and cannot be rolled back automatically.');
}
