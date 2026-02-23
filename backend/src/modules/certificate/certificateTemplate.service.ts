/**
 * Certificate Template Service
 * 
 * Business logic for certificate template management
 * 
 * Requirements: 25.2
 */

import {
  CertificateTemplateRepository,
  CertificateTemplateFilters,
} from './certificateTemplate.repository';
import { CertificateTemplate, CertificateTemplateCreationAttributes } from '../../models/CertificateTemplate.model';

export interface CreateTemplateDTO {
  name: string;
  type: 'character' | 'transfer' | 'academic_excellence' | 'eca' | 'sports' | 'course_completion' | 'bonafide';
  templateHtml: string;
  variables: string[];
  isActive?: boolean;
}

export interface UpdateTemplateDTO {
  name?: string;
  type?: 'character' | 'transfer' | 'academic_excellence' | 'eca' | 'sports' | 'course_completion' | 'bonafide';
  templateHtml?: string;
  variables?: string[];
  isActive?: boolean;
}

export class CertificateTemplateService {
  constructor(private repository: CertificateTemplateRepository) {}

  /**
   * Create a new certificate template
   */
  async createTemplate(data: CreateTemplateDTO): Promise<CertificateTemplate> {
    // Validate template name uniqueness
    const exists = await this.repository.existsByName(data.name);
    if (exists) {
      throw new Error(`Template with name "${data.name}" already exists`);
    }

    // Validate variables format
    this.validateVariables(data.variables);

    // Validate template HTML contains the variables
    this.validateTemplateHtml(data.templateHtml, data.variables);

    const templateData: CertificateTemplateCreationAttributes = {
      name: data.name,
      type: data.type,
      templateHtml: data.templateHtml,
      variables: data.variables,
      isActive: data.isActive !== undefined ? data.isActive : true,
    };

    return await this.repository.create(templateData);
  }

  /**
   * Get template by ID
   */
  async getTemplateById(templateId: number): Promise<CertificateTemplate> {
    const template = await this.repository.findById(templateId);
    if (!template) {
      throw new Error(`Template with ID ${templateId} not found`);
    }
    return template;
  }

  /**
   * Get all templates with filters
   */
  async getAllTemplates(filters: CertificateTemplateFilters = {}): Promise<CertificateTemplate[]> {
    return await this.repository.findAll(filters);
  }

  /**
   * Get active templates by type
   */
  async getActiveTemplatesByType(type: string): Promise<CertificateTemplate[]> {
    return await this.repository.findActiveByType(type);
  }

  /**
   * Update template
   */
  async updateTemplate(templateId: number, data: UpdateTemplateDTO): Promise<CertificateTemplate> {
    const template = await this.getTemplateById(templateId);

    // Validate name uniqueness if name is being updated
    if (data.name && data.name !== template.name) {
      const exists = await this.repository.existsByName(data.name, templateId);
      if (exists) {
        throw new Error(`Template with name "${data.name}" already exists`);
      }
    }

    // Validate variables if provided
    if (data.variables) {
      this.validateVariables(data.variables);
    }

    // Validate template HTML if provided
    if (data.templateHtml || data.variables) {
      const html = data.templateHtml || template.templateHtml;
      const vars = data.variables || template.variables;
      this.validateTemplateHtml(html, vars);
    }

    const updated = await this.repository.update(templateId, data);
    if (!updated) {
      throw new Error(`Failed to update template with ID ${templateId}`);
    }

    return updated;
  }

  /**
   * Delete template (soft delete)
   */
  async deleteTemplate(templateId: number): Promise<void> {
    const success = await this.repository.delete(templateId);
    if (!success) {
      throw new Error(`Template with ID ${templateId} not found`);
    }
  }

  /**
   * Hard delete template
   */
  async hardDeleteTemplate(templateId: number): Promise<void> {
    const success = await this.repository.hardDelete(templateId);
    if (!success) {
      throw new Error(`Template with ID ${templateId} not found`);
    }
  }

  /**
   * Validate variable names
   */
  private validateVariables(variables: string[]): void {
    if (!Array.isArray(variables)) {
      throw new Error('Variables must be an array');
    }

    if (variables.length === 0) {
      throw new Error('At least one variable is required');
    }

    const variableRegex = /^[a-z_][a-z0-9_]*$/i;
    for (const variable of variables) {
      if (!variableRegex.test(variable)) {
        throw new Error(
          `Invalid variable name "${variable}". Variables must start with a letter or underscore and contain only letters, numbers, and underscores.`
        );
      }
    }

    // Check for duplicates
    const uniqueVars = new Set(variables);
    if (uniqueVars.size !== variables.length) {
      throw new Error('Duplicate variable names are not allowed');
    }
  }

  /**
   * Validate that template HTML contains all required variables
   */
  private validateTemplateHtml(html: string, variables: string[]): void {
    if (!html || html.trim().length === 0) {
      throw new Error('Template HTML cannot be empty');
    }

    // Extract variables from HTML
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = html.matchAll(regex);
    const foundVariables = new Set<string>();

    for (const match of matches) {
      foundVariables.add(match[1].trim());
    }

    // Check if all required variables are present
    const missingVariables = variables.filter(v => !foundVariables.has(v));
    if (missingVariables.length > 0) {
      throw new Error(
        `Template HTML is missing the following variables: ${missingVariables.join(', ')}`
      );
    }
  }

  /**
   * Render template with data
   */
  async renderTemplate(templateId: number, data: Record<string, any>): Promise<string> {
    const template = await this.getTemplateById(templateId);

    if (!template.isActive) {
      throw new Error('Cannot render inactive template');
    }

    // Validate that all required variables are provided
    const missingVars = template.variables.filter(v => !(v in data));
    if (missingVars.length > 0) {
      throw new Error(`Missing required variables: ${missingVars.join(', ')}`);
    }

    return template.renderTemplate(data);
  }

  /**
   * Get template statistics
   */
  async getTemplateStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byType: Record<string, number>;
  }> {
    const all = await this.repository.findAll();
    const active = all.filter(t => t.isActive);
    const inactive = all.filter(t => !t.isActive);

    const byType: Record<string, number> = {};
    for (const template of all) {
      byType[template.type] = (byType[template.type] || 0) + 1;
    }

    return {
      total: all.length,
      active: active.length,
      inactive: inactive.length,
      byType,
    };
  }
}

export default new CertificateTemplateService(new CertificateTemplateRepository());
