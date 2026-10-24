import { resolveApiBaseUrl } from './apiUrl';

describe('resolveApiBaseUrl', () => {
  it('uses an explicit build-time API base when runtime config is the development placeholder', () => {
    expect(resolveApiBaseUrl('/api/v1', 'https://api.example.test/custom/v1')).toBe('https://api.example.test/custom/v1');
  });

  it('uses VITE_API_URL with the API path when runtime config is the development placeholder', () => {
    expect(resolveApiBaseUrl('/api/v1', undefined, 'http://127.0.0.1:3000')).toBe('http://127.0.0.1:3000/api/v1');
  });

  it('does not duplicate the API path when VITE_API_URL already includes it', () => {
    expect(resolveApiBaseUrl('/api/v1', undefined, 'https://api.example.test/api/v1/')).toBe('https://api.example.test/api/v1');
  });

  it('preserves an explicit absolute runtime API base', () => {
    expect(resolveApiBaseUrl('https://runtime.example.test/api/v1', 'https://build.example.test/api/v1', 'https://root.example.test'))
      .toBe('https://runtime.example.test/api/v1');
  });

  it('keeps the runtime proxy when no build-time override is configured', () => {
    expect(resolveApiBaseUrl('/api/v1')).toBe('/api/v1');
  });

  it('uses the local backend fallback when no configuration is available', () => {
    expect(resolveApiBaseUrl()).toBe('http://localhost:3000/api/v1');
  });
});
