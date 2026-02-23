/**
 * Migration: Create Events Table
 * 
 * Creates database table for calendar and event management
 * 
 * Features:
 * - Event details (title, description, date, time, location)
 * - Event categories (academic, sports, cultural, holiday)
 * - Recurring event support (weekly, monthly)
 * - BS and AD date support
 * - Target audience (all, students, parents, teachers, staff)
 * - Nepal government holidays support
 * 
 * Requirements: 31.1, 31.2, 31.3, 31.4, 31.5, 31.6, 31.7
 */

import { DataTypes, QueryInterface } from 'sequelize';
import { Sequelize } from 'sequelize';

export async function up(queryInterface: QueryInterface, _sequelize: Sequelize): Promise<void> {
  // Create events table
  await queryInterface.createTable('events', {
    event_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    title_np: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description_np: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.ENUM('academic', 'sports', 'cultural', 'holiday', 'exam', 'meeting', 'other'),
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    start_date_bs: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    end_date_bs: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    start_time: {
      type: DataTypes.STRING(5),  // HH:mm format
      allowNull: true,
    },
    end_time: {
      type: DataTypes.STRING(5),  // HH:mm format
      allowNull: true,
    },
    venue: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    venue_np: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    is_recurring: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    recurrence_pattern: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'yearly'),
      allowNull: true,
    },
    recurrence_end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    target_audience: {
      type: DataTypes.ENUM('all', 'students', 'parents', 'teachers', 'staff'),
      allowNull: false,
      defaultValue: 'all',
    },
    target_classes: {
      type: DataTypes.JSON,  // Array of class levels
      allowNull: true,
    },
    is_holiday: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_nepal_government_holiday: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    government_holiday_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    government_holiday_name_np: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    color: {
      type: DataTypes.STRING(7),  // Hex color code
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'ongoing', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'scheduled',
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
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  // Create indexes for events table
  await queryInterface.addIndex('events', ['start_date'], { name: 'idx_events_start_date' });
  await queryInterface.addIndex('events', ['end_date'], { name: 'idx_events_end_date' });
  await queryInterface.addIndex('events', ['category'], { name: 'idx_events_category' });
  await queryInterface.addIndex('events', ['target_audience'], { name: 'idx_events_target_audience' });
  await queryInterface.addIndex('events', ['status'], { name: 'idx_events_status' });
  await queryInterface.addIndex('events', ['is_holiday'], { name: 'idx_events_is_holiday' });
  await queryInterface.addIndex('events', ['is_nepal_government_holiday'], { name: 'idx_events_is_nepal_government_holiday' });
  await queryInterface.addIndex('events', ['is_recurring'], { name: 'idx_events_is_recurring' });
  await queryInterface.addIndex('events', ['created_by'], { name: 'idx_events_created_by' });
  await queryInterface.addIndex('events', ['start_date', 'end_date'], { name: 'idx_events_date_range' });
  await queryInterface.addIndex('events', ['category', 'is_holiday'], { name: 'idx_events_category_holiday' });
}

export async function down(queryInterface: QueryInterface, _sequelize: Sequelize): Promise<void> {
  await queryInterface.dropTable('events');
}