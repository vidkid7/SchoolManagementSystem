import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    // Create roles table
    await queryInterface.createTable('roles', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_system: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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

    // Create permissions table
    await queryInterface.createTable('permissions', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      code: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      category: {
        type: DataTypes.ENUM(
          'student',
          'staff',
          'academic',
          'attendance',
          'examination',
          'finance',
          'library',
          'transport',
          'hostel',
          'eca',
          'sports',
          'communication',
          'document',
          'certificate',
          'report',
          'system'
        ),
        allowNull: false,
      },
      action: {
        type: DataTypes.ENUM('create', 'read', 'update', 'delete', 'manage'),
        allowNull: false,
      },
      resource: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      is_system: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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

    // Create role_permissions junction table
    await queryInterface.createTable('role_permissions', {
      role_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'roles',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      permission_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'permissions',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // Add indexes
    await queryInterface.addIndex('roles', ['name'], { unique: true });
    await queryInterface.addIndex('roles', ['code'], { unique: true });
    await queryInterface.addIndex('roles', ['is_active']);

    await queryInterface.addIndex('permissions', ['name'], { unique: true });
    await queryInterface.addIndex('permissions', ['code'], { unique: true });
    await queryInterface.addIndex('permissions', ['category']);
    await queryInterface.addIndex('permissions', ['action']);
    await queryInterface.addIndex('permissions', ['is_active']);

    await queryInterface.addIndex('role_permissions', ['role_id']);
    await queryInterface.addIndex('role_permissions', ['permission_id']);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('role_permissions');
    await queryInterface.dropTable('permissions');
    await queryInterface.dropTable('roles');
  },
};
