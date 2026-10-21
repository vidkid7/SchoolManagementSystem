import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('Vercel deployment security headers', () => {
  const vercelConfig = JSON.parse(
    readFileSync(path.resolve(__dirname, '../../vercel.json'), 'utf8'),
  );
  const csp = vercelConfig.headers[0].headers.find(
    (header: { key: string }) => header.key === 'Content-Security-Policy',
  ).value as string;

  it('allows same-origin generated Blob URLs in document preview frames', () => {
    expect(csp).toContain("frame-src 'self' blob:");
    expect(csp).toContain("frame-ancestors 'none'");
  });
});
