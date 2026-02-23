import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import SchoolConfig from '@models/SchoolConfig.model';
import configService from '../config.service';
import { SchoolConfigData } from '../config.types';

// Mock the models and dependencies
jest.mock('@models/SchoolConfig.model');
jest.mock('@utils/auditLogger');

describe('Config Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createConfig', () => {
    it('should create a new school configuration', async () => {
      const configData: SchoolConfigData = {
        schoolNameEn: 'Test School',
        schoolNameNp: 'परीक्षण विद्यालय',
        schoolCode: 'TEST001',
        addressEn: '123 Test Street',
        phone: '01-1234567',
        email: 'test@school.edu.np',
      };

      const mockConfig = {
        id: '1',
        ...configData,
        isActive: true,
        academicYearStartMonth: 1,
        termsPerYear: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (SchoolConfig.findOne as jest.Mock).mockResolvedValue(null);
      (SchoolConfig.create as jest.Mock).mockResolvedValue(mockConfig);

      const config = await configService.createConfig(configData, 123);

      expect(config).toBeDefined();
      expect(config.schoolNameEn).toBe('Test School');
      expect(config.schoolNameNp).toBe('परीक्षण विद्यालय');
      expect(config.schoolCode).toBe('TEST001');
      expect(config.isActive).toBe(true);
      expect(config.academicYearStartMonth).toBe(1);
      expect(config.termsPerYear).toBe(3);
    });

    it('should throw error if active config already exists', async () => {
      const configData: SchoolConfigData = {
        schoolNameEn: 'First School',
      };

      (SchoolConfig.findOne as jest.Mock).mockResolvedValue({ id: '1', isActive: true });

      await expect(
        configService.createConfig(configData, 123)
      ).rejects.toThrow('An active school configuration already exists');
    });

    it('should create config with custom academic year structure', async () => {
      const configData: SchoolConfigData = {
        schoolNameEn: 'Custom School',
        academicYearStartMonth: 4,
        academicYearDurationMonths: 12,
        termsPerYear: 2,
      };

      const mockConfig = {
        id: '1',
        ...configData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (SchoolConfig.findOne as jest.Mock).mockResolvedValue(null);
      (SchoolConfig.create as jest.Mock).mockResolvedValue(mockConfig);

      const config = await configService.createConfig(configData, 123);

      expect(config.academicYearStartMonth).toBe(4);
      expect(config.termsPerYear).toBe(2);
    });

    it('should set default values for optional fields', async () => {
      const configData: SchoolConfigData = {
        schoolNameEn: 'Minimal School',
      };

      const mockConfig = {
        id: '1',
        schoolNameEn: 'Minimal School',
        isActive: true,
        academicYearStartMonth: 1,
        academicYearDurationMonths: 12,
        termsPerYear: 3,
        defaultCalendarSystem: 'BS',
        defaultLanguage: 'nepali',
        timezone: 'Asia/Kathmandu',
        currency: 'NPR',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
        numberFormat: 'en-US',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (SchoolConfig.findOne as jest.Mock).mockResolvedValue(null);
      (SchoolConfig.create as jest.Mock).mockResolvedValue(mockConfig);

      const config = await configService.createConfig(configData, 123);

      expect(config.defaultCalendarSystem).toBe('BS');
      expect(config.defaultLanguage).toBe('nepali');
      expect(config.timezone).toBe('Asia/Kathmandu');
      expect(config.currency).toBe('NPR');
    });
  });

  describe('getActiveConfig', () => {
    it('should return active configuration', async () => {
      const mockConfig = {
        id: '1',
        schoolNameEn: 'Active School',
        isActive: true,
        academicYearStartMonth: 1,
        termsPerYear: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (SchoolConfig.findOne as jest.Mock).mockResolvedValue(mockConfig);

      const activeConfig = await configService.getActiveConfig();

      expect(activeConfig).toBeDefined();
      expect(activeConfig?.schoolNameEn).toBe('Active School');
      expect(activeConfig?.isActive).toBe(true);
    });

    it('should return null if no active configuration exists', async () => {
      (SchoolConfig.findOne as jest.Mock).mockResolvedValue(null);

      const activeConfig = await configService.getActiveConfig();

      expect(activeConfig).toBeNull();
    });
  });

  describe('updateConfig', () => {
    it('should update school configuration', async () => {
      const mockConfig = {
        id: '1',
        schoolNameEn: 'Original School',
        phone: '01-1111111',
        isActive: true,
        update: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          id: '1',
          schoolNameEn: 'Original School',
          phone: '01-1111111',
        }),
      };

      (SchoolConfig.findByPk as jest.Mock).mockResolvedValue(mockConfig);

      mockConfig.update.mockImplementation((data) => {
        Object.assign(mockConfig, data);
        return Promise.resolve(mockConfig);
      });

      const updatedConfig = await configService.updateConfig(
        '1',
        {
          schoolNameEn: 'Updated School',
          phone: '01-2222222',
          website: 'https://updated.school.edu.np',
        },
        123
      );

      expect(updatedConfig.schoolNameEn).toBe('Updated School');
      expect(updatedConfig.phone).toBe('01-2222222');
      expect(updatedConfig.website).toBe('https://updated.school.edu.np');
    });

    it('should throw error if config not found', async () => {
      (SchoolConfig.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(
        configService.updateConfig('non-existent-id', { schoolNameEn: 'Test' }, 123)
      ).rejects.toThrow('School configuration not found');
    });

    it('should update academic year structure', async () => {
      const mockConfig = {
        id: '1',
        schoolNameEn: 'Test School',
        termsPerYear: 3,
        academicYearStartMonth: 1,
        update: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          id: '1',
          schoolNameEn: 'Test School',
          termsPerYear: 3,
          academicYearStartMonth: 1,
        }),
      };

      (SchoolConfig.findByPk as jest.Mock).mockResolvedValue(mockConfig);

      mockConfig.update.mockImplementation((data) => {
        Object.assign(mockConfig, data);
        return Promise.resolve(mockConfig);
      });

      const updatedConfig = await configService.updateConfig(
        '1',
        {
          termsPerYear: 4,
          academicYearStartMonth: 2,
        },
        123
      );

      expect(updatedConfig.termsPerYear).toBe(4);
      expect(updatedConfig.academicYearStartMonth).toBe(2);
    });

    it('should update only provided fields', async () => {
      const mockConfig = {
        id: '1',
        schoolNameEn: 'Test School',
        phone: '01-1111111',
        email: 'test@school.edu.np',
        update: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          id: '1',
          schoolNameEn: 'Test School',
          phone: '01-1111111',
          email: 'test@school.edu.np',
        }),
      };

      (SchoolConfig.findByPk as jest.Mock).mockResolvedValue(mockConfig);

      mockConfig.update.mockImplementation((data) => {
        Object.assign(mockConfig, data);
        return Promise.resolve(mockConfig);
      });

      const updatedConfig = await configService.updateConfig(
        '1',
        { phone: '01-9999999' },
        123
      );

      expect(updatedConfig.phone).toBe('01-9999999');
      expect(updatedConfig.schoolNameEn).toBe('Test School');
      expect(updatedConfig.email).toBe('test@school.edu.np');
    });
  });

  describe('uploadLogo', () => {
    it('should update logo URL', async () => {
      const mockConfig = {
        id: '1',
        schoolNameEn: 'Test School',
        logoUrl: null,
        update: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({ id: '1', logoUrl: null }),
      };

      (SchoolConfig.findByPk as jest.Mock).mockResolvedValue(mockConfig);

      mockConfig.update.mockImplementation((data) => {
        Object.assign(mockConfig, data);
        return Promise.resolve(mockConfig);
      });

      const logoUrl = '/uploads/logos/test-logo.png';
      const updatedConfig = await configService.uploadLogo('1', logoUrl, 123);

      expect(updatedConfig.logoUrl).toBe(logoUrl);
    });

    it('should throw error if config not found', async () => {
      (SchoolConfig.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(
        configService.uploadLogo('non-existent-id', '/uploads/logos/test.png', 123)
      ).rejects.toThrow('School configuration not found');
    });

    it('should replace existing logo URL', async () => {
      const mockConfig = {
        id: '1',
        schoolNameEn: 'Test School',
        logoUrl: '/uploads/logos/old-logo.png',
        update: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({ id: '1', logoUrl: '/uploads/logos/old-logo.png' }),
      };

      (SchoolConfig.findByPk as jest.Mock).mockResolvedValue(mockConfig);

      mockConfig.update.mockImplementation((data) => {
        Object.assign(mockConfig, data);
        return Promise.resolve(mockConfig);
      });

      const newLogoUrl = '/uploads/logos/new-logo.png';
      const updatedConfig = await configService.uploadLogo('1', newLogoUrl, 123);

      expect(updatedConfig.logoUrl).toBe(newLogoUrl);
    });
  });

  describe('deactivateConfig', () => {
    it('should deactivate configuration', async () => {
      const mockConfig = {
        id: '1',
        schoolNameEn: 'Test School',
        isActive: true,
        update: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({ id: '1', isActive: true }),
      };

      (SchoolConfig.findByPk as jest.Mock).mockResolvedValue(mockConfig);

      mockConfig.update.mockImplementation((data) => {
        Object.assign(mockConfig, data);
        return Promise.resolve(mockConfig);
      });

      await configService.deactivateConfig('1', 123);

      expect(mockConfig.update).toHaveBeenCalledWith(
        { isActive: false },
        { transaction: undefined }
      );
    });

    it('should throw error if config not found', async () => {
      (SchoolConfig.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(
        configService.deactivateConfig('non-existent-id', 123)
      ).rejects.toThrow('School configuration not found');
    });
  });

  describe('getConfigById', () => {
    it('should return configuration by ID', async () => {
      const mockConfig = {
        id: '1',
        schoolNameEn: 'Test School',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (SchoolConfig.findByPk as jest.Mock).mockResolvedValue(mockConfig);

      const foundConfig = await configService.getConfigById('1');

      expect(foundConfig).toBeDefined();
      expect(foundConfig.id).toBe('1');
      expect(foundConfig.schoolNameEn).toBe('Test School');
    });

    it('should throw error if config not found', async () => {
      (SchoolConfig.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(configService.getConfigById('non-existent-id')).rejects.toThrow(
        'School configuration not found'
      );
    });
  });

  describe('Configuration Validation', () => {
    it('should validate terms per year range', async () => {
      const configData: SchoolConfigData = {
        schoolNameEn: 'Test School',
        termsPerYear: 2,
      };

      const mockConfig = {
        id: '1',
        ...configData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (SchoolConfig.findOne as jest.Mock).mockResolvedValue(null);
      (SchoolConfig.create as jest.Mock).mockResolvedValue(mockConfig);

      const config = await configService.createConfig(configData, 123);

      expect(config.termsPerYear).toBe(2);
      expect(config.termsPerYear).toBeGreaterThanOrEqual(1);
      expect(config.termsPerYear).toBeLessThanOrEqual(4);
    });

    it('should validate academic year start month', async () => {
      const configData: SchoolConfigData = {
        schoolNameEn: 'Test School',
        academicYearStartMonth: 1, // Baisakh
      };

      const mockConfig = {
        id: '1',
        ...configData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (SchoolConfig.findOne as jest.Mock).mockResolvedValue(null);
      (SchoolConfig.create as jest.Mock).mockResolvedValue(mockConfig);

      const config = await configService.createConfig(configData, 123);

      expect(config.academicYearStartMonth).toBe(1);
      expect(config.academicYearStartMonth).toBeGreaterThanOrEqual(1);
      expect(config.academicYearStartMonth).toBeLessThanOrEqual(12);
    });

    it('should handle bilingual school names', async () => {
      const configData: SchoolConfigData = {
        schoolNameEn: 'Nepal Model School',
        schoolNameNp: 'नेपाल मोडेल विद्यालय',
      };

      const mockConfig = {
        id: '1',
        ...configData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (SchoolConfig.findOne as jest.Mock).mockResolvedValue(null);
      (SchoolConfig.create as jest.Mock).mockResolvedValue(mockConfig);

      const config = await configService.createConfig(configData, 123);

      expect(config.schoolNameEn).toBe('Nepal Model School');
      expect(config.schoolNameNp).toBe('नेपाल मोडेल विद्यालय');
    });

    it('should handle bilingual addresses', async () => {
      const configData: SchoolConfigData = {
        schoolNameEn: 'Test School',
        addressEn: 'Kathmandu, Nepal',
        addressNp: 'काठमाडौं, नेपाल',
      };

      const mockConfig = {
        id: '1',
        ...configData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (SchoolConfig.findOne as jest.Mock).mockResolvedValue(null);
      (SchoolConfig.create as jest.Mock).mockResolvedValue(mockConfig);

      const config = await configService.createConfig(configData, 123);

      expect(config.addressEn).toBe('Kathmandu, Nepal');
      expect(config.addressNp).toBe('काठमाडौं, नेपाल');
    });
  });
});
