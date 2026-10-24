import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '@config/database';

export interface SchoolConfigAttributes {
  id: string;
  municipalityId?: string;
  // School Information
  schoolNameEn: string;
  schoolNameNp?: string;
  schoolCode?: string;
  logoUrl?: string;
  addressEn?: string;
  addressNp?: string;
  city?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  establishedYear?: number;
  affiliationNumber?: string;
  principalName?: string;
  principalNameNp?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
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

export type SchoolConfigCreationAttributes = Optional<
  SchoolConfigAttributes,
  | 'id'
  | 'municipalityId'
  | 'schoolNameNp'
  | 'schoolCode'
  | 'logoUrl'
  | 'addressEn'
  | 'addressNp'
  | 'city'
  | 'district'
  | 'province'
  | 'postalCode'
  | 'establishedYear'
  | 'affiliationNumber'
  | 'principalName'
  | 'principalNameNp'
  | 'primaryColor'
  | 'secondaryColor'
  | 'accentColor'
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
>;

export class SchoolConfig
  extends Model<SchoolConfigAttributes, SchoolConfigCreationAttributes>
  implements SchoolConfigAttributes
{
  declare public id: string;
  declare public municipalityId?: string;
  declare public schoolNameEn: string;
  declare public schoolNameNp?: string;
  declare public schoolCode?: string;
  declare public logoUrl?: string;
  declare public addressEn?: string;
  declare public addressNp?: string;
  declare public city?: string;
  declare public district?: string;
  declare public province?: string;
  declare public postalCode?: string;
  declare public establishedYear?: number;
  declare public affiliationNumber?: string;
  declare public principalName?: string;
  declare public principalNameNp?: string;
  declare public primaryColor?: string;
  declare public secondaryColor?: string;
  declare public accentColor?: string;
  declare public phone?: string;
  declare public email?: string;
  declare public website?: string;
  declare public academicYearStartMonth: number;
  declare public academicYearDurationMonths: number;
  declare public termsPerYear: number;
  declare public defaultCalendarSystem: 'BS' | 'AD';
  declare public defaultLanguage: 'nepali' | 'english';
  declare public timezone: string;
  declare public currency: string;
  declare public dateFormat: string;
  declare public timeFormat: string;
  declare public numberFormat: string;
  declare public isActive: boolean;
  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

SchoolConfig.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    municipalityId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'municipality_id',
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
    city: { type: DataTypes.STRING(100), allowNull: true },
    district: { type: DataTypes.STRING(100), allowNull: true },
    province: { type: DataTypes.STRING(100), allowNull: true },
    postalCode: { type: DataTypes.STRING(20), allowNull: true, field: 'postal_code' },
    establishedYear: { type: DataTypes.INTEGER, allowNull: true, field: 'established_year' },
    affiliationNumber: { type: DataTypes.STRING(100), allowNull: true, field: 'affiliation_number' },
    principalName: { type: DataTypes.STRING(255), allowNull: true, field: 'principal_name' },
    principalNameNp: { type: DataTypes.STRING(255), allowNull: true, field: 'principal_name_np' },
    primaryColor: { type: DataTypes.STRING(20), allowNull: true, field: 'primary_color' },
    secondaryColor: { type: DataTypes.STRING(20), allowNull: true, field: 'secondary_color' },
    accentColor: { type: DataTypes.STRING(20), allowNull: true, field: 'accent_color' },
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
