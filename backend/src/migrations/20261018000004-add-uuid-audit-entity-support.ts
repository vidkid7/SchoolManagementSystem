import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

export async function up(queryInterface: QueryInterface, _sequelize: Sequelize): Promise<void> {
  const columns = await queryInterface.describeTable('audit_logs');

  if (!Object.prototype.hasOwnProperty.call(columns, 'entity_uuid')) {
    await queryInterface.addColumn('audit_logs', 'entity_uuid', {
      type: DataTypes.STRING(36),
      allowNull: true,
    });
  }

  if (columns.entity_id?.allowNull === false) {
    await queryInterface.changeColumn('audit_logs', 'entity_id', {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    });
  }
}

export async function down(_queryInterface: QueryInterface, _sequelize: Sequelize): Promise<void> {
  throw new Error('UUID audit entity support is non-destructive and cannot be rolled back automatically.');
}
