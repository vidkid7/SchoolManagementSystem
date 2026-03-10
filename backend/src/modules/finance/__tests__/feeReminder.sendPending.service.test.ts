import feeReminderService from '../feeReminder.service';
import feeReminderRepository from '../feeReminder.repository';
import smsService from '@services/sms.service';

jest.mock('../feeReminder.repository', () => ({
  __esModule: true,
  default: {
    getPendingReminders: jest.fn(),
    markAsSent: jest.fn(),
    markAsFailed: jest.fn()
  }
}));

jest.mock('@services/sms.service', () => ({
  __esModule: true,
  default: {
    sendSMS: jest.fn()
  }
}));

describe('FeeReminderService sendPendingReminders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('marks reminder as sent when SMS gateway succeeds', async () => {
    (feeReminderRepository.getPendingReminders as jest.Mock).mockResolvedValue([
      {
        feeReminderId: 1,
        phoneNumber: '9800000000',
        message: 'Fee reminder'
      }
    ]);
    (smsService.sendSMS as jest.Mock).mockResolvedValue({
      success: true,
      messageId: 'sms-1'
    });

    const result = await feeReminderService.sendPendingReminders();

    expect(result.sent).toBe(1);
    expect(result.failed).toBe(0);
    expect(smsService.sendSMS).toHaveBeenCalledWith('9800000000', 'Fee reminder');
    expect(feeReminderRepository.markAsSent).toHaveBeenCalledWith(1, 'sms-1');
  });

  it('marks reminder as failed when SMS gateway returns unsuccessful response', async () => {
    (feeReminderRepository.getPendingReminders as jest.Mock).mockResolvedValue([
      {
        feeReminderId: 2,
        phoneNumber: '9800000001',
        message: 'Fee reminder'
      }
    ]);
    (smsService.sendSMS as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Gateway down'
    });

    const result = await feeReminderService.sendPendingReminders();

    expect(result.sent).toBe(0);
    expect(result.failed).toBe(1);
    expect(feeReminderRepository.markAsFailed).toHaveBeenCalledWith(2, 'Gateway down');
  });

  it('marks reminder as failed when SMS sending throws', async () => {
    (feeReminderRepository.getPendingReminders as jest.Mock).mockResolvedValue([
      {
        feeReminderId: 3,
        phoneNumber: '9800000002',
        message: 'Fee reminder'
      }
    ]);
    (smsService.sendSMS as jest.Mock).mockRejectedValue(new Error('Network error'));

    const result = await feeReminderService.sendPendingReminders();

    expect(result.sent).toBe(0);
    expect(result.failed).toBe(1);
    expect(feeReminderRepository.markAsFailed).toHaveBeenCalledWith(3, 'Network error');
  });
});
