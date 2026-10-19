import { DataTypes, QueryInterface } from 'sequelize';

async function getStudentColumns(queryInterface: QueryInterface): Promise<Record<string, unknown> | null> {
  try {
    return await queryInterface.describeTable('students');
  } catch {
    return null;
  }
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  const columns = await getStudentColumns(queryInterface);
  if (!columns) return;

  if (!Object.prototype.hasOwnProperty.call(columns, 'city')) {
    await queryInterface.addColumn('students', 'city', {
      type: DataTypes.STRING(100),
      allowNull: true,
    });
  }

  if (!Object.prototype.hasOwnProperty.call(columns, 'district')) {
    await queryInterface.addColumn('students', 'district', {
      type: DataTypes.STRING(100),
      allowNull: true,
    });
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const columns = await getStudentColumns(queryInterface);
  if (!columns) return;

  if (Object.prototype.hasOwnProperty.call(columns, 'district')) {
    await queryInterface.removeColumn('students', 'district');
  }
  if (Object.prototype.hasOwnProperty.call(columns, 'city')) {
    await queryInterface.removeColumn('students', 'city');
  }
}
