import PaymentGatewayTransaction, {
  PaymentGateway,
  GatewayTransactionStatus
} from '../PaymentGatewayTransaction.model';

/**
 * Payment Gateway Transaction Model Tests
 * Tests for PaymentGatewayTransaction model methods
 * 
 * Requirements: 32.1, 32.6, 32.7
 */

describe('PaymentGatewayTransaction Model', () => {
  describe('Status Check Methods', () => {
    it('should correctly identify pending status', () => {
      const transaction = PaymentGatewayTransaction.build({
        transactionUuid: 'test-uuid',
        gateway: PaymentGateway.ESEWA,
        invoiceId: 1,
        studentId: 1,
        amount: 1000,
        productCode: 'EPAYTEST',
        status: GatewayTransactionStatus.PENDING,
        expiresAt: new Date()
      });

      expect(transaction.isPending()).toBe(true);
      expect(transaction.isSuccess()).toBe(false);
      expect(transaction.isFailed()).toBe(false);
    });

    it('should correctly identify success status', () => {
      const transaction = PaymentGatewayTransaction.build({
        transactionUuid: 'test-uuid',
        gateway: PaymentGateway.ESEWA,
        invoiceId: 1,
        studentId: 1,
        amount: 1000,
        productCode: 'EPAYTEST',
        status: GatewayTransactionStatus.SUCCESS,
        expiresAt: new Date()
      });

      expect(transaction.isPending()).toBe(false);
      expect(transaction.isSuccess()).toBe(true);
      expect(transaction.isFailed()).toBe(false);
    });

    it('should correctly identify failed status', () => {
      const transaction = PaymentGatewayTransaction.build({
        transactionUuid: 'test-uuid',
        gateway: PaymentGateway.ESEWA,
        invoiceId: 1,
        studentId: 1,
        amount: 1000,
        productCode: 'EPAYTEST',
        status: GatewayTransactionStatus.FAILED,
        expiresAt: new Date()
      });

      expect(transaction.isPending()).toBe(false);
      expect(transaction.isSuccess()).toBe(false);
      expect(transaction.isFailed()).toBe(true);
    });
  });

  describe('isExpired', () => {
    it('should return true if status is expired', () => {
      const transaction = PaymentGatewayTransaction.build({
        transactionUuid: 'test-uuid',
        gateway: PaymentGateway.ESEWA,
        invoiceId: 1,
        studentId: 1,
        amount: 1000,
        productCode: 'EPAYTEST',
        status: GatewayTransactionStatus.EXPIRED,
        expiresAt: new Date()
      });

      expect(transaction.isExpired()).toBe(true);
    });

    it('should return true if current time is past expiresAt', () => {
      const pastDate = new Date();
      pastDate.setMinutes(pastDate.getMinutes() - 10);

      const transaction = PaymentGatewayTransaction.build({
        transactionUuid: 'test-uuid',
        gateway: PaymentGateway.ESEWA,
        invoiceId: 1,
        studentId: 1,
        amount: 1000,
        productCode: 'EPAYTEST',
        status: GatewayTransactionStatus.PENDING,
        expiresAt: pastDate
      });

      expect(transaction.isExpired()).toBe(true);
    });

    it('should return false if current time is before expiresAt', () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 10);

      const transaction = PaymentGatewayTransaction.build({
        transactionUuid: 'test-uuid',
        gateway: PaymentGateway.ESEWA,
        invoiceId: 1,
        studentId: 1,
        amount: 1000,
        productCode: 'EPAYTEST',
        status: GatewayTransactionStatus.PENDING,
        expiresAt: futureDate
      });

      expect(transaction.isExpired()).toBe(false);
    });
  });

  describe('markAsSuccess', () => {
    it('should update status and set completion data', () => {
      const transaction = PaymentGatewayTransaction.build({
        transactionUuid: 'test-uuid',
        gateway: PaymentGateway.ESEWA,
        invoiceId: 1,
        studentId: 1,
        amount: 1000,
        productCode: 'EPAYTEST',
        status: GatewayTransactionStatus.PENDING,
        expiresAt: new Date()
      });

      const gatewayResponse = { transaction_code: 'TXN-123' };
      const paymentId = 1;

      transaction.markAsSuccess(gatewayResponse, paymentId);

      expect(transaction.status).toBe(GatewayTransactionStatus.SUCCESS);
      expect(transaction.completedAt).toBeDefined();
      expect(transaction.gatewayResponse).toEqual(gatewayResponse);
      expect(transaction.paymentId).toBe(paymentId);
    });

    it('should work without paymentId', () => {
      const transaction = PaymentGatewayTransaction.build({
        transactionUuid: 'test-uuid',
        gateway: PaymentGateway.ESEWA,
        invoiceId: 1,
        studentId: 1,
        amount: 1000,
        productCode: 'EPAYTEST',
        status: GatewayTransactionStatus.PENDING,
        expiresAt: new Date()
      });

      const gatewayResponse = { transaction_code: 'TXN-123' };

      transaction.markAsSuccess(gatewayResponse);

      expect(transaction.status).toBe(GatewayTransactionStatus.SUCCESS);
      expect(transaction.paymentId).toBeUndefined();
    });
  });

  describe('markAsFailed', () => {
    it('should update status and set failure data', () => {
      const transaction = PaymentGatewayTransaction.build({
        transactionUuid: 'test-uuid',
        gateway: PaymentGateway.ESEWA,
        invoiceId: 1,
        studentId: 1,
        amount: 1000,
        productCode: 'EPAYTEST',
        status: GatewayTransactionStatus.PENDING,
        expiresAt: new Date()
      });

      const reason = 'Invalid signature';
      const gatewayResponse = { error: 'Signature mismatch' };

      transaction.markAsFailed(reason, gatewayResponse);

      expect(transaction.status).toBe(GatewayTransactionStatus.FAILED);
      expect(transaction.completedAt).toBeDefined();
      expect(transaction.failureReason).toBe(reason);
      expect(transaction.gatewayResponse).toEqual(gatewayResponse);
    });

    it('should work without gatewayResponse', () => {
      const transaction = PaymentGatewayTransaction.build({
        transactionUuid: 'test-uuid',
        gateway: PaymentGateway.ESEWA,
        invoiceId: 1,
        studentId: 1,
        amount: 1000,
        productCode: 'EPAYTEST',
        status: GatewayTransactionStatus.PENDING,
        expiresAt: new Date()
      });

      const reason = 'User cancelled';

      transaction.markAsFailed(reason);

      expect(transaction.status).toBe(GatewayTransactionStatus.FAILED);
      expect(transaction.failureReason).toBe(reason);
      expect(transaction.gatewayResponse).toBeUndefined();
    });
  });

  describe('markAsExpired', () => {
    it('should update status to expired', () => {
      const transaction = PaymentGatewayTransaction.build({
        transactionUuid: 'test-uuid',
        gateway: PaymentGateway.ESEWA,
        invoiceId: 1,
        studentId: 1,
        amount: 1000,
        productCode: 'EPAYTEST',
        status: GatewayTransactionStatus.PENDING,
        expiresAt: new Date()
      });

      transaction.markAsExpired();

      expect(transaction.status).toBe(GatewayTransactionStatus.EXPIRED);
      expect(transaction.completedAt).toBeDefined();
    });
  });

  describe('canBeProcessed', () => {
    it('should return true for pending non-expired transaction', () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 10);

      const transaction = PaymentGatewayTransaction.build({
        transactionUuid: 'test-uuid',
        gateway: PaymentGateway.ESEWA,
        invoiceId: 1,
        studentId: 1,
        amount: 1000,
        productCode: 'EPAYTEST',
        status: GatewayTransactionStatus.PENDING,
        expiresAt: futureDate
      });

      expect(transaction.canBeProcessed()).toBe(true);
    });

    it('should return false for expired transaction', () => {
      const pastDate = new Date();
      pastDate.setMinutes(pastDate.getMinutes() - 10);

      const transaction = PaymentGatewayTransaction.build({
        transactionUuid: 'test-uuid',
        gateway: PaymentGateway.ESEWA,
        invoiceId: 1,
        studentId: 1,
        amount: 1000,
        productCode: 'EPAYTEST',
        status: GatewayTransactionStatus.PENDING,
        expiresAt: pastDate
      });

      expect(transaction.canBeProcessed()).toBe(false);
    });

    it('should return false for completed transaction', () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 10);

      const transaction = PaymentGatewayTransaction.build({
        transactionUuid: 'test-uuid',
        gateway: PaymentGateway.ESEWA,
        invoiceId: 1,
        studentId: 1,
        amount: 1000,
        productCode: 'EPAYTEST',
        status: GatewayTransactionStatus.SUCCESS,
        expiresAt: futureDate
      });

      expect(transaction.canBeProcessed()).toBe(false);
    });

    it('should return false for failed transaction', () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 10);

      const transaction = PaymentGatewayTransaction.build({
        transactionUuid: 'test-uuid',
        gateway: PaymentGateway.ESEWA,
        invoiceId: 1,
        studentId: 1,
        amount: 1000,
        productCode: 'EPAYTEST',
        status: GatewayTransactionStatus.FAILED,
        expiresAt: futureDate
      });

      expect(transaction.canBeProcessed()).toBe(false);
    });
  });

  describe('Model Validation', () => {
    it('should require transactionUuid', () => {
      const transaction = PaymentGatewayTransaction.build({
        gateway: PaymentGateway.ESEWA,
        invoiceId: 1,
        studentId: 1,
        amount: 1000,
        productCode: 'EPAYTEST',
        expiresAt: new Date()
      } as any);

      expect(() => transaction.validate()).rejects.toThrow();
    });

    it('should require gateway', () => {
      const transaction = PaymentGatewayTransaction.build({
        transactionUuid: 'test-uuid',
        invoiceId: 1,
        studentId: 1,
        amount: 1000,
        productCode: 'EPAYTEST',
        expiresAt: new Date()
      } as any);

      expect(() => transaction.validate()).rejects.toThrow();
    });

    it('should require amount to be non-negative', () => {
      const transaction = PaymentGatewayTransaction.build({
        transactionUuid: 'test-uuid',
        gateway: PaymentGateway.ESEWA,
        invoiceId: 1,
        studentId: 1,
        amount: -100,
        productCode: 'EPAYTEST',
        expiresAt: new Date()
      });

      expect(() => transaction.validate()).rejects.toThrow();
    });
  });
});
