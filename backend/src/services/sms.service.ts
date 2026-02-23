import { logger } from '@utils/logger';
import { env } from '@config/env';

/**
 * SMS Service Interface
 * Provides SMS notification functionality
 * Requirements: 3.11, 6.8, 9.13
 */

export interface SMSMessage {
  recipient: string;
  message: string;
  language?: 'nepali' | 'english';
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * SMS Service
 * Mock implementation for development
 * In production, integrate with Sparrow SMS or Aakash SMS (Nepal SMS gateways)
 */
class SMSService {
  private enabled: boolean;

  constructor() {
    this.enabled = env.ENABLE_SMS_NOTIFICATIONS;
  }

  /**
   * Send SMS notification
   * @param recipient - Phone number (Nepal format: 98XXXXXXXX)
   * @param message - SMS message content
   * @param language - Message language (default: english)
   */
  async sendSMS(recipient: string, message: string, language: 'nepali' | 'english' = 'english'): Promise<SMSResult> {
    if (!this.enabled) {
      logger.info('SMS notifications disabled, skipping SMS', { recipient });
      return { success: true, messageId: 'DISABLED' };
    }

    try {
      // Validate phone number format (Nepal: 98XXXXXXXX)
      if (!this.isValidNepalPhoneNumber(recipient)) {
        logger.warn('Invalid Nepal phone number format', { recipient });
        return { success: false, error: 'Invalid phone number format' };
      }

      // Mock SMS sending for development
      // In production, integrate with Sparrow SMS or Aakash SMS API
      logger.info('SMS sent (mock)', {
        recipient,
        messageLength: message.length,
        language
      });

      // Simulate SMS gateway response
      const messageId = `SMS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        messageId
      };
    } catch (error) {
      logger.error('Error sending SMS', { error, recipient });
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Send bulk SMS notifications
   */
  async sendBulkSMS(messages: SMSMessage[]): Promise<SMSResult[]> {
    const results: SMSResult[] = [];

    for (const msg of messages) {
      const result = await this.sendSMS(msg.recipient, msg.message, msg.language);
      results.push(result);
    }

    return results;
  }

  /**
   * Send admission workflow notification
   * Requirements: 3.11
   */
  async sendAdmissionNotification(
    recipient: string,
    stage: 'inquiry' | 'application' | 'test_scheduled' | 'interview_scheduled' | 'admitted' | 'enrolled' | 'rejected',
    data: {
      applicantName: string;
      temporaryId?: string;
      testDate?: Date;
      interviewDate?: Date;
      schoolName?: string;
    }
  ): Promise<SMSResult> {
    const messages = {
      inquiry: `Dear Parent, Thank you for your inquiry at ${data.schoolName || 'our school'}. Your inquiry ID: ${data.temporaryId}. We will contact you soon.`,
      application: `Dear Parent, Application received for ${data.applicantName}. Application ID: ${data.temporaryId}. Documents verification in progress.`,
      test_scheduled: `Dear Parent, Admission test scheduled for ${data.applicantName} on ${data.testDate?.toLocaleDateString()}. Please arrive 15 minutes early.`,
      interview_scheduled: `Dear Parent, Interview scheduled for ${data.applicantName} on ${data.interviewDate?.toLocaleDateString()}. Please bring all required documents.`,
      admitted: `Congratulations! ${data.applicantName} has been admitted to ${data.schoolName || 'our school'}. Please complete enrollment process within 7 days.`,
      enrolled: `Dear Parent, ${data.applicantName} has been successfully enrolled. Welcome to ${data.schoolName || 'our school'} family!`,
      rejected: `Dear Parent, We regret to inform that ${data.applicantName}'s application could not be processed at this time. Thank you for your interest.`
    };

    const message = messages[stage];
    return this.sendSMS(recipient, message);
  }

  /**
   * Send low attendance alert
   * Requirements: 6.8
   */
  async sendLowAttendanceAlert(
    recipient: string,
    studentName: string,
    attendancePercentage: number
  ): Promise<SMSResult> {
    const message = `Alert: ${studentName}'s attendance has fallen to ${attendancePercentage.toFixed(1)}%. Minimum required: 75%. Please ensure regular attendance.`;
    return this.sendSMS(recipient, message);
  }

  /**
   * Send fee reminder
   * Requirements: 9.13
   */
  async sendFeeReminder(
    recipient: string,
    studentName: string,
    amount: number,
    dueDate: Date
  ): Promise<SMSResult> {
    const message = `Fee Reminder: NPR ${amount.toFixed(2)} due for ${studentName} by ${dueDate.toLocaleDateString()}. Please pay to avoid late fees.`;
    return this.sendSMS(recipient, message);
  }

  /**
   * Validate Nepal phone number format
   * Nepal mobile numbers: 98XXXXXXXX (10 digits starting with 98)
   */
  private isValidNepalPhoneNumber(phone: string): boolean {
    // Remove any spaces, dashes, or +977 prefix
    const cleaned = phone.replace(/[\s\-+]/g, '');
    
    // Check if it starts with 977 (country code) followed by 98
    if (cleaned.startsWith('977')) {
      return /^97798\d{8}$/.test(cleaned);
    }
    
    // Check if it's just the 10-digit number starting with 98
    return /^98\d{8}$/.test(cleaned);
  }
}

export default new SMSService();
