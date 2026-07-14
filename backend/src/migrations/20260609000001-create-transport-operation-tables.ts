import { DataTypes, QueryInterface } from 'sequelize';

function normalizeTableName(table: unknown): string {
  if (typeof table === 'string') return table;
  if (table && typeof table === 'object') {
    const values = Object.values(table as Record<string, string>);
    if (typeof values[0] === 'string') return values[0];
  }
  return '';
}

async function hasTable(queryInterface: QueryInterface, tableName: string): Promise<boolean> {
  const tables = await queryInterface.showAllTables();
  return tables.map(normalizeTableName).includes(tableName);
}

async function hasIndex(
  queryInterface: QueryInterface,
  tableName: string,
  indexName: string
): Promise<boolean> {
  if (!(await hasTable(queryInterface, tableName))) return false;
  const indexes = (await queryInterface.showIndex(tableName)) as Array<{ name: string }>;
  return indexes.some((index) => index.name === indexName);
}

async function addIndexIfMissing(
  queryInterface: QueryInterface,
  tableName: string,
  fields: string[],
  name: string,
  unique = false
): Promise<void> {
  if (!(await hasIndex(queryInterface, tableName, name))) {
    await queryInterface.addIndex(tableName, fields, { name, unique });
  }
}

const auditColumns = {
  school_config_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  municipality_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.INTEGER.UNSIGNED,
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
};

export async function up(queryInterface: QueryInterface): Promise<void> {
  if (!(await hasTable(queryInterface, 'transport_routes'))) {
    await queryInterface.createTable('transport_routes', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      route_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      origin: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      destination: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      stops: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      vehicle_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      driver_name: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
      driver_phone: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      departure_time: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      arrival_time: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'active',
      },
      student_count: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      ...auditColumns,
    });
  }

  if (!(await hasTable(queryInterface, 'transport_vehicles'))) {
    await queryInterface.createTable('transport_vehicles', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      vehicle_number: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING(60),
        allowNull: false,
      },
      capacity: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 40,
      },
      driver_name: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
      driver_phone: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      insurance_expiry: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      registration_expiry: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'active',
      },
      ...auditColumns,
    });
  }

  if (!(await hasTable(queryInterface, 'transport_pickup_points'))) {
    await queryInterface.createTable('transport_pickup_points', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      address: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      longitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      route_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      estimated_time: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'active',
      },
      ...auditColumns,
    });
  }

  if (!(await hasTable(queryInterface, 'transport_drivers'))) {
    await queryInterface.createTable('transport_drivers', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(160),
        allowNull: false,
      },
      license_number: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      license_expiry: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      address: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      assigned_vehicle_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'active',
      },
      ...auditColumns,
    });
  }

  if (!(await hasTable(queryInterface, 'transport_maintenance_records'))) {
    await queryInterface.createTable('transport_maintenance_records', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      vehicle_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      next_due_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'scheduled',
      },
      ...auditColumns,
    });
  }

  if (!(await hasTable(queryInterface, 'transport_attendance'))) {
    await queryInterface.createTable('transport_attendance', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      route_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      student_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'present',
      },
      marked_by: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      marked_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      school_config_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      municipality_id: {
        type: DataTypes.UUID,
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
  }

  await addIndexIfMissing(queryInterface, 'transport_routes', ['route_name'], 'idx_transport_routes_route_name');
  await addIndexIfMissing(queryInterface, 'transport_routes', ['vehicle_id'], 'idx_transport_routes_vehicle_id');
  await addIndexIfMissing(queryInterface, 'transport_routes', ['status'], 'idx_transport_routes_status');
  await addIndexIfMissing(queryInterface, 'transport_routes', ['municipality_id'], 'idx_transport_routes_municipality_id');
  await addIndexIfMissing(queryInterface, 'transport_vehicles', ['vehicle_number'], 'idx_transport_vehicles_vehicle_number', true);
  await addIndexIfMissing(queryInterface, 'transport_vehicles', ['status'], 'idx_transport_vehicles_status');
  await addIndexIfMissing(queryInterface, 'transport_vehicles', ['municipality_id'], 'idx_transport_vehicles_municipality_id');
  await addIndexIfMissing(queryInterface, 'transport_pickup_points', ['route_id'], 'idx_transport_pickup_route_id');
  await addIndexIfMissing(queryInterface, 'transport_pickup_points', ['name'], 'idx_transport_pickup_name');
  await addIndexIfMissing(queryInterface, 'transport_pickup_points', ['municipality_id'], 'idx_transport_pickup_municipality_id');
  await addIndexIfMissing(queryInterface, 'transport_drivers', ['license_number'], 'idx_transport_drivers_license_number', true);
  await addIndexIfMissing(queryInterface, 'transport_drivers', ['assigned_vehicle_id'], 'idx_transport_drivers_assigned_vehicle_id');
  await addIndexIfMissing(queryInterface, 'transport_drivers', ['municipality_id'], 'idx_transport_drivers_municipality_id');
  await addIndexIfMissing(queryInterface, 'transport_maintenance_records', ['vehicle_id'], 'idx_transport_maintenance_vehicle_id');
  await addIndexIfMissing(queryInterface, 'transport_maintenance_records', ['date'], 'idx_transport_maintenance_date');
  await addIndexIfMissing(queryInterface, 'transport_maintenance_records', ['municipality_id'], 'idx_transport_maintenance_municipality_id');
  await addIndexIfMissing(queryInterface, 'transport_attendance', ['date'], 'idx_transport_attendance_date');
  await addIndexIfMissing(queryInterface, 'transport_attendance', ['student_id'], 'idx_transport_attendance_student_id');
  await addIndexIfMissing(queryInterface, 'transport_attendance', ['date', 'student_id'], 'idx_transport_attendance_date_student_unique', true);
  await addIndexIfMissing(queryInterface, 'transport_attendance', ['municipality_id'], 'idx_transport_attendance_municipality_id');
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  for (const tableName of [
    'transport_attendance',
    'transport_maintenance_records',
    'transport_pickup_points',
    'transport_routes',
    'transport_drivers',
    'transport_vehicles',
  ]) {
    if (await hasTable(queryInterface, tableName)) {
      await queryInterface.dropTable(tableName);
    }
  }
}
