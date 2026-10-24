import {
  createStaffDocumentUpdatePayload,
  createStaffDocumentUploadFormData,
  createStaffDocumentVersionsParams,
  normalizeStaffDocument,
  normalizeStaffDocumentVersion,
  resolveStaffDocumentUrl,
  STAFF_DOCUMENT_CATEGORY_VALUES,
} from './staffDocumentsUtils';

describe('staff document API adapters', () => {
  it('normalizes the backend document fields for the staff document UI', () => {
    const doc = normalizeStaffDocument({
      documentId: '42',
      documentName: 'Teaching License',
      originalFileName: 'license.pdf',
      documentUrl: '/uploads/documents/staff/1/certificate/license.pdf',
      mimeType: 'application/pdf',
      fileSize: '2048',
      category: 'certificate',
      version: '3',
      uploadedBy: 8,
      createdAt: '2026-10-20T10:00:00.000Z',
      expiryDate: '2026-10-30',
    });

    expect(doc).toMatchObject({
      id: 42,
      name: 'Teaching License',
      type: 'application/pdf',
      category: 'certificate',
      fileUrl: '/uploads/documents/staff/1/certificate/license.pdf',
      fileSize: 2048,
      version: 3,
      uploadedBy: 8,
    });
    expect(typeof doc.isExpired).toBe('boolean');
    expect(typeof doc.isExpiringSoon).toBe('boolean');
  });

  it('preserves explicit expiry flags returned by the API', () => {
    expect(normalizeStaffDocument({
      expiryDate: '2099-01-01',
      isExpired: true,
      isExpiringSoon: false,
    })).toMatchObject({ isExpired: true, isExpiringSoon: false });
  });

  it('uses the backend multipart field names and trims the document name', () => {
    const file = new File(['qa'], 'license.pdf', { type: 'application/pdf' });
    const form = createStaffDocumentUploadFormData({
      name: '  Teaching License  ',
      category: 'certificate',
      file,
      expiryDate: '2027-01-01',
    });

    expect(form.get('documentName')).toBe('Teaching License');
    expect(form.get('name')).toBeNull();
    expect(form.get('category')).toBe('certificate');
    expect(form.get('document')).toBe(file);
    expect(form.get('expiryDate')).toBe('2027-01-01');
  });

  it('maps edit fields to backend names and supports clearing expiry', () => {
    expect(createStaffDocumentUpdatePayload({
      name: '  Updated License ',
      category: 'id_proof',
      expiryDate: '',
    })).toEqual({
      documentName: 'Updated License',
      category: 'id_proof',
      expiryDate: null,
    });
  });

  it('uses category and documentName to request versions, then normalizes version rows', () => {
    expect(createStaffDocumentVersionsParams({ name: 'Teaching License', category: 'certificate' }))
      .toEqual({ category: 'certificate', documentName: 'Teaching License' });
    expect(normalizeStaffDocumentVersion({
      documentId: 42,
      documentName: 'Teaching License',
      documentUrl: '/uploads/license-v2.pdf',
      fileSize: 512,
      version: 2,
      createdAt: '2026-10-20T10:00:00.000Z',
      uploadedBy: 8,
    })).toEqual({
      id: 42,
      version: 2,
      fileUrl: '/uploads/license-v2.pdf',
      fileSize: 512,
      uploadedAt: '2026-10-20T10:00:00.000Z',
      uploadedBy: 8,
    });
  });

  it('resolves relative file URLs against the API host and keeps absolute URLs intact', () => {
    expect(resolveStaffDocumentUrl('/uploads/license.pdf', 'https://api.example.test'))
      .toBe('https://api.example.test/uploads/license.pdf');
    expect(resolveStaffDocumentUrl('https://files.example.test/license.pdf', 'https://api.example.test'))
      .toBe('https://files.example.test/license.pdf');
  });

  it('offers only categories supported by the backend enum', () => {
    expect(STAFF_DOCUMENT_CATEGORY_VALUES).toEqual([
      'certificate', 'contract', 'id_proof', 'qualification', 'experience', 'medical', 'other',
    ]);
  });
});
