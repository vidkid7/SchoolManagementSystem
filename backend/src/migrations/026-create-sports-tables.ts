/**
 * Migration: Create Sports Tables
 * 
 * Creates database tables for Sports management
 * (sports, teams, tournaments, sports_achievements)
 * 
 * Requirements: 12.1, 12.2, 12.5, 12.7
 */

import { DataTypes, QueryInterface } from 'sequelize';
import { Sequelize } from 'sequelize';

export async function up(queryInterface: QueryInterface, _sequelize: Sequelize): Promise<void> {
  // Create sports table
  await queryInterface.createTable('sports', {
    sport_id: {
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
      type: DataTypes.ENUM('individual', 'team', 'traditional'),
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
      type: DataTypes.ENUM('active', 'inactive'),
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

  // Create teams table
  await queryInterface.createTable('teams', {
    team_id: {
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
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    name_np: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    captain_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'students',
        key: 'student_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    members: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: '[]',
    },
    coach_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'staff',
        key: 'staff_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
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
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
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

  // Create tournaments table
  await queryInterface.createTable('tournaments', {
    tournament_id: {
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    name_np: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('inter_school', 'intra_school', 'district', 'regional', 'national'),
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
      allowNull: false,
    },
    end_date_bs: {
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
    teams: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    participants: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    schedule: {
      type: DataTypes.JSON,
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

  // Create sports_achievements table
  await queryInterface.createTable('sports_achievements', {
    achievement_id: {
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
    tournament_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'tournaments',
        key: 'tournament_id',
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
      type: DataTypes.ENUM('medal', 'trophy', 'certificate', 'rank', 'record', 'recognition'),
      allowNull: false,
    },
    level: {
      type: DataTypes.ENUM('school', 'inter_school', 'district', 'regional', 'national', 'international'),
      allowNull: false,
    },
    position: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    medal: {
      type: DataTypes.ENUM('gold', 'silver', 'bronze'),
      allowNull: true,
    },
    record_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    record_value: {
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

  // Create indexes for sports table
  await queryInterface.addIndex('sports', ['category'], { name: 'idx_sports_category' });
  await queryInterface.addIndex('sports', ['coordinator_id'], { name: 'idx_sports_coordinator' });
  await queryInterface.addIndex('sports', ['academic_year_id'], { name: 'idx_sports_academic_year' });
  await queryInterface.addIndex('sports', ['status'], { name: 'idx_sports_status' });

  // Create indexes for teams table
  await queryInterface.addIndex('teams', ['sport_id'], { name: 'idx_teams_sport' });
  await queryInterface.addIndex('teams', ['captain_id'], { name: 'idx_teams_captain' });
  await queryInterface.addIndex('teams', ['coach_id'], { name: 'idx_teams_coach' });
  await queryInterface.addIndex('teams', ['academic_year_id'], { name: 'idx_teams_academic_year' });
  await queryInterface.addIndex('teams', ['status'], { name: 'idx_teams_status' });

  // Create indexes for tournaments table
  await queryInterface.addIndex('tournaments', ['sport_id'], { name: 'idx_tournaments_sport' });
  await queryInterface.addIndex('tournaments', ['type'], { name: 'idx_tournaments_type' });
  await queryInterface.addIndex('tournaments', ['start_date'], { name: 'idx_tournaments_start_date' });
  await queryInterface.addIndex('tournaments', ['status'], { name: 'idx_tournaments_status' });

  // Create indexes for sports_achievements table
  await queryInterface.addIndex('sports_achievements', ['sport_id'], { name: 'idx_sports_achievements_sport' });
  await queryInterface.addIndex('sports_achievements', ['student_id'], { name: 'idx_sports_achievements_student' });
  await queryInterface.addIndex('sports_achievements', ['team_id'], { name: 'idx_sports_achievements_team' });
  await queryInterface.addIndex('sports_achievements', ['tournament_id'], { name: 'idx_sports_achievements_tournament' });
  await queryInterface.addIndex('sports_achievements', ['type'], { name: 'idx_sports_achievements_type' });
  await queryInterface.addIndex('sports_achievements', ['level'], { name: 'idx_sports_achievements_level' });
  await queryInterface.addIndex('sports_achievements', ['medal'], { name: 'idx_sports_achievements_medal' });
  await queryInterface.addIndex('sports_achievements', ['achievement_date'], { name: 'idx_sports_achievements_date' });
}

export async function down(queryInterface: QueryInterface, _sequelize: Sequelize): Promise<void> {
  await queryInterface.dropTable('sports_achievements');
  await queryInterface.dropTable('tournaments');
  await queryInterface.dropTable('teams');
  await queryInterface.dropTable('sports');
}
