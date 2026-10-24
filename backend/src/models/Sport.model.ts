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
  declare public sportId: number;
  declare public name: string;
  declare public nameNp?: string;
  declare public category: 'individual' | 'team' | 'traditional';
  declare public description?: string;
  declare public descriptionNp?: string;
  declare public coordinatorId: number;
  declare public academicYearId: number;
  declare public status: 'active' | 'inactive';
  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
  declare public readonly deletedAt?: Date;

  public isTeamSport(): boolean {
    return this.getDataValue('category') === 'team';
  }

  public isIndividualSport(): boolean {
    return this.getDataValue('category') === 'individual';
  }

  public isTraditionalSport(): boolean {
    return this.getDataValue('category') === 'traditional';
  }

  public toJSON(): object {
    const values = this.get({ plain: true }) as SportAttributes;
    return {
      ...values,
      isTeamSport: this.isTeamSport(),
      isIndividualSport: this.isIndividualSport(),
      isTraditionalSport: this.isTraditionalSport(),
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
