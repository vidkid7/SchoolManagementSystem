import { DataTypes, Model } from 'sequelize';
import sequelize from '@config/database';
import Role from './Role.model';
import Permission from './Permission.model';

/**
 * RolePermission Attributes Interface
 */
export interface RolePermissionAttributes {
  roleId: string;
  permissionId: string;
  createdAt?: Date;
}

/**
 * RolePermission Model Class
 * Junction table for many-to-many relationship between Roles and Permissions
 */
class RolePermission extends Model<RolePermissionAttributes> implements RolePermissionAttributes {
  public roleId!: string;
  public permissionId!: string;

  // Timestamps
  public readonly createdAt!: Date;
}

/**
 * Initialize RolePermission Model
 */
RolePermission.init(
  {
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      field: 'role_id',
      references: {
        model: 'roles',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    permissionId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      field: 'permission_id',
      references: {
        model: 'permissions',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
  },
  {
    sequelize,
    tableName: 'role_permissions',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        fields: ['role_id'],
      },
      {
        fields: ['permission_id'],
      },
    ],
  }
);

// Define associations
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'roleId',
  otherKey: 'permissionId',
  as: 'permissions',
});

Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permissionId',
  otherKey: 'roleId',
  as: 'roles',
});

export default RolePermission;
