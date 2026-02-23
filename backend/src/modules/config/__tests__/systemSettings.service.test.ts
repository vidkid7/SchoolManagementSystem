import systemSettingsService from '../systemSettings.service';
import GradingScheme from '@models/GradingScheme.model';
import AttendanceRule from '@models/AttendanceRule.model';
import NotificationTemplate from '@models/NotificationTemplate.model';
import SchoolConfig from '@models/SchoolConfig.model';
import { NotFoundError, ValidationError } from '@middleware/errorHandler';

jest.mock('@models/GradingScheme.model');
jest.mock('@models/AttendanceRule.model');
jest.mock('@models/NotificationTemplate.model');
jest.mock('@models/SchoolConfig.model');
jest.mock('@utils/auditLogger');

describe('SystemSettingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Grading Schemes', () => {
    describe('getGradingSchemes', () => {
      it('should return all active grading schemes', async () => {
        const mockSchemes = [
          { id: '1', name: 'NEB Standard', isDefault: true, isActive: true },
          { id: '2', name: 'Custom Scheme', isDefault: false, isActive: true },
        ];

        (GradingScheme.findAll as jest.Mock).mockResolvedValue(mockSchemes);

        const result = await systemSettingsService.getGradingSchemes();

        expect(result).toEqual(mockSchemes);
        expect(GradingScheme.findAll).toHaveBeenCalledWith({
          where: { isActive: true },
          order: [['isDefault', 'DESC'], ['name', 'ASC']],
        });
      });
    });

    describe('getDefaultGradingScheme', () => {
      it('should return the default grading scheme', async () => {
        const mockScheme = { id: '1', name: 'NEB Standard', isDefault: true, isActive: true };

        (GradingScheme.findOne as jest.Mock).mockResolvedValue(mockScheme);

        const result = await systemSettingsService.getDefaultGradingScheme();

        expect(result).toEqual(mockScheme);
        expect(GradingScheme.findOne).toHaveBeenCalledWith({
          where: { isDefault: true, isActive: true },
        });
      });
    });

    describe('createGradingScheme', () => {
      it('should create a new grading scheme', async () => {
        const mockData = {
          name: 'Custom Scheme',
          description: 'Test scheme',
          grades: [
            { grade: 'A', gradePoint: 4.0, minPercentage: 90, maxPercentage: 100, description: 'Excellent' },
            { grade: 'B', gradePoint: 3.0, minPercentage: 80, maxPercentage: 89, description: 'Good' },
          ],
        };

        const mockScheme = { id: '1', ...mockData, isActive: true };

        (GradingScheme.update as jest.Mock).mockResolvedValue([1]);
        (GradingScheme.create as jest.Mock).mockResolvedValue(mockScheme);

        const result = await systemSettingsService.createGradingScheme(mockData, 1);

        expect(result).toEqual(mockScheme);
        expect(GradingScheme.create).toHaveBeenCalledWith(
          { ...mockData, isActive: true },
          { transaction: undefined }
        );
      });

      it('should throw error for overlapping grade ranges', async () => {
        const mockData = {
          name: 'Invalid Scheme',
          grades: [
            { grade: 'A', gradePoint: 4.0, minPercentage: 85, maxPercentage: 100, description: 'Excellent' },
            { grade: 'B', gradePoint: 3.0, minPercentage: 80, maxPercentage: 90, description: 'Good' },
          ],
        };

        await expect(systemSettingsService.createGradingScheme(mockData, 1)).rejects.toThrow(
          ValidationError
        );
      });

      it('should throw error for invalid percentage ranges', async () => {
        const mockData = {
          name: 'Invalid Scheme',
          grades: [
            { grade: 'A', gradePoint: 4.0, minPercentage: 90, maxPercentage: 110, description: 'Excellent' },
          ],
        };

        await expect(systemSettingsService.createGradingScheme(mockData, 1)).rejects.toThrow(
          ValidationError
        );
      });
    });

    describe('updateGradingScheme', () => {
      it('should update an existing grading scheme', async () => {
        const mockScheme = {
          id: '1',
          name: 'Old Name',
          update: jest.fn().mockResolvedValue(true),
          toJSON: jest.fn().mockReturnValue({ id: '1', name: 'Old Name' }),
        };

        (GradingScheme.findByPk as jest.Mock).mockResolvedValue(mockScheme);

        const updateData = { name: 'New Name' };
        await systemSettingsService.updateGradingScheme('1', updateData, 1);

        expect(mockScheme.update).toHaveBeenCalledWith(updateData, { transaction: undefined });
      });

      it('should throw error if scheme not found', async () => {
        (GradingScheme.findByPk as jest.Mock).mockResolvedValue(null);

        await expect(systemSettingsService.updateGradingScheme('999', { name: 'Test' }, 1)).rejects.toThrow(
          NotFoundError
        );
      });

      it('should unset other defaults when setting a scheme as default', async () => {
        const mockScheme = {
          id: '1',
          name: 'Test Scheme',
          isDefault: false,
          update: jest.fn().mockResolvedValue(true),
          toJSON: jest.fn().mockReturnValue({ id: '1', name: 'Test Scheme', isDefault: false }),
        };

        (GradingScheme.findByPk as jest.Mock).mockResolvedValue(mockScheme);
        (GradingScheme.update as jest.Mock).mockResolvedValue([1]);

        await systemSettingsService.updateGradingScheme('1', { isDefault: true }, 1);

        expect(GradingScheme.update).toHaveBeenCalledWith(
          { isDefault: false },
          { where: { isDefault: true }, transaction: undefined }
        );
      });
    });

    describe('deleteGradingScheme', () => {
      it('should soft delete a grading scheme', async () => {
        const mockScheme = {
          id: '1',
          isDefault: false,
          update: jest.fn().mockResolvedValue(true),
          toJSON: jest.fn().mockReturnValue({ id: '1', isDefault: false }),
        };

        (GradingScheme.findByPk as jest.Mock).mockResolvedValue(mockScheme);

        await systemSettingsService.deleteGradingScheme('1', 1);

        expect(mockScheme.update).toHaveBeenCalledWith({ isActive: false }, { transaction: undefined });
      });

      it('should throw error when deleting default scheme', async () => {
        const mockScheme = {
          id: '1',
          isDefault: true,
          toJSON: jest.fn().mockReturnValue({ id: '1', isDefault: true }),
        };

        (GradingScheme.findByPk as jest.Mock).mockResolvedValue(mockScheme);

        await expect(systemSettingsService.deleteGradingScheme('1', 1)).rejects.toThrow(ValidationError);
      });
    });
  });

  describe('Attendance Rules', () => {
    describe('getAttendanceRules', () => {
      it('should return all active attendance rules', async () => {
        const mockRules = [
          { id: '1', name: 'Default Rule', isActive: true },
          { id: '2', name: 'Strict Rule', isActive: true },
        ];

        (AttendanceRule.findAll as jest.Mock).mockResolvedValue(mockRules);

        const result = await systemSettingsService.getAttendanceRules();

        expect(result).toEqual(mockRules);
        expect(AttendanceRule.findAll).toHaveBeenCalledWith({
          where: { isActive: true },
          order: [['name', 'ASC']],
        });
      });
    });

    describe('createAttendanceRule', () => {
      it('should create a new attendance rule', async () => {
        const mockData = {
          name: 'Custom Rule',
          minimumAttendancePercentage: 80,
          lowAttendanceThreshold: 75,
        };

        const mockRule = { id: '1', ...mockData, isActive: true };

        (AttendanceRule.create as jest.Mock).mockResolvedValue(mockRule);

        const result = await systemSettingsService.createAttendanceRule(mockData, 1);

        expect(result).toEqual(mockRule);
        expect(AttendanceRule.create).toHaveBeenCalledWith(
          { ...mockData, isActive: true },
          { transaction: undefined }
        );
      });

      it('should create rule with all optional fields', async () => {
        const mockData = {
          name: 'Comprehensive Rule',
          minimumAttendancePercentage: 75,
          lowAttendanceThreshold: 70,
          criticalAttendanceThreshold: 60,
          correctionWindowHours: 24,
          allowTeacherCorrection: true,
          allowAdminCorrection: true,
          maxLeaveDaysPerMonth: 3,
          maxLeaveDaysPerYear: 30,
          requireLeaveApproval: true,
          enableLowAttendanceAlerts: true,
          alertParents: true,
          alertAdmins: true,
        };

        const mockRule = { id: '1', ...mockData, isActive: true };

        (AttendanceRule.create as jest.Mock).mockResolvedValue(mockRule);

        const result = await systemSettingsService.createAttendanceRule(mockData, 1);

        expect(result).toEqual(mockRule);
        expect(result.correctionWindowHours).toBe(24);
        expect(result.maxLeaveDaysPerMonth).toBe(3);
        expect(result.enableLowAttendanceAlerts).toBe(true);
      });
    });

    describe('updateAttendanceRule', () => {
      it('should update attendance rule thresholds', async () => {
        const mockRule = {
          id: '1',
          name: 'Test Rule',
          minimumAttendancePercentage: 75,
          lowAttendanceThreshold: 70,
          update: jest.fn().mockResolvedValue(true),
          toJSON: jest.fn().mockReturnValue({
            id: '1',
            minimumAttendancePercentage: 75,
            lowAttendanceThreshold: 70,
          }),
        };

        (AttendanceRule.findByPk as jest.Mock).mockResolvedValue(mockRule);

        const updateData = {
          minimumAttendancePercentage: 80,
          lowAttendanceThreshold: 75,
        };

        await systemSettingsService.updateAttendanceRule('1', updateData, 1);

        expect(mockRule.update).toHaveBeenCalledWith(updateData, { transaction: undefined });
      });
    });

    describe('deleteAttendanceRule', () => {
      it('should soft delete attendance rule', async () => {
        const mockRule = {
          id: '1',
          name: 'Test Rule',
          update: jest.fn().mockResolvedValue(true),
          toJSON: jest.fn().mockReturnValue({ id: '1', name: 'Test Rule' }),
        };

        (AttendanceRule.findByPk as jest.Mock).mockResolvedValue(mockRule);

        await systemSettingsService.deleteAttendanceRule('1', 1);

        expect(mockRule.update).toHaveBeenCalledWith({ isActive: false }, { transaction: undefined });
      });
    });
  });

  describe('Notification Templates', () => {
    describe('getNotificationTemplates', () => {
      it('should return all active templates', async () => {
        const mockTemplates = [
          { id: '1', name: 'Template 1', category: 'attendance', isActive: true },
          { id: '2', name: 'Template 2', category: 'fee', isActive: true },
        ];

        (NotificationTemplate.findAll as jest.Mock).mockResolvedValue(mockTemplates);

        const result = await systemSettingsService.getNotificationTemplates();

        expect(result).toEqual(mockTemplates);
      });

      it('should filter templates by category', async () => {
        const mockTemplates = [
          { id: '1', name: 'Template 1', category: 'attendance', isActive: true },
        ];

        (NotificationTemplate.findAll as jest.Mock).mockResolvedValue(mockTemplates);

        const result = await systemSettingsService.getNotificationTemplates({ category: 'attendance' });

        expect(result).toEqual(mockTemplates);
        expect(NotificationTemplate.findAll).toHaveBeenCalledWith({
          where: { isActive: true, category: 'attendance' },
          order: [['category', 'ASC'], ['name', 'ASC']],
        });
      });
    });

    describe('createNotificationTemplate', () => {
      it('should create a new notification template', async () => {
        const mockData = {
          name: 'Test Template',
          code: 'TEST_TEMPLATE',
          category: 'general' as const,
          channel: 'sms' as const,
          language: 'english' as const,
          templateEn: 'Test message',
        };

        const mockTemplate = { id: '1', ...mockData, isActive: true };

        (NotificationTemplate.findOne as jest.Mock).mockResolvedValue(null);
        (NotificationTemplate.create as jest.Mock).mockResolvedValue(mockTemplate);

        const result = await systemSettingsService.createNotificationTemplate(mockData, 1);

        expect(result).toEqual(mockTemplate);
      });

      it('should throw error if code already exists', async () => {
        const mockData = {
          name: 'Test Template',
          code: 'EXISTING_CODE',
          category: 'general' as const,
          channel: 'sms' as const,
          language: 'english' as const,
          templateEn: 'Test message',
        };

        (NotificationTemplate.findOne as jest.Mock).mockResolvedValue({ id: '1', code: 'EXISTING_CODE' });

        await expect(systemSettingsService.createNotificationTemplate(mockData, 1)).rejects.toThrow(
          ValidationError
        );
      });

      it('should create template with variables', async () => {
        const mockData = {
          name: 'Student Attendance Alert',
          code: 'ATTENDANCE_ALERT',
          category: 'attendance' as const,
          channel: 'sms' as const,
          language: 'english' as const,
          templateEn: 'Dear {{parent_name}}, {{student_name}} was absent on {{date}}.',
          variables: ['parent_name', 'student_name', 'date'],
        };

        const mockTemplate = { id: '1', ...mockData, isActive: true };

        (NotificationTemplate.findOne as jest.Mock).mockResolvedValue(null);
        (NotificationTemplate.create as jest.Mock).mockResolvedValue(mockTemplate);

        const result = await systemSettingsService.createNotificationTemplate(mockData, 1);

        expect(result).toEqual(mockTemplate);
        expect(result.variables).toEqual(['parent_name', 'student_name', 'date']);
      });

      it('should create bilingual template', async () => {
        const mockData = {
          name: 'Fee Reminder',
          code: 'FEE_REMINDER',
          category: 'fee' as const,
          channel: 'sms' as const,
          language: 'nepali' as const,
          templateEn: 'Dear {{parent_name}}, please pay the pending fee of Rs. {{amount}}.',
          templateNp: 'प्रिय {{parent_name}}, कृपया रु. {{amount}} को बाँकी शुल्क तिर्नुहोस्।',
          variables: ['parent_name', 'amount'],
        };

        const mockTemplate = { id: '1', ...mockData, isActive: true };

        (NotificationTemplate.findOne as jest.Mock).mockResolvedValue(null);
        (NotificationTemplate.create as jest.Mock).mockResolvedValue(mockTemplate);

        const result = await systemSettingsService.createNotificationTemplate(mockData, 1);

        expect(result.templateEn).toBeDefined();
        expect(result.templateNp).toBeDefined();
      });
    });

    describe('updateNotificationTemplate', () => {
      it('should update template content', async () => {
        const mockTemplate = {
          id: '1',
          code: 'TEST_TEMPLATE',
          templateEn: 'Old message',
          update: jest.fn().mockResolvedValue(true),
          toJSON: jest.fn().mockReturnValue({ id: '1', code: 'TEST_TEMPLATE', templateEn: 'Old message' }),
        };

        (NotificationTemplate.findByPk as jest.Mock).mockResolvedValue(mockTemplate);
        (NotificationTemplate.findOne as jest.Mock).mockResolvedValue(null);

        const updateData = { templateEn: 'New message' };
        await systemSettingsService.updateNotificationTemplate('1', updateData, 1);

        expect(mockTemplate.update).toHaveBeenCalledWith(updateData, { transaction: undefined });
      });

      it('should throw error when changing code to existing code', async () => {
        const mockTemplate = {
          id: '1',
          code: 'OLD_CODE',
          update: jest.fn(),
          toJSON: jest.fn().mockReturnValue({ id: '1', code: 'OLD_CODE' }),
        };

        (NotificationTemplate.findByPk as jest.Mock).mockResolvedValue(mockTemplate);
        (NotificationTemplate.findOne as jest.Mock).mockResolvedValue({ id: '2', code: 'NEW_CODE' });

        await expect(
          systemSettingsService.updateNotificationTemplate('1', { code: 'NEW_CODE' }, 1)
        ).rejects.toThrow(ValidationError);
      });
    });

    describe('deleteNotificationTemplate', () => {
      it('should soft delete template', async () => {
        const mockTemplate = {
          id: '1',
          name: 'Test Template',
          update: jest.fn().mockResolvedValue(true),
          toJSON: jest.fn().mockReturnValue({ id: '1', name: 'Test Template' }),
        };

        (NotificationTemplate.findByPk as jest.Mock).mockResolvedValue(mockTemplate);

        await systemSettingsService.deleteNotificationTemplate('1', 1);

        expect(mockTemplate.update).toHaveBeenCalledWith({ isActive: false }, { transaction: undefined });
      });
    });
  });

  describe('Date Format Settings', () => {
    describe('getDateFormatSettings', () => {
      it('should return date format settings from active config', async () => {
        const mockConfig = {
          dateFormat: 'YYYY-MM-DD',
          timeFormat: 'HH:mm',
          numberFormat: 'en-US',
          currency: 'NPR',
        };

        (SchoolConfig.findOne as jest.Mock).mockResolvedValue(mockConfig);

        const result = await systemSettingsService.getDateFormatSettings();

        expect(result).toEqual(mockConfig);
      });

      it('should return null if no active config exists', async () => {
        (SchoolConfig.findOne as jest.Mock).mockResolvedValue(null);

        const result = await systemSettingsService.getDateFormatSettings();

        expect(result).toBeNull();
      });
    });

    describe('updateDateFormatSettings', () => {
      it('should update date format settings', async () => {
        const mockConfig = {
          id: '1',
          dateFormat: 'YYYY-MM-DD',
          timeFormat: 'HH:mm',
          numberFormat: 'en-US',
          currency: 'NPR',
          update: jest.fn().mockResolvedValue(true),
        };

        (SchoolConfig.findOne as jest.Mock).mockResolvedValue(mockConfig);

        const updateData = { dateFormat: 'DD/MM/YYYY' };
        await systemSettingsService.updateDateFormatSettings(updateData, 1);

        expect(mockConfig.update).toHaveBeenCalledWith(updateData, { transaction: undefined });
      });

      it('should throw error if config not found', async () => {
        (SchoolConfig.findOne as jest.Mock).mockResolvedValue(null);

        await expect(
          systemSettingsService.updateDateFormatSettings({ dateFormat: 'DD/MM/YYYY' }, 1)
        ).rejects.toThrow(NotFoundError);
      });
    });
  });
});
