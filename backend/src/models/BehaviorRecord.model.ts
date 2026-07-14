import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

export type BehaviorRecordType = 'positive' | 'negative' | 'neutral';

export interface BehaviorRecordAttributes {
  id: number;
  studentId: number;
  type: BehaviorRecordType;
  category: string;
  description: string;
  actionTaken?: string;
  recordedBy?: number;
  date: Date;
  schoolConfigId?: string;
  municipalityId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BehaviorRecordCreationAttributes extends Optional<
  BehaviorRecordAttributes,
  'id' | 'type' | 'category' | 'actionTaken' | 'recordedBy' | 'date' |
  'schoolConfigId' | 'municipalityId' | 'createdAt' | 'updatedAt'
> {}

class BehaviorRecord extends Model<BehaviorRecordAttributes, BehaviorRecordCreationAttributes>
  implements BehaviorRecordAttributes {
  declare id: number;
  declare studentId: number;
  declare type: BehaviorRecordType;
  declare category: string;
  declare description: string;
  declare actionTaken?: string;
  declare recordedBy?: number;
  declare date: Date;
  declare schoolConfigId?: string;
  declare municipalityId?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

BehaviorRecord.init(
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
    type: {
      type: DataTypes.ENUM('positive', 'negative', 'neutral'),
      allowNull: false,
      defaultValue: 'neutral',
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'other',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    actionTaken: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'action_taken',
    },
    recordedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'recorded_by',
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
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
    tableName: 'behavior_records',
    modelName: 'BehaviorRecord',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['student_id'] },
      { fields: ['recorded_by'] },
      { fields: ['type'] },
      { fields: ['category'] },
      { fields: ['date'] },
      { fields: ['school_config_id'] },
      { fields: ['municipality_id'] },
    ],
  }
);

export default BehaviorRecord;
