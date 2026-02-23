/**
 * Certificate Repository
 * 
 * Database operations for certificates
 * 
 * Requirements: 25.1, 25.3, 25.4, 25.5
 */

import { Certificate, CertificateCreationAttributes } from '../../models/Certificate.model';
import { Op } from 'sequelize';

export interface CertificateFilters {
  studentId?: number;
  type?: string;
  status?: 'active' | 'revoked';
  issuedDateFrom?: Date;
  issuedDateTo?: Date;
  search?: string;
}

export class CertificateRepository {
  /**
   * Create a new certificate
   */
  async create(data: CertificateCreationAttributes): Promise<Certificate> {
    return await Certificate.create(data);
  }

  /**
   * Find certificate by ID
   */
  async findById(certificateId: number): Promise<Certificate | null> {
    return await Certificate.findByPk(certificateId);
  }

  /**
   * Find certificate by certificate number
   */
  async findByCertificateNumber(certificateNumber: string): Promise<Certificate | null> {
    return await Certificate.findOne({
      where: { certificateNumber },
    });
  }

  /**
   * Find all certificates with filters
   */
  async findAll(filters: CertificateFilters = {}): Promise<Certificate[]> {
    const where: any = {};

    if (filters.studentId) {
      where.studentId = filters.studentId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.issuedDateFrom || filters.issuedDateTo) {
      where.issuedDate = {};
      if (filters.issuedDateFrom) {
        where.issuedDate[Op.gte] = filters.issuedDateFrom;
      }
      if (filters.issuedDateTo) {
        where.issuedDate[Op.lte] = filters.issuedDateTo;
      }
    }

    if (filters.search) {
      where[Op.or] = [
        { certificateNumber: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    return await Certificate.findAll({
      where,
      order: [['issuedDate', 'DESC']],
    });
  }

  /**
   * Find certificates by student ID
   */
  async findByStudentId(studentId: number): Promise<Certificate[]> {
    return await Certificate.findAll({
      where: { studentId },
      order: [['issuedDate', 'DESC']],
    });
  }

  /**
   * Find active certificates by student ID
   */
  async findActiveByStudentId(studentId: number): Promise<Certificate[]> {
    return await Certificate.findAll({
      where: {
        studentId,
        status: 'active',
      },
      order: [['issuedDate', 'DESC']],
    });
  }

  /**
   * Find certificates by type
   */
  async findByType(type: string): Promise<Certificate[]> {
    return await Certificate.findAll({
      where: { type },
      order: [['issuedDate', 'DESC']],
    });
  }

  /**
   * Update certificate
   */
  async update(certificateId: number, data: Partial<CertificateCreationAttributes>): Promise<Certificate | null> {
    const certificate = await this.findById(certificateId);
    if (!certificate) {
      return null;
    }

    await certificate.update(data);
    return certificate;
  }

  /**
   * Revoke certificate
   */
  async revoke(certificateId: number, revokedBy: number, reason: string): Promise<Certificate | null> {
    const certificate = await this.findById(certificateId);
    if (!certificate) {
      return null;
    }

    certificate.revoke(revokedBy, reason);
    await certificate.save();
    return certificate;
  }

  /**
   * Check if certificate number exists
   */
  async existsByCertificateNumber(certificateNumber: string): Promise<boolean> {
    const count = await Certificate.count({
      where: { certificateNumber },
    });
    return count > 0;
  }

  /**
   * Count certificates by filters
   */
  async count(filters: CertificateFilters = {}): Promise<number> {
    const where: any = {};

    if (filters.studentId) {
      where.studentId = filters.studentId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    return await Certificate.count({ where });
  }

/**
   * Get certificate statistics
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    revoked: number;
    byType: Record<string, number>;
    thisMonth: number;
    recent: Array<{
      certificateNumber: string;
      studentName: string;
      type: string;
      issuedDate: Date;
    }>;
  }> {
    const all = await Certificate.findAll({
      order: [['issuedDate', 'DESC']],
      limit: 10,
    });
    
    const allCount = await Certificate.count();
    const activeCount = await Certificate.count({ where: { status: 'active' } });
    const revokedCount = await Certificate.count({ where: { status: 'revoked' } });

    const byType: Record<string, number> = {};
    const allForType = await Certificate.findAll({ attributes: ['type'] });
    for (const cert of allForType) {
      byType[cert.type] = (byType[cert.type] || 0) + 1;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthCount = await Certificate.count({
      where: {
        issuedDate: {
          [Op.gte]: startOfMonth,
        },
      },
    });

    const recent = all.slice(0, 5).map(cert => ({
      certificateNumber: cert.certificateNumber,
      studentName: (cert.data as any)?.studentName || 'Unknown',
      type: cert.type,
      issuedDate: cert.issuedDate,
    }));

    return {
      total: allCount,
      active: activeCount,
      revoked: revokedCount,
      byType,
      thisMonth: thisMonthCount,
      recent,
    };
  }
}

export default CertificateRepository;
