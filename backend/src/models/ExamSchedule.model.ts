import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';
import type Exam from './Exam.model';

/**
 * ExamSchedule Attributes Interface
 */
export interface ExamScheduleAttributes {
  examScheduleId: number;
  examId: number;
  subjectId: number;
  date: Date;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  roomNumber?: string;
  invigilators?: number[]; // Array of teacher user IDs
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

/**
 * ExamSchedule Creation Attributes (optional fields for creation)
 */
export interface ExamScheduleCreationAttributes extends Optional<ExamScheduleAttributes,
  'examScheduleId' | 'roomNumber' | 'invigilators' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

/**
 * ExamSchedule Model Class
 * 
 * Requirements: 7.3, 7.4
 */
class ExamSchedule extends Model<ExamScheduleAttributes, ExamScheduleCreationAttributes> implements ExamScheduleAttributes {
  declare examScheduleId: number;
  declare examId: number;
  declare subjectId: number;
  declare date: Date;
  declare startTime: string;
  declare endTime: string;
  declare roomNumber?: string;
  declare invigilators?: number[];
  
  // Association
  declare exam?: Exam;
  
  // Timestamps
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt?: Date;

  /**
   * Get duration in minutes
   */
  public getDurationMinutes(): number {
    const [startHour, startMin] = this.startTime.split(':').map(Number);
    const [endHour, endMin] = this.endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return endMinutes - startMinutes;
  }

  /**
   * Check if schedule overlaps with another schedule
   */
  public overlaps(other: ExamSchedule): boolean {
    // Check if dates are the same
    if (this.date.toDateString() !== other.date.toDateString()) {
      return false;
    }

    // Check time overlap
    const thisStart = this.startTime;
    const thisEnd = this.endTime;
    const otherStart = other.startTime;
    const otherEnd = other.endTime;

    // Convert to minutes for easier comparison
    const toMinutes = (time: string): number => {
      const [hour, min] = time.split(':').map(Number);
      return hour * 60 + min;
    };

    const thisStartMin = toMinutes(thisStart);
    const thisEndMin = toMinutes(thisEnd);
    const otherStartMin = toMinutes(otherStart);
    const otherEndMin = toMinutes(otherEnd);

    // Check if time ranges overlap
    return (
      (thisStartMin < otherEndMin && thisEndMin > otherStartMin) ||
      (otherStartMin < thisEndMin && otherEndMin > thisStartMin)
    );
  }

  /**
   * Check if a teacher is assigned as invigilator
   */
  public hasInvigilator(teacherId: number): boolean {
    return this.invigilators?.includes(teacherId) ?? false;
  }

  /**
   * Get number of invigilators
   */
  public getInvigilatorCount(): number {
    return this.invigilators?.length ?? 0;
  }

  /**
   * Add invigilator
   */
  public addInvigilator(teacherId: number): void {
    if (!this.invigilators) {
      this.invigilators = [];
    }
    if (!this.invigilators.includes(teacherId)) {
      this.invigilators.push(teacherId);
    }
  }

  /**
   * Remove invigilator
   */
  public removeInvigilator(teacherId: number): void {
    if (this.invigilators) {
      this.invigilators = this.invigilators.filter(id => id !== teacherId);
    }
  }

  /**
   * Validate time format (HH:mm)
   */
  public static isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  /**
   * Validate start time is before end time
   */
  public validateTimeOrder(): boolean {
    const [startHour, startMin] = this.startTime.split(':').map(Number);
    const [endHour, endMin] = this.endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return startMinutes < endMinutes;
  }
}

/**
 * Initialize ExamSchedule Model
 */
ExamSchedule.init(
  {
    examScheduleId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'exam_schedule_id'
    },
    examId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'exam_id'
    },
    subjectId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'subject_id'
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Exam date'
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'start_time',
      comment: 'Exam start time',
      validate: {
        is: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
      }
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'end_time',
      comment: 'Exam end time',
      validate: {
        is: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
      }
    },
    roomNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'room_number',
      comment: 'Room/Hall number for exam',
      validate: {
        len: [0, 50]
      }
    },
    invigilators: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of teacher user IDs assigned as invigilators',
      get() {
        const rawValue = this.getDataValue('invigilators');
        return rawValue ? (Array.isArray(rawValue) ? rawValue : []) : [];
      }
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
    tableName: 'exam_schedules',
    timestamps: true,
    paranoid: true, // Soft delete
    underscored: true,
    indexes: [
      {
        fields: ['exam_id']
      },
      {
        fields: ['subject_id']
      },
      {
        fields: ['date']
      },
      {
        fields: ['room_number']
      },
      {
        // Composite index for date and time queries
        name: 'idx_exam_schedules_date_time',
        fields: ['date', 'start_time']
      }
    ],
    validate: {
      // Custom validation to ensure start time is before end time
      timeOrderValid(this: ExamSchedule) {
        const startTime = this.getDataValue('startTime') as string;
        const endTime = this.getDataValue('endTime') as string;
        
        if (!startTime || !endTime) {
          return; // Skip validation if times aren't set yet
        }
        
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        
        if (startMinutes >= endMinutes) {
          throw new Error('Start time must be before end time');
        }
      }
    }
  }
);

export default ExamSchedule;
