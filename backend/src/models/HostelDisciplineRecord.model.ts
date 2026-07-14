import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

export type HostelDisciplineSeverity = 'minor' | 'moderate' | 'major';
export type HostelDisciplineStatus = 'open' | 'resolved';

export interface HostelDisciplineRecordAttributes {
  id: number;
  studentId: number;
  violation: string;
  description?: string;
  action?: string;
  severity: HostelDisciplineSeverity;
  date: string;
  status: HostelDisciplineStatus;
  recordedBy?: number;
  schoolConfigId?: string;
  municipalityId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HostelDisciplineRecordCreationAttributes extends Optional<
  HostelDisciplineRecordAttributes,
  'id' | 'description' | 'action' | 'severity' | 'date' | 'status' |
  'recordedBy' | 'schoolConfigId' | 'municipalityId' | 'createdAt' | 'updatedAt'
> {}

class HostelDisciplineRecord
  extends Model<HostelDisciplineRecordAttributes, HostelDisciplineRecordCreationAttributes>
  implements HostelDisciplineRecordAttributes {
  declare id: number;
  declare studentId: number;
  declare violation: string;
  declare description?: string;
  declare action?: string;
  declare severity: HostelDisciplineSeverity;
  declare date: string;
  declare status: HostelDisciplineStatus;
  declare recordedBy?: number;
  declare schoolConfigId?: string;
  declare municipalityId?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

HostelDisciplineRecord.init(
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
    violation: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    action: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    severity: {
      type: DataTypes.ENUM('minor', 'moderate', 'major'),
      allowNull: false,
      defaultValue: 'minor',
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM('open', 'resolved'),
      allowNull: false,
      defaultValue: 'open',
    },
    recordedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'recorded_by',
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
    tableName: 'hostel_discipline_records',
    modelName: 'HostelDisciplineRecord',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['student_id'] },
      { fields: ['severity'] },
      { fields: ['status'] },
      { fields: ['date'] },
      { fields: ['recorded_by'] },
      { fields: ['school_config_id'] },
      { fields: ['municipality_id'] },
    ],
  }
);

export default HostelDisciplineRecord;
