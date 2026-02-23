import Refund, { RefundStatus } from '@models/Refund.model';

/**
 * Refund Model Unit Tests
 * Tests refund model methods and status transitions
 * 
 * Requirements: 9.14
 */

describe('Refund Model', () => {
  describe('Status Check Methods', () => {
    it('should correctly identify pending status', () => {
      const refund = {
        status: RefundStatus.PENDING,
        isPending: Refund.prototype.isPending
      } as Refund;

      expect(refund.isPending()).toBe(true);
    });

    it('should correctly identify approved status', () => {
      const refund = {
        status: RefundStatus.APPROVED,
        isApproved: Refund.prototype.isApproved
      } as Refund;

      expect(refund.isApproved()).toBe(true);
    });

    it('should correctly identify rejected status', () => {
      const refund = {
        status: RefundStatus.REJECTED,
        isRejected: Refund.prototype.isRejected
      } as Refund;

      expect(refund.isRejected()).toBe(true);
    });

    it('should correctly identify completed status', () => {
      const refund = {
        status: RefundStatus.COMPLETED,
        isCompleted: Refund.prototype.isCompleted
      } as Refund;

      expect(refund.isCompleted()).toBe(true);
    });
  });

  describe('Status Transition Methods', () => {
    it('should approve refund correctly', () => {
      const refund = {
        status: RefundStatus.PENDING,
        approvedBy: undefined,
        approvedAt: undefined,
        approve: Refund.prototype.approve
      } as Refund;

      refund.approve(123);

      expect(refund.status).toBe(RefundStatus.APPROVED);
      expect(refund.approvedBy).toBe(123);
      expect(refund.approvedAt).toBeInstanceOf(Date);
    });

    it('should reject refund correctly', () => {
      const refund = {
        status: RefundStatus.PENDING,
        rejectedBy: undefined,
        rejectedAt: undefined,
        rejectionReason: undefined,
        reject: Refund.prototype.reject
      } as Refund;

      refund.reject(456, 'Insufficient documentation');

      expect(refund.status).toBe(RefundStatus.REJECTED);
      expect(refund.rejectedBy).toBe(456);
      expect(refund.rejectedAt).toBeInstanceOf(Date);
      expect(refund.rejectionReason).toBe('Insufficient documentation');
    });

    it('should mark refund as completed correctly', () => {
      const refund = {
        status: RefundStatus.APPROVED,
        completedAt: undefined,
        markAsCompleted: Refund.prototype.markAsCompleted
      } as Refund;

      refund.markAsCompleted();

      expect(refund.status).toBe(RefundStatus.COMPLETED);
      expect(refund.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('RefundStatus Enum', () => {
    it('should have all required status values', () => {
      expect(RefundStatus.PENDING).toBe('pending');
      expect(RefundStatus.APPROVED).toBe('approved');
      expect(RefundStatus.REJECTED).toBe('rejected');
      expect(RefundStatus.COMPLETED).toBe('completed');
    });
  });
});
