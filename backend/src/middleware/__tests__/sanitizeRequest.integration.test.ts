import express, { Request, Response } from 'express';
import request from 'supertest';
import { sanitizeRequest } from '../validation';

describe('sanitizeRequest HTTP integration', () => {
  it('does not expose attacker-controlled prototype properties after JSON parsing', async () => {
    const app = express();
    app.use(express.json());
    app.use(sanitizeRequest);
    app.post('/echo', (req: Request, res: Response) => {
      res.json({
        prototypeIsPlain: Object.getPrototypeOf(req.body) === Object.prototype,
        hasOwnProtoKey: Object.prototype.hasOwnProperty.call(req.body, '__proto__'),
        inheritedPollution: req.body.polluted ?? null,
        safeValue: req.body.safe,
      });
    });

    const response = await request(app)
      .post('/echo')
      .set('Content-Type', 'application/json')
      .send('{"__proto__":{"polluted":"owned-by-attacker"},"safe":" value "}');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      prototypeIsPlain: true,
      hasOwnProtoKey: false,
      inheritedPollution: null,
      safeValue: 'value',
    });
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});
