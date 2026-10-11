import { QueryInterface, DataTypes } from 'sequelize';

/**
 * The application encrypts citizenship numbers before saving them. A 50-char
 * plaintext can produce ciphertext longer than the previous 50-char columns.
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.changeColumn('students', 'father_citizenship_no', {
    type: DataTypes.STRING(255),
    allowNull: true,
  });
  await queryInterface.changeColumn('students', 'mother_citizenship_no', {
    type: DataTypes.STRING(255),
    allowNull: true,
  });
}

export async function down(_queryInterface: QueryInterface): Promise<void> {
  // Keep the expanded columns to avoid truncating ciphertext on rollback.
}
