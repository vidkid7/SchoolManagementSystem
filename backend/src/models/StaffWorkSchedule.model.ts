import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

export interface StaffWorkScheduleAttributes {
  id: number;
  userId: number;
  date: string;
  shiftStart: string;
  shiftEnd: string;
  location: string;
  notes: string;
  updatedBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type StaffWorkScheduleCreationAttributes = Optional<StaffWorkScheduleAttributes,
  'id' | 'shiftStart' | 'shiftEnd' | 'location' | 'notes' | 'createdAt' | 'updatedAt'>;

class StaffWorkSchedule extends Model<StaffWorkScheduleAttributes, StaffWorkScheduleCreationAttributes> implements StaffWorkScheduleAttributes {
  declare id: number;
  declare userId: number;
  declare date: string;
  declare shiftStart: string;
  declare shiftEnd: string;
  declare location: string;
  declare notes: string;
  declare updatedBy: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

StaffWorkSchedule.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, field: 'staff_work_schedule_id' },
  userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'user_id', references: { model: 'users', key: 'user_id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  shiftStart: { type: DataTypes.TIME, allowNull: false, defaultValue: '08:00:00', field: 'shift_start' },
  shiftEnd: { type: DataTypes.TIME, allowNull: false, defaultValue: '17:00:00', field: 'shift_end' },
  location: { type: DataTypes.STRING(200), allowNull: false, defaultValue: '' },
  notes: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
  updatedBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'updated_by', references: { model: 'users', key: 'user_id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' },
}, {
  sequelize,
  tableName: 'staff_work_schedules',
  modelName: 'StaffWorkSchedule',
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ['user_id', 'date'] },
    { fields: ['date'] },
  ],
});

export default StaffWorkSchedule;
