import {
  hasNonWhitespaceText,
  getStudentPhotoValidationError,
  isValidEmail,
  isValidNepalPhone,
  isValidRequiredNepalPhone,
  MAX_STUDENT_PHOTO_UPLOAD_BYTES,
} from './studentFormValidation';

describe('student form validation helpers', () => {
  it('rejects whitespace-only required text', () => {
    expect(hasNonWhitespaceText('   ')).toBe(false);
    expect(hasNonWhitespaceText(' Ram ')).toBe(true);
  });

  it('rejects missing and whitespace-only required Nepal phone numbers', () => {
    expect(isValidRequiredNepalPhone('')).toBe(false);
    expect(isValidRequiredNepalPhone('   ')).toBe(false);
    expect(isValidRequiredNepalPhone('9801110001')).toBe(true);
    expect(isValidRequiredNepalPhone('+977 9801110001')).toBe(false);
    expect(isValidRequiredNepalPhone('not-a-phone')).toBe(false);
  });

  it('allows blank optional contact values but validates provided values', () => {
    expect(isValidNepalPhone('   ')).toBe(true);
    expect(isValidNepalPhone('9801110001')).toBe(true);
    expect(isValidNepalPhone('not-a-phone')).toBe(false);
    expect(isValidEmail('   ')).toBe(true);
    expect(isValidEmail('student@example.edu')).toBe(true);
    expect(isValidEmail('not-an-email')).toBe(false);
  });

  it('accepts backend-supported image types up to the 10 MB source upload limit', () => {
    expect(getStudentPhotoValidationError({ type: 'image/jpeg', size: MAX_STUDENT_PHOTO_UPLOAD_BYTES })).toBeNull();
    expect(getStudentPhotoValidationError({ type: 'image/png', size: 1000 })).toBeNull();
    expect(getStudentPhotoValidationError({ type: 'image/gif', size: 1000 })).toBeNull();
    expect(getStudentPhotoValidationError({ type: 'image/jpg', size: 1000 })).toBeNull();
  });

  it('rejects unsupported types and images larger than the backend upload limit', () => {
    expect(getStudentPhotoValidationError({ type: 'image/webp', size: 1000 })).toBe('type');
    expect(getStudentPhotoValidationError({ type: 'application/pdf', size: 1000 })).toBe('type');
    expect(getStudentPhotoValidationError({ type: 'image/jpeg', size: MAX_STUDENT_PHOTO_UPLOAD_BYTES + 1 })).toBe('size');
  });
});
