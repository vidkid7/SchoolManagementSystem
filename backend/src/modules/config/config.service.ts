import SchoolConfig from '@models/SchoolConfig.model';
import { SchoolConfigData, SchoolConfigResponse } from './config.types';
import { NotFoundError, ValidationError } from '@middleware/errorHandler';
import auditLogger from '@utils/auditLogger';
import { AuditAction } from '@models/AuditLog.model';
import { Transaction } from 'sequelize';

class ConfigService {
  /**
   * Get the active school configuration
   */
  async getActiveConfig(): Promise<SchoolConfigResponse | null> {
    const config = await SchoolConfig.findOne({
      where: { isActive: true },
    });

    return config ? this.formatConfigResponse(config) : null;
  }

  /**
   * Get school configuration by ID
   */
  async getConfigById(id: string): Promise<SchoolConfigResponse> {
    const config = await SchoolConfig.findByPk(id);

    if (!config) {
      throw new NotFoundError('School configuration not found');
    }

    return this.formatConfigResponse(config);
  }

  /**
   * Create school configuration
   * Only one configuration can be active at a time
   */
  async createConfig(
    data: SchoolConfigData,
    userId: number,
    transaction?: Transaction
  ): Promise<SchoolConfigResponse> {
    // Check if an active config already exists
    const existingConfig = await SchoolConfig.findOne({
      where: { isActive: true },
    });

    if (existingConfig) {
      throw new ValidationError(
        'An active school configuration already exists. Please update the existing configuration or deactivate it first.'
      );
    }

    const config = await SchoolConfig.create(
      {
        ...data,
        isActive: true,
      },
      { transaction }
    );

    await auditLogger.log({
      userId,
      entityType: 'school_config',
      entityId: config.id as any,
      action: AuditAction.CREATE,
      newValue: data,
    });

    return this.formatConfigResponse(config);
  }

  /**
   * Update school configuration
   */
  async updateConfig(
    id: string,
    data: Partial<SchoolConfigData>,
    userId: number,
    transaction?: Transaction
  ): Promise<SchoolConfigResponse> {
    const config = await SchoolConfig.findByPk(id);

    if (!config) {
      throw new NotFoundError('School configuration not found');
    }

    const oldData = config.toJSON();

    await config.update(data, { transaction });

    await auditLogger.log({
      userId,
      entityType: 'school_config',
      entityId: config.id as any,
      action: AuditAction.UPDATE,
      oldValue: oldData,
      newValue: data,
    });

    return this.formatConfigResponse(config);
  }

  /**
   * Upload school logo
   */
  async uploadLogo(
    configId: string,
    logoUrl: string,
    userId: number
  ): Promise<SchoolConfigResponse> {
    const config = await SchoolConfig.findByPk(configId);

    if (!config) {
      throw new NotFoundError('School configuration not found');
    }

    const oldLogoUrl = config.logoUrl;

    await config.update({ logoUrl });

    await auditLogger.log({
      userId,
      entityType: 'school_config',
      entityId: config.id as any,
      action: AuditAction.UPDATE,
      oldValue: { logoUrl: oldLogoUrl },
      newValue: { logoUrl },
    });

    return this.formatConfigResponse(config);
  }

  /**
   * Deactivate school configuration
   */
  async deactivateConfig(
    id: string,
    userId: number,
    transaction?: Transaction
  ): Promise<void> {
    const config = await SchoolConfig.findByPk(id);

    if (!config) {
      throw new NotFoundError('School configuration not found');
    }

    await config.update({ isActive: false }, { transaction });

    await auditLogger.log({
      userId,
      entityType: 'school_config',
      entityId: config.id as any,
      action: AuditAction.UPDATE,
      oldValue: { isActive: true },
      newValue: { isActive: false },
    });
  }

  /**
   * Format config response
   */
  private formatConfigResponse(config: SchoolConfig): SchoolConfigResponse {
    return {
      id: config.id,
      schoolNameEn: config.schoolNameEn,
      schoolNameNp: config.schoolNameNp,
      schoolCode: config.schoolCode,
      logoUrl: config.logoUrl,
      addressEn: config.addressEn,
      addressNp: config.addressNp,
      phone: config.phone,
      email: config.email,
      website: config.website,
      academicYearStartMonth: config.academicYearStartMonth,
      academicYearDurationMonths: config.academicYearDurationMonths,
      termsPerYear: config.termsPerYear,
      defaultCalendarSystem: config.defaultCalendarSystem,
      defaultLanguage: config.defaultLanguage,
      timezone: config.timezone,
      currency: config.currency,
      dateFormat: config.dateFormat,
      timeFormat: config.timeFormat,
      numberFormat: config.numberFormat,
      isActive: config.isActive,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }
}

export default new ConfigService();
