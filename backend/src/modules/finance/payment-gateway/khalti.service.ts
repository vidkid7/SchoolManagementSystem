/**
 * Khalti Payment Gateway Integration Service
 * 
 * Implements Khalti payment gateway for Nepal-based online payments
 * 
 * Requirements: 32.2, 32.6
 */

import axios, { AxiosInstance } from 'axios';
import config from '../../../config/env';

export interface KhaltiConfig {
  publicKey: string;
  secretKey: string;
  baseUrl: string; // 'https://khalti.com/api/payment/' for live, 'https://a.khalti.com/api/payment/' for test
}

export interface KhaltiPaymentInitiateRequest {
  returnUrl: string;
  websiteUrl: string;
  amount: number; // Amount in Paisa (1 NPR = 100 Paisa)
  purchaseOrderId: string;
  purchaseOrderName: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  productDetails: Array<{
    identity: string;
    name: string;
    totalPrice: number;
    quantity: number;
  }>;
  amountBreakdown?: Array<{
    label: string;
    amount: number;
  }>;
  merchantStyles?: {
    logo?: string;
    color?: string;
  };
}

export interface KhaltiPaymentInitiateResponse {
  pidx: string; // Payment index ID
  paymentUrl: string;
  expiresAt: number; // Unix timestamp
  createdAt: number;
}

export interface KhaltiPaymentVerifyRequest {
  pidx: string;
  amount: number;
  mobile: string;
  transactionId: string;
}

export interface KhaltiPaymentVerifyResponse {
  pidx: string;
  userId: string;
  totalAmount: number;
  status: 'Completed' | 'Pending' | 'Refunded' | 'Failed';
  statusDetail: string;
  transactionId: string;
  createdAt: number;
  ebankingPaymentId?: string;
  mobile: string;
  productName: string;
  productIdentity: string;
}

export interface KhaltiPaymentStatus {
  isCompleted: boolean;
  isPending: boolean;
  isFailed: boolean;
  isRefunded: boolean;
  needsVerification: boolean;
}

export class KhaltiService {
  private client: AxiosInstance;
  private config: KhaltiConfig;

  constructor() {
    this.config = {
      publicKey: config.khalti.publicKey || '',
      secretKey: config.khalti.secretKey || '',
      baseUrl: config.khalti.baseUrl || 'https://a.khalti.com/api/payment/', // Test URL by default
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'Authorization': `Key ${this.config.secretKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const errorMessage = error.response?.data?.detail || 'Khalti payment gateway error';
        throw new Error(errorMessage);
      }
    );
  }

  /**
   * Initiate a Khalti payment
   * 
   * @param request - Payment initiation details
   * @returns Payment initiation response with payment URL
   */
  async initiatePayment(request: KhaltiPaymentInitiateRequest): Promise<KhaltiPaymentInitiateResponse> {
    try {
      // Validate required fields
      this.validateInitiateRequest(request);

      const response = await this.client.post<KhaltiPaymentInitiateResponse>(
        'initiate/',
        {
          return_url: request.returnUrl,
          website_url: request.websiteUrl,
          amount: request.amount, // Amount in Paisa
          purchase_order_id: request.purchaseOrderId,
          purchase_order_name: request.purchaseOrderName,
          customer_info: request.customerInfo,
          product_details: request.productDetails,
          amount_breakdown: request.amountBreakdown,
          merchant_styles: request.merchantStyles,
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to initiate Khalti payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify a Khalti payment
   * 
   * @param request - Payment verification details
   * @returns Verified payment details
   */
  async verifyPayment(request: KhaltiPaymentVerifyRequest): Promise<KhaltiPaymentVerifyResponse> {
    try {
      const response = await this.client.post<KhaltiPaymentVerifyResponse>(
        'verify/',
        {
          pidx: request.pidx,
          amount: request.amount,
          mobile: request.mobile,
          transaction_id: request.transactionId,
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to verify Khalti payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get payment status details
   * 
   * @param pidx - Payment index ID
   * @returns Payment status response
   */
  async getPaymentStatus(pidx: string): Promise<KhaltiPaymentVerifyResponse> {
    try {
      const response = await this.client.post<KhaltiPaymentVerifyResponse>(
        'status/',
        { pidx }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get Khalti payment status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Request payment refund
   * 
   * @param pidx - Payment index ID
   * @param reason - Refund reason
   * @returns Refund response
   */
  async requestRefund(pidx: string, reason: string): Promise<{ message: string; success: boolean }> {
    try {
      const response = await this.client.post<{ message: string; success: boolean }>(
        'refund/',
        {
          pidx,
          reason,
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to request Khalti refund: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if payment is completed
   * 
   * @param status - Payment status response
   * @returns Status details
   */
  getPaymentStatusDetails(status: KhaltiPaymentVerifyResponse): KhaltiPaymentStatus {
    return {
      isCompleted: status.status === 'Completed',
      isPending: status.status === 'Pending',
      isFailed: status.status === 'Failed',
      isRefunded: status.status === 'Refunded',
      needsVerification: status.status === 'Pending',
    };
  }

  /**
   * Convert NPR amount to Paisa
   * 
   * @param nprAmount - Amount in NPR
   * @returns Amount in Paisa
   */
  nprToPaisa(nprAmount: number): number {
    return Math.round(nprAmount * 100);
  }

  /**
   * Convert Paisa amount to NPR
   * 
   * @param paisaAmount - Amount in Paisa
   * @returns Amount in NPR
   */
  paisaToNpr(paisaAmount: number): number {
    return paisaAmount / 100;
  }

  /**
   * Validate payment initiation request
   * 
   * @param request - Request to validate
   */
  private validateInitiateRequest(request: KhaltiPaymentInitiateRequest): void {
    if (!request.returnUrl) {
      throw new Error('Return URL is required');
    }
    if (!request.websiteUrl) {
      throw new Error('Website URL is required');
    }
    if (!request.amount || request.amount < 100) {
      throw new Error('Amount must be at least 100 Paisa (1 NPR)');
    }
    if (!request.purchaseOrderId) {
      throw new Error('Purchase order ID is required');
    }
    if (!request.purchaseOrderName) {
      throw new Error('Purchase order name is required');
    }
    if (!request.customerInfo) {
      throw new Error('Customer info is required');
    }
    if (!request.customerInfo.phone) {
      throw new Error('Customer phone number is required');
    }
    if (!request.productDetails || request.productDetails.length === 0) {
      throw new Error('At least one product detail is required');
    }
  }

  /**
   * Check if Khalti is configured
   * 
   * @returns True if configured
   */
  isConfigured(): boolean {
    return !!(this.config.publicKey && this.config.secretKey);
  }
}

export const khaltiService = new KhaltiService();
