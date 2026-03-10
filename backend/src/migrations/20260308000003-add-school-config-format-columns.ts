import { DataTypes, QueryInterface } from 'sequelize';

async function hasColumn(
  queryInterface: QueryInterface,
  tableName: string,
  columnName: string
): Promise<boolean> {
  try {
    const description = await queryInterface.describeTable(tableName);
    return Object.prototype.hasOwnProperty.call(description, columnName);
  } catch {
    return false;
  }
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tableName = 'school_config';

  if (!(await hasColumn(queryInterface, tableName, 'date_format'))) {
    await queryInterface.addColumn(tableName, 'date_format', {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'YYYY-MM-DD',
    });
  }

  if (!(await hasColumn(queryInterface, tableName, 'time_format'))) {
    await queryInterface.addColumn(tableName, 'time_format', {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'HH:mm',
    });
  }

  if (!(await hasColumn(queryInterface, tableName, 'number_format'))) {
    await queryInterface.addColumn(tableName, 'number_format', {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'en-US',
    });
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const tableName = 'school_config';

  if (await hasColumn(queryInterface, tableName, 'number_format')) {
    await queryInterface.removeColumn(tableName, 'number_format');
  }
  if (await hasColumn(queryInterface, tableName, 'time_format')) {
    await queryInterface.removeColumn(tableName, 'time_format');
  }
  if (await hasColumn(queryInterface, tableName, 'date_format')) {
    await queryInterface.removeColumn(tableName, 'date_format');
  }
}
