import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

/**
 * Staff Status
 */
export enum StaffStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ON_LEAVE = 'on_leave',
  TERMINATED = 'terminated',
  RETIRED = 'retired'
}

/**
 * Staff Category
 */
export enum StaffCategory {
  TEACHING = 'teaching',
  NON_TEACHING = 'non_teaching',
  ADMINISTRATIVE = 'administrative'
}

/**
 * Employment Type
 */
export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  TEMPORARY = 'temporary'
}

/**
 * Staff Attributes Interface
 */
export interface StaffAttributes {
  staffId: number;
  userId?: number;
  staffCode: string;
  
  // Personal Information
  firstNameEn: string;
  middleNameEn?: string;
  lastNameEn: string;
  firstNameNp?: string;
  middleNameNp?: string;
  lastNameNp?: string;
  dateOfBirthBS?: string;
  dateOfBirthAD?: Date;
  gender?: string;
  bloodGroup?: string;
  photoUrl?: string;
  
  // Contact Information
  addressEn?: string;
  addressNp?: string;
  phone?: string;
  email?: string;
  emergencyContact?: string;
  
  // Employment Information
  employeeId?: string;
  category: StaffCategory;
  position?: string;
  department?: string;
  employmentType: EmploymentType;
  joinDate: Date;
  terminationDate?: Date;
  salary?: number;
  salaryGrade?: string;
  
  // Qualification
  highestQualification?: string;
  specialization?: string;
  teachingLicense?: string;
  
  // Identification
  citizenshipNumber?: string;
  panNumber?: string;
  
  // Status
  status: StaffStatus;
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

/**
 * Staff Creation Attributes
 */
export interface StaffCreationAttributes extends Optional<StaffAttributes,
  'staffId' | 'userId' | 'staffCode' | 'middleNameEn' | 'firstNameNp' | 'middleNameNp' | 'lastNameNp' |
  'dateOfBirthBS' | 'dateOfBirthAD' | 'gender' | 'bloodGroup' | 'photoUrl' |
  'addressEn' | 'addressNp' | 'phone' | 'email' | 'emergencyContact' |
  'employeeId' | 'position' | 'department' | 'terminationDate' | 'salary' |
  'salaryGrade' | 'highestQualification' | 'specialization' | 'teachingLicense' |
  'citizenshipNumber' | 'panNumber' | 'status' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

/**
 * Staff Model Class
 */
class Staff extends Model<StaffAttributes, StaffCreationAttributes>
  implements StaffAttributes {
  declare staffId: number;
  declare userId?: number;
  declare staffCode: string;
  
  declare firstNameEn: string;
  declare middleNameEn?: string;
  declare lastNameEn: string;
  declare firstNameNp?: string;
  declare middleNameNp?: string;
  declare lastNameNp?: string;
  declare dateOfBirthBS?: string;
  declare dateOfBirthAD?: Date;
  declare gender?: string;
  declare bloodGroup?: string;
  declare photoUrl?: string;
  
  declare addressEn?: string;
  declare addressNp?: string;
  declare phone?: string;
  declare email?: string;
  declare emergencyContact?: string;
  
  declare employeeId?: string;
  declare category: StaffCategory;
  declare position?: string;
  declare department?: string;
  declare employmentType: EmploymentType;
  declare joinDate: Date;
  declare terminationDate?: Date;
  declare salary?: number;
  declare salaryGrade?: string;
  
  declare highestQualification?: string;
  declare specialization?: string;
  declare teachingLicense?: string;
  
  declare citizenshipNumber?: string;
  declare panNumber?: string;
  
  declare status: StaffStatus;
  
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt?: Date;

  /**
   * Get full name in English
   */
  public getFullNameEn(): string {
    const parts = [this.firstNameEn];
    if (this.middleNameEn) parts.push(this.middleNameEn);
    parts.push(this.lastNameEn);
    return parts.join(' ');
  }

  /**
   * Check if staff is teaching staff
   */
  public isTeachingStaff(): boolean {
    return this.category === StaffCategory.TEACHING;
  }
}

/**
 * Initialize Staff Model
 */
Staff.init(
  {
    staffId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'staff_id'
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'user_id'
    },
    staffCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'staff_code'
    },
    firstNameEn: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'first_name_en'
    },
    middleNameEn: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'middle_name_en'
    },
    lastNameEn: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'last_name_en'
    },
    firstNameNp: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'first_name_np'
    },
    middleNameNp: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'middle_name_np'
    },
    lastNameNp: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'last_name_np'
    },
    dateOfBirthBS: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: 'date_of_birth_bs'
    },
    dateOfBirthAD: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'date_of_birth_ad'
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: true
    },
    bloodGroup: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: 'blood_group'
    },
    photoUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'photo_url'
    },
    addressEn: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'address_en'
    },
    addressNp: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'address_np'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    emergencyContact: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'emergency_contact'
    },
    employeeId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'employee_id'
    },
    category: {
      type: DataTypes.ENUM(...Object.values(StaffCategory)),
      allowNull: false
    },
    position: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    employmentType: {
      type: DataTypes.ENUM(...Object.values(EmploymentType)),
      allowNull: false,
      defaultValue: EmploymentType.FULL_TIME
    },
    joinDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'join_date'
    },
    terminationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'termination_date'
    },
    salary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    salaryGrade: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'salary_grade'
    },
    highestQualification: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'highest_qualification'
    },
    specialization: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    teachingLicense: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'teaching_license'
    },
    citizenshipNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'citizenship_number'
    },
    panNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'pan_number'
    },
    status: {
      type: DataTypes.ENUM(...Object.values(StaffStatus)),
      allowNull: false,
      defaultValue: StaffStatus.ACTIVE
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at'
    }
  },
  {
    sequelize,
    tableName: 'staff',
    timestamps: true,
    paranoid: true, // Soft delete
    underscored: true,
    indexes: [
      { fields: ['status'] },
      { fields: ['category'] },
      { fields: ['department'] },
      { fields: ['employee_id'] },
      { fields: ['staff_code'], unique: true }
    ]
  }
);

export default Staff;
