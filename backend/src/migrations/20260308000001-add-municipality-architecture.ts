import { DataTypes, QueryInterface } from 'sequelize';

const LEGACY_USER_ROLES = [
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
  'Non_Teaching_Staff',
];

const EXTENDED_USER_ROLES = ['Municipality_Admin', ...LEGACY_USER_ROLES];

function normalizeTableName(table: unknown): string {
  if (typeof table === 'string') {
    return table;
  }

  if (table && typeof table === 'object') {
    const values = Object.values(table as Record<string, string>);
    if (values.length > 0 && typeof values[0] === 'string') {
      return values[0];
    }
  }

  return '';
}

async function hasTable(queryInterface: QueryInterface, tableName: string): Promise<boolean> {
  const tables = await queryInterface.showAllTables();
  return tables.map(normalizeTableName).includes(tableName);
}

async function hasColumn(
  queryInterface: QueryInterface,
  tableName: string,
  columnName: string
): Promise<boolean> {
  try {
    const description = await queryInterface.describeTable(tableName);
    return Object.prototype.hasOwnProperty.call(description, columnName);
  } catch {
    return false;
  }
}

async function addIndexIfMissing(
  queryInterface: QueryInterface,
  tableName: string,
  fields: string[],
  indexName: string
): Promise<void> {
  const indexes = (await queryInterface.showIndex(tableName)) as Array<{ name: string }>;
  const exists = indexes.some((index: any) => index.name === indexName);
  if (!exists) {
    await queryInterface.addIndex(tableName, fields, { name: indexName });
  }
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  if (await hasTable(queryInterface, 'users')) {
    await queryInterface.changeColumn('users', 'role', {
      type: DataTypes.ENUM(...EXTENDED_USER_ROLES),
      allowNull: false,
    });
  }

  if (!(await hasTable(queryInterface, 'municipalities'))) {
    await queryInterface.createTable('municipalities', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name_en: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      name_np: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      district: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      province: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      contact_phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      contact_email: {
        type: DataTypes.STRING(255),
        allowNull: true,
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
  }

  if (await hasTable(queryInterface, 'municipalities')) {
    await addIndexIfMissing(queryInterface, 'municipalities', ['district'], 'idx_municipalities_district');
    await addIndexIfMissing(queryInterface, 'municipalities', ['is_active'], 'idx_municipalities_is_active');
  }

  if (
    (await hasTable(queryInterface, 'users')) &&
    !(await hasColumn(queryInterface, 'users', 'municipality_id'))
  ) {
    await queryInterface.addColumn('users', 'municipality_id', {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'municipalities',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  }

  if (
    (await hasTable(queryInterface, 'users')) &&
    !(await hasColumn(queryInterface, 'users', 'school_config_id')) &&
    (await hasTable(queryInterface, 'school_config'))
  ) {
    await queryInterface.addColumn('users', 'school_config_id', {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'school_config',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  }

  if (
    (await hasTable(queryInterface, 'school_config')) &&
    !(await hasColumn(queryInterface, 'school_config', 'municipality_id'))
  ) {
    await queryInterface.addColumn('school_config', 'municipality_id', {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'municipalities',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  }

  if (await hasTable(queryInterface, 'users')) {
    await addIndexIfMissing(queryInterface, 'users', ['municipality_id'], 'idx_users_municipality_id');
    if (await hasColumn(queryInterface, 'users', 'school_config_id')) {
      await addIndexIfMissing(queryInterface, 'users', ['school_config_id'], 'idx_users_school_config_id');
    }
  }

  if (await hasTable(queryInterface, 'school_config')) {
    await addIndexIfMissing(
      queryInterface,
      'school_config',
      ['municipality_id'],
      'idx_school_config_municipality_id'
    );
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  if (await hasTable(queryInterface, 'school_config')) {
    if (await hasColumn(queryInterface, 'school_config', 'municipality_id')) {
      await queryInterface.removeColumn('school_config', 'municipality_id');
    }
  }

  if (await hasTable(queryInterface, 'users')) {
    if (await hasColumn(queryInterface, 'users', 'school_config_id')) {
      await queryInterface.removeColumn('users', 'school_config_id');
    }
    if (await hasColumn(queryInterface, 'users', 'municipality_id')) {
      await queryInterface.removeColumn('users', 'municipality_id');
    }

    await queryInterface.changeColumn('users', 'role', {
      type: DataTypes.ENUM(...LEGACY_USER_ROLES),
      allowNull: false,
    });
  }

  if (await hasTable(queryInterface, 'municipalities')) {
    await queryInterface.dropTable('municipalities');
  }
}
