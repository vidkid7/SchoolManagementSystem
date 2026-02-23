import paymentRepository from '../payment.repository';
import { Payment, PaymentMethod, PaymentStatus } from '@models/Payment.model';
import { InstallmentPlan, InstallmentFrequency, InstallmentPlanStatus } from '@models/Payment.model';

/**
 * Payment Repository Unit Tests
 * Tests database operations for payments and installment plans
 * 
 * Requirements: 9.5, 9.7, 9.8, 9.9, 9.11
 */

describe('PaymentRepository', () => {
  describe('create', () => {
    it('should create a new payment', async () => {
      const paymentData = {
        receiptNumber: 'RCP-2081-00001',
        invoiceId: 1,
        studentId: 1,
        amount: 5000,
        paymentMethod: PaymentMethod.CASH,
        paymentDate: '2024-01-15',
        receivedBy: 1,
        status: PaymentStatus.COMPLETED
      };

      const mockPayment = { ...paymentData, paymentId: 1 } as Payment;
      (Payment.create as jest.Mock) = jest.fn().mockResolvedValue(mockPayment);

      const result = await paymentRepository.create(paymentData);

      expect(result).toBeDefined();
      expect(result.receiptNumber).toBe('RCP-2081-00001');
      expect(Payment.create).toHaveBeenCalledWith(paymentData, { transaction: undefined });
    });
  });

  describe('findById', () => {
    it('should find payment by ID', async () => {
      const mockPayment = {
        paymentId: 1,
        receiptNumber: 'RCP-2081-00001',
        amount: 5000
      } as Payment;

      (Payment.findByPk as jest.Mock) = jest.fn().mockResolvedValue(mockPayment);

      const result = await paymentRepository.findById(1);

      expect(result).toBeDefined();
      expect(result?.paymentId).toBe(1);
    });

    it('should return null if payment not found', async () => {
      (Payment.findByPk as jest.Mock) = jest.fn().mockResolvedValue(null);

      const result = await paymentRepository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByReceiptNumber', () => {
    it('should find payment by receipt number', async () => {
      const mockPayment = {
        paymentId: 1,
        receiptNumber: 'RCP-2081-00001'
      } as Payment;

      (Payment.findOne as jest.Mock) = jest.fn().mockResolvedValue(mockPayment);

      const result = await paymentRepository.findByReceiptNumber('RCP-2081-00001');

      expect(result).toBeDefined();
      expect(result?.receiptNumber).toBe('RCP-2081-00001');
    });
  });

  describe('findByTransactionId', () => {
    it('should find payment by transaction ID', async () => {
      const mockPayment = {
        paymentId: 1,
        transactionId: 'TXN123456'
      } as Payment;

      (Payment.findOne as jest.Mock) = jest.fn().mockResolvedValue(mockPayment);

      const result = await paymentRepository.findByTransactionId('TXN123456');

      expect(result).toBeDefined();
      expect(result?.transactionId).toBe('TXN123456');
    });
  });

  describe('findAll', () => {
    it('should find all payments with filters', async () => {
      const mockPayments = [
        { paymentId: 1, studentId: 1, amount: 5000 },
        { paymentId: 2, studentId: 1, amount: 3000 }
      ] as Payment[];

      (Payment.findAll as jest.Mock) = jest.fn().mockResolvedValue(mockPayments);

      const result = await paymentRepository.findAll({ studentId: 1 });

      expect(result).toHaveLength(2);
      expect(Payment.findAll).toHaveBeenCalled();
    });

    it('should filter by payment method', async () => {
      const mockPayments = [
        { paymentId: 1, paymentMethod: PaymentMethod.CASH }
      ] as Payment[];

      (Payment.findAll as jest.Mock) = jest.fn().mockResolvedValue(mockPayments);

      const result = await paymentRepository.findAll({ paymentMethod: PaymentMethod.CASH });

      expect(result).toHaveLength(1);
    });

    it('should filter by date range', async () => {
      const mockPayments = [
        { paymentId: 1, paymentDate: '2024-01-15' }
      ] as Payment[];

      (Payment.findAll as jest.Mock) = jest.fn().mockResolvedValue(mockPayments);

      const result = await paymentRepository.findAll({
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });

      expect(result).toHaveLength(1);
    });
  });

  describe('findByStudentId', () => {
    it('should find all payments for a student', async () => {
      const mockPayments = [
        { paymentId: 1, studentId: 1 },
        { paymentId: 2, studentId: 1 }
      ] as Payment[];

      (Payment.findAll as jest.Mock) = jest.fn().mockResolvedValue(mockPayments);

      const result = await paymentRepository.findByStudentId(1);

      expect(result).toHaveLength(2);
    });
  });

  describe('findByInvoiceId', () => {
    it('should find all payments for an invoice', async () => {
      const mockPayments = [
        { paymentId: 1, invoiceId: 1 },
        { paymentId: 2, invoiceId: 1 }
      ] as Payment[];

      (Payment.findAll as jest.Mock) = jest.fn().mockResolvedValue(mockPayments);

      const result = await paymentRepository.findByInvoiceId(1);

      expect(result).toHaveLength(2);
    });
  });

  describe('getTotalPaymentsByInvoice', () => {
    it('should calculate total payments for an invoice', async () => {
      const mockPayments = [
        { amount: 5000, status: PaymentStatus.COMPLETED },
        { amount: 3000, status: PaymentStatus.COMPLETED }
      ] as Payment[];

      (Payment.findAll as jest.Mock) = jest.fn().mockResolvedValue(mockPayments);

      const total = await paymentRepository.getTotalPaymentsByInvoice(1);

      expect(total).toBe(8000);
    });

    it('should exclude non-completed payments', async () => {
      const mockPayments = [
        { amount: 5000, status: PaymentStatus.COMPLETED }
      ] as Payment[];

      (Payment.findAll as jest.Mock) = jest.fn().mockResolvedValue(mockPayments);

      const total = await paymentRepository.getTotalPaymentsByInvoice(1);

      expect(total).toBe(5000);
    });
  });

  describe('getTotalPaymentsByStudent', () => {
    it('should calculate total payments for a student', async () => {
      const mockPayments = [
        { amount: 5000, status: PaymentStatus.COMPLETED },
        { amount: 3000, status: PaymentStatus.COMPLETED }
      ] as Payment[];

      (Payment.findAll as jest.Mock) = jest.fn().mockResolvedValue(mockPayments);

      const total = await paymentRepository.getTotalPaymentsByStudent(1);

      expect(total).toBe(8000);
    });
  });

  describe('getPaymentStatsByMethod', () => {
    it('should calculate payment statistics by method', async () => {
      const mockPayments = [
        { paymentMethod: PaymentMethod.CASH, amount: 5000, status: PaymentStatus.COMPLETED },
        { paymentMethod: PaymentMethod.CASH, amount: 3000, status: PaymentStatus.COMPLETED },
        { paymentMethod: PaymentMethod.BANK_TRANSFER, amount: 10000, status: PaymentStatus.COMPLETED }
      ] as Payment[];

      (Payment.findAll as jest.Mock) = jest.fn().mockResolvedValue(mockPayments);

      const stats = await paymentRepository.getPaymentStatsByMethod();

      expect(stats[PaymentMethod.CASH]).toEqual({ count: 2, total: 8000 });
      expect(stats[PaymentMethod.BANK_TRANSFER]).toEqual({ count: 1, total: 10000 });
    });
  });

  describe('receiptNumberExists', () => {
    it('should return true if receipt number exists', async () => {
      (Payment.count as jest.Mock) = jest.fn().mockResolvedValue(1);

      const exists = await paymentRepository.receiptNumberExists('RCP-2081-00001');

      expect(exists).toBe(true);
    });

    it('should return false if receipt number does not exist', async () => {
      (Payment.count as jest.Mock) = jest.fn().mockResolvedValue(0);

      const exists = await paymentRepository.receiptNumberExists('RCP-2081-99999');

      expect(exists).toBe(false);
    });
  });

  describe('transactionIdExists', () => {
    it('should return true if transaction ID exists', async () => {
      (Payment.count as jest.Mock) = jest.fn().mockResolvedValue(1);

      const exists = await paymentRepository.transactionIdExists('TXN123456');

      expect(exists).toBe(true);
    });

    it('should return false if transaction ID does not exist', async () => {
      (Payment.count as jest.Mock) = jest.fn().mockResolvedValue(0);

      const exists = await paymentRepository.transactionIdExists('TXN999999');

      expect(exists).toBe(false);
    });
  });

  // Installment Plan Tests

  describe('createInstallmentPlan', () => {
    it('should create a new installment plan', async () => {
      const planData = {
        invoiceId: 1,
        studentId: 1,
        totalAmount: 12000,
        numberOfInstallments: 4,
        installmentAmount: 3000,
        frequency: InstallmentFrequency.MONTHLY,
        startDate: '2024-01-01',
        createdBy: 1
      };

      const mockPlan = { ...planData, installmentPlanId: 1 } as InstallmentPlan;
      (InstallmentPlan.create as jest.Mock) = jest.fn().mockResolvedValue(mockPlan);

      const result = await paymentRepository.createInstallmentPlan(planData);

      expect(result).toBeDefined();
      expect(result.numberOfInstallments).toBe(4);
    });
  });

  describe('findInstallmentPlanById', () => {
    it('should find installment plan by ID', async () => {
      const mockPlan = {
        installmentPlanId: 1,
        numberOfInstallments: 4
      } as InstallmentPlan;

      (InstallmentPlan.findByPk as jest.Mock) = jest.fn().mockResolvedValue(mockPlan);

      const result = await paymentRepository.findInstallmentPlanById(1);

      expect(result).toBeDefined();
      expect(result?.installmentPlanId).toBe(1);
    });
  });

  describe('findInstallmentPlanByInvoiceId', () => {
    it('should find installment plan by invoice ID', async () => {
      const mockPlan = {
        installmentPlanId: 1,
        invoiceId: 1
      } as InstallmentPlan;

      (InstallmentPlan.findOne as jest.Mock) = jest.fn().mockResolvedValue(mockPlan);

      const result = await paymentRepository.findInstallmentPlanByInvoiceId(1);

      expect(result).toBeDefined();
      expect(result?.invoiceId).toBe(1);
    });
  });

  describe('findAllInstallmentPlans', () => {
    it('should find all installment plans with filters', async () => {
      const mockPlans = [
        { installmentPlanId: 1, studentId: 1 },
        { installmentPlanId: 2, studentId: 1 }
      ] as InstallmentPlan[];

      (InstallmentPlan.findAll as jest.Mock) = jest.fn().mockResolvedValue(mockPlans);

      const result = await paymentRepository.findAllInstallmentPlans({ studentId: 1 });

      expect(result).toHaveLength(2);
    });

    it('should filter by status', async () => {
      const mockPlans = [
        { installmentPlanId: 1, status: InstallmentPlanStatus.ACTIVE }
      ] as InstallmentPlan[];

      (InstallmentPlan.findAll as jest.Mock) = jest.fn().mockResolvedValue(mockPlans);

      const result = await paymentRepository.findAllInstallmentPlans({
        status: InstallmentPlanStatus.ACTIVE
      });

      expect(result).toHaveLength(1);
    });
  });

  describe('updateInstallmentPlan', () => {
    it('should update installment plan', async () => {
      const mockPlan = {
        installmentPlanId: 1,
        status: InstallmentPlanStatus.ACTIVE,
        update: jest.fn()
      } as unknown as InstallmentPlan;

      (InstallmentPlan.findByPk as jest.Mock) = jest.fn().mockResolvedValue(mockPlan);

      const result = await paymentRepository.updateInstallmentPlan(1, {
        status: InstallmentPlanStatus.COMPLETED
      });

      expect(result).toBeDefined();
      expect(mockPlan.update).toHaveBeenCalled();
    });

    it('should return null if plan not found', async () => {
      (InstallmentPlan.findByPk as jest.Mock) = jest.fn().mockResolvedValue(null);

      const result = await paymentRepository.updateInstallmentPlan(999, {
        status: InstallmentPlanStatus.COMPLETED
      });

      expect(result).toBeNull();
    });
  });

  describe('deleteInstallmentPlan', () => {
    it('should delete installment plan', async () => {
      const mockPlan = {
        installmentPlanId: 1,
        destroy: jest.fn()
      } as unknown as InstallmentPlan;

      (InstallmentPlan.findByPk as jest.Mock) = jest.fn().mockResolvedValue(mockPlan);

      const result = await paymentRepository.deleteInstallmentPlan(1);

      expect(result).toBe(true);
      expect(mockPlan.destroy).toHaveBeenCalled();
    });

    it('should return false if plan not found', async () => {
      (InstallmentPlan.findByPk as jest.Mock) = jest.fn().mockResolvedValue(null);

      const result = await paymentRepository.deleteInstallmentPlan(999);

      expect(result).toBe(false);
    });
  });
});
