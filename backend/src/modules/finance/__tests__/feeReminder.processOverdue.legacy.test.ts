import feeReminderService from '../feeReminder.service';
import feeReminderRepository from '../feeReminder.repository';
import invoiceRepository from '../invoice.repository';
import Student from '@models/Student.model';
import { ReminderType } from '@models/FeeReminder.model';

jest.mock('../feeReminder.repository', () => ({
  __esModule: true,
  default: {
    getDefaultConfig: jest.fn(),
    exists: jest.fn(),
    create: jest.fn()
  }
}));

jest.mock('../invoice.repository', () => ({
  __esModule: true,
  default: {
    findOverdue: jest.fn()
  }
}));

jest.mock('@models/Student.model', () => ({
  __esModule: true,
  default: {
    findByPk: jest.fn()
  }
}));

describe('FeeReminderService processOverdueInvoices legacy schema fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (feeReminderRepository.getDefaultConfig as jest.Mock).mockResolvedValue({
      firstReminderDays: 3,
      secondReminderDays: 7,
      thirdReminderDays: 14,
      finalReminderDays: 30,
      getMessageTemplate: jest.fn().mockReturnValue('Reminder for {studentName}: NPR {amount}')
    });

    (invoiceRepository.findOverdue as jest.Mock).mockResolvedValue([
      {
        invoiceId: 11,
        studentId: 101,
        invoiceNumber: 'INV-11',
        dueDate: '2024-01-01',
        balance: 1200,
        status: 'overdue',
        isOverdue: () => true
      }
    ]);

    (feeReminderRepository.exists as jest.Mock).mockResolvedValue(false);
    (feeReminderRepository.create as jest.Mock).mockResolvedValue({ feeReminderId: 1 });
  });

  it('falls back to legacy student lookup when phone columns are missing', async () => {
    (Student.findByPk as jest.Mock)
      .mockRejectedValueOnce(new Error("Unknown column 'father_phone' in 'field list'"))
      .mockResolvedValueOnce({
        studentId: 101,
        getFullNameEn: () => 'Legacy Student'
      });

    const result = await feeReminderService.processOverdueInvoices();

    expect(Student.findByPk).toHaveBeenCalledTimes(2);
    expect(result.processed).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.created).toBe(0);
    expect(result.errors[0].error).toContain('No contact phone found');
  });

  it('creates reminder when contact phone is available in modern schema', async () => {
    (Student.findByPk as jest.Mock).mockResolvedValue({
      studentId: 101,
      fatherPhone: '9800000010',
      motherPhone: null,
      phone: null,
      getFullNameEn: () => 'Modern Student'
    });

    const result = await feeReminderService.processOverdueInvoices();

    expect(result.processed).toBe(1);
    expect(result.created).toBe(1);
    expect(result.skipped).toBe(0);
    expect(feeReminderRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceId: 11,
        studentId: 101,
        reminderType: ReminderType.FINAL,
        phoneNumber: '9800000010'
      }),
      undefined
    );
  });
});
