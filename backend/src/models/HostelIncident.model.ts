import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

export interface HostelIncidentAttributes {
  id: number;
  title: string;
  type?: string;
  description: string;
  studentsInvolved?: object[];
  date: Date;
  severity: 'low' | 'medium' | 'high';
  actionTaken?: string;
  resolution?: string;
  reportedBy?: number;
  status: 'open' | 'resolved';
  schoolConfigId?: string;
  municipalityId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HostelIncidentCreationAttributes extends Optional<HostelIncidentAttributes,
  'id' | 'type' | 'studentsInvolved' | 'severity' | 'actionTaken' | 'resolution' |
  'reportedBy' | 'status' | 'schoolConfigId' | 'municipalityId' | 'createdAt' | 'updatedAt'> {}

class HostelIncident extends Model<HostelIncidentAttributes, HostelIncidentCreationAttributes>
  implements HostelIncidentAttributes {
  declare id: number;
  declare title: string;
  declare type?: string;
  declare description: string;
  declare studentsInvolved?: object[];
  declare date: Date;
  declare severity: 'low' | 'medium' | 'high';
  declare actionTaken?: string;
  declare resolution?: string;
  declare reportedBy?: number;
  declare status: 'open' | 'resolved';
  declare schoolConfigId?: string;
  declare municipalityId?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

HostelIncident.init(
  {
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
    studentsInvolved: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      field: 'students_involved',
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
    actionTaken: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'action_taken',
    },
    resolution: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reportedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'reported_by',
    },
    status: {
      type: DataTypes.ENUM('open', 'resolved'),
      allowNull: false,
      defaultValue: 'open',
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
    tableName: 'hostel_incidents',
    modelName: 'HostelIncident',
    timestamps: true,
    paranoid: false,
    underscored: true,
    indexes: [
      { fields: ['status'] },
      { fields: ['severity'] },
      { fields: ['date'] },
      { fields: ['reported_by'] },
      { fields: ['school_config_id'] },
      { fields: ['municipality_id'] },
    ],
  }
);

export default HostelIncident;
