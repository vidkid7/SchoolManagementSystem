import { Invoice, InvoiceItem, InvoiceStatus, DiscountApprovalStatus } from '@models/Invoice.model';
import { FeeComponent } from '@models/FeeStructure.model';
import { Transaction, Op } from 'sequelize';

/**
 * Invoice Repository
 * Handles database operations for invoices and invoice items
 * Requirements: 9.3, 9.10
 */

export interface CreateInvoiceData {
  invoiceNumber: string;
  studentId: number;
  feeStructureId: number;
  academicYearId: number;
  dueDate: string;
  items: CreateInvoiceItemData[];
  discount?: number;
  discountReason?: string;
}

export interface CreateInvoiceItemData {
  feeComponentId: number;
  description: string;
  amount: number;
}

export interface UpdateInvoiceData {
  dueDate?: string;
  discount?: number;
  discountReason?: string;
  status?: InvoiceStatus;
}

export interface InvoiceFilters {
  studentId?: number;
  academicYearId?: number;
  status?: InvoiceStatus;
  feeStructureId?: number;
  dueDateFrom?: string;
  dueDateTo?: string;
  isOverdue?: boolean;
}

export interface PaginationOptions {
  limit: number;
  offset: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

class InvoiceRepository {
  /**
   * Create a new invoice with items
   */
  async create(data: CreateInvoiceData, transaction?: Transaction): Promise<Invoice> {
    // Calculate subtotal from items
    const subtotal = data.items.reduce((sum, item) => sum + Number(item.amount), 0);
    const discount = data.discount || 0;
    const totalAmount = subtotal - discount;
    const balance = totalAmount; // Initially, no payment made

    // Determine initial status
    let status = InvoiceStatus.PENDING;
    const today = new Date();
    const dueDate = new Date(data.dueDate);
    if (dueDate < today) {
      status = InvoiceStatus.OVERDUE;
    }

    // Create invoice
    const invoice = await Invoice.create(
      {
        invoiceNumber: data.invoiceNumber,
        studentId: data.studentId,
        feeStructureId: data.feeStructureId,
        academicYearId: data.academicYearId,
        dueDate: data.dueDate,
        subtotal,
        discount,
        discountReason: data.discountReason,
        discountApprovalStatus: discount > 0 ? DiscountApprovalStatus.PENDING : undefined,
        totalAmount,
        paidAmount: 0,
        balance,
        status,
        generatedAt: new Date()
      },
      { transaction }
    );

    // Create invoice items
    if (data.items && data.items.length > 0) {
      await Promise.all(
        data.items.map(item =>
          InvoiceItem.create(
            {
              invoiceId: invoice.invoiceId,
              feeComponentId: item.feeComponentId,
              description: item.description,
              amount: item.amount
            },
            { transaction }
          )
        )
      );
    }

    // Reload with items
    const reloaded = await this.findById(invoice.invoiceId);
    if (!reloaded) {
      throw new Error('Failed to reload invoice after creation');
    }
    return reloaded;
  }

  /**
   * Find invoice by ID
   */
  async findById(id: number): Promise<Invoice | null> {
    return Invoice.findByPk(id, {
      include: [
        {
          model: InvoiceItem,
          as: 'invoiceItems',
          include: [
            {
              model: FeeComponent,
              as: 'feeComponent'
            }
          ]
        }
      ]
    });
  }

  /**
   * Find invoice by invoice number
   */
  async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
    return Invoice.findOne({
      where: { invoiceNumber },
      include: [
        {
          model: InvoiceItem,
          as: 'invoiceItems'
        }
      ]
    });
  }

  /**
   * Find all invoices with filters and pagination
   */
  async findAll(
    filters: InvoiceFilters = {},
    pagination?: PaginationOptions
  ): Promise<{ invoices: Invoice[]; total: number }> {
    const where: Record<string, unknown> = {};

    if (filters.studentId !== undefined) {
      where.studentId = filters.studentId;
    }

    if (filters.academicYearId !== undefined) {
      where.academicYearId = filters.academicYearId;
    }

    if (filters.status !== undefined) {
      where.status = filters.status;
    }

    if (filters.feeStructureId !== undefined) {
      where.feeStructureId = filters.feeStructureId;
    }

    if (filters.dueDateFrom || filters.dueDateTo) {
      const dueDateFilter: Record<string, string> = {};
      if (filters.dueDateFrom) {
        dueDateFilter[Op.gte as unknown as string] = filters.dueDateFrom;
      }
      if (filters.dueDateTo) {
        dueDateFilter[Op.lte as unknown as string] = filters.dueDateTo;
      }
      where.dueDate = dueDateFilter;
    }

    if (filters.isOverdue) {
      where.status = InvoiceStatus.OVERDUE;
      where.balance = {
        [Op.gt]: 0
      };
    }

    const orderBy = pagination?.orderBy || 'createdAt';
    const orderDirection = pagination?.orderDirection || 'DESC';

    const { count, rows } = await Invoice.findAndCountAll({
      where,
      include: [
        {
          model: InvoiceItem,
          as: 'invoiceItems'
        }
      ],
      order: [[orderBy, orderDirection]],
      limit: pagination?.limit,
      offset: pagination?.offset
    });

    return { invoices: rows, total: count };
  }

  /**
   * Find invoices by student ID
   */
  async findByStudentId(studentId: number): Promise<Invoice[]> {
    const result = await this.findAll({ studentId });
    return result.invoices;
  }

  /**
   * Find pending invoices for a student
   */
  async findPendingByStudentId(studentId: number): Promise<Invoice[]> {
    return Invoice.findAll({
      where: {
        studentId,
        status: {
          [Op.in]: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE]
        }
      },
      include: [
        {
          model: InvoiceItem,
          as: 'invoiceItems'
        }
      ],
      order: [['dueDate', 'ASC']]
    });
  }

  /**
   * Find overdue invoices
   */
  async findOverdue(): Promise<Invoice[]> {
    const result = await this.findAll({ isOverdue: true });
    return result.invoices;
  }

  /**
   * Update invoice
   */
  async update(
    id: number,
    data: UpdateInvoiceData,
    transaction?: Transaction
  ): Promise<Invoice | null> {
    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      return null;
    }

    await invoice.update(data, { transaction });
    return this.findById(id);
  }

  /**
   * Apply discount to invoice
   */
  async applyDiscount(
    id: number,
    discountAmount: number,
    reason?: string,
    transaction?: Transaction
  ): Promise<Invoice | null> {
    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      return null;
    }

    invoice.applyDiscount(discountAmount, reason);
    invoice.discountApprovalStatus = DiscountApprovalStatus.PENDING;
    await invoice.save({ transaction });

    return this.findById(id);
  }

  /**
   * Approve discount
   */
  async approveDiscount(
    id: number,
    approvedBy: number,
    transaction?: Transaction
  ): Promise<Invoice | null> {
    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      return null;
    }

    invoice.approveDiscount(approvedBy);
    await invoice.save({ transaction });

    return this.findById(id);
  }

  /**
   * Reject discount
   */
  async rejectDiscount(
    id: number,
    transaction?: Transaction
  ): Promise<Invoice | null> {
    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      return null;
    }

    invoice.rejectDiscount();
    await invoice.save({ transaction });

    return this.findById(id);
  }

  /**
   * Record payment on invoice
   */
  async recordPayment(
    id: number,
    amount: number,
    transaction?: Transaction
  ): Promise<Invoice | null> {
    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      return null;
    }

    invoice.recordPayment(amount);
    await invoice.save({ transaction });

    return this.findById(id);
  }

  /**
   * Update invoice status based on balance
   */
  async updateStatus(id: number, transaction?: Transaction): Promise<Invoice | null> {
    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      return null;
    }

    const newStatus = invoice.updateStatus();
    if (invoice.status !== newStatus) {
      invoice.status = newStatus;
      await invoice.save({ transaction });
    }

    return this.findById(id);
  }

  /**
   * Update all overdue invoices
   * Should be run daily to mark invoices as overdue
   */
  async updateOverdueInvoices(transaction?: Transaction): Promise<number> {
    const today = new Date().toISOString().split('T')[0];

    const [affectedCount] = await Invoice.update(
      { status: InvoiceStatus.OVERDUE },
      {
        where: {
          dueDate: {
            [Op.lt]: today
          },
          balance: {
            [Op.gt]: 0
          },
          status: {
            [Op.notIn]: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED]
          }
        },
        transaction
      }
    );

    return affectedCount;
  }

  /**
   * Cancel invoice
   */
  async cancel(id: number, transaction?: Transaction): Promise<Invoice | null> {
    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      return null;
    }

    if (invoice.paidAmount > 0) {
      throw new Error('Cannot cancel invoice with payments');
    }

    invoice.status = InvoiceStatus.CANCELLED;
    await invoice.save({ transaction });

    return this.findById(id);
  }

  /**
   * Soft delete invoice
   */
  async delete(id: number, transaction?: Transaction): Promise<boolean> {
    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      return false;
    }

    if (invoice.paidAmount > 0) {
      throw new Error('Cannot delete invoice with payments');
    }

    await invoice.destroy({ transaction });
    return true;
  }

  /**
   * Get invoice items for an invoice
   */
  async getItems(invoiceId: number): Promise<InvoiceItem[]> {
    return InvoiceItem.findAll({
      where: { invoiceId },
      include: [
        {
          model: FeeComponent,
          as: 'feeComponent'
        }
      ],
      order: [['createdAt', 'ASC']]
    });
  }

  /**
   * Check if invoice exists for student and fee structure
   */
  async exists(
    studentId: number,
    feeStructureId: number,
    academicYearId: number
  ): Promise<boolean> {
    const count = await Invoice.count({
      where: {
        studentId,
        feeStructureId,
        academicYearId,
        status: {
          [Op.notIn]: [InvoiceStatus.CANCELLED]
        }
      }
    });
    return count > 0;
  }

  /**
   * Get total outstanding balance for a student
   */
  async getTotalOutstanding(studentId: number): Promise<number> {
    const invoices = await Invoice.findAll({
      where: {
        studentId,
        status: {
          [Op.in]: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE]
        }
      },
      attributes: ['balance']
    });

    return invoices.reduce((sum, invoice) => sum + Number(invoice.balance), 0);
  }

  /**
   * Get invoices requiring discount approval
   */
  async findPendingDiscountApprovals(): Promise<Invoice[]> {
    return Invoice.findAll({
      where: {
        discountApprovalStatus: DiscountApprovalStatus.PENDING,
        discount: {
          [Op.gt]: 0
        }
      },
      include: [
        {
          model: InvoiceItem,
          as: 'invoiceItems'
        }
      ],
      order: [['createdAt', 'ASC']]
    });
  }

  /**
   * Get pending fees report
   */
  async getPendingFeesReport(
    academicYearId?: number
  ): Promise<any> {
    const where: Record<string, unknown> = {
      status: {
        [Op.in]: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE]
      },
      balance: {
        [Op.gt]: 0
      }
    };

    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    const invoices = await Invoice.findAll({
      where,
      attributes: [
        'studentId',
        'invoiceId',
        'invoiceNumber',
        'totalAmount',
        'paidAmount',
        'balance',
        'dueDate',
        'status'
      ],
      order: [['dueDate', 'ASC']]
    });

    const totalPending = invoices.reduce((sum, inv) => sum + Number(inv.balance), 0);
    const totalInvoices = invoices.length;

    return {
      totalInvoices,
      totalPending,
      invoices
    };
  }

  /**
   * Get defaulters list
   */
  async getDefaultersList(
    academicYearId?: number,
    minBalance: number = 1000
  ): Promise<any> {
    const where: Record<string, unknown> = {
      status: {
        [Op.in]: [InvoiceStatus.OVERDUE]
      },
      balance: {
        [Op.gte]: minBalance
      }
    };

    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    const invoices = await Invoice.findAll({
      where,
      attributes: [
        'studentId',
        'invoiceId',
        'invoiceNumber',
        'totalAmount',
        'paidAmount',
        'balance',
        'dueDate'
      ],
      order: [['balance', 'DESC']]
    });

    // Group by student
    const defaultersByStudent = invoices.reduce((acc: any, inv) => {
      const studentId = inv.studentId;
      if (!acc[studentId]) {
        acc[studentId] = {
          studentId,
          totalOutstanding: 0,
          invoices: []
        };
      }
      acc[studentId].totalOutstanding += Number(inv.balance);
      acc[studentId].invoices.push({
        invoiceId: inv.invoiceId,
        invoiceNumber: inv.invoiceNumber,
        balance: inv.balance,
        dueDate: inv.dueDate
      });
      return acc;
    }, {});

    const defaulters = Object.values(defaultersByStudent);
    const totalDefaulters = defaulters.length;
    const totalOutstanding = defaulters.reduce((sum: number, d: any) => sum + d.totalOutstanding, 0);

    return {
      totalDefaulters,
      totalOutstanding,
      defaulters
    };
  }
}

export default new InvoiceRepository();
