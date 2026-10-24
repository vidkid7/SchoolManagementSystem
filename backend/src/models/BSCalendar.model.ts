import { Model, DataTypes } from 'sequelize';
import sequelize from '@config/database';

/**
 * BSCalendar Model
 * Represents Bikram Sambat calendar data for accurate date conversions
 * Stores days per month for each BS year from 2000-2100 BS (1943-2043 AD)
 * 
 * Requirements: N4.1, N4.7
 */

class BSCalendar extends Model {
  declare public id: number;
  declare public yearBs: number;
  declare public monthBs: number;
  declare public daysInMonth: number;
  declare public startDateAd: Date;
  declare public endDateAd: Date;
  declare public monthNameEn: string;
  declare public monthNameNp: string;
  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  /**
   * Get month name in English for a given month number
   */
  public static getMonthNameEn(monthBS: number): string {
    const monthNames = [
      'Baisakh',   // 1
      'Jestha',    // 2
      'Asar',      // 3
      'Shrawan',   // 4
      'Bhadra',    // 5
      'Aswin',     // 6
      'Kartik',    // 7
      'Mangsir',   // 8
      'Poush',     // 9
      'Magh',      // 10
      'Falgun',    // 11
      'Chaitra'    // 12
    ];
    return monthNames[monthBS - 1] || '';
  }

  /**
   * Get month name in Nepali for a given month number
   */
  public static getMonthNameNp(monthBS: number): string {
    const monthNames = [
      'बैशाख',   // 1
      'जेठ',     // 2
      'असार',    // 3
      'श्रावण',  // 4
      'भाद्र',   // 5
      'आश्विन',  // 6
      'कार्तिक', // 7
      'मंसिर',   // 8
      'पौष',     // 9
      'माघ',     // 10
      'फाल्गुन', // 11
      'चैत्र'    // 12
    ];
    return monthNames[monthBS - 1] || '';
  }
}

BSCalendar.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    yearBs: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      validate: {
        min: 2000,
        max: 2100
      }
    },
    monthBs: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      validate: {
        min: 1,
        max: 12
      }
    },
    daysInMonth: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      validate: {
        min: 29,
        max: 32
      }
    },
    startDateAd: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDateAd: {
      type: DataTypes.DATE,
      allowNull: false
    },
    monthNameEn: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    monthNameNp: {
      type: DataTypes.STRING(50),
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'bs_calendar',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['year_bs', 'month_bs']
      },
      {
        fields: ['year_bs']
      },
      {
        fields: ['start_date_ad']
      },
      {
        fields: ['end_date_ad']
      }
    ]
  }
);

export { BSCalendar };
export default BSCalendar;
