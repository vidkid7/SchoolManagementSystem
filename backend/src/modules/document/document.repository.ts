/**
 * Document Repository
 * 
 * Database operations for document management
 * 
 * Requirements: 27.1, 27.2, 27.3, 27.5
 */

import { Document, DocumentCreationAttributes } from '../../models/Document.model';
import { DocumentAccessLog, DocumentAccessLogCreationAttributes } from '../../models/DocumentAccessLog.model';
import { Op, WhereOptions } from 'sequelize';

export interface DocumentFilters {
  category?: string;
  status?: string;
  accessLevel?: string;
  uploadedBy?: number;
  search?: string;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
}

export interface DocumentAccessFilters {
  documentId?: number;
  userId?: number;
  action?: string;
  startDate?: Date;
  endDate?: Date;
}

export class DocumentRepository {
  /**
   * Create a new document
   */
  async create(data: DocumentCreationAttributes): Promise<Document> {
    return await Document.create(data);
  }

  /**
   * Find document by ID
   */
  async findById(documentId: number): Promise<Document | null> {
    return await Document.findByPk(documentId);
  }

  /**
   * Find document by document number
   */
  async findByDocumentNumber(documentNumber: string): Promise<Document | null> {
    return await Document.findOne({
      where: { documentNumber },
    });
  }

  /**
   * Find all documents with filters
   */
  async findAll(filters: DocumentFilters = {}): Promise<Document[]> {
    const where: WhereOptions = {};

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.status) {
      where.status = filters.status;
    } else {
      where.status = { [Op.ne]: 'deleted' }; // Exclude deleted by default
    }

    if (filters.accessLevel) {
      where.accessLevel = filters.accessLevel;
    }

    if (filters.uploadedBy) {
      where.uploadedBy = filters.uploadedBy;
    }

    if (filters.search) {
      (where as any)[Op.or] = [
        { name: { [Op.like]: `%${filters.search}%` } },
        { originalName: { [Op.like]: `%${filters.search}%` } },
        { description: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { [Op.overlap]: filters.tags };
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt[Op.gte] = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt[Op.lte] = filters.endDate;
      }
    }

    return await Document.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Find documents by category
   */
  async findByCategory(category: string): Promise<Document[]> {
    return await Document.findAll({
      where: {
        category,
        status: { [Op.ne]: 'deleted' },
      },
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Find document versions
   */
  async findVersions(documentId: number): Promise<Document[]> {
    const document = await this.findById(documentId);
    if (!document) return [];

    // Find by document number or parent ID
    return await Document.findAll({
      where: {
        [Op.or]: [
          { documentNumber: document.documentNumber },
          { parentDocumentId: documentId },
        ],
        status: { [Op.ne]: 'deleted' },
      },
      order: [['version', 'ASC']],
    });
  }

  /**
   * Get latest version of a document
   */
  async getLatestVersion(documentNumber: string): Promise<number> {
    const result = await Document.findOne({
      where: { documentNumber },
      order: [['version', 'DESC']],
      attributes: ['version'],
    });

    return result?.version || 0;
  }

  /**
   * Update document
   */
  async update(documentId: number, data: Partial<DocumentCreationAttributes>): Promise<Document | null> {
    const document = await this.findById(documentId);
    if (!document) return null;

    await document.update(data);
    return document;
  }

  /**
   * Soft delete document
   */
  async softDelete(documentId: number): Promise<Document | null> {
    const document = await this.findById(documentId);
    if (!document) return null;

    await document.update({ status: 'deleted' });
    return document;
  }

  /**
   * Archive document
   */
  async archive(documentId: number): Promise<Document | null> {
    const document = await this.findById(documentId);
    if (!document) return null;

    await document.update({ status: 'archived' });
    return document;
  }

  /**
   * Check if document number exists
   */
  async existsByDocumentNumber(documentNumber: string): Promise<boolean> {
    const count = await Document.count({
      where: { documentNumber },
    });
    return count > 0;
  }

  /**
   * Get document count by category
   */
  async getCountByCategory(): Promise<Record<string, number>> {
    const documents = await Document.findAll({
      where: { status: { [Op.ne]: 'deleted' } },
      attributes: [
        'category',
        [require('sequelize').fn('COUNT', '*'), 'count'],
      ],
      group: ['category'],
    });

    return documents.reduce((acc, doc: any) => {
      acc[doc.category] = parseInt(doc.get('count'), 10);
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Get total document count
   */
  async getTotalCount(): Promise<number> {
    return await Document.count({
      where: { status: { [Op.ne]: 'deleted' } },
    });
  }

  // Access Log Methods

  /**
   * Log document access
   */
  async logAccess(data: DocumentAccessLogCreationAttributes): Promise<DocumentAccessLog> {
    return await DocumentAccessLog.create(data);
  }

  /**
   * Get access logs for a document
   */
  async getAccessLogs(filters: DocumentAccessFilters = {}): Promise<DocumentAccessLog[]> {
    const where: WhereOptions = {};

    if (filters.documentId) {
      where.documentId = filters.documentId;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt[Op.gte] = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt[Op.lte] = filters.endDate;
      }
    }

    return await DocumentAccessLog.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Get access logs for a user
   */
  async getUserAccessLogs(userId: number, limit: number = 100): Promise<DocumentAccessLog[]> {
    return await DocumentAccessLog.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
    });
  }

  /**
   * Get access count for a document
   */
  async getAccessCount(documentId: number): Promise<number> {
    return await DocumentAccessLog.count({
      where: { documentId },
    });
  }

  /**
   * Get recent access logs
   */
  async getRecentAccessLogs(limit: number = 50): Promise<DocumentAccessLog[]> {
    return await DocumentAccessLog.findAll({
      order: [['createdAt', 'DESC']],
      limit,
    });
  }
}

export default new DocumentRepository();