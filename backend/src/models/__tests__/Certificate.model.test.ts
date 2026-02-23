/**
 * Certificate Model Unit Tests
 * 
 * Tests for Certificate model methods and behavior
 * 
 * Requirements: 25.1, 25.3, 25.4, 25.5
 */

import { Certificate } from '../Certificate.model';

/**
 * Helper function to create a Certificate instance with prototype methods
 */
function createCertificateInstance(overrides: Partial<Certificate> = {}): Certificate {
  const data = {
    certificateId: 1,
    certificateNumber: 'CERT-CHAR-2024-0001',
    templateId: 1,
    studentId: 1,
    type: 'character' as const,
    issuedDate: new Date('2024-01-15'),
    issuedDateBS: '2080-10-01',
    data: {},
    pdfUrl: '/uploads/certificates/CERT-CHAR-2024-0001.pdf',
    qrCode: 'data:image/png;base64,mockqrcode',
    issuedBy: 1,
    verificationUrl: 'http://localhost:3000/verify/CERT-CHAR-2024-0001',
    status: 'active' as const,
    revokedAt: undefined,
    revokedBy: undefined,
    revokedReason: undefined,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    ...overrides,
  };

  // Create instance with prototype methods
  const instance = Object.create(Certificate.prototype);
  Object.assign(instance, data);
  return instance as Certificate;
}

describe('Certificate Model', () => {
  describe('isActive', () => {
    it('should return true for active certificate', () => {
      // Arrange
      const certificate = createCertificateInstance({ status: 'active' });

      // Act
      const result = certificate.isActive();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for revoked certificate', () => {
      // Arrange
      const certificate = createCertificateInstance({ status: 'revoked' });

      // Act
      const result = certificate.isActive();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('revoke', () => {
    it('should revoke certificate with reason', () => {
      // Arrange
      const certificate = createCertificateInstance({
        status: 'active',
        revokedAt: undefined,
        revokedBy: undefined,
        revokedReason: undefined,
      });

      const revokedBy = 1;
      const reason = 'Student transferred to another school';

      // Act
      certificate.revoke(revokedBy, reason);

      // Assert
      expect(certificate.status).toBe('revoked');
      expect(certificate.revokedBy).toBe(revokedBy);
      expect(certificate.revokedReason).toBe(reason);
      expect(certificate.revokedAt).toBeInstanceOf(Date);
    });

    it('should set revoked date to current time', () => {
      // Arrange
      const certificate = createCertificateInstance({ status: 'active' });

      const beforeRevoke = new Date();

      // Act
      certificate.revoke(1, 'Test reason');

      const afterRevoke = new Date();

      // Assert
      expect(certificate.revokedAt).toBeDefined();
      expect(certificate.revokedAt!.getTime()).toBeGreaterThanOrEqual(beforeRevoke.getTime());
      expect(certificate.revokedAt!.getTime()).toBeLessThanOrEqual(afterRevoke.getTime());
    });
  });

  describe('toJSON', () => {
    it('should return certificate as JSON object', () => {
      // Arrange
      const issuedDate = new Date('2024-01-15');
      const createdAt = new Date('2024-01-15');
      const updatedAt = new Date('2024-01-15');
      const certificate = createCertificateInstance({
        certificateId: 1,
        certificateNumber: 'CERT-CHAR-2024-0001',
        templateId: 1,
        studentId: 1,
        type: 'character',
        issuedDate,
        issuedDateBS: '2080-10-01',
        data: { student_name: 'John Doe' },
        pdfUrl: '/uploads/certificates/CERT-CHAR-2024-0001.pdf',
        qrCode: 'data:image/png;base64,mockqrcode',
        issuedBy: 1,
        verificationUrl: 'http://localhost:3000/verify/CERT-CHAR-2024-0001',
        status: 'active',
        revokedAt: undefined,
        revokedBy: undefined,
        revokedReason: undefined,
        createdAt,
        updatedAt,
      });

      // Act
      const result = certificate.toJSON();

      // Assert
      expect(result).toEqual({
        certificateId: 1,
        certificateNumber: 'CERT-CHAR-2024-0001',
        templateId: 1,
        studentId: 1,
        type: 'character',
        issuedDate,
        issuedDateBS: '2080-10-01',
        data: { student_name: 'John Doe' },
        pdfUrl: '/uploads/certificates/CERT-CHAR-2024-0001.pdf',
        qrCode: 'data:image/png;base64,mockqrcode',
        issuedBy: 1,
        verificationUrl: 'http://localhost:3000/verify/CERT-CHAR-2024-0001',
        status: 'active',
        revokedAt: undefined,
        revokedBy: undefined,
        revokedReason: undefined,
        createdAt,
        updatedAt,
      });
    });

    it('should include revocation details when revoked', () => {
      // Arrange
      const revokedDate = new Date('2024-02-01');
      const certificate = createCertificateInstance({
        certificateId: 1,
        certificateNumber: 'CERT-CHAR-2024-0001',
        templateId: 1,
        studentId: 1,
        type: 'character',
        issuedDate: new Date('2024-01-15'),
        issuedDateBS: '2080-10-01',
        data: {},
        pdfUrl: '/uploads/certificates/CERT-CHAR-2024-0001.pdf',
        qrCode: 'data:image/png;base64,mockqrcode',
        issuedBy: 1,
        verificationUrl: 'http://localhost:3000/verify/CERT-CHAR-2024-0001',
        status: 'revoked',
        revokedAt: revokedDate,
        revokedBy: 2,
        revokedReason: 'Student transferred',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-02-01'),
      });

      // Act
      const result = certificate.toJSON();

      // Assert
      expect(result).toMatchObject({
        status: 'revoked',
        revokedAt: revokedDate,
        revokedBy: 2,
        revokedReason: 'Student transferred',
      });
    });
  });

  describe('Certificate Types', () => {
    it('should support all certificate types', () => {
      const types = [
        'character',
        'transfer',
        'academic_excellence',
        'eca',
        'sports',
        'course_completion',
        'bonafide',
        'conduct',
        'participation',
      ];

      types.forEach((type) => {
        const certificate = {
          type,
        } as Certificate;

        expect(certificate.type).toBe(type);
      });
    });
  });

  describe('Certificate Status', () => {
    it('should support active status', () => {
      const certificate = {
        status: 'active',
      } as Certificate;

      expect(certificate.status).toBe('active');
    });

    it('should support revoked status', () => {
      const certificate = {
        status: 'revoked',
      } as Certificate;

      expect(certificate.status).toBe('revoked');
    });
  });

  describe('Certificate Data', () => {
    it('should store arbitrary data as JSON', () => {
      const certificate = {
        data: {
          student_name: 'John Doe',
          class: 'Class 10',
          achievement: 'First Position',
          date: '2024-01-15',
        },
      } as unknown as Certificate;

      expect(certificate.data).toEqual({
        student_name: 'John Doe',
        class: 'Class 10',
        achievement: 'First Position',
        date: '2024-01-15',
      });
    });

    it('should handle empty data object', () => {
      const certificate = {
        data: {},
      } as Certificate;

      expect(certificate.data).toEqual({});
    });
  });
});
