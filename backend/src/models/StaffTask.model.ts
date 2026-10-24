import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

export type StaffTaskStatus = 'pending' | 'in_progress' | 'completed';
export type StaffTaskPriority = 'low' | 'medium' | 'high';

export interface StaffTaskAttributes {
  id: number;
  title: string;
  description: string;
  assignedTo: number;
  assignedBy: number;
  dueDate?: Date | null;
  priority: StaffTaskPriority;
  category: string;
  status: StaffTaskStatus;
  completionNote?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type StaffTaskCreationAttributes = Optional<StaffTaskAttributes,
  'id' | 'description' | 'dueDate' | 'priority' | 'category' | 'status' | 'completionNote' | 'createdAt' | 'updatedAt'>;

class StaffTask extends Model<StaffTaskAttributes, StaffTaskCreationAttributes> implements StaffTaskAttributes {
  declare id: number;
  declare title: string;
  declare description: string;
  declare assignedTo: number;
  declare assignedBy: number;
  declare dueDate?: Date | null;
  declare priority: StaffTaskPriority;
  declare category: string;
  declare status: StaffTaskStatus;
  declare completionNote?: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

StaffTask.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, field: 'staff_task_id' },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
  assignedTo: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'assigned_to', references: { model: 'users', key: 'user_id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
  assignedBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'assigned_by', references: { model: 'users', key: 'user_id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' },
  dueDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'due_date' },
  priority: { type: DataTypes.ENUM('low', 'medium', 'high'), allowNull: false, defaultValue: 'medium' },
  category: { type: DataTypes.STRING(100), allowNull: false, defaultValue: 'general' },
  status: { type: DataTypes.ENUM('pending', 'in_progress', 'completed'), allowNull: false, defaultValue: 'pending' },
  completionNote: { type: DataTypes.TEXT, allowNull: true, field: 'completion_note' },
}, {
  sequelize,
  tableName: 'staff_tasks',
  modelName: 'StaffTask',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['assigned_to', 'status'] },
    { fields: ['assigned_by'] },
    { fields: ['due_date'] },
  ],
});

export default StaffTask;
