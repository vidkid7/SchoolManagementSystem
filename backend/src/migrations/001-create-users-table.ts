import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Create Users Table
 * Creates the users table with all required fields for authentication
 */

// eslint-disable-next-line max-lines-per-function
export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('users', {
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM(
        'School_Admin',
        'Subject_Teacher',
        'Class_Teacher',
        'Department_Head',
        'ECA_Coordinator',
        'Sports_Coordinator',
        'Student',
        'Parent',
        'Librarian',
        'Accountant',
        'Transport_Manager',
        'Hostel_Warden',
        'Non_Teaching_Staff'
      ),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended', 'locked'),
      allowNull: false,
      defaultValue: 'active'
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    profile_photo: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    failed_login_attempts: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    account_locked_until: {
      type: DataTypes.DATE,
      allowNull: true
    },
    password_changed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    refresh_token_expires_at: {
      type: DataTypes.DATE,
      allowNull: true
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
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  });

  // Create indexes (check if they exist first to avoid duplicate key errors)
  const indexes = await queryInterface.showIndex('users') as any[];
  const indexNames = indexes.map((idx: any) => idx.name);

  if (!indexNames.includes('idx_users_username')) {
    await queryInterface.addIndex('users', ['username'], {
      unique: true,
      name: 'idx_users_username'
    });
  }

  if (!indexNames.includes('idx_users_email')) {
    await queryInterface.addIndex('users', ['email'], {
      unique: true,
      name: 'idx_users_email'
    });
  }

  if (!indexNames.includes('idx_users_role')) {
    await queryInterface.addIndex('users', ['role'], {
      name: 'idx_users_role'
    });
  }

  if (!indexNames.includes('idx_users_status')) {
    await queryInterface.addIndex('users', ['status'], {
      name: 'idx_users_status'
    });
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('users');
}
