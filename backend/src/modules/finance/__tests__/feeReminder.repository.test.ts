import feeReminderRepository from '../feeReminder.repository';
import FeeReminder, { ReminderType, ReminderStatus, ReminderConfig } from '@models/FeeReminder.model';
import sequelize from '@config/database';

/**
 * Fee Reminder Repository Tests
 * Requirements: 9.13
 */

describe('FeeReminderRepository', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await FeeReminder.destroy({ where: {}, force: true });
    await ReminderConfig.destroy({ where: {}, force: true });
  });

  describe('create', () => {
    it('should create a new fee reminder', async () => {
      const reminderData = {
        invoiceId: 1,
        studentId: 1,
        reminderType: ReminderType.FIRST,
        daysOverdue: 3,
        phoneNumber: '9800000000',
        message: 'Test reminder message'
      };

      const reminder = await feeReminderRepository.create(reminderData);

      expect(reminder).toBeDefined();
      expect(reminder.invoiceId).toBe(1);
      expect(reminder.studentId).toBe(1);
      expect(reminder.reminderType).toBe(ReminderType.FIRST);
      expect(reminder.daysOverdue).toBe(3);
      expect(reminder.phoneNumber).toBe('9800000000');
      expect(reminder.status).toBe(ReminderStatus.PENDING);
    });
  });

  describe('findById', () => {
    it('should find reminder by ID', async () => {
      const created = await feeReminderRepository.create({
        invoiceId: 1,
        studentId: 1,
        reminderType: ReminderType.FIRST,
        daysOverdue: 3,
        phoneNumber: '9800000000',
        message: 'Test message'
      });

      const found = await feeReminderRepository.findById(created.feeReminderId);

      expect(found).toBeDefined();
      expect(found?.feeReminderId).toBe(created.feeReminderId);
    });

    it('should return null for non-existent ID', async () => {
      const found = await feeReminderRepository.findById(999);
      expect(found).toBeNull();
    });
  });

  describe('findByInvoiceId', () => {
    it('should find all reminders for an invoice', async () => {
      await feeReminderRepository.create({
        invoiceId: 1,
        studentId: 1,
        reminderType: ReminderType.FIRST,
        daysOverdue: 3,
        phoneNumber: '9800000000',
        message: 'First reminder'
      });

      await feeReminderRepository.create({
        invoiceId: 1,
        studentId: 1,
        reminderType: ReminderType.SECOND,
        daysOverdue: 7,
        phoneNumber: '9800000000',
        message: 'Second reminder'
      });

      const reminders = await feeReminderRepository.findByInvoiceId(1);

      expect(reminders).toHaveLength(2);
      expect(reminders[0].invoiceId).toBe(1);
      expect(reminders[1].invoiceId).toBe(1);
    });

    it('should return empty array for invoice with no reminders', async () => {
      const reminders = await feeReminderRepository.findByInvoiceId(999);
      expect(reminders).toHaveLength(0);
    });
  });

  describe('findByStudentId', () => {
    it('should find all reminders for a student', async () => {
      await feeReminderRepository.create({
        invoiceId: 1,
        studentId: 1,
        reminderType: ReminderType.FIRST,
        daysOverdue: 3,
        phoneNumber: '9800000000',
        message: 'Reminder 1'
      });

      await feeReminderRepository.create({
        invoiceId: 2,
        studentId: 1,
        reminderType: ReminderType.FIRST,
        daysOverdue: 3,
        phoneNumber: '9800000000',
        message: 'Reminder 2'
      });

      const reminders = await feeReminderRepository.findByStudentId(1);

      expect(reminders).toHaveLength(2);
      expect(reminders[0].studentId).toBe(1);
      expect(reminders[1].studentId).toBe(1);
    });
  });

  describe('exists', () => {
    it('should return true if reminder exists for invoice and type', async () => {
      await feeReminderRepository.create({
        invoiceId: 1,
        studentId: 1,
        reminderType: ReminderType.FIRST,
        daysOverdue: 3,
        phoneNumber: '9800000000',
        message: 'Test'
      });

      const exists = await feeReminderRepository.exists(1, ReminderType.FIRST);
      expect(exists).toBe(true);
    });

    it('should return false if reminder does not exist', async () => {
      const exists = await feeReminderRepository.exists(1, ReminderType.FIRST);
      expect(exists).toBe(false);
    });
  });

  describe('markAsSent', () => {
    it('should mark reminder as sent with gateway ID', async () => {
      const reminder = await feeReminderRepository.create({
        invoiceId: 1,
        studentId: 1,
        reminderType: ReminderType.FIRST,
        daysOverdue: 3,
        phoneNumber: '9800000000',
        message: 'Test'
      });

      const updated = await feeReminderRepository.markAsSent(
        reminder.feeReminderId,
        'SMS-123456'
      );

      expect(updated).toBeDefined();
      expect(updated?.status).toBe(ReminderStatus.SENT);
      expect(updated?.smsGatewayId).toBe('SMS-123456');
      expect(updated?.sentAt).toBeDefined();
    });
  });

  describe('markAsDelivered', () => {
    it('should mark reminder as delivered', async () => {
      const reminder = await feeReminderRepository.create({
        invoiceId: 1,
        studentId: 1,
        reminderType: ReminderType.FIRST,
        daysOverdue: 3,
        phoneNumber: '9800000000',
        message: 'Test'
      });

      const updated = await feeReminderRepository.markAsDelivered(reminder.feeReminderId);

      expect(updated).toBeDefined();
      expect(updated?.status).toBe(ReminderStatus.DELIVERED);
      expect(updated?.deliveredAt).toBeDefined();
    });
  });

  describe('markAsFailed', () => {
    it('should mark reminder as failed with reason', async () => {
      const reminder = await feeReminderRepository.create({
        invoiceId: 1,
        studentId: 1,
        reminderType: ReminderType.FIRST,
        daysOverdue: 3,
        phoneNumber: '9800000000',
        message: 'Test'
      });

      const updated = await feeReminderRepository.markAsFailed(
        reminder.feeReminderId,
        'Invalid phone number'
      );

      expect(updated).toBeDefined();
      expect(updated?.status).toBe(ReminderStatus.FAILED);
      expect(updated?.failureReason).toBe('Invalid phone number');
    });
  });

  describe('getPendingReminders', () => {
    it('should get all pending reminders', async () => {
      await feeReminderRepository.create({
        invoiceId: 1,
        studentId: 1,
        reminderType: ReminderType.FIRST,
        daysOverdue: 3,
        phoneNumber: '9800000000',
        message: 'Pending 1'
      });

      await feeReminderRepository.create({
        invoiceId: 2,
        studentId: 2,
        reminderType: ReminderType.FIRST,
        daysOverdue: 3,
        phoneNumber: '9800000001',
        message: 'Pending 2',
        status: ReminderStatus.SENT
      });

      const pending = await feeReminderRepository.getPendingReminders();

      expect(pending).toHaveLength(1);
      expect(pending[0].status).toBe(ReminderStatus.PENDING);
    });

    it('should respect limit parameter', async () => {
      for (let i = 0; i < 5; i++) {
        await feeReminderRepository.create({
          invoiceId: i + 1,
          studentId: i + 1,
          reminderType: ReminderType.FIRST,
          daysOverdue: 3,
          phoneNumber: '9800000000',
          message: `Reminder ${i}`
        });
      }

      const pending = await feeReminderRepository.getPendingReminders(3);
      expect(pending).toHaveLength(3);
    });
  });

  describe('getLastReminderForInvoice', () => {
    it('should get the most recent sent reminder for an invoice', async () => {
      const first = await feeReminderRepository.create({
        invoiceId: 1,
        studentId: 1,
        reminderType: ReminderType.FIRST,
        daysOverdue: 3,
        phoneNumber: '9800000000',
        message: 'First'
      });
      await feeReminderRepository.markAsSent(first.feeReminderId);

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const second = await feeReminderRepository.create({
        invoiceId: 1,
        studentId: 1,
        reminderType: ReminderType.SECOND,
        daysOverdue: 7,
        phoneNumber: '9800000000',
        message: 'Second'
      });
      await feeReminderRepository.markAsSent(second.feeReminderId);

      const last = await feeReminderRepository.getLastReminderForInvoice(1);

      expect(last).toBeDefined();
      expect(last?.reminderType).toBe(ReminderType.SECOND);
    });
  });

  describe('getReminderCount', () => {
    it('should count sent/delivered reminders for an invoice', async () => {
      const r1 = await feeReminderRepository.create({
        invoiceId: 1,
        studentId: 1,
        reminderType: ReminderType.FIRST,
        daysOverdue: 3,
        phoneNumber: '9800000000',
        message: 'First'
      });
      await feeReminderRepository.markAsSent(r1.feeReminderId);

      const r2 = await feeReminderRepository.create({
        invoiceId: 1,
        studentId: 1,
        reminderType: ReminderType.SECOND,
        daysOverdue: 7,
        phoneNumber: '9800000000',
        message: 'Second'
      });
      await feeReminderRepository.markAsDelivered(r2.feeReminderId);

      // Create a pending reminder (should not be counted)
      await feeReminderRepository.create({
        invoiceId: 1,
        studentId: 1,
        reminderType: ReminderType.THIRD,
        daysOverdue: 14,
        phoneNumber: '9800000000',
        message: 'Third'
      });

      const count = await feeReminderRepository.getReminderCount(1);
      expect(count).toBe(2);
    });
  });

  // ==================== Config Tests ====================

  describe('createConfig', () => {
    it('should create a new reminder configuration', async () => {
      const config = await feeReminderRepository.createConfig({
        name: 'test-config',
        description: 'Test configuration',
        firstReminderDays: 3,
        secondReminderDays: 7,
        thirdReminderDays: 14,
        finalReminderDays: 30
      });

      expect(config).toBeDefined();
      expect(config.name).toBe('test-config');
      expect(config.firstReminderDays).toBe(3);
      expect(config.isActive).toBe(true);
    });
  });

  describe('getDefaultConfig', () => {
    it('should get the default configuration', async () => {
      await feeReminderRepository.createConfig({
        name: 'default',
        firstReminderDays: 3,
        secondReminderDays: 7,
        thirdReminderDays: 14,
        finalReminderDays: 30,
        isDefault: true
      });

      const config = await feeReminderRepository.getDefaultConfig();

      expect(config).toBeDefined();
      expect(config?.isDefault).toBe(true);
    });
  });

  describe('setDefaultConfig', () => {
    it('should set a config as default and unset others', async () => {
      const config1 = await feeReminderRepository.createConfig({
        name: 'config1',
        firstReminderDays: 3,
        secondReminderDays: 7,
        thirdReminderDays: 14,
        finalReminderDays: 30,
        isDefault: true
      });

      const config2 = await feeReminderRepository.createConfig({
        name: 'config2',
        firstReminderDays: 5,
        secondReminderDays: 10,
        thirdReminderDays: 20,
        finalReminderDays: 40
      });

      await feeReminderRepository.setDefaultConfig(config2.reminderConfigId);

      const updated1 = await feeReminderRepository.findConfigById(config1.reminderConfigId);
      const updated2 = await feeReminderRepository.findConfigById(config2.reminderConfigId);

      expect(updated1?.isDefault).toBe(false);
      expect(updated2?.isDefault).toBe(true);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration fields', async () => {
      const config = await feeReminderRepository.createConfig({
        name: 'test',
        firstReminderDays: 3,
        secondReminderDays: 7,
        thirdReminderDays: 14,
        finalReminderDays: 30
      });

      const updated = await feeReminderRepository.updateConfig(
        config.reminderConfigId,
        {
          firstReminderDays: 5,
          description: 'Updated description'
        }
      );

      expect(updated).toBeDefined();
      expect(updated?.firstReminderDays).toBe(5);
      expect(updated?.description).toBe('Updated description');
    });
  });

  describe('deleteConfig', () => {
    it('should delete non-default configuration', async () => {
      const config = await feeReminderRepository.createConfig({
        name: 'test',
        firstReminderDays: 3,
        secondReminderDays: 7,
        thirdReminderDays: 14,
        finalReminderDays: 30
      });

      const deleted = await feeReminderRepository.deleteConfig(config.reminderConfigId);
      expect(deleted).toBe(true);

      const found = await feeReminderRepository.findConfigById(config.reminderConfigId);
      expect(found).toBeNull();
    });

    it('should not delete default configuration', async () => {
      const config = await feeReminderRepository.createConfig({
        name: 'default',
        firstReminderDays: 3,
        secondReminderDays: 7,
        thirdReminderDays: 14,
        finalReminderDays: 30,
        isDefault: true
      });

      await expect(
        feeReminderRepository.deleteConfig(config.reminderConfigId)
      ).rejects.toThrow('Cannot delete default configuration');
    });
  });
});
