import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

export interface HostelInventoryItemAttributes {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  location?: string;
  schoolConfigId?: string;
  municipalityId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HostelInventoryItemCreationAttributes extends Optional<
  HostelInventoryItemAttributes,
  'id' | 'quantity' | 'unit' | 'minStock' | 'location' |
  'schoolConfigId' | 'municipalityId' | 'createdAt' | 'updatedAt'
> {}

class HostelInventoryItem
  extends Model<HostelInventoryItemAttributes, HostelInventoryItemCreationAttributes>
  implements HostelInventoryItemAttributes {
  declare id: number;
  declare name: string;
  declare category: string;
  declare quantity: number;
  declare unit: string;
  declare minStock: number;
  declare location?: string;
  declare schoolConfigId?: string;
  declare municipalityId?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

HostelInventoryItem.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    unit: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'pcs',
    },
    minStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'min_stock',
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
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
    tableName: 'hostel_inventory_items',
    modelName: 'HostelInventoryItem',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['name'] },
      { fields: ['category'] },
      { fields: ['quantity'] },
      { fields: ['school_config_id'] },
      { fields: ['municipality_id'] },
    ],
  }
);

export default HostelInventoryItem;
