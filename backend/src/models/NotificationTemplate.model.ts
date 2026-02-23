import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '@config/database';

export interface NotificationTemplateAttributes {
  id: string;
  name: string;
  code: string;
  description?: string;
  category: 'attendance' | 'exam' | 'fee' | 'grade' | 'announcement' | 'leave' | 'library' | 'general';
  channel: 'sms' | 'email' | 'push' | 'in_app';
  language: 'nepali' | 'english';
  subject?: string;
  templateEn: string;
  templateNp?: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationTemplateCreationAttributes
  extends Optional<
    NotificationTemplateAttributes,
    | 'id'
    | 'description'
    | 'subject'
    | 'templateNp'
    | 'variables'
    | 'isActive'
    | 'createdAt'
    | 'updatedAt'
  > {}

export class NotificationTemplate
  extends Model<NotificationTemplateAttributes, NotificationTemplateCreationAttributes>
  implements NotificationTemplateAttributes
{
  public id!: string;
  public name!: string;
  public code!: string;
  public description?: string;
  public category!: 'attendance' | 'exam' | 'fee' | 'grade' | 'announcement' | 'leave' | 'library' | 'general';
  public channel!: 'sms' | 'email' | 'push' | 'in_app';
  public language!: 'nepali' | 'english';
  public subject?: string;
  public templateEn!: string;
  public templateNp?: string;
  public variables!: string[];
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

NotificationTemplate.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.ENUM('attendance', 'exam', 'fee', 'grade', 'announcement', 'leave', 'library', 'general'),
      allowNull: false,
    },
    channel: {
      type: DataTypes.ENUM('sms', 'email', 'push', 'in_app'),
      allowNull: false,
    },
    language: {
      type: DataTypes.ENUM('nepali', 'english'),
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    templateEn: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'template_en',
    },
    templateNp: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'template_np',
    },
    variables: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
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
    tableName: 'notification_templates',
    timestamps: true,
    underscored: true,
  }
);

export default NotificationTemplate;
