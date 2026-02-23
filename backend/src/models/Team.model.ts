/**
 * Team Model
 * 
 * Implements Team entity with captain and members for team sports
 * 
 * Requirements: 12.2, 12.3
 */

import { DataTypes, Model, Optional } from 'sequelize';

export interface TeamAttributes {
  teamId: number;
  sportId: number;
  name: string;
  nameNp?: string;
  captainId?: number;
  members: number[];
  coachId?: number;
  academicYearId: number;
  status: 'active' | 'inactive';
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TeamCreationAttributes extends Optional<TeamAttributes, 'teamId' | 'members' | 'status'> {}

export class Team
  extends Model<TeamAttributes, TeamCreationAttributes>
  implements TeamAttributes
{
  public teamId!: number;
  public sportId!: number;
  public name!: string;
  public nameNp?: string;
  public captainId?: number;
  public members!: number[];
  public coachId?: number;
  public academicYearId!: number;
  public status!: 'active' | 'inactive';
  public remarks?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public addMember(studentId: number): void {
    if (!this.members) {
      this.members = [];
    }
    if (!this.members.includes(studentId)) {
      this.members.push(studentId);
    }
  }

  public removeMember(studentId: number): void {
    if (this.members) {
      this.members = this.members.filter(id => id !== studentId);
      // If captain is removed, clear captain
      if (this.captainId === studentId) {
        this.captainId = undefined;
      }
    }
  }

  public setCaptain(studentId: number): boolean {
    // Captain must be a team member
    if (this.members && this.members.includes(studentId)) {
      this.captainId = studentId;
      return true;
    }
    return false;
  }

  public getMemberCount(): number {
    return this.members?.length || 0;
  }

  public hasCaptain(): boolean {
    return this.captainId !== undefined && this.captainId !== null;
  }

  public isMember(studentId: number): boolean {
    return this.members?.includes(studentId) || false;
  }

  public toJSON(): object {
    return {
      teamId: this.teamId,
      sportId: this.sportId,
      name: this.name,
      nameNp: this.nameNp,
      captainId: this.captainId,
      members: this.members,
      memberCount: this.getMemberCount(),
      coachId: this.coachId,
      academicYearId: this.academicYearId,
      status: this.status,
      hasCaptain: this.hasCaptain(),
      remarks: this.remarks,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export function initTeam(sequelize: any): typeof Team {
  Team.init(
    {
      teamId: {
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
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      nameNp: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      captainId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'students',
          key: 'student_id',
        },
      },
      members: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      coachId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'staff',
          key: 'staff_id',
        },
      },
      academicYearId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'academic_years',
          key: 'academic_year_id',
        },
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'teams',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          name: 'idx_teams_sport',
          fields: ['sport_id'],
        },
        {
          name: 'idx_teams_captain',
          fields: ['captain_id'],
        },
        {
          name: 'idx_teams_coach',
          fields: ['coach_id'],
        },
        {
          name: 'idx_teams_academic_year',
          fields: ['academic_year_id'],
        },
        {
          name: 'idx_teams_status',
          fields: ['status'],
        },
      ],
    }
  );

  return Team;
}

export default Team;
