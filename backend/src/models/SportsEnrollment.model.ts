/**
 * Sports Enrollment Model
 * 
 * Implements SportsEnrollment entity for tracking student participation in sports
 * 
 * Requirements: 12.3, 12.4
 */

import { DataTypes, Model, Optional } from 'sequelize';

export interface SportsEnrollmentAttributes {
  enrollmentId: number;
  sportId: number;
  studentId: number;
  teamId?: number;
  enrollmentDate: Date;
  status: 'active' | 'withdrawn' | 'completed';
  attendanceCount: number;
  totalSessions: number;
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SportsEnrollmentCreationAttributes 
  extends Optional<SportsEnrollmentAttributes, 'enrollmentId' | 'attendanceCount' | 'totalSessions' | 'status'> {}

export class SportsEnrollment
  extends Model<SportsEnrollmentAttributes, SportsEnrollmentCreationAttributes>
  implements SportsEnrollmentAttributes
{
  public enrollmentId!: number;
  public sportId!: number;
  public studentId!: number;
  public teamId?: number;
  public enrollmentDate!: Date;
  public status!: 'active' | 'withdrawn' | 'completed';
  public attendanceCount!: number;
  public totalSessions!: number;
  public remarks?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Mark attendance for a practice session
   * Increments both attendance count and total sessions
   */
  public async markAttendance(): Promise<void> {
    this.attendanceCount += 1;
    this.totalSessions += 1;
    await this.save();
  }

  /**
   * Mark absence for a practice session
   * Increments only total sessions
   */
  public async markAbsent(): Promise<void> {
    this.totalSessions += 1;
    await this.save();
  }

  /**
   * Calculate attendance percentage
   * @returns Attendance percentage (0-100)
   */
  public getAttendancePercentage(): number {
    if (this.totalSessions === 0) {
      return 0;
    }
    return Math.round((this.attendanceCount / this.totalSessions) * 100 * 100) / 100;
  }

  /**
   * Check if student is assigned to a team
   * @returns True if assigned to a team
   */
  public isTeamMember(): boolean {
    return this.teamId !== undefined && this.teamId !== null;
  }

  public toJSON(): object {
    return {
      enrollmentId: this.enrollmentId,
      sportId: this.sportId,
      studentId: this.studentId,
      teamId: this.teamId,
      enrollmentDate: this.enrollmentDate,
      status: this.status,
      attendanceCount: this.attendanceCount,
      totalSessions: this.totalSessions,
      attendancePercentage: this.getAttendancePercentage(),
      isTeamMember: this.isTeamMember(),
      remarks: this.remarks,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export function initSportsEnrollment(sequelize: any): typeof SportsEnrollment {
  SportsEnrollment.init(
    {
      enrollmentId: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      sportId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'sports',
          key: 'sport_id',
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
      teamId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'teams',
          key: 'team_id',
        },
      },
      enrollmentDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
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
      tableName: 'sports_enrollments',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          name: 'idx_sports_enrollments_sport',
          fields: ['sport_id'],
        },
        {
          name: 'idx_sports_enrollments_student',
          fields: ['student_id'],
        },
        {
          name: 'idx_sports_enrollments_team',
          fields: ['team_id'],
        },
        {
          name: 'idx_sports_enrollments_status',
          fields: ['status'],
        },
        {
          name: 'idx_sports_enrollments_sport_student',
          fields: ['sport_id', 'student_id'],
          unique: false,
        },
      ],
    }
  );

  return SportsEnrollment;
}

export default SportsEnrollment;
