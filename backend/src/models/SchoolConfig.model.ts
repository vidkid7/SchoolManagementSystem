import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '@config/database';

export interface SchoolConfigAttributes {
  id: string;
  // School Information
  schoolNameEn: string;
  schoolNameNp?: string;
  schoolCode?: string;
  logoUrl?: string;
  addressEn?: string;
  addressNp?: string;
  phone?: string;
  email?: string;
  website?: string;
  // Academic Year Structure
  academicYearStartMonth: number;
  academicYearDurationMonths: number;
  termsPerYear: number;
  // Additional Settings
  defaultCalendarSystem: 'BS' | 'AD';
  defaultLanguage: 'nepali' | 'english';
  timezone: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  // Metadata
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SchoolConfigCreationAttributes
  extends Optional<
    SchoolConfigAttributes,
    | 'id'
    | 'schoolNameNp'
    | 'schoolCode'
    | 'logoUrl'
    | 'addressEn'
    | 'addressNp'
    | 'phone'
    | 'email'
    | 'website'
    | 'academicYearStartMonth'
    | 'academicYearDurationMonths'
    | 'termsPerYear'
    | 'defaultCalendarSystem'
    | 'defaultLanguage'
    | 'timezone'
    | 'currency'
    | 'dateFormat'
    | 'timeFormat'
    | 'numberFormat'
    | 'isActive'
    | 'createdAt'
    | 'updatedAt'
  > {}

export class SchoolConfig
  extends Model<SchoolConfigAttributes, SchoolConfigCreationAttributes>
  implements SchoolConfigAttributes
{
  public id!: string;
  public schoolNameEn!: string;
  public schoolNameNp?: string;
  public schoolCode?: string;
  public logoUrl?: string;
  public addressEn?: string;
  public addressNp?: string;
  public phone?: string;
  public email?: string;
  public website?: string;
  public academicYearStartMonth!: number;
  public academicYearDurationMonths!: number;
  public termsPerYear!: number;
  public defaultCalendarSystem!: 'BS' | 'AD';
  public defaultLanguage!: 'nepali' | 'english';
  public timezone!: string;
  public currency!: string;
  public dateFormat!: string;
  public timeFormat!: string;
  public numberFormat!: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SchoolConfig.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    schoolNameEn: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'school_name_en',
    },
    schoolNameNp: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'school_name_np',
    },
    schoolCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      field: 'school_code',
    },
    logoUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'logo_url',
    },
    addressEn: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'address_en',
    },
    addressNp: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'address_np',
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    academicYearStartMonth: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: 'academic_year_start_month',
    },
    academicYearDurationMonths: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 12,
      field: 'academic_year_duration_months',
    },
    termsPerYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
      field: 'terms_per_year',
    },
    defaultCalendarSystem: {
      type: DataTypes.ENUM('BS', 'AD'),
      allowNull: false,
      defaultValue: 'BS',
      field: 'default_calendar_system',
    },
    defaultLanguage: {
      type: DataTypes.ENUM('nepali', 'english'),
      allowNull: false,
      defaultValue: 'nepali',
      field: 'default_language',
    },
    timezone: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Asia/Kathmandu',
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'NPR',
    },
    dateFormat: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'YYYY-MM-DD',
      field: 'date_format',
    },
    timeFormat: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'HH:mm',
      field: 'time_format',
    },
    numberFormat: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'en-US',
      field: 'number_format',
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
    tableName: 'school_config',
    timestamps: true,
    underscored: true,
  }
);

export default SchoolConfig;
