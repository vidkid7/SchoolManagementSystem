import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('grading_schemes', {
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
    is_default: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    grades: {
      type: DataTypes.JSON,
      allowNull: false,
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

  await queryInterface.addIndex('grading_schemes', ['is_default']);
  await queryInterface.addIndex('grading_schemes', ['is_active']);

  await queryInterface.bulkInsert('grading_schemes', [
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'NEB Standard Grading',
      description: 'National Examination Board (NEB) standard grading system for Nepal',
      is_default: true,
      is_active: true,
      grades: JSON.stringify([
        { grade: 'A+', gradePoint: 4.0, minPercentage: 90, maxPercentage: 100, description: 'Outstanding' },
        { grade: 'A', gradePoint: 3.6, minPercentage: 80, maxPercentage: 89, description: 'Excellent' },
        { grade: 'B+', gradePoint: 3.2, minPercentage: 70, maxPercentage: 79, description: 'Very Good' },
        { grade: 'B', gradePoint: 2.8, minPercentage: 60, maxPercentage: 69, description: 'Good' },
        { grade: 'C+', gradePoint: 2.4, minPercentage: 50, maxPercentage: 59, description: 'Satisfactory' },
        { grade: 'C', gradePoint: 2.0, minPercentage: 40, maxPercentage: 49, description: 'Acceptable' },
        { grade: 'D', gradePoint: 1.6, minPercentage: 35, maxPercentage: 39, description: 'Basic' },
        { grade: 'NG', gradePoint: 0.0, minPercentage: 0, maxPercentage: 34, description: 'Not Graded' },
      ]),
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('grading_schemes');
}
