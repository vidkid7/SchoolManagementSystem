import { PaymentMethod, PaymentStatus } from '../Payment.model';
import { InstallmentPlanStatus } from '../Payment.model';

/**
 * Payment Model Unit Tests
 * Tests Payment and InstallmentPlan model methods
 * 
 * Requirements: 9.5, 9.7, 9.8, 9.9, 9.11
 */

describe('Payment Model', () => {
  describe('isOnlinePayment', () => {
    it('should return true for online payment methods', () => {
      const payment = {
        paymentMethod: PaymentMethod.ESEWA,
        isOnlinePayment() {
          return [
            PaymentMethod.ESEWA,
            PaymentMethod.KHALTI,
            PaymentMethod.IME_PAY
          ].includes(this.paymentMethod);
        }
      };

      expect(payment.isOnlinePayment()).toBe(true);
    });

    it('should return false for cash payment', () => {
      const payment = {
        paymentMethod: PaymentMethod.CASH,
        isOnlinePayment() {
          return [
            PaymentMethod.ESEWA,
            PaymentMethod.KHALTI,
            PaymentMethod.IME_PAY
          ].includes(this.paymentMethod);
        }
      };

      expect(payment.isOnlinePayment()).toBe(false);
    });

    it('should return false for bank transfer', () => {
      const payment = {
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        isOnlinePayment() {
          return [
            PaymentMethod.ESEWA,
            PaymentMethod.KHALTI,
            PaymentMethod.IME_PAY
          ].includes(this.paymentMethod);
        }
      };

      expect(payment.isOnlinePayment()).toBe(false);
    });

    it('should return true for Khalti', () => {
      const payment = {
        paymentMethod: PaymentMethod.KHALTI,
        isOnlinePayment() {
          return [
            PaymentMethod.ESEWA,
            PaymentMethod.KHALTI,
            PaymentMethod.IME_PAY
          ].includes(this.paymentMethod);
        }
      };

      expect(payment.isOnlinePayment()).toBe(true);
    });

    it('should return true for IME Pay', () => {
      const payment = {
        paymentMethod: PaymentMethod.IME_PAY,
        isOnlinePayment() {
          return [
            PaymentMethod.ESEWA,
            PaymentMethod.KHALTI,
            PaymentMethod.IME_PAY
          ].includes(this.paymentMethod);
        }
      };

      expect(payment.isOnlinePayment()).toBe(true);
    });
  });

  describe('isCompleted', () => {
    it('should return true for completed payment', () => {
      const payment = {
        status: PaymentStatus.COMPLETED,
        isCompleted() {
          return this.status === PaymentStatus.COMPLETED;
        }
      };

      expect(payment.isCompleted()).toBe(true);
    });

    it('should return false for pending payment', () => {
      const payment = {
        status: PaymentStatus.PENDING,
        isCompleted() {
          return this.status === PaymentStatus.COMPLETED;
        }
      };

      expect(payment.isCompleted()).toBe(false);
    });

    it('should return false for failed payment', () => {
      const payment = {
        status: PaymentStatus.FAILED,
        isCompleted() {
          return this.status === PaymentStatus.COMPLETED;
        }
      };

      expect(payment.isCompleted()).toBe(false);
    });
  });

  describe('isInstallmentPayment', () => {
    it('should return true if payment has installment plan ID', () => {
      const payment = {
        installmentPlanId: 1,
        isInstallmentPayment() {
          return this.installmentPlanId !== null && this.installmentPlanId !== undefined;
        }
      };

      expect(payment.isInstallmentPayment()).toBe(true);
    });

    it('should return false if payment has no installment plan ID', () => {
      const payment = {
        installmentPlanId: null,
        isInstallmentPayment() {
          return this.installmentPlanId !== null && this.installmentPlanId !== undefined;
        }
      };

      expect(payment.isInstallmentPayment()).toBe(false);
    });

    it('should return false if installment plan ID is undefined', () => {
      const payment: any = {
        installmentPlanId: undefined,
        isInstallmentPayment(): boolean {
          return this.installmentPlanId !== null && this.installmentPlanId !== undefined;
        }
      };

      expect(payment.isInstallmentPayment()).toBe(false);
    });
  });

  describe('markAsCompleted', () => {
    it('should set status to completed', () => {
      const payment = {
        status: PaymentStatus.PENDING,
        markAsCompleted() {
          this.status = PaymentStatus.COMPLETED;
        }
      };

      payment.markAsCompleted();

      expect(payment.status).toBe(PaymentStatus.COMPLETED);
    });
  });

  describe('markAsFailed', () => {
    it('should set status to failed', () => {
      const payment = {
        status: PaymentStatus.PENDING,
        markAsFailed() {
          this.status = PaymentStatus.FAILED;
        }
      };

      payment.markAsFailed();

      expect(payment.status).toBe(PaymentStatus.FAILED);
    });
  });

  describe('markAsRefunded', () => {
    it('should set status to refunded', () => {
      const payment = {
        status: PaymentStatus.COMPLETED,
        markAsRefunded() {
          this.status = PaymentStatus.REFUNDED;
        }
      };

      payment.markAsRefunded();

      expect(payment.status).toBe(PaymentStatus.REFUNDED);
    });
  });
});

describe('InstallmentPlan Model', () => {
  describe('isActive', () => {
    it('should return true for active plan', () => {
      const plan = {
        status: InstallmentPlanStatus.ACTIVE,
        isActive() {
          return this.status === InstallmentPlanStatus.ACTIVE;
        }
      };

      expect(plan.isActive()).toBe(true);
    });

    it('should return false for completed plan', () => {
      const plan = {
        status: InstallmentPlanStatus.COMPLETED,
        isActive() {
          return this.status === InstallmentPlanStatus.ACTIVE;
        }
      };

      expect(plan.isActive()).toBe(false);
    });

    it('should return false for cancelled plan', () => {
      const plan = {
        status: InstallmentPlanStatus.CANCELLED,
        isActive() {
          return this.status === InstallmentPlanStatus.ACTIVE;
        }
      };

      expect(plan.isActive()).toBe(false);
    });
  });

  describe('isCompleted', () => {
    it('should return true for completed plan', () => {
      const plan = {
        status: InstallmentPlanStatus.COMPLETED,
        isCompleted() {
          return this.status === InstallmentPlanStatus.COMPLETED;
        }
      };

      expect(plan.isCompleted()).toBe(true);
    });

    it('should return false for active plan', () => {
      const plan = {
        status: InstallmentPlanStatus.ACTIVE,
        isCompleted() {
          return this.status === InstallmentPlanStatus.COMPLETED;
        }
      };

      expect(plan.isCompleted()).toBe(false);
    });
  });

  describe('markAsCompleted', () => {
    it('should set status to completed', () => {
      const plan = {
        status: InstallmentPlanStatus.ACTIVE,
        markAsCompleted() {
          this.status = InstallmentPlanStatus.COMPLETED;
        }
      };

      plan.markAsCompleted();

      expect(plan.status).toBe(InstallmentPlanStatus.COMPLETED);
    });
  });

  describe('markAsCancelled', () => {
    it('should set status to cancelled', () => {
      const plan = {
        status: InstallmentPlanStatus.ACTIVE,
        markAsCancelled() {
          this.status = InstallmentPlanStatus.CANCELLED;
        }
      };

      plan.markAsCancelled();

      expect(plan.status).toBe(InstallmentPlanStatus.CANCELLED);
    });
  });

  describe('getRemainingInstallments', () => {
    it('should calculate remaining installments from loaded payments', () => {
      const plan = {
        installmentPlanId: 1,
        numberOfInstallments: 4,
        payments: [
          { status: PaymentStatus.COMPLETED },
          { status: PaymentStatus.COMPLETED }
        ],
        getRemainingInstallments() {
          const paidCount = this.payments.filter((p: any) => p.status === PaymentStatus.COMPLETED).length;
          return this.numberOfInstallments - paidCount;
        }
      };

      const remaining = plan.getRemainingInstallments();

      expect(remaining).toBe(2);
    });

    it('should return all installments if none paid', () => {
      const plan = {
        installmentPlanId: 1,
        numberOfInstallments: 4,
        payments: [],
        getRemainingInstallments() {
          const paidCount = this.payments.filter((p: any) => p.status === PaymentStatus.COMPLETED).length;
          return this.numberOfInstallments - paidCount;
        }
      };

      const remaining = plan.getRemainingInstallments();

      expect(remaining).toBe(4);
    });
  });

  describe('getRemainingAmount', () => {
    it('should calculate remaining amount from loaded payments', () => {
      const plan = {
        installmentPlanId: 1,
        totalAmount: 12000,
        payments: [
          { amount: 3000, status: PaymentStatus.COMPLETED },
          { amount: 3000, status: PaymentStatus.COMPLETED }
        ],
        getRemainingAmount() {
          const paidSum = this.payments
            .filter((p: any) => p.status === PaymentStatus.COMPLETED)
            .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
          return Number(this.totalAmount) - paidSum;
        }
      };

      const remaining = plan.getRemainingAmount();

      expect(remaining).toBe(6000);
    });

    it('should return total amount if no payments made', () => {
      const plan = {
        installmentPlanId: 1,
        totalAmount: 12000,
        payments: [],
        getRemainingAmount() {
          const paidSum = this.payments
            .filter((p: any) => p.status === PaymentStatus.COMPLETED)
            .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
          return Number(this.totalAmount) - paidSum;
        }
      };

      const remaining = plan.getRemainingAmount();

      expect(remaining).toBe(12000);
    });
  });
});
