import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

/**
 * Role Attributes Interface
 */
export interface RoleAttributes {
  id: string;
  name: string;
  code: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Role Creation Attributes
 */
export interface RoleCreationAttributes extends Optional<RoleAttributes, 
  'id' | 'isSystem' | 'isActive' | 'createdAt' | 'updatedAt'> {}

/**
 * Role Model Class
 */
class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  public id!: string;
  public name!: string;
  public code!: string;
  public description?: string;
  public isSystem!: boolean;
  public isActive!: boolean;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

/**
 * Initialize Role Model
 */
Role.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        is: /^[A-Z_]+$/,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isSystem: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_system',
      comment: 'System roles cannot be deleted or modified',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
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
    tableName: 'roles',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['name'],
      },
      {
        unique: true,
        fields: ['code'],
      },
      {
        fields: ['is_active'],
      },
    ],
  }
);

export default Role;
