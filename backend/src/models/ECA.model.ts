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
    const capacity = Number(this.getDataValue('capacity') ?? 0);
    if (!capacity) return true;
    return Number(this.getDataValue('currentEnrollment') ?? 0) < capacity;
  }

  public async incrementEnrollment(): Promise<void> {
    this.setDataValue('currentEnrollment', Number(this.getDataValue('currentEnrollment') ?? 0) + 1);
    await this.save();
  }

  public async decrementEnrollment(): Promise<void> {
    const currentEnrollment = Number(this.getDataValue('currentEnrollment') ?? 0);
    if (currentEnrollment > 0) {
      this.setDataValue('currentEnrollment', currentEnrollment - 1);
      await this.save();
    }
  }

  public toJSON(): object {
    const values = this.get({ plain: true }) as ECAAttributes;
    return {
      ...values,
      hasCapacity: this.hasCapacity(),
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
