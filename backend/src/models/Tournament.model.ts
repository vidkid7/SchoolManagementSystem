/**
 * Tournament Model
 * 
 * Implements Tournament entity with schedule and results
 * 
 * Requirements: 12.5, 12.6, 12.10
 */

import { DataTypes, Model, Optional } from 'sequelize';

export interface MatchResult {
  matchId: string;
  date: string;
  dateBS?: string;
  team1Id?: number;
  team2Id?: number;
  participant1Id?: number;
  participant2Id?: number;
  score1?: string;
  score2?: string;
  winnerId?: number;
  remarks?: string;
}

export interface TournamentAttributes {
  tournamentId: number;
  sportId: number;
  name: string;
  nameNp?: string;
  type: 'inter_school' | 'intra_school' | 'district' | 'regional' | 'national';
  description?: string;
  descriptionNp?: string;
  startDate: Date;
  startDateBS?: string;
  endDate: Date;
  endDateBS?: string;
  venue?: string;
  venueNp?: string;
  teams?: number[];
  participants?: number[];
  schedule?: MatchResult[];
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  photos?: string[];
  videos?: string[];
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TournamentCreationAttributes extends Optional<TournamentAttributes, 'tournamentId' | 'status'> {}

export class Tournament
  extends Model<TournamentAttributes, TournamentCreationAttributes>
  implements TournamentAttributes
{
  public tournamentId!: number;
  public sportId!: number;
  public name!: string;
  public nameNp?: string;
  public type!: 'inter_school' | 'intra_school' | 'district' | 'regional' | 'national';
  public description?: string;
  public descriptionNp?: string;
  public startDate!: Date;
  public startDateBS?: string;
  public endDate!: Date;
  public endDateBS?: string;
  public venue?: string;
  public venueNp?: string;
  public teams?: number[];
  public participants?: number[];
  public schedule?: MatchResult[];
  public status!: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  public photos?: string[];
  public videos?: string[];
  public remarks?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public addTeam(teamId: number): void {
    if (!this.teams) {
      this.teams = [];
    }
    if (!this.teams.includes(teamId)) {
      this.teams.push(teamId);
    }
  }

  public removeTeam(teamId: number): void {
    if (this.teams) {
      this.teams = this.teams.filter(id => id !== teamId);
    }
  }

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

  public addMatch(match: MatchResult): void {
    if (!this.schedule) {
      this.schedule = [];
    }
    this.schedule.push(match);
  }

  public updateMatchResult(matchId: string, result: Partial<MatchResult>): boolean {
    if (!this.schedule) return false;
    
    const matchIndex = this.schedule.findIndex(m => m.matchId === matchId);
    if (matchIndex === -1) return false;

    this.schedule[matchIndex] = {
      ...this.schedule[matchIndex],
      ...result,
    };
    return true;
  }

  public getTeamCount(): number {
    return this.teams?.length || 0;
  }

  public getParticipantCount(): number {
    return this.participants?.length || 0;
  }

  public getMatchCount(): number {
    return this.schedule?.length || 0;
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

  public isTeamTournament(): boolean {
    return this.teams !== undefined && this.teams.length > 0;
  }

  public isIndividualTournament(): boolean {
    return this.participants !== undefined && this.participants.length > 0;
  }

  public toJSON(): object {
    return {
      tournamentId: this.tournamentId,
      sportId: this.sportId,
      name: this.name,
      nameNp: this.nameNp,
      type: this.type,
      description: this.description,
      descriptionNp: this.descriptionNp,
      startDate: this.startDate,
      startDateBS: this.startDateBS,
      endDate: this.endDate,
      endDateBS: this.endDateBS,
      venue: this.venue,
      venueNp: this.venueNp,
      teams: this.teams,
      teamCount: this.getTeamCount(),
      participants: this.participants,
      participantCount: this.getParticipantCount(),
      schedule: this.schedule,
      matchCount: this.getMatchCount(),
      status: this.status,
      photos: this.photos,
      videos: this.videos,
      remarks: this.remarks,
      isTeamTournament: this.isTeamTournament(),
      isIndividualTournament: this.isIndividualTournament(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export function initTournament(sequelize: any): typeof Tournament {
  Tournament.init(
    {
      tournamentId: {
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
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      nameNp: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM('inter_school', 'intra_school', 'district', 'regional', 'national'),
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
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      startDateBS: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      endDateBS: {
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
      teams: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      participants: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      schedule: {
        type: DataTypes.JSON,
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
      tableName: 'tournaments',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          name: 'idx_tournaments_sport',
          fields: ['sport_id'],
        },
        {
          name: 'idx_tournaments_type',
          fields: ['type'],
        },
        {
          name: 'idx_tournaments_start_date',
          fields: ['start_date'],
        },
        {
          name: 'idx_tournaments_status',
          fields: ['status'],
        },
      ],
    }
  );

  return Tournament;
}

export default Tournament;
