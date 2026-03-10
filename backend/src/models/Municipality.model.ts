import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

export interface MunicipalityAttributes {
  id: string;
  nameEn: string;
  nameNp?: string;
  code: string;
  district: string;
  province?: string;
  address?: string;
  contactPhone?: string;
  contactEmail?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MunicipalityCreationAttributes
  extends Optional<
    MunicipalityAttributes,
    | 'id'
    | 'nameNp'
    | 'province'
    | 'address'
    | 'contactPhone'
    | 'contactEmail'
    | 'isActive'
    | 'createdAt'
    | 'updatedAt'
  > {}

class Municipality
  extends Model<MunicipalityAttributes, MunicipalityCreationAttributes>
  implements MunicipalityAttributes
{
  declare id: string;
  declare nameEn: string;
  declare nameNp?: string;
  declare code: string;
  declare district: string;
  declare province?: string;
  declare address?: string;
  declare contactPhone?: string;
  declare contactEmail?: string;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Municipality.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nameEn: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'name_en',
    },
    nameNp: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'name_np',
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    district: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    province: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    contactPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'contact_phone',
    },
    contactEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'contact_email',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
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
    tableName: 'municipalities',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['code'],
      },
      {
        fields: ['district'],
      },
      {
        fields: ['is_active'],
      },
    ],
  }
);

export default Municipality;
