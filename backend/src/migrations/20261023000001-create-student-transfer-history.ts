import { DataTypes, QueryInterface } from 'sequelize';

function normalizeTableName(table: unknown): string {
  if (typeof table === 'string') return table.toLowerCase();
  if (table && typeof table === 'object') {
    const values = Object.values(table as Record<string, unknown>);
    if (typeof values[0] === 'string') return values[0].toLowerCase();
  }
  return '';
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tables = new Set((await queryInterface.showAllTables()).map(normalizeTableName));
  if (tables.has('student_transfer_history')) return;

  await queryInterface.createTable('student_transfer_history', {
    student_transfer_history_id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
    student_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'students', key: 'student_id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
    from_class_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, references: { model: 'classes', key: 'class_id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
    to_class_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, references: { model: 'classes', key: 'class_id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
    from_roll_number: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    to_roll_number: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    reason: { type: DataTypes.STRING(500), allowNull: true },
    transferred_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, references: { model: 'users', key: 'user_id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
    transferred_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    municipality_id: { type: DataTypes.CHAR(36), allowNull: true },
    school_config_id: { type: DataTypes.CHAR(36), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  await queryInterface.addIndex('student_transfer_history', ['student_id', 'transferred_at'], { name: 'idx_student_transfer_history_student_date' });
  await queryInterface.addIndex('student_transfer_history', ['school_config_id', 'student_id'], { name: 'idx_student_transfer_history_school_student' });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('student_transfer_history');
}
