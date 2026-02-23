import refundRepository from '../refund.repository';
import Refund, { RefundStatus } from '@models/Refund.model';

/**
 * Refund Repository Unit Tests
 * Tests database operations for refunds
 * 
 * Requirements: 9.14
 */

// Mock Refund model
jest.mock('@models/Refund.model', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn()
  },
  RefundStatus: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    COMPLETED: 'completed'
  }
}));

describe('RefundRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new refund', async () => {
      const mockRefundData = {
        paymentId: 1,
        invoiceId: 1,
        studentId: 1,
        amount: 5000,
        reason: 'Student withdrawal',
        requestedBy: 1
      };

      const mockRefund = {
        refundId: 1,
        ...mockRefundData,
        status: RefundStatus.PENDING
      };

      (Refund.create as jest.Mock).mockResolvedValue(mockRefund);

      const result = await refundRepository.create(mockRefundData);

      expect(result).toEqual(mockRefund);
      expect(Refund.create).toHaveBeenCalledWith(mockRefundData, { transaction: undefined });
    });
  });

  describe('findById', () => {
    it('should find refund by ID', async () => {
      const mockRefund = {
        refundId: 1,
        paymentId: 1,
        amount: 5000,
        status: RefundStatus.PENDING
      };

      (Refund.findByPk as jest.Mock).mockResolvedValue(mockRefund);

      const result = await refundRepository.findById(1);

      expect(result).toEqual(mockRefund);
      expect(Refund.findByPk).toHaveBeenCalledWith(1);
    });

    it('should return null if refund not found', async () => {
      (Refund.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await refundRepository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByPaymentId', () => {
    it('should find refund by payment ID', async () => {
      const mockRefund = {
        refundId: 1,
        paymentId: 1,
        amount: 5000,
        status: RefundStatus.PENDING
      };

      (Refund.findOne as jest.Mock).mockResolvedValue(mockRefund);

      const result = await refundRepository.findByPaymentId(1);

      expect(result).toEqual(mockRefund);
      expect(Refund.findOne).toHaveBeenCalledWith({
        where: { paymentId: 1 },
        order: [['createdAt', 'DESC']]
      });
    });

    it('should return null if no refund found for payment', async () => {
      (Refund.findOne as jest.Mock).mockResolvedValue(null);

      const result = await refundRepository.findByPaymentId(999);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all refunds without filters', async () => {
      const mockRefunds = [
        { refundId: 1, status: RefundStatus.PENDING },
        { refundId: 2, status: RefundStatus.APPROVED }
      ];

      (Refund.findAll as jest.Mock).mockResolvedValue(mockRefunds);

      const result = await refundRepository.findAll();

      expect(result).toEqual(mockRefunds);
      expect(Refund.findAll).toHaveBeenCalledWith({
        where: {},
        order: [['requestedAt', 'DESC']]
      });
    });

    it('should find refunds with student ID filter', async () => {
      const mockRefunds = [
        { refundId: 1, studentId: 1, status: RefundStatus.PENDING }
      ];

      (Refund.findAll as jest.Mock).mockResolvedValue(mockRefunds);

      const result = await refundRepository.findAll({ studentId: 1 });

      expect(result).toEqual(mockRefunds);
      expect(Refund.findAll).toHaveBeenCalledWith({
        where: { studentId: 1 },
        order: [['requestedAt', 'DESC']]
      });
    });

    it('should find refunds with status filter', async () => {
      const mockRefunds = [
        { refundId: 1, status: RefundStatus.PENDING },
        { refundId: 2, status: RefundStatus.PENDING }
      ];

      (Refund.findAll as jest.Mock).mockResolvedValue(mockRefunds);

      const result = await refundRepository.findAll({ status: RefundStatus.PENDING });

      expect(result).toEqual(mockRefunds);
      expect(Refund.findAll).toHaveBeenCalledWith({
        where: { status: RefundStatus.PENDING },
        order: [['requestedAt', 'DESC']]
      });
    });

    it('should find refunds with multiple filters', async () => {
      const mockRefunds = [
        { refundId: 1, studentId: 1, invoiceId: 1, status: RefundStatus.PENDING }
      ];

      (Refund.findAll as jest.Mock).mockResolvedValue(mockRefunds);

      const result = await refundRepository.findAll({
        studentId: 1,
        invoiceId: 1,
        status: RefundStatus.PENDING
      });

      expect(result).toEqual(mockRefunds);
      expect(Refund.findAll).toHaveBeenCalledWith({
        where: {
          studentId: 1,
          invoiceId: 1,
          status: RefundStatus.PENDING
        },
        order: [['requestedAt', 'DESC']]
      });
    });
  });

  describe('findPending', () => {
    it('should find all pending refunds', async () => {
      const mockRefunds = [
        { refundId: 1, status: RefundStatus.PENDING },
        { refundId: 2, status: RefundStatus.PENDING }
      ];

      (Refund.findAll as jest.Mock).mockResolvedValue(mockRefunds);

      const result = await refundRepository.findPending();

      expect(result).toEqual(mockRefunds);
      expect(Refund.findAll).toHaveBeenCalledWith({
        where: { status: RefundStatus.PENDING },
        order: [['requestedAt', 'DESC']]
      });
    });
  });

  describe('findByStudentId', () => {
    it('should find refunds by student ID', async () => {
      const mockRefunds = [
        { refundId: 1, studentId: 1 },
        { refundId: 2, studentId: 1 }
      ];

      (Refund.findAll as jest.Mock).mockResolvedValue(mockRefunds);

      const result = await refundRepository.findByStudentId(1);

      expect(result).toEqual(mockRefunds);
      expect(Refund.findAll).toHaveBeenCalledWith({
        where: { studentId: 1 },
        order: [['requestedAt', 'DESC']]
      });
    });
  });

  describe('findByInvoiceId', () => {
    it('should find refunds by invoice ID', async () => {
      const mockRefunds = [
        { refundId: 1, invoiceId: 1 },
        { refundId: 2, invoiceId: 1 }
      ];

      (Refund.findAll as jest.Mock).mockResolvedValue(mockRefunds);

      const result = await refundRepository.findByInvoiceId(1);

      expect(result).toEqual(mockRefunds);
      expect(Refund.findAll).toHaveBeenCalledWith({
        where: { invoiceId: 1 },
        order: [['requestedAt', 'DESC']]
      });
    });
  });

  describe('update', () => {
    it('should update refund', async () => {
      const mockRefund = {
        refundId: 1,
        status: RefundStatus.PENDING,
        update: jest.fn()
      };

      (Refund.findByPk as jest.Mock).mockResolvedValue(mockRefund);

      const updates = { status: RefundStatus.APPROVED };
      const result = await refundRepository.update(1, updates);

      expect(result).toEqual(mockRefund);
      expect(mockRefund.update).toHaveBeenCalledWith(updates, { transaction: undefined });
    });

    it('should return null if refund not found', async () => {
      (Refund.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await refundRepository.update(999, { status: RefundStatus.APPROVED });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete refund', async () => {
      const mockRefund = {
        refundId: 1,
        destroy: jest.fn()
      };

      (Refund.findByPk as jest.Mock).mockResolvedValue(mockRefund);

      const result = await refundRepository.delete(1);

      expect(result).toBe(true);
      expect(mockRefund.destroy).toHaveBeenCalledWith({ transaction: undefined });
    });

    it('should return false if refund not found', async () => {
      (Refund.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await refundRepository.delete(999);

      expect(result).toBe(false);
    });
  });

  describe('hasPendingRefund', () => {
    it('should return true if payment has pending refund', async () => {
      (Refund.count as jest.Mock).mockResolvedValue(1);

      const result = await refundRepository.hasPendingRefund(1);

      expect(result).toBe(true);
      expect(Refund.count).toHaveBeenCalledWith({
        where: {
          paymentId: 1,
          status: RefundStatus.PENDING
        }
      });
    });

    it('should return false if payment has no pending refund', async () => {
      (Refund.count as jest.Mock).mockResolvedValue(0);

      const result = await refundRepository.hasPendingRefund(1);

      expect(result).toBe(false);
    });
  });

  describe('hasApprovedRefund', () => {
    it('should return true if payment has approved refund', async () => {
      (Refund.count as jest.Mock).mockResolvedValue(1);

      const result = await refundRepository.hasApprovedRefund(1);

      expect(result).toBe(true);
      expect(Refund.count).toHaveBeenCalledWith({
        where: {
          paymentId: 1,
          status: RefundStatus.APPROVED
        }
      });
    });

    it('should return false if payment has no approved refund', async () => {
      (Refund.count as jest.Mock).mockResolvedValue(0);

      const result = await refundRepository.hasApprovedRefund(1);

      expect(result).toBe(false);
    });
  });

  describe('getStatistics', () => {
    it('should calculate refund statistics', async () => {
      const mockRefunds = [
        { refundId: 1, amount: 5000, status: RefundStatus.PENDING },
        { refundId: 2, amount: 3000, status: RefundStatus.APPROVED },
        { refundId: 3, amount: 2000, status: RefundStatus.REJECTED },
        { refundId: 4, amount: 4000, status: RefundStatus.COMPLETED },
        { refundId: 5, amount: 1000, status: RefundStatus.COMPLETED }
      ];

      (Refund.findAll as jest.Mock).mockResolvedValue(mockRefunds);

      const result = await refundRepository.getStatistics();

      expect(result).toEqual({
        total: 5,
        pending: 1,
        approved: 1,
        rejected: 1,
        completed: 2,
        totalAmount: 15000,
        approvedAmount: 3000,
        completedAmount: 5000
      });
    });

    it('should calculate statistics with date range', async () => {
      const mockRefunds = [
        { refundId: 1, amount: 5000, status: RefundStatus.PENDING }
      ];

      (Refund.findAll as jest.Mock).mockResolvedValue(mockRefunds);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const result = await refundRepository.getStatistics(startDate, endDate);

      expect(result.total).toBe(1);
      expect(Refund.findAll).toHaveBeenCalledWith({
        where: {
          requestedAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      });
    });
  });
});
