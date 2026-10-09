import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Aligns legacy student tables with the current Student model. Some deployed
 * databases were created before the citizenship fields were widened to 50.
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.changeColumn('students', 'father_citizenship_no', {
    type: DataTypes.STRING(50),
    allowNull: true,
  });
  await queryInterface.changeColumn('students', 'mother_citizenship_no', {
    type: DataTypes.STRING(50),
    allowNull: true,
  });
}

export async function down(_queryInterface: QueryInterface): Promise<void> {
  // Keep the wider columns on rollback to avoid truncating stored identifiers.
}
