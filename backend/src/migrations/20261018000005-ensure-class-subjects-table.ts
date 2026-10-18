import { DataTypes, QueryInterface } from 'sequelize';

/** Restore the class-subject junction table when an earlier release skipped migration 011. */
export async function up(queryInterface: QueryInterface): Promise<void> {
  const tables = await queryInterface.showAllTables();
  if (tables.includes('class_subjects')) return;

  await queryInterface.createTable('class_subjects', {
    class_subject_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    class_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'classes', key: 'class_id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    subject_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'subjects', key: 'subject_id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    teacher_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'staff', key: 'staff_id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });

  await queryInterface.addIndex('class_subjects', ['class_id', 'subject_id'], {
    unique: true,
    name: 'idx_class_subjects_unique'
  });
  await queryInterface.addIndex('class_subjects', ['class_id'], {
    name: 'idx_class_subjects_class_id'
  });
  await queryInterface.addIndex('class_subjects', ['subject_id'], {
    name: 'idx_class_subjects_subject_id'
  });
  await queryInterface.addIndex('class_subjects', ['teacher_id'], {
    name: 'idx_class_subjects_teacher_id'
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('class_subjects');
}
