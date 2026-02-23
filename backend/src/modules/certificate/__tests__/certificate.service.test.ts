/**
 * Certificate Service Unit Tests
 * 
 * Tests for certificate generation, PDF creation, and QR code generation
 * 
 * Requirements: 25.1, 25.3, 25.4, 25.5
 */

import { CertificateService } from '../certificate.service';
import { CertificateRepository } from '../certificate.repository';
import { CertificateTemplateRepository } from '../certificateTemplate.repository';
import { Certificate } from '../../../models/Certificate.model';

// Mock dependencies
jest.mock('../certificate.repository');
jest.mock('../certificateTemplate.repository');
jest.mock('fs', () => ({
  createWriteStream: jest.fn(() => ({
    on: jest.fn((event, callback) => {
      if (event === 'finish') {
        setTimeout(callback, 0);
      }
      return this;
    }),
  })),
  mkdir: jest.fn((_path: string, _options: any, callback: Function) => callback(null)),
}));
jest.mock('util', () => ({
  promisify: jest.fn((fn) => fn),
}));

describe('CertificateService', () => {
  let service: CertificateService;
  let mockCertificateRepo: jest.Mocked<CertificateRepository>;
  let mockTemplateRepo: jest.Mocked<CertificateTemplateRepository>;

  beforeEach(() => {
    mockCertificateRepo = new CertificateRepository() as jest.Mocked<CertificateRepository>;
    mockTemplateRepo = new CertificateTemplateRepository() as jest.Mocked<CertificateTemplateRepository>;
    service = new CertificateService(
      mockCertificateRepo,
      mockTemplateRepo,
      'http://localhost:3000',
      'uploads/certificates'
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateCertificate', () => {
    it('should generate a certificate successfully', async () => {
      // Arrange
      const mockTemplate = {
        templateId: 1,
        name: 'Character Certificate',
        type: 'character',
        templateHtml: '<div>{{student_name}} from {{class}}</div>',
        variables: ['student_name', 'class'],
        isActive: true,
        renderTemplate: jest.fn((data) => `<div>${data.student_name} from ${data.class}</div>`),
      } as any;

      const mockCertificate = {
        certificateId: 1,
        certificateNumber: 'CERT-CHAR-2024-0001',
        templateId: 1,
        studentId: 1,
        type: 'character',
        issuedDate: new Date('2024-01-15'),
        issuedDateBS: '2080-10-01',
        data: { student_name: 'John Doe', class: 'Class 10' },
        pdfUrl: '/uploads/certificates/CERT-CHAR-2024-0001.pdf',
        qrCode: 'data:image/png;base64,mockqrcode',
        issuedBy: 1,
        verificationUrl: 'http://localhost:3000/api/v1/certificates/verify/CERT-CHAR-2024-0001',
        status: 'active',
      } as unknown as Certificate;

      mockTemplateRepo.findById = jest.fn().mockResolvedValue(mockTemplate);
      mockCertificateRepo.existsByCertificateNumber = jest.fn().mockResolvedValue(false);
      mockCertificateRepo.create = jest.fn().mockResolvedValue(mockCertificate);

      // Act
      const result = await service.generateCertificate({
        templateId: 1,
        studentId: 1,
        data: { student_name: 'John Doe', class: 'Class 10' },
        issuedBy: 1,
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.certificateNumber).toMatch(/^CERT-CHAR-\d{4}-\d{4}$/);
      expect(result.studentId).toBe(1);
      expect(result.type).toBe('character');
      expect(mockTemplateRepo.findById).toHaveBeenCalledWith(1);
      expect(mockCertificateRepo.create).toHaveBeenCalled();
    });

    it('should throw error if template not found', async () => {
      // Arrange
      mockTemplateRepo.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.generateCertificate({
          templateId: 999,
          studentId: 1,
          data: { student_name: 'John Doe' },
          issuedBy: 1,
        })
      ).rejects.toThrow('Template with ID 999 not found');
    });

    it('should throw error if template is inactive', async () => {
      // Arrange
      const mockTemplate = {
        templateId: 1,
        isActive: false,
      } as any;

      mockTemplateRepo.findById = jest.fn().mockResolvedValue(mockTemplate);

      // Act & Assert
      await expect(
        service.generateCertificate({
          templateId: 1,
          studentId: 1,
          data: { student_name: 'John Doe' },
          issuedBy: 1,
        })
      ).rejects.toThrow('Cannot generate certificate from inactive template');
    });

    it('should throw error if required variables are missing', async () => {
      // Arrange
      const mockTemplate = {
        templateId: 1,
        variables: ['student_name', 'class', 'date'],
        isActive: true,
      } as any;

      mockTemplateRepo.findById = jest.fn().mockResolvedValue(mockTemplate);

      // Act & Assert
      await expect(
        service.generateCertificate({
          templateId: 1,
          studentId: 1,
          data: { student_name: 'John Doe', class: 'Class 10' },
          issuedBy: 1,
        })
      ).rejects.toThrow('Missing required variables: date');
    });

    it('should generate unique certificate numbers', async () => {
      // Arrange
      const mockTemplate = {
        templateId: 1,
        type: 'character',
        variables: ['student_name'],
        isActive: true,
        renderTemplate: jest.fn(() => '<div>Test</div>'),
      } as any;

      mockTemplateRepo.findById = jest.fn().mockResolvedValue(mockTemplate);
      mockCertificateRepo.existsByCertificateNumber = jest.fn()
        .mockResolvedValueOnce(true)  // First attempt exists
        .mockResolvedValueOnce(false); // Second attempt is unique
      mockCertificateRepo.create = jest.fn().mockResolvedValue({} as Certificate);

      // Act
      await service.generateCertificate({
        templateId: 1,
        studentId: 1,
        data: { student_name: 'John Doe' },
        issuedBy: 1,
      });

      // Assert
      expect(mockCertificateRepo.existsByCertificateNumber).toHaveBeenCalledTimes(2);
    });

    it('should include QR code in generated certificate', async () => {
      // Arrange
      const mockTemplate = {
        templateId: 1,
        type: 'character',
        variables: ['student_name'],
        isActive: true,
        renderTemplate: jest.fn((data) => `<div>${data.qr_code}</div>`),
      } as any;

      const mockCertificate = {
        qrCode: 'data:image/png;base64,mockqrcode',
      } as unknown as Certificate;

      mockTemplateRepo.findById = jest.fn().mockResolvedValue(mockTemplate);
      mockCertificateRepo.existsByCertificateNumber = jest.fn().mockResolvedValue(false);
      mockCertificateRepo.create = jest.fn().mockResolvedValue(mockCertificate);

      // Act
      const result = await service.generateCertificate({
        templateId: 1,
        studentId: 1,
        data: { student_name: 'John Doe' },
        issuedBy: 1,
      });

      // Assert
      expect(result.qrCode).toBeDefined();
      expect(result.qrCode).toContain('data:image/png;base64');
    });
  });

  describe('bulkGenerateCertificates', () => {
    it('should generate multiple certificates successfully', async () => {
      // Arrange
      const mockTemplate = {
        templateId: 1,
        type: 'character',
        variables: ['student_name'],
        isActive: true,
        renderTemplate: jest.fn(() => '<div>Test</div>'),
      } as any;

      mockTemplateRepo.findById = jest.fn().mockResolvedValue(mockTemplate);
      mockCertificateRepo.existsByCertificateNumber = jest.fn().mockResolvedValue(false);
      mockCertificateRepo.create = jest.fn().mockResolvedValue({} as Certificate);

      const students = [
        { studentId: 1, data: { student_name: 'John Doe' } },
        { studentId: 2, data: { student_name: 'Jane Smith' } },
      ];

      // Act
      const result = await service.bulkGenerateCertificates({
        templateId: 1,
        students,
        issuedBy: 1,
      });

      // Assert
      expect(result.success).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
      expect(mockCertificateRepo.create).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures in bulk generation', async () => {
      // Arrange
      const mockTemplate = {
        templateId: 1,
        type: 'character',
        variables: ['student_name', 'class'],
        isActive: true,
        renderTemplate: jest.fn(() => '<div>Test</div>'),
      } as any;

      mockTemplateRepo.findById = jest.fn().mockResolvedValue(mockTemplate);
      mockCertificateRepo.existsByCertificateNumber = jest.fn().mockResolvedValue(false);
      mockCertificateRepo.create = jest.fn().mockResolvedValue({} as Certificate);

      const students = [
        { studentId: 1, data: { student_name: 'John Doe', class: 'Class 10' } },
        { studentId: 2, data: { student_name: 'Jane Smith' } }, // Missing 'class'
      ];

      // Act
      const result = await service.bulkGenerateCertificates({
        templateId: 1,
        students,
        issuedBy: 1,
      });

      // Assert
      expect(result.success).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].studentId).toBe(2);
      expect(result.failed[0].error).toContain('Missing required variables');
    });

    it('should track generation status for each student', async () => {
      // Arrange
      const mockTemplate = {
        templateId: 1,
        type: 'sports',
        variables: ['student_name', 'achievement'],
        isActive: true,
        renderTemplate: jest.fn(() => '<div>Test</div>'),
      } as any;

      mockTemplateRepo.findById = jest.fn().mockResolvedValue(mockTemplate);
      mockCertificateRepo.existsByCertificateNumber = jest.fn().mockResolvedValue(false);
      
      // Mock create to succeed for some and fail for others
      let callCount = 0;
      mockCertificateRepo.create = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Database error');
        }
        return Promise.resolve({ certificateId: callCount } as Certificate);
      });

      const students = [
        { studentId: 1, data: { student_name: 'Alice', achievement: 'Gold Medal' } },
        { studentId: 2, data: { student_name: 'Bob', achievement: 'Silver Medal' } },
        { studentId: 3, data: { student_name: 'Charlie', achievement: 'Bronze Medal' } },
      ];

      // Act
      const result = await service.bulkGenerateCertificates({
        templateId: 1,
        students,
        issuedBy: 1,
      });

      // Assert
      expect(result.success).toHaveLength(2);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].studentId).toBe(2);
      expect(result.failed[0].error).toContain('Database error');
      expect(result.success[0].certificateId).toBe(1);
      expect(result.success[1].certificateId).toBe(3);
    });

    it('should handle all failures gracefully', async () => {
      // Arrange
      const mockTemplate = {
        templateId: 1,
        type: 'academic_excellence',
        variables: ['student_name', 'gpa'],
        isActive: true,
        renderTemplate: jest.fn(() => '<div>Test</div>'),
      } as any;

      mockTemplateRepo.findById = jest.fn().mockResolvedValue(mockTemplate);

      const students = [
        { studentId: 1, data: { student_name: 'Student 1' } }, // Missing gpa
        { studentId: 2, data: { student_name: 'Student 2' } }, // Missing gpa
        { studentId: 3, data: { student_name: 'Student 3' } }, // Missing gpa
      ];

      // Act
      const result = await service.bulkGenerateCertificates({
        templateId: 1,
        students,
        issuedBy: 1,
      });

      // Assert
      expect(result.success).toHaveLength(0);
      expect(result.failed).toHaveLength(3);
      expect(result.failed.every(f => f.error.includes('Missing required variables'))).toBe(true);
    });

    it('should generate certificates with same issued date for all students', async () => {
      // Arrange
      const mockTemplate = {
        templateId: 1,
        type: 'course_completion',
        variables: ['student_name', 'course'],
        isActive: true,
        renderTemplate: jest.fn(() => '<div>Test</div>'),
      } as any;

      const issuedDate = new Date('2024-03-15');
      const issuedDateBS = '2080-12-02';

      mockTemplateRepo.findById = jest.fn().mockResolvedValue(mockTemplate);
      mockCertificateRepo.existsByCertificateNumber = jest.fn().mockResolvedValue(false);
      
      const createdCertificates: any[] = [];
      mockCertificateRepo.create = jest.fn().mockImplementation((data) => {
        createdCertificates.push(data);
        return Promise.resolve(data as Certificate);
      });

      const students = [
        { studentId: 1, data: { student_name: 'Student A', course: 'Mathematics' } },
        { studentId: 2, data: { student_name: 'Student B', course: 'Science' } },
      ];

      // Act
      await service.bulkGenerateCertificates({
        templateId: 1,
        students,
        issuedBy: 1,
        issuedDate,
        issuedDateBS,
      });

      // Assert
      expect(createdCertificates).toHaveLength(2);
      expect(createdCertificates[0].issuedDate).toEqual(issuedDate);
      expect(createdCertificates[1].issuedDate).toEqual(issuedDate);
      expect(createdCertificates[0].issuedDateBS).toBe(issuedDateBS);
      expect(createdCertificates[1].issuedDateBS).toBe(issuedDateBS);
    });

    it('should generate unique certificate numbers for each student', async () => {
      // Arrange
      const mockTemplate = {
        templateId: 1,
        type: 'eca',
        variables: ['student_name'],
        isActive: true,
        renderTemplate: jest.fn(() => '<div>Test</div>'),
      } as any;

      mockTemplateRepo.findById = jest.fn().mockResolvedValue(mockTemplate);
      mockCertificateRepo.existsByCertificateNumber = jest.fn().mockResolvedValue(false);
      
      const certificateNumbers: string[] = [];
      mockCertificateRepo.create = jest.fn().mockImplementation((data) => {
        certificateNumbers.push(data.certificateNumber);
        return Promise.resolve(data as Certificate);
      });

      const students = [
        { studentId: 1, data: { student_name: 'Student 1' } },
        { studentId: 2, data: { student_name: 'Student 2' } },
        { studentId: 3, data: { student_name: 'Student 3' } },
      ];

      // Act
      await service.bulkGenerateCertificates({
        templateId: 1,
        students,
        issuedBy: 1,
      });

      // Assert
      expect(certificateNumbers).toHaveLength(3);
      // All certificate numbers should be unique
      const uniqueNumbers = new Set(certificateNumbers);
      expect(uniqueNumbers.size).toBe(3);
      // All should match the expected format
      certificateNumbers.forEach(num => {
        expect(num).toMatch(/^CERT-ECA-\d{4}-\d{4}$/);
      });
    });

    it('should handle large batch generation', async () => {
      // Arrange
      const mockTemplate = {
        templateId: 1,
        type: 'bonafide',
        variables: ['student_name'],
        isActive: true,
        renderTemplate: jest.fn(() => '<div>Test</div>'),
      } as any;

      mockTemplateRepo.findById = jest.fn().mockResolvedValue(mockTemplate);
      mockCertificateRepo.existsByCertificateNumber = jest.fn().mockResolvedValue(false);
      mockCertificateRepo.create = jest.fn().mockResolvedValue({} as Certificate);

      // Generate 50 students
      const students = Array.from({ length: 50 }, (_, i) => ({
        studentId: i + 1,
        data: { student_name: `Student ${i + 1}` },
      }));

      // Act
      const result = await service.bulkGenerateCertificates({
        templateId: 1,
        students,
        issuedBy: 1,
      });

      // Assert
      expect(result.success).toHaveLength(50);
      expect(result.failed).toHaveLength(0);
      expect(mockCertificateRepo.create).toHaveBeenCalledTimes(50);
    });

    it('should provide detailed error messages for each failure', async () => {
      // Arrange
      const mockTemplate = {
        templateId: 1,
        type: 'transfer',
        variables: ['student_name', 'previous_class', 'transfer_date'],
        isActive: true,
        renderTemplate: jest.fn(() => '<div>Test</div>'),
      } as any;

      mockTemplateRepo.findById = jest.fn().mockResolvedValue(mockTemplate);

      const students = [
        { studentId: 1, data: { student_name: 'Student 1', previous_class: 'Class 9' } }, // Missing transfer_date
        { studentId: 2, data: { student_name: 'Student 2', transfer_date: '2024-03-15' } }, // Missing previous_class
        { studentId: 3, data: { student_name: 'Student 3' } }, // Missing both
      ];

      // Act
      const result = await service.bulkGenerateCertificates({
        templateId: 1,
        students,
        issuedBy: 1,
      });

      // Assert
      expect(result.failed).toHaveLength(3);
      expect(result.failed[0].error).toContain('transfer_date');
      expect(result.failed[1].error).toContain('previous_class');
      expect(result.failed[2].error).toContain('previous_class');
      expect(result.failed[2].error).toContain('transfer_date');
    });

    it('should continue processing after individual failures', async () => {
      // Arrange
      const mockTemplate = {
        templateId: 1,
        type: 'character',
        variables: ['student_name'],
        isActive: true,
        renderTemplate: jest.fn(() => '<div>Test</div>'),
      } as any;

      mockTemplateRepo.findById = jest.fn().mockResolvedValue(mockTemplate);
      mockCertificateRepo.existsByCertificateNumber = jest.fn().mockResolvedValue(false);
      
      // Fail on specific students
      let callCount = 0;
      mockCertificateRepo.create = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 2 || callCount === 4) {
          throw new Error(`Error for student ${callCount}`);
        }
        return Promise.resolve({ certificateId: callCount } as Certificate);
      });

      const students = Array.from({ length: 5 }, (_, i) => ({
        studentId: i + 1,
        data: { student_name: `Student ${i + 1}` },
      }));

      // Act
      const result = await service.bulkGenerateCertificates({
        templateId: 1,
        students,
        issuedBy: 1,
      });

      // Assert
      expect(result.success).toHaveLength(3);
      expect(result.failed).toHaveLength(2);
      expect(result.failed[0].studentId).toBe(2);
      expect(result.failed[1].studentId).toBe(4);
      // Verify processing continued after failures
      expect(mockCertificateRepo.create).toHaveBeenCalledTimes(5);
    });
  });

  describe('getCertificateById', () => {
    it('should return certificate by ID', async () => {
      // Arrange
      const mockCertificate = {
        certificateId: 1,
        certificateNumber: 'CERT-CHAR-2024-0001',
      } as Certificate;

      mockCertificateRepo.findById = jest.fn().mockResolvedValue(mockCertificate);

      // Act
      const result = await service.getCertificateById(1);

      // Assert
      expect(result).toEqual(mockCertificate);
      expect(mockCertificateRepo.findById).toHaveBeenCalledWith(1);
    });

    it('should throw error if certificate not found', async () => {
      // Arrange
      mockCertificateRepo.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(service.getCertificateById(999)).rejects.toThrow(
        'Certificate with ID 999 not found'
      );
    });
  });

  describe('verifyCertificate', () => {
    it('should verify valid certificate', async () => {
      // Arrange
      const mockCertificate: Partial<Certificate> = {
        certificateId: 1,
        certificateNumber: 'CERT-CHAR-2024-0001',
        type: 'character',
        studentId: 1,
        issuedDate: new Date('2024-01-15'),
        issuedDateBS: '2080-10-01',
        data: { student_name: 'John Doe', class: 'Class 10' },
        status: 'active',
        verificationUrl: 'http://localhost:3000/api/v1/certificates/verify/CERT-CHAR-2024-0001',
      };

      mockCertificateRepo.findByCertificateNumber = jest.fn().mockResolvedValue(mockCertificate);

      // Act
      const result = await service.verifyCertificate('CERT-CHAR-2024-0001');

      // Assert
      expect(result.valid).toBe(true);
      expect(result.certificate).toBeDefined();
      expect(result.certificate?.certificateNumber).toBe('CERT-CHAR-2024-0001');
      expect(result.certificate?.type).toBe('character');
      expect(result.certificate?.studentId).toBe(1);
      expect(result.certificate?.status).toBe('active');
      expect(result.message).toBe('Certificate is valid and authentic');
    });

    it('should return invalid for non-existent certificate', async () => {
      // Arrange
      mockCertificateRepo.findByCertificateNumber = jest.fn().mockResolvedValue(null);

      // Act
      const result = await service.verifyCertificate('INVALID-NUMBER');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.certificate).toBeUndefined();
      expect(result.message).toBe('Certificate not found. Please verify the certificate number and try again.');
    });

    it('should return invalid for revoked certificate', async () => {
      // Arrange
      const mockCertificate: Partial<Certificate> = {
        certificateId: 1,
        certificateNumber: 'CERT-CHAR-2024-0001',
        type: 'character',
        studentId: 1,
        issuedDate: new Date('2024-01-15'),
        issuedDateBS: '2080-10-01',
        data: { student_name: 'John Doe' },
        status: 'revoked',
        revokedAt: new Date('2024-02-01'),
        revokedReason: 'Student transferred',
        verificationUrl: 'http://localhost:3000/api/v1/certificates/verify/CERT-CHAR-2024-0001',
      };

      mockCertificateRepo.findByCertificateNumber = jest.fn().mockResolvedValue(mockCertificate);

      // Act
      const result = await service.verifyCertificate('CERT-CHAR-2024-0001');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.certificate).toBeDefined();
      expect(result.certificate?.status).toBe('revoked');
      expect(result.certificate?.revokedReason).toBe('Student transferred');
      expect(result.message).toContain('revoked');
      expect(result.message).toContain('Student transferred');
    });

    it('should return invalid for empty certificate number', async () => {
      // Act
      const result = await service.verifyCertificate('');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.certificate).toBeUndefined();
      expect(result.message).toBe('Certificate number is required');
    });

    it('should return invalid for whitespace-only certificate number', async () => {
      // Act
      const result = await service.verifyCertificate('   ');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.certificate).toBeUndefined();
      expect(result.message).toBe('Certificate number is required');
    });

    it('should return comprehensive certificate information for valid certificate', async () => {
      // Arrange
      const mockCertificate: Partial<Certificate> = {
        certificateId: 1,
        certificateNumber: 'CERT-ACAD-2024-0123',
        type: 'academic_excellence',
        studentId: 42,
        issuedDate: new Date('2024-03-20'),
        issuedDateBS: '2080-12-07',
        data: {
          student_name: 'Jane Smith',
          class: 'Class 12',
          achievement: 'First Position',
          gpa: '3.9',
        },
        status: 'active',
        verificationUrl: 'http://localhost:3000/api/v1/certificates/verify/CERT-ACAD-2024-0123',
      };

      mockCertificateRepo.findByCertificateNumber = jest.fn().mockResolvedValue(mockCertificate);

      // Act
      const result = await service.verifyCertificate('CERT-ACAD-2024-0123');

      // Assert
      expect(result.valid).toBe(true);
      expect(result.certificate).toBeDefined();
      expect(result.certificate?.certificateNumber).toBe('CERT-ACAD-2024-0123');
      expect(result.certificate?.type).toBe('academic_excellence');
      expect(result.certificate?.studentId).toBe(42);
      expect(result.certificate?.data).toEqual({
        student_name: 'Jane Smith',
        class: 'Class 12',
        achievement: 'First Position',
        gpa: '3.9',
      });
      expect(result.certificate?.verificationUrl).toBe('http://localhost:3000/api/v1/certificates/verify/CERT-ACAD-2024-0123');
    });

    it('should include revocation date in message for revoked certificate', async () => {
      // Arrange
      const revokedDate = new Date('2024-02-15');
      const mockCertificate: Partial<Certificate> = {
        certificateId: 1,
        certificateNumber: 'CERT-TRAN-2024-0001',
        type: 'transfer',
        studentId: 1,
        issuedDate: new Date('2024-01-01'),
        issuedDateBS: '2080-09-17',
        data: { student_name: 'Test Student' },
        status: 'revoked',
        revokedAt: revokedDate,
        revokedReason: 'Duplicate certificate issued',
        verificationUrl: 'http://localhost:3000/api/v1/certificates/verify/CERT-TRAN-2024-0001',
      };

      mockCertificateRepo.findByCertificateNumber = jest.fn().mockResolvedValue(mockCertificate);

      // Act
      const result = await service.verifyCertificate('CERT-TRAN-2024-0001');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.message).toContain('revoked');
      expect(result.message).toContain('Duplicate certificate issued');
    });

    it('should handle revoked certificate without reason', async () => {
      // Arrange
      const mockCertificate: Partial<Certificate> = {
        certificateId: 1,
        certificateNumber: 'CERT-CHAR-2024-0001',
        type: 'character',
        studentId: 1,
        issuedDate: new Date('2024-01-15'),
        issuedDateBS: '2080-10-01',
        data: { student_name: 'John Doe' },
        status: 'revoked',
        revokedAt: new Date('2024-02-01'),
        revokedReason: undefined,
        verificationUrl: 'http://localhost:3000/api/v1/certificates/verify/CERT-CHAR-2024-0001',
      };

      mockCertificateRepo.findByCertificateNumber = jest.fn().mockResolvedValue(mockCertificate);

      // Act
      const result = await service.verifyCertificate('CERT-CHAR-2024-0001');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Not specified');
    });
  });

  describe('revokeCertificate', () => {
    it('should revoke certificate successfully', async () => {
      // Arrange
      const mockCertificate = {
        certificateId: 1,
        status: 'revoked',
      } as Certificate;

      mockCertificateRepo.revoke = jest.fn().mockResolvedValue(mockCertificate);

      // Act
      const result = await service.revokeCertificate(1, 1, 'Student transferred');

      // Assert
      expect(result.status).toBe('revoked');
      expect(mockCertificateRepo.revoke).toHaveBeenCalledWith(1, 1, 'Student transferred');
    });

    it('should throw error if certificate not found', async () => {
      // Arrange
      mockCertificateRepo.revoke = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.revokeCertificate(999, 1, 'Test reason')
      ).rejects.toThrow('Certificate with ID 999 not found');
    });
  });

  describe('getCertificatesByStudentId', () => {
    it('should return all certificates for a student', async () => {
      // Arrange
      const mockCertificates = [
        { certificateId: 1, studentId: 1, type: 'character' },
        { certificateId: 2, studentId: 1, type: 'academic_excellence' },
      ] as Certificate[];

      mockCertificateRepo.findByStudentId = jest.fn().mockResolvedValue(mockCertificates);

      // Act
      const result = await service.getCertificatesByStudentId(1);

      // Assert
      expect(result).toHaveLength(2);
      expect(result).toEqual(mockCertificates);
      expect(mockCertificateRepo.findByStudentId).toHaveBeenCalledWith(1);
    });
  });

  describe('getCertificateStats', () => {
    it('should return certificate statistics', async () => {
      // Arrange
      const mockStats = {
        total: 100,
        active: 95,
        revoked: 5,
        byType: {
          character: 40,
          transfer: 20,
          academic_excellence: 30,
          sports: 10,
        },
      };

      mockCertificateRepo.getStats = jest.fn().mockResolvedValue(mockStats);

      // Act
      const result = await service.getCertificateStats();

      // Assert
      expect(result).toEqual(mockStats);
      expect(result.total).toBe(100);
      expect(result.active).toBe(95);
      expect(result.revoked).toBe(5);
    });
  });

  describe('certificate number generation', () => {
    it('should generate certificate number with correct format', async () => {
      // Arrange
      const mockTemplate = {
        templateId: 1,
        type: 'character',
        variables: ['student_name'],
        isActive: true,
        renderTemplate: jest.fn(() => '<div>Test</div>'),
      } as any;

      mockTemplateRepo.findById = jest.fn().mockResolvedValue(mockTemplate);
      mockCertificateRepo.existsByCertificateNumber = jest.fn().mockResolvedValue(false);
      mockCertificateRepo.create = jest.fn().mockImplementation((data) => Promise.resolve(data as unknown as Certificate));

      // Act
      const result = await service.generateCertificate({
        templateId: 1,
        studentId: 1,
        data: { student_name: 'John Doe' },
        issuedBy: 1,
      });

      // Assert
      expect(result.certificateNumber).toMatch(/^CERT-CHAR-\d{4}-\d{4}$/);
    });

    it('should generate different prefixes for different types', async () => {
      // Arrange
      const types = [
        { type: 'character', prefix: 'CHAR' },
        { type: 'transfer', prefix: 'TRAN' },
        { type: 'academic_excellence', prefix: 'ACAD' },
        { type: 'eca', prefix: 'ECA' },
        { type: 'sports', prefix: 'SPRT' },
      ];

      for (const { type, prefix } of types) {
        const mockTemplate = {
          templateId: 1,
          type,
          variables: ['student_name'],
          isActive: true,
          renderTemplate: jest.fn(() => '<div>Test</div>'),
        } as any;

        mockTemplateRepo.findById = jest.fn().mockResolvedValue(mockTemplate);
        mockCertificateRepo.existsByCertificateNumber = jest.fn().mockResolvedValue(false);
        mockCertificateRepo.create = jest.fn().mockImplementation((data) => Promise.resolve(data as Certificate));

        // Act
        const result = await service.generateCertificate({
          templateId: 1,
          studentId: 1,
          data: { student_name: 'John Doe' },
          issuedBy: 1,
        });

        // Assert
        expect(result.certificateNumber).toContain(prefix);
      }
    });
  });
});
