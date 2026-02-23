import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    // Create archive_metadata table to track archived academic years
    await queryInterface.createTable('archive_metadata', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      academic_year_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'academic_years',
          key: 'id',
        },
      },
      academic_year_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      archived_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      archived_by: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      status: {
        type: DataTypes.ENUM('in_progress', 'completed', 'failed', 'restored'),
        allowNull: false,
        defaultValue: 'in_progress',
      },
      tables_archived: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'List of tables that were archived',
      },
      record_counts: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Count of records archived per table',
      },
      retention_until: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'Date when archived data can be deleted (10 years)',
      },
      error_message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    // Create indexes
    await queryInterface.addIndex('archive_metadata', ['academic_year_id']);
    await queryInterface.addIndex('archive_metadata', ['status']);
    await queryInterface.addIndex('archive_metadata', ['retention_until']);

    // Create archived_students table
    await queryInterface.createTable('archived_students', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      archive_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'archive_metadata',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      original_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        comment: 'Original student ID from students table',
      },
      student_data: {
        type: DataTypes.JSON,
        allowNull: false,
        comment: 'Complete student record as JSON',
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('archived_students', ['archive_id']);
    await queryInterface.addIndex('archived_students', ['original_id']);

    // Create archived_attendance table
    await queryInterface.createTable('archived_attendance', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      archive_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'archive_metadata',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      original_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      attendance_data: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('archived_attendance', ['archive_id']);

    // Create archived_grades table
    await queryInterface.createTable('archived_grades', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      archive_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'archive_metadata',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      original_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      grade_data: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('archived_grades', ['archive_id']);

    // Create archived_exams table
    await queryInterface.createTable('archived_exams', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      archive_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'archive_metadata',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      original_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      exam_data: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('archived_exams', ['archive_id']);

    // Create archived_invoices table
    await queryInterface.createTable('archived_invoices', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      archive_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'archive_metadata',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      original_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      invoice_data: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('archived_invoices', ['archive_id']);

    // Create archived_payments table
    await queryInterface.createTable('archived_payments', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      archive_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'archive_metadata',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      original_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      payment_data: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('archived_payments', ['archive_id']);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('archived_payments');
    await queryInterface.dropTable('archived_invoices');
    await queryInterface.dropTable('archived_exams');
    await queryInterface.dropTable('archived_grades');
    await queryInterface.dropTable('archived_attendance');
    await queryInterface.dropTable('archived_students');
    await queryInterface.dropTable('archive_metadata');
  },
};
