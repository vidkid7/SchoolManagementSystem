import type { Request, Response } from 'express';
import { CommunicationController } from '../communication.controller';
import AuditLog from '@models/AuditLog.model';
import User from '@models/User.model';
import smsService from '@services/sms.service';

jest.mock('@models/AuditLog.model', () => ({
  __esModule: true,
  default: { create: jest.fn() },
  AuditAction: { CREATE: 'CREATE', UPDATE: 'UPDATE', DELETE: 'DELETE' },
}));

jest.mock('@models/NotificationTemplate.model', () => ({ __esModule: true, default: {} }));

jest.mock('@models/User.model', () => ({
  __esModule: true,
  default: { count: jest.fn() },
}));

jest.mock('@services/sms.service', () => ({
  __esModule: true,
  default: { sendBulkSMS: jest.fn() },
}));

const controller = new CommunicationController();
const auditLogCreate = jest.mocked(AuditLog.create);
const userCount = jest.mocked(User.count);
const sendBulkSMS = jest.mocked(smsService.sendBulkSMS);

const createRequest = (body: Record<string, unknown>): Request => ({
  user: { userId: 42 },
  body,
  ip: '127.0.0.1',
  get: jest.fn().mockReturnValue('QA test'),
} as unknown as Request);

const createResponse = (): Response => {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return response as unknown as Response;
};

describe('communication delivery endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends SMS through the configured delivery service before recording it as sent', async () => {
    sendBulkSMS.mockResolvedValue([{ success: true, messageId: 'gateway-123' }]);
    const request = createRequest({ recipients: ['9800000000'], message: 'School closes at 3.' });
    const response = createResponse();

    await controller.sendSMS(request, response);

    expect(sendBulkSMS).toHaveBeenCalledWith([
      { recipient: '9800000000', message: 'School closes at 3.' },
    ]);
    expect(auditLogCreate).toHaveBeenCalledWith(expect.objectContaining({
      newValue: expect.objectContaining({ status: 'sent', recipientCount: 1 }),
    }));
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it('does not report disabled SMS delivery as success or write a sent audit row', async () => {
    sendBulkSMS.mockResolvedValue([{ success: true, messageId: 'DISABLED' }]);
    const response = createResponse();

    await controller.sendSMS(createRequest({ recipients: '9800000000', message: 'Test message' }), response);

    expect(response.status).toHaveBeenCalledWith(503);
    expect(auditLogCreate).not.toHaveBeenCalled();
  });

  it('returns unavailable when Sparrow credentials are missing', async () => {
    sendBulkSMS.mockResolvedValue([{ success: false, error: 'SMS gateway is not configured' }]);
    const response = createResponse();

    await controller.sendSMS(createRequest({ recipients: '9800000000', message: 'Test message' }), response);

    expect(response.status).toHaveBeenCalledWith(503);
    expect(auditLogCreate).not.toHaveBeenCalled();
  });

  it('returns a delivery failure when the gateway rejects every recipient', async () => {
    sendBulkSMS.mockResolvedValue([{ success: false, error: 'Invalid phone number format' }]);
    const response = createResponse();

    await controller.sendSMS(createRequest({ recipients: '9800000000', message: 'Test message' }), response);

    expect(response.status).toHaveBeenCalledWith(502);
    expect(auditLogCreate).not.toHaveBeenCalled();
  });

  it('records partial delivery counts without claiming every recipient received the SMS', async () => {
    sendBulkSMS.mockResolvedValue([
      { success: true, messageId: 'gateway-123' },
      { success: false, error: 'Gateway rejected recipient' },
    ]);
    const response = createResponse();

    await controller.sendSMS(createRequest({
      recipients: ['9800000000', '9800000001'],
      message: 'Test message',
    }), response);

    expect(response.status).toHaveBeenCalledWith(207);
    expect(auditLogCreate).toHaveBeenCalledWith(expect.objectContaining({
      newValue: expect.objectContaining({
        status: 'partial',
        successfulDeliveries: 1,
        failedDeliveries: 1,
      }),
    }));
  });

  it('rejects scheduling rather than sending the SMS immediately', async () => {
    const response = createResponse();

    await controller.sendSMS(createRequest({
      recipients: '9800000000',
      message: 'Test message',
      scheduleTime: '2026-10-24T10:00:00Z',
    }), response);

    expect(response.status).toHaveBeenCalledWith(501);
    expect(sendBulkSMS).not.toHaveBeenCalled();
    expect(auditLogCreate).not.toHaveBeenCalled();
  });

  it.each([
    ['bulk SMS', 'sendBulkSMS', { message: 'Test message' }],
    ['email', 'sendEmail', { recipients: ['qa@example.test'], subject: 'Test', body: 'Test message' }],
    ['push', 'sendPushNotification', { title: 'Test', message: 'Test message' }],
  ] as const)('returns unavailable for %s instead of claiming delivery', async (_label, method, body) => {
    const response = createResponse();

    await controller[method](createRequest(body), response);

    expect(response.status).toHaveBeenCalledWith(501);
    expect(auditLogCreate).not.toHaveBeenCalled();
    expect(userCount).not.toHaveBeenCalled();
  });

  it('returns unavailable for bulk notifications instead of recording them as sent', async () => {
    const response = createResponse();

    await controller.sendBulkNotification(createRequest({
      title: 'Synthetic QA notice',
      message: 'This message must not be marked delivered.',
      targetAudience: 'students',
      channels: ['in-app', 'email'],
    }), response);

    expect(response.status).toHaveBeenCalledWith(501);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'DELIVERY_UNAVAILABLE',
        message: 'Bulk notification delivery is not configured',
      },
    });
    expect(auditLogCreate).not.toHaveBeenCalled();
    expect(userCount).not.toHaveBeenCalled();
  });

  it('rejects an unauthenticated bulk notification request', async () => {
    const request = createRequest({ message: 'Synthetic QA message' });
    request.user = undefined;
    const response = createResponse();

    await controller.sendBulkNotification(request, response);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(auditLogCreate).not.toHaveBeenCalled();
    expect(userCount).not.toHaveBeenCalled();
  });
});
