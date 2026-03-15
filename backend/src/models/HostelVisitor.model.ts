import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

export interface HostelVisitorAttributes {
  id: number;
  residentStudentId: number;
  visitorName: string;
  relationship?: string;
  phone?: string;
  purpose?: string;
  visitDate?: Date;
  checkIn: Date;
  checkOut?: Date;
  status: 'checked-in' | 'checked-out';
  registeredBy?: number;
  schoolConfigId?: string;
  municipalityId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HostelVisitorCreationAttributes extends Optional<HostelVisitorAttributes,
  'id' | 'relationship' | 'phone' | 'purpose' | 'visitDate' | 'checkOut' | 'status' |
  'registeredBy' | 'schoolConfigId' | 'municipalityId' | 'createdAt' | 'updatedAt'> {}

class HostelVisitor extends Model<HostelVisitorAttributes, HostelVisitorCreationAttributes>
  implements HostelVisitorAttributes {
  declare id: number;
  declare residentStudentId: number;
  declare visitorName: string;
  declare relationship?: string;
  declare phone?: string;
  declare purpose?: string;
  declare visitDate?: Date;
  declare checkIn: Date;
  declare checkOut?: Date;
  declare status: 'checked-in' | 'checked-out';
  declare registeredBy?: number;
  declare schoolConfigId?: string;
  declare municipalityId?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

HostelVisitor.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    residentStudentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'resident_student_id',
    },
    visitorName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'visitor_name',
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
    visitDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'visit_date',
    },
    checkIn: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'check_in',
    },
    checkOut: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'check_out',
    },
    status: {
      type: DataTypes.ENUM('checked-in', 'checked-out'),
      allowNull: false,
      defaultValue: 'checked-in',
    },
    registeredBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'registered_by',
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
    tableName: 'hostel_visitors',
    modelName: 'HostelVisitor',
    timestamps: true,
    paranoid: false,
    underscored: true,
    indexes: [
      { fields: ['resident_student_id'] },
      { fields: ['status'] },
      { fields: ['visit_date'] },
      { fields: ['check_in'] },
      { fields: ['school_config_id'] },
      { fields: ['municipality_id'] },
    ],
  }
);

export default HostelVisitor;
