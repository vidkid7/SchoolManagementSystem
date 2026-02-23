import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('attendance_rules', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    minimum_attendance_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 75.0,
    },
    low_attendance_threshold: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 75.0,
    },
    critical_attendance_threshold: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 60.0,
    },
    correction_window_hours: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 24,
    },
    allow_teacher_correction: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    allow_admin_correction: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    max_leave_days_per_month: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
    },
    max_leave_days_per_year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
    },
    require_leave_approval: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    enable_low_attendance_alerts: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    alert_parents: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    alert_admins: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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

  await queryInterface.addIndex('attendance_rules', ['is_active']);

  await queryInterface.bulkInsert('attendance_rules', [
    {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Default Attendance Rule',
      description: 'Standard attendance rules for Nepal schools',
      minimum_attendance_percentage: 75.0,
      low_attendance_threshold: 75.0,
      critical_attendance_threshold: 60.0,
      correction_window_hours: 24,
      allow_teacher_correction: true,
      allow_admin_correction: true,
      max_leave_days_per_month: 5,
      max_leave_days_per_year: 30,
      require_leave_approval: true,
      enable_low_attendance_alerts: true,
      alert_parents: true,
      alert_admins: true,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('attendance_rules');
}
