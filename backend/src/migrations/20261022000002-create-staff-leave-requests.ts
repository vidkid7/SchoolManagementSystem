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
  if (tables.has('staff_leave_requests')) return;

  await queryInterface.createTable('staff_leave_requests', {
    staff_leave_request_id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
    staff_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'staff', key: 'staff_id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
    leave_type: { type: DataTypes.ENUM('casual', 'sick', 'personal', 'other'), allowNull: false },
    start_date: { type: DataTypes.DATEONLY, allowNull: false },
    end_date: { type: DataTypes.DATEONLY, allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'), allowNull: false, defaultValue: 'pending' },
    applied_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'user_id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' },
    reviewed_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, references: { model: 'users', key: 'user_id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
    reviewed_at: { type: DataTypes.DATE, allowNull: true },
    review_note: { type: DataTypes.TEXT, allowNull: true },
    municipality_id: { type: DataTypes.CHAR(36), allowNull: true },
    school_config_id: { type: DataTypes.CHAR(36), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await queryInterface.addIndex('staff_leave_requests', ['staff_id', 'start_date', 'end_date'], { name: 'idx_staff_leave_staff_dates' });
  await queryInterface.addIndex('staff_leave_requests', ['status'], { name: 'idx_staff_leave_status' });
  await queryInterface.addIndex('staff_leave_requests', ['applied_by'], { name: 'idx_staff_leave_applied_by' });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('staff_leave_requests');
}
