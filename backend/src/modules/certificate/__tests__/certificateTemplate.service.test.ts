/**
 * Certificate Template Service Tests
 * 
 * Tests for certificate template service business logic
 * 
 * Requirements: 25.2
 */

import { CertificateTemplateService } from '../certificateTemplate.service';
import { CertificateTemplateRepository } from '../certificateTemplate.repository';

// Mock the repository
jest.mock('../certificateTemplate.repository');

describe('CertificateTemplateService', () => {
  let service: CertificateTemplateService;
  let mockRepository: jest.Mocked<CertificateTemplateRepository>;

  beforeEach(() => {
    mockRepository = new CertificateTemplateRepository() as jest.Mocked<CertificateTemplateRepository>;
    service = new CertificateTemplateService(mockRepository);
    jest.clearAllMocks();
  });

  describe('createTemplate', () => {
    it('should create a valid template', async () => {
      const mockTemplate = {
        templateId: 1,
        name: 'Character Certificate',
        type: 'character' as const,
        templateHtml: '<div>{{student_name}} from {{class}}</div>',
        variables: ['student_name', 'class'],
        isActive: true,
      };
      mockRepository.existsByName.mockResolvedValue(false);
      mockRepository.create.mockResolvedValue(mockTemplate as any);

      const template = await service.createTemplate({
        name: 'Character Certificate',
        type: 'character',
        templateHtml: '<div>{{student_name}} from {{class}}</div>',
        variables: ['student_name', 'class'],
      });

      expect(template.templateId).toBe(1);
      expect(template.name).toBe('Character Certificate');
    });

    it('should throw error if template name already exists', async () => {
      mockRepository.existsByName.mockResolvedValue(true);

      await expect(
        service.createTemplate({
          name: 'Duplicate Name',
          type: 'character',
          templateHtml: '<div>{{name}}</div>',
          variables: ['name'],
        })
      ).rejects.toThrow('Template with name "Duplicate Name" already exists');
    });

    it('should throw error for invalid variable names', async () => {
      mockRepository.existsByName.mockResolvedValue(false);

      await expect(
        service.createTemplate({
          name: 'Test Template',
          type: 'character',
          templateHtml: '<div>{{123invalid}}</div>',
          variables: ['123invalid'],
        })
      ).rejects.toThrow(/Invalid variable name/);
    });

    it('should throw error for duplicate variables', async () => {
      mockRepository.existsByName.mockResolvedValue(false);

      await expect(
        service.createTemplate({
          name: 'Test Template',
          type: 'character',
          templateHtml: '<div>{{name}} {{name}}</div>',
          variables: ['name', 'name'],
        })
      ).rejects.toThrow('Duplicate variable names are not allowed');
    });

    it('should throw error if variables are missing from template HTML', async () => {
      mockRepository.existsByName.mockResolvedValue(false);

      await expect(
        service.createTemplate({
          name: 'Test Template',
          type: 'character',
          templateHtml: '<div>{{student_name}}</div>',
          variables: ['student_name', 'class'], // class is missing from HTML
        })
      ).rejects.toThrow(/Template HTML is missing the following variables/);
    });

    it('should throw error for empty template HTML', async () => {
      mockRepository.existsByName.mockResolvedValue(false);

      await expect(
        service.createTemplate({
          name: 'Test Template',
          type: 'character',
          templateHtml: '',
          variables: ['name'],
        })
      ).rejects.toThrow('Template HTML cannot be empty');
    });

    it('should throw error for empty variables array', async () => {
      mockRepository.existsByName.mockResolvedValue(false);

      await expect(
        service.createTemplate({
          name: 'Test Template',
          type: 'character',
          templateHtml: '<div>Test</div>',
          variables: [],
        })
      ).rejects.toThrow('At least one variable is required');
    });
  });

  describe('getTemplateById', () => {
    it('should get template by ID', async () => {
      const mockTemplate = {
        templateId: 1,
        name: 'Test Template',
        type: 'character' as const,
        templateHtml: '<div>{{name}}</div>',
        variables: ['name'],
        isActive: true,
      };
      mockRepository.findById.mockResolvedValue(mockTemplate as any);

      const found = await service.getTemplateById(1);

      expect(found.templateId).toBe(1);
      expect(found.name).toBe('Test Template');
    });

    it('should throw error for non-existent template', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getTemplateById(99999)).rejects.toThrow(
        'Template with ID 99999 not found'
      );
    });
  });

  describe('getAllTemplates', () => {
    it('should get all templates', async () => {
      const mockTemplates = [
        { templateId: 1, name: 'Character Certificate', type: 'character' as const, isActive: true },
        { templateId: 2, name: 'Transfer Certificate', type: 'transfer' as const, isActive: true },
      ];
      mockRepository.findAll.mockResolvedValue(mockTemplates as any);

      const templates = await service.getAllTemplates();

      expect(templates).toHaveLength(2);
    });

    it('should filter templates by type', async () => {
      const mockTemplates = [
        { templateId: 1, name: 'Character Certificate', type: 'character' as const, isActive: true },
      ];
      mockRepository.findAll.mockResolvedValue(mockTemplates as any);

      const templates = await service.getAllTemplates({ type: 'character' });

      expect(templates).toHaveLength(1);
      expect(templates[0].type).toBe('character');
    });
  });

  describe('updateTemplate', () => {
    it('should update template', async () => {
      const mockTemplate = {
        templateId: 1,
        name: 'Original Name',
        type: 'character' as const,
        templateHtml: '<div>{{name}}</div>',
        variables: ['name'],
        isActive: true,
      };
      const updatedTemplate = { ...mockTemplate, name: 'Updated Name' };
      
      mockRepository.findById.mockResolvedValue(mockTemplate as any);
      mockRepository.existsByName.mockResolvedValue(false);
      mockRepository.update.mockResolvedValue(updatedTemplate as any);

      const updated = await service.updateTemplate(1, {
        name: 'Updated Name',
      });

      expect(updated.name).toBe('Updated Name');
    });

    it('should throw error if new name already exists', async () => {
      const mockTemplate = {
        templateId: 1,
        name: 'Original Name',
        type: 'character' as const,
        templateHtml: '<div>{{name}}</div>',
        variables: ['name'],
        isActive: true,
      };
      
      mockRepository.findById.mockResolvedValue(mockTemplate as any);
      mockRepository.existsByName.mockResolvedValue(true);

      await expect(
        service.updateTemplate(1, {
          name: 'Existing Name',
        })
      ).rejects.toThrow('Template with name "Existing Name" already exists');
    });

    it('should validate variables when updating', async () => {
      const mockTemplate = {
        templateId: 1,
        name: 'Test Template',
        type: 'character' as const,
        templateHtml: '<div>{{name}}</div>',
        variables: ['name'],
        isActive: true,
      };
      
      mockRepository.findById.mockResolvedValue(mockTemplate as any);

      await expect(
        service.updateTemplate(1, {
          variables: ['123invalid'],
        })
      ).rejects.toThrow(/Invalid variable name/);
    });

    it('should validate template HTML when updating', async () => {
      const mockTemplate = {
        templateId: 1,
        name: 'Test Template',
        type: 'character' as const,
        templateHtml: '<div>{{name}}</div>',
        variables: ['name'],
        isActive: true,
      };
      
      mockRepository.findById.mockResolvedValue(mockTemplate as any);

      await expect(
        service.updateTemplate(1, {
          templateHtml: '<div>{{student_name}}</div>',
        })
      ).rejects.toThrow(/Template HTML is missing the following variables/);
    });
  });

  describe('deleteTemplate', () => {
    it('should soft delete template', async () => {
      const mockTemplate = {
        templateId: 1,
        name: 'Test Template',
        type: 'character' as const,
        templateHtml: '<div>{{name}}</div>',
        variables: ['name'],
        isActive: true,
      };
      
      mockRepository.findById.mockResolvedValue(mockTemplate as any);
      mockRepository.delete.mockResolvedValue(true);

      await service.deleteTemplate(1);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw error for non-existent template', async () => {
      mockRepository.delete.mockResolvedValue(false);

      await expect(service.deleteTemplate(99999)).rejects.toThrow(
        'Template with ID 99999 not found'
      );
    });
  });

  describe('renderTemplate', () => {
    it('should render template with provided data', async () => {
      const mockTemplate = {
        templateId: 1,
        name: 'Test Template',
        type: 'character' as const,
        templateHtml: '<div>{{student_name}} from {{class}}</div>',
        variables: ['student_name', 'class'],
        isActive: true,
        renderTemplate: jest.fn().mockReturnValue('<div>John Doe from Class 10</div>'),
      };
      
      mockRepository.findById.mockResolvedValue(mockTemplate as any);

      const rendered = await service.renderTemplate(1, {
        student_name: 'John Doe',
        class: 'Class 10',
      });

      expect(rendered).toBe('<div>John Doe from Class 10</div>');
    });

    it('should throw error for inactive template', async () => {
      const mockTemplate = {
        templateId: 1,
        name: 'Test Template',
        type: 'character' as const,
        templateHtml: '<div>{{name}}</div>',
        variables: ['name'],
        isActive: false,
      };
      
      mockRepository.findById.mockResolvedValue(mockTemplate as any);

      await expect(
        service.renderTemplate(1, { name: 'John' })
      ).rejects.toThrow('Cannot render inactive template');
    });

    it('should throw error for missing required variables', async () => {
      const mockTemplate = {
        templateId: 1,
        name: 'Test Template',
        type: 'character' as const,
        templateHtml: '<div>{{student_name}} from {{class}}</div>',
        variables: ['student_name', 'class'],
        isActive: true,
        renderTemplate: jest.fn(),
      };
      
      mockRepository.findById.mockResolvedValue(mockTemplate as any);

      await expect(
        service.renderTemplate(1, {
          student_name: 'John Doe',
        })
      ).rejects.toThrow('Missing required variables: class');
    });
  });

  describe('getTemplateStats', () => {
    it('should return template statistics', async () => {
      const mockTemplates = [
        { templateId: 1, name: 'Character 1', type: 'character' as const, isActive: true },
        { templateId: 2, name: 'Character 2', type: 'character' as const, isActive: false },
        { templateId: 3, name: 'Transfer 1', type: 'transfer' as const, isActive: true },
      ];
      mockRepository.findAll.mockResolvedValue(mockTemplates as any);

      const stats = await service.getTemplateStats();

      expect(stats.total).toBe(3);
      expect(stats.active).toBe(2);
      expect(stats.inactive).toBe(1);
      expect(stats.byType).toEqual({
        character: 2,
        transfer: 1,
      });
    });
  });

  describe('Variable Validation', () => {
    it('should accept valid variable names', async () => {
      const validNames = [
        'student_name',
        'class_name',
        '_private',
        'name123',
        'UPPERCASE',
        'camelCase',
      ];

      for (const name of validNames) {
        mockRepository.existsByName.mockResolvedValue(false);
        mockRepository.create.mockResolvedValue({
          templateId: 1,
          name: `Template ${name}`,
          type: 'character' as const,
          templateHtml: `<div>{{${name}}}</div>`,
          variables: [name],
          isActive: true,
        } as any);

        await expect(
          service.createTemplate({
            name: `Template ${name}`,
            type: 'character',
            templateHtml: `<div>{{${name}}}</div>`,
            variables: [name],
          })
        ).resolves.toBeDefined();
      }
    });

    it('should reject invalid variable names', async () => {
      const invalidNames = [
        '123start',
        'with-dash',
        'with space',
        'with.dot',
        'with@symbol',
      ];

      for (const name of invalidNames) {
        mockRepository.existsByName.mockResolvedValue(false);

        await expect(
          service.createTemplate({
            name: `Template ${name}`,
            type: 'character',
            templateHtml: `<div>{{${name}}}</div>`,
            variables: [name],
          })
        ).rejects.toThrow(/Invalid variable name/);
      }
    });
  });
});