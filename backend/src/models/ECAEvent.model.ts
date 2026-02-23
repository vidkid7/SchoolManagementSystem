/**
 * ECA Event Model
 * 
 * Implements ECA event entity for competitions, performances, exhibitions
 * 
 * Requirements: 11.5, 11.6, 11.10
 */

import { DataTypes, Model, Optional } from 'sequelize';

export interface ECAEventAttributes {
  eventId: number;
  ecaId: number;
  name: string;
  nameNp?: string;
  type: 'competition' | 'performance' | 'exhibition' | 'workshop' | 'other';
  description?: string;
  descriptionNp?: string;
  eventDate: Date;
  eventDateBS?: string;
  venue?: string;
  venueNp?: string;
  participants?: number[];
  organizer?: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  photos?: string[];
  videos?: string[];
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ECAEventCreationAttributes extends Optional<ECAEventAttributes, 'eventId' | 'status'> {}

export class ECAEvent
  extends Model<ECAEventAttributes, ECAEventCreationAttributes>
  implements ECAEventAttributes
{
  public eventId!: number;
  public ecaId!: number;
  public name!: string;
  public nameNp?: string;
  public type!: 'competition' | 'performance' | 'exhibition' | 'workshop' | 'other';
  public description?: string;
  public descriptionNp?: string;
  public eventDate!: Date;
  public eventDateBS?: string;
  public venue?: string;
  public venueNp?: string;
  public participants?: number[];
  public organizer?: string;
  public status!: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  public photos?: string[];
  public videos?: string[];
  public remarks?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public addParticipant(studentId: number): void {
    if (!this.participants) {
      this.participants = [];
    }
    if (!this.participants.includes(studentId)) {
      this.participants.push(studentId);
    }
  }

  public removeParticipant(studentId: number): void {
    if (this.participants) {
      this.participants = this.participants.filter(id => id !== studentId);
    }
  }

  public getParticipantCount(): number {
    return this.participants?.length || 0;
  }

  public addPhoto(photoUrl: string): void {
    if (!this.photos) {
      this.photos = [];
    }
    this.photos.push(photoUrl);
  }

  public addVideo(videoUrl: string): void {
    if (!this.videos) {
      this.videos = [];
    }
    this.videos.push(videoUrl);
  }

  public toJSON(): object {
    return {
      eventId: this.eventId,
      ecaId: this.ecaId,
      name: this.name,
      nameNp: this.nameNp,
      type: this.type,
      description: this.description,
      descriptionNp: this.descriptionNp,
      eventDate: this.eventDate,
      eventDateBS: this.eventDateBS,
      venue: this.venue,
      venueNp: this.venueNp,
      participants: this.participants,
      participantCount: this.getParticipantCount(),
      organizer: this.organizer,
      status: this.status,
      photos: this.photos,
      videos: this.videos,
      remarks: this.remarks,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export function initECAEvent(sequelize: any): typeof ECAEvent {
  ECAEvent.init(
    {
      eventId: {
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
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      nameNp: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM('competition', 'performance', 'exhibition', 'workshop', 'other'),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      descriptionNp: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      eventDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      eventDateBS: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      venue: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      venueNp: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      participants: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      organizer: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('scheduled', 'ongoing', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'scheduled',
      },
      photos: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      videos: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'eca_events',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          name: 'idx_eca_events_eca',
          fields: ['eca_id'],
        },
        {
          name: 'idx_eca_events_date',
          fields: ['event_date'],
        },
        {
          name: 'idx_eca_events_type',
          fields: ['type'],
        },
        {
          name: 'idx_eca_events_status',
          fields: ['status'],
        },
      ],
    }
  );

  return ECAEvent;
}

export default ECAEvent;
