import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

/**
 * Student Status
 */
export enum StudentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TRANSFERRED = 'transferred',
  GRADUATED = 'graduated',
  SUSPENDED = 'suspended'
}

/**
 * Gender Enum
 */
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

/**
 * Student Attributes Interface
 */
export interface StudentAttributes {
  studentId: number;
  userId?: number;
  studentCode: string;
  symbolNumber?: string;
  nebRegistrationNumber?: string;
  
  // Personal Information
  firstNameEn: string;
  middleNameEn?: string;
  lastNameEn: string;
  firstNameNp?: string;
  middleNameNp?: string;
  lastNameNp?: string;
  dateOfBirthBS: string;
  dateOfBirthAD: Date;
  gender: Gender;
  bloodGroup?: string;
  
  // Contact Information
  addressEn: string;
  addressNp?: string;
  phone?: string;
  email?: string;
  
  // Guardian Information
  fatherName: string;
  fatherPhone: string;
  fatherCitizenshipNo?: string;
  motherName: string;
  motherPhone: string;
  motherCitizenshipNo?: string;
  localGuardianName?: string;
  localGuardianPhone?: string;
  localGuardianRelation?: string;
  
  // Academic Information
  admissionDate: Date;
  admissionClass: number;
  currentClassId?: number;
  rollNumber?: number;
  previousSchool?: string;
  
  // Health Information
  allergies?: string;
  medicalConditions?: string;
  emergencyContact: string;
  
  // Status
  status: StudentStatus;
  photoUrl?: string;
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

/**
 * Student Creation Attributes (optional fields for creation)
 */
export interface StudentCreationAttributes extends Optional<StudentAttributes,
  'studentId' | 'userId' | 'symbolNumber' | 'nebRegistrationNumber' | 'middleNameEn' | 
  'firstNameNp' | 'middleNameNp' | 'lastNameNp' | 'bloodGroup' | 'addressNp' | 'phone' | 
  'email' | 'fatherCitizenshipNo' | 'motherCitizenshipNo' | 'localGuardianName' | 
  'localGuardianPhone' | 'localGuardianRelation' | 'currentClassId' | 'rollNumber' | 
  'previousSchool' | 'allergies' | 'medicalConditions' | 'photoUrl' | 'createdAt' | 
  'updatedAt' | 'deletedAt'> {}

/**
 * Student Model Class
 */
class Student extends Model<StudentAttributes, StudentCreationAttributes> implements StudentAttributes {
  // Remove public class fields - they shadow Sequelize's getters/setters
  // All attributes are declared in StudentAttributes interface
  declare studentId: number;
  declare userId?: number;
  declare studentCode: string;
  declare symbolNumber?: string;
  declare nebRegistrationNumber?: string;
  
  // Personal Information
  declare firstNameEn: string;
  declare middleNameEn?: string;
  declare lastNameEn: string;
  declare firstNameNp?: string;
  declare middleNameNp?: string;
  declare lastNameNp?: string;
  declare dateOfBirthBS: string;
  declare dateOfBirthAD: Date;
  declare gender: Gender;
  declare bloodGroup?: string;
  
  // Contact Information
  declare addressEn: string;
  declare addressNp?: string;
  declare phone?: string;
  declare email?: string;
  
  // Guardian Information
  declare fatherName: string;
  declare fatherPhone: string;
  declare fatherCitizenshipNo?: string;
  declare motherName: string;
  declare motherPhone: string;
  declare motherCitizenshipNo?: string;
  declare localGuardianName?: string;
  declare localGuardianPhone?: string;
  declare localGuardianRelation?: string;
  
  // Academic Information
  declare admissionDate: Date;
  declare admissionClass: number;
  declare currentClassId?: number;
  declare rollNumber?: number;
  declare previousSchool?: string;
  
  // Health Information
  declare allergies?: string;
  declare medicalConditions?: string;
  declare emergencyContact: string;
  
  // Status
  declare status: StudentStatus;
  declare photoUrl?: string;
  
  // Timestamps
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
   * Get full name in Nepali
   */
  public getFullNameNp(): string | null {
    if (!this.firstNameNp || !this.lastNameNp) return null;
    const parts = [this.firstNameNp];
    if (this.middleNameNp) parts.push(this.middleNameNp);
    parts.push(this.lastNameNp);
    return parts.join(' ');
  }

  /**
   * Calculate age from date of birth
   */
  public getAge(): number {
    const today = new Date();
    const birthDate = this.dateOfBirthAD;
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Check if student is active
   */
  public isActive(): boolean {
    return this.status === StudentStatus.ACTIVE;
  }
}

/**
 * Initialize Student Model
 */
Student.init(
  {
    studentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'student_id'
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'user_id'
    },
    studentCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'student_code',
      validate: {
        notEmpty: true
      }
    },
    symbolNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      field: 'symbol_number'
    },
    nebRegistrationNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      field: 'neb_registration_number'
    },
    // Personal Information
    firstNameEn: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'first_name_en',
      validate: {
        notEmpty: true,
        len: [1, 50]
      }
    },
    middleNameEn: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'middle_name_en',
      validate: {
        len: [0, 50]
      }
    },
    lastNameEn: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'last_name_en',
      validate: {
        notEmpty: true,
        len: [1, 50]
      }
    },
    firstNameNp: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'first_name_np',
      validate: {
        len: [0, 100]
      }
    },
    middleNameNp: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'middle_name_np',
      validate: {
        len: [0, 100]
      }
    },
    lastNameNp: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'last_name_np',
      validate: {
        len: [0, 100]
      }
    },
    dateOfBirthBS: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'date_of_birth_bs',
      validate: {
        notEmpty: true,
        is: /^\d{4}-\d{2}-\d{2}$/
      }
    },
    dateOfBirthAD: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'date_of_birth_ad'
    },
    gender: {
      type: DataTypes.ENUM(...Object.values(Gender)),
      allowNull: false
    },
    bloodGroup: {
      type: DataTypes.STRING(5),
      allowNull: true,
      field: 'blood_group',
      validate: {
        len: [0, 5]
      }
    },
    // Contact Information
    addressEn: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'address_en',
      validate: {
        notEmpty: true
      }
    },
    addressNp: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'address_np'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: /^[0-9+\-() ]+$/
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    // Guardian Information
    fatherName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'father_name',
      validate: {
        notEmpty: true,
        len: [1, 100]
      }
    },
    fatherPhone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'father_phone',
      validate: {
        notEmpty: true,
        is: /^[0-9+\-() ]+$/
      }
    },
    fatherCitizenshipNo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'father_citizenship_no',
      validate: {
        len: [0, 50]
      }
    },
    motherName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'mother_name',
      validate: {
        notEmpty: true,
        len: [1, 100]
      }
    },
    motherPhone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'mother_phone',
      validate: {
        notEmpty: true,
        is: /^[0-9+\-() ]+$/
      }
    },
    motherCitizenshipNo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'mother_citizenship_no',
      validate: {
        len: [0, 50]
      }
    },
    localGuardianName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'local_guardian_name',
      validate: {
        len: [0, 100]
      }
    },
    localGuardianPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'local_guardian_phone',
      validate: {
        is: /^[0-9+\-() ]*$/
      }
    },
    localGuardianRelation: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'local_guardian_relation',
      validate: {
        len: [0, 50]
      }
    },
    // Academic Information
    admissionDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'admission_date'
    },
    admissionClass: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'admission_class',
      validate: {
        min: 1,
        max: 12
      }
    },
    currentClassId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'current_class_id'
    },
    rollNumber: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'roll_number',
      validate: {
        min: 1
      }
    },
    previousSchool: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'previous_school',
      validate: {
        len: [0, 200]
      }
    },
    // Health Information
    allergies: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    medicalConditions: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'medical_conditions'
    },
    emergencyContact: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'emergency_contact',
      validate: {
        notEmpty: true,
        is: /^[0-9+\-() ]+$/
      }
    },
    // Status
    status: {
      type: DataTypes.ENUM(...Object.values(StudentStatus)),
      allowNull: false,
      defaultValue: StudentStatus.ACTIVE
    },
    photoUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'photo_url'
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
    tableName: 'students',
    timestamps: true,
    paranoid: true, // Soft delete
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['student_code']
      },
      {
        unique: true,
        fields: ['symbol_number']
      },
      {
        unique: true,
        fields: ['neb_registration_number']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['current_class_id']
      },
      {
        fields: ['status']
      },
      {
        // Full-text search index on name fields
        name: 'idx_students_name_search',
        fields: ['first_name_en', 'last_name_en']
      },
      {
        // Composite index for common queries
        name: 'idx_students_class_status',
        fields: ['current_class_id', 'status']
      }
    ],
    hooks: {
      /**
       * Encrypt sensitive data before creating student
       * Encrypts citizenship numbers for data protection
       * Requirements: 36.10
       */
      beforeCreate: async (student: Student) => {
        const { encrypt } = await import('@utils/encryption');
        
        if (student.fatherCitizenshipNo) {
          student.fatherCitizenshipNo = encrypt(student.fatherCitizenshipNo);
        }
        
        if (student.motherCitizenshipNo) {
          student.motherCitizenshipNo = encrypt(student.motherCitizenshipNo);
        }
      },
      
      /**
       * Encrypt sensitive data before updating student
       * Only encrypts if citizenship numbers have changed
       * Requirements: 36.10
       */
      beforeUpdate: async (student: Student) => {
        const { encrypt } = await import('@utils/encryption');
        
        if (student.changed('fatherCitizenshipNo') && student.fatherCitizenshipNo) {
          student.fatherCitizenshipNo = encrypt(student.fatherCitizenshipNo);
        }
        
        if (student.changed('motherCitizenshipNo') && student.motherCitizenshipNo) {
          student.motherCitizenshipNo = encrypt(student.motherCitizenshipNo);
        }
      },
      
      /**
       * Decrypt sensitive data after finding student
       * Decrypts citizenship numbers for display
       * Requirements: 36.10
       */
      afterFind: async (result: Student | Student[] | null) => {
        if (!result) return;
        
        const { decrypt } = await import('@utils/encryption');
        
        const decryptStudent = (student: Student) => {
          if (student.fatherCitizenshipNo) {
            try {
              student.fatherCitizenshipNo = decrypt(student.fatherCitizenshipNo);
            } catch (error) {
              // If decryption fails, data might not be encrypted (legacy data)
              // Keep original value
            }
          }
          
          if (student.motherCitizenshipNo) {
            try {
              student.motherCitizenshipNo = decrypt(student.motherCitizenshipNo);
            } catch (error) {
              // If decryption fails, data might not be encrypted (legacy data)
              // Keep original value
            }
          }
        };
        
        if (Array.isArray(result)) {
          result.forEach(decryptStudent);
        } else {
          decryptStudent(result);
        }
      }
    }
  }
);

// Define associations
import Class from './Class.model';

Student.belongsTo(Class, {
  foreignKey: 'currentClassId',
  as: 'class'
});

export default Student;
