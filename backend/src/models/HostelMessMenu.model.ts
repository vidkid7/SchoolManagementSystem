import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

export type HostelMealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface HostelMessMenuAttributes {
  id: number;
  day: string;
  mealType: HostelMealType;
  items: string[];
  specialNotes?: string;
  schoolConfigId?: string;
  municipalityId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HostelMessMenuCreationAttributes extends Optional<
  HostelMessMenuAttributes,
  'id' | 'specialNotes' | 'schoolConfigId' | 'municipalityId' | 'createdAt' | 'updatedAt'
> {}

class HostelMessMenu
  extends Model<HostelMessMenuAttributes, HostelMessMenuCreationAttributes>
  implements HostelMessMenuAttributes {
  declare id: number;
  declare day: string;
  declare mealType: HostelMealType;
  declare items: string[];
  declare specialNotes?: string;
  declare schoolConfigId?: string;
  declare municipalityId?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

HostelMessMenu.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    day: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    mealType: {
      type: DataTypes.ENUM('breakfast', 'lunch', 'dinner', 'snack'),
      allowNull: false,
      field: 'meal_type',
    },
    items: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    specialNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'special_notes',
    },
    schoolConfigId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'school_config_id',
    },
    municipalityId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'municipality_id',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'hostel_mess_menus',
    modelName: 'HostelMessMenu',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['day'] },
      { fields: ['meal_type'] },
      { fields: ['school_config_id'] },
      { fields: ['municipality_id'] },
    ],
  }
);

export default HostelMessMenu;
