import { DataTypes, QueryInterface } from 'sequelize';

function normalizeTableName(table: unknown): string {
  if (typeof table === 'string') return table;
  if (table && typeof table === 'object') {
    const values = Object.values(table as Record<string, string>);
    if (typeof values[0] === 'string') return values[0];
  }
  return '';
}

async function hasTable(queryInterface: QueryInterface, tableName: string): Promise<boolean> {
  const tables = await queryInterface.showAllTables();
  return tables.map(normalizeTableName).includes(tableName);
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  if (await hasTable(queryInterface, 'student_id_sequences')) return;

  await queryInterface.createTable('student_id_sequences', {
    admission_year: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
    },
    last_sequence: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  if (await hasTable(queryInterface, 'student_id_sequences')) {
    await queryInterface.dropTable('student_id_sequences');
  }
}
