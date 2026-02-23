/**
 * Certificate Template Repository
 * 
 * Handles database operations for certificate templates
 * 
 * Requirements: 25.2
 */

import { CertificateTemplate, CertificateTemplateCreationAttributes } from '../../models/CertificateTemplate.model';
import { Op } from 'sequelize';

export interface CertificateTemplateFilters {
  type?: string;
  isActive?: boolean;
  search?: string;
}

export class CertificateTemplateRepository {
  /**
   * Create a new certificate template
   */
  async create(data: CertificateTemplateCreationAttributes): Promise<CertificateTemplate> {
    return await CertificateTemplate.create(data);
  }

  /**
   * Find template by ID
   */
  async findById(templateId: number): Promise<CertificateTemplate | null> {
    return await CertificateTemplate.findByPk(templateId);
  }

  /**
   * Find all templates with optional filters
   */
async findAll(filters: CertificateTemplateFilters = {}): Promise<CertificateTemplate[]> {
    const where: any = {};

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.isActive !== undefined) {
      where.is_active = filters.isActive;
    }

    if (filters.search) {
      where.name = {
        [Op.like]: `%${filters.search}%`,
      };
    }

    return await CertificateTemplate.findAll({
      where,
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Find active templates by type
   */
  async findActiveByType(type: string): Promise<CertificateTemplate[]> {
    return await CertificateTemplate.findAll({
      where: {
        type,
        is_active: true,
      },
      order: [['name', 'ASC']],
    });
  }

  /**
   * Update template
   */
  async update(
    templateId: number,
    data: Partial<CertificateTemplateCreationAttributes>
  ): Promise<CertificateTemplate | null> {
    const template = await this.findById(templateId);
    if (!template) {
      return null;
    }

    await template.update(data);
    return template;
  }

  /**
   * Delete template (soft delete by setting isActive to false)
   */
  async delete(templateId: number): Promise<boolean> {
    const template = await this.findById(templateId);
    if (!template) {
      return false;
    }

    await template.update({ isActive: false });
    return true;
  }

  /**
   * Hard delete template
   */
  async hardDelete(templateId: number): Promise<boolean> {
    const template = await this.findById(templateId);
    if (!template) {
      return false;
    }

    await template.destroy();
    return true;
  }

  /**
   * Count templates by filters
   */
  async count(filters: CertificateTemplateFilters = {}): Promise<number> {
    const where: any = {};

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.name = {
        [Op.like]: `%${filters.search}%`,
      };
    }

    return await CertificateTemplate.count({ where });
  }

  /**
   * Check if template name exists
   */
  async existsByName(name: string, excludeId?: number): Promise<boolean> {
    const where: any = { name };

    if (excludeId) {
      where.templateId = {
        [Op.ne]: excludeId,
      };
    }

    const count = await CertificateTemplate.count({ where });
    return count > 0;
  }
}

export default new CertificateTemplateRepository();
