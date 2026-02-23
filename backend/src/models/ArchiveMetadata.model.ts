import { Model, DataTypes, Sequelize } from 'sequelize';

export interface ArchiveMetadataAttributes {
  id: number;
  academic_year_id: number;
  academic_year_name: string;
  archived_at: Date;
  archived_by: number;
  status: 'in_progress' | 'completed' | 'failed' | 'restored';
  tables_archived?: string[];
  record_counts?: Record<string, number>;
  retention_until: Date;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ArchiveMetadataCreationAttributes
  extends Omit<ArchiveMetadataAttributes, 'id' | 'created_at' | 'updated_at'> {}

class ArchiveMetadata
  extends Model<ArchiveMetadataAttributes, ArchiveMetadataCreationAttributes>
  implements ArchiveMetadataAttributes
{
  public id!: number;
  public academic_year_id!: number;
  public academic_year_name!: string;
  public archived_at!: Date;
  public archived_by!: number;
  public status!: 'in_progress' | 'completed' | 'failed' | 'restored';
  public tables_archived?: string[];
  public record_counts?: Record<string, number>;
  public retention_until!: Date;
  public error_message?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export const initArchiveMetadata = (sequelize: Sequelize): typeof ArchiveMetadata => {
  ArchiveMetadata.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      academic_year_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      academic_year_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      archived_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      archived_by: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('in_progress', 'completed', 'failed', 'restored'),
        allowNull: false,
        defaultValue: 'in_progress',
      },
      tables_archived: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      record_counts: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      retention_until: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      error_message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'archive_metadata',
      timestamps: true,
      underscored: true,
    }
  );

  return ArchiveMetadata;
};

export default ArchiveMetadata;
