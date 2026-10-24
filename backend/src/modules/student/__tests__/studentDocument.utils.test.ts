import {
  getStudentDocumentExpiryStatus,
  isValidStudentDocumentExpiryDate,
  studentDocumentContentUrl,
} from '../studentDocument.utils';

describe('student document date and content helpers', () => {
  it('accepts only real ISO calendar dates', () => {
    expect(isValidStudentDocumentExpiryDate('2026-02-28')).toBe(true);
    expect(isValidStudentDocumentExpiryDate('2026-02-30')).toBe(false);
    expect(isValidStudentDocumentExpiryDate('28/02/2026')).toBe(false);
  });

  it('classifies expired and expiring-soon documents against UTC date boundaries', () => {
    const today = new Date('2026-10-22T11:00:00.000Z');
    expect(getStudentDocumentExpiryStatus('2026-10-21', today)).toEqual({ isExpired: true, isExpiringSoon: false });
    expect(getStudentDocumentExpiryStatus('2026-10-22', today)).toEqual({ isExpired: false, isExpiringSoon: true });
    expect(getStudentDocumentExpiryStatus('2026-11-21', today)).toEqual({ isExpired: false, isExpiringSoon: true });
    expect(getStudentDocumentExpiryStatus('2026-11-22', today)).toEqual({ isExpired: false, isExpiringSoon: false });
    expect(getStudentDocumentExpiryStatus(undefined, today)).toEqual({ isExpired: false, isExpiringSoon: false });
  });

  it('builds an authenticated API URL for a student file', () => {
    expect(studentDocumentContentUrl(42, 'birth_certificate', 'a file.pdf'))
      .toBe('/api/v1/students/42/documents/files/birth_certificate/a%20file.pdf');
  });
});
