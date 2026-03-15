import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  // ─── hostel_rooms ───
  await queryInterface.createTable('hostel_rooms', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    room_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    floor: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
    type: {
      type: DataTypes.ENUM('single', 'double', 'dormitory'),
      allowNull: false,
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('available', 'occupied', 'maintenance'),
      allowNull: false,
      defaultValue: 'available',
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
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  // ─── hostel_residents ───
  await queryInterface.createTable('hostel_residents', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    student_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    room_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'hostel_rooms',
        key: 'id',
      },
    },
    bed_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    check_in_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    check_out_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
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

  // ─── hostel_incidents ───
  await queryInterface.createTable('hostel_incidents', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    students_involved: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'low',
    },
    action_taken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    resolution: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reported_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('open', 'resolved'),
      allowNull: false,
      defaultValue: 'open',
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

  // ─── hostel_visitors ───
  await queryInterface.createTable('hostel_visitors', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    resident_student_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    visitor_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    relationship: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    purpose: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    visit_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    check_in: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    check_out: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('checked-in', 'checked-out'),
      allowNull: false,
      defaultValue: 'checked-in',
    },
    registered_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
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

  // ─── Indexes ───
  const roomIdxs = await queryInterface.showIndex('hostel_rooms') as any[];
  const roomIdxNames = roomIdxs.map((i: any) => i.name);
  for (const idx of [
    { name: 'idx_hostel_rooms_room_number', fields: ['room_number'] },
    { name: 'idx_hostel_rooms_status', fields: ['status'] },
    { name: 'idx_hostel_rooms_type', fields: ['type'] },
    { name: 'idx_hostel_rooms_school_config_id', fields: ['school_config_id'] },
    { name: 'idx_hostel_rooms_municipality_id', fields: ['municipality_id'] },
  ]) {
    if (!roomIdxNames.includes(idx.name)) {
      await queryInterface.addIndex('hostel_rooms', idx.fields, { name: idx.name });
    }
  }

  const resIdxs = await queryInterface.showIndex('hostel_residents') as any[];
  const resIdxNames = resIdxs.map((i: any) => i.name);
  for (const idx of [
    { name: 'idx_hostel_residents_student_id', fields: ['student_id'] },
    { name: 'idx_hostel_residents_room_id', fields: ['room_id'] },
    { name: 'idx_hostel_residents_status', fields: ['status'] },
    { name: 'idx_hostel_residents_school_config_id', fields: ['school_config_id'] },
    { name: 'idx_hostel_residents_municipality_id', fields: ['municipality_id'] },
  ]) {
    if (!resIdxNames.includes(idx.name)) {
      await queryInterface.addIndex('hostel_residents', idx.fields, { name: idx.name });
    }
  }

  const incIdxs = await queryInterface.showIndex('hostel_incidents') as any[];
  const incIdxNames = incIdxs.map((i: any) => i.name);
  for (const idx of [
    { name: 'idx_hostel_incidents_status', fields: ['status'] },
    { name: 'idx_hostel_incidents_severity', fields: ['severity'] },
    { name: 'idx_hostel_incidents_date', fields: ['date'] },
    { name: 'idx_hostel_incidents_school_config_id', fields: ['school_config_id'] },
    { name: 'idx_hostel_incidents_municipality_id', fields: ['municipality_id'] },
  ]) {
    if (!incIdxNames.includes(idx.name)) {
      await queryInterface.addIndex('hostel_incidents', idx.fields, { name: idx.name });
    }
  }

  const visIdxs = await queryInterface.showIndex('hostel_visitors') as any[];
  const visIdxNames = visIdxs.map((i: any) => i.name);
  for (const idx of [
    { name: 'idx_hostel_visitors_resident_student_id', fields: ['resident_student_id'] },
    { name: 'idx_hostel_visitors_status', fields: ['status'] },
    { name: 'idx_hostel_visitors_visit_date', fields: ['visit_date'] },
    { name: 'idx_hostel_visitors_school_config_id', fields: ['school_config_id'] },
    { name: 'idx_hostel_visitors_municipality_id', fields: ['municipality_id'] },
  ]) {
    if (!visIdxNames.includes(idx.name)) {
      await queryInterface.addIndex('hostel_visitors', idx.fields, { name: idx.name });
    }
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('hostel_visitors');
  await queryInterface.dropTable('hostel_incidents');
  await queryInterface.dropTable('hostel_residents');
  await queryInterface.dropTable('hostel_rooms');
}
