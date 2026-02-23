import { Transaction } from 'sequelize';
import PaymentGatewayTransaction, {
  PaymentGateway,
  GatewayTransactionStatus,
  PaymentGatewayTransactionCreationAttributes,
  PaymentGatewayTransactionAttributes
} from '@models/PaymentGatewayTransaction.model';

/**
 * Payment Gateway Repository
 * Handles database operations for payment gateway transactions
 * 
 * Requirements: 32.1, 32.6, 32.7
 */

export interface GatewayTransactionFilters {
  gateway?: PaymentGateway;
  studentId?: number;
  invoiceId?: number;
  status?: GatewayTransactionStatus;
  startDate?: Date;
  endDate?: Date;
}

class PaymentGatewayRepository {
  /**
   * Create a new gateway transaction
   */
  async create(
    transactionData: PaymentGatewayTransactionCreationAttributes,
    transaction?: Transaction
  ): Promise<PaymentGatewayTransaction> {
    return PaymentGatewayTransaction.create(transactionData, { transaction });
  }

  /**
   * Find transaction by ID
   */
  async findById(transactionId: number): Promise<PaymentGatewayTransaction | null> {
    return PaymentGatewayTransaction.findByPk(transactionId);
  }

  /**
   * Find transaction by UUID
   */
  async findByUuid(transactionUuid: string): Promise<PaymentGatewayTransaction | null> {
    return PaymentGatewayTransaction.findOne({
      where: { transactionUuid }
    });
  }

  /**
   * Find transactions by invoice ID
   */
  async findByInvoiceId(invoiceId: number): Promise<PaymentGatewayTransaction[]> {
    return PaymentGatewayTransaction.findAll({
      where: { invoiceId },
      order: [['initiatedAt', 'DESC']]
    });
  }

  /**
   * Find transactions by student ID
   */
  async findByStudentId(studentId: number): Promise<PaymentGatewayTransaction[]> {
    return PaymentGatewayTransaction.findAll({
      where: { studentId },
      order: [['initiatedAt', 'DESC']]
    });
  }

  /**
   * Find all transactions with filters
   */
  async findAll(filters: GatewayTransactionFilters = {}): Promise<PaymentGatewayTransaction[]> {
    const where: any = {};

    if (filters.gateway) {
      where.gateway = filters.gateway;
    }

    if (filters.studentId) {
      where.studentId = filters.studentId;
    }

    if (filters.invoiceId) {
      where.invoiceId = filters.invoiceId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate && filters.endDate) {
      where.initiatedAt = {
        $gte: filters.startDate,
        $lte: filters.endDate
      };
    } else if (filters.startDate) {
      where.initiatedAt = {
        $gte: filters.startDate
      };
    } else if (filters.endDate) {
      where.initiatedAt = {
        $lte: filters.endDate
      };
    }

    return PaymentGatewayTransaction.findAll({
      where,
      order: [['initiatedAt', 'DESC']]
    });
  }

  /**
   * Update transaction
   */
  async update(
    transactionId: number,
    updates: Partial<PaymentGatewayTransactionAttributes>,
    transaction?: Transaction
  ): Promise<PaymentGatewayTransaction | null> {
    const gatewayTransaction = await PaymentGatewayTransaction.findByPk(transactionId);
    if (!gatewayTransaction) {
      return null;
    }

    await gatewayTransaction.update(updates, { transaction });
    return gatewayTransaction;
  }

  /**
   * Update transaction by UUID
   */
  async updateByUuid(
    transactionUuid: string,
    updates: Partial<PaymentGatewayTransactionAttributes>,
    transaction?: Transaction
  ): Promise<PaymentGatewayTransaction | null> {
    const gatewayTransaction = await this.findByUuid(transactionUuid);
    if (!gatewayTransaction) {
      return null;
    }

    await gatewayTransaction.update(updates, { transaction });
    return gatewayTransaction;
  }

  /**
   * Check if transaction UUID exists
   */
  async uuidExists(transactionUuid: string): Promise<boolean> {
    const count = await PaymentGatewayTransaction.count({
      where: { transactionUuid }
    });
    return count > 0;
  }

  /**
   * Find pending transactions for invoice
   */
  async findPendingByInvoiceId(invoiceId: number): Promise<PaymentGatewayTransaction[]> {
    return PaymentGatewayTransaction.findAll({
      where: {
        invoiceId,
        status: GatewayTransactionStatus.PENDING
      },
      order: [['initiatedAt', 'DESC']]
    });
  }

  /**
   * Find expired transactions
   */
  async findExpired(): Promise<PaymentGatewayTransaction[]> {
    const now = new Date();
    return PaymentGatewayTransaction.findAll({
      where: {
        status: GatewayTransactionStatus.PENDING,
        expiresAt: {
          $lt: now
        }
      }
    });
  }

  /**
   * Mark expired transactions
   */
  async markExpiredTransactions(): Promise<number> {
    const expiredTransactions = await this.findExpired();
    
    for (const transaction of expiredTransactions) {
      transaction.markAsExpired();
      await transaction.save();
    }

    return expiredTransactions.length;
  }

  /**
   * Get transaction statistics by gateway
   */
  async getStatsByGateway(startDate?: Date, endDate?: Date): Promise<any> {
    const where: any = {
      status: GatewayTransactionStatus.SUCCESS
    };

    if (startDate && endDate) {
      where.completedAt = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const transactions = await PaymentGatewayTransaction.findAll({ where });

    const stats: Record<string, { count: number; total: number }> = {};

    transactions.forEach(transaction => {
      const gateway = transaction.gateway;
      if (!stats[gateway]) {
        stats[gateway] = { count: 0, total: 0 };
      }
      stats[gateway].count++;
      stats[gateway].total += Number(transaction.amount);
    });

    return stats;
  }

  /**
   * Delete transaction (for testing purposes only)
   */
  async delete(transactionId: number, transaction?: Transaction): Promise<boolean> {
    const gatewayTransaction = await PaymentGatewayTransaction.findByPk(transactionId);
    if (!gatewayTransaction) {
      return false;
    }

    await gatewayTransaction.destroy({ transaction });
    return true;
  }
}

export default new PaymentGatewayRepository();
