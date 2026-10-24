import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

/**
 * Admission Status Enum
 * Workflow: inquiry → application → test_scheduled → interviewed → admitted → enrolled → rejected
 */
export enum AdmissionStatus {
  INQUIRY = 'inquiry',
  APPLIED = 'applied',
  TEST_SCHEDULED = 'test_scheduled',
  TESTED = 'tested',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  INTERVIEWED = 'interviewed',
  ADMITTED = 'admitted',
  ENROLLED = 'enrolled',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn'
}

/**
 * Admission Attributes Interface
 */
export interface AdmissionAttributes {
  admissionId: number;
  temporaryId: string;
  /** Tenant ownership is added by the tenant isolation model setup. */
  schoolConfigId?: string;
  
  // Applicant Information
  firstNameEn: string;
  middleNameEn?: string;
  lastNameEn: string;
  firstNameNp?: string;
  middleNameNp?: string;
  lastNameNp?: string;
  dateOfBirthBS?: string;
  dateOfBirthAD?: Date;
  gender?: string;
  
  // Contact Information
  addressEn?: string;
  addressNp?: string;
  phone?: string;
  email?: string;
  
  // Guardian Information
  fatherName?: string;
  fatherPhone?: string;
  motherName?: string;
  motherPhone?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelation?: string;
  
  // Academic Information
  applyingForClass: number;
  previousSchool?: string;
  previousClass?: number;
  previousGpa?: number;
  
  // Workflow Status
  status: AdmissionStatus;
  
  // Inquiry Stage
  inquiryDate: Date;
  inquirySource?: string; // walk-in, phone, online, referral
  inquiryNotes?: string;
  
  // Application Stage
  applicationDate?: Date;
  applicationFee?: number;
  applicationFeePaid: boolean;
  
  // Test Stage
  admissionTestDate?: Date;
  admissionTestScore?: number;
  admissionTestMaxScore?: number;
  admissionTestRemarks?: string;
  
  // Interview Stage
  interviewDate?: Date;
  interviewerName?: string;
  interviewFeedback?: string;
  interviewScore?: number;
  
  // Admission Stage
  admissionDate?: Date;
  admissionOfferLetterUrl?: string;
  
  // Document Verification
  documentsVerified: boolean;
  documentsNotes?: string;
  
  // Enrollment (final stage)
  enrolledStudentId?: number;
  enrollmentDate?: Date;
  
  // Rejection
  rejectionReason?: string;
  rejectionDate?: Date;
  
  // Metadata
  processedBy?: number;
  academicYearId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Admission Creation Attributes
 */
export type AdmissionCreationAttributes = Optional<AdmissionAttributes,
  'admissionId' | 'middleNameEn' | 'firstNameNp' | 'middleNameNp' | 'lastNameNp' |
  'dateOfBirthBS' | 'dateOfBirthAD' | 'gender' | 'addressEn' | 'addressNp' |
  'phone' | 'email' | 'fatherName' | 'fatherPhone' | 'motherName' | 'motherPhone' |
  'guardianName' | 'guardianPhone' | 'guardianRelation' | 'previousSchool' |
  'previousClass' | 'previousGpa' | 'inquirySource' | 'inquiryNotes' |
  'applicationDate' | 'applicationFee' | 'admissionTestDate' | 'admissionTestScore' |
  'admissionTestMaxScore' | 'admissionTestRemarks' | 'interviewDate' | 'interviewerName' |
  'interviewFeedback' | 'interviewScore' | 'admissionDate' | 'admissionOfferLetterUrl' |
  'documentsNotes' | 'enrolledStudentId' | 'enrollmentDate' | 'rejectionReason' |
  'rejectionDate' | 'processedBy' | 'academicYearId' | 'createdAt' | 'updatedAt' | 'schoolConfigId'>;

/**
 * Admission Model Class
 */
class Admission extends Model<AdmissionAttributes, AdmissionCreationAttributes>
  implements AdmissionAttributes {
  declare public admissionId: number;
  declare public temporaryId: string;
  declare public schoolConfigId?: string;
  
  declare public firstNameEn: string;
  declare public middleNameEn?: string;
  declare public lastNameEn: string;
  declare public firstNameNp?: string;
  declare public middleNameNp?: string;
  declare public lastNameNp?: string;
  declare public dateOfBirthBS?: string;
  declare public dateOfBirthAD?: Date;
  declare public gender?: string;
  
  declare public addressEn?: string;
  declare public addressNp?: string;
  declare public phone?: string;
  declare public email?: string;
  
  declare public fatherName?: string;
  declare public fatherPhone?: string;
  declare public motherName?: string;
  declare public motherPhone?: string;
  declare public guardianName?: string;
  declare public guardianPhone?: string;
  declare public guardianRelation?: string;
  
  declare public applyingForClass: number;
  declare public previousSchool?: string;
  declare public previousClass?: number;
  declare public previousGpa?: number;
  
  declare public status: AdmissionStatus;
  
  declare public inquiryDate: Date;
  declare public inquirySource?: string;
  declare public inquiryNotes?: string;
  
  declare public applicationDate?: Date;
  declare public applicationFee?: number;
  declare public applicationFeePaid: boolean;
  
  declare public admissionTestDate?: Date;
  declare public admissionTestScore?: number;
  declare public admissionTestMaxScore?: number;
  declare public admissionTestRemarks?: string;
  
  declare public interviewDate?: Date;
  declare public interviewerName?: string;
  declare public interviewFeedback?: string;
  declare public interviewScore?: number;
  
  declare public admissionDate?: Date;
  declare public admissionOfferLetterUrl?: string;
  
  declare public documentsVerified: boolean;
  declare public documentsNotes?: string;
  
  declare public enrolledStudentId?: number;
  declare public enrollmentDate?: Date;
  
  declare public rejectionReason?: string;
  declare public rejectionDate?: Date;
  
  declare public processedBy?: number;
  declare public academicYearId?: number;
  
  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  /**
   * Get full name in English
   */
  public getFullNameEn(): string {
    const parts = [this.get('firstNameEn') as string];
    const middleName = this.get('middleNameEn') as string | undefined;
    if (middleName) parts.push(middleName);
    parts.push(this.get('lastNameEn') as string);
    return parts.join(' ');
  }

  /**
   * Check if admission can transition to given status
   */
  public canTransitionTo(newStatus: AdmissionStatus): boolean {
    const currentStatus = this.get('status') as AdmissionStatus;
    const validTransitions: Record<AdmissionStatus, AdmissionStatus[]> = {
      [AdmissionStatus.INQUIRY]: [AdmissionStatus.APPLIED, AdmissionStatus.REJECTED, AdmissionStatus.WITHDRAWN],
      [AdmissionStatus.APPLIED]: [AdmissionStatus.TEST_SCHEDULED, AdmissionStatus.INTERVIEW_SCHEDULED, AdmissionStatus.ADMITTED, AdmissionStatus.REJECTED, AdmissionStatus.WITHDRAWN],
      [AdmissionStatus.TEST_SCHEDULED]: [AdmissionStatus.TESTED, AdmissionStatus.REJECTED, AdmissionStatus.WITHDRAWN],
      [AdmissionStatus.TESTED]: [AdmissionStatus.INTERVIEW_SCHEDULED, AdmissionStatus.ADMITTED, AdmissionStatus.REJECTED, AdmissionStatus.WITHDRAWN],
      [AdmissionStatus.INTERVIEW_SCHEDULED]: [AdmissionStatus.INTERVIEWED, AdmissionStatus.REJECTED, AdmissionStatus.WITHDRAWN],
      [AdmissionStatus.INTERVIEWED]: [AdmissionStatus.ADMITTED, AdmissionStatus.REJECTED, AdmissionStatus.WITHDRAWN],
      [AdmissionStatus.ADMITTED]: [AdmissionStatus.ENROLLED, AdmissionStatus.WITHDRAWN],
      [AdmissionStatus.ENROLLED]: [],
      [AdmissionStatus.REJECTED]: [],
      [AdmissionStatus.WITHDRAWN]: []
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }
}

/**
 * Initialize Admission Model
 */
Admission.init(
  {
    admissionId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'admission_id'
    },
    temporaryId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'temporary_id'
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
    fatherName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'father_name'
    },
    fatherPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'father_phone'
    },
    motherName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'mother_name'
    },
    motherPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'mother_phone'
    },
    guardianName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'guardian_name'
    },
    guardianPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'guardian_phone'
    },
    guardianRelation: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'guardian_relation'
    },
    applyingForClass: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'applying_for_class',
      validate: { min: 1, max: 12 }
    },
    previousSchool: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'previous_school'
    },
    previousClass: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'previous_class'
    },
    previousGpa: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      field: 'previous_gpa'
    },
    status: {
      type: DataTypes.ENUM(...Object.values(AdmissionStatus)),
      allowNull: false,
      defaultValue: AdmissionStatus.INQUIRY
    },
    inquiryDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'inquiry_date'
    },
    inquirySource: {
      type: DataTypes.ENUM('walk-in', 'phone', 'online', 'referral'),
      allowNull: true,
      field: 'inquiry_source'
    },
    inquiryNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'inquiry_notes'
    },
    applicationDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'application_date'
    },
    applicationFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'application_fee'
    },
    applicationFeePaid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'application_fee_paid'
    },
    admissionTestDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'admission_test_date'
    },
    admissionTestScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'admission_test_score'
    },
    admissionTestMaxScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'admission_test_max_score'
    },
    admissionTestRemarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'admission_test_remarks'
    },
    interviewDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'interview_date'
    },
    interviewerName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'interviewer_name'
    },
    interviewFeedback: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'interview_feedback'
    },
    interviewScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'interview_score'
    },
    admissionDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'admission_date'
    },
    admissionOfferLetterUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'admission_offer_letter_url'
    },
    documentsVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'documents_verified'
    },
    documentsNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'documents_notes'
    },
    enrolledStudentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'enrolled_student_id'
    },
    enrollmentDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'enrollment_date'
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'rejection_reason'
    },
    rejectionDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'rejection_date'
    },
    processedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'processed_by'
    },
    academicYearId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'academic_year_id'
    }
  },
  {
    sequelize,
    tableName: 'admissions',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['status'] },
      { fields: ['applying_for_class'] },
      { fields: ['inquiry_date'] },
      { fields: ['academic_year_id'] }
    ]
  }
);

export default Admission;
