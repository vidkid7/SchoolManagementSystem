import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface LibraryCategoryAttributes {
  categoryId: number;
  name: string;
  description: string;
  municipalityId?: string;
  schoolConfigId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type LibraryCategoryCreationAttributes = Optional<LibraryCategoryAttributes, 'categoryId' | 'description'>;

export class LibraryCategory
  extends Model<LibraryCategoryAttributes, LibraryCategoryCreationAttributes>
  implements LibraryCategoryAttributes
{
  declare categoryId: number;
  declare name: string;
  declare description: string;
  declare municipalityId?: string;
  declare schoolConfigId?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

LibraryCategory.init(
  {
    categoryId: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, field: 'category_id' },
    name: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: false, defaultValue: '' },
    municipalityId: { type: DataTypes.CHAR(36), allowNull: true, field: 'municipality_id' },
    schoolConfigId: { type: DataTypes.CHAR(36), allowNull: true, field: 'school_config_id' },
  },
  {
    sequelize,
    tableName: 'library_categories',
    timestamps: true,
    indexes: [{ unique: true, fields: ['school_config_id', 'name'], name: 'uq_library_categories_school_name' }],
  }
);

export default LibraryCategory;
