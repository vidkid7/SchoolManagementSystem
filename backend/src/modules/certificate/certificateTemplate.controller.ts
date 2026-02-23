/**
 * Certificate Template Controller
 * 
 * HTTP request handlers for certificate template operations
 * 
 * Requirements: 25.2
 */

import { Request, Response } from 'express';
import certificateTemplateService from './certificateTemplate.service';
import { CertificateTemplateFilters } from './certificateTemplate.repository';

export class CertificateTemplateController {
  /**
   * Create a new certificate template
   * POST /api/v1/certificates/templates
   */
async createTemplate(req: Request, res: Response): Promise<void> {
    try {
      const template = await certificateTemplateService.createTemplate(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Certificate template created successfully',
        data: template.toJSON(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'TEMPLATE_CREATE_ERROR',
          message: error.message || 'Failed to create certificate template',
        },
      });
    }
  }

  /**
   * Get all certificate templates
   * GET /api/v1/certificates/templates
   */
async getAllTemplates(req: Request, res: Response): Promise<void> {
    try {
      const filters: CertificateTemplateFilters = {
        type: req.query.type as string,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        search: req.query.search as string,
      };

      const templates = await certificateTemplateService.getAllTemplates(filters);
      
      res.status(200).json({
        success: true,
        data: templates.map(t => t.toJSON()),
        meta: {
          total: templates.length,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'TEMPLATE_FETCH_ERROR',
          message: error.message || 'Failed to fetch certificate templates',
        },
      });
    }
  }

  /**
   * Get certificate template by ID
   * GET /api/v1/certificates/templates/:id
   */
async getTemplateById(req: Request, res: Response): Promise<void> {
    try {
      const templateId = parseInt(req.params.id, 10);
      const template = await certificateTemplateService.getTemplateById(templateId);
      
      res.status(200).json({
        success: true,
        data: template.toJSON(),
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: error.message || 'Failed to fetch certificate template',
        },
      });
    }
  }

  /**
   * Update certificate template
   * PUT /api/v1/certificates/templates/:id
   */
async updateTemplate(req: Request, res: Response): Promise<void> {
    try {
      const templateId = parseInt(req.params.id, 10);
      const template = await certificateTemplateService.updateTemplate(templateId, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Certificate template updated successfully',
        data: template.toJSON(),
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: {
          code: 'TEMPLATE_UPDATE_ERROR',
          message: error.message || 'Failed to update certificate template',
        },
      });
    }
  }

  /**
   * Delete certificate template (soft delete)
   * DELETE /api/v1/certificates/templates/:id
   */
  async deleteTemplate(req: Request, res: Response): Promise<void> {
    try {
      const templateId = parseInt(req.params.id, 10);
      await certificateTemplateService.deleteTemplate(templateId);
      
      res.status(200).json({
        success: true,
        message: 'Certificate template deleted successfully',
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: {
          code: 'TEMPLATE_DELETE_ERROR',
          message: error.message || 'Failed to delete certificate template',
        },
      });
    }
  }

  /**
   * Get active templates by type
   * GET /api/v1/certificates/templates/type/:type
   */
  async getActiveTemplatesByType(req: Request, res: Response): Promise<void> {
    try {
      const type = req.params.type;
      const templates = await certificateTemplateService.getActiveTemplatesByType(type);
      
      res.status(200).json({
        success: true,
        data: templates,
        meta: {
          total: templates.length,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'TEMPLATE_FETCH_ERROR',
          message: error.message || 'Failed to fetch certificate templates',
        },
      });
    }
  }

  /**
   * Render template with data
   * POST /api/v1/certificates/templates/:id/render
   */
  async renderTemplate(req: Request, res: Response): Promise<void> {
    try {
      const templateId = parseInt(req.params.id, 10);
      const rendered = await certificateTemplateService.renderTemplate(templateId, req.body.data);
      
      res.status(200).json({
        success: true,
        data: {
          html: rendered,
        },
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: {
          code: 'TEMPLATE_RENDER_ERROR',
          message: error.message || 'Failed to render certificate template',
        },
      });
    }
  }

  /**
   * Get template statistics
   * GET /api/v1/certificates/templates/stats
   */
  async getTemplateStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await certificateTemplateService.getTemplateStats();
      
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'STATS_FETCH_ERROR',
          message: error.message || 'Failed to fetch template statistics',
        },
      });
    }
  }
}

export default new CertificateTemplateController();
