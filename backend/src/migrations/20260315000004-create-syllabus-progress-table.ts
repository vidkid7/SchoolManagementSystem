import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('syllabus_progress', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    teacher_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    class_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    unit: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    topic: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('not-started', 'in-progress', 'completed'),
      allowNull: false,
      defaultValue: 'not-started',
    },
    progress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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

  const indexes = await queryInterface.showIndex('syllabus_progress') as any[];
  const indexNames = indexes.map((idx: any) => idx.name);

  const toCreate = [
    { name: 'idx_syllabus_progress_teacher_id', fields: ['teacher_id'] },
    { name: 'idx_syllabus_progress_subject', fields: ['subject'] },
    { name: 'idx_syllabus_progress_class_name', fields: ['class_name'] },
    { name: 'idx_syllabus_progress_status', fields: ['status'] },
    { name: 'idx_syllabus_progress_school_config_id', fields: ['school_config_id'] },
    { name: 'idx_syllabus_progress_municipality_id', fields: ['municipality_id'] },
    {
      name: 'idx_syllabus_progress_teacher_subject_unit',
      fields: ['teacher_id', 'subject', 'unit'],
      unique: true,
    },
  ];

  for (const idx of toCreate) {
    if (!indexNames.includes(idx.name)) {
      await queryInterface.addIndex('syllabus_progress', idx.fields, {
        name: idx.name,
        unique: (idx as any).unique ?? false,
      });
    }
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('syllabus_progress');
}
