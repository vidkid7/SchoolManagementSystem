/**
 * ECA (Extra-Curricular Activity) Model
 * 
 * Implements ECA entity with categories (clubs, cultural, community service, leadership)
 * 
 * Requirements: 11.1, 11.2
 */

import { DataTypes, Model, Optional } from 'sequelize';

export interface ECAAttributes {
  ecaId: number;
  name: string;
  nameNp?: string;
  category: 'club' | 'cultural' | 'community_service' | 'leadership';
  subcategory?: string;
  description?: string;
  descriptionNp?: string;
  coordinatorId: number;
  schedule?: string;
  capacity?: number;
  currentEnrollment: number;
  academicYearId: number;
  status: 'active' | 'inactive' | 'completed';
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface ECACreationAttributes extends Optional<ECAAttributes, 'ecaId' | 'currentEnrollment' | 'status'> {}

export class ECA
  extends Model<ECAAttributes, ECACreationAttributes>
  implements ECAAttributes
{
  public ecaId!: number;
  public name!: string;
  public nameNp?: string;
  public category!: 'club' | 'cultural' | 'community_service' | 'leadership';
  public subcategory?: string;
  public description?: string;
  public descriptionNp?: string;
  public coordinatorId!: number;
  public schedule?: string;
  public capacity?: number;
  public currentEnrollment!: number;
  public academicYearId!: number;
  public status!: 'active' | 'inactive' | 'completed';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;

  public hasCapacity(): boolean {
    if (!this.capacity) return true;
    return this.currentEnrollment < this.capacity;
  }

  public async incrementEnrollment(): Promise<void> {
    this.currentEnrollment += 1;
    await this.save();
  }

  public async decrementEnrollment(): Promise<void> {
    if (this.currentEnrollment > 0) {
      this.currentEnrollment -= 1;
      await this.save();
    }
  }

  public toJSON(): object {
    return {
      ecaId: this.ecaId,
      name: this.name,
      nameNp: this.nameNp,
      category: this.category,
      subcategory: this.subcategory,
      description: this.description,
      descriptionNp: this.descriptionNp,
      coordinatorId: this.coordinatorId,
      schedule: this.schedule,
      capacity: this.capacity,
      currentEnrollment: this.currentEnrollment,
      academicYearId: this.academicYearId,
      status: this.status,
      hasCapacity: this.hasCapacity(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export function initECA(sequelize: any): typeof ECA {
  ECA.init(
    {
      ecaId: {
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
        type: DataTypes.ENUM('club', 'cultural', 'community_service', 'leadership'),
        allowNull: false,
      },
      subcategory: {
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
      coordinatorId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'staff',
          key: 'staff_id',
        },
      },
      schedule: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      capacity: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      currentEnrollment: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
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
        type: DataTypes.ENUM('active', 'inactive', 'completed'),
        allowNull: false,
        defaultValue: 'active',
      },
    },
    {
      sequelize,
      tableName: 'ecas',
      timestamps: true,
      paranoid: true,
      underscored: true,
      indexes: [
        {
          name: 'idx_ecas_category',
          fields: ['category'],
        },
        {
          name: 'idx_ecas_coordinator',
          fields: ['coordinator_id'],
        },
        {
          name: 'idx_ecas_academic_year',
          fields: ['academic_year_id'],
        },
        {
          name: 'idx_ecas_status',
          fields: ['status'],
        },
      ],
    }
  );

  return ECA;
}

export default ECA;
