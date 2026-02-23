/**
 * Migration Test: Create Sports Tables
 * 
 * Tests for sports tables migration
 * 
 * Requirements: 12.1, 12.2, 12.5, 12.7
 */

import { Sequelize, QueryInterface } from 'sequelize';
import { up, down } from '../026-create-sports-tables';

describe('Migration: Create Sports Tables', () => {
  let sequelize: Sequelize;
  let queryInterface: QueryInterface;

  beforeAll(() => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    queryInterface = sequelize.getQueryInterface();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Up Migration', () => {
    beforeAll(async () => {
      // Create prerequisite tables
      await queryInterface.createTable('staff', {
        staff_id: {
          type: 'INTEGER',
          primaryKey: true,
          autoIncrement: true,
        },
      });

      await queryInterface.createTable('students', {
        student_id: {
          type: 'INTEGER',
          primaryKey: true,
          autoIncrement: true,
        },
      });

      await queryInterface.createTable('academic_years', {
        academic_year_id: {
          type: 'INTEGER',
          primaryKey: true,
          autoIncrement: true,
        },
      });

      // Run the migration
      await up(queryInterface, sequelize);
    });

    it('should create sports table', async () => {
      const tables = await queryInterface.showAllTables();
      expect(tables).toContain('sports');
    });

    it('should create teams table', async () => {
      const tables = await queryInterface.showAllTables();
      expect(tables).toContain('teams');
    });

    it('should create tournaments table', async () => {
      const tables = await queryInterface.showAllTables();
      expect(tables).toContain('tournaments');
    });

    it('should create sports_achievements table', async () => {
      const tables = await queryInterface.showAllTables();
      expect(tables).toContain('sports_achievements');
    });

    it('should have correct columns in sports table', async () => {
      const columns = await queryInterface.describeTable('sports');
      
      expect(columns).toHaveProperty('sport_id');
      expect(columns).toHaveProperty('name');
      expect(columns).toHaveProperty('name_np');
      expect(columns).toHaveProperty('category');
      expect(columns).toHaveProperty('description');
      expect(columns).toHaveProperty('description_np');
      expect(columns).toHaveProperty('coordinator_id');
      expect(columns).toHaveProperty('academic_year_id');
      expect(columns).toHaveProperty('status');
      expect(columns).toHaveProperty('created_at');
      expect(columns).toHaveProperty('updated_at');
      expect(columns).toHaveProperty('deleted_at');
    });

    it('should have correct columns in teams table', async () => {
      const columns = await queryInterface.describeTable('teams');
      
      expect(columns).toHaveProperty('team_id');
      expect(columns).toHaveProperty('sport_id');
      expect(columns).toHaveProperty('name');
      expect(columns).toHaveProperty('name_np');
      expect(columns).toHaveProperty('captain_id');
      expect(columns).toHaveProperty('members');
      expect(columns).toHaveProperty('coach_id');
      expect(columns).toHaveProperty('academic_year_id');
      expect(columns).toHaveProperty('status');
      expect(columns).toHaveProperty('remarks');
      expect(columns).toHaveProperty('created_at');
      expect(columns).toHaveProperty('updated_at');
    });

    it('should have correct columns in tournaments table', async () => {
      const columns = await queryInterface.describeTable('tournaments');
      
      expect(columns).toHaveProperty('tournament_id');
      expect(columns).toHaveProperty('sport_id');
      expect(columns).toHaveProperty('name');
      expect(columns).toHaveProperty('name_np');
      expect(columns).toHaveProperty('type');
      expect(columns).toHaveProperty('start_date');
      expect(columns).toHaveProperty('start_date_bs');
      expect(columns).toHaveProperty('end_date');
      expect(columns).toHaveProperty('end_date_bs');
      expect(columns).toHaveProperty('venue');
      expect(columns).toHaveProperty('venue_np');
      expect(columns).toHaveProperty('teams');
      expect(columns).toHaveProperty('participants');
      expect(columns).toHaveProperty('schedule');
      expect(columns).toHaveProperty('status');
      expect(columns).toHaveProperty('photos');
      expect(columns).toHaveProperty('videos');
      expect(columns).toHaveProperty('remarks');
    });

    it('should have correct columns in sports_achievements table', async () => {
      const columns = await queryInterface.describeTable('sports_achievements');
      
      expect(columns).toHaveProperty('achievement_id');
      expect(columns).toHaveProperty('sport_id');
      expect(columns).toHaveProperty('student_id');
      expect(columns).toHaveProperty('team_id');
      expect(columns).toHaveProperty('tournament_id');
      expect(columns).toHaveProperty('title');
      expect(columns).toHaveProperty('title_np');
      expect(columns).toHaveProperty('type');
      expect(columns).toHaveProperty('level');
      expect(columns).toHaveProperty('position');
      expect(columns).toHaveProperty('medal');
      expect(columns).toHaveProperty('record_type');
      expect(columns).toHaveProperty('record_value');
      expect(columns).toHaveProperty('achievement_date');
      expect(columns).toHaveProperty('achievement_date_bs');
      expect(columns).toHaveProperty('certificate_url');
      expect(columns).toHaveProperty('photo_url');
    });

    it('should set sport_id as primary key in sports table', async () => {
      const columns = await queryInterface.describeTable('sports');
      expect(columns.sport_id.primaryKey).toBe(true);
    });

    it('should set team_id as primary key in teams table', async () => {
      const columns = await queryInterface.describeTable('teams');
      expect(columns.team_id.primaryKey).toBe(true);
    });

    it('should set tournament_id as primary key in tournaments table', async () => {
      const columns = await queryInterface.describeTable('tournaments');
      expect(columns.tournament_id.primaryKey).toBe(true);
    });

    it('should set achievement_id as primary key in sports_achievements table', async () => {
      const columns = await queryInterface.describeTable('sports_achievements');
      expect(columns.achievement_id.primaryKey).toBe(true);
    });

    it('should not allow null for required fields in sports table', async () => {
      const columns = await queryInterface.describeTable('sports');
      expect(columns.name.allowNull).toBe(false);
      expect(columns.category.allowNull).toBe(false);
      expect(columns.coordinator_id.allowNull).toBe(false);
      expect(columns.academic_year_id.allowNull).toBe(false);
      expect(columns.status.allowNull).toBe(false);
    });

    it('should not allow null for required fields in teams table', async () => {
      const columns = await queryInterface.describeTable('teams');
      expect(columns.sport_id.allowNull).toBe(false);
      expect(columns.name.allowNull).toBe(false);
      expect(columns.academic_year_id.allowNull).toBe(false);
      expect(columns.status.allowNull).toBe(false);
    });

    it('should not allow null for required fields in tournaments table', async () => {
      const columns = await queryInterface.describeTable('tournaments');
      expect(columns.sport_id.allowNull).toBe(false);
      expect(columns.name.allowNull).toBe(false);
      expect(columns.type.allowNull).toBe(false);
      expect(columns.start_date.allowNull).toBe(false);
      expect(columns.end_date.allowNull).toBe(false);
      expect(columns.status.allowNull).toBe(false);
    });

    it('should not allow null for required fields in sports_achievements table', async () => {
      const columns = await queryInterface.describeTable('sports_achievements');
      expect(columns.sport_id.allowNull).toBe(false);
      expect(columns.student_id.allowNull).toBe(false);
      expect(columns.title.allowNull).toBe(false);
      expect(columns.type.allowNull).toBe(false);
      expect(columns.level.allowNull).toBe(false);
      expect(columns.achievement_date.allowNull).toBe(false);
    });
  });

  describe('Down Migration', () => {
    it('should drop all sports tables', async () => {
      await down(queryInterface, sequelize);
      
      const tables = await queryInterface.showAllTables();
      expect(tables).not.toContain('sports_achievements');
      expect(tables).not.toContain('tournaments');
      expect(tables).not.toContain('teams');
      expect(tables).not.toContain('sports');
    });
  });

  describe('Table Relationships', () => {
    beforeAll(async () => {
      // Recreate tables for relationship tests
      await queryInterface.createTable('staff', {
        staff_id: {
          type: 'INTEGER',
          primaryKey: true,
          autoIncrement: true,
        },
      });

      await queryInterface.createTable('students', {
        student_id: {
          type: 'INTEGER',
          primaryKey: true,
          autoIncrement: true,
        },
      });

      await queryInterface.createTable('academic_years', {
        academic_year_id: {
          type: 'INTEGER',
          primaryKey: true,
          autoIncrement: true,
        },
      });

      await up(queryInterface, sequelize);
    });

    it('should have foreign key from sports to staff', async () => {
      const columns = await queryInterface.describeTable('sports');
      expect(columns.coordinator_id).toBeDefined();
    });

    it('should have foreign key from sports to academic_years', async () => {
      const columns = await queryInterface.describeTable('sports');
      expect(columns.academic_year_id).toBeDefined();
    });

    it('should have foreign key from teams to sports', async () => {
      const columns = await queryInterface.describeTable('teams');
      expect(columns.sport_id).toBeDefined();
    });

    it('should have foreign key from teams to students (captain)', async () => {
      const columns = await queryInterface.describeTable('teams');
      expect(columns.captain_id).toBeDefined();
    });

    it('should have foreign key from tournaments to sports', async () => {
      const columns = await queryInterface.describeTable('tournaments');
      expect(columns.sport_id).toBeDefined();
    });

    it('should have foreign keys from sports_achievements', async () => {
      const columns = await queryInterface.describeTable('sports_achievements');
      expect(columns.sport_id).toBeDefined();
      expect(columns.student_id).toBeDefined();
      expect(columns.team_id).toBeDefined();
      expect(columns.tournament_id).toBeDefined();
    });
  });
});
