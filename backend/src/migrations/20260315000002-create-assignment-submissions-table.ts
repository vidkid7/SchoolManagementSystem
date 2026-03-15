import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('assignment_submissions', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    assignment_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'assignments',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    student_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: '[]',
    },
    status: {
      type: DataTypes.ENUM('submitted', 'graded', 'late'),
      allowNull: false,
      defaultValue: 'submitted',
    },
    marks: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    submitted_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    graded_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    school_config_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    municipality_id: {
      type: DataTypes.UUID,
      allowNull: true,
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

  const indexes = await queryInterface.showIndex('assignment_submissions') as any[];
  const indexNames = indexes.map((idx: any) => idx.name);

  const toCreate = [
    { name: 'idx_asub_assignment_id', fields: ['assignment_id'] },
    { name: 'idx_asub_student_id', fields: ['student_id'] },
    { name: 'idx_asub_status', fields: ['status'] },
    { name: 'idx_asub_school_config_id', fields: ['school_config_id'] },
    { name: 'idx_asub_municipality_id', fields: ['municipality_id'] },
    {
      name: 'idx_assignment_submissions_assignment_student',
      fields: ['assignment_id', 'student_id'],
      unique: true,
    },
  ];

  for (const idx of toCreate) {
    if (!indexNames.includes(idx.name)) {
      await queryInterface.addIndex('assignment_submissions', idx.fields, {
        name: idx.name,
        unique: (idx as any).unique ?? false,
      });
    }
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('assignment_submissions');
}
