import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('assignments', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
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
    section: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    total_marks: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: '[]',
    },
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'closed', 'draft'),
      allowNull: false,
      defaultValue: 'active',
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

  const indexes = await queryInterface.showIndex('assignments') as any[];
  const indexNames = indexes.map((idx: any) => idx.name);

  const toCreate = [
    { name: 'idx_assignments_subject', fields: ['subject'] },
    { name: 'idx_assignments_class_name', fields: ['class_name'] },
    { name: 'idx_assignments_status', fields: ['status'] },
    { name: 'idx_assignments_created_by', fields: ['created_by'] },
    { name: 'idx_assignments_due_date', fields: ['due_date'] },
    { name: 'idx_assignments_school_config_id', fields: ['school_config_id'] },
    { name: 'idx_assignments_municipality_id', fields: ['municipality_id'] },
  ];

  for (const idx of toCreate) {
    if (!indexNames.includes(idx.name)) {
      await queryInterface.addIndex('assignments', idx.fields, { name: idx.name });
    }
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('assignments');
}
