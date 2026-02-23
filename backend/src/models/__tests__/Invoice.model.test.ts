import { Invoice, InvoiceStatus, DiscountApprovalStatus } from '../Invoice.model';
import sequelize from '@config/database';

describe('Invoice Model', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('calculateBalance', () => {
    it('should calculate balance correctly', () => {
      const invoice = Invoice.build({
        invoiceId: 1,
        invoiceNumber: 'INV-2081-00001',
        studentId: 1,
        feeStructureId: 1,
        academicYearId: 1,
        dueDate: '2025-03-01',
        subtotal: 10000,
        discount: 0,
        totalAmount: 10000,
        paidAmount: 3000,
        balance: 7000,
        status: InvoiceStatus.PARTIAL,
        generatedAt: new Date()
      });

      expect(invoice.calculateBalance()).toBe(7000);
    });

    it('should return zero balance when fully paid', () => {
      const invoice = Invoice.build({
        invoiceId: 1,
        invoiceNumber: 'INV-2081-00001',
        studentId: 1,
        feeStructureId: 1,
        academicYearId: 1,
        dueDate: '2025-03-01',
        subtotal: 10000,
        discount: 0,
        totalAmount: 10000,
        paidAmount: 10000,
        balance: 0,
        status: InvoiceStatus.PAID,
        generatedAt: new Date()
      });

      expect(invoice.calculateBalance()).toBe(0);
    });
  });

  describe('updateStatus', () => {
    it('should return PAID when balance is zero', () => {
      const invoice = Invoice.build({
        invoiceId: 1,
        invoiceNumber: 'INV-2081-00001',
        studentId: 1,
        feeStructureId: 1,
        academicYearId: 1,
        dueDate: '2025-03-01',
        subtotal: 10000,
        discount: 0,
        totalAmount: 10000,
        paidAmount: 10000,
        balance: 0,
        status: InvoiceStatus.PARTIAL,
        generatedAt: new Date()
      });

      expect(invoice.updateStatus()).toBe(InvoiceStatus.PAID);
    });

    it('should return PENDING when no payment and not overdue', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const invoice = Invoice.build({
        invoiceId: 1,
        invoiceNumber: 'INV-2081-00001',
        studentId: 1,
        feeStructureId: 1,
        academicYearId: 1,
        dueDate: futureDate.toISOString().split('T')[0],
        subtotal: 10000,
        discount: 0,
        totalAmount: 10000,
        paidAmount: 0,
        balance: 10000,
        status: InvoiceStatus.PENDING,
        generatedAt: new Date()
      });

      expect(invoice.updateStatus()).toBe(InvoiceStatus.PENDING);
    });

    it('should return OVERDUE when no payment and past due date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);

      const invoice = Invoice.build({
        invoiceId: 1,
        invoiceNumber: 'INV-2081-00001',
        studentId: 1,
        feeStructureId: 1,
        academicYearId: 1,
        dueDate: pastDate.toISOString().split('T')[0],
        subtotal: 10000,
        discount: 0,
        totalAmount: 10000,
        paidAmount: 0,
        balance: 10000,
        status: InvoiceStatus.PENDING,
        generatedAt: new Date()
      });

      expect(invoice.updateStatus()).toBe(InvoiceStatus.OVERDUE);
    });

    it('should return PARTIAL when partial payment and not overdue', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const invoice = Invoice.build({
        invoiceId: 1,
        invoiceNumber: 'INV-2081-00001',
        studentId: 1,
        feeStructureId: 1,
        academicYearId: 1,
        dueDate: futureDate.toISOString().split('T')[0],
        subtotal: 10000,
        discount: 0,
        totalAmount: 10000,
        paidAmount: 5000,
        balance: 5000,
        status: InvoiceStatus.PENDING,
        generatedAt: new Date()
      });

      expect(invoice.updateStatus()).toBe(InvoiceStatus.PARTIAL);
    });

    it('should return OVERDUE when partial payment and past due date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);

      const invoice = Invoice.build({
        invoiceId: 1,
        invoiceNumber: 'INV-2081-00001',
        studentId: 1,
        feeStructureId: 1,
        academicYearId: 1,
        dueDate: pastDate.toISOString().split('T')[0],
        subtotal: 10000,
        discount: 0,
        totalAmount: 10000,
        paidAmount: 5000,
        balance: 5000,
        status: InvoiceStatus.PARTIAL,
        generatedAt: new Date()
      });

      expect(invoice.updateStatus()).toBe(InvoiceStatus.OVERDUE);
    });
  });

  describe('applyDiscount', () => {
    it('should apply discount correctly', () => {
      const invoice = Invoice.build({
        invoiceId: 1,
        invoiceNumber: 'INV-2081-00001',
        studentId: 1,
        feeStructureId: 1,
        academicYearId: 1,
        dueDate: '2025-03-01',
        subtotal: 10000,
        discount: 0,
        totalAmount: 10000,
        paidAmount: 0,
        balance: 10000,
        status: InvoiceStatus.PENDING,
        generatedAt: new Date()
      });

      invoice.applyDiscount(1000, 'Merit scholarship');

      expect(invoice.discount).toBe(1000);
      expect(invoice.discountReason).toBe('Merit scholarship');
      expect(invoice.totalAmount).toBe(9000);
      expect(invoice.balance).toBe(9000);
    });

    it('should throw error for negative discount', () => {
      const invoice = Invoice.build({
        invoiceId: 1,
        invoiceNumber: 'INV-2081-00001',
        studentId: 1,
        feeStructureId: 1,
        academicYearId: 1,
        dueDate: '2025-03-01',
        subtotal: 10000,
        discount: 0,
        totalAmount: 10000,
        paidAmount: 0,
        balance: 10000,
        status: InvoiceStatus.PENDING,
        generatedAt: new Date()
      });

      expect(() => invoice.applyDiscount(-1000)).toThrow('Discount amount cannot be negative');
    });

    it('should throw error when discount exceeds subtotal', () => {
      const invoice = Invoice.build({
        invoiceId: 1,
        invoiceNumber: 'INV-2081-00001',
        studentId: 1,
        feeStructureId: 1,
        academicYearId: 1,
        dueDate: '2025-03-01',
        subtotal: 10000,
        discount: 0,
        totalAmount: 10000,
        paidAmount: 0,
        balance: 10000,
        status: InvoiceStatus.PENDING,
        generatedAt: new Date()
      });

      expect(() => invoice.applyDiscount(15000)).toThrow('Discount amount cannot exceed subtotal');
    });
  });

  describe('recordPayment', () => {
    it('should record payment correctly', () => {
      const invoice = Invoice.build({
        invoiceId: 1,
        invoiceNumber: 'INV-2081-00001',
        studentId: 1,
        feeStructureId: 1,
        academicYearId: 1,
        dueDate: '2025-03-01',
        subtotal: 10000,
        discount: 0,
        totalAmount: 10000,
        paidAmount: 0,
        balance: 10000,
        status: InvoiceStatus.PENDING,
        generatedAt: new Date()
      });

      invoice.recordPayment(5000);

      expect(invoice.paidAmount).toBe(5000);
      expect(invoice.balance).toBe(5000);
      expect(invoice.status).toBe(InvoiceStatus.PARTIAL);
    });

    it('should update status to PAID when fully paid', () => {
      const invoice = Invoice.build({
        invoiceId: 1,
        invoiceNumber: 'INV-2081-00001',
        studentId: 1,
        feeStructureId: 1,
        academicYearId: 1,
        dueDate: '2025-03-01',
        subtotal: 10000,
        discount: 0,
        totalAmount: 10000,
        paidAmount: 0,
        balance: 10000,
        status: InvoiceStatus.PENDING,
        generatedAt: new Date()
      });

      invoice.recordPayment(10000);

      expect(invoice.paidAmount).toBe(10000);
      expect(invoice.balance).toBe(0);
      expect(invoice.status).toBe(InvoiceStatus.PAID);
    });

    it('should throw error for negative payment', () => {
      const invoice = Invoice.build({
        invoiceId: 1,
        invoiceNumber: 'INV-2081-00001',
        studentId: 1,
        feeStructureId: 1,
        academicYearId: 1,
        dueDate: '2025-03-01',
        subtotal: 10000,
        discount: 0,
        totalAmount: 10000,
        paidAmount: 0,
        balance: 10000,
        status: InvoiceStatus.PENDING,
        generatedAt: new Date()
      });

      expect(() => invoice.recordPayment(-1000)).toThrow('Payment amount cannot be negative');
    });

    it('should throw error when payment exceeds balance', () => {
      const invoice = Invoice.build({
        invoiceId: 1,
        invoiceNumber: 'INV-2081-00001',
        studentId: 1,
        feeStructureId: 1,
        academicYearId: 1,
        dueDate: '2025-03-01',
        subtotal: 10000,
        discount: 0,
        totalAmount: 10000,
        paidAmount: 0,
        balance: 10000,
        status: InvoiceStatus.PENDING,
        generatedAt: new Date()
      });

      expect(() => invoice.recordPayment(15000)).toThrow('Payment amount cannot exceed balance');
    });
  });

  describe('isOverdue', () => {
    it('should return true when past due date with balance', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);

      const invoice = Invoice.build({
        invoiceId: 1,
        invoiceNumber: 'INV-2081-00001',
        studentId: 1,
        feeStructureId: 1,
        academicYearId: 1,
        dueDate: pastDate.toISOString().split('T')[0],
        subtotal: 10000,
        discount: 0,
        totalAmount: 10000,
        paidAmount: 0,
        balance: 10000,
        status: InvoiceStatus.OVERDUE,
        generatedAt: new Date()
      });

      expect(invoice.isOverdue()).toBe(true);
    });

    it('should return false when not past due date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const invoice = Invoice.build({
        invoiceId: 1,
        invoiceNumber: 'INV-2081-00001',
        studentId: 1,
        feeStructureId: 1,
        academicYearId: 1,
        dueDate: futureDate.toISOString().split('T')[0],
        subtotal: 10000,
        discount: 0,
        totalAmount: 10000,
        paidAmount: 0,
        balance: 10000,
        status: InvoiceStatus.PENDING,
        generatedAt: new Date()
      });

      expect(invoice.isOverdue()).toBe(false);
    });

    it('should return false when fully paid even if past due date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);

      const invoice = Invoice.build({
        invoiceId: 1,
        invoiceNumber: 'INV-2081-00001',
        studentId: 1,
        feeStructureId: 1,
        academicYearId: 1,
        dueDate: pastDate.toISOString().split('T')[0],
        subtotal: 10000,
        discount: 0,
        totalAmount: 10000,
        paidAmount: 10000,
        balance: 0,
        status: InvoiceStatus.PAID,
        generatedAt: new Date()
      });

      expect(invoice.isOverdue()).toBe(false);
    });
  });

  describe('discount approval', () => {
    it('should require approval when discount is applied', () => {
      const invoice = Invoice.build({
        invoiceId: 1,
        invoiceNumber: 'INV-2081-00001',
        studentId: 1,
        feeStructureId: 1,
        academicYearId: 1,
        dueDate: '2025-03-01',
        subtotal: 10000,
        discount: 1000,
        discountApprovalStatus: DiscountApprovalStatus.PENDING,
        totalAmount: 9000,
        paidAmount: 0,
        balance: 9000,
        status: InvoiceStatus.PENDING,
        generatedAt: new Date()
      });

      expect(invoice.requiresDiscountApproval()).toBe(true);
    });

    it('should not require approval when no discount', () => {
      const invoice = Invoice.build({
        invoiceId: 1,
        invoiceNumber: 'INV-2081-00001',
        studentId: 1,
        feeStructureId: 1,
        academicYearId: 1,
        dueDate: '2025-03-01',
        subtotal: 10000,
        discount: 0,
        totalAmount: 10000,
        paidAmount: 0,
        balance: 10000,
        status: InvoiceStatus.PENDING,
        generatedAt: new Date()
      });

      expect(invoice.requiresDiscountApproval()).toBe(false);
    });

    it('should approve discount correctly', () => {
      const invoice = Invoice.build({
        invoiceId: 1,
        invoiceNumber: 'INV-2081-00001',
        studentId: 1,
        feeStructureId: 1,
        academicYearId: 1,
        dueDate: '2025-03-01',
        subtotal: 10000,
        discount: 1000,
        discountApprovalStatus: DiscountApprovalStatus.PENDING,
        totalAmount: 9000,
        paidAmount: 0,
        balance: 9000,
        status: InvoiceStatus.PENDING,
        generatedAt: new Date()
      });

      invoice.approveDiscount(1);

      expect(invoice.discountApprovalStatus).toBe(DiscountApprovalStatus.APPROVED);
      expect(invoice.discountApprovedBy).toBe(1);
      expect(invoice.discountApprovedAt).toBeDefined();
    });

    it('should reject discount and revert amount', () => {
      const invoice = Invoice.build({
        invoiceId: 1,
        invoiceNumber: 'INV-2081-00001',
        studentId: 1,
        feeStructureId: 1,
        academicYearId: 1,
        dueDate: '2025-03-01',
        subtotal: 10000,
        discount: 1000,
        discountApprovalStatus: DiscountApprovalStatus.PENDING,
        totalAmount: 9000,
        paidAmount: 0,
        balance: 9000,
        status: InvoiceStatus.PENDING,
        generatedAt: new Date()
      });

      invoice.rejectDiscount();

      expect(invoice.discount).toBe(0);
      expect(invoice.discountReason).toBeUndefined();
      expect(invoice.discountApprovalStatus).toBe(DiscountApprovalStatus.REJECTED);
      expect(invoice.totalAmount).toBe(10000);
      expect(invoice.balance).toBe(10000);
    });
  });
});
