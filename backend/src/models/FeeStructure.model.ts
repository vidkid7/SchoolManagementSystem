import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

/**
 * Fee Component Type Enum
 */
export enum FeeComponentType {
  ADMISSION = 'admission',
  ANNUAL = 'annual',
  MONTHLY = 'monthly',
  EXAM = 'exam',
  TRANSPORT = 'transport',
  HOSTEL = 'hostel',
  LIBRARY = 'library',
  LAB = 'lab',
  ECA = 'eca',
  DEVELOPMENT = 'development'
}

/**
 * Fee Frequency Enum
 */
export enum FeeFrequency {
  ONE_TIME = 'one_time',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual'
}

/**
 * Fee Component Attributes Interface
 */
export interface FeeComponentAttributes {
  feeComponentId: number;
  feeStructureId: number;
  name: string;
  type: FeeComponentType;
  amount: number;
  frequency: FeeFrequency;
  isMandatory: boolean;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Fee Component Creation Attributes
 */
export interface FeeComponentCreationAttributes extends Optional<FeeComponentAttributes,
  'feeComponentId' | 'description' | 'createdAt' | 'updatedAt'> {}

/**
 * Fee Component Model Class
 */
class FeeComponent extends Model<FeeComponentAttributes, FeeComponentCreationAttributes> 
  implements FeeComponentAttributes {
  public feeComponentId!: number;
  public feeStructureId!: number;
  public name!: string;
  public type!: FeeComponentType;
  public amount!: number;
  public frequency!: FeeFrequency;
  public isMandatory!: boolean;
  public description?: string;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

/**
 * Initialize Fee Component Model
 */
FeeComponent.init(
  {
    feeComponentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'fee_component_id'
    },
    feeStructureId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'fee_structure_id',
      references: {
        model: 'fee_structures',
        key: 'fee_structure_id'
      }
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100]
      }
    },
    type: {
      type: DataTypes.ENUM(...Object.values(FeeComponentType)),
      allowNull: false,
      comment: 'Type of fee component'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      },
      comment: 'Amount in NPR'
    },
    frequency: {
      type: DataTypes.ENUM(...Object.values(FeeFrequency)),
      allowNull: false,
      comment: 'How often this fee is charged'
    },
    isMandatory: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_mandatory',
      comment: 'Whether this fee component is mandatory'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  },
  {
    sequelize,
    tableName: 'fee_components',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['fee_structure_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['frequency']
      }
    ]
  }
);

/**
 * Fee Structure Attributes Interface
 */
export interface FeeStructureAttributes {
  feeStructureId: number;
  name: string;
  applicableClasses: number[];
  applicableShifts: string[];
  academicYearId: number;
  totalAmount: number;
  isActive: boolean;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

/**
 * Fee Structure Creation Attributes
 */
export interface FeeStructureCreationAttributes extends Optional<FeeStructureAttributes,
  'feeStructureId' | 'totalAmount' | 'isActive' | 'description' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

/**
 * Fee Structure Model Class
 */
class FeeStructure extends Model<FeeStructureAttributes, FeeStructureCreationAttributes> 
  implements FeeStructureAttributes {
  public feeStructureId!: number;
  public name!: string;
  public applicableClasses!: number[];
  public applicableShifts!: string[];
  public academicYearId!: number;
  public totalAmount!: number;
  public isActive!: boolean;
  public description?: string;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;

  // Association property
  public readonly feeComponents?: FeeComponent[];

  /**
   * Calculate total amount from fee components
   */
  public async calculateTotalAmount(): Promise<number> {
    if (!this.feeComponents) {
      const components = await FeeComponent.findAll({
        where: { feeStructureId: this.feeStructureId }
      });
      return components.reduce((sum, component) => sum + Number(component.amount), 0);
    }
    return this.feeComponents.reduce((sum, component) => sum + Number(component.amount), 0);
  }

  /**
   * Check if applicable to a specific class and shift
   */
  public isApplicableTo(gradeLevel: number, shift: string): boolean {
    return this.applicableClasses.includes(gradeLevel) && 
           this.applicableShifts.includes(shift);
  }

  /**
   * Get mandatory fee components
   */
  public async getMandatoryComponents(): Promise<FeeComponent[]> {
    return FeeComponent.findAll({
      where: {
        feeStructureId: this.feeStructureId,
        isMandatory: true
      }
    });
  }

  /**
   * Get optional fee components
   */
  public async getOptionalComponents(): Promise<FeeComponent[]> {
    return FeeComponent.findAll({
      where: {
        feeStructureId: this.feeStructureId,
        isMandatory: false
      }
    });
  }
}

/**
 * Initialize Fee Structure Model
 */
FeeStructure.init(
  {
    feeStructureId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'fee_structure_id'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100]
      },
      comment: 'Name of the fee structure (e.g., "Class 1-5 Morning Shift 2081")'
    },
    applicableClasses: {
      type: DataTypes.JSON,
      allowNull: false,
      field: 'applicable_classes',
      validate: {
        isValidArray(value: any) {
          if (!Array.isArray(value)) {
            throw new Error('applicableClasses must be an array');
          }
          if (value.length === 0) {
            throw new Error('applicableClasses cannot be empty');
          }
          if (!value.every((v: any) => typeof v === 'number' && v >= 1 && v <= 12)) {
            throw new Error('applicableClasses must contain grade levels between 1 and 12');
          }
        }
      },
      comment: 'Array of grade levels [1,2,3...12]'
    },
    applicableShifts: {
      type: DataTypes.JSON,
      allowNull: false,
      field: 'applicable_shifts',
      validate: {
        isValidArray(value: any) {
          if (!Array.isArray(value)) {
            throw new Error('applicableShifts must be an array');
          }
          if (value.length === 0) {
            throw new Error('applicableShifts cannot be empty');
          }
          const validShifts = ['morning', 'day', 'evening'];
          if (!value.every((v: any) => validShifts.includes(v))) {
            throw new Error('applicableShifts must contain valid shift values');
          }
        }
      },
      comment: 'Array of shifts ["morning", "day", "evening"]'
    },
    academicYearId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'academic_year_id',
      references: {
        model: 'academic_years',
        key: 'academic_year_id'
      },
      comment: 'Link to academic year'
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'total_amount',
      validate: {
        min: 0
      },
      comment: 'Total amount of all fee components in NPR'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
      comment: 'Whether this fee structure is currently active'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at'
    }
  },
  {
    sequelize,
    tableName: 'fee_structures',
    timestamps: true,
    paranoid: true, // Soft delete
    underscored: true,
    indexes: [
      {
        fields: ['academic_year_id']
      },
      {
        fields: ['is_active']
      },
      {
        name: 'idx_fee_structures_academic_year_active',
        fields: ['academic_year_id', 'is_active']
      }
    ]
  }
);

// Define associations
FeeStructure.hasMany(FeeComponent, {
  foreignKey: 'feeStructureId',
  as: 'feeComponents',
  onDelete: 'CASCADE'
});

FeeComponent.belongsTo(FeeStructure, {
  foreignKey: 'feeStructureId',
  as: 'feeStructure'
});

export { FeeStructure, FeeComponent };
export default FeeStructure;
