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

  if (!tables.has('staff_tasks')) {
    await queryInterface.createTable('staff_tasks', {
      staff_task_id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      title: { type: DataTypes.STRING(200), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
      assigned_to: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'user_id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      assigned_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'user_id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' },
      due_date: { type: DataTypes.DATEONLY, allowNull: true },
      priority: { type: DataTypes.ENUM('low', 'medium', 'high'), allowNull: false, defaultValue: 'medium' },
      category: { type: DataTypes.STRING(100), allowNull: false, defaultValue: 'general' },
      status: { type: DataTypes.ENUM('pending', 'in_progress', 'completed'), allowNull: false, defaultValue: 'pending' },
      completion_note: { type: DataTypes.TEXT, allowNull: true },
      municipality_id: { type: DataTypes.CHAR(36), allowNull: true },
      school_config_id: { type: DataTypes.CHAR(36), allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex('staff_tasks', ['assigned_to', 'status'], { name: 'idx_staff_tasks_assignee_status' });
    await queryInterface.addIndex('staff_tasks', ['assigned_by'], { name: 'idx_staff_tasks_assigner' });
    await queryInterface.addIndex('staff_tasks', ['due_date'], { name: 'idx_staff_tasks_due_date' });
  }

  if (!tables.has('staff_work_schedules')) {
    await queryInterface.createTable('staff_work_schedules', {
      staff_work_schedule_id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'user_id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      shift_start: { type: DataTypes.TIME, allowNull: false, defaultValue: '08:00:00' },
      shift_end: { type: DataTypes.TIME, allowNull: false, defaultValue: '17:00:00' },
      location: { type: DataTypes.STRING(200), allowNull: false, defaultValue: '' },
      notes: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
      updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'user_id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' },
      municipality_id: { type: DataTypes.CHAR(36), allowNull: true },
      school_config_id: { type: DataTypes.CHAR(36), allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex('staff_work_schedules', ['user_id', 'date'], { unique: true, name: 'uq_staff_work_schedule_user_date' });
    await queryInterface.addIndex('staff_work_schedules', ['date'], { name: 'idx_staff_work_schedule_date' });
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('staff_work_schedules');
  await queryInterface.dropTable('staff_tasks');
}
