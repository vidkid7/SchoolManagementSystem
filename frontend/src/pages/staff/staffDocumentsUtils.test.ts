import { normalizeDocumentStats } from './staffDocumentsUtils';

describe('normalizeDocumentStats', () => {
  it('maps the backend statistics shape and derives active documents', () => {
    expect(normalizeDocumentStats({
      totalDocuments: 8,
      expiredCount: 2,
      expiringSoonCount: 1,
    })).toEqual({ total: 8, active: 5, expired: 2, expiringSoon: 1 });
  });

  it('accepts the UI statistics shape when provided by an older API', () => {
    expect(normalizeDocumentStats({ total: 4, active: 2, expired: 1, expiringSoon: 1 }))
      .toEqual({ total: 4, active: 2, expired: 1, expiringSoon: 1 });
  });

  it('returns zeroed counts for missing or invalid data', () => {
    expect(normalizeDocumentStats(null)).toEqual({ total: 0, active: 0, expired: 0, expiringSoon: 0 });
    expect(normalizeDocumentStats({ totalDocuments: 'invalid' })).toEqual({ total: 0, active: 0, expired: 0, expiringSoon: 0 });
  });
});
