/**
 * Certificate Template Routes
 * 
 * API routes for certificate template management
 * 
 * Requirements: 25.2
 */

import { Router } from 'express';
import certificateTemplateController from './certificateTemplate.controller';
import { validate } from '../../middleware/validation';
import {
  createTemplateSchema,
  updateTemplateSchema,
  getTemplatesQuerySchema,
  templateIdParamSchema,
  renderTemplateSchema,
} from './certificateTemplate.validation';

const router = Router();

/**
 * @route   GET /api/v1/certificates/templates/stats
 * @desc    Get template statistics
 * @access  Private (Admin, Coordinator)
 */
router.get(
  '/stats',
  certificateTemplateController.getTemplateStats.bind(certificateTemplateController)
);

/**
 * @route   GET /api/v1/certificates/templates/type/:type
 * @desc    Get active templates by type
 * @access  Private
 */
router.get(
  '/type/:type',
  certificateTemplateController.getActiveTemplatesByType.bind(certificateTemplateController)
);

/**
 * @route   POST /api/v1/certificates/templates
 * @desc    Create a new certificate template
 * @access  Private (Admin, Coordinator)
 */
router.post(
  '/',
  validate(createTemplateSchema, 'body'),
  certificateTemplateController.createTemplate.bind(certificateTemplateController)
);

/**
 * @route   GET /api/v1/certificates/templates
 * @desc    Get all certificate templates
 * @access  Private
 */
router.get(
  '/',
  validate(getTemplatesQuerySchema, 'query'),
  certificateTemplateController.getAllTemplates.bind(certificateTemplateController)
);

/**
 * @route   GET /api/v1/certificates/templates/:id
 * @desc    Get certificate template by ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(templateIdParamSchema, 'params'),
  certificateTemplateController.getTemplateById.bind(certificateTemplateController)
);

/**
 * @route   PUT /api/v1/certificates/templates/:id
 * @desc    Update certificate template
 * @access  Private (Admin, Coordinator)
 */
router.put(
  '/:id',
  validate(templateIdParamSchema, 'params'),
  validate(updateTemplateSchema, 'body'),
  certificateTemplateController.updateTemplate.bind(certificateTemplateController)
);

/**
 * @route   DELETE /api/v1/certificates/templates/:id
 * @desc    Delete certificate template
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  validate(templateIdParamSchema, 'params'),
  certificateTemplateController.deleteTemplate.bind(certificateTemplateController)
);

/**
 * @route   POST /api/v1/certificates/templates/:id/render
 * @desc    Render template with data
 * @access  Private
 */
router.post(
  '/:id/render',
  validate(templateIdParamSchema, 'params'),
  validate(renderTemplateSchema, 'body'),
  certificateTemplateController.renderTemplate.bind(certificateTemplateController)
);

export default router;
