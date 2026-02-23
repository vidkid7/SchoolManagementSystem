import paymentGatewayRepository from '../paymentGateway.repository';
import PaymentGatewayTransaction, {
  PaymentGateway,
  GatewayTransactionStatus
} from '@models/PaymentGatewayTransaction.model';

/**
 * Payment Gateway Repository Tests
 * Tests for payment gateway repository methods
 * 
 * Requirements: 32.1, 32.6, 32.7
 */

// Mock the model
jest.mock('@models/PaymentGatewayTransaction.model');

describe('PaymentGatewayRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new gateway transaction', async () => {
      const transactionData = {
        transactionUuid: 'test-uuid-123',
        gateway: PaymentGateway.ESEWA,
        invoiceId: 1,
        studentId: 1,
        amount: 1000,
        productCode: 'EPAYTEST',
        expiresAt: new Date()
      };

      const mockTransaction = { ...transactionData, transactionId: 1 };
      (PaymentGatewayTransaction.create as jest.Mock).mockResolvedValue(mockTransaction);

      const result = await paymentGatewayRepository.create(transactionData);

      expect(result).toEqual(mockTransaction);
      expect(PaymentGatewayTransaction.create).toHaveBeenCalledWith(transactionData, { transaction: undefined });
    });

    it('should create transaction with database transaction', async () => {
      const transactionData = {
        transactionUuid: 'test-uuid-123',
        gateway: PaymentGateway.ESEWA,
        invoiceId: 1,
        studentId: 1,
        amount: 1000,
        productCode: 'EPAYTEST',
        expiresAt: new Date()
      };

      const dbTransaction = { commit: jest.fn(), rollback: jest.fn() };
      const mockTransaction = { ...transactionData, transactionId: 1 };
      (PaymentGatewayTransaction.create as jest.Mock).mockResolvedValue(mockTransaction);

      await paymentGatewayRepository.create(transactionData, dbTransaction as any);

      expect(PaymentGatewayTransaction.create).toHaveBeenCalledWith(transactionData, { transaction: dbTransaction });
    });
  });

  describe('findById', () => {
    it('should find transaction by ID', async () => {
      const mockTransaction = {
        transactionId: 1,
        transactionUuid: 'test-uuid-123',
        gateway: PaymentGateway.ESEWA
      };

      (PaymentGatewayTransaction.findByPk as jest.Mock).mockResolvedValue(mockTransaction);

      const result = await paymentGatewayRepository.findById(1);

      expect(result).toEqual(mockTransaction);
      expect(PaymentGatewayTransaction.findByPk).toHaveBeenCalledWith(1);
    });

    it('should return null if transaction not found', async () => {
      (PaymentGatewayTransaction.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await paymentGatewayRepository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByUuid', () => {
    it('should find transaction by UUID', async () => {
      const mockTransaction = {
        transactionId: 1,
        transactionUuid: 'test-uuid-123',
        gateway: PaymentGateway.ESEWA
      };

      (PaymentGatewayTransaction.findOne as jest.Mock).mockResolvedValue(mockTransaction);

      const result = await paymentGatewayRepository.findByUuid('test-uuid-123');

      expect(result).toEqual(mockTransaction);
      expect(PaymentGatewayTransaction.findOne).toHaveBeenCalledWith({
        where: { transactionUuid: 'test-uuid-123' }
      });
    });

    it('should return null if transaction not found', async () => {
      (PaymentGatewayTransaction.findOne as jest.Mock).mockResolvedValue(null);

      const result = await paymentGatewayRepository.findByUuid('non-existent-uuid');

      expect(result).toBeNull();
    });
  });

  describe('findByInvoiceId', () => {
    it('should find all transactions for an invoice', async () => {
      const mockTransactions = [
        { transactionId: 1, invoiceId: 1, transactionUuid: 'uuid-1' },
        { transactionId: 2, invoiceId: 1, transactionUuid: 'uuid-2' }
      ];

      (PaymentGatewayTransaction.findAll as jest.Mock).mockResolvedValue(mockTransactions);

      const result = await paymentGatewayRepository.findByInvoiceId(1);

      expect(result).toEqual(mockTransactions);
      expect(PaymentGatewayTransaction.findAll).toHaveBeenCalledWith({
        where: { invoiceId: 1 },
        order: [['initiatedAt', 'DESC']]
      });
    });
  });

  describe('findByStudentId', () => {
    it('should find all transactions for a student', async () => {
      const mockTransactions = [
        { transactionId: 1, studentId: 1, transactionUuid: 'uuid-1' },
        { transactionId: 2, studentId: 1, transactionUuid: 'uuid-2' }
      ];

      (PaymentGatewayTransaction.findAll as jest.Mock).mockResolvedValue(mockTransactions);

      const result = await paymentGatewayRepository.findByStudentId(1);

      expect(result).toEqual(mockTransactions);
      expect(PaymentGatewayTransaction.findAll).toHaveBeenCalledWith({
        where: { studentId: 1 },
        order: [['initiatedAt', 'DESC']]
      });
    });
  });

  describe('findAll', () => {
    it('should find all transactions without filters', async () => {
      const mockTransactions = [
        { transactionId: 1, transactionUuid: 'uuid-1' },
        { transactionId: 2, transactionUuid: 'uuid-2' }
      ];

      (PaymentGatewayTransaction.findAll as jest.Mock).mockResolvedValue(mockTransactions);

      const result = await paymentGatewayRepository.findAll();

      expect(result).toEqual(mockTransactions);
      expect(PaymentGatewayTransaction.findAll).toHaveBeenCalledWith({
        where: {},
        order: [['initiatedAt', 'DESC']]
      });
    });

    it('should filter by gateway', async () => {
      const mockTransactions = [{ transactionId: 1, gateway: PaymentGateway.ESEWA }];

      (PaymentGatewayTransaction.findAll as jest.Mock).mockResolvedValue(mockTransactions);

      await paymentGatewayRepository.findAll({ gateway: PaymentGateway.ESEWA });

      expect(PaymentGatewayTransaction.findAll).toHaveBeenCalledWith({
        where: { gateway: PaymentGateway.ESEWA },
        order: [['initiatedAt', 'DESC']]
      });
    });

    it('should filter by status', async () => {
      const mockTransactions = [{ transactionId: 1, status: GatewayTransactionStatus.PENDING }];

      (PaymentGatewayTransaction.findAll as jest.Mock).mockResolvedValue(mockTransactions);

      await paymentGatewayRepository.findAll({ status: GatewayTransactionStatus.PENDING });

      expect(PaymentGatewayTransaction.findAll).toHaveBeenCalledWith({
        where: { status: GatewayTransactionStatus.PENDING },
        order: [['initiatedAt', 'DESC']]
      });
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      (PaymentGatewayTransaction.findAll as jest.Mock).mockResolvedValue([]);

      await paymentGatewayRepository.findAll({ startDate, endDate });

      expect(PaymentGatewayTransaction.findAll).toHaveBeenCalledWith({
        where: {
          initiatedAt: {
            $gte: startDate,
            $lte: endDate
          }
        },
        order: [['initiatedAt', 'DESC']]
      });
    });
  });

  describe('update', () => {
    it('should update transaction', async () => {
      const mockTransaction = {
        transactionId: 1,
        status: GatewayTransactionStatus.PENDING,
        update: jest.fn().mockResolvedValue(true)
      };

      (PaymentGatewayTransaction.findByPk as jest.Mock).mockResolvedValue(mockTransaction);

      const updates = { status: GatewayTransactionStatus.SUCCESS };
      const result = await paymentGatewayRepository.update(1, updates);

      expect(result).toEqual(mockTransaction);
      expect(mockTransaction.update).toHaveBeenCalledWith(updates, { transaction: undefined });
    });

    it('should return null if transaction not found', async () => {
      (PaymentGatewayTransaction.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await paymentGatewayRepository.update(999, { status: GatewayTransactionStatus.SUCCESS });

      expect(result).toBeNull();
    });
  });

  describe('updateByUuid', () => {
    it('should update transaction by UUID', async () => {
      const mockTransaction = {
        transactionUuid: 'test-uuid-123',
        status: GatewayTransactionStatus.PENDING,
        update: jest.fn().mockResolvedValue(true)
      };

      (PaymentGatewayTransaction.findOne as jest.Mock).mockResolvedValue(mockTransaction);

      const updates = { status: GatewayTransactionStatus.SUCCESS };
      const result = await paymentGatewayRepository.updateByUuid('test-uuid-123', updates);

      expect(result).toEqual(mockTransaction);
      expect(mockTransaction.update).toHaveBeenCalledWith(updates, { transaction: undefined });
    });
  });

  describe('uuidExists', () => {
    it('should return true if UUID exists', async () => {
      (PaymentGatewayTransaction.count as jest.Mock).mockResolvedValue(1);

      const result = await paymentGatewayRepository.uuidExists('test-uuid-123');

      expect(result).toBe(true);
      expect(PaymentGatewayTransaction.count).toHaveBeenCalledWith({
        where: { transactionUuid: 'test-uuid-123' }
      });
    });

    it('should return false if UUID does not exist', async () => {
      (PaymentGatewayTransaction.count as jest.Mock).mockResolvedValue(0);

      const result = await paymentGatewayRepository.uuidExists('non-existent-uuid');

      expect(result).toBe(false);
    });
  });

  describe('findPendingByInvoiceId', () => {
    it('should find pending transactions for invoice', async () => {
      const mockTransactions = [
        { transactionId: 1, invoiceId: 1, status: GatewayTransactionStatus.PENDING }
      ];

      (PaymentGatewayTransaction.findAll as jest.Mock).mockResolvedValue(mockTransactions);

      const result = await paymentGatewayRepository.findPendingByInvoiceId(1);

      expect(result).toEqual(mockTransactions);
      expect(PaymentGatewayTransaction.findAll).toHaveBeenCalledWith({
        where: {
          invoiceId: 1,
          status: GatewayTransactionStatus.PENDING
        },
        order: [['initiatedAt', 'DESC']]
      });
    });
  });

  describe('findExpired', () => {
    it('should find expired transactions', async () => {
      const mockTransactions = [
        { transactionId: 1, status: GatewayTransactionStatus.PENDING, expiresAt: new Date('2024-01-01') }
      ];

      (PaymentGatewayTransaction.findAll as jest.Mock).mockResolvedValue(mockTransactions);

      const result = await paymentGatewayRepository.findExpired();

      expect(result).toEqual(mockTransactions);
      expect(PaymentGatewayTransaction.findAll).toHaveBeenCalledWith({
        where: {
          status: GatewayTransactionStatus.PENDING,
          expiresAt: {
            $lt: expect.any(Date)
          }
        }
      });
    });
  });

  describe('markExpiredTransactions', () => {
    it('should mark expired transactions', async () => {
      const mockTransaction1 = {
        transactionId: 1,
        markAsExpired: jest.fn(),
        save: jest.fn()
      };

      const mockTransaction2 = {
        transactionId: 2,
        markAsExpired: jest.fn(),
        save: jest.fn()
      };

      (PaymentGatewayTransaction.findAll as jest.Mock).mockResolvedValue([
        mockTransaction1,
        mockTransaction2
      ]);

      const count = await paymentGatewayRepository.markExpiredTransactions();

      expect(count).toBe(2);
      expect(mockTransaction1.markAsExpired).toHaveBeenCalled();
      expect(mockTransaction1.save).toHaveBeenCalled();
      expect(mockTransaction2.markAsExpired).toHaveBeenCalled();
      expect(mockTransaction2.save).toHaveBeenCalled();
    });

    it('should return 0 if no expired transactions', async () => {
      (PaymentGatewayTransaction.findAll as jest.Mock).mockResolvedValue([]);

      const count = await paymentGatewayRepository.markExpiredTransactions();

      expect(count).toBe(0);
    });
  });

  describe('getStatsByGateway', () => {
    it('should calculate statistics by gateway', async () => {
      const mockTransactions = [
        { gateway: PaymentGateway.ESEWA, amount: 1000 },
        { gateway: PaymentGateway.ESEWA, amount: 2000 },
        { gateway: PaymentGateway.KHALTI, amount: 1500 }
      ];

      (PaymentGatewayTransaction.findAll as jest.Mock).mockResolvedValue(mockTransactions);

      const stats = await paymentGatewayRepository.getStatsByGateway();

      expect(stats).toEqual({
        esewa: { count: 2, total: 3000 },
        khalti: { count: 1, total: 1500 }
      });
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      (PaymentGatewayTransaction.findAll as jest.Mock).mockResolvedValue([]);

      await paymentGatewayRepository.getStatsByGateway(startDate, endDate);

      expect(PaymentGatewayTransaction.findAll).toHaveBeenCalledWith({
        where: {
          status: GatewayTransactionStatus.SUCCESS,
          completedAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      });
    });
  });

  describe('delete', () => {
    it('should delete transaction', async () => {
      const mockTransaction = {
        transactionId: 1,
        destroy: jest.fn()
      };

      (PaymentGatewayTransaction.findByPk as jest.Mock).mockResolvedValue(mockTransaction);

      const result = await paymentGatewayRepository.delete(1);

      expect(result).toBe(true);
      expect(mockTransaction.destroy).toHaveBeenCalledWith({ transaction: undefined });
    });

    it('should return false if transaction not found', async () => {
      (PaymentGatewayTransaction.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await paymentGatewayRepository.delete(999);

      expect(result).toBe(false);
    });
  });
});
