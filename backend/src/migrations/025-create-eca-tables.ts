/**
 * Migration: Create ECA Tables
 * 
 * Creates database tables for Extra-Curricular Activities management
 * (ECAs, enrollments, events, achievements)
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7
 */

import { DataTypes, QueryInterface } from 'sequelize';
import { Sequelize } from 'sequelize';

export async function up(queryInterface: QueryInterface, _sequelize: Sequelize): Promise<void> {
  // Create ecas table
  await queryInterface.createTable('ecas', {
    eca_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    name_np: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    category: {
      type: DataTypes.ENUM('club', 'cultural', 'community_service', 'leadership'),
      allowNull: false,
    },
    subcategory: {
      type: DataTypes.STRING(100),
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
    coordinator_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'staff',
        key: 'staff_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    schedule: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    capacity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    current_enrollment: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    academic_year_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'academic_years',
        key: 'academic_year_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'completed'),
      allowNull: false,
      defaultValue: 'active',
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

  // Create eca_enrollments table
  await queryInterface.createTable('eca_enrollments', {
    enrollment_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    eca_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'ecas',
        key: 'eca_id',
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
    enrollment_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
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

  // Create eca_events table
  await queryInterface.createTable('eca_events', {
    event_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    eca_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'ecas',
        key: 'eca_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    name_np: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('competition', 'performance', 'exhibition', 'workshop', 'other'),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description_np: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    event_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    event_date_bs: {
      type: DataTypes.STRING(10),
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
    participants: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    organizer: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'ongoing', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'scheduled',
    },
    photos: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    videos: {
      type: DataTypes.JSON,
      allowNull: true,
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

  // Create eca_achievements table
  await queryInterface.createTable('eca_achievements', {
    achievement_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    eca_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'ecas',
        key: 'eca_id',
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
    event_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'eca_events',
        key: 'event_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    title_np: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('award', 'medal', 'certificate', 'recognition', 'position'),
      allowNull: false,
    },
    level: {
      type: DataTypes.ENUM('school', 'district', 'regional', 'national', 'international'),
      allowNull: false,
    },
    position: {
      type: DataTypes.STRING(50),
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
    achievement_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    achievement_date_bs: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    certificate_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    photo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
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

  // Create indexes for ecas table
  await queryInterface.addIndex('ecas', ['category'], { name: 'idx_ecas_category' });
  await queryInterface.addIndex('ecas', ['coordinator_id'], { name: 'idx_ecas_coordinator' });
  await queryInterface.addIndex('ecas', ['academic_year_id'], { name: 'idx_ecas_academic_year' });
  await queryInterface.addIndex('ecas', ['status'], { name: 'idx_ecas_status' });

  // Create indexes for eca_enrollments table
  await queryInterface.addIndex('eca_enrollments', ['eca_id'], { name: 'idx_eca_enrollments_eca' });
  await queryInterface.addIndex('eca_enrollments', ['student_id'], { name: 'idx_eca_enrollments_student' });
  await queryInterface.addIndex('eca_enrollments', ['status'], { name: 'idx_eca_enrollments_status' });
  await queryInterface.addIndex('eca_enrollments', ['eca_id', 'student_id'], { 
    name: 'idx_eca_enrollments_unique',
    unique: true 
  });

  // Create indexes for eca_events table
  await queryInterface.addIndex('eca_events', ['eca_id'], { name: 'idx_eca_events_eca' });
  await queryInterface.addIndex('eca_events', ['event_date'], { name: 'idx_eca_events_date' });
  await queryInterface.addIndex('eca_events', ['type'], { name: 'idx_eca_events_type' });
  await queryInterface.addIndex('eca_events', ['status'], { name: 'idx_eca_events_status' });

  // Create indexes for eca_achievements table
  await queryInterface.addIndex('eca_achievements', ['eca_id'], { name: 'idx_eca_achievements_eca' });
  await queryInterface.addIndex('eca_achievements', ['student_id'], { name: 'idx_eca_achievements_student' });
  await queryInterface.addIndex('eca_achievements', ['event_id'], { name: 'idx_eca_achievements_event' });
  await queryInterface.addIndex('eca_achievements', ['type'], { name: 'idx_eca_achievements_type' });
  await queryInterface.addIndex('eca_achievements', ['level'], { name: 'idx_eca_achievements_level' });
  await queryInterface.addIndex('eca_achievements', ['achievement_date'], { name: 'idx_eca_achievements_date' });
}

export async function down(queryInterface: QueryInterface, _sequelize: Sequelize): Promise<void> {
  await queryInterface.dropTable('eca_achievements');
  await queryInterface.dropTable('eca_events');
  await queryInterface.dropTable('eca_enrollments');
  await queryInterface.dropTable('ecas');
}
