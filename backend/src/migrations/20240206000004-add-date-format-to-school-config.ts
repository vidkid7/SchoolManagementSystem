import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn('school_config', 'date_format', {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'YYYY-MM-DD',
    });

    await queryInterface.addColumn('school_config', 'time_format', {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'HH:mm',
    });

    await queryInterface.addColumn('school_config', 'number_format', {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'en-US',
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn('school_config', 'date_format');
    await queryInterface.removeColumn('school_config', 'time_format');
    await queryInterface.removeColumn('school_config', 'number_format');
  },
};
