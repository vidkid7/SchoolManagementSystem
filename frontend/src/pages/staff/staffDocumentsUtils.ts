export interface DocumentStats {
  total: number;
  active: number;
  expired: number;
  expiringSoon: number;
}

export const STAFF_DOCUMENT_CATEGORY_VALUES = [
  'certificate',
  'contract',
  'id_proof',
  'qualification',
  'experience',
  'medical',
  'other',
] as const;

export interface StaffDocumentViewModel {
  id: number;
  name: string;
  type: string;
  category: string;
  fileUrl: string;
  fileSize: number;
  expiryDate?: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
  createdAt: string;
  version: number;
  uploadedBy?: string | number;
}

export interface StaffDocumentUploadValues {
  name: string;
  category: string;
  file: File;
  expiryDate?: string;
}

const asString = (value: unknown): string => value == null ? '' : String(value);
const asNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function normalizeStaffDocument(data: Record<string, unknown>): StaffDocumentViewModel {
  const expiryDate = asString(data.expiryDate) || undefined;
  const expiryTime = expiryDate ? Date.parse(`${expiryDate.slice(0, 10)}T00:00:00Z`) : NaN;
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const daysUntilExpiry = Number.isFinite(expiryTime)
    ? Math.floor((expiryTime - todayUtc) / 86_400_000)
    : Number.POSITIVE_INFINITY;
  const isExpired = typeof data.isExpired === 'boolean' ? data.isExpired : daysUntilExpiry < 0;
  const isExpiringSoon = typeof data.isExpiringSoon === 'boolean'
    ? data.isExpiringSoon
    : daysUntilExpiry >= 0 && daysUntilExpiry <= 30;

  return {
    id: asNumber(data.documentId ?? data.id),
    name: asString(data.documentName ?? data.name ?? data.originalFileName),
    type: asString(data.mimeType ?? data.type),
    category: asString(data.category),
    fileUrl: asString(data.documentUrl ?? data.fileUrl),
    fileSize: asNumber(data.fileSize),
    expiryDate,
    isExpired,
    isExpiringSoon,
    createdAt: asString(data.createdAt ?? data.uploadedAt),
    version: asNumber(data.version) || 1,
    uploadedBy: data.uploadedBy as string | number | undefined,
  };
}

export function normalizeStaffDocumentVersion(data: Record<string, unknown>): {
  id: number;
  version: number;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string | number;
} {
  const document = normalizeStaffDocument(data);
  return {
    id: document.id,
    version: document.version,
    fileUrl: document.fileUrl,
    fileSize: document.fileSize,
    uploadedAt: document.createdAt,
    uploadedBy: document.uploadedBy ?? '',
  };
}

export function createStaffDocumentUploadFormData(values: StaffDocumentUploadValues): FormData {
  const formData = new FormData();
  formData.append('documentName', values.name.trim());
  formData.append('category', values.category);
  formData.append('document', values.file);
  if (values.expiryDate) formData.append('expiryDate', values.expiryDate);
  return formData;
}

export function createStaffDocumentUpdatePayload(values: Pick<StaffDocumentViewModel, 'name' | 'category' | 'expiryDate'>) {
  return {
    documentName: values.name.trim(),
    category: values.category,
    expiryDate: values.expiryDate || null,
  };
}

export function createStaffDocumentVersionsParams(document: Pick<StaffDocumentViewModel, 'name' | 'category'>) {
  return { category: document.category, documentName: document.name };
}

export function resolveStaffDocumentUrl(fileUrl: string, apiBaseUrl?: string): string {
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  const fallbackOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  return new URL(fileUrl, apiBaseUrl || fallbackOrigin).toString();
}

interface DocumentStatsResponse {
  total?: number | string;
  totalDocuments?: number | string;
  active?: number | string;
  expired?: number | string;
  expiredCount?: number | string;
  expiringSoon?: number | string;
  expiringSoonCount?: number | string;
}

const finiteNumber = (value: number | string | undefined): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function normalizeDocumentStats(data: DocumentStatsResponse | null | undefined): DocumentStats {
  const total = finiteNumber(data?.totalDocuments ?? data?.total);
  const expired = finiteNumber(data?.expiredCount ?? data?.expired);
  const expiringSoon = finiteNumber(data?.expiringSoonCount ?? data?.expiringSoon);
  const active = data?.active === undefined
    ? Math.max(0, total - expired - expiringSoon)
    : finiteNumber(data.active);

  return { total, active, expired, expiringSoon };
}
