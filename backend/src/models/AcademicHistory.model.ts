import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

/**
 * Completion Status Enum
 */
export enum CompletionStatus {
  COMPLETED = 'completed',
  PROMOTED = 'promoted',
  FAILED = 'failed',
  TRANSFERRED = 'transferred',
  DROPPED = 'dropped'
}

/**
 * Academic History Attributes Interface
 */
export interface AcademicHistoryAttributes {
  historyId: number;
  studentId: number;
  academicYearId: number;
  classId: number;
  gradeLevel: number;
  rollNumber?: number;
  attendancePercentage?: number;
  gpa?: number;
  totalMarks?: number;
  rank?: number;
  completionStatus: CompletionStatus;
  promotionEligible: boolean;
  promotedToClass?: number;
  remarks?: string;
  promotedBy?: number;
  promotedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Academic History Creation Attributes
 */
export interface AcademicHistoryCreationAttributes extends Optional<AcademicHistoryAttributes,
  'historyId' | 'rollNumber' | 'attendancePercentage' | 'gpa' | 'totalMarks' | 'rank' | 
  'promotedToClass' | 'remarks' | 'promotedBy' | 'promotedAt' | 'createdAt' | 'updatedAt'> {}

/**
 * Academic History Model Class
 * Maintains historical records of student academic progress
 */
class AcademicHistory extends Model<AcademicHistoryAttributes, AcademicHistoryCreationAttributes> 
  implements AcademicHistoryAttributes {
  public historyId!: number;
  public studentId!: number;
  public academicYearId!: number;
  public classId!: number;
  public gradeLevel!: number;
  public rollNumber?: number;
  public attendancePercentage?: number;
  public gpa?: number;
  public totalMarks?: number;
  public rank?: number;
  public completionStatus!: CompletionStatus;
  public promotionEligible!: boolean;
  public promotedToClass?: number;
  public remarks?: string;
  public promotedBy?: number;
  public promotedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Check if student was promoted
   */
  public wasPromoted(): boolean {
    return this.completionStatus === CompletionStatus.PROMOTED;
  }

  /**
   * Check if student failed
   */
  public hasFailed(): boolean {
    return this.completionStatus === CompletionStatus.FAILED;
  }

  /**
   * Get promotion details
   */
  public getPromotionDetails(): {
    fromGrade: number;
    toGrade: number | null;
    eligible: boolean;
    status: CompletionStatus;
  } {
    return {
      fromGrade: this.gradeLevel,
      toGrade: this.promotedToClass || null,
      eligible: this.promotionEligible,
      status: this.completionStatus
    };
  }
}

/**
 * Initialize Academic History Model
 */
AcademicHistory.init(
  {
    historyId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'history_id'
    },
    studentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'student_id'
    },
    academicYearId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'academic_year_id'
    },
    classId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'class_id'
    },
    gradeLevel: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'grade_level',
      validate: {
        min: 1,
        max: 12
      }
    },
    rollNumber: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'roll_number'
    },
    attendancePercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'attendance_percentage',
      validate: {
        min: 0,
        max: 100
      }
    },
    gpa: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 4.0
      }
    },
    totalMarks: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'total_marks'
    },
    rank: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      validate: {
        min: 1
      }
    },
    completionStatus: {
      type: DataTypes.ENUM(...Object.values(CompletionStatus)),
      allowNull: false,
      defaultValue: CompletionStatus.COMPLETED,
      field: 'completion_status'
    },
    promotionEligible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'promotion_eligible'
    },
    promotedToClass: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'promoted_to_class',
      validate: {
        min: 1,
        max: 12
      }
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    promotedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'promoted_by'
    },
    promotedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'promoted_at'
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
    }
  },
  {
    sequelize,
    tableName: 'academic_history',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['student_id']
      },
      {
        fields: ['academic_year_id']
      },
      {
        fields: ['class_id']
      },
      {
        unique: true,
        fields: ['student_id', 'academic_year_id']
      },
      {
        fields: ['completion_status']
      },
      {
        fields: ['promotion_eligible']
      }
    ]
  }
);

export default AcademicHistory;
