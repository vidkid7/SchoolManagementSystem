/**
 * Document Service
 * 
 * Business logic for document management with compression, versioning, and access control
 * 
 * Requirements: 27.1, 27.2, 27.3, 27.4, 27.5, 27.6, 27.7, 27.8
 */

import { DocumentRepository, DocumentFilters } from './document.repository';
import { Document, DocumentCreationAttributes } from '../../models/Document.model';
import { DocumentAccessLog } from '../../models/DocumentAccessLog.model';
import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';

export interface UploadDocumentDTO {
  name: string;
  originalName: string;
  description?: string;
  category: 'academic' | 'administrative' | 'financial' | 'student_record' | 'staff_record' | 'curriculum' | 'exam' | 'other';
  mimeType: string;
  size: number;
  buffer: Buffer;
  uploadedBy: number;
  accessLevel?: 'private' | 'restricted' | 'public';
  allowedRoles?: string[];
  allowedUserIds?: number[];
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateDocumentDTO {
  name?: string;
  description?: string;
  category?: string;
  accessLevel?: 'private' | 'restricted' | 'public';
  allowedRoles?: string[];
  allowedUserIds?: number[];
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface DocumentAccessResult {
  allowed: boolean;
  reason?: string;
}

export interface DocumentSearchResult {
  documents: Document[];
  total: number;
  page: number;
  limit: number;
}

export class DocumentService {
  private repository: DocumentRepository;
  private uploadDir: string;
  private maxFileSize: number; // 10MB default
  private maxImageSize: number; // 500KB default for compressed images
  private thumbnailDir: string;

  constructor(
    repository: DocumentRepository = new DocumentRepository(),
    uploadDir: string = process.env.DOCUMENT_UPLOAD_DIR || 'uploads/documents',
    maxFileSize: number = 10 * 1024 * 1024, // 10MB
    maxImageSize: number = 500 * 1024 // 500KB
  ) {
    this.repository = repository;
    this.uploadDir = uploadDir;
    this.maxFileSize = maxFileSize;
    this.maxImageSize = maxImageSize;
    this.thumbnailDir = path.join(uploadDir, 'thumbnails');
  }

  /**
   * Upload a new document
   */
  async uploadDocument(dto: UploadDocumentDTO): Promise<Document> {
    // Validate file size
    if (dto.size > this.maxFileSize) {
      throw new Error(`File size exceeds maximum limit of ${this.maxFileSize / 1024 / 1024}MB`);
    }

    // Generate unique document number
    const documentNumber = await this.generateDocumentNumber();

    // Compress image if applicable
    let buffer = dto.buffer;
    let compressedSize: number | undefined;
    let isCompressed = false;
    let compressionRatio: number | undefined;
    let thumbnailPath: string | undefined;

    if (this.isImage(dto.mimeType)) {
      const compressionResult = await this.compressImage(buffer);
      buffer = compressionResult.buffer;
      compressedSize = compressionResult.compressedSize;
      isCompressed = compressionResult.compressed;
      compressionRatio = compressionResult.compressionRatio;

      // Generate thumbnail
      thumbnailPath = await this.generateThumbnail(buffer, documentNumber);
    }

    // Ensure upload directory exists
    await this.ensureUploadDir();

    // Generate storage path
    const extension = path.extname(dto.originalName);
    const fileName = `${documentNumber}${extension}`;
    const storagePath = path.join(this.uploadDir, fileName);

    // Save file to disk
    await fs.writeFile(storagePath, buffer);

    // Create document record
    const documentData: DocumentCreationAttributes = {
      documentNumber,
      name: dto.name,
      originalName: dto.originalName,
      description: dto.description,
      category: dto.category,
      mimeType: dto.mimeType,
      size: dto.size,
      compressedSize,
      storagePath: `/${this.uploadDir}/${fileName}`,
      thumbnailPath: thumbnailPath ? `/${thumbnailPath}` : undefined,
      version: 1,
      uploadedBy: dto.uploadedBy,
      accessLevel: dto.accessLevel || 'private',
      allowedRoles: dto.allowedRoles,
      allowedUserIds: dto.allowedUserIds,
      isCompressed,
      compressionRatio,
      tags: dto.tags,
      metadata: dto.metadata,
      status: 'active',
    };

    const document = await this.repository.create(documentData);

    // Log the upload
    await this.logAccess({
      documentId: document.documentId,
      userId: dto.uploadedBy,
      action: 'upload',
      success: true,
    });

    return document;
  }

  /**
   * Upload a new version of a document
   */
  async uploadVersion(
    parentDocumentId: number,
    dto: Omit<UploadDocumentDTO, 'category' | 'uploadedBy'>
  ): Promise<Document> {
    const parentDocument = await this.repository.findById(parentDocumentId);
    if (!parentDocument) {
      throw new Error(`Document with ID ${parentDocumentId} not found`);
    }

    // Get the latest version number
    const latestVersion = await this.repository.getLatestVersion(parentDocument.documentNumber);
    const newVersion = latestVersion + 1;

    // Validate file size
    if (dto.size > this.maxFileSize) {
      throw new Error(`File size exceeds maximum limit of ${this.maxFileSize / 1024 / 1024}MB`);
    }

    // Compress image if applicable
    let buffer = dto.buffer;
    let compressedSize: number | undefined;
    let isCompressed = false;
    let compressionRatio: number | undefined;
    let thumbnailPath: string | undefined;

    if (this.isImage(dto.mimeType)) {
      const compressionResult = await this.compressImage(buffer);
      buffer = compressionResult.buffer;
      compressedSize = compressionResult.compressedSize;
      isCompressed = compressionResult.compressed;
      compressionRatio = compressionResult.compressionRatio;

      // Generate thumbnail
      thumbnailPath = await this.generateThumbnail(buffer, parentDocument.documentNumber);
    }

    // Ensure upload directory exists
    await this.ensureUploadDir();

    // Generate storage path
    const extension = path.extname(dto.originalName);
    const fileName = `${parentDocument.documentNumber}_v${newVersion}${extension}`;
    const storagePath = path.join(this.uploadDir, fileName);

    // Save file to disk
    await fs.writeFile(storagePath, buffer);

    // Create new version document
    const documentData: DocumentCreationAttributes = {
      documentNumber: parentDocument.documentNumber,
      name: dto.name || parentDocument.name,
      originalName: dto.originalName,
      description: dto.description || parentDocument.description,
      category: parentDocument.category,
      mimeType: dto.mimeType,
      size: dto.size,
      compressedSize,
      storagePath: `/${this.uploadDir}/${fileName}`,
      thumbnailPath: thumbnailPath ? `/${thumbnailPath}` : undefined,
      version: newVersion,
      parentDocumentId,
      uploadedBy: parentDocument.uploadedBy,
      accessLevel: parentDocument.accessLevel,
      allowedRoles: parentDocument.allowedRoles,
      allowedUserIds: parentDocument.allowedUserIds,
      isCompressed,
      compressionRatio,
      tags: dto.tags || parentDocument.tags,
      metadata: dto.metadata || parentDocument.metadata,
      status: 'active',
    };

    const document = await this.repository.create(documentData);

    return document;
  }

  /**
   * Get document by ID
   */
  async getDocumentById(documentId: number, userId: number, userRoles: string[]): Promise<Document> {
    const document = await this.repository.findById(documentId);
    if (!document) {
      throw new Error(`Document with ID ${documentId} not found`);
    }

    if (document.status === 'deleted') {
      throw new Error('Document has been deleted');
    }

    // Check access
    const accessResult = this.checkAccess(document, userId, userRoles);
    if (!accessResult.allowed) {
      throw new Error(accessResult.reason);
    }

    // Log access
    await this.logAccess({
      documentId: document.documentId,
      userId,
      action: 'view',
      success: true,
    });

    return document;
  }

  /**
   * Get document for preview
   */
  async previewDocument(documentId: number, userId: number, userRoles: string[]): Promise<{
    document: Document;
    previewUrl: string;
  }> {
    const document = await this.getDocumentById(documentId, userId, userRoles);

    if (!document.isViewable()) {
      throw new Error('Document type is not viewable');
    }

    // Log preview access
    await this.logAccess({
      documentId: document.documentId,
      userId,
      action: 'preview',
      success: true,
    });

    return {
      document,
      previewUrl: document.storagePath,
    };
  }

  /**
   * Download document
   */
  async downloadDocument(documentId: number, userId: number, userRoles: string[]): Promise<{
    document: Document;
    filePath: string;
  }> {
    const document = await this.getDocumentById(documentId, userId, userRoles);

    // Log download
    await this.logAccess({
      documentId: document.documentId,
      userId,
      action: 'download',
      success: true,
    });

    return {
      document,
      filePath: path.join(process.cwd(), document.storagePath),
    };
  }

  /**
   * Search documents
   */
  async searchDocuments(
    filters: DocumentFilters,
    userId: number,
    userRoles: string[],
    page: number = 1,
    limit: number = 20
  ): Promise<DocumentSearchResult> {
    // Get all documents matching filters
    const documents = await this.repository.findAll(filters);

    // Filter by access control
    const accessibleDocuments = documents.filter(doc => {
      const accessResult = this.checkAccess(doc, userId, userRoles);
      return accessResult.allowed;
    });

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedDocuments = accessibleDocuments.slice(startIndex, endIndex);

    return {
      documents: paginatedDocuments,
      total: accessibleDocuments.length,
      page,
      limit,
    };
  }

  /**
   * Get documents by category
   */
  async getDocumentsByCategory(
    category: string,
    userId: number,
    userRoles: string[]
  ): Promise<Document[]> {
    const documents = await this.repository.findByCategory(category);

    return documents.filter(doc => {
      const accessResult = this.checkAccess(doc, userId, userRoles);
      return accessResult.allowed;
    });
  }

  /**
   * Get document versions
   */
  async getDocumentVersions(documentId: number): Promise<Document[]> {
    return await this.repository.findVersions(documentId);
  }

  /**
   * Update document metadata
   */
  async updateDocument(
    documentId: number,
    dto: UpdateDocumentDTO,
    userId: number
  ): Promise<Document> {
    const document = await this.repository.findById(documentId);
    if (!document) {
      throw new Error(`Document with ID ${documentId} not found`);
    }

    if (document.status === 'deleted') {
      throw new Error('Cannot update deleted document');
    }

    const updatedDocument = await this.repository.update(
      documentId,
      dto as Partial<DocumentCreationAttributes>
    );

    // Log update
    await this.logAccess({
      documentId: document.documentId,
      userId,
      action: 'edit',
      success: true,
      details: { changes: dto },
    });

    return updatedDocument!;
  }

  /**
   * Delete document (soft delete)
   */
  async deleteDocument(documentId: number, userId: number): Promise<Document> {
    const document = await this.repository.findById(documentId);
    if (!document) {
      throw new Error(`Document with ID ${documentId} not found`);
    }

    const deletedDocument = await this.repository.softDelete(documentId);

    // Log deletion
    await this.logAccess({
      documentId: document.documentId,
      userId,
      action: 'delete',
      success: true,
    });

    return deletedDocument!;
  }

  /**
   * Archive document
   */
  async archiveDocument(documentId: number, userId: number): Promise<Document> {
    const document = await this.repository.findById(documentId);
    if (!document) {
      throw new Error(`Document with ID ${documentId} not found`);
    }

    const archivedDocument = await this.repository.archive(documentId);

    // Log archive
    await this.logAccess({
      documentId: document.documentId,
      userId,
      action: 'edit',
      success: true,
      details: { action: 'archive' },
    });

    return archivedDocument!;
  }

  /**
   * Get document access logs
   */
  async getAccessLogs(
    documentId: number,
    userId: number,
    userRoles: string[]
  ): Promise<DocumentAccessLog[]> {
    const document = await this.repository.findById(documentId);
    if (!document) {
      throw new Error(`Document with ID ${documentId} not found`);
    }

    // Only allow access for document owner or admin
    if (document.uploadedBy !== userId && !userRoles.includes('School_Admin')) {
      throw new Error('You do not have permission to view access logs');
    }

    return await this.repository.getAccessLogs({ documentId });
  }

  /**
   * Get document statistics
   */
  async getStatistics(): Promise<{
    totalDocuments: number;
    byCategory: Record<string, number>;
    totalStorage: number;
  }> {
    const totalDocuments = await this.repository.getTotalCount();
    const byCategory = await this.repository.getCountByCategory();

    // Calculate total storage
    const documents = await this.repository.findAll({});
    const totalStorage = documents.reduce((sum, doc) => {
      return sum + (doc.isCompressed && doc.compressedSize ? doc.compressedSize : doc.size);
    }, 0);

    return {
      totalDocuments,
      byCategory,
      totalStorage,
    };
  }

  /**
   * Check if user has access to document
   */
  private checkAccess(
    document: Document,
    userId: number,
    userRoles: string[]
  ): DocumentAccessResult {
    // Public documents are accessible to all
    if (document.accessLevel === 'public') {
      return { allowed: true };
    }

    // Owner has full access
    if (document.uploadedBy === userId) {
      return { allowed: true };
    }

    // Admin has access
    if (userRoles.includes('School_Admin')) {
      return { allowed: true };
    }

    // Check restricted access
    if (document.accessLevel === 'restricted') {
      // Check role-based access
      if (document.allowedRoles && document.allowedRoles.length > 0) {
        const hasRoleAccess = document.allowedRoles.some(allowedRole => 
          userRoles.some(userRole => userRole.toLowerCase().includes(allowedRole.toLowerCase()))
        );
        if (hasRoleAccess) {
          return { allowed: true };
        }
      }

      // Check user-specific access
      if (document.allowedUserIds && document.allowedUserIds.includes(userId)) {
        return { allowed: true };
      }
    }

    return {
      allowed: false,
      reason: 'You do not have permission to access this document',
    };
  }

  /**
   * Log document access
   */
  private async logAccess(data: {
    documentId: number;
    userId: number;
    action: 'view' | 'download' | 'edit' | 'delete' | 'share' | 'upload' | 'preview';
    success: boolean;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, any>;
    errorMessage?: string;
  }): Promise<void> {
    try {
      await this.repository.logAccess({
        documentId: data.documentId,
        userId: data.userId,
        action: data.action,
        success: data.success,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        details: data.details,
        errorMessage: data.errorMessage,
      });
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Failed to log document access:', error);
    }
  }

  /**
   * Generate unique document number
   */
  private async generateDocumentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = 'DOC';
    
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      const documentNumber = `${prefix}-${year}-${randomNum}`;

      const exists = await this.repository.existsByDocumentNumber(documentNumber);
      if (!exists) {
        return documentNumber;
      }

      attempts++;
    }

    throw new Error('Failed to generate unique document number after maximum attempts');
  }

  /**
   * Check if file is an image
   */
  private isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/') && !mimeType.includes('svg');
  }

  /**
   * Compress image
   */
  private async compressImage(buffer: Buffer): Promise<{
    buffer: Buffer;
    compressedSize: number;
    compressed: boolean;
    compressionRatio: number;
  }> {
    const originalSize = buffer.length;

    // If already below max size, no compression needed
    if (originalSize <= this.maxImageSize) {
      return {
        buffer,
        compressedSize: originalSize,
        compressed: false,
        compressionRatio: 1,
      };
    }

    try {
      // Compress using sharp
      const compressedBuffer = await sharp(buffer)
        .resize({ width: 1920, withoutEnlargement: true }) // Max width 1920px
        .jpeg({ quality: 80, progressive: true })
        .toBuffer();

      const compressedSize = compressedBuffer.length;

      // If still too large, reduce quality further
      let finalBuffer = compressedBuffer;
      let finalSize = compressedSize;

      if (compressedSize > this.maxImageSize) {
        finalBuffer = await sharp(compressedBuffer)
          .jpeg({ quality: 60, progressive: true })
          .toBuffer();
        finalSize = finalBuffer.length;
      }

      // If still too large, resize further
      if (finalSize > this.maxImageSize) {
        finalBuffer = await sharp(finalBuffer)
          .resize({ width: 1280, withoutEnlargement: true })
          .jpeg({ quality: 60, progressive: true })
          .toBuffer();
        finalSize = finalBuffer.length;
      }

      return {
        buffer: finalBuffer,
        compressedSize: finalSize,
        compressed: true,
        compressionRatio: finalSize / originalSize,
      };
    } catch (error) {
      // If compression fails, return original
      console.error('Image compression failed:', error);
      return {
        buffer,
        compressedSize: originalSize,
        compressed: false,
        compressionRatio: 1,
      };
    }
  }

  /**
   * Generate thumbnail
   */
  private async generateThumbnail(buffer: Buffer, documentNumber: string): Promise<string> {
    try {
      await this.ensureThumbnailDir();

      const thumbnailFileName = `${documentNumber}_thumb.jpg`;
      const thumbnailPath = path.join(this.thumbnailDir, thumbnailFileName);

      await sharp(buffer)
        .resize({ width: 200, height: 200, fit: 'cover' })
        .jpeg({ quality: 70 })
        .toFile(thumbnailPath);

      return thumbnailPath;
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      return '';
    }
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Ensure thumbnail directory exists
   */
  private async ensureThumbnailDir(): Promise<void> {
    try {
      await fs.mkdir(this.thumbnailDir, { recursive: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
    }
  }
}

export default new DocumentService();