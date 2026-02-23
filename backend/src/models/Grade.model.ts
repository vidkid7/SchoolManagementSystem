import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

/**
 * NEB Grade Enum
 * Nepal Education Board grading system
 */
export enum NEBGrade {
  A_PLUS = 'A+',
  A = 'A',
  B_PLUS = 'B+',
  B = 'B',
  C_PLUS = 'C+',
  C = 'C',
  D = 'D',
  NG = 'NG' // Not Graded (below 35%)
}

/**
 * Grade Attributes Interface
 */
export interface GradeAttributes {
  gradeId: number;
  examId: number;
  studentId: number;
  theoryMarks?: number;
  practicalMarks?: number;
  totalMarks: number;
  grade: NEBGrade;
  gradePoint: number; // 0.0 to 4.0 as per NEB
  remarks?: string;
  enteredBy: number; // Teacher user ID who entered the grade
  enteredAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

/**
 * Grade Creation Attributes (optional fields for creation)
 */
export interface GradeCreationAttributes extends Optional<GradeAttributes,
  'gradeId' | 'theoryMarks' | 'practicalMarks' | 'remarks' | 'enteredAt' | 
  'createdAt' | 'updatedAt' | 'deletedAt'> {}

/**
 * Grade Model Class
 * 
 * Requirements: 7.1, 7.2, N1.1
 */
class Grade extends Model<GradeAttributes, GradeCreationAttributes> implements GradeAttributes {
  declare gradeId: number;
  declare examId: number;
  declare studentId: number;
  declare theoryMarks?: number;
  declare practicalMarks?: number;
  declare totalMarks: number;
  declare grade: NEBGrade;
  declare gradePoint: number;
  declare remarks?: string;
  declare enteredBy: number;
  declare enteredAt: Date;
  
  // Timestamps
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt?: Date;

  /**
   * Check if student passed
   * Pass marks is typically 35% (35 out of 100)
   */
  public isPassed(passMarks: number): boolean {
    return this.totalMarks >= passMarks;
  }

  /**
   * Check if grade is NG (Not Graded)
   */
  public isNotGraded(): boolean {
    return this.grade === NEBGrade.NG;
  }

  /**
   * Get percentage
   */
  public getPercentage(fullMarks: number): number {
    if (fullMarks === 0) return 0;
    return (this.totalMarks / fullMarks) * 100;
  }

  /**
   * Get grade description
   */
  public getGradeDescription(): string {
    const descriptions: Record<NEBGrade, string> = {
      [NEBGrade.A_PLUS]: 'Outstanding',
      [NEBGrade.A]: 'Excellent',
      [NEBGrade.B_PLUS]: 'Very Good',
      [NEBGrade.B]: 'Good',
      [NEBGrade.C_PLUS]: 'Satisfactory',
      [NEBGrade.C]: 'Acceptable',
      [NEBGrade.D]: 'Basic',
      [NEBGrade.NG]: 'Not Graded'
    };
    return descriptions[this.grade];
  }

  /**
   * Check if student has distinction (A+ or A)
   */
  public hasDistinction(): boolean {
    return this.grade === NEBGrade.A_PLUS || this.grade === NEBGrade.A;
  }

  /**
   * Validate marks are within bounds
   */
  public validateMarks(fullMarks: number, theoryFullMarks?: number, practicalFullMarks?: number): boolean {
    // Check total marks
    if (this.totalMarks < 0 || this.totalMarks > fullMarks) {
      return false;
    }

    // Check theory marks if provided
    if (this.theoryMarks !== undefined && theoryFullMarks !== undefined) {
      if (this.theoryMarks < 0 || this.theoryMarks > theoryFullMarks) {
        return false;
      }
    }

    // Check practical marks if provided
    if (this.practicalMarks !== undefined && practicalFullMarks !== undefined) {
      if (this.practicalMarks < 0 || this.practicalMarks > practicalFullMarks) {
        return false;
      }
    }

    // Check theory + practical = total (if both are provided)
    if (this.theoryMarks !== undefined && this.practicalMarks !== undefined) {
      const sum = this.theoryMarks + this.practicalMarks;
      // Allow small floating point differences
      if (Math.abs(sum - this.totalMarks) > 0.01) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Initialize Grade Model
 */
Grade.init(
  {
    gradeId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'grade_id'
    },
    examId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'exam_id'
    },
    studentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'student_id'
    },
    theoryMarks: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'theory_marks',
      validate: {
        min: 0,
        max: 1000
      }
    },
    practicalMarks: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'practical_marks',
      validate: {
        min: 0,
        max: 1000
      }
    },
    totalMarks: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      field: 'total_marks',
      validate: {
        min: 0,
        max: 1000
      }
    },
    grade: {
      type: DataTypes.ENUM(...Object.values(NEBGrade)),
      allowNull: false,
      comment: 'NEB grade (A+ to NG)'
    },
    gradePoint: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: false,
      field: 'grade_point',
      validate: {
        min: 0.0,
        max: 4.0
      },
      comment: 'Grade point as per NEB (0.0 to 4.0)'
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    enteredBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'entered_by',
      comment: 'Teacher user ID who entered the grade'
    },
    enteredAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'entered_at'
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
    tableName: 'grades',
    timestamps: true,
    paranoid: true, // Soft delete
    underscored: true,
    indexes: [
      {
        fields: ['exam_id']
      },
      {
        fields: ['student_id']
      },
      {
        fields: ['grade']
      },
      {
        fields: ['entered_by']
      },
      {
        // Unique constraint to prevent duplicate grades for same student and exam
        unique: true,
        name: 'idx_grades_exam_student_unique',
        fields: ['exam_id', 'student_id']
      }
    ],
    validate: {
      // Custom validation to ensure theory + practical = total (if both provided)
      marksConsistent(this: Grade) {
        const theoryMarks = this.getDataValue('theoryMarks') as number | undefined;
        const practicalMarks = this.getDataValue('practicalMarks') as number | undefined;
        const totalMarks = this.getDataValue('totalMarks') as number;
        
        if (theoryMarks !== undefined && practicalMarks !== undefined) {
          const sum = theoryMarks + practicalMarks;
          // Allow small floating point differences
          if (Math.abs(sum - totalMarks) > 0.01) {
            throw new Error('Theory marks + Practical marks must equal Total marks');
          }
        }
      }
    }
  }
);

export default Grade;
