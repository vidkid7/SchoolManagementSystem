import { DataTypes, Model } from 'sequelize';
import sequelize from '@config/database';

/**
 * Academic Year Model
 * Requirements: 5.1, N4.1
 */
class AcademicYear extends Model {
  declare academicYearId: number;
  declare name: string;
  declare startDateBS: string;
  declare endDateBS: string;
  declare startDateAD: Date;
  declare endDateAD: Date;
  declare isCurrent: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

AcademicYear.init(
  {
    academicYearId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'academic_year_id'
    },
    name: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: 'e.g., "2081-2082 BS"'
    },
    startDateBS: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'start_date_bs',
      comment: 'Baisakh 1 (April 14)'
    },
    endDateBS: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'end_date_bs',
      comment: 'Chaitra end (March 14)'
    },
    startDateAD: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'start_date_ad'
    },
    endDateAD: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'end_date_ad'
    },
    isCurrent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_current'
    }
  },
  {
    sequelize,
    tableName: 'academic_years',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      { fields: ['is_current'] }
    ]
  }
);

/**
 * Term Model
 * Requirements: 5.2
 */
class Term extends Model {
  public termId!: number;
  public academicYearId!: number;
  public name!: string;
  public startDate!: Date;
  public endDate!: Date;
  public examStartDate?: Date;
  public examEndDate?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Term.init(
  {
    termId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'term_id'
    },
    academicYearId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'academic_year_id',
      references: {
        model: 'academic_years',
        key: 'academic_year_id'
      }
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'First Terminal, Second Terminal, Final'
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'start_date'
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'end_date'
    },
    examStartDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'exam_start_date'
    },
    examEndDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'exam_end_date'
    }
  },
  {
    sequelize,
    tableName: 'terms',
    timestamps: true,
    paranoid: true,
    underscored: true
  }
);

// Define associations
AcademicYear.hasMany(Term, {
  foreignKey: 'academicYearId',
  as: 'terms'
});

Term.belongsTo(AcademicYear, {
  foreignKey: 'academicYearId',
  as: 'academicYear'
});

export { AcademicYear, Term };
