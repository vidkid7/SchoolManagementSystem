import feeReminderRepository from './feeReminder.repository';
import invoiceRepository from './invoice.repository';
import FeeReminder, { ReminderType, ReminderStatus, ReminderConfig } from '@models/FeeReminder.model';
import { Invoice, InvoiceStatus } from '@models/Invoice.model';
import { Transaction } from 'sequelize';

/**
 * Fee Reminder Service
 * Handles fee reminder generation, scheduling, and tracking
 * 
 * Requirements: 9.13
 * - Send SMS reminders for overdue fees
 * - Configurable reminder intervals
 * - Track reminder history
 */

export interface ReminderMessageVariables {
  studentName: string;
  amount: number;
  dueDate: string;
  invoiceNumber: string;
  daysOverdue: number;
}

export interface CreateReminderData {
  invoiceId: number;
  studentId: number;
  reminderType: ReminderType;
  daysOverdue: number;
  phoneNumber: string;
  message: string;
}

export interface ProcessRemindersResult {
  processed: number;
  created: number;
  skipped: number;
  errors: Array<{ invoiceId: number; error: string }>;
}

class FeeReminderService {
  /**
   * Get default reminder configuration
   */
  async getDefaultConfig(): Promise<ReminderConfig> {
    const config = await feeReminderRepository.getDefaultConfig();
    if (!config) {
      throw new Error('No default reminder configuration found');
    }
    return config;
  }

  /**
   * Get reminder configuration by name
   */
  async getConfigByName(name: string): Promise<ReminderConfig | null> {
    return feeReminderRepository.findConfigByName(name);
  }

  /**
   * Calculate days overdue for an invoice
   */
  calculateDaysOverdue(dueDate: string): number {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Determine which reminder type should be sent based on days overdue
   */
  determineReminderType(daysOverdue: number, config: ReminderConfig): ReminderType | null {
    if (daysOverdue >= config.finalReminderDays) {
      return ReminderType.FINAL;
    } else if (daysOverdue >= config.thirdReminderDays) {
      return ReminderType.THIRD;
    } else if (daysOverdue >= config.secondReminderDays) {
      return ReminderType.SECOND;
    } else if (daysOverdue >= config.firstReminderDays) {
      return ReminderType.FIRST;
    }
    return null;
  }

  /**
   * Format message template with variables
   */
  formatMessage(template: string, variables: ReminderMessageVariables): string {
    let message = template;
    message = message.replace(/{studentName}/g, variables.studentName);
    message = message.replace(/{amount}/g, variables.amount.toString());
    message = message.replace(/{dueDate}/g, variables.dueDate);
    message = message.replace(/{invoiceNumber}/g, variables.invoiceNumber);
    message = message.replace(/{daysOverdue}/g, variables.daysOverdue.toString());
    return message;
  }

  /**
   * Generate reminder message for an invoice
   */
  async generateReminderMessage(
    invoice: Invoice,
    reminderType: ReminderType,
    studentName: string,
    config: ReminderConfig
  ): Promise<string> {
    const daysOverdue = this.calculateDaysOverdue(invoice.dueDate);
    
    const variables: ReminderMessageVariables = {
      studentName,
      amount: Number(invoice.balance),
      dueDate: invoice.dueDate,
      invoiceNumber: invoice.invoiceNumber,
      daysOverdue
    };

    // Get template for reminder type
    const template = config.getMessageTemplate(reminderType);
    
    if (template) {
      return this.formatMessage(template, variables);
    }

    // Fallback default messages if template not found
    const defaultMessages: Record<ReminderType, string> = {
      [ReminderType.FIRST]: `Dear Parent, Fee payment of NPR ${variables.amount} for ${variables.studentName} is overdue by ${variables.daysOverdue} days. Invoice: ${variables.invoiceNumber}. Please pay at the earliest. - School`,
      [ReminderType.SECOND]: `Reminder: Fee payment of NPR ${variables.amount} for ${variables.studentName} is still pending (overdue by ${variables.daysOverdue} days). Invoice: ${variables.invoiceNumber}. Please clear dues immediately. - School`,
      [ReminderType.THIRD]: `URGENT: Fee payment of NPR ${variables.amount} for ${variables.studentName} is overdue by ${variables.daysOverdue} days. Invoice: ${variables.invoiceNumber}. Please contact school office. - School`,
      [ReminderType.FINAL]: `FINAL NOTICE: Fee payment of NPR ${variables.amount} for ${variables.studentName} is overdue by ${variables.daysOverdue} days. Invoice: ${variables.invoiceNumber}. Immediate action required. - School`
    };

    return defaultMessages[reminderType];
  }

  /**
   * Check if reminder should be sent for an invoice
   */
  async shouldSendReminder(
    invoice: Invoice,
    reminderType: ReminderType
  ): Promise<boolean> {
    // Check if invoice is overdue
    if (!invoice.isOverdue()) {
      return false;
    }

    // Check if this reminder type has already been sent
    const exists = await feeReminderRepository.exists(invoice.invoiceId, reminderType);
    if (exists) {
      return false;
    }

    // Check if invoice is paid or cancelled
    if (invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.CANCELLED) {
      return false;
    }

    return true;
  }

  /**
   * Create a fee reminder
   */
  async createReminder(
    data: CreateReminderData,
    transaction?: Transaction
  ): Promise<FeeReminder> {
    // Check if reminder already exists
    const exists = await feeReminderRepository.exists(data.invoiceId, data.reminderType);
    if (exists) {
      throw new Error(`Reminder of type ${data.reminderType} already exists for this invoice`);
    }

    return feeReminderRepository.create(data, transaction);
  }

  /**
   * Process overdue invoices and create reminders
   * This should be run daily via cron job
   */
  async processOverdueInvoices(
    configName?: string
  ): Promise<ProcessRemindersResult> {
    const result: ProcessRemindersResult = {
      processed: 0,
      created: 0,
      skipped: 0,
      errors: []
    };

    try {
      // Get reminder configuration
      const config = configName 
        ? await this.getConfigByName(configName)
        : await this.getDefaultConfig();

      if (!config) {
        throw new Error(`Reminder configuration ${configName || 'default'} not found`);
      }

      // Get all overdue invoices
      const overdueInvoices = await invoiceRepository.findOverdue();

      for (const invoice of overdueInvoices) {
        result.processed++;

        try {
          // Calculate days overdue
          const daysOverdue = this.calculateDaysOverdue(invoice.dueDate);

          // Determine which reminder type to send
          const reminderType = this.determineReminderType(daysOverdue, config);
          
          if (!reminderType) {
            result.skipped++;
            continue;
          }

          // Check if reminder should be sent
          const shouldSend = await this.shouldSendReminder(invoice, reminderType);
          if (!shouldSend) {
            result.skipped++;
            continue;
          }

          // For now, we'll create the reminder with a placeholder phone number
          // In production, this would fetch the parent's phone number from student record
          const phoneNumber = '9800000000'; // Placeholder
          const studentName = 'Student'; // Placeholder

          // Generate reminder message
          const message = await this.generateReminderMessage(
            invoice,
            reminderType,
            studentName,
            config
          );

          // Create reminder
          await this.createReminder({
            invoiceId: invoice.invoiceId,
            studentId: invoice.studentId,
            reminderType,
            daysOverdue,
            phoneNumber,
            message
          });

          result.created++;
        } catch (error) {
          result.errors.push({
            invoiceId: invoice.invoiceId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send pending reminders
   * This integrates with SMS gateway (to be implemented in task 18.1)
   */
  async sendPendingReminders(limit?: number): Promise<{
    sent: number;
    failed: number;
    errors: Array<{ reminderId: number; error: string }>;
  }> {
    const result = {
      sent: 0,
      failed: 0,
      errors: [] as Array<{ reminderId: number; error: string }>
    };

    // Get pending reminders
    const pendingReminders = await feeReminderRepository.getPendingReminders(limit);

    for (const reminder of pendingReminders) {
      try {
        // TODO: Integrate with SMS gateway (task 18.1)
        // For now, just mark as sent
        // In production, this would call SMS gateway API
        
        // Simulate SMS sending
        const smsGatewayId = `SMS-${Date.now()}-${reminder.feeReminderId}`;
        
        await feeReminderRepository.markAsSent(reminder.feeReminderId, smsGatewayId);
        result.sent++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          reminderId: reminder.feeReminderId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        // Mark reminder as failed
        await feeReminderRepository.markAsFailed(
          reminder.feeReminderId,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }

    return result;
  }

  /**
   * Get reminder history for an invoice
   */
  async getReminderHistory(invoiceId: number): Promise<FeeReminder[]> {
    return feeReminderRepository.findByInvoiceId(invoiceId);
  }

  /**
   * Get reminder history for a student
   */
  async getStudentReminderHistory(studentId: number): Promise<FeeReminder[]> {
    return feeReminderRepository.findByStudentId(studentId);
  }

  /**
   * Get reminder by ID
   */
  async getReminderById(reminderId: number): Promise<FeeReminder | null> {
    return feeReminderRepository.findById(reminderId);
  }

  /**
   * Get reminder statistics
   */
  async getReminderStats(startDate?: Date, endDate?: Date): Promise<any> {
    return feeReminderRepository.getReminderStats(startDate, endDate);
  }

  /**
   * Mark reminder as delivered
   * Called by SMS gateway webhook
   */
  async markReminderAsDelivered(
    reminderId: number
  ): Promise<FeeReminder | null> {
    return feeReminderRepository.markAsDelivered(reminderId);
  }

  /**
   * Mark reminder as failed
   */
  async markReminderAsFailed(
    reminderId: number,
    reason: string
  ): Promise<FeeReminder | null> {
    return feeReminderRepository.markAsFailed(reminderId, reason);
  }

  /**
   * Retry failed reminder
   */
  async retryFailedReminder(reminderId: number): Promise<FeeReminder | null> {
    const reminder = await feeReminderRepository.findById(reminderId);
    if (!reminder) {
      throw new Error('Reminder not found');
    }

    if (!reminder.isFailed()) {
      throw new Error('Only failed reminders can be retried');
    }

    // Reset status to pending
    return feeReminderRepository.updateStatus(reminderId, ReminderStatus.PENDING, {
      failureReason: undefined
    });
  }

  // ==================== Config Management Methods ====================

  /**
   * Create reminder configuration
   */
  async createConfig(data: {
    name: string;
    description?: string;
    firstReminderDays: number;
    secondReminderDays: number;
    thirdReminderDays: number;
    finalReminderDays: number;
    messageTemplateFirst?: string;
    messageTemplateSecond?: string;
    messageTemplateThird?: string;
    messageTemplateFinal?: string;
  }): Promise<ReminderConfig> {
    // Validate reminder days are in ascending order
    if (
      data.firstReminderDays >= data.secondReminderDays ||
      data.secondReminderDays >= data.thirdReminderDays ||
      data.thirdReminderDays >= data.finalReminderDays
    ) {
      throw new Error('Reminder days must be in ascending order');
    }

    return feeReminderRepository.createConfig(data);
  }

  /**
   * Update reminder configuration
   */
  async updateConfig(
    configId: number,
    data: Partial<{
      description: string;
      firstReminderDays: number;
      secondReminderDays: number;
      thirdReminderDays: number;
      finalReminderDays: number;
      isActive: boolean;
      messageTemplateFirst: string;
      messageTemplateSecond: string;
      messageTemplateThird: string;
      messageTemplateFinal: string;
    }>
  ): Promise<ReminderConfig | null> {
    const config = await feeReminderRepository.findConfigById(configId);
    if (!config) {
      throw new Error('Configuration not found');
    }

    // If updating reminder days, validate they're in ascending order
    if (
      data.firstReminderDays !== undefined ||
      data.secondReminderDays !== undefined ||
      data.thirdReminderDays !== undefined ||
      data.finalReminderDays !== undefined
    ) {
      const first = data.firstReminderDays ?? config.firstReminderDays;
      const second = data.secondReminderDays ?? config.secondReminderDays;
      const third = data.thirdReminderDays ?? config.thirdReminderDays;
      const final = data.finalReminderDays ?? config.finalReminderDays;

      if (first >= second || second >= third || third >= final) {
        throw new Error('Reminder days must be in ascending order');
      }
    }

    return feeReminderRepository.updateConfig(configId, data);
  }

  /**
   * Set configuration as default
   */
  async setDefaultConfig(configId: number): Promise<ReminderConfig | null> {
    return feeReminderRepository.setDefaultConfig(configId);
  }

  /**
   * Get all active configurations
   */
  async getActiveConfigs(): Promise<ReminderConfig[]> {
    return feeReminderRepository.getActiveConfigs();
  }

  /**
   * Get configuration by ID
   */
  async getConfigById(configId: number): Promise<ReminderConfig | null> {
    return feeReminderRepository.findConfigById(configId);
  }

  /**
   * Delete configuration
   */
  async deleteConfig(configId: number): Promise<boolean> {
    return feeReminderRepository.deleteConfig(configId);
  }
}

export default new FeeReminderService();
