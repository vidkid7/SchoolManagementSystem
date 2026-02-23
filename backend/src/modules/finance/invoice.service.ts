import invoiceRepository, { CreateInvoiceItemData } from './invoice.repository';
import feeStructureRepository from './feeStructure.repository';
import { Invoice, InvoiceStatus } from '@models/Invoice.model';
import sequelize from '@config/database';
import { Transaction } from 'sequelize';

/**
 * Invoice Service
 * Handles business logic for invoice generation and management
 * Requirements: 9.3, 9.10
 */

export interface GenerateInvoiceParams {
  studentId: number;
  feeStructureId: number;
  academicYearId: number;
  dueDate: string;
  discount?: number;
  discountReason?: string;
}

export interface BulkGenerateInvoiceParams {
  studentIds: number[];
  feeStructureId: number;
  academicYearId: number;
  dueDate: string;
}

export interface BulkGenerateResult {
  successful: number;
  failed: number;
  errors: Array<{ studentId: number; error: string }>;
  invoices: Invoice[];
}

class InvoiceService {
  /**
   * Generate unique invoice number
   * Format: INV-{YEAR}-{SEQUENTIAL}
   * Example: INV-2081-00001
   */
  private async generateInvoiceNumber(academicYearId: number): Promise<string> {
    // Get academic year to extract year
    // For now, use current year - in production, fetch from academic year
    const year = new Date().getFullYear();
    
    // Find the last invoice number for this year
    const lastInvoice = await Invoice.findOne({
      where: { academicYearId },
      order: [['invoiceNumber', 'DESC']],
      attributes: ['invoiceNumber']
    });

    let sequential = 1;
    if (lastInvoice && lastInvoice.invoiceNumber) {
      // Extract sequential number from last invoice
      const match = lastInvoice.invoiceNumber.match(/INV-\d+-(\d+)$/);
      if (match) {
        sequential = parseInt(match[1], 10) + 1;
      }
    }

    // Format with leading zeros (5 digits)
    const sequentialStr = sequential.toString().padStart(5, '0');
    return `INV-${year}-${sequentialStr}`;
  }

  /**
   * Generate invoice from fee structure
   */
  async generateInvoice(
    params: GenerateInvoiceParams,
    transaction?: Transaction
  ): Promise<Invoice> {
    const t = transaction || await sequelize.transaction();

    try {
      // Check if invoice already exists
      const exists = await invoiceRepository.exists(
        params.studentId,
        params.feeStructureId,
        params.academicYearId
      );

      if (exists) {
        throw new Error('Invoice already exists for this student and fee structure');
      }

      // Get fee structure with components
      const feeStructure = await feeStructureRepository.findById(params.feeStructureId);
      if (!feeStructure) {
        throw new Error('Fee structure not found');
      }

      if (!feeStructure.isActive) {
        throw new Error('Fee structure is not active');
      }

      // Get fee components
      const components = await feeStructureRepository.getComponents(params.feeStructureId);
      if (!components || components.length === 0) {
        throw new Error('Fee structure has no components');
      }

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(params.academicYearId);

      // Create invoice items from fee components
      const items: CreateInvoiceItemData[] = components.map(component => ({
        feeComponentId: component.feeComponentId,
        description: component.name,
        amount: Number(component.amount)
      }));

      // Create invoice
      const invoice = await invoiceRepository.create(
        {
          invoiceNumber,
          studentId: params.studentId,
          feeStructureId: params.feeStructureId,
          academicYearId: params.academicYearId,
          dueDate: params.dueDate,
          items,
          discount: params.discount,
          discountReason: params.discountReason
        },
        t
      );

      if (!transaction) {
        await t.commit();
      }

      return invoice;
    } catch (error) {
      if (!transaction) {
        await t.rollback();
      }
      throw error;
    }
  }

  /**
   * Bulk generate invoices for multiple students
   */
  async bulkGenerateInvoices(
    params: BulkGenerateInvoiceParams
  ): Promise<BulkGenerateResult> {
    const result: BulkGenerateResult = {
      successful: 0,
      failed: 0,
      errors: [],
      invoices: []
    };

    // Process each student
    for (const studentId of params.studentIds) {
      try {
        const invoice = await this.generateInvoice({
          studentId,
          feeStructureId: params.feeStructureId,
          academicYearId: params.academicYearId,
          dueDate: params.dueDate
        });

        result.successful++;
        result.invoices.push(invoice);
      } catch (error) {
        result.failed++;
        result.errors.push({
          studentId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return result;
  }

  /**
   * Apply discount to invoice
   */
  async applyDiscount(
    invoiceId: number,
    discountAmount: number,
    reason?: string
  ): Promise<Invoice> {
    const invoice = await invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new Error('Cannot apply discount to paid invoice');
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new Error('Cannot apply discount to cancelled invoice');
    }

    const updated = await invoiceRepository.applyDiscount(
      invoiceId,
      discountAmount,
      reason
    );

    if (!updated) {
      throw new Error('Failed to apply discount');
    }

    return updated;
  }

  /**
   * Approve discount
   */
  async approveDiscount(invoiceId: number, approvedBy: number): Promise<Invoice> {
    const invoice = await invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (!invoice.requiresDiscountApproval()) {
      throw new Error('Invoice does not require discount approval');
    }

    const updated = await invoiceRepository.approveDiscount(invoiceId, approvedBy);
    if (!updated) {
      throw new Error('Failed to approve discount');
    }

    return updated;
  }

  /**
   * Reject discount
   */
  async rejectDiscount(invoiceId: number): Promise<Invoice> {
    const invoice = await invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (!invoice.requiresDiscountApproval()) {
      throw new Error('Invoice does not require discount approval');
    }

    const updated = await invoiceRepository.rejectDiscount(invoiceId);
    if (!updated) {
      throw new Error('Failed to reject discount');
    }

    return updated;
  }

  /**
   * Record payment on invoice
   */
  async recordPayment(invoiceId: number, amount: number): Promise<Invoice> {
    const invoice = await invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new Error('Invoice is already paid');
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new Error('Cannot record payment on cancelled invoice');
    }

    if (amount <= 0) {
      throw new Error('Payment amount must be positive');
    }

    if (amount > invoice.balance) {
      throw new Error('Payment amount exceeds invoice balance');
    }

    const updated = await invoiceRepository.recordPayment(invoiceId, amount);
    if (!updated) {
      throw new Error('Failed to record payment');
    }

    return updated;
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(invoiceId: number): Promise<Invoice> {
    const invoice = await invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    return invoice;
  }

  /**
   * Get invoice by invoice number
   */
  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice> {
    const invoice = await invoiceRepository.findByInvoiceNumber(invoiceNumber);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    return invoice;
  }

  /**
   * Get invoices for a student
   */
  async getStudentInvoices(studentId: number): Promise<Invoice[]> {
    return invoiceRepository.findByStudentId(studentId);
  }

  /**
   * Get pending invoices for a student
   */
  async getPendingInvoices(studentId: number): Promise<Invoice[]> {
    return invoiceRepository.findPendingByStudentId(studentId);
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(): Promise<Invoice[]> {
    return invoiceRepository.findOverdue();
  }

  /**
   * Get total outstanding balance for a student
   */
  async getStudentOutstandingBalance(studentId: number): Promise<number> {
    return invoiceRepository.getTotalOutstanding(studentId);
  }

  /**
   * Cancel invoice
   */
  async cancelInvoice(invoiceId: number): Promise<Invoice> {
    const invoice = await invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.paidAmount > 0) {
      throw new Error('Cannot cancel invoice with payments');
    }

    const updated = await invoiceRepository.cancel(invoiceId);
    if (!updated) {
      throw new Error('Failed to cancel invoice');
    }

    return updated;
  }

  /**
   * Update overdue invoices
   * Should be run daily via cron job
   */
  async updateOverdueInvoices(): Promise<number> {
    return invoiceRepository.updateOverdueInvoices();
  }

  /**
   * Get invoices pending discount approval
   */
  async getPendingDiscountApprovals(): Promise<Invoice[]> {
    return invoiceRepository.findPendingDiscountApprovals();
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(invoiceId: number): Promise<Invoice> {
    const updated = await invoiceRepository.updateStatus(invoiceId);
    if (!updated) {
      throw new Error('Failed to update invoice status');
    }
    return updated;
  }

  /**
   * Generate invoices for all students in a class
   * Note: This requires Student model integration
   */
  async generateInvoicesForClass(
    _classId: number,
    _feeStructureId: number,
    _academicYearId: number,
    _dueDate: string
  ): Promise<BulkGenerateResult> {
    // In a real implementation, we would fetch all students in the class
    // For now, this is a placeholder that would need to be integrated with Student model
    throw new Error('Not implemented: generateInvoicesForClass requires Student model integration');
  }

  /**
   * Regenerate invoice (cancel old and create new)
   */
  async regenerateInvoice(
    invoiceId: number,
    params: Partial<GenerateInvoiceParams>
  ): Promise<Invoice> {
    const t = await sequelize.transaction();

    try {
      // Get existing invoice
      const existingInvoice = await invoiceRepository.findById(invoiceId);
      if (!existingInvoice) {
        throw new Error('Invoice not found');
      }

      if (existingInvoice.paidAmount > 0) {
        throw new Error('Cannot regenerate invoice with payments');
      }

      // Cancel existing invoice
      await invoiceRepository.cancel(invoiceId, t);

      // Generate new invoice
      const newInvoice = await this.generateInvoice(
        {
          studentId: params.studentId || existingInvoice.studentId,
          feeStructureId: params.feeStructureId || existingInvoice.feeStructureId,
          academicYearId: params.academicYearId || existingInvoice.academicYearId,
          dueDate: params.dueDate || existingInvoice.dueDate,
          discount: params.discount,
          discountReason: params.discountReason
        },
        t
      );

      await t.commit();
      return newInvoice;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

export default new InvoiceService();
