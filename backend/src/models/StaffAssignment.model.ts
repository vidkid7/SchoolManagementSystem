import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

/**
 * Assignment Type
 */
export enum AssignmentType {
  CLASS_TEACHER = 'class_teacher',
  SUBJECT_TEACHER = 'subject_teacher',
  DEPARTMENT_HEAD = 'department_head',
  SHIFT_INCHARGE = 'shift_incharge'
}

/**
 * Staff Assignment Attributes Interface
 */
export interface StaffAssignmentAttributes {
  assignmentId: number;
  staffId: number;
  academicYearId: number;
  assignmentType: AssignmentType;
  
  // For class teacher assignment
  classId?: number;
  
  // For subject teacher assignment
  subjectId?: number;
  section?: string;
  
  // Department head assignment
  department?: string;
  
  // Metadata
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Staff Assignment Creation Attributes
 */
export interface StaffAssignmentCreationAttributes extends Optional<StaffAssignmentAttributes,
  'assignmentId' | 'section' | 'department' | 'endDate' | 'isActive' | 'createdAt' | 'updatedAt'> {}

/**
 * Staff Assignment Model Class
 */
class StaffAssignment extends Model<StaffAssignmentAttributes, StaffAssignmentCreationAttributes>
  implements StaffAssignmentAttributes {
  declare assignmentId: number;
  declare staffId: number;
  declare academicYearId: number;
  declare assignmentType: AssignmentType;
  
  declare classId?: number;
  
  declare subjectId?: number;
  declare section?: string;
  
  declare department?: string;
  
  declare startDate: Date;
  declare endDate?: Date;
  declare isActive: boolean;
  
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

/**
 * Initialize Staff Assignment Model
 */
StaffAssignment.init(
  {
    assignmentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'assignment_id'
    },
    staffId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'staff_id',
      references: {
        model: 'staff',
        key: 'staff_id'
      }
    },
    academicYearId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'academic_year_id',
      references: {
        model: 'academic_years',
        key: 'academic_year_id'
      }
    },
    assignmentType: {
      type: DataTypes.ENUM(...Object.values(AssignmentType)),
      allowNull: false,
      field: 'assignment_type'
    },
    classId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'class_id',
      references: {
        model: 'classes',
        key: 'class_id'
      }
    },
    subjectId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'subject_id',
      references: {
        model: 'subjects',
        key: 'subject_id'
      }
    },
    section: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'start_date'
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'end_date'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    }
  },
  {
    sequelize,
    tableName: 'staff_assignments',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['staff_id'] },
      { fields: ['academic_year_id'] },
      { fields: ['assignment_type'] },
      { fields: ['class_id'] },
      { fields: ['subject_id'] }
    ]
  }
);

export default StaffAssignment;
