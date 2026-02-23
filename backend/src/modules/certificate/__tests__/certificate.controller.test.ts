/**
 * Certificate Controller Unit Tests
 * 
 * Tests for certificate HTTP request handlers
 * 
 * Requirements: 25.1, 25.3, 25.4, 25.5
 */

import { Request, Response } from 'express';
import { CertificateController } from '../certificate.controller';
import { CertificateService } from '../certificate.service';
import { Certificate } from '../../../models/Certificate.model';

// Mock the service
jest.mock('../certificate.service');

describe('CertificateController', () => {
  let controller: CertificateController;
  let mockService: jest.Mocked<CertificateService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockService = new CertificateService(null as any, null as any) as jest.Mocked<CertificateService>;
    controller = new CertificateController(mockService);

    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: { userId: 1 },
    } as any;

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  describe('generateCertificate', () => {
    it('should generate certificate successfully', async () => {
      // Arrange
      const mockCertificate = {
        certificateId: 1,
        certificateNumber: 'CERT-CHAR-2024-0001',
      } as Certificate;

      mockRequest.body = {
        templateId: 1,
        studentId: 1,
        data: { student_name: 'John Doe' },
      };

      mockService.generateCertificate = jest.fn().mockResolvedValue(mockCertificate);

      // Act
      await controller.generateCertificate(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCertificate,
        message: 'Certificate generated successfully',
      });
    });

    it('should handle generation errors', async () => {
      // Arrange
      mockRequest.body = {
        templateId: 1,
        studentId: 1,
        data: {},
      };

      mockService.generateCertificate = jest.fn().mockRejectedValue(
        new Error('Missing required variables')
      );

      // Act
      await controller.generateCertificate(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CERTIFICATE_GENERATION_FAILED',
          message: 'Missing required variables',
        },
      });
    });
  });

  describe('bulkGenerateCertificates', () => {
    it('should generate multiple certificates successfully', async () => {
      // Arrange
      const mockResult = {
        success: [
          { certificateId: 1 } as Certificate,
          { certificateId: 2 } as Certificate,
        ],
        failed: [],
      };

      mockRequest.body = {
        templateId: 1,
        students: [
          { studentId: 1, data: { student_name: 'John Doe' } },
          { studentId: 2, data: { student_name: 'Jane Smith' } },
        ],
      };

      mockService.bulkGenerateCertificates = jest.fn().mockResolvedValue(mockResult);

      // Act
      await controller.bulkGenerateCertificates(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: 'Generated 2 certificates successfully. 0 failed.',
      });
    });

    it('should handle partial failures', async () => {
      // Arrange
      const mockResult = {
        success: [{ certificateId: 1 } as Certificate],
        failed: [{ studentId: 2, error: 'Missing data' }],
      };

      mockRequest.body = {
        templateId: 1,
        students: [
          { studentId: 1, data: { student_name: 'John Doe' } },
          { studentId: 2, data: {} },
        ],
      };

      mockService.bulkGenerateCertificates = jest.fn().mockResolvedValue(mockResult);

      // Act
      await controller.bulkGenerateCertificates(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: 'Generated 1 certificates successfully. 1 failed.',
      });
    });

    it('should handle all failures', async () => {
      // Arrange
      const mockResult = {
        success: [],
        failed: [
          { studentId: 1, error: 'Missing required variables' },
          { studentId: 2, error: 'Missing required variables' },
        ],
      };

      mockRequest.body = {
        templateId: 1,
        students: [
          { studentId: 1, data: {} },
          { studentId: 2, data: {} },
        ],
      };

      mockService.bulkGenerateCertificates = jest.fn().mockResolvedValue(mockResult);

      // Act
      await controller.bulkGenerateCertificates(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: 'Generated 0 certificates successfully. 2 failed.',
      });
    });

    it('should return detailed status for each student', async () => {
      // Arrange
      const mockResult = {
        success: [
          { certificateId: 1, studentId: 1, certificateNumber: 'CERT-CHAR-2024-0001' } as Certificate,
          { certificateId: 3, studentId: 3, certificateNumber: 'CERT-CHAR-2024-0003' } as Certificate,
        ],
        failed: [
          { studentId: 2, error: 'Missing required variables: class' },
          { studentId: 4, error: 'Database error' },
        ],
      };

      mockRequest.body = {
        templateId: 1,
        students: [
          { studentId: 1, data: { student_name: 'Student 1', class: 'Class 10' } },
          { studentId: 2, data: { student_name: 'Student 2' } },
          { studentId: 3, data: { student_name: 'Student 3', class: 'Class 11' } },
          { studentId: 4, data: { student_name: 'Student 4', class: 'Class 12' } },
        ],
      };

      mockService.bulkGenerateCertificates = jest.fn().mockResolvedValue(mockResult);

      // Act
      await controller.bulkGenerateCertificates(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.data.success).toHaveLength(2);
      expect(response.data.failed).toHaveLength(2);
      expect(response.data.success[0].certificateNumber).toBe('CERT-CHAR-2024-0001');
      expect(response.data.failed[0].error).toContain('Missing required variables');
    });

    it('should handle service errors', async () => {
      // Arrange
      mockRequest.body = {
        templateId: 999,
        students: [{ studentId: 1, data: { student_name: 'John Doe' } }],
      };

      mockService.bulkGenerateCertificates = jest.fn().mockRejectedValue(
        new Error('Template not found')
      );

      // Act
      await controller.bulkGenerateCertificates(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'BULK_GENERATION_FAILED',
          message: 'Template not found',
        },
      });
    });

    it('should pass issued date to service', async () => {
      // Arrange
      const issuedDate = '2024-03-15';
      const issuedDateBS = '2080-12-02';
      
      const mockResult = {
        success: [{ certificateId: 1 } as Certificate],
        failed: [],
      };

      mockRequest.body = {
        templateId: 1,
        students: [{ studentId: 1, data: { student_name: 'John Doe' } }],
        issuedDate,
        issuedDateBS,
      };

      mockService.bulkGenerateCertificates = jest.fn().mockResolvedValue(mockResult);

      // Act
      await controller.bulkGenerateCertificates(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockService.bulkGenerateCertificates).toHaveBeenCalledWith({
        templateId: 1,
        students: [{ studentId: 1, data: { student_name: 'John Doe' } }],
        issuedBy: 1,
        issuedDate: new Date(issuedDate),
        issuedDateBS,
      });
    });

    it('should handle large batch generation', async () => {
      // Arrange
      const students = Array.from({ length: 100 }, (_, i) => ({
        studentId: i + 1,
        data: { student_name: `Student ${i + 1}` },
      }));

      const mockResult = {
        success: students.map((s, i) => ({ certificateId: i + 1, studentId: s.studentId } as Certificate)),
        failed: [],
      };

      mockRequest.body = {
        templateId: 1,
        students,
      };

      mockService.bulkGenerateCertificates = jest.fn().mockResolvedValue(mockResult);

      // Act
      await controller.bulkGenerateCertificates(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: 'Generated 100 certificates successfully. 0 failed.',
      });
    });
  });

  describe('getCertificateById', () => {
    it('should return certificate by ID', async () => {
      // Arrange
      const mockCertificate = {
        certificateId: 1,
        certificateNumber: 'CERT-CHAR-2024-0001',
      } as Certificate;

      mockRequest.params = { id: '1' };
      mockService.getCertificateById = jest.fn().mockResolvedValue(mockCertificate);

      // Act
      await controller.getCertificateById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCertificate,
      });
    });

    it('should handle certificate not found', async () => {
      // Arrange
      mockRequest.params = { id: '999' };
      mockService.getCertificateById = jest.fn().mockRejectedValue(
        new Error('Certificate with ID 999 not found')
      );

      // Act
      await controller.getCertificateById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CERTIFICATE_NOT_FOUND',
          message: 'Certificate with ID 999 not found',
        },
      });
    });
  });

  describe('getAllCertificates', () => {
    it('should return all certificates', async () => {
      // Arrange
      const mockCertificates = [
        { certificateId: 1 } as Certificate,
        { certificateId: 2 } as Certificate,
      ];

      mockService.getAllCertificates = jest.fn().mockResolvedValue(mockCertificates);

      // Act
      await controller.getAllCertificates(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCertificates,
        meta: { total: 2 },
      });
    });

    it('should apply filters', async () => {
      // Arrange
      mockRequest.query = {
        studentId: '1',
        type: 'character',
        status: 'active',
      };

      const mockCertificates = [{ certificateId: 1 } as Certificate];
      mockService.getAllCertificates = jest.fn().mockResolvedValue(mockCertificates);

      // Act
      await controller.getAllCertificates(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockService.getAllCertificates).toHaveBeenCalledWith({
        studentId: 1,
        type: 'character',
        status: 'active',
        issuedDateFrom: undefined,
        issuedDateTo: undefined,
        search: undefined,
      });
    });
  });

  describe('getCertificatesByStudentId', () => {
    it('should return certificates for a student', async () => {
      // Arrange
      const mockCertificates = [
        { certificateId: 1, studentId: 1 } as Certificate,
        { certificateId: 2, studentId: 1 } as Certificate,
      ];

      mockRequest.params = { studentId: '1' };
      mockService.getCertificatesByStudentId = jest.fn().mockResolvedValue(mockCertificates);

      // Act
      await controller.getCertificatesByStudentId(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCertificates,
        meta: { total: 2 },
      });
    });
  });

  describe('verifyCertificate', () => {
    it('should verify valid certificate and return 200', async () => {
      // Arrange
      const mockResult = {
        valid: true,
        certificate: {
          certificateNumber: 'CERT-CHAR-2024-0001',
          type: 'character',
          studentId: 1,
          issuedDate: new Date('2024-01-15'),
          issuedDateBS: '2080-10-01',
          data: { student_name: 'John Doe' },
          status: 'active',
          verificationUrl: 'http://localhost:3000/api/v1/certificates/verify/CERT-CHAR-2024-0001',
        },
        message: 'Certificate is valid and authentic',
      };

      mockRequest.params = { certificateNumber: 'CERT-CHAR-2024-0001' };
      mockService.verifyCertificate = jest.fn().mockResolvedValue(mockResult);

      // Act
      await controller.verifyCertificate(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            valid: true,
            certificate: mockResult.certificate,
            message: 'Certificate is valid and authentic',
            verifiedAt: expect.any(String),
          }),
        })
      );
    });

    it('should return 404 for invalid certificate', async () => {
      // Arrange
      const mockResult = {
        valid: false,
        message: 'Certificate not found. Please verify the certificate number and try again.',
      };

      mockRequest.params = { certificateNumber: 'INVALID-NUMBER' };
      mockService.verifyCertificate = jest.fn().mockResolvedValue(mockResult);

      // Act
      await controller.verifyCertificate(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          data: expect.objectContaining({
            valid: false,
            message: 'Certificate not found. Please verify the certificate number and try again.',
            verifiedAt: expect.any(String),
          }),
        })
      );
    });

    it('should return 404 for revoked certificate', async () => {
      // Arrange
      const mockResult = {
        valid: false,
        certificate: {
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
        },
        message: 'Certificate has been revoked on February 1, 2024. Reason: Student transferred',
      };

      mockRequest.params = { certificateNumber: 'CERT-CHAR-2024-0001' };
      mockService.verifyCertificate = jest.fn().mockResolvedValue(mockResult);

      // Act
      await controller.verifyCertificate(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          data: expect.objectContaining({
            valid: false,
            certificate: mockResult.certificate,
            message: expect.stringContaining('revoked'),
            verifiedAt: expect.any(String),
          }),
        })
      );
    });

    it('should return 400 for empty certificate number', async () => {
      // Arrange
      mockRequest.params = { certificateNumber: '' };

      // Act
      await controller.verifyCertificate(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_CERTIFICATE_NUMBER',
          message: 'Certificate number is required',
        },
      });
    });

    it('should return 400 for whitespace-only certificate number', async () => {
      // Arrange
      mockRequest.params = { certificateNumber: '   ' };

      // Act
      await controller.verifyCertificate(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_CERTIFICATE_NUMBER',
          message: 'Certificate number is required',
        },
      });
    });

    it('should handle service errors', async () => {
      // Arrange
      mockRequest.params = { certificateNumber: 'CERT-CHAR-2024-0001' };
      mockService.verifyCertificate = jest.fn().mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      await controller.verifyCertificate(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VERIFICATION_FAILED',
          message: 'Database connection failed',
        },
      });
    });

    it('should include verifiedAt timestamp in response', async () => {
      // Arrange
      const mockResult = {
        valid: true,
        certificate: {
          certificateNumber: 'CERT-CHAR-2024-0001',
          type: 'character',
          studentId: 1,
          issuedDate: new Date('2024-01-15'),
          issuedDateBS: '2080-10-01',
          data: { student_name: 'John Doe' },
          status: 'active',
          verificationUrl: 'http://localhost:3000/api/v1/certificates/verify/CERT-CHAR-2024-0001',
        },
        message: 'Certificate is valid and authentic',
      };

      mockRequest.params = { certificateNumber: 'CERT-CHAR-2024-0001' };
      mockService.verifyCertificate = jest.fn().mockResolvedValue(mockResult);

      // Act
      const beforeTime = new Date().toISOString();
      await controller.verifyCertificate(mockRequest as Request, mockResponse as Response);
      const afterTime = new Date().toISOString();

      // Assert
      const responseData = (mockResponse.json as jest.Mock).mock.calls[0][0].data;
      expect(responseData.verifiedAt).toBeDefined();
      expect(responseData.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(responseData.verifiedAt >= beforeTime).toBe(true);
      expect(responseData.verifiedAt <= afterTime).toBe(true);
    });
  });

  describe('revokeCertificate', () => {
    it('should revoke certificate successfully', async () => {
      // Arrange
      const mockCertificate = {
        certificateId: 1,
        status: 'revoked',
      } as Certificate;

      mockRequest.params = { id: '1' };
      mockRequest.body = { reason: 'Student transferred' };
      mockService.revokeCertificate = jest.fn().mockResolvedValue(mockCertificate);

      // Act
      await controller.revokeCertificate(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCertificate,
        message: 'Certificate revoked successfully',
      });
    });

    it('should handle revoke errors', async () => {
      // Arrange
      mockRequest.params = { id: '999' };
      mockRequest.body = { reason: 'Test reason' };
      mockService.revokeCertificate = jest.fn().mockRejectedValue(
        new Error('Certificate with ID 999 not found')
      );

      // Act
      await controller.revokeCertificate(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'REVOKE_FAILED',
          message: 'Certificate with ID 999 not found',
        },
      });
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

      mockService.getCertificateStats = jest.fn().mockResolvedValue(mockStats);

      // Act
      await controller.getCertificateStats(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
      });
    });
  });
});
