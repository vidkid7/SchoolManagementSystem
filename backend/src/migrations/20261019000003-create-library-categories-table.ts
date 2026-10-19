import { DataTypes, QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tables = new Set((await queryInterface.showAllTables()).map((table) => String(table).toLowerCase()));
  if (!tables.has('library_categories')) {
    await queryInterface.createTable('library_categories', {
      category_id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      name: { type: DataTypes.STRING(100), allowNull: false },
      description: { type: DataTypes.STRING(255), allowNull: false, defaultValue: '' },
      municipality_id: { type: DataTypes.CHAR(36), allowNull: true },
      school_config_id: { type: DataTypes.CHAR(36), allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
  }

  const indexes = await queryInterface.showIndex('library_categories') as Array<{ name: string }>;
  if (!indexes.some((index) => index.name === 'uq_library_categories_school_name')) {
    await queryInterface.addIndex('library_categories', ['school_config_id', 'name'], {
      unique: true,
      name: 'uq_library_categories_school_name',
    });
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const tables = new Set((await queryInterface.showAllTables()).map((table) => String(table).toLowerCase()));
  if (tables.has('library_categories')) await queryInterface.dropTable('library_categories');
}
