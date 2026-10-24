import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

export interface StudentTransferHistoryAttributes {
  studentTransferHistoryId: number;
  studentId: number;
  fromClassId?: number | null;
  toClassId?: number | null;
  fromRollNumber?: number | null;
  toRollNumber?: number | null;
  reason?: string | null;
  transferredBy?: number | null;
  transferredAt: Date;
  municipalityId?: string | null;
  schoolConfigId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type StudentTransferHistoryCreationAttributes = Optional<StudentTransferHistoryAttributes,
  'studentTransferHistoryId' | 'fromClassId' | 'fromRollNumber' | 'toRollNumber' | 'reason' |
  'transferredBy' | 'transferredAt' | 'municipalityId' | 'schoolConfigId' | 'createdAt' | 'updatedAt'>;

class StudentTransferHistory extends Model<StudentTransferHistoryAttributes, StudentTransferHistoryCreationAttributes>
  implements StudentTransferHistoryAttributes {
  declare studentTransferHistoryId: number;
  declare studentId: number;
  declare fromClassId?: number | null;
  declare toClassId?: number | null;
  declare fromRollNumber?: number | null;
  declare toRollNumber?: number | null;
  declare reason?: string | null;
  declare transferredBy?: number | null;
  declare transferredAt: Date;
  declare municipalityId?: string | null;
  declare schoolConfigId?: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

StudentTransferHistory.init({
  studentTransferHistoryId: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, field: 'student_transfer_history_id' },
  studentId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'student_id', references: { model: 'students', key: 'student_id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
  fromClassId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'from_class_id', references: { model: 'classes', key: 'class_id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
  toClassId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'to_class_id', references: { model: 'classes', key: 'class_id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
  fromRollNumber: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'from_roll_number' },
  toRollNumber: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'to_roll_number' },
  reason: { type: DataTypes.STRING(500), allowNull: true },
  transferredBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'transferred_by', references: { model: 'users', key: 'user_id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
  transferredAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'transferred_at' },
  municipalityId: { type: DataTypes.UUID, allowNull: true, field: 'municipality_id' },
  schoolConfigId: { type: DataTypes.UUID, allowNull: true, field: 'school_config_id' },
}, {
  sequelize,
  tableName: 'student_transfer_history',
  modelName: 'StudentTransferHistory',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['student_id', 'transferred_at'] },
    { fields: ['school_config_id', 'student_id'] },
  ],
});

export default StudentTransferHistory;
