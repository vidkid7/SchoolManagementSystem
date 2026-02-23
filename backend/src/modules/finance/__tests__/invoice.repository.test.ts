import invoiceRepository from '../invoice.repository';
import { Invoice, InvoiceStatus, DiscountApprovalStatus } from '@models/Invoice.model';
import { FeeStructure, FeeComponent, FeeComponentType, FeeFrequency } from '@models/FeeStructure.model';
import sequelize from '@config/database';

describe('Invoice Repository', () => {
  let feeStructureId: number;
  let feeComponentId: number;

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
    const feeComponent = await FeeComponent.create({
      feeStructureId,
      name: 'Tuition Fee',
      type: FeeComponentType.ANNUAL,
      amount: 10000,
      frequency: FeeFrequency.ANNUAL,
      isMandatory: true
    });
    feeComponentId = feeComponent.feeComponentId;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  afterEach(async () => {
    await Invoice.destroy({ where: {}, force: true });
  });

  describe('create', () => {
    it('should create invoice with items', async () => {
      const invoice = await invoiceRepository.create({
        invoiceNumber: 'INV-2081-00001',
        studentId: 1,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01',
        items: [
          {
            feeComponentId,
            description: 'Tuition Fee',
            amount: 10000
          }
        ]
      });

      expect(invoice).toBeDefined();
      expect(invoice.invoiceNumber).toBe('INV-2081-00001');
      expect(invoice.subtotal).toBe(10000);
      expect(invoice.totalAmount).toBe(10000);
      expect(invoice.balance).toBe(10000);
      expect(invoice.status).toBe(InvoiceStatus.PENDING);
      expect(invoice.invoiceItems).toHaveLength(1);
    });

    it('should create invoice with discount', async () => {
      const invoice = await invoiceRepository.create({
        invoiceNumber: 'INV-2081-00002',
        studentId: 1,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01',
        items: [
          {
            feeComponentId,
            description: 'Tuition Fee',
            amount: 10000
          }
        ],
        discount: 1000,
        discountReason: 'Merit scholarship'
      });

      expect(invoice.discount).toBe(1000);
      expect(invoice.discountReason).toBe('Merit scholarship');
      expect(invoice.totalAmount).toBe(9000);
      expect(invoice.balance).toBe(9000);
      expect(invoice.discountApprovalStatus).toBe(DiscountApprovalStatus.PENDING);
    });

    it('should set status to OVERDUE if due date is in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);

      const invoice = await invoiceRepository.create({
        invoiceNumber: 'INV-2081-00003',
        studentId: 1,
        feeStructureId,
        academicYearId: 1,
        dueDate: pastDate.toISOString().split('T')[0],
        items: [
          {
            feeComponentId,
            description: 'Tuition Fee',
            amount: 10000
          }
        ]
      });

      expect(invoice.status).toBe(InvoiceStatus.OVERDUE);
    });
  });

  describe('findById', () => {
    it('should find invoice by ID', async () => {
      const created = await invoiceRepository.create({
        invoiceNumber: 'INV-2081-00004',
        studentId: 1,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01',
        items: [
          {
            feeComponentId,
            description: 'Tuition Fee',
            amount: 10000
          }
        ]
      });

      const found = await invoiceRepository.findById(created.invoiceId);

      expect(found).toBeDefined();
      expect(found?.invoiceNumber).toBe('INV-2081-00004');
    });

    it('should return null for non-existent ID', async () => {
      const found = await invoiceRepository.findById(99999);
      expect(found).toBeNull();
    });
  });

  describe('findByInvoiceNumber', () => {
    it('should find invoice by invoice number', async () => {
      await invoiceRepository.create({
        invoiceNumber: 'INV-2081-00005',
        studentId: 1,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01',
        items: [
          {
            feeComponentId,
            description: 'Tuition Fee',
            amount: 10000
          }
        ]
      });

      const found = await invoiceRepository.findByInvoiceNumber('INV-2081-00005');

      expect(found).toBeDefined();
      expect(found?.studentId).toBe(1);
    });
  });

  describe('applyDiscount', () => {
    it('should apply discount to invoice', async () => {
      const invoice = await invoiceRepository.create({
        invoiceNumber: 'INV-2081-00006',
        studentId: 1,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01',
        items: [
          {
            feeComponentId,
            description: 'Tuition Fee',
            amount: 10000
          }
        ]
      });

      const updated = await invoiceRepository.applyDiscount(
        invoice.invoiceId,
        1000,
        'Merit scholarship'
      );

      expect(updated).toBeDefined();
      expect(updated?.discount).toBe(1000);
      expect(updated?.discountReason).toBe('Merit scholarship');
      expect(updated?.totalAmount).toBe(9000);
      expect(updated?.balance).toBe(9000);
      expect(updated?.discountApprovalStatus).toBe(DiscountApprovalStatus.PENDING);
    });
  });

  describe('approveDiscount', () => {
    it('should approve discount', async () => {
      const invoice = await invoiceRepository.create({
        invoiceNumber: 'INV-2081-00007',
        studentId: 1,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01',
        items: [
          {
            feeComponentId,
            description: 'Tuition Fee',
            amount: 10000
          }
        ],
        discount: 1000,
        discountReason: 'Merit scholarship'
      });

      const updated = await invoiceRepository.approveDiscount(invoice.invoiceId, 1);

      expect(updated).toBeDefined();
      expect(updated?.discountApprovalStatus).toBe(DiscountApprovalStatus.APPROVED);
      expect(updated?.discountApprovedBy).toBe(1);
      expect(updated?.discountApprovedAt).toBeDefined();
    });
  });

  describe('rejectDiscount', () => {
    it('should reject discount and revert amount', async () => {
      const invoice = await invoiceRepository.create({
        invoiceNumber: 'INV-2081-00008',
        studentId: 1,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01',
        items: [
          {
            feeComponentId,
            description: 'Tuition Fee',
            amount: 10000
          }
        ],
        discount: 1000,
        discountReason: 'Merit scholarship'
      });

      const updated = await invoiceRepository.rejectDiscount(invoice.invoiceId);

      expect(updated).toBeDefined();
      expect(updated?.discount).toBe(0);
      expect(updated?.discountReason).toBeUndefined();
      expect(updated?.discountApprovalStatus).toBe(DiscountApprovalStatus.REJECTED);
      expect(updated?.totalAmount).toBe(10000);
      expect(updated?.balance).toBe(10000);
    });
  });

  describe('recordPayment', () => {
    it('should record payment and update balance', async () => {
      const invoice = await invoiceRepository.create({
        invoiceNumber: 'INV-2081-00009',
        studentId: 1,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01',
        items: [
          {
            feeComponentId,
            description: 'Tuition Fee',
            amount: 10000
          }
        ]
      });

      const updated = await invoiceRepository.recordPayment(invoice.invoiceId, 5000);

      expect(updated).toBeDefined();
      expect(updated?.paidAmount).toBe(5000);
      expect(updated?.balance).toBe(5000);
      expect(updated?.status).toBe(InvoiceStatus.PARTIAL);
    });

    it('should update status to PAID when fully paid', async () => {
      const invoice = await invoiceRepository.create({
        invoiceNumber: 'INV-2081-00010',
        studentId: 1,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01',
        items: [
          {
            feeComponentId,
            description: 'Tuition Fee',
            amount: 10000
          }
        ]
      });

      const updated = await invoiceRepository.recordPayment(invoice.invoiceId, 10000);

      expect(updated).toBeDefined();
      expect(updated?.paidAmount).toBe(10000);
      expect(updated?.balance).toBe(0);
      expect(updated?.status).toBe(InvoiceStatus.PAID);
    });
  });

  describe('findPendingByStudentId', () => {
    it('should find pending invoices for student', async () => {
      await invoiceRepository.create({
        invoiceNumber: 'INV-2081-00011',
        studentId: 1,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01',
        items: [
          {
            feeComponentId,
            description: 'Tuition Fee',
            amount: 10000
          }
        ]
      });

      await invoiceRepository.create({
        invoiceNumber: 'INV-2081-00012',
        studentId: 1,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-04-01',
        items: [
          {
            feeComponentId,
            description: 'Tuition Fee',
            amount: 10000
          }
        ]
      });

      const invoices = await invoiceRepository.findPendingByStudentId(1);

      expect(invoices).toHaveLength(2);
      expect(invoices.every(inv => inv.status !== InvoiceStatus.PAID)).toBe(true);
    });
  });

  describe('getTotalOutstanding', () => {
    it('should calculate total outstanding balance', async () => {
      await invoiceRepository.create({
        invoiceNumber: 'INV-2081-00013',
        studentId: 1,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01',
        items: [
          {
            feeComponentId,
            description: 'Tuition Fee',
            amount: 10000
          }
        ]
      });

      await invoiceRepository.create({
        invoiceNumber: 'INV-2081-00014',
        studentId: 1,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-04-01',
        items: [
          {
            feeComponentId,
            description: 'Tuition Fee',
            amount: 5000
          }
        ]
      });

      const total = await invoiceRepository.getTotalOutstanding(1);

      expect(total).toBe(15000);
    });
  });

  describe('exists', () => {
    it('should return true if invoice exists', async () => {
      await invoiceRepository.create({
        invoiceNumber: 'INV-2081-00015',
        studentId: 1,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01',
        items: [
          {
            feeComponentId,
            description: 'Tuition Fee',
            amount: 10000
          }
        ]
      });

      const exists = await invoiceRepository.exists(1, feeStructureId, 1);

      expect(exists).toBe(true);
    });

    it('should return false if invoice does not exist', async () => {
      const exists = await invoiceRepository.exists(999, feeStructureId, 1);

      expect(exists).toBe(false);
    });
  });

  describe('cancel', () => {
    it('should cancel invoice', async () => {
      const invoice = await invoiceRepository.create({
        invoiceNumber: 'INV-2081-00016',
        studentId: 1,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01',
        items: [
          {
            feeComponentId,
            description: 'Tuition Fee',
            amount: 10000
          }
        ]
      });

      const cancelled = await invoiceRepository.cancel(invoice.invoiceId);

      expect(cancelled).toBeDefined();
      expect(cancelled?.status).toBe(InvoiceStatus.CANCELLED);
    });

    it('should throw error when cancelling invoice with payments', async () => {
      const invoice = await invoiceRepository.create({
        invoiceNumber: 'INV-2081-00017',
        studentId: 1,
        feeStructureId,
        academicYearId: 1,
        dueDate: '2025-03-01',
        items: [
          {
            feeComponentId,
            description: 'Tuition Fee',
            amount: 10000
          }
        ]
      });

      await invoiceRepository.recordPayment(invoice.invoiceId, 5000);

      await expect(invoiceRepository.cancel(invoice.invoiceId)).rejects.toThrow(
        'Cannot cancel invoice with payments'
      );
    });
  });

  describe('updateOverdueInvoices', () => {
    it('should update overdue invoices', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);

      // Create invoice with past due date but PENDING status
      await Invoice.create({
        invoiceNumber: 'INV-2081-00018',
        studentId: 1,
        feeStructureId,
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

      const count = await invoiceRepository.updateOverdueInvoices();

      expect(count).toBeGreaterThan(0);

      const invoice = await invoiceRepository.findByInvoiceNumber('INV-2081-00018');
      expect(invoice?.status).toBe(InvoiceStatus.OVERDUE);
    });
  });
});
