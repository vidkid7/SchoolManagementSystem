import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

export interface HostelResidentAttributes {
  id: number;
  studentId: number;
  roomId: number;
  bedNumber?: string;
  checkInDate: Date;
  checkOutDate?: Date;
  notes?: string;
  status: 'active' | 'inactive';
  schoolConfigId?: string;
  municipalityId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HostelResidentCreationAttributes extends Optional<HostelResidentAttributes,
  'id' | 'bedNumber' | 'checkOutDate' | 'notes' | 'status' |
  'schoolConfigId' | 'municipalityId' | 'createdAt' | 'updatedAt'> {}

class HostelResident extends Model<HostelResidentAttributes, HostelResidentCreationAttributes>
  implements HostelResidentAttributes {
  declare id: number;
  declare studentId: number;
  declare roomId: number;
  declare bedNumber?: string;
  declare checkInDate: Date;
  declare checkOutDate?: Date;
  declare notes?: string;
  declare status: 'active' | 'inactive';
  declare schoolConfigId?: string;
  declare municipalityId?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

HostelResident.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'student_id',
    },
    roomId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'room_id',
    },
    bedNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'bed_number',
    },
    checkInDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'check_in_date',
    },
    checkOutDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'check_out_date',
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
  },
  {
    sequelize,
    tableName: 'hostel_residents',
    modelName: 'HostelResident',
    timestamps: true,
    paranoid: false,
    underscored: true,
    indexes: [
      { fields: ['student_id'] },
      { fields: ['room_id'] },
      { fields: ['status'] },
      { fields: ['school_config_id'] },
      { fields: ['municipality_id'] },
    ],
  }
);

export default HostelResident;
