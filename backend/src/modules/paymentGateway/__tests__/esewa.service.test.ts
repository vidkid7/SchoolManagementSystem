import crypto from 'crypto';
import esewaService from '../esewa.service';
import paymentGatewayRepository from '../paymentGateway.repository';
import paymentService from '../../finance/payment.service';
import invoiceRepository from '../../finance/invoice.repository';
import sequelize from '@config/database';
import { PaymentGateway, GatewayTransactionStatus } from '@models/PaymentGatewayTransaction.model';
import { PaymentMethod } from '@models/Payment.model';

/**
 * eSewa Service Tests
 * Tests for eSewa payment gateway integration
 * 
 * Requirements: 32.1, 32.6, 32.7
 */

// Mock dependencies
jest.mock('../paymentGateway.repository');
jest.mock('../../finance/payment.service');
jest.mock('../../finance/invoice.repository');
jest.mock('@config/database');

describe('EsewaService', () => {
  const mockTransaction = {
    commit: jest.fn(),
    rollback: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);
    
    // Set test environment variables
    process.env.ESEWA_MODE = 'test';
    process.env.ESEWA_SECRET_KEY = '8gBm/:&EnhH.1/q';
    process.env.ESEWA_PRODUCT_CODE = 'EPAYTEST';
  });

  describe('generateSignature', () => {
    it('should generate correct HMAC-SHA256 signature', () => {
      const totalAmount = 1000;
      const transactionUuid = 'test-uuid-123';
      const productCode = 'EPAYTEST';

      const signature = esewaService.generateSignature(totalAmount, transactionUuid, productCode);

      // Verify signature format
      expect(signature).toBeTruthy();
      expect(typeof signature).toBe('string');

      // Verify signature is base64 encoded
      const base64Regex = /^[A-Za-z0-9+/=]+$/;
      expect(signature).toMatch(base64Regex);

      // Manually verify signature
      const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
      const hmac = crypto.createHmac('sha256', '8gBm/:&EnhH.1/q');
      hmac.update(message);
      const expectedSignature = hmac.digest('base64');

      expect(signature).toBe(expectedSignature);
    });

    it('should generate different signatures for different amounts', () => {
      const transactionUuid = 'test-uuid-123';
      const productCode = 'EPAYTEST';

      const signature1 = esewaService.generateSignature(1000, transactionUuid, productCode);
      const signature2 = esewaService.generateSignature(2000, transactionUuid, productCode);

      expect(signature1).not.toBe(signature2);
    });

    it('should generate different signatures for different UUIDs', () => {
      const totalAmount = 1000;
      const productCode = 'EPAYTEST';

      const signature1 = esewaService.generateSignature(totalAmount, 'uuid-1', productCode);
      const signature2 = esewaService.generateSignature(totalAmount, 'uuid-2', productCode);

      expect(signature1).not.toBe(signature2);
    });

    it('should generate consistent signatures for same inputs', () => {
      const totalAmount = 1000;
      const transactionUuid = 'test-uuid-123';
      const productCode = 'EPAYTEST';

      const signature1 = esewaService.generateSignature(totalAmount, transactionUuid, productCode);
      const signature2 = esewaService.generateSignature(totalAmount, transactionUuid, productCode);

      expect(signature1).toBe(signature2);
    });
  });

  describe('verifySignature', () => {
    it('should verify valid signature', () => {
      const callbackData = {
        transaction_uuid: 'test-uuid-123',
        total_amount: '1000',
        product_code: 'EPAYTEST',
        status: 'COMPLETE',
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        signature: ''
      };

      // Generate valid signature
      const message = `total_amount=${callbackData.total_amount},transaction_uuid=${callbackData.transaction_uuid},product_code=${callbackData.product_code}`;
      const hmac = crypto.createHmac('sha256', '8gBm/:&EnhH.1/q');
      hmac.update(message);
      callbackData.signature = hmac.digest('base64');

      const isValid = esewaService.verifySignature(callbackData);

      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', () => {
      const callbackData = {
        transaction_uuid: 'test-uuid-123',
        total_amount: '1000',
        product_code: 'EPAYTEST',
        status: 'COMPLETE',
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        signature: 'invalid-signature'
      };

      const isValid = esewaService.verifySignature(callbackData);

      expect(isValid).toBe(false);
    });

    it('should reject callback without signature', () => {
      const callbackData = {
        transaction_uuid: 'test-uuid-123',
        total_amount: '1000',
        product_code: 'EPAYTEST',
        status: 'COMPLETE',
        signed_field_names: 'total_amount,transaction_uuid,product_code'
      };

      const isValid = esewaService.verifySignature(callbackData);

      expect(isValid).toBe(false);
    });

    it('should reject callback without signed_field_names', () => {
      const callbackData = {
        transaction_uuid: 'test-uuid-123',
        total_amount: '1000',
        product_code: 'EPAYTEST',
        status: 'COMPLETE',
        signature: 'some-signature'
      };

      const isValid = esewaService.verifySignature(callbackData);

      expect(isValid).toBe(false);
    });

    it('should reject tampered data', () => {
      const callbackData = {
        transaction_uuid: 'test-uuid-123',
        total_amount: '1000',
        product_code: 'EPAYTEST',
        status: 'COMPLETE',
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        signature: ''
      };

      // Generate signature for original amount
      const message = `total_amount=${callbackData.total_amount},transaction_uuid=${callbackData.transaction_uuid},product_code=${callbackData.product_code}`;
      const hmac = crypto.createHmac('sha256', '8gBm/:&EnhH.1/q');
      hmac.update(message);
      callbackData.signature = hmac.digest('base64');

      // Tamper with amount
      callbackData.total_amount = '2000';

      const isValid = esewaService.verifySignature(callbackData);

      expect(isValid).toBe(false);
    });
  });

  describe('initiatePayment', () => {
    const mockInvoice = {
      invoiceId: 1,
      studentId: 1,
      totalAmount: 5000,
      paidAmount: 0,
      balance: 5000,
      calculateBalance: jest.fn().mockReturnValue(5000)
    };

    const mockGatewayTransaction = {
      transactionId: 1,
      transactionUuid: 'test-uuid-123',
      gateway: PaymentGateway.ESEWA,
      invoiceId: 1,
      studentId: 1,
      amount: 1000,
      productCode: 'EPAYTEST',
      status: GatewayTransactionStatus.PENDING,
      signature: 'test-signature',
      expiresAt: new Date()
    };

    beforeEach(() => {
      (invoiceRepository.findById as jest.Mock).mockResolvedValue(mockInvoice);
      (paymentGatewayRepository.findPendingByInvoiceId as jest.Mock).mockResolvedValue([]);
      (paymentGatewayRepository.create as jest.Mock).mockResolvedValue(mockGatewayTransaction);
    });

    it('should initiate payment successfully', async () => {
      const paymentData = {
        invoiceId: 1,
        studentId: 1,
        amount: 1000,
        taxAmount: 0,
        serviceCharge: 0
      };

      const result = await esewaService.initiatePayment(paymentData, 1);

      expect(result).toBeDefined();
      expect(result.transaction).toBeDefined();
      expect(result.paymentUrl).toBeDefined();
      expect(result.formData).toBeDefined();
      expect(result.formData.amount).toBe('1000.00');
      expect(result.formData.total_amount).toBe('1000.00');
      expect(result.formData.transaction_uuid).toBeTruthy();
      expect(result.formData.signature).toBeTruthy();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should include tax and service charge in total amount', async () => {
      const paymentData = {
        invoiceId: 1,
        studentId: 1,
        amount: 1000,
        taxAmount: 130,
        serviceCharge: 20
      };

      const result = await esewaService.initiatePayment(paymentData, 1);

      expect(result.formData.amount).toBe('1000.00');
      expect(result.formData.tax_amount).toBe('130.00');
      expect(result.formData.product_service_charge).toBe('20.00');
      expect(result.formData.total_amount).toBe('1150.00');
    });

    it('should throw error if invoice not found', async () => {
      (invoiceRepository.findById as jest.Mock).mockResolvedValue(null);

      const paymentData = {
        invoiceId: 999,
        studentId: 1,
        amount: 1000
      };

      await expect(esewaService.initiatePayment(paymentData, 1)).rejects.toThrow('Invoice not found');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should throw error if amount is zero or negative', async () => {
      const paymentData = {
        invoiceId: 1,
        studentId: 1,
        amount: 0
      };

      await expect(esewaService.initiatePayment(paymentData, 1)).rejects.toThrow(
        'Payment amount must be greater than zero'
      );
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should throw error if amount exceeds invoice balance', async () => {
      const paymentData = {
        invoiceId: 1,
        studentId: 1,
        amount: 10000
      };

      await expect(esewaService.initiatePayment(paymentData, 1)).rejects.toThrow(
        'Payment amount (10000) exceeds invoice balance (5000)'
      );
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should expire existing pending transactions', async () => {
      const mockPendingTransaction = {
        transactionId: 1,
        gateway: PaymentGateway.ESEWA,
        status: GatewayTransactionStatus.PENDING,
        markAsExpired: jest.fn(),
        save: jest.fn()
      };

      (paymentGatewayRepository.findPendingByInvoiceId as jest.Mock).mockResolvedValue([
        mockPendingTransaction
      ]);

      const paymentData = {
        invoiceId: 1,
        studentId: 1,
        amount: 1000
      };

      await esewaService.initiatePayment(paymentData, 1);

      expect(mockPendingTransaction.markAsExpired).toHaveBeenCalled();
      expect(mockPendingTransaction.save).toHaveBeenCalled();
    });

    it('should set expiry time to 30 minutes', async () => {
      const paymentData = {
        invoiceId: 1,
        studentId: 1,
        amount: 1000
      };

      const beforeTime = new Date();
      beforeTime.setMinutes(beforeTime.getMinutes() + 29);

      await esewaService.initiatePayment(paymentData, 1);

      const afterTime = new Date();
      afterTime.setMinutes(afterTime.getMinutes() + 31);

      const createCall = (paymentGatewayRepository.create as jest.Mock).mock.calls[0][0];
      const expiresAt = createCall.expiresAt;

      expect(expiresAt.getTime()).toBeGreaterThan(beforeTime.getTime());
      expect(expiresAt.getTime()).toBeLessThan(afterTime.getTime());
    });
  });

  describe('handleCallback', () => {
    const mockGatewayTransaction = {
      transactionId: 1,
      transactionUuid: 'test-uuid-123',
      gateway: PaymentGateway.ESEWA,
      invoiceId: 1,
      studentId: 1,
      amount: 1000,
      status: GatewayTransactionStatus.PENDING,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      isPending: jest.fn().mockReturnValue(true),
      isExpired: jest.fn().mockReturnValue(false),
      markAsSuccess: jest.fn(),
      markAsFailed: jest.fn(),
      save: jest.fn()
    };

    const mockPayment = {
      paymentId: 1,
      receiptNumber: 'RCP-2081-00001',
      amount: 1000
    };

    const mockInvoice = {
      invoiceId: 1,
      balance: 4000
    };

    beforeEach(() => {
      (paymentGatewayRepository.findByUuid as jest.Mock).mockResolvedValue(mockGatewayTransaction);
      (paymentService.processPayment as jest.Mock).mockResolvedValue({
        payment: mockPayment,
        invoice: mockInvoice
      });
    });

    it('should process valid callback successfully', async () => {
      const callbackData = {
        transaction_uuid: 'test-uuid-123',
        transaction_code: 'ESEWA-TXN-123',
        total_amount: '1000',
        status: 'COMPLETE',
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        product_code: 'EPAYTEST',
        signature: ''
      };

      // Generate valid signature
      const message = `total_amount=${callbackData.total_amount},transaction_uuid=${callbackData.transaction_uuid},product_code=${callbackData.product_code}`;
      const hmac = crypto.createHmac('sha256', '8gBm/:&EnhH.1/q');
      hmac.update(message);
      callbackData.signature = hmac.digest('base64');

      const result = await esewaService.handleCallback(callbackData, 1);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Payment processed successfully');
      expect(result.paymentId).toBe(1);
      expect(mockGatewayTransaction.markAsSuccess).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should reject callback with invalid signature', async () => {
      const callbackData = {
        transaction_uuid: 'test-uuid-123',
        total_amount: '1000',
        status: 'COMPLETE',
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        product_code: 'EPAYTEST',
        signature: 'invalid-signature'
      };

      const result = await esewaService.handleCallback(callbackData, 1);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid signature - payment verification failed');
      expect(mockGatewayTransaction.markAsFailed).toHaveBeenCalledWith(
        'Invalid signature',
        callbackData
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should reject callback with amount mismatch', async () => {
      const callbackData = {
        transaction_uuid: 'test-uuid-123',
        total_amount: '2000', // Different from expected 1000
        status: 'COMPLETE',
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        product_code: 'EPAYTEST',
        signature: ''
      };

      // Generate valid signature for tampered amount
      const message = `total_amount=${callbackData.total_amount},transaction_uuid=${callbackData.transaction_uuid},product_code=${callbackData.product_code}`;
      const hmac = crypto.createHmac('sha256', '8gBm/:&EnhH.1/q');
      hmac.update(message);
      callbackData.signature = hmac.digest('base64');

      const result = await esewaService.handleCallback(callbackData, 1);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Amount mismatch - payment verification failed');
      expect(mockGatewayTransaction.markAsFailed).toHaveBeenCalled();
    });

    it('should reject callback if transaction not found', async () => {
      (paymentGatewayRepository.findByUuid as jest.Mock).mockResolvedValue(null);

      const callbackData = {
        transaction_uuid: 'non-existent-uuid',
        total_amount: '1000',
        status: 'COMPLETE',
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        product_code: 'EPAYTEST',
        signature: 'test-signature'
      };

      await expect(esewaService.handleCallback(callbackData, 1)).rejects.toThrow(
        'Transaction not found'
      );
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should reject callback if transaction already processed', async () => {
      const processedTransaction = {
        ...mockGatewayTransaction,
        status: GatewayTransactionStatus.SUCCESS
      };
      (paymentGatewayRepository.findByUuid as jest.Mock).mockResolvedValue(processedTransaction);

      const callbackData = {
        transaction_uuid: 'test-uuid-123',
        total_amount: '1000',
        status: 'COMPLETE',
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        product_code: 'EPAYTEST',
        signature: 'test-signature'
      };

      const result = await esewaService.handleCallback(callbackData, 1);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Transaction already processed');
    });

    it('should reject callback if transaction expired', async () => {
      const expiredTransaction = {
        ...mockGatewayTransaction,
        isExpired: jest.fn().mockReturnValue(true),
        markAsExpired: jest.fn(),
        save: jest.fn()
      };
      (paymentGatewayRepository.findByUuid as jest.Mock).mockResolvedValue(expiredTransaction);

      const callbackData = {
        transaction_uuid: 'test-uuid-123',
        total_amount: '1000',
        status: 'COMPLETE',
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        product_code: 'EPAYTEST',
        signature: 'test-signature'
      };

      const result = await esewaService.handleCallback(callbackData, 1);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Transaction has expired');
      expect(expiredTransaction.markAsExpired).toHaveBeenCalled();
    });

    it('should reject callback if payment status is not COMPLETE', async () => {
      const callbackData = {
        transaction_uuid: 'test-uuid-123',
        total_amount: '1000',
        status: 'PENDING',
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        product_code: 'EPAYTEST',
        signature: ''
      };

      // Generate valid signature
      const message = `total_amount=${callbackData.total_amount},transaction_uuid=${callbackData.transaction_uuid},product_code=${callbackData.product_code}`;
      const hmac = crypto.createHmac('sha256', '8gBm/:&EnhH.1/q');
      hmac.update(message);
      callbackData.signature = hmac.digest('base64');

      const result = await esewaService.handleCallback(callbackData, 1);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Payment not completed');
      expect(mockGatewayTransaction.markAsFailed).toHaveBeenCalled();
    });

    it('should create payment with correct data', async () => {
      const callbackData = {
        transaction_uuid: 'test-uuid-123',
        transaction_code: 'ESEWA-TXN-123',
        total_amount: '1000',
        status: 'COMPLETE',
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        product_code: 'EPAYTEST',
        signature: ''
      };

      // Generate valid signature
      const message = `total_amount=${callbackData.total_amount},transaction_uuid=${callbackData.transaction_uuid},product_code=${callbackData.product_code}`;
      const hmac = crypto.createHmac('sha256', '8gBm/:&EnhH.1/q');
      hmac.update(message);
      callbackData.signature = hmac.digest('base64');

      await esewaService.handleCallback(callbackData, 1);

      expect(paymentService.processPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceId: 1,
          studentId: 1,
          amount: 1000,
          paymentMethod: PaymentMethod.ESEWA,
          transactionId: 'ESEWA-TXN-123',
          gatewayResponse: callbackData,
          receivedBy: 1
        })
      );
    });
  });

  describe('handleFailure', () => {
    const mockGatewayTransaction = {
      transactionId: 1,
      transactionUuid: 'test-uuid-123',
      status: GatewayTransactionStatus.PENDING,
      markAsFailed: jest.fn(),
      save: jest.fn()
    };

    beforeEach(() => {
      (paymentGatewayRepository.findByUuid as jest.Mock).mockResolvedValue(mockGatewayTransaction);
    });

    it('should mark transaction as failed', async () => {
      const result = await esewaService.handleFailure('test-uuid-123', 'User cancelled');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Transaction marked as failed');
      expect(mockGatewayTransaction.markAsFailed).toHaveBeenCalledWith('User cancelled');
      expect(mockGatewayTransaction.save).toHaveBeenCalled();
    });

    it('should use default reason if not provided', async () => {
      await esewaService.handleFailure('test-uuid-123');

      expect(mockGatewayTransaction.markAsFailed).toHaveBeenCalledWith('Payment cancelled by user');
    });

    it('should return error if transaction not found', async () => {
      (paymentGatewayRepository.findByUuid as jest.Mock).mockResolvedValue(null);

      const result = await esewaService.handleFailure('non-existent-uuid');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Transaction not found');
    });

    it('should return error if transaction already processed', async () => {
      const processedTransaction = {
        ...mockGatewayTransaction,
        status: GatewayTransactionStatus.SUCCESS
      };
      (paymentGatewayRepository.findByUuid as jest.Mock).mockResolvedValue(processedTransaction);

      const result = await esewaService.handleFailure('test-uuid-123');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Transaction already processed');
    });
  });

  describe('getTransactionStatus', () => {
    it('should return transaction by UUID', async () => {
      const mockTransaction = {
        transactionId: 1,
        transactionUuid: 'test-uuid-123',
        status: GatewayTransactionStatus.PENDING
      };

      (paymentGatewayRepository.findByUuid as jest.Mock).mockResolvedValue(mockTransaction);

      const result = await esewaService.getTransactionStatus('test-uuid-123');

      expect(result).toEqual(mockTransaction);
      expect(paymentGatewayRepository.findByUuid).toHaveBeenCalledWith('test-uuid-123');
    });

    it('should return null if transaction not found', async () => {
      (paymentGatewayRepository.findByUuid as jest.Mock).mockResolvedValue(null);

      const result = await esewaService.getTransactionStatus('non-existent-uuid');

      expect(result).toBeNull();
    });
  });

  describe('Configuration', () => {
    it('should load test configuration by default', () => {
      const config = esewaService.getConfig();

      expect(config.mode).toBe('test');
      expect(config.productCode).toBe('EPAYTEST');
      expect(config.secretKey).toBe('8gBm/:&EnhH.1/q');
    });

    it('should allow configuration updates', () => {
      const newConfig = {
        secretKey: 'new-secret-key',
        productCode: 'NEW-PRODUCT-CODE'
      };

      esewaService.updateConfig(newConfig);
      const config = esewaService.getConfig();

      expect(config.secretKey).toBe('new-secret-key');
      expect(config.productCode).toBe('NEW-PRODUCT-CODE');
    });
  });
});
