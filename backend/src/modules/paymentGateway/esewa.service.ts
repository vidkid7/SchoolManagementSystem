import crypto from 'crypto';
// @ts-ignore - uuid types should be installed
import { v4 as uuidv4 } from 'uuid';
import sequelize from '@config/database';
import paymentGatewayRepository from './paymentGateway.repository';
import paymentService from '../finance/payment.service';
import invoiceRepository from '../finance/invoice.repository';
import PaymentGatewayTransaction, {
  PaymentGateway,
  GatewayTransactionStatus
} from '@models/PaymentGatewayTransaction.model';
import { PaymentMethod } from '@models/Payment.model';

/**
 * eSewa Payment Gateway Service
 * Handles eSewa payment initiation, signature generation, and callback verification
 * 
 * Requirements: 32.1, 32.6, 32.7
 * 
 * eSewa Integration Details:
 * - Uses HMAC-SHA256 for signature generation
 * - Signature format: base64(hmac_sha256(secret_key, message))
 * - Message format: "total_amount,transaction_uuid,product_code"
 * - Supports both test and production modes
 */

export interface EsewaConfig {
  merchantCode: string;
  secretKey: string;
  productCode: string;
  paymentUrl: string;
  successUrl: string;
  failureUrl: string;
  mode: 'test' | 'production';
}

export interface EsewaPaymentInitiationData {
  invoiceId: number;
  studentId: number;
  amount: number;
  taxAmount?: number;
  serviceCharge?: number;
}

export interface EsewaPaymentInitiationResponse {
  transaction: PaymentGatewayTransaction;
  paymentUrl: string;
  formData: {
    amount: string;
    tax_amount: string;
    total_amount: string;
    transaction_uuid: string;
    product_code: string;
    product_service_charge: string;
    product_delivery_charge: string;
    success_url: string;
    failure_url: string;
    signed_field_names: string;
    signature: string;
  };
}

export interface EsewaCallbackData {
  transaction_uuid: string;
  transaction_code?: string;
  total_amount: string;
  status: string;
  signed_field_names?: string;
  signature?: string;
  ref_id?: string;
  [key: string]: any;
}

class EsewaService {
  private config: EsewaConfig;

  constructor() {
    // Load configuration from environment variables
    this.config = this.loadConfig();
  }

  /**
   * Load eSewa configuration from environment
   */
  private loadConfig(): EsewaConfig {
    const mode = (process.env.ESEWA_MODE || 'test') as 'test' | 'production';
    
    // Test mode configuration
    if (mode === 'test') {
      return {
        merchantCode: process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST',
        secretKey: process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q',
        productCode: process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST',
        paymentUrl: process.env.ESEWA_PAYMENT_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
        successUrl: process.env.ESEWA_SUCCESS_URL || 'http://localhost:3000/api/v1/payment/esewa/callback',
        failureUrl: process.env.ESEWA_FAILURE_URL || 'http://localhost:3000/api/v1/payment/esewa/failure',
        mode: 'test'
      };
    }

    // Production mode configuration
    return {
      merchantCode: process.env.ESEWA_MERCHANT_CODE || '',
      secretKey: process.env.ESEWA_SECRET_KEY || '',
      productCode: process.env.ESEWA_PRODUCT_CODE || '',
      paymentUrl: process.env.ESEWA_PAYMENT_URL || 'https://epay.esewa.com.np/api/epay/main/v2/form',
      successUrl: process.env.ESEWA_SUCCESS_URL || '',
      failureUrl: process.env.ESEWA_FAILURE_URL || '',
      mode: 'production'
    };
  }

  /**
   * Generate HMAC-SHA256 signature for eSewa
   * Message format: "total_amount,transaction_uuid,product_code"
   */
  generateSignature(totalAmount: number, transactionUuid: string, productCode: string): string {
    const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    
    const hmac = crypto.createHmac('sha256', this.config.secretKey);
    hmac.update(message);
    
    return hmac.digest('base64');
  }

  /**
   * Verify signature from eSewa callback
   */
  verifySignature(callbackData: EsewaCallbackData): boolean {
    if (!callbackData.signature || !callbackData.signed_field_names) {
      return false;
    }

    // Extract signed fields
    const signedFieldNames = callbackData.signed_field_names.split(',');
    
    // Build message from signed fields
    const messageParts: string[] = [];
    for (const fieldName of signedFieldNames) {
      const value = callbackData[fieldName];
      if (value !== undefined && value !== null) {
        messageParts.push(`${fieldName}=${value}`);
      }
    }
    const message = messageParts.join(',');

    // Generate signature
    const hmac = crypto.createHmac('sha256', this.config.secretKey);
    hmac.update(message);
    const expectedSignature = hmac.digest('base64');

    return expectedSignature === callbackData.signature;
  }

  /**
   * Initiate eSewa payment
   */
  async initiatePayment(
    paymentData: EsewaPaymentInitiationData,
    userId: number
  ): Promise<EsewaPaymentInitiationResponse> {
    const transaction = await sequelize.transaction();

    try {
      // Validate invoice exists and has balance
      const invoice = await invoiceRepository.findById(paymentData.invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const balance = invoice.calculateBalance();
      if (paymentData.amount <= 0) {
        throw new Error('Payment amount must be greater than zero');
      }

      if (paymentData.amount > balance) {
        throw new Error(`Payment amount (${paymentData.amount}) exceeds invoice balance (${balance})`);
      }

      // Check for existing pending transactions
      const pendingTransactions = await paymentGatewayRepository.findPendingByInvoiceId(
        paymentData.invoiceId
      );

      // Mark any existing pending transactions as expired
      for (const pending of pendingTransactions) {
        if (pending.gateway === PaymentGateway.ESEWA) {
          pending.markAsExpired();
          await pending.save({ transaction });
        }
      }

      // Generate unique transaction UUID
      const transactionUuid = uuidv4();

      // Calculate amounts
      const taxAmount = paymentData.taxAmount || 0;
      const serviceCharge = paymentData.serviceCharge || 0;
      const amount = paymentData.amount;
      const totalAmount = amount + taxAmount + serviceCharge;

      // Generate signature
      const signature = this.generateSignature(
        totalAmount,
        transactionUuid,
        this.config.productCode
      );

      // Set expiry time (30 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);

      // Create gateway transaction record
      const gatewayTransaction = await paymentGatewayRepository.create(
        {
          transactionUuid,
          gateway: PaymentGateway.ESEWA,
          invoiceId: paymentData.invoiceId,
          studentId: paymentData.studentId,
          amount: totalAmount,
          productCode: this.config.productCode,
          status: GatewayTransactionStatus.PENDING,
          signature,
          verificationData: {
            amount,
            taxAmount,
            serviceCharge,
            totalAmount,
            initiatedBy: userId
          },
          expiresAt
        },
        transaction
      );

      await transaction.commit();

      // Prepare form data for eSewa
      const formData = {
        amount: amount.toFixed(2),
        tax_amount: taxAmount.toFixed(2),
        total_amount: totalAmount.toFixed(2),
        transaction_uuid: transactionUuid,
        product_code: this.config.productCode,
        product_service_charge: serviceCharge.toFixed(2),
        product_delivery_charge: '0',
        success_url: this.config.successUrl,
        failure_url: this.config.failureUrl,
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        signature
      };

      return {
        transaction: gatewayTransaction,
        paymentUrl: this.config.paymentUrl,
        formData
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Handle eSewa payment callback (success)
   */
  async handleCallback(
    callbackData: EsewaCallbackData,
    userId: number
  ): Promise<{ success: boolean; message: string; paymentId?: number }> {
    const dbTransaction = await sequelize.transaction();

    try {
      // Find gateway transaction
      const gatewayTransaction = await paymentGatewayRepository.findByUuid(
        callbackData.transaction_uuid
      );

      if (!gatewayTransaction) {
        throw new Error('Transaction not found');
      }

      // Check if transaction is already processed
      if (gatewayTransaction.status !== GatewayTransactionStatus.PENDING) {
        return {
          success: false,
          message: `Transaction already processed with status: ${gatewayTransaction.status}`
        };
      }

      // Check if transaction is expired
      if (gatewayTransaction.isExpired()) {
        gatewayTransaction.markAsExpired();
        await gatewayTransaction.save({ transaction: dbTransaction });
        await dbTransaction.commit();
        
        return {
          success: false,
          message: 'Transaction has expired'
        };
      }

      // Verify signature
      const isSignatureValid = this.verifySignature(callbackData);
      if (!isSignatureValid) {
        gatewayTransaction.markAsFailed('Invalid signature', callbackData);
        await gatewayTransaction.save({ transaction: dbTransaction });
        await dbTransaction.commit();
        
        return {
          success: false,
          message: 'Invalid signature - payment verification failed'
        };
      }

      // Verify amount matches
      const expectedAmount = Number(gatewayTransaction.amount);
      const receivedAmount = Number(callbackData.total_amount);
      
      if (Math.abs(expectedAmount - receivedAmount) > 0.01) {
        gatewayTransaction.markAsFailed(
          `Amount mismatch: expected ${expectedAmount}, received ${receivedAmount}`,
          callbackData
        );
        await gatewayTransaction.save({ transaction: dbTransaction });
        await dbTransaction.commit();
        
        return {
          success: false,
          message: 'Amount mismatch - payment verification failed'
        };
      }

      // Check payment status from eSewa
      if (callbackData.status !== 'COMPLETE') {
        gatewayTransaction.markAsFailed(
          `Payment not completed: ${callbackData.status}`,
          callbackData
        );
        await gatewayTransaction.save({ transaction: dbTransaction });
        await dbTransaction.commit();
        
        return {
          success: false,
          message: `Payment not completed: ${callbackData.status}`
        };
      }

      // Process payment
      const paymentDate = new Date().toISOString().split('T')[0];
      const paymentResult = await paymentService.processPayment({
        invoiceId: gatewayTransaction.invoiceId,
        studentId: gatewayTransaction.studentId,
        amount: Number(gatewayTransaction.amount),
        paymentMethod: PaymentMethod.ESEWA,
        paymentDate,
        transactionId: callbackData.transaction_code || callbackData.ref_id || callbackData.transaction_uuid,
        gatewayResponse: callbackData,
        receivedBy: userId,
        remarks: `eSewa payment - Transaction UUID: ${callbackData.transaction_uuid}`
      });

      // Update gateway transaction
      gatewayTransaction.markAsSuccess(callbackData, paymentResult.payment.paymentId);
      await gatewayTransaction.save({ transaction: dbTransaction });

      await dbTransaction.commit();

      return {
        success: true,
        message: 'Payment processed successfully',
        paymentId: paymentResult.payment.paymentId
      };
    } catch (error) {
      await dbTransaction.rollback();
      
      // Try to mark transaction as failed
      try {
        const gatewayTransaction = await paymentGatewayRepository.findByUuid(
          callbackData.transaction_uuid
        );
        if (gatewayTransaction && gatewayTransaction.isPending()) {
          gatewayTransaction.markAsFailed(
            error instanceof Error ? error.message : 'Unknown error',
            callbackData
          );
          await gatewayTransaction.save();
        }
      } catch (updateError) {
        // Ignore update errors
      }

      throw error;
    }
  }

  /**
   * Handle eSewa payment failure
   */
  async handleFailure(
    transactionUuid: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const gatewayTransaction = await paymentGatewayRepository.findByUuid(transactionUuid);

      if (!gatewayTransaction) {
        return {
          success: false,
          message: 'Transaction not found'
        };
      }

      if (gatewayTransaction.status !== GatewayTransactionStatus.PENDING) {
        return {
          success: false,
          message: `Transaction already processed with status: ${gatewayTransaction.status}`
        };
      }

      gatewayTransaction.markAsFailed(reason || 'Payment cancelled by user');
      await gatewayTransaction.save();

      return {
        success: true,
        message: 'Transaction marked as failed'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionUuid: string): Promise<PaymentGatewayTransaction | null> {
    return paymentGatewayRepository.findByUuid(transactionUuid);
  }

  /**
   * Get configuration (for testing purposes)
   */
  getConfig(): EsewaConfig {
    return { ...this.config };
  }

  /**
   * Update configuration (for testing purposes)
   */
  updateConfig(config: Partial<EsewaConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export default new EsewaService();
