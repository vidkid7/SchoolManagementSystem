import GradingScheme from '@models/GradingScheme.model';
import AttendanceRule from '@models/AttendanceRule.model';
import NotificationTemplate from '@models/NotificationTemplate.model';
import SchoolConfig from '@models/SchoolConfig.model';
import { NotFoundError, ValidationError } from '@middleware/errorHandler';
import auditLogger from '@utils/auditLogger';
import { AuditAction } from '@models/AuditLog.model';
import { Transaction } from 'sequelize';

interface GradingSchemeData {
  name: string;
  description?: string;
  isDefault?: boolean;
  grades: Array<{
    grade: string;
    gradePoint: number;
    minPercentage: number;
    maxPercentage: number;
    description: string;
  }>;
}

interface AttendanceRuleData {
  name: string;
  description?: string;
  minimumAttendancePercentage?: number;
  lowAttendanceThreshold?: number;
  criticalAttendanceThreshold?: number;
  correctionWindowHours?: number;
  allowTeacherCorrection?: boolean;
  allowAdminCorrection?: boolean;
  maxLeaveDaysPerMonth?: number;
  maxLeaveDaysPerYear?: number;
  requireLeaveApproval?: boolean;
  enableLowAttendanceAlerts?: boolean;
  alertParents?: boolean;
  alertAdmins?: boolean;
}

interface NotificationTemplateData {
  name: string;
  code: string;
  description?: string;
  category: 'attendance' | 'exam' | 'fee' | 'grade' | 'announcement' | 'leave' | 'library' | 'general';
  channel: 'sms' | 'email' | 'push' | 'in_app';
  language: 'nepali' | 'english';
  subject?: string;
  templateEn: string;
  templateNp?: string;
  variables?: string[];
}

interface DateFormatSettings {
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  currency: string;
}

class SystemSettingsService {
  // ==================== Grading Schemes ====================

  async getGradingSchemes(): Promise<GradingScheme[]> {
    return await GradingScheme.findAll({
      where: { isActive: true },
      order: [['isDefault', 'DESC'], ['name', 'ASC']],
    });
  }

  async getGradingSchemeById(id: string): Promise<GradingScheme> {
    const scheme = await GradingScheme.findByPk(id);
    if (!scheme) {
      throw new NotFoundError('Grading scheme not found');
    }
    return scheme;
  }

  async getDefaultGradingScheme(): Promise<GradingScheme | null> {
    return await GradingScheme.findOne({
      where: { isDefault: true, isActive: true },
    });
  }

  async createGradingScheme(
    data: GradingSchemeData,
    userId: number,
    transaction?: Transaction
  ): Promise<GradingScheme> {
    // Validate grades
    this.validateGrades(data.grades);

    // If this is set as default, unset other defaults
    if (data.isDefault) {
      await GradingScheme.update(
        { isDefault: false },
        { where: { isDefault: true }, transaction }
      );
    }

    const scheme = await GradingScheme.create(
      {
        ...data,
        isActive: true,
      },
      { transaction }
    );

    await auditLogger.log({
      userId,
      entityType: 'grading_scheme',
      entityId: scheme.id as any,
      action: AuditAction.CREATE,
      newValue: data,
    });

    return scheme;
  }

  async updateGradingScheme(
    id: string,
    data: Partial<GradingSchemeData>,
    userId: number,
    transaction?: Transaction
  ): Promise<GradingScheme> {
    const scheme = await this.getGradingSchemeById(id);
    const oldData = scheme.toJSON();

    // Validate grades if provided
    if (data.grades) {
      this.validateGrades(data.grades);
    }

    // If this is set as default, unset other defaults
    if (data.isDefault) {
      await GradingScheme.update(
        { isDefault: false },
        { where: { isDefault: true }, transaction }
      );
    }

    await scheme.update(data, { transaction });

    await auditLogger.log({
      userId,
      entityType: 'grading_scheme',
      entityId: scheme.id as any,
      action: AuditAction.UPDATE,
      oldValue: oldData,
      newValue: data,
    });

    return scheme;
  }

  async deleteGradingScheme(
    id: string,
    userId: number,
    transaction?: Transaction
  ): Promise<void> {
    const scheme = await this.getGradingSchemeById(id);

    if (scheme.isDefault) {
      throw new ValidationError('Cannot delete the default grading scheme');
    }

    await scheme.update({ isActive: false }, { transaction });

    await auditLogger.log({
      userId,
      entityType: 'grading_scheme',
      entityId: scheme.id as any,
      action: AuditAction.DELETE,
      oldValue: scheme.toJSON(),
    });
  }

  private validateGrades(grades: Array<{ minPercentage: number; maxPercentage: number }>): void {
    // Check for overlapping ranges
    for (let i = 0; i < grades.length; i++) {
      for (let j = i + 1; j < grades.length; j++) {
        const grade1 = grades[i];
        const grade2 = grades[j];
        
        if (
          (grade1.minPercentage <= grade2.maxPercentage && grade1.maxPercentage >= grade2.minPercentage) ||
          (grade2.minPercentage <= grade1.maxPercentage && grade2.maxPercentage >= grade1.minPercentage)
        ) {
          throw new ValidationError('Grade ranges cannot overlap');
        }
      }
    }

    // Check for valid ranges
    for (const grade of grades) {
      if (grade.minPercentage < 0 || grade.maxPercentage > 100) {
        throw new ValidationError('Grade percentages must be between 0 and 100');
      }
      if (grade.minPercentage > grade.maxPercentage) {
        throw new ValidationError('Minimum percentage cannot be greater than maximum percentage');
      }
    }
  }

  // ==================== Attendance Rules ====================

  async getAttendanceRules(): Promise<AttendanceRule[]> {
    return await AttendanceRule.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']],
    });
  }

  async getAttendanceRuleById(id: string): Promise<AttendanceRule> {
    const rule = await AttendanceRule.findByPk(id);
    if (!rule) {
      throw new NotFoundError('Attendance rule not found');
    }
    return rule;
  }

  async getActiveAttendanceRule(): Promise<AttendanceRule | null> {
    return await AttendanceRule.findOne({
      where: { isActive: true },
      order: [['createdAt', 'DESC']],
    });
  }

  async createAttendanceRule(
    data: AttendanceRuleData,
    userId: number,
    transaction?: Transaction
  ): Promise<AttendanceRule> {
    const rule = await AttendanceRule.create(
      {
        ...data,
        isActive: true,
      },
      { transaction }
    );

    await auditLogger.log({
      userId,
      entityType: 'attendance_rule',
      entityId: rule.id as any,
      action: AuditAction.CREATE,
      newValue: data,
    });

    return rule;
  }

  async updateAttendanceRule(
    id: string,
    data: Partial<AttendanceRuleData>,
    userId: number,
    transaction?: Transaction
  ): Promise<AttendanceRule> {
    const rule = await this.getAttendanceRuleById(id);
    const oldData = rule.toJSON();

    await rule.update(data, { transaction });

    await auditLogger.log({
      userId,
      entityType: 'attendance_rule',
      entityId: rule.id as any,
      action: AuditAction.UPDATE,
      oldValue: oldData,
      newValue: data,
    });

    return rule;
  }

  async deleteAttendanceRule(
    id: string,
    userId: number,
    transaction?: Transaction
  ): Promise<void> {
    const rule = await this.getAttendanceRuleById(id);

    await rule.update({ isActive: false }, { transaction });

    await auditLogger.log({
      userId,
      entityType: 'attendance_rule',
      entityId: rule.id as any,
      action: AuditAction.DELETE,
      oldValue: rule.toJSON(),
    });
  }

  // ==================== Notification Templates ====================

  async getNotificationTemplates(filters?: {
    category?: string;
    channel?: string;
    language?: string;
  }): Promise<NotificationTemplate[]> {
    const where: any = { isActive: true };

    if (filters?.category) {
      where.category = filters.category;
    }
    if (filters?.channel) {
      where.channel = filters.channel;
    }
    if (filters?.language) {
      where.language = filters.language;
    }

    return await NotificationTemplate.findAll({
      where,
      order: [['category', 'ASC'], ['name', 'ASC']],
    });
  }

  async getNotificationTemplateById(id: string): Promise<NotificationTemplate> {
    const template = await NotificationTemplate.findByPk(id);
    if (!template) {
      throw new NotFoundError('Notification template not found');
    }
    return template;
  }

  async getNotificationTemplateByCode(code: string): Promise<NotificationTemplate | null> {
    return await NotificationTemplate.findOne({
      where: { code, isActive: true },
    });
  }

  async createNotificationTemplate(
    data: NotificationTemplateData,
    userId: number,
    transaction?: Transaction
  ): Promise<NotificationTemplate> {
    // Check if code already exists
    const existing = await NotificationTemplate.findOne({
      where: { code: data.code },
    });

    if (existing) {
      throw new ValidationError('A template with this code already exists');
    }

    const template = await NotificationTemplate.create(
      {
        ...data,
        variables: data.variables || [],
        isActive: true,
      },
      { transaction }
    );

    await auditLogger.log({
      userId,
      entityType: 'notification_template',
      entityId: template.id as any,
      action: AuditAction.CREATE,
      newValue: data,
    });

    return template;
  }

  async updateNotificationTemplate(
    id: string,
    data: Partial<NotificationTemplateData>,
    userId: number,
    transaction?: Transaction
  ): Promise<NotificationTemplate> {
    const template = await this.getNotificationTemplateById(id);
    const oldData = template.toJSON();

    // Check if code is being changed and if it already exists
    if (data.code && data.code !== template.code) {
      const existing = await NotificationTemplate.findOne({
        where: { code: data.code },
      });

      if (existing) {
        throw new ValidationError('A template with this code already exists');
      }
    }

    await template.update(data, { transaction });

    await auditLogger.log({
      userId,
      entityType: 'notification_template',
      entityId: template.id as any,
      action: AuditAction.UPDATE,
      oldValue: oldData,
      newValue: data,
    });

    return template;
  }

  async deleteNotificationTemplate(
    id: string,
    userId: number,
    transaction?: Transaction
  ): Promise<void> {
    const template = await this.getNotificationTemplateById(id);

    await template.update({ isActive: false }, { transaction });

    await auditLogger.log({
      userId,
      entityType: 'notification_template',
      entityId: template.id as any,
      action: AuditAction.DELETE,
      oldValue: template.toJSON(),
    });
  }

  // ==================== Date Format Settings ====================

  async getDateFormatSettings(): Promise<DateFormatSettings | null> {
    const config = await SchoolConfig.findOne({
      where: { isActive: true },
    });

    if (!config) {
      return null;
    }

    return {
      dateFormat: config.dateFormat,
      timeFormat: config.timeFormat,
      numberFormat: config.numberFormat,
      currency: config.currency,
    };
  }

  async updateDateFormatSettings(
    data: Partial<DateFormatSettings>,
    userId: number,
    transaction?: Transaction
  ): Promise<DateFormatSettings> {
    const config = await SchoolConfig.findOne({
      where: { isActive: true },
    });

    if (!config) {
      throw new NotFoundError('School configuration not found');
    }

    const oldData = {
      dateFormat: config.dateFormat,
      timeFormat: config.timeFormat,
      numberFormat: config.numberFormat,
      currency: config.currency,
    };

    await config.update(data, { transaction });

    await auditLogger.log({
      userId,
      entityType: 'school_config',
      entityId: config.id as any,
      action: AuditAction.UPDATE,
      oldValue: oldData,
      newValue: data,
    });

    return {
      dateFormat: config.dateFormat,
      timeFormat: config.timeFormat,
      numberFormat: config.numberFormat,
      currency: config.currency,
    };
  }
}

export default new SystemSettingsService();
