import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { Request } from 'express';
import { logger } from '@utils/logger';
import { FILE_UPLOAD } from '@config/constants';
import StaffDocument, { 
  StaffDocumentCategory
} from '@models/StaffDocument.model';
import { Op } from 'sequelize';

/**
 * Staff Document Service
 * Handles staff document storage with versioning and category organization
 * Requirements: 4.5
 * 
 * Features:
 * - Document storage organized by category (certificates, contracts, ID proofs)
 * - Document versioning support
 * - Support for PDF, Word, Excel, and image formats
 * - Automatic version management
 * - Expiry date tracking for time-sensitive documents
 */

const UPLOAD_BASE_DIR = path.resolve(process.cwd(), 'uploads');
const STAFF_DOCUMENTS_DIR = path.join(UPLOAD_BASE_DIR, 'documents', 'staff');

/**
 * Ensure directory exists, create if not
 */
function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Generate unique filename with version
 */
function generateUniqueFilename(
  originalName: string, 
  category: string, 
  version: number
): string {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${category}-v${version}-${timestamp}-${random}${ext}`;
}

/**
 * Multer storage configuration for temporary uploads
 */
const tempStorage = multer.memoryStorage();

/**
 * File filter for document uploads
 */
const documentFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const allowedTypes = [
    ...FILE_UPLOAD.ALLOWED_IMAGE_TYPES,
    ...FILE_UPLOAD.ALLOWED_DOCUMENT_TYPES
  ];
  if (allowedTypes.includes(file.mimetype as any)) {
    cb(null, true);
  } else {
    cb(new Error(
      `Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`
    ));
  }
};

/**
 * Multer upload middleware for staff documents
 */
export const staffDocumentUpload = multer({
  storage: tempStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: FILE_UPLOAD.MAX_SIZE_BYTES, // 10MB max
    files: 10 // Allow up to 10 documents at once
  }
});

class StaffDocumentService {
  /**
   * Upload a new staff document or create a new version
   * @param file - Uploaded file from multer
   * @param staffId - Staff ID
   * @param category - Document category
   * @param documentName - User-friendly document name
   * @param uploadedBy - User ID who uploaded the document
   * @param description - Optional description
   * @param expiryDate - Optional expiry date
   * @returns Created document record
   */
  async uploadDocument(
    file: Express.Multer.File,
    staffId: number,
    category: StaffDocumentCategory,
    documentName: string,
    uploadedBy?: number,
    description?: string,
    expiryDate?: Date
  ): Promise<StaffDocument> {
    try {
      // Get the next version number for this document
      const version = await this.getNextVersion(staffId, category, documentName);

      // Mark previous versions as not latest
      if (version > 1) {
        await this.markPreviousVersionsAsOld(staffId, category, documentName);
      }

      // Create directory structure: uploads/documents/staff/{staffId}/{category}/
      const staffDocDir = path.join(STAFF_DOCUMENTS_DIR, String(staffId), category);
      ensureDirectoryExists(staffDocDir);

      // Generate unique filename with version
      const filename = generateUniqueFilename(file.originalname, category, version);
      const docPath = path.join(staffDocDir, filename);

      // Save file to disk
      await fs.promises.writeFile(docPath, file.buffer);

      // Generate relative URL
      const documentUrl = `/uploads/documents/staff/${staffId}/${category}/${filename}`;

      // Create database record
      const document = await StaffDocument.create({
        staffId,
        category,
        documentName,
        originalFileName: file.originalname,
        documentUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
        version,
        isLatest: true,
        uploadedBy,
        description,
        expiryDate
      });

      logger.info('Staff document uploaded', {
        documentId: document.documentId,
        staffId,
        category,
        documentName,
        version,
        fileSize: file.size
      });

      return document;
    } catch (error) {
      logger.error('Error uploading staff document', { 
        error, 
        staffId, 
        category, 
        documentName 
      });
      throw new Error('Failed to upload staff document');
    }
  }

  /**
   * Get the next version number for a document
   * @param staffId - Staff ID
   * @param category - Document category
   * @param documentName - Document name
   * @returns Next version number
   */
  private async getNextVersion(
    staffId: number,
    category: StaffDocumentCategory,
    documentName: string
  ): Promise<number> {
    const latestDoc = await StaffDocument.findOne({
      where: {
        staffId,
        category,
        documentName
      },
      order: [['version', 'DESC']]
    });

    return latestDoc ? latestDoc.version + 1 : 1;
  }

  /**
   * Mark previous versions as not latest
   * @param staffId - Staff ID
   * @param category - Document category
   * @param documentName - Document name
   */
  private async markPreviousVersionsAsOld(
    staffId: number,
    category: StaffDocumentCategory,
    documentName: string
  ): Promise<void> {
    await StaffDocument.update(
      { isLatest: false },
      {
        where: {
          staffId,
          category,
          documentName,
          isLatest: true
        }
      }
    );
  }

  /**
   * Get all documents for a staff member
   * @param staffId - Staff ID
   * @param options - Filter options
   * @returns Array of documents
   */
  async getDocuments(
    staffId: number,
    options?: {
      category?: StaffDocumentCategory;
      latestOnly?: boolean;
      includeExpired?: boolean;
    }
  ): Promise<StaffDocument[]> {
    try {
      const where: any = { staffId };

      if (options?.category) {
        where.category = options.category;
      }

      if (options?.latestOnly) {
        where.isLatest = true;
      }

      if (!options?.includeExpired) {
        where[Op.or] = [
          { expiryDate: null },
          { expiryDate: { [Op.gte]: new Date() } }
        ];
      }

      const documents = await StaffDocument.findAll({
        where,
        order: [
          ['category', 'ASC'],
          ['documentName', 'ASC'],
          ['version', 'DESC']
        ]
      });

      return documents;
    } catch (error) {
      logger.error('Error getting staff documents', { error, staffId });
      throw new Error('Failed to get staff documents');
    }
  }

  /**
   * Get a specific document by ID
   * @param documentId - Document ID
   * @returns Document or null
   */
  async getDocumentById(documentId: number): Promise<StaffDocument | null> {
    try {
      return await StaffDocument.findByPk(documentId);
    } catch (error) {
      logger.error('Error getting document by ID', { error, documentId });
      throw new Error('Failed to get document');
    }
  }

  /**
   * Get all versions of a document
   * @param staffId - Staff ID
   * @param category - Document category
   * @param documentName - Document name
   * @returns Array of document versions
   */
  async getDocumentVersions(
    staffId: number,
    category: StaffDocumentCategory,
    documentName: string
  ): Promise<StaffDocument[]> {
    try {
      return await StaffDocument.findAll({
        where: {
          staffId,
          category,
          documentName
        },
        order: [['version', 'DESC']]
      });
    } catch (error) {
      logger.error('Error getting document versions', { 
        error, 
        staffId, 
        category, 
        documentName 
      });
      throw new Error('Failed to get document versions');
    }
  }

  /**
   * Update document metadata
   * @param documentId - Document ID
   * @param updates - Fields to update
   * @returns Updated document or null
   */
  async updateDocument(
    documentId: number,
    updates: {
      documentName?: string;
      description?: string;
      expiryDate?: Date;
    }
  ): Promise<StaffDocument | null> {
    try {
      const document = await StaffDocument.findByPk(documentId);

      if (!document) {
        return null;
      }

      await document.update(updates);

      logger.info('Staff document updated', { documentId, updates });

      return document;
    } catch (error) {
      logger.error('Error updating staff document', { error, documentId });
      throw new Error('Failed to update staff document');
    }
  }

  /**
   * Delete a document (soft delete)
   * @param documentId - Document ID
   * @returns True if deleted, false if not found
   */
  async deleteDocument(documentId: number): Promise<boolean> {
    try {
      const document = await StaffDocument.findByPk(documentId);

      if (!document) {
        return false;
      }

      // Soft delete the database record
      await document.destroy();

      logger.info('Staff document deleted', { documentId });

      return true;
    } catch (error) {
      logger.error('Error deleting staff document', { error, documentId });
      throw new Error('Failed to delete staff document');
    }
  }

  /**
   * Permanently delete a document and its file
   * @param documentId - Document ID
   * @returns True if deleted, false if not found
   */
  async permanentlyDeleteDocument(documentId: number): Promise<boolean> {
    try {
      const document = await StaffDocument.findByPk(documentId, { paranoid: false });

      if (!document) {
        return false;
      }

      // Delete physical file
      const filePath = path.join(process.cwd(), document.documentUrl);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }

      // Hard delete from database
      await document.destroy({ force: true });

      logger.info('Staff document permanently deleted', { documentId });

      return true;
    } catch (error) {
      logger.error('Error permanently deleting staff document', { error, documentId });
      throw new Error('Failed to permanently delete staff document');
    }
  }

  /**
   * Get documents by category
   * @param staffId - Staff ID
   * @param category - Document category
   * @param latestOnly - Return only latest versions
   * @returns Array of documents
   */
  async getDocumentsByCategory(
    staffId: number,
    category: StaffDocumentCategory,
    latestOnly: boolean = true
  ): Promise<StaffDocument[]> {
    return this.getDocuments(staffId, { category, latestOnly });
  }

  /**
   * Get expired documents
   * @param staffId - Optional staff ID filter
   * @returns Array of expired documents
   */
  async getExpiredDocuments(staffId?: number): Promise<StaffDocument[]> {
    try {
      const where: any = {
        expiryDate: { [Op.lt]: new Date() },
        isLatest: true
      };

      if (staffId) {
        where.staffId = staffId;
      }

      return await StaffDocument.findAll({
        where,
        order: [['expiryDate', 'ASC']]
      });
    } catch (error) {
      logger.error('Error getting expired documents', { error, staffId });
      throw new Error('Failed to get expired documents');
    }
  }

  /**
   * Get documents expiring soon (within specified days)
   * @param days - Number of days to look ahead
   * @param staffId - Optional staff ID filter
   * @returns Array of documents expiring soon
   */
  async getDocumentsExpiringSoon(
    days: number = 30,
    staffId?: number
  ): Promise<StaffDocument[]> {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);

      const where: any = {
        expiryDate: {
          [Op.between]: [today, futureDate]
        },
        isLatest: true
      };

      if (staffId) {
        where.staffId = staffId;
      }

      return await StaffDocument.findAll({
        where,
        order: [['expiryDate', 'ASC']]
      });
    } catch (error) {
      logger.error('Error getting documents expiring soon', { error, days, staffId });
      throw new Error('Failed to get documents expiring soon');
    }
  }

  /**
   * Get document statistics for a staff member
   * @param staffId - Staff ID
   * @returns Document statistics
   */
  async getDocumentStatistics(staffId: number): Promise<{
    totalDocuments: number;
    byCategory: Record<string, number>;
    totalSize: number;
    expiredCount: number;
    expiringSoonCount: number;
  }> {
    try {
      const documents = await this.getDocuments(staffId, { 
        latestOnly: true,
        includeExpired: true 
      });

      const byCategory: Record<string, number> = {};
      let totalSize = 0;
      let expiredCount = 0;
      let expiringSoonCount = 0;

      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      for (const doc of documents) {
        // Count by category
        byCategory[doc.category] = (byCategory[doc.category] || 0) + 1;

        // Sum file sizes
        totalSize += doc.fileSize;

        // Count expired
        if (doc.expiryDate && doc.expiryDate < today) {
          expiredCount++;
        }

        // Count expiring soon
        if (doc.expiryDate && 
            doc.expiryDate >= today && 
            doc.expiryDate <= thirtyDaysFromNow) {
          expiringSoonCount++;
        }
      }

      return {
        totalDocuments: documents.length,
        byCategory,
        totalSize,
        expiredCount,
        expiringSoonCount
      };
    } catch (error) {
      logger.error('Error getting document statistics', { error, staffId });
      throw new Error('Failed to get document statistics');
    }
  }

  /**
   * Bulk upload documents
   * @param files - Array of uploaded files
   * @param staffId - Staff ID
   * @param category - Document category
   * @param uploadedBy - User ID who uploaded
   * @returns Array of created documents
   */
  async bulkUploadDocuments(
    files: Express.Multer.File[],
    staffId: number,
    category: StaffDocumentCategory,
    uploadedBy?: number
  ): Promise<StaffDocument[]> {
    const documents: StaffDocument[] = [];

    for (const file of files) {
      try {
        const document = await this.uploadDocument(
          file,
          staffId,
          category,
          file.originalname,
          uploadedBy
        );
        documents.push(document);
      } catch (error) {
        logger.error('Error in bulk upload for file', { 
          error, 
          filename: file.originalname 
        });
        // Continue with other files even if one fails
      }
    }

    return documents;
  }
}

export default new StaffDocumentService();
