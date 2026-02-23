/**
 * ECA Achievement Model
 * 
 * Implements ECA achievement entity for awards and recognition
 * 
 * Requirements: 11.7, 11.8, 11.9
 */

import { DataTypes, Model, Optional } from 'sequelize';

export interface ECAAchievementAttributes {
  achievementId: number;
  ecaId: number;
  studentId: number;
  eventId?: number;
  title: string;
  titleNp?: string;
  type: 'award' | 'medal' | 'certificate' | 'recognition' | 'position';
  level: 'school' | 'district' | 'regional' | 'national' | 'international';
  position?: string;
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

export interface ECAAchievementCreationAttributes extends Optional<ECAAchievementAttributes, 'achievementId'> {}

export class ECAAchievement
  extends Model<ECAAchievementAttributes, ECAAchievementCreationAttributes>
  implements ECAAchievementAttributes
{
  public achievementId!: number;
  public ecaId!: number;
  public studentId!: number;
  public eventId?: number;
  public title!: string;
  public titleNp?: string;
  public type!: 'award' | 'medal' | 'certificate' | 'recognition' | 'position';
  public level!: 'school' | 'district' | 'regional' | 'national' | 'international';
  public position?: string;
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

  public getDisplayTitle(): string {
    if (this.position) {
      return `${this.title} - ${this.position}`;
    }
    return this.title;
  }

  public toJSON(): object {
    return {
      achievementId: this.achievementId,
      ecaId: this.ecaId,
      studentId: this.studentId,
      eventId: this.eventId,
      title: this.title,
      titleNp: this.titleNp,
      displayTitle: this.getDisplayTitle(),
      type: this.type,
      level: this.level,
      position: this.position,
      description: this.description,
      descriptionNp: this.descriptionNp,
      achievementDate: this.achievementDate,
      achievementDateBS: this.achievementDateBS,
      certificateUrl: this.certificateUrl,
      photoUrl: this.photoUrl,
      remarks: this.remarks,
      isHighLevel: this.isHighLevel(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export function initECAAchievement(sequelize: any): typeof ECAAchievement {
  ECAAchievement.init(
    {
      achievementId: {
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
      eventId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'eca_events',
          key: 'event_id',
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
        type: DataTypes.ENUM('award', 'medal', 'certificate', 'recognition', 'position'),
        allowNull: false,
      },
      level: {
        type: DataTypes.ENUM('school', 'district', 'regional', 'national', 'international'),
        allowNull: false,
      },
      position: {
        type: DataTypes.STRING(50),
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
      tableName: 'eca_achievements',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          name: 'idx_eca_achievements_eca',
          fields: ['eca_id'],
        },
        {
          name: 'idx_eca_achievements_student',
          fields: ['student_id'],
        },
        {
          name: 'idx_eca_achievements_event',
          fields: ['event_id'],
        },
        {
          name: 'idx_eca_achievements_type',
          fields: ['type'],
        },
        {
          name: 'idx_eca_achievements_level',
          fields: ['level'],
        },
        {
          name: 'idx_eca_achievements_date',
          fields: ['achievement_date'],
        },
      ],
    }
  );

  return ECAAchievement;
}

export default ECAAchievement;
