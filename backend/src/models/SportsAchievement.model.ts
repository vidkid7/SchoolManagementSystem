/**
 * Sports Achievement Model
 * 
 * Implements SportsAchievement entity for medals, ranks, records
 * 
 * Requirements: 12.7, 12.8, 12.9, 12.11
 */

import { DataTypes, Model, Optional } from 'sequelize';

export interface SportsAchievementAttributes {
  achievementId: number;
  sportId: number;
  studentId: number;
  teamId?: number;
  tournamentId?: number;
  title: string;
  titleNp?: string;
  type: 'medal' | 'trophy' | 'certificate' | 'rank' | 'record' | 'recognition';
  level: 'school' | 'inter_school' | 'district' | 'regional' | 'national' | 'international';
  position?: string;
  medal?: 'gold' | 'silver' | 'bronze';
  recordType?: string;
  recordValue?: string;
  description?: string;
  descriptionNp?: string;
  achievementDate: Date;
  achievementDateBS?: string;
  certificateUrl?: string;
  photoUrl?: string;
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SportsAchievementCreationAttributes extends Optional<SportsAchievementAttributes, 'achievementId'> {}

export class SportsAchievement
  extends Model<SportsAchievementAttributes, SportsAchievementCreationAttributes>
  implements SportsAchievementAttributes
{
  public achievementId!: number;
  public sportId!: number;
  public studentId!: number;
  public teamId?: number;
  public tournamentId?: number;
  public title!: string;
  public titleNp?: string;
  public type!: 'medal' | 'trophy' | 'certificate' | 'rank' | 'record' | 'recognition';
  public level!: 'school' | 'inter_school' | 'district' | 'regional' | 'national' | 'international';
  public position?: string;
  public medal?: 'gold' | 'silver' | 'bronze';
  public recordType?: string;
  public recordValue?: string;
  public description?: string;
  public descriptionNp?: string;
  public achievementDate!: Date;
  public achievementDateBS?: string;
  public certificateUrl?: string;
  public photoUrl?: string;
  public remarks?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public isHighLevel(): boolean {
    return ['national', 'international'].includes(this.level);
  }

  public isMedal(): boolean {
    return this.type === 'medal' && this.medal !== undefined;
  }

  public isRecord(): boolean {
    return this.type === 'record';
  }

  public isTeamAchievement(): boolean {
    return this.teamId !== undefined && this.teamId !== null;
  }

  public isIndividualAchievement(): boolean {
    return !this.isTeamAchievement();
  }

  public getDisplayTitle(): string {
    let title = this.title;
    
    if (this.medal) {
      title = `${this.medal.charAt(0).toUpperCase() + this.medal.slice(1)} Medal - ${title}`;
    } else if (this.position) {
      title = `${title} - ${this.position}`;
    }
    
    if (this.recordType && this.recordValue) {
      title = `${title} (${this.recordType}: ${this.recordValue})`;
    }
    
    return title;
  }

  public getMedalPoints(): number {
    if (!this.isMedal()) return 0;
    
    const medalPoints: Record<string, number> = {
      gold: 3,
      silver: 2,
      bronze: 1,
    };
    
    return medalPoints[this.medal!] || 0;
  }

  public toJSON(): object {
    return {
      achievementId: this.achievementId,
      sportId: this.sportId,
      studentId: this.studentId,
      teamId: this.teamId,
      tournamentId: this.tournamentId,
      title: this.title,
      titleNp: this.titleNp,
      displayTitle: this.getDisplayTitle(),
      type: this.type,
      level: this.level,
      position: this.position,
      medal: this.medal,
      recordType: this.recordType,
      recordValue: this.recordValue,
      description: this.description,
      descriptionNp: this.descriptionNp,
      achievementDate: this.achievementDate,
      achievementDateBS: this.achievementDateBS,
      certificateUrl: this.certificateUrl,
      photoUrl: this.photoUrl,
      remarks: this.remarks,
      isHighLevel: this.isHighLevel(),
      isMedal: this.isMedal(),
      isRecord: this.isRecord(),
      isTeamAchievement: this.isTeamAchievement(),
      isIndividualAchievement: this.isIndividualAchievement(),
      medalPoints: this.getMedalPoints(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export function initSportsAchievement(sequelize: any): typeof SportsAchievement {
  SportsAchievement.init(
    {
      achievementId: {
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
      tournamentId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'tournaments',
          key: 'tournament_id',
        },
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      titleNp: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM('medal', 'trophy', 'certificate', 'rank', 'record', 'recognition'),
        allowNull: false,
      },
      level: {
        type: DataTypes.ENUM('school', 'inter_school', 'district', 'regional', 'national', 'international'),
        allowNull: false,
      },
      position: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      medal: {
        type: DataTypes.ENUM('gold', 'silver', 'bronze'),
        allowNull: true,
      },
      recordType: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      recordValue: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      descriptionNp: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      achievementDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      achievementDateBS: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      certificateUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      photoUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'sports_achievements',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          name: 'idx_sports_achievements_sport',
          fields: ['sport_id'],
        },
        {
          name: 'idx_sports_achievements_student',
          fields: ['student_id'],
        },
        {
          name: 'idx_sports_achievements_team',
          fields: ['team_id'],
        },
        {
          name: 'idx_sports_achievements_tournament',
          fields: ['tournament_id'],
        },
        {
          name: 'idx_sports_achievements_type',
          fields: ['type'],
        },
        {
          name: 'idx_sports_achievements_level',
          fields: ['level'],
        },
        {
          name: 'idx_sports_achievements_medal',
          fields: ['medal'],
        },
        {
          name: 'idx_sports_achievements_date',
          fields: ['achievement_date'],
        },
      ],
    }
  );

  return SportsAchievement;
}

export default SportsAchievement;
