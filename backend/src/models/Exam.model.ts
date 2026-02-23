import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

/**
 * Exam Type Enum
 * Supports all exam types per Nepal curriculum
 */
export enum ExamType {
  UNIT_TEST = 'unit_test',
  FIRST_TERMINAL = 'first_terminal',
  SECOND_TERMINAL = 'second_terminal',
  FINAL = 'final',
  PRACTICAL = 'practical',
  PROJECT = 'project'
}

/**
 * Exam Status Enum
 */
export enum ExamStatus {
  SCHEDULED = 'scheduled',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * Exam Attributes Interface
 */
export interface ExamAttributes {
  examId: number;
  name: string;
  type: ExamType;
  subjectId: number;
  classId: number;
  academicYearId: number;
  termId: number;
  examDate: Date;
  duration: number; // Duration in minutes
  fullMarks: number;
  passMarks: number;
  theoryMarks: number;
  practicalMarks: number;
  weightage: number; // Percentage for final grade calculation
  isInternal: boolean; // True for internal assessments, false for terminal exams
  status: ExamStatus;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

/**
 * Exam Creation Attributes (optional fields for creation)
 */
export interface ExamCreationAttributes extends Optional<ExamAttributes,
  'examId' | 'fullMarks' | 'passMarks' | 'theoryMarks' | 'practicalMarks' | 
  'weightage' | 'isInternal' | 'status' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

/**
 * Exam Model Class
 * 
 * Requirements: 7.1, 7.2
 */
class Exam extends Model<ExamAttributes, ExamCreationAttributes> implements ExamAttributes {
  declare examId: number;
  declare name: string;
  declare type: ExamType;
  declare subjectId: number;
  declare classId: number;
  declare academicYearId: number;
  declare termId: number;
  declare examDate: Date;
  declare duration: number;
  declare fullMarks: number;
  declare passMarks: number;
  declare theoryMarks: number;
  declare practicalMarks: number;
  declare weightage: number;
  declare isInternal: boolean;
  declare status: ExamStatus;
  
  // Timestamps
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt?: Date;

  /**
   * Check if exam has practical component
   */
  public hasPractical(): boolean {
    return this.practicalMarks > 0;
  }

  /**
   * Check if exam is completed
   */
  public isCompleted(): boolean {
    return this.status === ExamStatus.COMPLETED;
  }

  /**
   * Check if exam is scheduled
   */
  public isScheduled(): boolean {
    return this.status === ExamStatus.SCHEDULED;
  }

  /**
   * Check if exam is ongoing
   */
  public isOngoing(): boolean {
    return this.status === ExamStatus.ONGOING;
  }

  /**
   * Validate marks distribution
   * Theory marks + Practical marks should equal Full marks
   */
  public validateMarksDistribution(): boolean {
    return this.theoryMarks + this.practicalMarks === this.fullMarks;
  }

  /**
   * Get theory percentage
   */
  public getTheoryPercentage(): number {
    if (this.fullMarks === 0) return 0;
    return (this.theoryMarks / this.fullMarks) * 100;
  }

  /**
   * Get practical percentage
   */
  public getPracticalPercentage(): number {
    if (this.fullMarks === 0) return 0;
    return (this.practicalMarks / this.fullMarks) * 100;
  }
}

/**
 * Initialize Exam Model
 */
Exam.init(
  {
    examId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'exam_id'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100]
      }
    },
    type: {
      type: DataTypes.ENUM(...Object.values(ExamType)),
      allowNull: false
    },
    subjectId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'subject_id'
    },
    classId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'class_id'
    },
    academicYearId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'academic_year_id'
    },
    termId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'term_id'
    },
    examDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'exam_date'
    },
    duration: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      validate: {
        min: 1,
        max: 600 // Max 10 hours
      },
      comment: 'Duration in minutes'
    },
    fullMarks: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 100,
      validate: {
        min: 1,
        max: 1000
      }
    },
    passMarks: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 35,
      validate: {
        min: 0,
        max: 1000
      }
    },
    theoryMarks: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 75,
      validate: {
        min: 0,
        max: 1000
      }
    },
    practicalMarks: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 25,
      validate: {
        min: 0,
        max: 1000
      }
    },
    weightage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 100.00,
      validate: {
        min: 0,
        max: 100
      },
      comment: 'Percentage for final grade calculation'
    },
    isInternal: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_internal',
      comment: 'True for internal assessments (25-50% weightage), false for terminal exams'
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ExamStatus)),
      allowNull: false,
      defaultValue: ExamStatus.SCHEDULED
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
    tableName: 'exams',
    timestamps: true,
    paranoid: true, // Soft delete
    underscored: true,
    indexes: [
      {
        fields: ['subject_id']
      },
      {
        fields: ['class_id']
      },
      {
        fields: ['academic_year_id']
      },
      {
        fields: ['term_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['exam_date']
      },
      {
        // Composite index for common queries
        name: 'idx_exams_class_subject',
        fields: ['class_id', 'subject_id']
      }
    ],
    validate: {
      // Custom validation to ensure theory + practical = full marks
      marksDistributionValid(this: Exam) {
        const theoryMarks = this.getDataValue('theoryMarks') as number;
        const practicalMarks = this.getDataValue('practicalMarks') as number;
        const fullMarks = this.getDataValue('fullMarks') as number;
        
        if (theoryMarks + practicalMarks !== fullMarks) {
          throw new Error('Theory marks + Practical marks must equal Full marks');
        }
      },
      // Validate pass marks is less than full marks
      passMarksValid(this: Exam) {
        const passMarks = this.getDataValue('passMarks') as number;
        const fullMarks = this.getDataValue('fullMarks') as number;
        
        if (passMarks >= fullMarks) {
          throw new Error('Pass marks must be less than Full marks');
        }
      }
    }
  }
);

export default Exam;
