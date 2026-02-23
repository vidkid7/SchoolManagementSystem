/**
 * IME Pay Payment Gateway Integration Service
 * 
 * Implements IME Pay payment gateway for Nepal-based online payments
 * 
 * Requirements: 32.3, 32.6
 */

import axios, { AxiosInstance } from 'axios';
import { createCipheriv, createDecipheriv } from 'crypto';
import config from '../../../config/env';

export interface ImePayConfig {
  merchantCode: string;
  username: string;
  password: string;
  baseUrl: string;
}

export interface ImePayPaymentRequest {
  refId: string;
  amount: number;
  merchantName: string;
  productName: string;
  customerName: string;
  customerMobile: string;
  callbackUrl: string;
}

export interface ImePayTokenResponse {
  tokenId: string;
  refId: string;
  responseCode: string;
  responseMessage: string;
}

export interface ImePayPaymentStatusRequest {
  tokenId: string;
  refId: string;
  amount: number;
}

export interface ImePayPaymentStatusResponse {
  responseCode: string;
  responseMessage: string;
  msisdn: string;
  transactionId: string;
  refId: string;
  amount: number;
  responseAt: string;
}

export interface ImePayRefundRequest {
  tokenId: string;
  refId: string;
  amount: number;
  reason: string;
}

export interface ImePayRefundResponse {
  responseCode: string;
  responseMessage: string;
  transactionId: string;
  refId: string;
}

export interface ImePayPaymentStatus {
  isCompleted: boolean;
  isPending: boolean;
  isFailed: boolean;
  isRefunded: boolean;
  needsVerification: boolean;
}

/**
 * 3DES encryption/decryption utilities
 */
class TripleDES {
  private key: Buffer;
  private algorithm = 'des-ede3';

  constructor(key: string) {
    this.key = Buffer.from(key.padEnd(24, '0').substring(0, 24));
  }

  encrypt(plaintext: string): string {
    const iv = Buffer.alloc(8, 0);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  }

  decrypt(encrypted: string): string {
    const iv = Buffer.alloc(8, 0);
    const decipher = createDecipheriv(this.algorithm, this.key, iv);
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

export class ImePayService {
  private config: ImePayConfig;
  private encryptionKey: string;
  private encryptionInstance: TripleDES;
  private client: AxiosInstance;

  constructor() {
    this.config = {
      merchantCode: config.imePay.merchantCode || '',
      username: config.imePay.username || '',
      password: config.imePay.password || '',
      baseUrl: config.imePay.baseUrl || 'https://dev.imepay.com.np:7979/api/WebLogin/Decrypt',
    };

    this.encryptionKey = config.ENCRYPTION_KEY.substring(0, 24) || '123456789012345678901234';
    this.encryptionInstance = new TripleDES(this.encryptionKey);

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const errorMessage = error.response?.data?.responseMessage || 'IME Pay payment gateway error';
        throw new Error(errorMessage);
      }
    );
  }

  generateRefId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8);
    return `SCH${timestamp}${random}`.substring(0, 20);
  }

  private encrypt3DES(data: string): string {
    return this.encryptionInstance.encrypt(data);
  }

  // Reserved for future use - decryption of IME Pay responses
  // @ts-ignore - Method reserved for future implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private decrypt3DES(encryptedData: string): string {
    return this.encryptionInstance.decrypt(encryptedData);
  }

  async initiatePayment(request: ImePayPaymentRequest): Promise<ImePayTokenResponse> {
    try {
      this.validatePaymentRequest(request);

      const requestData = {
        MerchantCode: this.config.merchantCode,
        Username: this.config.username,
        Password: this.encrypt3DES(this.config.password),
        RefId: request.refId,
        Amount: request.amount.toString(),
        MerchantName: request.merchantName,
        ProductName: request.productName,
        CustomerName: request.customerName,
        CustomerMobile: request.customerMobile,
        CallBackUrl: request.callbackUrl,
      };

      const response = await this.client.post<ImePayTokenResponse>(
        '/WebLogin/Decrypt',
        requestData
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to initiate IME Pay payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPaymentStatus(request: ImePayPaymentStatusRequest): Promise<ImePayPaymentStatusResponse> {
    try {
      const requestData = {
        MerchantCode: this.config.merchantCode,
        Username: this.config.username,
        Password: this.encrypt3DES(this.config.password),
        TokenId: request.tokenId,
        RefId: request.refId,
        Amount: request.amount.toString(),
      };

      const response = await this.client.post<ImePayPaymentStatusResponse>(
        '/WebLogin/Confirm',
        requestData
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get IME Pay payment status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async requestRefund(request: ImePayRefundRequest): Promise<ImePayRefundResponse> {
    try {
      const requestData = {
        MerchantCode: this.config.merchantCode,
        Username: this.config.username,
        Password: this.encrypt3DES(this.config.password),
        TokenId: request.tokenId,
        RefId: request.refId,
        Amount: request.amount.toString(),
        RefundReason: request.reason,
      };

      const response = await this.client.post<ImePayRefundResponse>(
        '/WebLogin/Refund',
        requestData
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to request IME Pay refund: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getPaymentStatusDetails(status: ImePayPaymentStatusResponse): ImePayPaymentStatus {
    const completedCodes = ['0', '00'];
    const pendingCodes = ['1'];
    const failedCodes = ['2', 'E000', 'E001', 'E002'];
    const refundedCodes = ['3'];

    const isCompleted = completedCodes.includes(status.responseCode);
    const isPending = pendingCodes.includes(status.responseCode);
    const isFailed = failedCodes.includes(status.responseCode);
    const isRefunded = refundedCodes.includes(status.responseCode);

    return {
      isCompleted,
      isPending,
      isFailed,
      isRefunded,
      needsVerification: isPending,
    };
  }

  private validatePaymentRequest(request: ImePayPaymentRequest): void {
    if (!request.refId) {
      throw new Error('Reference ID is required');
    }
    if (!request.amount || request.amount < 1) {
      throw new Error('Amount must be at least 1 NPR');
    }
    if (!request.customerMobile) {
      throw new Error('Customer mobile number is required');
    }
    if (!request.callbackUrl) {
      throw new Error('Callback URL is required');
    }
  }

  isConfigured(): boolean {
    return !!(this.config.merchantCode && this.config.username && this.config.password);
  }
}

export const imePayService = new ImePayService();
