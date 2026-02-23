import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('school_config', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // School Information
    school_name_en: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    school_name_np: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    school_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    logo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    address_en: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    address_np: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    // Academic Year Structure
    academic_year_start_month: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1, // Baisakh (April)
      comment: 'BS month number (1-12)',
    },
    academic_year_duration_months: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 12,
    },
    terms_per_year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
      comment: 'Number of terms/terminals per academic year',
    },
    // Additional Settings
    default_calendar_system: {
      type: DataTypes.ENUM('BS', 'AD'),
      allowNull: false,
      defaultValue: 'BS',
    },
    default_language: {
      type: DataTypes.ENUM('nepali', 'english'),
      allowNull: false,
      defaultValue: 'nepali',
    },
    timezone: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Asia/Kathmandu',
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'NPR',
    },
    // Metadata
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Only one config should be active at a time',
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

  // Add index on is_active for quick lookup of active config
  await queryInterface.addIndex('school_config', ['is_active'], {
    name: 'idx_school_config_is_active',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('school_config');
}
