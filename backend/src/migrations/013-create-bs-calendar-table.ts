import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Create BS Calendar Lookup Table
 * Creates bs_calendar table to store Bikram Sambat calendar data for years 2000-2100 BS (1943-2043 AD)
 * This table is essential for accurate BS-AD date conversions
 * 
 * Requirements: N4.1, N4.7
 */

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Create bs_calendar table
  await queryInterface.createTable('bs_calendar', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    year_bs: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: 'Bikram Sambat year (2000-2100)'
    },
    month_bs: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: 'Bikram Sambat month (1-12): 1=Baisakh, 2=Jestha, ..., 12=Chaitra'
    },
    days_in_month: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: 'Number of days in this month (29-32)'
    },
    start_date_ad: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Start date of this BS month in AD calendar'
    },
    end_date_ad: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'End date of this BS month in AD calendar'
    },
    month_name_en: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: 'Month name in English (Baisakh, Jestha, Asar, etc.)'
    },
    month_name_np: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Month name in Nepali (बैशाख, जेठ, असार, etc.)'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  // Create composite unique index on year_bs and month_bs
  await queryInterface.addIndex('bs_calendar', ['year_bs', 'month_bs'], {
    unique: true,
    name: 'idx_bs_calendar_year_month'
  });

  // Create index on year_bs for faster year-based queries
  await queryInterface.addIndex('bs_calendar', ['year_bs'], {
    name: 'idx_bs_calendar_year'
  });

  // Create index on start_date_ad for AD to BS conversion lookups
  await queryInterface.addIndex('bs_calendar', ['start_date_ad'], {
    name: 'idx_bs_calendar_start_date_ad'
  });

  // Create index on end_date_ad for range queries
  await queryInterface.addIndex('bs_calendar', ['end_date_ad'], {
    name: 'idx_bs_calendar_end_date_ad'
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('bs_calendar');
}
