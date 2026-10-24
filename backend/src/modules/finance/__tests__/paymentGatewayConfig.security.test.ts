import type { NextFunction, Request, Response } from 'express';
import financeController from '../finance.controller';

type SuccessBody = {
  success: boolean;
  data: Record<string, unknown> | Record<string, Record<string, unknown>>;
};

function invokeController(
  handler: (req: Request, res: Response, next: NextFunction) => void,
  req: Partial<Request>
): Promise<SuccessBody> {
  let resolveBody: (body: SuccessBody) => void = () => undefined;
  const bodyPromise = new Promise<SuccessBody>(resolve => { resolveBody = resolve; });
  const response = {
    status: jest.fn(),
    json: jest.fn((body: SuccessBody) => {
      resolveBody(body);
    }),
  };
  response.status.mockReturnValue(response);
  handler(req as Request, response as unknown as Response, jest.fn());
  return bodyPromise;
}

describe('payment gateway config secret handling', () => {
  it('redacts secrets from read and update responses while preserving omitted secrets', async () => {
    const initialUpdate = await invokeController(financeController.updatePaymentGatewayConfig, {
      params: { gatewayKey: 'esewa' },
      body: {
        name: 'eSewa',
        enabled: true,
        merchantId: 'QA-MERCHANT-SECURITY-01',
        secretKey: 'SYNTHETIC-STORED-SECRET',
        testMode: true,
      },
    });

    expect(JSON.stringify(initialUpdate)).not.toContain('SYNTHETIC-STORED-SECRET');
    expect(initialUpdate.data).toMatchObject({ secretKey: '', secretKeyConfigured: true });

    const rotationlessUpdate = await invokeController(financeController.updatePaymentGatewayConfig, {
      params: { gatewayKey: 'esewa' },
      body: { name: 'eSewa', enabled: true, merchantId: 'QA-MERCHANT-SECURITY-02', testMode: false },
    });
    expect(JSON.stringify(rotationlessUpdate)).not.toContain('SYNTHETIC-STORED-SECRET');
    expect(rotationlessUpdate.data).toMatchObject({
      merchantId: 'QA-MERCHANT-SECURITY-02',
      secretKey: '',
      secretKeyConfigured: true,
    });

    const read = await invokeController(financeController.getPaymentGatewayConfigs, {});
    expect(JSON.stringify(read)).not.toContain('SYNTHETIC-STORED-SECRET');
    expect((read.data as Record<string, Record<string, unknown>>).esewa).toMatchObject({
      merchantId: 'QA-MERCHANT-SECURITY-02',
      secretKey: '',
      secretKeyConfigured: true,
    });
  });

  it('does not report success for a provider connection check that is not implemented', async () => {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    await financeController.testPaymentGatewayConnection(
      { params: { gatewayKey: 'esewa' } } as unknown as Request,
      { status, json } as unknown as Response,
      jest.fn()
    );

    expect(status).toHaveBeenCalledWith(501);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.objectContaining({ code: 'GATEWAY_TEST_UNAVAILABLE' }),
    }));
  });
});
