import { DataTypes, QueryInterface } from 'sequelize';

/**
 * Keep the legacy staff table compatible with the current form's
 * "contact name: phone" emergency contact value.
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  const columns = await queryInterface.describeTable('staff');
  if (!columns.emergency_contact) {
    throw new Error('Cannot widen staff emergency contact because the column is missing');
  }

  await queryInterface.changeColumn('staff', 'emergency_contact', {
    type: DataTypes.STRING(100),
    allowNull: true,
  });
}

// Preserve the wider column when rolling back application code.
export async function down(_queryInterface: QueryInterface): Promise<void> {}
