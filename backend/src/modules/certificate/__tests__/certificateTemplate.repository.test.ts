/**
 * Certificate Template Repository Tests
 * 
 * Tests for certificate template repository operations
 * 
 * Requirements: 25.2
 */

import { CertificateTemplateRepository } from '../certificateTemplate.repository';

// Mock the CertificateTemplate model
jest.mock('../../../models/CertificateTemplate.model');

describe('CertificateTemplateRepository', () => {
  let repository: CertificateTemplateRepository;

  beforeEach(() => {
    repository = new CertificateTemplateRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new template', async () => {
      const { CertificateTemplate } = require('../../../models/CertificateTemplate.model');
      const mockTemplate = {
        templateId: 1,
        name: 'Character Certificate',
        type: 'character',
        templateHtml: '<div>{{student_name}}</div>',
        variables: ['student_name'],
        isActive: true,
      };
      (CertificateTemplate.create as jest.Mock).mockResolvedValue(mockTemplate);

      const template = await repository.create({
        name: 'Character Certificate',
        type: 'character',
        templateHtml: '<div>{{student_name}}</div>',
        variables: ['student_name'],
        isActive: true,
      });

      expect(template.templateId).toBe(1);
      expect(template.name).toBe('Character Certificate');
      expect(template.type).toBe('character');
    });
  });

  describe('findById', () => {
    it('should find template by ID', async () => {
      const { CertificateTemplate } = require('../../../models/CertificateTemplate.model');
      const mockTemplate = {
        templateId: 1,
        name: 'Test Template',
        type: 'character',
      };
      (CertificateTemplate.findByPk as jest.Mock).mockResolvedValue(mockTemplate);

      const found = await repository.findById(1);

      expect(found).toBeDefined();
      expect(found?.templateId).toBe(1);
      expect(found?.name).toBe('Test Template');
    });

    it('should return null for non-existent ID', async () => {
      const { CertificateTemplate } = require('../../../models/CertificateTemplate.model');
      (CertificateTemplate.findByPk as jest.Mock).mockResolvedValue(null);

      const found = await repository.findById(99999);

      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all templates without filters', async () => {
      const { CertificateTemplate } = require('../../../models/CertificateTemplate.model');
      const mockTemplates = [
        { templateId: 1, name: 'Template 1', type: 'character', isActive: true },
        { templateId: 2, name: 'Template 2', type: 'transfer', isActive: true },
      ];
      (CertificateTemplate.findAll as jest.Mock).mockResolvedValue(mockTemplates);

      const templates = await repository.findAll();

      expect(templates).toHaveLength(2);
    });

    it('should filter by type', async () => {
      const { CertificateTemplate } = require('../../../models/CertificateTemplate.model');
      const mockTemplates = [
        { templateId: 1, name: 'Template 1', type: 'character', isActive: true },
      ];
      (CertificateTemplate.findAll as jest.Mock).mockResolvedValue(mockTemplates);

      const templates = await repository.findAll({ type: 'character' });

      expect(templates).toHaveLength(1);
      expect(templates[0].type).toBe('character');
    });

    it('should filter by isActive', async () => {
      const { CertificateTemplate } = require('../../../models/CertificateTemplate.model');
      const mockTemplates = [
        { templateId: 1, name: 'Template 1', type: 'character', isActive: true },
      ];
      (CertificateTemplate.findAll as jest.Mock).mockResolvedValue(mockTemplates);

      const templates = await repository.findAll({ isActive: true });

      expect(templates).toHaveLength(1);
      expect(templates[0].isActive).toBe(true);
    });

    it('should combine multiple filters', async () => {
      const { CertificateTemplate } = require('../../../models/CertificateTemplate.model');
      const mockTemplates = [
        { templateId: 1, name: 'Character Certificate', type: 'character', isActive: true },
      ];
      (CertificateTemplate.findAll as jest.Mock).mockResolvedValue(mockTemplates);

      const templates = await repository.findAll({
        type: 'character',
        isActive: true,
      });

      expect(templates).toHaveLength(1);
      expect(templates[0].name).toBe('Character Certificate');
    });
  });

  describe('findActiveByType', () => {
    it('should find only active templates of specified type', async () => {
      const { CertificateTemplate } = require('../../../models/CertificateTemplate.model');
      const mockTemplates = [
        { templateId: 1, name: 'Template 1', type: 'character', isActive: true },
        { templateId: 2, name: 'Template 2', type: 'character', isActive: true },
      ];
      (CertificateTemplate.findAll as jest.Mock).mockResolvedValue(mockTemplates);

      const templates = await repository.findActiveByType('character');

      expect(templates).toHaveLength(2);
      expect(templates.every(t => t.type === 'character' && t.isActive)).toBe(true);
    });

    it('should return empty array for type with no active templates', async () => {
      const { CertificateTemplate } = require('../../../models/CertificateTemplate.model');
      (CertificateTemplate.findAll as jest.Mock).mockResolvedValue([]);

      const templates = await repository.findActiveByType('transfer');

      expect(templates).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('should update template', async () => {
      const { CertificateTemplate } = require('../../../models/CertificateTemplate.model');
      const mockTemplate = {
        templateId: 1,
        name: 'Original Name',
        type: 'character',
        update: jest.fn().mockImplementation(function(this: any, data) {
          Object.assign(this, data);
          return Promise.resolve(this);
        }),
      };
      (CertificateTemplate.findByPk as jest.Mock).mockResolvedValue(mockTemplate);

      const updated = await repository.update(1, { name: 'Updated Name' });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Name');
    });

    it('should return null for non-existent template', async () => {
      const { CertificateTemplate } = require('../../../models/CertificateTemplate.model');
      (CertificateTemplate.findByPk as jest.Mock).mockResolvedValue(null);

      const updated = await repository.update(99999, { name: 'Test' });

      expect(updated).toBeNull();
    });
  });

  describe('delete', () => {
    it('should soft delete template by setting isActive to false', async () => {
      const { CertificateTemplate } = require('../../../models/CertificateTemplate.model');
      const mockTemplate = {
        templateId: 1,
        name: 'Test Template',
        isActive: true,
        update: jest.fn().mockResolvedValue(true),
      };
      (CertificateTemplate.findByPk as jest.Mock).mockResolvedValue(mockTemplate);

      const success = await repository.delete(1);

      expect(success).toBe(true);
    });

    it('should return false for non-existent template', async () => {
      const { CertificateTemplate } = require('../../../models/CertificateTemplate.model');
      (CertificateTemplate.findByPk as jest.Mock).mockResolvedValue(null);

      const success = await repository.delete(99999);

      expect(success).toBe(false);
    });
  });

  describe('hardDelete', () => {
    it('should permanently delete template', async () => {
      const { CertificateTemplate } = require('../../../models/CertificateTemplate.model');
      const mockTemplate = {
        templateId: 1,
        name: 'Test Template',
        destroy: jest.fn().mockResolvedValue(true),
      };
      (CertificateTemplate.findByPk as jest.Mock).mockResolvedValue(mockTemplate);

      const success = await repository.hardDelete(1);

      expect(success).toBe(true);
    });

    it('should return false for non-existent template', async () => {
      const { CertificateTemplate } = require('../../../models/CertificateTemplate.model');
      (CertificateTemplate.findByPk as jest.Mock).mockResolvedValue(null);

      const success = await repository.hardDelete(99999);

      expect(success).toBe(false);
    });
  });

  describe('count', () => {
    it('should count all templates', async () => {
      const { CertificateTemplate } = require('../../../models/CertificateTemplate.model');
      (CertificateTemplate.count as jest.Mock).mockResolvedValue(3);

      const count = await repository.count();

      expect(count).toBe(3);
    });

    it('should count templates by type', async () => {
      const { CertificateTemplate } = require('../../../models/CertificateTemplate.model');
      (CertificateTemplate.count as jest.Mock).mockResolvedValue(2);

      const count = await repository.count({ type: 'character' });

      expect(count).toBe(2);
    });

    it('should count templates by isActive', async () => {
      const { CertificateTemplate } = require('../../../models/CertificateTemplate.model');
      (CertificateTemplate.count as jest.Mock).mockResolvedValue(2);

      const count = await repository.count({ isActive: true });

      expect(count).toBe(2);
    });
  });

  describe('existsByName', () => {
    it('should return true if template name exists', async () => {
      const { CertificateTemplate } = require('../../../models/CertificateTemplate.model');
      (CertificateTemplate.count as jest.Mock).mockResolvedValue(1);

      const exists = await repository.existsByName('Existing Template');

      expect(exists).toBe(true);
    });

    it('should return false if template name does not exist', async () => {
      const { CertificateTemplate } = require('../../../models/CertificateTemplate.model');
      (CertificateTemplate.count as jest.Mock).mockResolvedValue(0);

      const exists = await repository.existsByName('Non-existent Template');

      expect(exists).toBe(false);
    });

    it('should exclude specified ID when checking', async () => {
      const { CertificateTemplate } = require('../../../models/CertificateTemplate.model');
      (CertificateTemplate.count as jest.Mock).mockResolvedValue(0);

      const exists = await repository.existsByName('Another Template', 1);

      expect(exists).toBe(false);
    });
  });
});