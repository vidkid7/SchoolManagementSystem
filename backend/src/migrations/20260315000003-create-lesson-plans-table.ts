import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('lesson_plans', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    subject: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    class_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    section: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    topic: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 45,
    },
    objectives: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: '[]',
    },
    materials: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    methodology: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    assessment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'scheduled', 'completed', 'reviewed', 'approved'),
      allowNull: false,
      defaultValue: 'draft',
    },
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
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
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  const indexes = await queryInterface.showIndex('lesson_plans') as any[];
  const indexNames = indexes.map((idx: any) => idx.name);

  const toCreate = [
    { name: 'idx_lesson_plans_subject', fields: ['subject'] },
    { name: 'idx_lesson_plans_class_name', fields: ['class_name'] },
    { name: 'idx_lesson_plans_status', fields: ['status'] },
    { name: 'idx_lesson_plans_created_by', fields: ['created_by'] },
    { name: 'idx_lesson_plans_date', fields: ['date'] },
    { name: 'idx_lesson_plans_school_config_id', fields: ['school_config_id'] },
    { name: 'idx_lesson_plans_municipality_id', fields: ['municipality_id'] },
  ];

  for (const idx of toCreate) {
    if (!indexNames.includes(idx.name)) {
      await queryInterface.addIndex('lesson_plans', idx.fields, { name: idx.name });
    }
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('lesson_plans');
}
