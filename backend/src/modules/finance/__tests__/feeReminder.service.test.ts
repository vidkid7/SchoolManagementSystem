import feeReminderService from '../feeReminder.service';
import feeReminderRepository from '../feeReminder.repository';
import { ReminderType, ReminderStatus, ReminderConfig } from '@models/FeeReminder.model';
import { Invoice } from '@models/Invoice.model';
import sequelize from '@config/database';

/**
 * Fee Reminder Service Tests
 * Requirements: 9.13
 */

describe('FeeReminderService', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clear all tables
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await sequelize.query('TRUNCATE TABLE fee_reminders');
    await sequelize.query('TRUNCATE TABLE reminder_config');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    // Create default config
    await feeReminderRepository.createConfig({
      name: 'default',
      description: 'Default configuration',
      firstReminderDays: 3,
      secondReminderDays: 7,
      thirdReminderDays: 14,
      finalReminderDays: 30,
      isDefault: true,
      isActive: true,
      messageTemplateFirst: 'First reminder: {studentName} owes NPR {amount}',
      messageTemplateSecond: 'Second reminder: {studentName} owes NPR {amount}',
      messageTemplateThird: 'Third reminder: {studentName} owes NPR {amount}',
      messageTemplateFinal: 'Final reminder: {studentName} owes NPR {amount}'
    });
  });

  describe('calculateDaysOverdue', () => {
    it('should calculate days overdue correctly', () => {
      const today = new Date();
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(today.getDate() - 3);
      
      const dueDate = threeDaysAgo.toISOString().split('T')[0];
      const daysOverdue = feeReminderService.calculateDaysOverdue(dueDate);
      
      expect(daysOverdue).toBeGreaterThanOrEqual(3);
      expect(daysOverdue).toBeLessThanOrEqual(4); // Account for timing
    });

    it('should return 0 for future due dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const dueDate = tomorrow.toISOString().split('T')[0];
      const daysOverdue = feeReminderService.calculateDaysOverdue(dueDate);
      
      expect(daysOverdue).toBe(0);
    });
  });

  describe('determineReminderType', () => {
    let config: ReminderConfig;

    beforeEach(async () => {
      config = await feeReminderService.getDefaultConfig();
    });

    it('should return FIRST for 3-6 days overdue', () => {
      const type = feeReminderService.determineReminderType(3, config);
      expect(type).toBe(ReminderType.FIRST);
    });

    it('should return SECOND for 7-13 days overdue', () => {
      const type = feeReminderService.determineReminderType(7, config);
      expect(type).toBe(ReminderType.SECOND);
    });

    it('should return THIRD for 14-29 days overdue', () => {
      const type = feeReminderService.determineReminderType(14, config);
      expect(type).toBe(ReminderType.THIRD);
    });

    it('should return FINAL for 30+ days overdue', () => {
      const type = feeReminderService.determineReminderType(30, config);
      expect(type).toBe(ReminderType.FINAL);
    });

    it('should return null for less than first reminder days', () => {
      const type = feeReminderService.determineReminderType(2, config);
      expect(type).toBeNull();
    });
  });

  describe('formatMessage', () => {
    it('should replace all template variables', () => {
      const template = 'Dear Parent, {studentName} owes NPR {amount}. Due: {dueDate}. Invoice: {invoiceNumber}. Days overdue: {daysOverdue}';
      
      const variables = {
        studentName: 'John Doe',
        amount: 5000,
        dueDate: '2024-01-01',
        invoiceNumber: 'INV-2024-00001',
        daysOverdue: 5
      };

      const message = feeReminderService.formatMessage(template, variables);

      expect(message).toBe('Dear Parent, John Doe owes NPR 5000. Due: 2024-01-01. Invoice: INV-2024-00001. Days overdue: 5');
    });

    it('should handle multiple occurrences of same variable', () => {
      const template = '{studentName} - {studentName}';
      const variables = {
        studentName: 'John Doe',
        amount: 5000,
        dueDate: '2024-01-01',
        invoiceNumber: 'INV-001',
        daysOverdue: 5
      };

      const message = feeReminderService.formatMessage(template, variables);
      expect(message).toBe('John Doe - John Doe');
    });
  });

  describe('generateReminderMessage', () => {
    it('should generate message using template', async () => {
      const config = await feeReminderService.getDefaultConfig();
      
      const invoice = {
        invoiceId: 1,
        invoiceNumber: 'INV-2024-00001',
        dueDate: '2024-01-01',
        balance: 5000
      } as Invoice;

      const message = await feeReminderService.generateReminderMessage(
        invoice,
        ReminderType.FIRST,
        'John Doe',
        config
      );

      expect(message).toContain('John Doe');
      expect(message).toContain('5000');
    });

    it('should use fallback message if template not found', async () => {
      const config = await feeReminderRepository.createConfig({
        name: 'no-templates',
        firstReminderDays: 3,
        secondReminderDays: 7,
        thirdReminderDays: 14,
        finalReminderDays: 30
      });

      const invoice = {
        invoiceId: 1,
        invoiceNumber: 'INV-2024-00001',
        dueDate: '2024-01-01',
        balance: 5000
      } as Invoice;

      const message = await feeReminderService.generateReminderMessage(
        invoice,
        ReminderType.FIRST,
        'John Doe',
        config
      );

      expect(message).toContain('John Doe');
      expect(message).toContain('5000');
      expect(message).toContain('INV-2024-00001');
    });
  });

  describe('createReminder', () => {
    it('should create a new reminder', async () => {
      const reminderData = {
        invoiceId: 1,
        studentId: 1,
        reminderType: ReminderType.FIRST,
        daysOverdue: 3,
        phoneNumber: '9800000000',
        message: 'Test reminder'
      };

      const reminder = await feeReminderService.createReminder(reminderData);

      expect(reminder).toBeDefined();
      expect(reminder.invoiceId).toBe(1);
      expect(reminder.reminderType).toBe(ReminderType.FIRST);
      expect(reminder.status).toBe(ReminderStatus.PENDING);
    });

    it('should throw error if reminder already exists', async () => {
      const reminderData = {
        invoiceId: 1,
        studentId: 1,
        reminderType: ReminderType.FIRST,
        daysOverdue: 3,
        phoneNumber: '9800000000',
        message: 'Test reminder'
      };

      await feeReminderService.createReminder(reminderData);

      await expect(
        feeReminderService.createReminder(reminderData)
      ).rejects.toThrow('already exists');
    });
  });

  describe('getReminderHistory', () => {
    it('should get all reminders for an invoice', async () => {
      await feeReminderService.createReminder({
        invoiceId: 1,
        studentId: 1,
        reminderType: ReminderType.FIRST,
        daysOverdue: 3,
        phoneNumber: '9800000000',
        message: 'First'
      });

      await feeReminderService.createReminder({
        invoiceId: 1,
        studentId: 1,
        reminderType: ReminderType.SECOND,
        daysOverdue: 7,
        phoneNumber: '9800000000',
        message: 'Second'
      });

      const history = await feeReminderService.getReminderHistory(1);

      expect(history).toHaveLength(2);
      expect(history[0].invoiceId).toBe(1);
      expect(history[1].invoiceId).toBe(1);
    });
  });

  describe('getStudentReminderHistory', () => {
    it('should get all reminders for a student', async () => {
      await feeReminderService.createReminder({
        invoiceId: 1,
        studentId: 1,
        reminderType: ReminderType.FIRST,
        daysOverdue: 3,
        phoneNumber: '9800000000',
        message: 'Invoice 1'
      });

      await feeReminderService.createReminder({
        invoiceId: 2,
        studentId: 1,
        reminderType: ReminderType.FIRST,
        daysOverdue: 3,
        phoneNumber: '9800000000',
        message: 'Invoice 2'
      });

      const history = await feeReminderService.getStudentReminderHistory(1);

      expect(history).toHaveLength(2);
      expect(history[0].studentId).toBe(1);
      expect(history[1].studentId).toBe(1);
    });
  });

  describe('markReminderAsDelivered', () => {
    it('should mark reminder as delivered', async () => {
      const reminder = await feeReminderService.createReminder({
        invoiceId: 1,
        studentId: 1,
        reminderType: ReminderType.FIRST,
        daysOverdue: 3,
        phoneNumber: '9800000000',
        message: 'Test'
      });

      const updated = await feeReminderService.markReminderAsDelivered(reminder.feeReminderId);

      expect(updated).toBeDefined();
      expect(updated?.status).toBe(ReminderStatus.DELIVERED);
      expect(updated?.deliveredAt).toBeDefined();
    });
  });

  describe('markReminderAsFailed', () => {
    it('should mark reminder as failed with reason', async () => {
      const reminder = await feeReminderService.createReminder({
        invoiceId: 1,
        studentId: 1,
        reminderType: ReminderType.FIRST,
        daysOverdue: 3,
        phoneNumber: '9800000000',
        message: 'Test'
      });

      const updated = await feeReminderService.markReminderAsFailed(
        reminder.feeReminderId,
        'Network error'
      );

      expect(updated).toBeDefined();
      expect(updated?.status).toBe(ReminderStatus.FAILED);
      expect(updated?.failureReason).toBe('Network error');
    });
  });

  describe('retryFailedReminder', () => {
    it('should reset failed reminder to pending', async () => {
      const reminder = await feeReminderService.createReminder({
        invoiceId: 1,
        studentId: 1,
        reminderType: ReminderType.FIRST,
        daysOverdue: 3,
        phoneNumber: '9800000000',
        message: 'Test'
      });

      await feeReminderService.markReminderAsFailed(reminder.feeReminderId, 'Test error');

      const retried = await feeReminderService.retryFailedReminder(reminder.feeReminderId);

      expect(retried).toBeDefined();
      expect(retried?.status).toBe(ReminderStatus.PENDING);
      expect(retried?.failureReason).toBeUndefined();
    });

    it('should throw error for non-failed reminders', async () => {
      const reminder = await feeReminderService.createReminder({
        invoiceId: 1,
        studentId: 1,
        reminderType: ReminderType.FIRST,
        daysOverdue: 3,
        phoneNumber: '9800000000',
        message: 'Test'
      });

      await expect(
        feeReminderService.retryFailedReminder(reminder.feeReminderId)
      ).rejects.toThrow('Only failed reminders can be retried');
    });
  });

  // ==================== Config Management Tests ====================

  describe('createConfig', () => {
    it('should create a new configuration', async () => {
      const config = await feeReminderService.createConfig({
        name: 'strict',
        description: 'Strict reminder schedule',
        firstReminderDays: 1,
        secondReminderDays: 3,
        thirdReminderDays: 7,
        finalReminderDays: 14
      });

      expect(config).toBeDefined();
      expect(config.name).toBe('strict');
      expect(config.firstReminderDays).toBe(1);
    });

    it('should throw error if reminder days not in ascending order', async () => {
      await expect(
        feeReminderService.createConfig({
          name: 'invalid',
          firstReminderDays: 7,
          secondReminderDays: 3,
          thirdReminderDays: 14,
          finalReminderDays: 30
        })
      ).rejects.toThrow('ascending order');
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', async () => {
      const config = await feeReminderService.createConfig({
        name: 'test',
        firstReminderDays: 3,
        secondReminderDays: 7,
        thirdReminderDays: 14,
        finalReminderDays: 30
      });

      const updated = await feeReminderService.updateConfig(config.reminderConfigId, {
        description: 'Updated description',
        firstReminderDays: 5
      });

      expect(updated).toBeDefined();
      expect(updated?.description).toBe('Updated description');
      expect(updated?.firstReminderDays).toBe(5);
    });

    it('should validate reminder days order when updating', async () => {
      const config = await feeReminderService.createConfig({
        name: 'test',
        firstReminderDays: 3,
        secondReminderDays: 7,
        thirdReminderDays: 14,
        finalReminderDays: 30
      });

      await expect(
        feeReminderService.updateConfig(config.reminderConfigId, {
          firstReminderDays: 10 // Would be >= secondReminderDays
        })
      ).rejects.toThrow('ascending order');
    });
  });

  describe('setDefaultConfig', () => {
    it('should set a config as default', async () => {
      const config = await feeReminderService.createConfig({
        name: 'new-default',
        firstReminderDays: 3,
        secondReminderDays: 7,
        thirdReminderDays: 14,
        finalReminderDays: 30
      });

      await feeReminderService.setDefaultConfig(config.reminderConfigId);

      const defaultConfig = await feeReminderService.getDefaultConfig();
      expect(defaultConfig.name).toBe('new-default');
    });
  });

  describe('getActiveConfigs', () => {
    it('should get all active configurations', async () => {
      await feeReminderService.createConfig({
        name: 'config1',
        firstReminderDays: 3,
        secondReminderDays: 7,
        thirdReminderDays: 14,
        finalReminderDays: 30
      });

      await feeReminderService.createConfig({
        name: 'config2',
        firstReminderDays: 5,
        secondReminderDays: 10,
        thirdReminderDays: 20,
        finalReminderDays: 40
      });

      const activeConfigs = await feeReminderService.getActiveConfigs();

      // Should include default + config1 (config2 is inactive)
      expect(activeConfigs.length).toBeGreaterThanOrEqual(2);
      expect(activeConfigs.every(c => c.isActive)).toBe(true);
    });
  });

  describe('deleteConfig', () => {
    it('should delete non-default configuration', async () => {
      const config = await feeReminderService.createConfig({
        name: 'deletable',
        firstReminderDays: 3,
        secondReminderDays: 7,
        thirdReminderDays: 14,
        finalReminderDays: 30
      });

      const deleted = await feeReminderService.deleteConfig(config.reminderConfigId);
      expect(deleted).toBe(true);

      const found = await feeReminderService.getConfigById(config.reminderConfigId);
      expect(found).toBeNull();
    });
  });
});
