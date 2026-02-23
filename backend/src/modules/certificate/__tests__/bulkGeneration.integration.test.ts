/**
 * Bulk Certificate Generation Integration Tests
 * 
 * End-to-end tests for bulk certificate generation functionality
 * 
 * Requirements: 25.3
 */

import { CertificateService } from '../certificate.service';
import { CertificateRepository } from '../certificate.repository';
import { CertificateTemplateRepository } from '../certificateTemplate.repository';

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

describe('Bulk Certificate Generation Integration Tests', () => {
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

  describe('Bulk Generation Status Tracking', () => {
    it('should track success and failure counts accurately', async () => {
      // Arrange
      const mockTemplate = {
        templateId: 1,
        type: 'academic_excellence',
        variables: ['student_name', 'achievement', 'gpa'],
        isActive: true,
        renderTemplate: jest.fn(() => '<div>Test</div>'),
      } as any;

      mockTemplateRepo.findById = jest.fn().mockResolvedValue(mockTemplate);
      mockCertificateRepo.existsByCertificateNumber = jest.fn().mockResolvedValue(false);
      
      let callCount = 0;
      mockCertificateRepo.create = jest.fn().mockImplementation((data) => {
        callCount++;
        return Promise.resolve({ ...data, certificateId: callCount } as any);
      });

      const students = [
        { studentId: 1, data: { student_name: 'Alice', achievement: 'First Position', gpa: '4.0' } },
        { studentId: 2, data: { student_name: 'Bob', achievement: 'Second Position' } }, // Missing gpa
        { studentId: 3, data: { student_name: 'Charlie', achievement: 'Third Position', gpa: '3.8' } },
        { studentId: 4, data: { student_name: 'David' } }, // Missing achievement and gpa
        { studentId: 5, data: { student_name: 'Eve', achievement: 'Participation', gpa: '3.5' } },
      ];

      // Act
      const result = await service.bulkGenerateCertificates({
        templateId: 1,
        students,
        issuedBy: 1,
      });

      // Assert
      expect(result.success).toHaveLength(3);
      expect(result.failed).toHaveLength(2);
      
      // Verify successful students
      expect(result.success.map(c => c.studentId)).toEqual([1, 3, 5]);
      
      // Verify failed students
      expect(result.failed.map(f => f.studentId)).toEqual([2, 4]);
      expect(result.failed[0].error).toContain('Missing required variables');
      expect(result.failed[1].error).toContain('Missing required variables');
    });

    it('should provide detailed error messages for each failure', async () => {
      // Arrange
      const mockTemplate = {
        templateId: 1,
        type: 'sports',
        variables: ['student_name', 'sport', 'achievement', 'date'],
        isActive: true,
        renderTemplate: jest.fn(() => '<div>Test</div>'),
      } as any;

      mockTemplateRepo.findById = jest.fn().mockResolvedValue(mockTemplate);

      const students = [
        { studentId: 1, data: { student_name: 'Student 1', sport: 'Football', achievement: 'Gold' } }, // Missing date
        { studentId: 2, data: { student_name: 'Student 2', achievement: 'Silver', date: '2024-03-15' } }, // Missing sport
        { studentId: 3, data: { student_name: 'Student 3', sport: 'Basketball' } }, // Missing achievement and date
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
      
      // Check that each error message mentions the specific missing variables
      expect(result.failed[0].error).toContain('date');
      expect(result.failed[1].error).toContain('sport');
      expect(result.failed[2].error).toContain('achievement');
      expect(result.failed[2].error).toContain('date');
    });

    it('should continue processing after individual failures', async () => {
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
      
      // Simulate database errors for specific students
      let callCount = 0;
      mockCertificateRepo.create = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 2 || callCount === 4) {
          throw new Error(`Database error for call ${callCount}`);
        }
        return Promise.resolve({ certificateId: callCount } as any);
      });

      const students = Array.from({ length: 5 }, (_, i) => ({
        studentId: i + 1,
        data: { student_name: `Student ${i + 1}`, class: `Class ${i + 10}` },
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
      
      // Verify that processing continued after failures
      expect(mockCertificateRepo.create).toHaveBeenCalledTimes(5);
      
      // Verify correct students failed
      expect(result.failed.map(f => f.studentId)).toEqual([2, 4]);
    });
  });

  describe('Bulk Generation with Same Issued Date', () => {
    it('should use the same issued date for all certificates', async () => {
      // Arrange
      const mockTemplate = {
        templateId: 1,
        type: 'course_completion',
        variables: ['student_name', 'course'],
        isActive: true,
        renderTemplate: jest.fn(() => '<div>Test</div>'),
      } as any;

      const issuedDate = new Date('2024-03-15T10:00:00Z');
      const issuedDateBS = '2080-12-02';

      mockTemplateRepo.findById = jest.fn().mockResolvedValue(mockTemplate);
      mockCertificateRepo.existsByCertificateNumber = jest.fn().mockResolvedValue(false);
      
      const createdCertificates: any[] = [];
      mockCertificateRepo.create = jest.fn().mockImplementation((data) => {
        createdCertificates.push(data);
        return Promise.resolve(data as any);
      });

      const students = [
        { studentId: 1, data: { student_name: 'Student A', course: 'Mathematics' } },
        { studentId: 2, data: { student_name: 'Student B', course: 'Science' } },
        { studentId: 3, data: { student_name: 'Student C', course: 'English' } },
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
      expect(createdCertificates).toHaveLength(3);
      
      // All certificates should have the same issued date
      createdCertificates.forEach(cert => {
        expect(cert.issuedDate).toEqual(issuedDate);
        expect(cert.issuedDateBS).toBe(issuedDateBS);
      });
    });
  });

  describe('Bulk Generation with Unique Certificate Numbers', () => {
    it('should generate unique certificate numbers for each student', async () => {
      // Arrange
      const mockTemplate = {
        templateId: 1,
        type: 'eca',
        variables: ['student_name', 'activity'],
        isActive: true,
        renderTemplate: jest.fn(() => '<div>Test</div>'),
      } as any;

      mockTemplateRepo.findById = jest.fn().mockResolvedValue(mockTemplate);
      mockCertificateRepo.existsByCertificateNumber = jest.fn().mockResolvedValue(false);
      
      const certificateNumbers: string[] = [];
      mockCertificateRepo.create = jest.fn().mockImplementation((data) => {
        certificateNumbers.push(data.certificateNumber);
        return Promise.resolve(data as any);
      });

      const students = Array.from({ length: 10 }, (_, i) => ({
        studentId: i + 1,
        data: { student_name: `Student ${i + 1}`, activity: 'Drama Club' },
      }));

      // Act
      await service.bulkGenerateCertificates({
        templateId: 1,
        students,
        issuedBy: 1,
      });

      // Assert
      expect(certificateNumbers).toHaveLength(10);
      
      // All certificate numbers should be unique
      const uniqueNumbers = new Set(certificateNumbers);
      expect(uniqueNumbers.size).toBe(10);
      
      // All should match the expected format
      certificateNumbers.forEach(num => {
        expect(num).toMatch(/^CERT-ECA-\d{4}-\d{4}$/);
      });
    });
  });

  describe('Large Batch Generation', () => {
    it('should handle generation of 100+ certificates', async () => {
      // Arrange
      const mockTemplate = {
        templateId: 1,
        type: 'bonafide',
        variables: ['student_name', 'class'],
        isActive: true,
        renderTemplate: jest.fn(() => '<div>Test</div>'),
      } as any;

      mockTemplateRepo.findById = jest.fn().mockResolvedValue(mockTemplate);
      mockCertificateRepo.existsByCertificateNumber = jest.fn().mockResolvedValue(false);
      mockCertificateRepo.create = jest.fn().mockImplementation((data) => 
        Promise.resolve({ ...data, certificateId: Math.random() } as any)
      );

      const students = Array.from({ length: 150 }, (_, i) => ({
        studentId: i + 1,
        data: { student_name: `Student ${i + 1}`, class: `Class ${(i % 12) + 1}` },
      }));

      // Act
      const startTime = Date.now();
      const result = await service.bulkGenerateCertificates({
        templateId: 1,
        students,
        issuedBy: 1,
      });
      const endTime = Date.now();

      // Assert
      expect(result.success).toHaveLength(150);
      expect(result.failed).toHaveLength(0);
      expect(mockCertificateRepo.create).toHaveBeenCalledTimes(150);
      
      // Should complete in reasonable time (less than 5 seconds for 150 certificates)
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it('should handle mixed success and failure in large batch', async () => {
      // Arrange
      const mockTemplate = {
        templateId: 1,
        type: 'transfer',
        variables: ['student_name', 'previous_class', 'transfer_date'],
        isActive: true,
        renderTemplate: jest.fn(() => '<div>Test</div>'),
      } as any;

      mockTemplateRepo.findById = jest.fn().mockResolvedValue(mockTemplate);
      mockCertificateRepo.existsByCertificateNumber = jest.fn().mockResolvedValue(false);
      mockCertificateRepo.create = jest.fn().mockImplementation((data) => 
        Promise.resolve(data as any)
      );

      // Create 100 students, every 5th one missing required data
      const students = Array.from({ length: 100 }, (_, i) => {
        const studentId = i + 1;
        const data: any = { student_name: `Student ${studentId}` };
        
        // Every 5th student is missing required fields
        if (studentId % 5 !== 0) {
          data.previous_class = `Class ${(i % 12) + 1}`;
          data.transfer_date = '2024-03-15';
        }
        
        return { studentId, data };
      });

      // Act
      const result = await service.bulkGenerateCertificates({
        templateId: 1,
        students,
        issuedBy: 1,
      });

      // Assert
      expect(result.success).toHaveLength(80); // 80 successful
      expect(result.failed).toHaveLength(20); // 20 failed (every 5th)
      
      // Verify failed student IDs are multiples of 5
      result.failed.forEach(f => {
        expect(f.studentId % 5).toBe(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle template not found error', async () => {
      // Arrange
      mockTemplateRepo.findById = jest.fn().mockResolvedValue(null);

      const students = [
        { studentId: 1, data: { student_name: 'John Doe' } },
      ];

      // Act & Assert
      await expect(
        service.bulkGenerateCertificates({
          templateId: 999,
          students,
          issuedBy: 1,
        })
      ).rejects.toThrow('Template with ID 999 not found');
    });

    it('should handle inactive template error', async () => {
      // Arrange
      const mockTemplate = {
        templateId: 1,
        isActive: false,
      } as any;

      mockTemplateRepo.findById = jest.fn().mockResolvedValue(mockTemplate);

      const students = [
        { studentId: 1, data: { student_name: 'John Doe' } },
      ];

      // Act & Assert
      await expect(
        service.bulkGenerateCertificates({
          templateId: 1,
          students,
          issuedBy: 1,
        })
      ).rejects.toThrow('Cannot generate certificate from inactive template');
    });

    it('should handle empty student array gracefully', async () => {
      // Arrange
      const mockTemplate = {
        templateId: 1,
        type: 'character',
        variables: ['student_name'],
        isActive: true,
        renderTemplate: jest.fn(() => '<div>Test</div>'),
      } as any;

      mockTemplateRepo.findById = jest.fn().mockResolvedValue(mockTemplate);

      // Act
      const result = await service.bulkGenerateCertificates({
        templateId: 1,
        students: [],
        issuedBy: 1,
      });

      // Assert
      expect(result.success).toHaveLength(0);
      expect(result.failed).toHaveLength(0);
      expect(mockCertificateRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('Status Reporting', () => {
    it('should return comprehensive status for mixed results', async () => {
      // Arrange
      const mockTemplate = {
        templateId: 1,
        type: 'academic_excellence',
        variables: ['student_name', 'achievement'],
        isActive: true,
        renderTemplate: jest.fn(() => '<div>Test</div>'),
      } as any;

      mockTemplateRepo.findById = jest.fn().mockResolvedValue(mockTemplate);
      mockCertificateRepo.existsByCertificateNumber = jest.fn().mockResolvedValue(false);
      
      let callCount = 0;
      mockCertificateRepo.create = jest.fn().mockImplementation((data) => {
        callCount++;
        if (callCount === 3) {
          throw new Error('Network timeout');
        }
        return Promise.resolve({ 
          ...data, 
          certificateId: callCount,
          certificateNumber: `CERT-ACAD-2024-${callCount.toString().padStart(4, '0')}`,
        } as any);
      });

      const students = [
        { studentId: 1, data: { student_name: 'Alice', achievement: 'First Position' } },
        { studentId: 2, data: { student_name: 'Bob' } }, // Missing achievement
        { studentId: 3, data: { student_name: 'Charlie', achievement: 'Second Position' } },
        { studentId: 4, data: { student_name: 'David', achievement: 'Third Position' } },
      ];

      // Act
      const result = await service.bulkGenerateCertificates({
        templateId: 1,
        students,
        issuedBy: 1,
      });

      // Assert
      expect(result.success).toHaveLength(2);
      expect(result.failed).toHaveLength(2);
      
      // Verify success details
      expect(result.success[0].studentId).toBe(1);
      expect(result.success[0].certificateNumber).toBe('CERT-ACAD-2024-0001');
      expect(result.success[1].studentId).toBe(4);
      expect(result.success[1].certificateNumber).toBe('CERT-ACAD-2024-0003');
      
      // Verify failure details
      expect(result.failed[0].studentId).toBe(2);
      expect(result.failed[0].error).toContain('Missing required variables');
      expect(result.failed[1].studentId).toBe(3);
      expect(result.failed[1].error).toContain('Network timeout');
    });
  });
});
