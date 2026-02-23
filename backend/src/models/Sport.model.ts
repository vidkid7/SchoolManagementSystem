/**
 * Sport Model
 * 
 * Implements Sport entity with categories (individual, team, traditional)
 * 
 * Requirements: 12.1
 */

import { DataTypes, Model, Optional } from 'sequelize';

export interface SportAttributes {
  sportId: number;
  name: string;
  nameNp?: string;
  category: 'individual' | 'team' | 'traditional';
  description?: string;
  descriptionNp?: string;
  coordinatorId: number;
  academicYearId: number;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface SportCreationAttributes extends Optional<SportAttributes, 'sportId' | 'status'> {}

export class Sport
  extends Model<SportAttributes, SportCreationAttributes>
  implements SportAttributes
{
  public sportId!: number;
  public name!: string;
  public nameNp?: string;
  public category!: 'individual' | 'team' | 'traditional';
  public description?: string;
  public descriptionNp?: string;
  public coordinatorId!: number;
  public academicYearId!: number;
  public status!: 'active' | 'inactive';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;

  public isTeamSport(): boolean {
    return this.category === 'team';
  }

  public isIndividualSport(): boolean {
    return this.category === 'individual';
  }

  public isTraditionalSport(): boolean {
    return this.category === 'traditional';
  }

  public toJSON(): object {
    return {
      sportId: this.sportId,
      name: this.name,
      nameNp: this.nameNp,
      category: this.category,
      description: this.description,
      descriptionNp: this.descriptionNp,
      coordinatorId: this.coordinatorId,
      academicYearId: this.academicYearId,
      status: this.status,
      isTeamSport: this.isTeamSport(),
      isIndividualSport: this.isIndividualSport(),
      isTraditionalSport: this.isTraditionalSport(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export function initSport(sequelize: any): typeof Sport {
  Sport.init(
    {
      sportId: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      nameNp: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      category: {
        type: DataTypes.ENUM('individual', 'team', 'traditional'),
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
      coordinatorId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
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
    },
    {
      sequelize,
      tableName: 'sports',
      timestamps: true,
      paranoid: true,
      underscored: true,
      indexes: [
        {
          name: 'idx_sports_category',
          fields: ['category'],
        },
        {
          name: 'idx_sports_coordinator',
          fields: ['coordinator_id'],
        },
        {
          name: 'idx_sports_academic_year',
          fields: ['academic_year_id'],
        },
        {
          name: 'idx_sports_status',
          fields: ['status'],
        },
      ],
    }
  );

  return Sport;
}

export default Sport;
