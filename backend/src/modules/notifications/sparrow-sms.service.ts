/**
 * Sparrow SMS Gateway Integration Service
 * 
 * Implements Sparrow SMS API for Nepal-based SMS notifications
 * 
 * Requirements: 23.1, 23.3, 23.4, 23.7
 */

import axios, { AxiosInstance } from 'axios';
import config from '../../config/env';

export interface SparrowSmsConfig {
  token: string;
  senderId: string;
  baseUrl: string;
}

export interface SmsSendRequest {
  to: string | string[]; // Phone number(s), comma-separated for multiple
  text: string;
  senderId?: string; // Optional override of default sender ID
  type?: 'sms' | 'flash' | 'unicode';
}

export interface SmsSendResponse {
  response_code: number;
  response_data: string;
  message: string;
}

export interface SmsStatusResponse {
  response_code: number;
  message: string;
  data: {
    msg_id: string;
    status: string;
    to: string;
    sent_at: string;
    delivered_at?: string;
  }[];
}

export interface SmsBalanceResponse {
  response_code: number;
  sms_balance: number;
  response_message: string;
}

export interface BulkSmsRequest {
  recipients: Array<{
    to: string;
    text: string;
  }>;
  type?: 'sms' | 'unicode';
}

export interface SmsDeliveryStatus {
  msgId: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'expired';
  recipient: string;
  sentAt: Date;
  deliveredAt?: Date;
}

export class SparrowSmsService {
  private config: SparrowSmsConfig;
  private client: AxiosInstance;

  constructor() {
    this.config = {
      token: config.sparrowSms.token || '',
      senderId: config.sparrowSms.senderId || 'DEMO',
      baseUrl: config.sparrowSms.baseUrl || 'https://api.sparrowsms.com',
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 30000, // 30 seconds
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const errorMessage = error.response?.data?.response_message || 'Sparrow SMS gateway error';
        throw new Error(errorMessage);
      }
    );
  }

  /**
   * Send a single SMS
   * 
   * @param request - SMS details
   * @returns Response from SMS gateway
   */
  async sendSms(request: SmsSendRequest): Promise<SmsSendResponse> {
    try {
      this.validateSmsRequest(request);

      const formData = new URLSearchParams();
      formData.append('token', this.config.token);
      formData.append('to', Array.isArray(request.to) ? request.to.join(',') : request.to);
      formData.append('text', request.text);
      
      if (request.senderId) {
        formData.append('from', request.senderId);
      } else {
        formData.append('from', this.config.senderId);
      }

      if (request.type) {
        formData.append('type', request.type);
      }

      const response = await this.client.post<SmsSendResponse>(
        '/api/v1/sms/send',
        formData.toString()
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to send SMS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send bulk SMS (rate limited to 10 SMS/second)
   * 
   * @param request - Bulk SMS details
   * @returns Array of responses for each recipient
   */
  async sendBulkSms(request: BulkSmsRequest): Promise<SmsSendResponse[]> {
    const results: SmsSendResponse[] = [];
    
    // Process in batches to respect rate limiting
    const batchSize = 10;
    for (let i = 0; i < request.recipients.length; i += batchSize) {
      const batch = request.recipients.slice(i, i + batchSize);
      
      // Send concurrently for the batch
      const batchPromises = batch.map(recipient => 
        this.sendSms({
          to: recipient.to,
          text: recipient.text,
          type: request.type,
        })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches to respect rate limiting
      if (i + batchSize < request.recipients.length) {
        await this.delay(1000); // 1 second delay between batches
      }
    }

    return results;
  }

  /**
   * Send SMS to multiple recipients with the same message
   * 
   * @param recipients - Array of phone numbers
   * @param text - SMS message
   * @param type - Message type
   * @returns Response from SMS gateway
   */
  async sendGroupSms(
    recipients: string[],
    text: string,
    type?: 'sms' | 'flash' | 'unicode'
  ): Promise<SmsSendResponse> {
    try {
      if (!recipients || recipients.length === 0) {
        throw new Error('At least one recipient is required');
      }

      const formData = new URLSearchParams();
      formData.append('token', this.config.token);
      formData.append('to', recipients.join(','));
      formData.append('text', text);
      formData.append('from', this.config.senderId);

      if (type) {
        formData.append('type', type);
      }

      const response = await this.client.post<SmsSendResponse>(
        '/api/v1/sms/send',
        formData.toString()
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to send group SMS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get SMS delivery status
   * 
   * @param msgId - Message ID from send response
   * @returns Delivery status
   */
  async getSmsStatus(msgId: string): Promise<SmsStatusResponse> {
    try {
      const formData = new URLSearchParams();
      formData.append('token', this.config.token);
      formData.append('msg_id', msgId);

      const response = await this.client.post<SmsStatusResponse>(
        '/api/v1/sms/status',
        formData.toString()
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get SMS status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get SMS balance
   * 
   * @returns SMS balance information
   */
  async getBalance(): Promise<SmsBalanceResponse> {
    try {
      const formData = new URLSearchParams();
      formData.append('token', this.config.token);

      const response = await this.client.post<SmsBalanceResponse>(
        '/api/v1/sms/balance',
        formData.toString()
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get SMS balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send Nepali/Unicode SMS
   * 
   * @param to - Phone number
   * @param textNepali - Nepali text message
   * @returns Response from SMS gateway
   */
  async sendUnicodeSms(to: string, textNepali: string): Promise<SmsSendResponse> {
    return this.sendSms({
      to,
      text: textNepali,
      type: 'unicode',
    });
  }

  /**
   * Validate SMS request
   * 
   * @param request - Request to validate
   */
  private validateSmsRequest(request: SmsSendRequest): void {
    if (!request.to) {
      throw new Error('Recipient phone number is required');
    }

    if (!request.text || request.text.trim().length === 0) {
      throw new Error('SMS text is required');
    }

    // Validate phone number format
    const phoneNumbers = Array.isArray(request.to) ? request.to : request.to.split(',');
    for (const phone of phoneNumbers) {
      const cleanedPhone = phone.trim();
      // Nepal phone numbers start with 977 or +977 or just 98/97
      if (!/^(?:\+?977|0)?[97]\d{8}$/.test(cleanedPhone)) {
        throw new Error(`Invalid phone number format: ${cleanedPhone}`);
      }
    }

    // Check message length for unicode
    if (request.type === 'unicode' && request.text.length > 535) {
      throw new Error('Unicode SMS text exceeds maximum length of 535 characters');
    }
  }

  /**
   * Check if Sparrow SMS is configured
   * 
   * @returns True if configured
   */
  isConfigured(): boolean {
    return !!this.config.token;
  }

  /**
   * Get current SMS balance
   * 
   * @returns Balance number or null if unavailable
   */
  async getSmsBalance(): Promise<number | null> {
    try {
      const response = await this.getBalance();
      return response.sms_balance;
    } catch {
      return null;
    }
  }

  /**
   * Delay helper for rate limiting
   * 
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const sparrowSmsService = new SparrowSmsService();
