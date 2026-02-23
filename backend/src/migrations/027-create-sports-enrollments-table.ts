/**
 * Migration: Create Sports Enrollments Table
 * 
 * Creates database table for tracking student enrollment in sports
 * and practice session attendance
 * 
 * Requirements: 12.3, 12.4
 */

import { DataTypes, QueryInterface } from 'sequelize';
import { Sequelize } from 'sequelize';

export async function up(queryInterface: QueryInterface, _sequelize: Sequelize): Promise<void> {
  await queryInterface.createTable('sports_enrollments', {
    enrollment_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    sport_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'sports',
        key: 'sport_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    student_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'students',
        key: 'student_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    team_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'teams',
        key: 'team_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    enrollment_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'withdrawn', 'completed'),
      allowNull: false,
      defaultValue: 'active',
    },
    attendance_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    total_sessions: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
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

  // Create indexes
  await queryInterface.addIndex('sports_enrollments', ['sport_id'], {
    name: 'idx_sports_enrollments_sport',
  });

  await queryInterface.addIndex('sports_enrollments', ['student_id'], {
    name: 'idx_sports_enrollments_student',
  });

  await queryInterface.addIndex('sports_enrollments', ['team_id'], {
    name: 'idx_sports_enrollments_team',
  });

  await queryInterface.addIndex('sports_enrollments', ['status'], {
    name: 'idx_sports_enrollments_status',
  });

  await queryInterface.addIndex('sports_enrollments', ['sport_id', 'student_id'], {
    name: 'idx_sports_enrollments_sport_student',
  });
}

export async function down(queryInterface: QueryInterface, _sequelize: Sequelize): Promise<void> {
  await queryInterface.dropTable('sports_enrollments');
}
