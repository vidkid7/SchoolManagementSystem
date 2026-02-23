/**
 * Certificate Repository Unit Tests
 * 
 * Tests for certificate database operations
 * 
 * Requirements: 25.1, 25.3, 25.4, 25.5
 */

import { CertificateRepository } from '../certificate.repository';
import { Certificate } from '../../../models/Certificate.model';

// Mock the Certificate model
jest.mock('../../../models/Certificate.model');

describe('CertificateRepository', () => {
  let repository: CertificateRepository;

  beforeEach(() => {
    repository = new CertificateRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new certificate', async () => {
      // Arrange
      const certificateData = {
        certificateNumber: 'CERT-CHAR-2024-0001',
        templateId: 1,
        studentId: 1,
        type: 'character' as const,
        issuedDate: new Date('2024-01-15'),
        issuedDateBS: '2080-10-01',
        data: { student_name: 'John Doe' },
        pdfUrl: '/uploads/certificates/CERT-CHAR-2024-0001.pdf',
        qrCode: 'data:image/png;base64,mockqrcode',
        issuedBy: 1,
        verificationUrl: 'http://localhost:3000/verify/CERT-CHAR-2024-0001',
        status: 'active' as const,
      };

      const mockCertificate = { ...certificateData, certificateId: 1 };
      (Certificate.create as jest.Mock).mockResolvedValue(mockCertificate);

      // Act
      const result = await repository.create(certificateData);

      // Assert
      expect(result).toEqual(mockCertificate);
      expect(Certificate.create).toHaveBeenCalledWith(certificateData);
    });
  });

  describe('findById', () => {
    it('should find certificate by ID', async () => {
      // Arrange
      const mockCertificate = {
        certificateId: 1,
        certificateNumber: 'CERT-CHAR-2024-0001',
      };
      (Certificate.findByPk as jest.Mock).mockResolvedValue(mockCertificate);

      // Act
      const result = await repository.findById(1);

      // Assert
      expect(result).toEqual(mockCertificate);
      expect(Certificate.findByPk).toHaveBeenCalledWith(1);
    });

    it('should return null if certificate not found', async () => {
      // Arrange
      (Certificate.findByPk as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await repository.findById(999);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByCertificateNumber', () => {
    it('should find certificate by certificate number', async () => {
      // Arrange
      const mockCertificate = {
        certificateId: 1,
        certificateNumber: 'CERT-CHAR-2024-0001',
      };
      (Certificate.findOne as jest.Mock).mockResolvedValue(mockCertificate);

      // Act
      const result = await repository.findByCertificateNumber('CERT-CHAR-2024-0001');

      // Assert
      expect(result).toEqual(mockCertificate);
      expect(Certificate.findOne).toHaveBeenCalledWith({
        where: { certificateNumber: 'CERT-CHAR-2024-0001' },
      });
    });
  });

  describe('findAll', () => {
    it('should find all certificates without filters', async () => {
      // Arrange
      const mockCertificates = [
        { certificateId: 1, certificateNumber: 'CERT-CHAR-2024-0001' },
        { certificateId: 2, certificateNumber: 'CERT-TRAN-2024-0002' },
      ];
      (Certificate.findAll as jest.Mock).mockResolvedValue(mockCertificates);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toEqual(mockCertificates);
      expect(Certificate.findAll).toHaveBeenCalledWith({
        where: {},
        order: [['issuedDate', 'DESC']],
      });
    });

    it('should filter by student ID', async () => {
      // Arrange
      const mockCertificates = [
        { certificateId: 1, studentId: 1 },
      ];
      (Certificate.findAll as jest.Mock).mockResolvedValue(mockCertificates);

      // Act
      const result = await repository.findAll({ studentId: 1 });

      // Assert
      expect(result).toEqual(mockCertificates);
      expect(Certificate.findAll).toHaveBeenCalledWith({
        where: { studentId: 1 },
        order: [['issuedDate', 'DESC']],
      });
    });

    it('should filter by type', async () => {
      // Arrange
      const mockCertificates = [
        { certificateId: 1, type: 'character' },
      ];
      (Certificate.findAll as jest.Mock).mockResolvedValue(mockCertificates);

      // Act
      const result = await repository.findAll({ type: 'character' });

      // Assert
      expect(result).toEqual(mockCertificates);
      expect(Certificate.findAll).toHaveBeenCalledWith({
        where: { type: 'character' },
        order: [['issuedDate', 'DESC']],
      });
    });

    it('should filter by status', async () => {
      // Arrange
      const mockCertificates = [
        { certificateId: 1, status: 'active' },
      ];
      (Certificate.findAll as jest.Mock).mockResolvedValue(mockCertificates);

      // Act
      const result = await repository.findAll({ status: 'active' });

      // Assert
      expect(result).toEqual(mockCertificates);
      expect(Certificate.findAll).toHaveBeenCalledWith({
        where: { status: 'active' },
        order: [['issuedDate', 'DESC']],
      });
    });

    it('should filter by date range', async () => {
      // Arrange
      const fromDate = new Date('2024-01-01');
      const toDate = new Date('2024-12-31');
      const mockCertificates = [
        { certificateId: 1 },
      ];
      (Certificate.findAll as jest.Mock).mockResolvedValue(mockCertificates);

      // Act
      await repository.findAll({
        issuedDateFrom: fromDate,
        issuedDateTo: toDate,
      });

      // Assert
      expect(Certificate.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            issuedDate: expect.any(Object),
          }),
        })
      );
    });
  });

  describe('findByStudentId', () => {
    it('should find all certificates for a student', async () => {
      // Arrange
      const mockCertificates = [
        { certificateId: 1, studentId: 1 },
        { certificateId: 2, studentId: 1 },
      ];
      (Certificate.findAll as jest.Mock).mockResolvedValue(mockCertificates);

      // Act
      const result = await repository.findByStudentId(1);

      // Assert
      expect(result).toEqual(mockCertificates);
      expect(Certificate.findAll).toHaveBeenCalledWith({
        where: { studentId: 1 },
        order: [['issuedDate', 'DESC']],
      });
    });
  });

  describe('findActiveByStudentId', () => {
    it('should find only active certificates for a student', async () => {
      // Arrange
      const mockCertificates = [
        { certificateId: 1, studentId: 1, status: 'active' },
      ];
      (Certificate.findAll as jest.Mock).mockResolvedValue(mockCertificates);

      // Act
      const result = await repository.findActiveByStudentId(1);

      // Assert
      expect(result).toEqual(mockCertificates);
      expect(Certificate.findAll).toHaveBeenCalledWith({
        where: { studentId: 1, status: 'active' },
        order: [['issuedDate', 'DESC']],
      });
    });
  });

  describe('update', () => {
    it('should update certificate', async () => {
      // Arrange
      const mockCertificate = {
        certificateId: 1,
        status: 'active',
        update: jest.fn().mockResolvedValue(true),
      };
      (Certificate.findByPk as jest.Mock).mockResolvedValue(mockCertificate);

      // Act
      const result = await repository.update(1, { status: 'revoked' });

      // Assert
      expect(result).toEqual(mockCertificate);
      expect(mockCertificate.update).toHaveBeenCalledWith({ status: 'revoked' });
    });

    it('should return null if certificate not found', async () => {
      // Arrange
      (Certificate.findByPk as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await repository.update(999, { status: 'revoked' });

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('revoke', () => {
    it('should revoke certificate', async () => {
      // Arrange
      const mockCertificate = {
        certificateId: 1,
        status: 'active',
        revoke: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };
      (Certificate.findByPk as jest.Mock).mockResolvedValue(mockCertificate);

      // Act
      const result = await repository.revoke(1, 1, 'Student transferred');

      // Assert
      expect(result).toEqual(mockCertificate);
      expect(mockCertificate.revoke).toHaveBeenCalledWith(1, 'Student transferred');
      expect(mockCertificate.save).toHaveBeenCalled();
    });

    it('should return null if certificate not found', async () => {
      // Arrange
      (Certificate.findByPk as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await repository.revoke(999, 1, 'Test reason');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('existsByCertificateNumber', () => {
    it('should return true if certificate exists', async () => {
      // Arrange
      (Certificate.count as jest.Mock).mockResolvedValue(1);

      // Act
      const result = await repository.existsByCertificateNumber('CERT-CHAR-2024-0001');

      // Assert
      expect(result).toBe(true);
      expect(Certificate.count).toHaveBeenCalledWith({
        where: { certificateNumber: 'CERT-CHAR-2024-0001' },
      });
    });

    it('should return false if certificate does not exist', async () => {
      // Arrange
      (Certificate.count as jest.Mock).mockResolvedValue(0);

      // Act
      const result = await repository.existsByCertificateNumber('INVALID-NUMBER');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('count', () => {
    it('should count all certificates', async () => {
      // Arrange
      (Certificate.count as jest.Mock).mockResolvedValue(100);

      // Act
      const result = await repository.count();

      // Assert
      expect(result).toBe(100);
      expect(Certificate.count).toHaveBeenCalledWith({ where: {} });
    });

    it('should count certificates with filters', async () => {
      // Arrange
      (Certificate.count as jest.Mock).mockResolvedValue(50);

      // Act
      const result = await repository.count({ studentId: 1, status: 'active' });

      // Assert
      expect(result).toBe(50);
      expect(Certificate.count).toHaveBeenCalledWith({
        where: { studentId: 1, status: 'active' },
      });
    });
  });

  describe('getStats', () => {
    it('should return certificate statistics', async () => {
      // Arrange
      const mockCertificates = [
        { certificateId: 1, status: 'active', type: 'character' },
        { certificateId: 2, status: 'active', type: 'character' },
        { certificateId: 3, status: 'revoked', type: 'transfer' },
        { certificateId: 4, status: 'active', type: 'sports' },
      ];
      (Certificate.findAll as jest.Mock).mockResolvedValue(mockCertificates);

      // Act
      const result = await repository.getStats();

      // Assert
      expect(result.total).toBe(4);
      expect(result.active).toBe(3);
      expect(result.revoked).toBe(1);
      expect(result.byType).toEqual({
        character: 2,
        transfer: 1,
        sports: 1,
      });
    });
  });
});
