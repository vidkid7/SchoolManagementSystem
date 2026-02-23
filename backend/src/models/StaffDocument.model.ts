import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

/**
 * Document Category for Staff
 */
export enum StaffDocumentCategory {
  CERTIFICATE = 'certificate',
  CONTRACT = 'contract',
  ID_PROOF = 'id_proof',
  QUALIFICATION = 'qualification',
  EXPERIENCE = 'experience',
  MEDICAL = 'medical',
  OTHER = 'other'
}

/**
 * Staff Document Attributes Interface
 */
export interface StaffDocumentAttributes {
  documentId: number;
  staffId: number;
  category: StaffDocumentCategory;
  documentName: string;
  originalFileName: string;
  documentUrl: string;
  fileSize: number;
  mimeType: string;
  version: number;
  isLatest: boolean;
  uploadedBy?: number;
  description?: string;
  expiryDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

/**
 * Staff Document Creation Attributes
 */
export interface StaffDocumentCreationAttributes extends Optional<StaffDocumentAttributes,
  'documentId' | 'version' | 'isLatest' | 'uploadedBy' | 'description' | 'expiryDate' | 
  'createdAt' | 'updatedAt' | 'deletedAt'> {}

/**
 * Staff Document Model Class
 * Handles staff document storage with versioning support
 * Requirements: 4.5
 */
class StaffDocument extends Model<StaffDocumentAttributes, StaffDocumentCreationAttributes>
  implements StaffDocumentAttributes {
  public documentId!: number;
  public staffId!: number;
  public category!: StaffDocumentCategory;
  public documentName!: string;
  public originalFileName!: string;
  public documentUrl!: string;
  public fileSize!: number;
  public mimeType!: string;
  public version!: number;
  public isLatest!: boolean;
  public uploadedBy?: number;
  public description?: string;
  public expiryDate?: Date;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;

  /**
   * Check if document is expired
   */
  public isExpired(): boolean {
    if (!this.expiryDate) {
      return false;
    }
    return new Date() > this.expiryDate;
  }

  /**
   * Get file extension
   */
  public getFileExtension(): string {
    return this.originalFileName.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Get human-readable file size
   */
  public getReadableFileSize(): string {
    const bytes = this.fileSize;
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

/**
 * Initialize Staff Document Model
 */
StaffDocument.init(
  {
    documentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'document_id'
    },
    staffId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'staff_id',
      references: {
        model: 'staff',
        key: 'staff_id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    category: {
      type: DataTypes.ENUM(...Object.values(StaffDocumentCategory)),
      allowNull: false,
      comment: 'Document category: certificate, contract, id_proof, etc.'
    },
    documentName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'document_name',
      comment: 'User-friendly document name'
    },
    originalFileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'original_file_name',
      comment: 'Original uploaded file name'
    },
    documentUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'document_url',
      comment: 'Relative URL path to the document'
    },
    fileSize: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'file_size',
      comment: 'File size in bytes'
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'mime_type',
      comment: 'MIME type of the document'
    },
    version: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      comment: 'Document version number'
    },
    isLatest: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_latest',
      comment: 'Flag indicating if this is the latest version'
    },
    uploadedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'uploaded_by',
      comment: 'User ID who uploaded the document'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Optional description or notes about the document'
    },
    expiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'expiry_date',
      comment: 'Document expiry date (for contracts, licenses, etc.)'
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
    tableName: 'staff_documents',
    timestamps: true,
    paranoid: true, // Soft delete
    underscored: true,
    indexes: [
      { fields: ['staff_id'] },
      { fields: ['category'] },
      { fields: ['is_latest'] },
      { fields: ['staff_id', 'category', 'is_latest'] },
      { fields: ['expiry_date'] }
    ]
  }
);

export default StaffDocument;
