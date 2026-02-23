import { Transaction } from 'sequelize';
import { Payment, PaymentAttributes, PaymentCreationAttributes, PaymentMethod, PaymentStatus } from '@models/Payment.model';
import { InstallmentPlan, InstallmentPlanAttributes, InstallmentPlanCreationAttributes } from '@models/Payment.model';

/**
 * Payment Repository
 * Handles database operations for payments and installment plans
 * 
 * Requirements: 9.5, 9.7, 9.8, 9.9, 9.11
 */

export interface PaymentFilters {
  studentId?: number;
  invoiceId?: number;
  paymentMethod?: PaymentMethod;
  status?: PaymentStatus;
  startDate?: string;
  endDate?: string;
  installmentPlanId?: number;
}

export interface PaginationOptions {
  limit: number;
  offset: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface InstallmentPlanFilters {
  studentId?: number;
  invoiceId?: number;
  status?: string;
}

class PaymentRepository {
  /**
   * Create a new payment
   */
  async create(
    paymentData: PaymentCreationAttributes,
    transaction?: Transaction
  ): Promise<Payment> {
    return Payment.create(paymentData, { transaction });
  }

  /**
   * Find payment by ID
   */
  async findById(paymentId: number): Promise<Payment | null> {
    return Payment.findByPk(paymentId, {
      include: [
        {
          association: 'installmentPlan',
          required: false
        }
      ]
    });
  }

  /**
   * Find payment by receipt number
   */
  async findByReceiptNumber(receiptNumber: string): Promise<Payment | null> {
    return Payment.findOne({
      where: { receiptNumber }
    });
  }

  /**
   * Find payment by transaction ID
   */
  async findByTransactionId(transactionId: string): Promise<Payment | null> {
    return Payment.findOne({
      where: { transactionId }
    });
  }

  /**
   * Find all payments with filters and pagination
   */
  async findAll(
    filters: PaymentFilters = {},
    pagination?: PaginationOptions
  ): Promise<{ payments: Payment[]; total: number }> {
    const where: any = {};

    if (filters.studentId) {
      where.studentId = filters.studentId;
    }

    if (filters.invoiceId) {
      where.invoiceId = filters.invoiceId;
    }

    if (filters.paymentMethod) {
      where.paymentMethod = filters.paymentMethod;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate && filters.endDate) {
      where.paymentDate = {
        $gte: filters.startDate,
        $lte: filters.endDate
      };
    } else if (filters.startDate) {
      where.paymentDate = {
        $gte: filters.startDate
      };
    } else if (filters.endDate) {
      where.paymentDate = {
        $lte: filters.endDate
      };
    }

    if (filters.installmentPlanId) {
      where.installmentPlanId = filters.installmentPlanId;
    }

    const orderBy = pagination?.orderBy || 'paymentDate';
    const orderDirection = pagination?.orderDirection || 'DESC';

    const { count, rows } = await Payment.findAndCountAll({
      where,
      order: [[orderBy, orderDirection]],
      limit: pagination?.limit,
      offset: pagination?.offset,
      include: [
        {
          association: 'installmentPlan',
          required: false
        }
      ]
    });

    return { payments: rows, total: count };
  }

  /**
   * Find payments by student ID
   */
  async findByStudentId(studentId: number): Promise<Payment[]> {
    const result = await this.findAll({ studentId });
    return result.payments;
  }

  /**
   * Find payments by invoice ID
   */
  async findByInvoiceId(invoiceId: number): Promise<Payment[]> {
    const result = await this.findAll({ invoiceId });
    return result.payments;
  }

  /**
   * Update payment
   */
  async update(
    paymentId: number,
    updates: Partial<PaymentAttributes>,
    transaction?: Transaction
  ): Promise<Payment | null> {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      return null;
    }

    await payment.update(updates, { transaction });
    return payment;
  }

  /**
   * Delete payment (soft delete if supported, otherwise hard delete)
   */
  async delete(paymentId: number, transaction?: Transaction): Promise<boolean> {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      return false;
    }

    await payment.destroy({ transaction });
    return true;
  }

  /**
   * Calculate total payments for an invoice
   */
  async getTotalPaymentsByInvoice(invoiceId: number): Promise<number> {
    const payments = await Payment.findAll({
      where: {
        invoiceId,
        status: PaymentStatus.COMPLETED
      }
    });

    return payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  }

  /**
   * Calculate total payments for a student
   */
  async getTotalPaymentsByStudent(studentId: number): Promise<number> {
    const payments = await Payment.findAll({
      where: {
        studentId,
        status: PaymentStatus.COMPLETED
      }
    });

    return payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  }

  /**
   * Get payment statistics by method
   */
  async getPaymentStatsByMethod(startDate?: string, endDate?: string): Promise<any> {
    const where: any = {
      status: PaymentStatus.COMPLETED
    };

    if (startDate && endDate) {
      where.paymentDate = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const payments = await Payment.findAll({ where });

    const stats: Record<string, { count: number; total: number }> = {};

    payments.forEach(payment => {
      const method = payment.paymentMethod;
      if (!stats[method]) {
        stats[method] = { count: 0, total: 0 };
      }
      stats[method].count++;
      stats[method].total += Number(payment.amount);
    });

    return stats;
  }

  // ==================== Installment Plan Methods ====================

  /**
   * Create installment plan
   */
  async createInstallmentPlan(
    planData: InstallmentPlanCreationAttributes,
    transaction?: Transaction
  ): Promise<InstallmentPlan> {
    return InstallmentPlan.create(planData, { transaction });
  }

  /**
   * Find installment plan by ID
   */
  async findInstallmentPlanById(planId: number): Promise<InstallmentPlan | null> {
    return InstallmentPlan.findByPk(planId, {
      include: [
        {
          association: 'payments',
          required: false
        }
      ]
    });
  }

  /**
   * Find installment plan by invoice ID
   */
  async findInstallmentPlanByInvoiceId(invoiceId: number): Promise<InstallmentPlan | null> {
    return InstallmentPlan.findOne({
      where: { invoiceId },
      include: [
        {
          association: 'payments',
          required: false
        }
      ]
    });
  }

  /**
   * Find all installment plans with filters
   */
  async findAllInstallmentPlans(filters: InstallmentPlanFilters = {}): Promise<InstallmentPlan[]> {
    const where: any = {};

    if (filters.studentId) {
      where.studentId = filters.studentId;
    }

    if (filters.invoiceId) {
      where.invoiceId = filters.invoiceId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    return InstallmentPlan.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [
        {
          association: 'payments',
          required: false
        }
      ]
    });
  }

  /**
   * Update installment plan
   */
  async updateInstallmentPlan(
    planId: number,
    updates: Partial<InstallmentPlanAttributes>,
    transaction?: Transaction
  ): Promise<InstallmentPlan | null> {
    const plan = await InstallmentPlan.findByPk(planId);
    if (!plan) {
      return null;
    }

    await plan.update(updates, { transaction });
    return plan;
  }

  /**
   * Delete installment plan
   */
  async deleteInstallmentPlan(planId: number, transaction?: Transaction): Promise<boolean> {
    const plan = await InstallmentPlan.findByPk(planId);
    if (!plan) {
      return false;
    }

    await plan.destroy({ transaction });
    return true;
  }

  /**
   * Check if receipt number exists
   */
  async receiptNumberExists(receiptNumber: string): Promise<boolean> {
    const count = await Payment.count({
      where: { receiptNumber }
    });
    return count > 0;
  }

  /**
   * Check if transaction ID exists
   */
  async transactionIdExists(transactionId: string): Promise<boolean> {
    const count = await Payment.count({
      where: { transactionId }
    });
    return count > 0;
  }

  /**
   * Get collection summary report
   */
  async getCollectionSummary(
    startDate?: string,
    endDate?: string,
    academicYearId?: number
  ): Promise<any> {
    const where: any = {
      status: PaymentStatus.COMPLETED
    };

    if (startDate && endDate) {
      where.paymentDate = {
        $gte: startDate,
        $lte: endDate
      };
    } else if (startDate) {
      where.paymentDate = {
        $gte: startDate
      };
    } else if (endDate) {
      where.paymentDate = {
        $lte: endDate
      };
    }

    const payments = await Payment.findAll({ where });

    // Calculate totals
    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalPayments = payments.length;

    // Group by payment method
    const byMethod: Record<string, { count: number; total: number }> = {};
    payments.forEach(payment => {
      const method = payment.paymentMethod;
      if (!byMethod[method]) {
        byMethod[method] = { count: 0, total: 0 };
      }
      byMethod[method].count++;
      byMethod[method].total += Number(payment.amount);
    });

    // Group by date
    const byDate: Record<string, { count: number; total: number }> = {};
    payments.forEach(payment => {
      const date = payment.paymentDate;
      if (!byDate[date]) {
        byDate[date] = { count: 0, total: 0 };
      }
      byDate[date].count++;
      byDate[date].total += Number(payment.amount);
    });

    return {
      totalAmount,
      totalPayments,
      byMethod,
      byDate,
      startDate,
      endDate,
      academicYearId
    };
  }
}

export default new PaymentRepository();
