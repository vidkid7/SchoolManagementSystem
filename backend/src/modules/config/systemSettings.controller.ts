import { Request, Response, NextFunction } from 'express';
import systemSettingsService from './systemSettings.service';
import { sendSuccess } from '@utils/responseFormatter';
import { HTTP_STATUS } from '@config/constants';

class SystemSettingsController {
  // ==================== Grading Schemes ====================

  async getGradingSchemes(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schemes = await systemSettingsService.getGradingSchemes();
      sendSuccess(res, schemes, 'Grading schemes retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getGradingSchemeById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const scheme = await systemSettingsService.getGradingSchemeById(id);
      sendSuccess(res, scheme, 'Grading scheme retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getDefaultGradingScheme(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scheme = await systemSettingsService.getDefaultGradingScheme();
      sendSuccess(res, scheme, 'Default grading scheme retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createGradingScheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const scheme = await systemSettingsService.createGradingScheme(req.body, userId);
      sendSuccess(res, scheme, 'Grading scheme created successfully', HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async updateGradingScheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const scheme = await systemSettingsService.updateGradingScheme(id, req.body, userId);
      sendSuccess(res, scheme, 'Grading scheme updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteGradingScheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      await systemSettingsService.deleteGradingScheme(id, userId);
      sendSuccess(res, null, 'Grading scheme deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // ==================== Attendance Rules ====================

  async getAttendanceRules(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rules = await systemSettingsService.getAttendanceRules();
      sendSuccess(res, rules, 'Attendance rules retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getAttendanceRuleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const rule = await systemSettingsService.getAttendanceRuleById(id);
      sendSuccess(res, rule, 'Attendance rule retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getActiveAttendanceRule(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rule = await systemSettingsService.getActiveAttendanceRule();
      sendSuccess(res, rule, 'Active attendance rule retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createAttendanceRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const rule = await systemSettingsService.createAttendanceRule(req.body, userId);
      sendSuccess(res, rule, 'Attendance rule created successfully', HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async updateAttendanceRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const rule = await systemSettingsService.updateAttendanceRule(id, req.body, userId);
      sendSuccess(res, rule, 'Attendance rule updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteAttendanceRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      await systemSettingsService.deleteAttendanceRule(id, userId);
      sendSuccess(res, null, 'Attendance rule deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // ==================== Notification Templates ====================

  async getNotificationTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, channel, language } = req.query;
      const templates = await systemSettingsService.getNotificationTemplates({
        category: category as string,
        channel: channel as string,
        language: language as string,
      });
      sendSuccess(res, templates, 'Notification templates retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getNotificationTemplateById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const template = await systemSettingsService.getNotificationTemplateById(id);
      sendSuccess(res, template, 'Notification template retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getNotificationTemplateByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.params;
      const template = await systemSettingsService.getNotificationTemplateByCode(code);
      sendSuccess(res, template, 'Notification template retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createNotificationTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const template = await systemSettingsService.createNotificationTemplate(req.body, userId);
      sendSuccess(res, template, 'Notification template created successfully', HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async updateNotificationTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const template = await systemSettingsService.updateNotificationTemplate(id, req.body, userId);
      sendSuccess(res, template, 'Notification template updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteNotificationTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      await systemSettingsService.deleteNotificationTemplate(id, userId);
      sendSuccess(res, null, 'Notification template deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // ==================== Date Format Settings ====================

  async getDateFormatSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await systemSettingsService.getDateFormatSettings();
      sendSuccess(res, settings, 'Date format settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateDateFormatSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const settings = await systemSettingsService.updateDateFormatSettings(req.body, userId);
      sendSuccess(res, settings, 'Date format settings updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new SystemSettingsController();
