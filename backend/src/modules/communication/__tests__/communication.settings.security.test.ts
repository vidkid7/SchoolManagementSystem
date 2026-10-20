import AuditLog from '@models/AuditLog.model';
import { CommunicationController } from '../communication.controller';

describe('communication provider credential handling', () => {
  const controller = new CommunicationController();

  it('redacts credentials from previously stored audit snapshots', async () => {
    const findOne = jest.spyOn(AuditLog, 'findOne').mockResolvedValue({
      newValue: {
        sms: { provider: 'sparrow', apiKey: 'legacy-sms-secret', enabled: true },
        email: { username: 'mailer', password: 'legacy-mail-secret', enabled: true },
      },
    } as any);
    const json = jest.fn();
    const res = { status: jest.fn().mockReturnThis(), json } as any;

    await controller.getCommunicationSettings({ user: { userId: 4 } } as any, res);

    expect(json).toHaveBeenCalledWith({
      success: true,
      data: {
        sms: { provider: 'sparrow', apiKey: '', enabled: true },
        email: { username: 'mailer', password: '', enabled: true },
      },
    });
    expect(JSON.stringify(json.mock.calls)).not.toContain('legacy-sms-secret');
    expect(JSON.stringify(json.mock.calls)).not.toContain('legacy-mail-secret');
    findOne.mockRestore();
  });

  it('rejects credentials instead of writing them to the audit log', async () => {
    const create = jest.spyOn(AuditLog, 'create');
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    const req = {
      user: { userId: 4 },
      body: {
        sms: { apiKey: 'new-sms-secret' },
        email: { password: 'new-mail-secret' },
      },
      get: jest.fn().mockReturnValue(undefined),
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
    } as any;

    await controller.saveCommunicationSettings(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'CREDENTIALS_NOT_SUPPORTED',
        message: 'Provider credentials cannot be stored through communication settings.',
      },
    });
    expect(create).not.toHaveBeenCalled();
    create.mockRestore();
  });
});
