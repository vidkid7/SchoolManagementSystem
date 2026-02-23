import paymentService from '../payment.service';
import paymentRepository from '../payment.repository';
import invoiceRepository from '../invoice.repository';
import { Payment, PaymentMethod, PaymentStatus } from '@models/Payment.model';
import { InstallmentPlan, InstallmentFrequency, InstallmentPlanStatus } from '@models/Payment.model';
import { Invoice, InvoiceStatus } from '@models/Invoice.model';
import sequelize from '@config/database';

/**
 * Payment Service Unit Tests
 * Tests payment processing, receipt generation, and installment plans
 * 
 * Requirements: 9.5, 9.7, 9.8, 9.9, 9.11
 */

// Mock dependencies
jest.mock('../payment.repository');
jest.mock('../invoice.repository');
jest.mock('@config/database', () => ({
  __esModule: true,
  default: {
    transaction: jest.fn()
  }
}));
jest.mock('@models/Payment.model', () => ({
  Payment: {
    findOne: jest.fn()
  },
  PaymentMethod: {
    CASH: 'cash',
    BANK_TRANSFER: 'bank_transfer',
    ESEWA: 'esewa',
    KHALTI: 'khalti',
    IME_PAY: 'ime_pay'
  },
  PaymentStatus: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded'
  },
  InstallmentPlan: {},
  InstallmentFrequency: {
    MONTHLY: 'monthly',
    QUARTERLY: 'quarterly',
    CUSTOM: 'custom'
  },
  InstallmentPlanStatus: {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  }
}));
jest.mock('@models/Invoice.model', () => ({
  Invoice: {},
  InvoiceStatus: {
    PENDING: 'pending',
    PARTIAL: 'partial',
    PAID: 'paid',
    OVERDUE: 'overdue',
    CANCELLED: 'cancelled'
  }
}));
jest.mock('@models/FeeStructure.model', () => ({
  FeeStructure: {},
  FeeComponent: {}
}));

describe('PaymentService', () => {
  let mockTransaction: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock transaction
    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn()
    };
    (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);
  });

  describe('generateReceiptNumber', () => {
    it('should generate unique receipt number with correct format', async () => {
      // Mock no existing payments
      (Payment.findOne as jest.Mock) = jest.fn().mockResolvedValue(null);

      const receiptNumber = await paymentService.generateReceiptNumber();

      expect(receiptNumber).toMatch(/^RCP-\d{4}-\d{5}$/);
      expect(receiptNumber).toContain('RCP-');
    });

    it('should increment sequential number for existing receipts', async () => {
      const currentYear = new Date().getFullYear();
      const bsYear = currentYear + 57;

      // Mock existing payment
      const mockLastPayment = {
        receiptNumber: `RCP-${bsYear}-00005`
      };
      (Payment.findOne as jest.Mock) = jest.fn().mockResolvedValue(mockLastPayment);

      const receiptNumber = await paymentService.generateReceiptNumber();

      expect(receiptNumber).toBe(`RCP-${bsYear}-00006`);
    });
  });

  describe('generateReceiptQRCode', () => {
    it('should generate QR code with payment details', async () => {
      const mockPayment = {
        receiptNumber: 'RCP-2081-00001',
        studentId: 1,
        amount: 5000,
        paymentDate: '2024-01-15',
        paymentMethod: PaymentMethod.CASH,
        invoiceId: 1
      } as Payment;

      const qrCode = await paymentService.generateReceiptQRCode(mockPayment);

      expect(qrCode).toBeDefined();
      expect(qrCode).toContain('data:image/png;base64');
    });
  });

  describe('processPayment', () => {
    it('should process cash payment successfully', async () => {
      const mockInvoice = {
        invoiceId: 1,
        totalAmount: 10000,
        paidAmount: 0,
        balance: 10000,
        status: InvoiceStatus.PENDING,
        calculateBalance: jest.fn().mockReturnValue(10000),
        recordPayment: jest.fn(),
        save: jest.fn()
      } as unknown as Invoice;

      const mockPayment = {
        paymentId: 1,
        receiptNumber: 'RCP-2081-00001',
        amount: 5000,
        update: jest.fn(),
        save: jest.fn()
      } as unknown as Payment;

      (invoiceRepository.findById as jest.Mock).mockResolvedValue(mockInvoice);
      (paymentRepository.create as jest.Mock).mockResolvedValue(mockPayment);

      const result = await paymentService.processPayment({
        invoiceId: 1,
        studentId: 1,
        amount: 5000,
        paymentMethod: PaymentMethod.CASH,
        paymentDate: '2024-01-15',
        receivedBy: 1
      });

      expect(result.payment).toBeDefined();
      expect(result.invoice).toBeDefined();
      expect(mockInvoice.recordPayment).toHaveBeenCalledWith(5000);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should throw error if invoice not found', async () => {
      (invoiceRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        paymentService.processPayment({
          invoiceId: 999,
          studentId: 1,
          amount: 5000,
          paymentMethod: PaymentMethod.CASH,
          paymentDate: '2024-01-15',
          receivedBy: 1
        })
      ).rejects.toThrow('Invoice not found');

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should throw error if payment amount exceeds balance', async () => {
      const mockInvoice = {
        invoiceId: 1,
        totalAmount: 10000,
        paidAmount: 8000,
        balance: 2000,
        status: InvoiceStatus.PARTIAL,
        calculateBalance: jest.fn().mockReturnValue(2000)
      } as unknown as Invoice;

      (invoiceRepository.findById as jest.Mock).mockResolvedValue(mockInvoice);

      await expect(
        paymentService.processPayment({
          invoiceId: 1,
          studentId: 1,
          amount: 5000,
          paymentMethod: PaymentMethod.CASH,
          paymentDate: '2024-01-15',
          receivedBy: 1
        })
      ).rejects.toThrow('Payment amount (5000) exceeds invoice balance (2000)');

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should throw error if invoice is cancelled', async () => {
      const mockInvoice = {
        invoiceId: 1,
        status: InvoiceStatus.CANCELLED
      } as Invoice;

      (invoiceRepository.findById as jest.Mock).mockResolvedValue(mockInvoice);

      await expect(
        paymentService.processPayment({
          invoiceId: 1,
          studentId: 1,
          amount: 5000,
          paymentMethod: PaymentMethod.CASH,
          paymentDate: '2024-01-15',
          receivedBy: 1
        })
      ).rejects.toThrow('Cannot process payment for cancelled invoice');
    });

    it('should throw error if payment amount is zero or negative', async () => {
      const mockInvoice = {
        invoiceId: 1,
        status: InvoiceStatus.PENDING,
        calculateBalance: jest.fn().mockReturnValue(10000)
      } as unknown as Invoice;

      (invoiceRepository.findById as jest.Mock).mockResolvedValue(mockInvoice);

      await expect(
        paymentService.processPayment({
          invoiceId: 1,
          studentId: 1,
          amount: 0,
          paymentMethod: PaymentMethod.CASH,
          paymentDate: '2024-01-15',
          receivedBy: 1
        })
      ).rejects.toThrow('Payment amount must be greater than zero');
    });
  });

  describe('processBankTransferPayment', () => {
    it('should process bank transfer with transaction ID', async () => {
      const mockInvoice = {
        invoiceId: 1,
        totalAmount: 10000,
        paidAmount: 0,
        balance: 10000,
        status: InvoiceStatus.PENDING,
        calculateBalance: jest.fn().mockReturnValue(10000),
        recordPayment: jest.fn(),
        save: jest.fn()
      } as unknown as Invoice;

      const mockPayment = {
        paymentId: 1,
        receiptNumber: 'RCP-2081-00001',
        amount: 5000,
        transactionId: 'TXN123456',
        update: jest.fn(),
        save: jest.fn()
      } as unknown as Payment;

      (paymentRepository.findByTransactionId as jest.Mock).mockResolvedValue(null);
      (invoiceRepository.findById as jest.Mock).mockResolvedValue(mockInvoice);
      (paymentRepository.create as jest.Mock).mockResolvedValue(mockPayment);

      const result = await paymentService.processBankTransferPayment(
        1, 1, 5000, '2024-01-15', 'TXN123456', 1
      );

      expect(result.payment).toBeDefined();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should throw error for duplicate transaction ID', async () => {
      const mockExistingPayment = {
        paymentId: 1,
        transactionId: 'TXN123456'
      } as Payment;

      (paymentRepository.findByTransactionId as jest.Mock).mockResolvedValue(mockExistingPayment);

      await expect(
        paymentService.processBankTransferPayment(
          1, 1, 5000, '2024-01-15', 'TXN123456', 1
        )
      ).rejects.toThrow('Payment with transaction ID TXN123456 already exists');
    });
  });

  describe('createInstallmentPlan', () => {
    it('should create installment plan successfully', async () => {
      const mockInvoice = {
        invoiceId: 1,
        totalAmount: 12000,
        paidAmount: 0,
        balance: 12000,
        calculateBalance: jest.fn().mockReturnValue(12000)
      } as unknown as Invoice;

      const mockPlan = {
        installmentPlanId: 1,
        invoiceId: 1,
        studentId: 1,
        totalAmount: 12000,
        numberOfInstallments: 4,
        installmentAmount: 3000,
        frequency: InstallmentFrequency.MONTHLY,
        status: InstallmentPlanStatus.ACTIVE
      } as InstallmentPlan;

      (invoiceRepository.findById as jest.Mock).mockResolvedValue(mockInvoice);
      (paymentRepository.findInstallmentPlanByInvoiceId as jest.Mock).mockResolvedValue(null);
      (paymentRepository.createInstallmentPlan as jest.Mock).mockResolvedValue(mockPlan);

      const result = await paymentService.createInstallmentPlan({
        invoiceId: 1,
        studentId: 1,
        numberOfInstallments: 4,
        frequency: InstallmentFrequency.MONTHLY,
        startDate: '2024-01-01',
        createdBy: 1
      });

      expect(result).toBeDefined();
      expect(result.numberOfInstallments).toBe(4);
      expect(result.installmentAmount).toBe(3000);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should throw error if invoice not found', async () => {
      (invoiceRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        paymentService.createInstallmentPlan({
          invoiceId: 999,
          studentId: 1,
          numberOfInstallments: 4,
          frequency: InstallmentFrequency.MONTHLY,
          startDate: '2024-01-01',
          createdBy: 1
        })
      ).rejects.toThrow('Invoice not found');
    });

    it('should throw error if invoice already has active installment plan', async () => {
      const mockInvoice = {
        invoiceId: 1,
        calculateBalance: jest.fn().mockReturnValue(12000)
      } as unknown as Invoice;

      const mockExistingPlan = {
        installmentPlanId: 1,
        status: InstallmentPlanStatus.ACTIVE,
        isActive: jest.fn().mockReturnValue(true)
      } as unknown as InstallmentPlan;

      (invoiceRepository.findById as jest.Mock).mockResolvedValue(mockInvoice);
      (paymentRepository.findInstallmentPlanByInvoiceId as jest.Mock).mockResolvedValue(mockExistingPlan);

      await expect(
        paymentService.createInstallmentPlan({
          invoiceId: 1,
          studentId: 1,
          numberOfInstallments: 4,
          frequency: InstallmentFrequency.MONTHLY,
          startDate: '2024-01-01',
          createdBy: 1
        })
      ).rejects.toThrow('Invoice already has an active installment plan');
    });

    it('should throw error if invoice has no balance', async () => {
      const mockInvoice = {
        invoiceId: 1,
        totalAmount: 10000,
        paidAmount: 10000,
        balance: 0,
        calculateBalance: jest.fn().mockReturnValue(0)
      } as unknown as Invoice;

      (invoiceRepository.findById as jest.Mock).mockResolvedValue(mockInvoice);
      (paymentRepository.findInstallmentPlanByInvoiceId as jest.Mock).mockResolvedValue(null);

      await expect(
        paymentService.createInstallmentPlan({
          invoiceId: 1,
          studentId: 1,
          numberOfInstallments: 4,
          frequency: InstallmentFrequency.MONTHLY,
          startDate: '2024-01-01',
          createdBy: 1
        })
      ).rejects.toThrow('Invoice has no balance to create installment plan');
    });
  });

  describe('processInstallmentPayment', () => {
    it('should process installment payment successfully', async () => {
      const mockPlan = {
        installmentPlanId: 1,
        invoiceId: 1,
        studentId: 1,
        numberOfInstallments: 4,
        installmentAmount: 3000,
        status: InstallmentPlanStatus.ACTIVE,
        isActive: jest.fn().mockReturnValue(true),
        getRemainingInstallments: jest.fn().mockResolvedValue(3),
        markAsCompleted: jest.fn(),
        save: jest.fn()
      } as unknown as InstallmentPlan;

      const mockInvoice = {
        invoiceId: 1,
        totalAmount: 12000,
        paidAmount: 0,
        balance: 12000,
        status: InvoiceStatus.PENDING,
        calculateBalance: jest.fn().mockReturnValue(12000),
        recordPayment: jest.fn(),
        save: jest.fn()
      } as unknown as Invoice;

      const mockPayment = {
        paymentId: 1,
        receiptNumber: 'RCP-2081-00001',
        amount: 3000,
        installmentNumber: 1,
        update: jest.fn(),
        save: jest.fn()
      } as unknown as Payment;

      (paymentRepository.findInstallmentPlanById as jest.Mock).mockResolvedValue(mockPlan);
      (Payment.findOne as jest.Mock) = jest.fn().mockResolvedValue(null);
      (invoiceRepository.findById as jest.Mock).mockResolvedValue(mockInvoice);
      (paymentRepository.create as jest.Mock).mockResolvedValue(mockPayment);

      const result = await paymentService.processInstallmentPayment(
        1, 1, PaymentMethod.CASH, '2024-01-15', 1
      );

      expect(result.payment).toBeDefined();
      expect(result.invoice).toBeDefined();
      expect(result.plan).toBeDefined();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should throw error if installment plan not found', async () => {
      (paymentRepository.findInstallmentPlanById as jest.Mock).mockResolvedValue(null);

      await expect(
        paymentService.processInstallmentPayment(
          999, 1, PaymentMethod.CASH, '2024-01-15', 1
        )
      ).rejects.toThrow('Installment plan not found');
    });

    it('should throw error if installment plan is not active', async () => {
      const mockPlan = {
        installmentPlanId: 1,
        status: InstallmentPlanStatus.COMPLETED,
        isActive: jest.fn().mockReturnValue(false)
      } as unknown as InstallmentPlan;

      (paymentRepository.findInstallmentPlanById as jest.Mock).mockResolvedValue(mockPlan);

      await expect(
        paymentService.processInstallmentPayment(
          1, 1, PaymentMethod.CASH, '2024-01-15', 1
        )
      ).rejects.toThrow('Installment plan is not active');
    });

    it('should throw error for invalid installment number', async () => {
      const mockPlan = {
        installmentPlanId: 1,
        numberOfInstallments: 4,
        status: InstallmentPlanStatus.ACTIVE,
        isActive: jest.fn().mockReturnValue(true)
      } as unknown as InstallmentPlan;

      (paymentRepository.findInstallmentPlanById as jest.Mock).mockResolvedValue(mockPlan);

      await expect(
        paymentService.processInstallmentPayment(
          1, 5, PaymentMethod.CASH, '2024-01-15', 1
        )
      ).rejects.toThrow('Invalid installment number. Must be between 1 and 4');
    });

    it('should throw error if installment already paid', async () => {
      const mockPlan = {
        installmentPlanId: 1,
        numberOfInstallments: 4,
        status: InstallmentPlanStatus.ACTIVE,
        isActive: jest.fn().mockReturnValue(true)
      } as unknown as InstallmentPlan;

      const mockExistingPayment = {
        paymentId: 1,
        installmentNumber: 1,
        status: PaymentStatus.COMPLETED
      } as Payment;

      (paymentRepository.findInstallmentPlanById as jest.Mock).mockResolvedValue(mockPlan);
      (Payment.findOne as jest.Mock) = jest.fn().mockResolvedValue(mockExistingPayment);

      await expect(
        paymentService.processInstallmentPayment(
          1, 1, PaymentMethod.CASH, '2024-01-15', 1
        )
      ).rejects.toThrow('Installment 1 has already been paid');
    });
  });

  describe('refundPayment', () => {
    it('should refund payment successfully', async () => {
      const mockPayment = {
        paymentId: 1,
        invoiceId: 1,
        amount: 5000,
        status: PaymentStatus.COMPLETED,
        remarks: 'Original payment',
        markAsRefunded: jest.fn(),
        save: jest.fn()
      } as unknown as Payment;

      const mockInvoice = {
        invoiceId: 1,
        totalAmount: 10000,
        paidAmount: 5000,
        balance: 5000,
        calculateBalance: jest.fn().mockReturnValue(10000),
        updateStatus: jest.fn().mockReturnValue(InvoiceStatus.PENDING),
        save: jest.fn()
      } as unknown as Invoice;

      (paymentRepository.findById as jest.Mock).mockResolvedValue(mockPayment);
      (invoiceRepository.findById as jest.Mock).mockResolvedValue(mockInvoice);

      const result = await paymentService.refundPayment(1, 1, 'Customer request');

      expect(result.payment).toBeDefined();
      expect(result.invoice).toBeDefined();
      expect(mockPayment.markAsRefunded).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should throw error if payment not found', async () => {
      (paymentRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        paymentService.refundPayment(999, 1, 'Customer request')
      ).rejects.toThrow('Payment not found');
    });

    it('should throw error if payment already refunded', async () => {
      const mockPayment = {
        paymentId: 1,
        status: PaymentStatus.REFUNDED
      } as Payment;

      (paymentRepository.findById as jest.Mock).mockResolvedValue(mockPayment);

      await expect(
        paymentService.refundPayment(1, 1, 'Customer request')
      ).rejects.toThrow('Payment has already been refunded');
    });

    it('should throw error if payment is not completed', async () => {
      const mockPayment = {
        paymentId: 1,
        status: PaymentStatus.PENDING
      } as Payment;

      (paymentRepository.findById as jest.Mock).mockResolvedValue(mockPayment);

      await expect(
        paymentService.refundPayment(1, 1, 'Customer request')
      ).rejects.toThrow('Only completed payments can be refunded');
    });
  });

  describe('cancelInstallmentPlan', () => {
    it('should cancel installment plan successfully', async () => {
      const mockPlan = {
        installmentPlanId: 1,
        status: InstallmentPlanStatus.ACTIVE,
        isCompleted: jest.fn().mockReturnValue(false),
        markAsCancelled: jest.fn(),
        save: jest.fn()
      } as unknown as InstallmentPlan;

      (paymentRepository.findInstallmentPlanById as jest.Mock).mockResolvedValue(mockPlan);

      const result = await paymentService.cancelInstallmentPlan(1);

      expect(result).toBeDefined();
      expect(mockPlan.markAsCancelled).toHaveBeenCalled();
    });

    it('should throw error if plan not found', async () => {
      (paymentRepository.findInstallmentPlanById as jest.Mock).mockResolvedValue(null);

      await expect(
        paymentService.cancelInstallmentPlan(999)
      ).rejects.toThrow('Installment plan not found');
    });

    it('should throw error if plan is completed', async () => {
      const mockPlan = {
        installmentPlanId: 1,
        status: InstallmentPlanStatus.COMPLETED,
        isCompleted: jest.fn().mockReturnValue(true)
      } as unknown as InstallmentPlan;

      (paymentRepository.findInstallmentPlanById as jest.Mock).mockResolvedValue(mockPlan);

      await expect(
        paymentService.cancelInstallmentPlan(1)
      ).rejects.toThrow('Cannot cancel completed installment plan');
    });
  });

  describe('verifyReceipt', () => {
    it('should verify receipt by receipt number', async () => {
      const mockPayment = {
        paymentId: 1,
        receiptNumber: 'RCP-2081-00001',
        amount: 5000
      } as Payment;

      (paymentRepository.findByReceiptNumber as jest.Mock).mockResolvedValue(mockPayment);

      const result = await paymentService.verifyReceipt('RCP-2081-00001');

      expect(result).toBeDefined();
      expect(result?.receiptNumber).toBe('RCP-2081-00001');
    });

    it('should return null for invalid receipt number', async () => {
      (paymentRepository.findByReceiptNumber as jest.Mock).mockResolvedValue(null);

      const result = await paymentService.verifyReceipt('INVALID');

      expect(result).toBeNull();
    });
  });
});
