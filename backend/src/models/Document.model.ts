/**
 * Document Model
 * 
 * Implements document entity for storing and managing school documents with versioning support
 * 
 * Requirements: 27.1, 27.2, 27.3, 27.5, 27.6, 27.7, 27.8
 */

import { DataTypes, Model, Optional } from 'sequelize';

export interface DocumentAttributes {
  documentId: number;
  documentNumber: string;
  name: string;
  originalName: string;
  description?: string;
  category: 'academic' | 'administrative' | 'financial' | 'student_record' | 'staff_record' | 'curriculum' | 'exam' | 'other';
  mimeType: string;
  size: number; // in bytes
  compressedSize?: number; // in bytes after compression
  storagePath: string;
  thumbnailPath?: string;
  version: number;
  parentDocumentId?: number; // For versioning
  uploadedBy: number;
  accessLevel: 'private' | 'restricted' | 'public';
  allowedRoles?: string[]; // Roles that can access restricted documents
  allowedUserIds?: number[]; // Specific users that can access
  isCompressed: boolean;
  compressionRatio?: number;
  tags?: string[];
  metadata?: Record<string, any>;
  status: 'active' | 'archived' | 'deleted';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DocumentCreationAttributes
  extends Optional<DocumentAttributes, 'documentId' | 'version' | 'isCompressed' | 'status' | 'createdAt' | 'updatedAt'> {}

export class Document
  extends Model<DocumentAttributes, DocumentCreationAttributes>
  implements DocumentAttributes
{
  public documentId!: number;
  public documentNumber!: string;
  public name!: string;
  public originalName!: string;
  public description?: string;
  public category!: 'academic' | 'administrative' | 'financial' | 'student_record' | 'staff_record' | 'curriculum' | 'exam' | 'other';
  public mimeType!: string;
  public size!: number;
  public compressedSize?: number;
  public storagePath!: string;
  public thumbnailPath?: string;
  public version!: number;
  public parentDocumentId?: number;
  public uploadedBy!: number;
  public accessLevel!: 'private' | 'restricted' | 'public';
  public allowedRoles?: string[];
  public allowedUserIds?: number[];
  public isCompressed!: boolean;
  public compressionRatio?: number;
  public tags?: string[];
  public metadata?: Record<string, any>;
  public status!: 'active' | 'archived' | 'deleted';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Check if document is a new version
   */
  public isNewVersion(): boolean {
    return this.version > 1;
  }

  /**
   * Get the actual file size (compressed or original)
   */
  public getActualSize(): number {
    return this.isCompressed && this.compressedSize ? this.compressedSize : this.size;
  }

  /**
   * Check if document is an image
   */
  public isImage(): boolean {
    return this.mimeType.startsWith('image/');
  }

  /**
   * Check if document is viewable in browser
   */
  public isViewable(): boolean {
    const viewableTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'text/plain', 'text/html', 'text/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    return viewableTypes.includes(this.mimeType);
  }

  /**
   * Archive the document
   */
  public archive(): void {
    this.status = 'archived';
  }

  /**
   * Soft delete the document
   */
  public softDelete(): void {
    this.status = 'deleted';
  }

  public toJSON(): object {
    return {
      documentId: this.documentId,
      documentNumber: this.documentNumber,
      name: this.name,
      originalName: this.originalName,
      description: this.description,
      category: this.category,
      mimeType: this.mimeType,
      size: this.size,
      compressedSize: this.compressedSize,
      actualSize: this.getActualSize(),
      storagePath: this.storagePath,
      thumbnailPath: this.thumbnailPath,
      version: this.version,
      parentDocumentId: this.parentDocumentId,
      uploadedBy: this.uploadedBy,
      accessLevel: this.accessLevel,
      allowedRoles: this.allowedRoles,
      allowedUserIds: this.allowedUserIds,
      isCompressed: this.isCompressed,
      compressionRatio: this.compressionRatio,
      tags: this.tags,
      metadata: this.metadata,
      status: this.status,
      isImage: this.isImage(),
      isViewable: this.isViewable(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export function initDocument(sequelize: any): typeof Document {
  Document.init(
    {
      documentId: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      documentNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      originalName: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      category: {
        type: DataTypes.ENUM(
          'academic',
          'administrative',
          'financial',
          'student_record',
          'staff_record',
          'curriculum',
          'exam',
          'other'
        ),
        allowNull: false,
      },
      mimeType: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      size: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      compressedSize: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      storagePath: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      thumbnailPath: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      version: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
      },
      parentDocumentId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'documents',
          key: 'document_id',
        },
      },
      uploadedBy: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id',
        },
      },
      accessLevel: {
        type: DataTypes.ENUM('private', 'restricted', 'public'),
        allowNull: false,
        defaultValue: 'private',
      },
      allowedRoles: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      allowedUserIds: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      isCompressed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      compressionRatio: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      tags: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
      },
      status: {
        type: DataTypes.ENUM('active', 'archived', 'deleted'),
        allowNull: false,
        defaultValue: 'active',
      },
    },
    {
      sequelize,
      tableName: 'documents',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          name: 'idx_documents_number',
          fields: ['document_number'],
          unique: true,
        },
        {
          name: 'idx_documents_name',
          fields: ['name'],
        },
        {
          name: 'idx_documents_category',
          fields: ['category'],
        },
        {
          name: 'idx_documents_uploaded_by',
          fields: ['uploaded_by'],
        },
        {
          name: 'idx_documents_status',
          fields: ['status'],
        },
        {
          name: 'idx_documents_access_level',
          fields: ['access_level'],
        },
        {
          name: 'idx_documents_created_at',
          fields: ['created_at'],
        },
        {
          name: 'idx_documents_parent',
          fields: ['parent_document_id'],
        },
      ],
    }
  );

  return Document;
}

export default Document;