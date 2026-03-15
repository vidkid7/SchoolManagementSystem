import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

export interface HostelRoomAttributes {
  id: number;
  roomNumber: string;
  floor?: number;
  type: 'single' | 'double' | 'dormitory';
  capacity: number;
  description?: string;
  status: 'available' | 'occupied' | 'maintenance';
  schoolConfigId?: string;
  municipalityId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface HostelRoomCreationAttributes extends Optional<HostelRoomAttributes,
  'id' | 'floor' | 'description' | 'status' | 'schoolConfigId' | 'municipalityId' |
  'createdAt' | 'updatedAt' | 'deletedAt'> {}

class HostelRoom extends Model<HostelRoomAttributes, HostelRoomCreationAttributes>
  implements HostelRoomAttributes {
  declare id: number;
  declare roomNumber: string;
  declare floor?: number;
  declare type: 'single' | 'double' | 'dormitory';
  declare capacity: number;
  declare description?: string;
  declare status: 'available' | 'occupied' | 'maintenance';
  declare schoolConfigId?: string;
  declare municipalityId?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt?: Date;
}

HostelRoom.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    roomNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'room_number',
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
    schoolConfigId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'school_config_id',
    },
    municipalityId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'municipality_id',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
  },
  {
    sequelize,
    tableName: 'hostel_rooms',
    modelName: 'HostelRoom',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      { fields: ['room_number'] },
      { fields: ['status'] },
      { fields: ['type'] },
      { fields: ['school_config_id'] },
      { fields: ['municipality_id'] },
    ],
  }
);

export default HostelRoom;
