const NEPAL_PHONE_PATTERN = /^(\+977)?[0-9]{7,10}$/;
export const MAX_STUDENT_PHOTO_UPLOAD_BYTES = 10 * 1024 * 1024;
const STUDENT_PHOTO_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/gif']);

export const getStudentPhotoValidationError = (file: Pick<File, 'size' | 'type'>): 'type' | 'size' | null => {
  if (!STUDENT_PHOTO_TYPES.has(file.type)) return 'type';
  if (file.size > MAX_STUDENT_PHOTO_UPLOAD_BYTES) return 'size';
  return null;
};

export const hasNonWhitespaceText = (value?: string): boolean => Boolean(value?.trim());

export const isValidNepalPhone = (value?: string): boolean => {
  const trimmed = value?.trim() || '';
  return !trimmed || NEPAL_PHONE_PATTERN.test(trimmed);
};

export const isValidRequiredNepalPhone = (value?: string): boolean => {
  const trimmed = value?.trim() || '';
  return Boolean(trimmed) && NEPAL_PHONE_PATTERN.test(trimmed);
};

export const isValidEmail = (value?: string): boolean => {
  const trimmed = value?.trim() || '';
  return !trimmed || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
};
