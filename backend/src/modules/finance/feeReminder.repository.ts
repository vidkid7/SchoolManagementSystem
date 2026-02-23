import { Transaction, Op } from 'sequelize';
import FeeReminder, { 
  FeeReminderCreationAttributes, 
  ReminderType, 
  ReminderStatus,
  ReminderConfig,
  ReminderConfigCreationAttributes
} from '@models/FeeReminder.model';

/**
 * Fee Reminder Repository
 * Handles database operations for fee reminders
 * Requirements: 9.13
 */

class FeeReminderRepository {
  /**
   * Create a new fee reminder
   */
  async create(
    data: FeeReminderCreationAttributes,
    transaction?: Transaction
  ): Promise<FeeReminder> {
    return FeeReminder.create(data, { transaction });
  }

  /**
   * Find reminder by ID
   */
  async findById(reminderId: number): Promise<FeeReminder | null> {
    return FeeReminder.findByPk(reminderId);
  }

  /**
   * Find reminders by invoice ID
   */
  async findByInvoiceId(invoiceId: number): Promise<FeeReminder[]> {
    return FeeReminder.findAll({
      where: { invoiceId },
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Find reminders by student ID
   */
  async findByStudentId(studentId: number): Promise<FeeReminder[]> {
    return FeeReminder.findAll({
      where: { studentId },
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Find reminders by status
   */
  async findByStatus(status: ReminderStatus): Promise<FeeReminder[]> {
    return FeeReminder.findAll({
      where: { status },
      order: [['createdAt', 'ASC']]
    });
  }

  /**
   * Check if reminder exists for invoice and type
   */
  async exists(invoiceId: number, reminderType: ReminderType): Promise<boolean> {
    const count = await FeeReminder.count({
      where: {
        invoiceId,
        reminderType
      }
    });
    return count > 0;
  }

  /**
   * Get last reminder sent for an invoice
   */
  async getLastReminderForInvoice(invoiceId: number): Promise<FeeReminder | null> {
    return FeeReminder.findOne({
      where: { 
        invoiceId,
        status: {
          [Op.in]: [ReminderStatus.SENT, ReminderStatus.DELIVERED]
        }
      },
      order: [['sentAt', 'DESC']]
    });
  }

  /**
   * Get reminder count for an invoice
   */
  async getReminderCount(invoiceId: number): Promise<number> {
    return FeeReminder.count({
      where: { 
        invoiceId,
        status: {
          [Op.in]: [ReminderStatus.SENT, ReminderStatus.DELIVERED]
        }
      }
    });
  }

  /**
   * Update reminder status
   */
  async updateStatus(
    reminderId: number,
    status: ReminderStatus,
    additionalData?: {
      smsGatewayId?: string;
      sentAt?: Date;
      deliveredAt?: Date;
      failureReason?: string;
    },
    transaction?: Transaction
  ): Promise<FeeReminder | null> {
    const reminder = await FeeReminder.findByPk(reminderId);
    if (!reminder) {
      return null;
    }

    reminder.status = status;
    if (additionalData) {
      if (additionalData.smsGatewayId) reminder.smsGatewayId = additionalData.smsGatewayId;
      if (additionalData.sentAt) reminder.sentAt = additionalData.sentAt;
      if (additionalData.deliveredAt) reminder.deliveredAt = additionalData.deliveredAt;
      if (additionalData.failureReason) reminder.failureReason = additionalData.failureReason;
    }

    await reminder.save({ transaction });
    return reminder;
  }

  /**
   * Mark reminder as sent
   */
  async markAsSent(
    reminderId: number,
    smsGatewayId?: string,
    transaction?: Transaction
  ): Promise<FeeReminder | null> {
    return this.updateStatus(
      reminderId,
      ReminderStatus.SENT,
      {
        smsGatewayId,
        sentAt: new Date()
      },
      transaction
    );
  }

  /**
   * Mark reminder as delivered
   */
  async markAsDelivered(
    reminderId: number,
    transaction?: Transaction
  ): Promise<FeeReminder | null> {
    return this.updateStatus(
      reminderId,
      ReminderStatus.DELIVERED,
      {
        deliveredAt: new Date()
      },
      transaction
    );
  }

  /**
   * Mark reminder as failed
   */
  async markAsFailed(
    reminderId: number,
    failureReason: string,
    transaction?: Transaction
  ): Promise<FeeReminder | null> {
    return this.updateStatus(
      reminderId,
      ReminderStatus.FAILED,
      {
        failureReason
      },
      transaction
    );
  }

  /**
   * Get pending reminders
   */
  async getPendingReminders(limit?: number): Promise<FeeReminder[]> {
    return FeeReminder.findAll({
      where: {
        status: ReminderStatus.PENDING
      },
      order: [['createdAt', 'ASC']],
      limit: limit || 100
    });
  }

  /**
   * Get reminders sent in date range
   */
  async getRemindersBySentDate(
    startDate: Date,
    endDate: Date
  ): Promise<FeeReminder[]> {
    return FeeReminder.findAll({
      where: {
        sentAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['sentAt', 'DESC']]
    });
  }

  /**
   * Get reminder statistics
   */
  async getReminderStats(startDate?: Date, endDate?: Date): Promise<any> {
    const whereClause: any = {};
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [startDate, endDate]
      };
    }

    const stats = await FeeReminder.findAll({
      attributes: [
        'status',
        [FeeReminder.sequelize!.fn('COUNT', FeeReminder.sequelize!.col('fee_reminder_id')), 'count']
      ],
      where: whereClause,
      group: ['status'],
      raw: true
    });

    return stats;
  }

  /**
   * Delete reminder
   */
  async delete(reminderId: number, transaction?: Transaction): Promise<boolean> {
    const deleted = await FeeReminder.destroy({
      where: { feeReminderId: reminderId },
      transaction
    });
    return deleted > 0;
  }

  // ==================== Reminder Config Methods ====================

  /**
   * Create reminder configuration
   */
  async createConfig(
    data: ReminderConfigCreationAttributes,
    transaction?: Transaction
  ): Promise<ReminderConfig> {
    return ReminderConfig.create(data, { transaction });
  }

  /**
   * Find config by ID
   */
  async findConfigById(configId: number): Promise<ReminderConfig | null> {
    return ReminderConfig.findByPk(configId);
  }

  /**
   * Find config by name
   */
  async findConfigByName(name: string): Promise<ReminderConfig | null> {
    return ReminderConfig.findOne({
      where: { name }
    });
  }

  /**
   * Get default config
   */
  async getDefaultConfig(): Promise<ReminderConfig | null> {
    return ReminderConfig.findOne({
      where: {
        isDefault: true,
        isActive: true
      }
    });
  }

  /**
   * Get all active configs
   */
  async getActiveConfigs(): Promise<ReminderConfig[]> {
    return ReminderConfig.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Update config
   */
  async updateConfig(
    configId: number,
    data: Partial<ReminderConfigCreationAttributes>,
    transaction?: Transaction
  ): Promise<ReminderConfig | null> {
    const config = await ReminderConfig.findByPk(configId);
    if (!config) {
      return null;
    }

    await config.update(data, { transaction });
    return config;
  }

  /**
   * Set config as default
   * Unsets all other configs as default
   */
  async setDefaultConfig(
    configId: number,
    transaction?: Transaction
  ): Promise<ReminderConfig | null> {
    const t = transaction || await ReminderConfig.sequelize!.transaction();

    try {
      // Unset all other defaults
      await ReminderConfig.update(
        { isDefault: false },
        {
          where: {
            reminderConfigId: { [Op.ne]: configId }
          },
          transaction: t
        }
      );

      // Set this config as default
      const config = await ReminderConfig.findByPk(configId);
      if (!config) {
        throw new Error('Config not found');
      }

      config.isDefault = true;
      config.isActive = true;
      await config.save({ transaction: t });

      if (!transaction) {
        await t.commit();
      }

      return config;
    } catch (error) {
      if (!transaction) {
        await t.rollback();
      }
      throw error;
    }
  }

  /**
   * Delete config
   */
  async deleteConfig(configId: number, transaction?: Transaction): Promise<boolean> {
    const config = await ReminderConfig.findByPk(configId);
    if (!config) {
      return false;
    }

    if (config.isDefault) {
      throw new Error('Cannot delete default configuration');
    }

    const deleted = await ReminderConfig.destroy({
      where: { reminderConfigId: configId },
      transaction
    });
    return deleted > 0;
  }
}

export default new FeeReminderRepository();
