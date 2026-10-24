export function isValidStudentDocumentExpiryDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function getStudentDocumentExpiryStatus(expiryDate?: string, now = new Date()) {
  if (!expiryDate || !isValidStudentDocumentExpiryDate(expiryDate)) {
    return { isExpired: false, isExpiringSoon: false };
  }
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  const expiry = new Date(`${expiryDate}T00:00:00.000Z`);
  const days = Math.floor((expiry.valueOf() - today.valueOf()) / 86_400_000);
  return { isExpired: days < 0, isExpiringSoon: days >= 0 && days <= 30 };
}

export function studentDocumentContentUrl(studentId: number, category: string, filename: string) {
  return `/api/v1/students/${studentId}/documents/files/${encodeURIComponent(category)}/${encodeURIComponent(filename)}`;
}
