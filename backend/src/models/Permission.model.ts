import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

/**
 * Permission Categories
 */
export enum PermissionCategory {
  STUDENT = 'student',
  STAFF = 'staff',
  ACADEMIC = 'academic',
  ATTENDANCE = 'attendance',
  EXAMINATION = 'examination',
  FINANCE = 'finance',
  LIBRARY = 'library',
  TRANSPORT = 'transport',
  HOSTEL = 'hostel',
  ECA = 'eca',
  SPORTS = 'sports',
  COMMUNICATION = 'communication',
  DOCUMENT = 'document',
  CERTIFICATE = 'certificate',
  REPORT = 'report',
  SYSTEM = 'system',
}

/**
 * Permission Actions
 */
export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
}

/**
 * Permission Attributes Interface
 */
export interface PermissionAttributes {
  id: string;
  name: string;
  code: string;
  description?: string;
  category: PermissionCategory;
  action: PermissionAction;
  resource: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Permission Creation Attributes
 */
export interface PermissionCreationAttributes extends Optional<PermissionAttributes, 
  'id' | 'isSystem' | 'isActive' | 'createdAt' | 'updatedAt'> {}

/**
 * Permission Model Class
 */
class Permission extends Model<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
  public id!: string;
  public name!: string;
  public code!: string;
  public description?: string;
  public category!: PermissionCategory;
  public action!: PermissionAction;
  public resource!: string;
  public isSystem!: boolean;
  public isActive!: boolean;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

/**
 * Initialize Permission Model
 */
Permission.init(
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
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        is: /^[a-z_:]+$/,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.ENUM(...Object.values(PermissionCategory)),
      allowNull: false,
    },
    action: {
      type: DataTypes.ENUM(...Object.values(PermissionAction)),
      allowNull: false,
    },
    resource: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'The resource this permission applies to (e.g., student, class, invoice)',
    },
    isSystem: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_system',
      comment: 'System permissions cannot be deleted or modified',
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
    tableName: 'permissions',
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
        fields: ['category'],
      },
      {
        fields: ['action'],
      },
      {
        fields: ['is_active'],
      },
    ],
  }
);

export default Permission;
