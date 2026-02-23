import invoiceService from '../invoice.service';
import invoiceRepository from '../invoice.repository';
import { Invoice, InvoiceStatus } from '@models/Invoice.model';
import { FeeStructure, FeeComponent, FeeComponentType, FeeFrequency } from '@models/FeeStructure.model';
import sequelize from '@config/database';

describe('Invoice Service', () => {
  let feeStructureId: number;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create test fee structure
    const feeStructure = await FeeStructure.create({
      name: 'Test Fee Structure',
      applicableClasses: [1, 2, 3],
      applicableShifts: ['morning'],
      academicYearId: 1,
      totalAmount: 10000,
      isActive: true
    });
    feeStructureId = feeStructure.feeStructureId;

    // Create test fee component
    await FeeComponent.create({
      feeStructureId,
      name: 'Tuition Fee',
      type: FeeComponentType.ANNUAL,
      amount: 10000,
      frequency: FeeFrequency.ANNUAL,
      isMandatory: true
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  afterEach(async () => {
    await Invoice.destroy({ where: {}, force: true });
  });

  describe('generateInvoice', () => {
    it('should generate invoice from fee structure', async () => {
      const invoice = await invoiceService.generateInvoice({
        studentId: 1,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01'
      });

      expect(invoice).toBeDefined();
      expect(invoice.invoiceNumber).toMatch(/^INV-\d+-\d+$/);
      expect(invoice.studentId).toBe(1);
      expect(invoice.subtotal).toBe(10000);
      expect(invoice.totalAmount).toBe(10000);
      expect(invoice.balance).toBe(10000);
      expect(invoice.invoiceItems).toHaveLength(1);
    });

    it('should generate invoice with discount', async () => {
      const invoice = await invoiceService.generateInvoice({
        studentId: 2,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01',
        discount: 1000,
        discountReason: 'Merit scholarship'
      });

      expect(invoice.discount).toBe(1000);
      expect(invoice.discountReason).toBe('Merit scholarship');
      expect(invoice.totalAmount).toBe(9000);
    });

    it('should throw error if invoice already exists', async () => {
      await invoiceService.generateInvoice({
        studentId: 3,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01'
      });

      await expect(
        invoiceService.generateInvoice({
          studentId: 3,
          feeStructureId,
          academicYearId: 1,
          dueDate: '2025-03-01'
        })
      ).rejects.toThrow('Invoice already exists for this student and fee structure');
    });

    it('should throw error if fee structure not found', async () => {
      await expect(
        invoiceService.generateInvoice({
          studentId: 4,
          feeStructureId: 99999,
          academicYearId: 1,
          dueDate: '2025-03-01'
        })
      ).rejects.toThrow('Fee structure not found');
    });

    it('should throw error if fee structure is inactive', async () => {
      const inactiveFeeStructure = await FeeStructure.create({
        name: 'Inactive Fee Structure',
        applicableClasses: [1],
        applicableShifts: ['morning'],
        academicYearId: 1,
        totalAmount: 5000,
        isActive: false
      });

      await expect(
        invoiceService.generateInvoice({
          studentId: 5,
          feeStructureId: inactiveFeeStructure.feeStructureId,
          academicYearId: 1,
          dueDate: '2025-03-01'
        })
      ).rejects.toThrow('Fee structure is not active');
    });
  });

  describe('bulkGenerateInvoices', () => {
    it('should generate invoices for multiple students', async () => {
      const result = await invoiceService.bulkGenerateInvoices({
        studentIds: [10, 11, 12],
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01'
      });

      expect(result.successful).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.invoices).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle partial failures', async () => {
      // Create invoice for student 20 first
      await invoiceService.generateInvoice({
        studentId: 20,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01'
      });

      const result = await invoiceService.bulkGenerateInvoices({
        studentIds: [20, 21, 22],
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01'
      });

      expect(result.successful).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.invoices).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].studentId).toBe(20);
    });
  });

  describe('applyDiscount', () => {
    it('should apply discount to invoice', async () => {
      const invoice = await invoiceService.generateInvoice({
        studentId: 30,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01'
      });

      const updated = await invoiceService.applyDiscount(
        invoice.invoiceId,
        1000,
        'Merit scholarship'
      );

      expect(updated.discount).toBe(1000);
      expect(updated.discountReason).toBe('Merit scholarship');
      expect(updated.totalAmount).toBe(9000);
    });

    it('should throw error for paid invoice', async () => {
      const invoice = await invoiceService.generateInvoice({
        studentId: 31,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01'
      });

      await invoiceRepository.recordPayment(invoice.invoiceId, 10000);

      await expect(
        invoiceService.applyDiscount(invoice.invoiceId, 1000)
      ).rejects.toThrow('Cannot apply discount to paid invoice');
    });
  });

  describe('approveDiscount', () => {
    it('should approve discount', async () => {
      const invoice = await invoiceService.generateInvoice({
        studentId: 40,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01',
        discount: 1000,
        discountReason: 'Merit scholarship'
      });

      const updated = await invoiceService.approveDiscount(invoice.invoiceId, 1);

      expect(updated.discountApprovalStatus).toBe('approved');
      expect(updated.discountApprovedBy).toBe(1);
    });

    it('should throw error if no discount to approve', async () => {
      const invoice = await invoiceService.generateInvoice({
        studentId: 41,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01'
      });

      await expect(
        invoiceService.approveDiscount(invoice.invoiceId, 1)
      ).rejects.toThrow('Invoice does not require discount approval');
    });
  });

  describe('rejectDiscount', () => {
    it('should reject discount', async () => {
      const invoice = await invoiceService.generateInvoice({
        studentId: 50,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01',
        discount: 1000,
        discountReason: 'Merit scholarship'
      });

      const updated = await invoiceService.rejectDiscount(invoice.invoiceId);

      expect(updated.discount).toBe(0);
      expect(updated.totalAmount).toBe(10000);
    });
  });

  describe('recordPayment', () => {
    it('should record payment', async () => {
      const invoice = await invoiceService.generateInvoice({
        studentId: 60,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01'
      });

      const updated = await invoiceService.recordPayment(invoice.invoiceId, 5000);

      expect(updated.paidAmount).toBe(5000);
      expect(updated.balance).toBe(5000);
      expect(updated.status).toBe(InvoiceStatus.PARTIAL);
    });

    it('should throw error for negative payment', async () => {
      const invoice = await invoiceService.generateInvoice({
        studentId: 61,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01'
      });

      await expect(
        invoiceService.recordPayment(invoice.invoiceId, -1000)
      ).rejects.toThrow('Payment amount must be positive');
    });

    it('should throw error when payment exceeds balance', async () => {
      const invoice = await invoiceService.generateInvoice({
        studentId: 62,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01'
      });

      await expect(
        invoiceService.recordPayment(invoice.invoiceId, 15000)
      ).rejects.toThrow('Payment amount exceeds invoice balance');
    });
  });

  describe('getStudentOutstandingBalance', () => {
    it('should calculate total outstanding balance', async () => {
      await invoiceService.generateInvoice({
        studentId: 70,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01'
      });

      await invoiceService.generateInvoice({
        studentId: 70,
        feeStructureId,
        academicYearId: 2,
        dueDate: '2025-04-01'
      });

      const total = await invoiceService.getStudentOutstandingBalance(70);

      expect(total).toBe(20000);
    });
  });

  describe('cancelInvoice', () => {
    it('should cancel invoice', async () => {
      const invoice = await invoiceService.generateInvoice({
        studentId: 80,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01'
      });

      const cancelled = await invoiceService.cancelInvoice(invoice.invoiceId);

      expect(cancelled.status).toBe(InvoiceStatus.CANCELLED);
    });

    it('should throw error when cancelling invoice with payments', async () => {
      const invoice = await invoiceService.generateInvoice({
        studentId: 81,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01'
      });

      await invoiceRepository.recordPayment(invoice.invoiceId, 5000);

      await expect(
        invoiceService.cancelInvoice(invoice.invoiceId)
      ).rejects.toThrow('Cannot cancel invoice with payments');
    });
  });

  describe('regenerateInvoice', () => {
    it('should regenerate invoice', async () => {
      const invoice = await invoiceService.generateInvoice({
        studentId: 90,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01'
      });

      const regenerated = await invoiceService.regenerateInvoice(invoice.invoiceId, {
        dueDate: '2025-04-01'
      });

      expect(regenerated.invoiceId).not.toBe(invoice.invoiceId);
      expect(regenerated.dueDate).toBe('2025-04-01');

      // Check old invoice is cancelled
      const oldInvoice = await invoiceRepository.findById(invoice.invoiceId);
      expect(oldInvoice?.status).toBe(InvoiceStatus.CANCELLED);
    });

    it('should throw error when regenerating invoice with payments', async () => {
      const invoice = await invoiceService.generateInvoice({
        studentId: 91,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01'
      });

      await invoiceRepository.recordPayment(invoice.invoiceId, 5000);

      await expect(
        invoiceService.regenerateInvoice(invoice.invoiceId, {})
      ).rejects.toThrow('Cannot regenerate invoice with payments');
    });
  });
});
