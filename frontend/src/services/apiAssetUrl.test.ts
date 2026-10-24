import { resolveApiAssetUrlAtOrigin } from './apiAssetUrl';

describe('resolveApiAssetUrl', () => {
  it('resolves backend static-file paths against the API host origin', () => {
    expect(resolveApiAssetUrlAtOrigin('/uploads/certificates/certificate.pdf', 'https://api.school.test/api/v1', 'https://frontend.school.test'))
      .toBe('https://api.school.test/uploads/certificates/certificate.pdf');
  });

  it('keeps absolute URLs absolute', () => {
    expect(resolveApiAssetUrlAtOrigin('https://files.school.test/certificate.pdf', 'https://api.school.test/api/v1', 'https://frontend.school.test'))
      .toBe('https://files.school.test/certificate.pdf');
  });

  it('uses the frontend origin when API calls are same-origin', () => {
    expect(resolveApiAssetUrlAtOrigin('/uploads/certificates/certificate.pdf', '/api/v1', 'https://school.test'))
      .toBe('https://school.test/uploads/certificates/certificate.pdf');
  });
});
