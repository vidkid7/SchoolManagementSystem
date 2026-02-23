/**
 * ECA Enrollment Model
 * 
 * Implements ECA enrollment entity for student participation tracking
 * 
 * Requirements: 11.3, 11.4
 */

import { DataTypes, Model, Optional } from 'sequelize';

export interface ECAEnrollmentAttributes {
  enrollmentId: number;
  ecaId: number;
  studentId: number;
  enrollmentDate: Date;
  status: 'active' | 'withdrawn' | 'completed';
  attendanceCount: number;
  totalSessions: number;
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ECAEnrollmentCreationAttributes extends Optional<ECAEnrollmentAttributes, 'enrollmentId' | 'attendanceCount' | 'totalSessions' | 'status'> {}

export class ECAEnrollment
  extends Model<ECAEnrollmentAttributes, ECAEnrollmentCreationAttributes>
  implements ECAEnrollmentAttributes
{
  public enrollmentId!: number;
  public ecaId!: number;
  public studentId!: number;
  public enrollmentDate!: Date;
  public status!: 'active' | 'withdrawn' | 'completed';
  public attendanceCount!: number;
  public totalSessions!: number;
  public remarks?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public getAttendancePercentage(): number {
    if (this.totalSessions === 0) return 0;
    return Math.round((this.attendanceCount / this.totalSessions) * 100);
  }

  public async markAttendance(): Promise<void> {
    this.attendanceCount += 1;
    this.totalSessions += 1;
    await this.save();
  }

  public async markAbsent(): Promise<void> {
    this.totalSessions += 1;
    await this.save();
  }

  public toJSON(): object {
    return {
      enrollmentId: this.enrollmentId,
      ecaId: this.ecaId,
      studentId: this.studentId,
      enrollmentDate: this.enrollmentDate,
      status: this.status,
      attendanceCount: this.attendanceCount,
      totalSessions: this.totalSessions,
      attendancePercentage: this.getAttendancePercentage(),
      remarks: this.remarks,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export function initECAEnrollment(sequelize: any): typeof ECAEnrollment {
  ECAEnrollment.init(
    {
      enrollmentId: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      ecaId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'ecas',
          key: 'eca_id',
        },
      },
      studentId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'students',
          key: 'student_id',
        },
      },
      enrollmentDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      status: {
        type: DataTypes.ENUM('active', 'withdrawn', 'completed'),
        allowNull: false,
        defaultValue: 'active',
      },
      attendanceCount: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      totalSessions: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'eca_enrollments',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          name: 'idx_eca_enrollments_eca',
          fields: ['eca_id'],
        },
        {
          name: 'idx_eca_enrollments_student',
          fields: ['student_id'],
        },
        {
          name: 'idx_eca_enrollments_status',
          fields: ['status'],
        },
        {
          name: 'idx_eca_enrollments_unique',
          fields: ['eca_id', 'student_id'],
          unique: true,
        },
      ],
    }
  );

  return ECAEnrollment;
}

export default ECAEnrollment;
