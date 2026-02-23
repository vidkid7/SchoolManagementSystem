/**
 * CV Controller Unit Tests
 * 
 * Tests for CV HTTP request handlers
 * 
 * Requirements: 26.1, 26.3, 26.4, 26.5
 */

import { Request, Response } from 'express';
import cvController from '../cv.controller';
import cvService from '../cv.service';

// Mock cvService
jest.mock('../cv.service');

describe('CVController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;
  let responseSend: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    responseJson = jest.fn();
    responseStatus = jest.fn().mockReturnThis();
    responseSend = jest.fn();

    mockResponse = {
      json: responseJson,
      status: responseStatus,
      send: responseSend,
      setHeader: jest.fn()
    };

    mockRequest = {
      params: {},
      body: {},
      query: {}
    };
  });

  describe('getCV', () => {
    it('should return CV customization for valid student ID', async () => {
      mockRequest.params = { studentId: '100' };
      
      const mockCV = {
        studentId: 100,
        showPersonalInfo: true,
        showAcademicPerformance: true,
        showAttendance: true,
        showECA: true,
        showSports: true,
        showCertificates: true,
        showAwards: true,
        showTeacherRemarks: true,
        skills: '["JavaScript"]',
        hobbies: '["Reading"]',
        careerGoals: 'Software Engineer',
        personalStatement: 'Passionate developer',
        templateId: 'standard',
        schoolBrandingEnabled: true,
        lastGeneratedAt: new Date(),
        getSkills: function() { return JSON.parse(this.skills); },
        getHobbies: function() { return JSON.parse(this.hobbies); }
      };

      (cvService.getOrCreateCustomization as jest.Mock).mockResolvedValue(mockCV);

      await cvController.getCV(mockRequest as Request, mockResponse as Response);

      expect(cvService.getOrCreateCustomization).toHaveBeenCalledWith(100);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            studentId: 100,
            templateId: 'standard'
          })
        })
      );
    });

    it('should return 400 for invalid student ID', async () => {
      mockRequest.params = { studentId: 'invalid' };

      await cvController.getCV(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INVALID_STUDENT_ID'
          })
        })
      );
    });
  });

  describe('updateCV', () => {
    it('should update CV customization successfully', async () => {
      mockRequest.params = { studentId: '100' };
      mockRequest.body = {
        showPersonalInfo: false,
        skills: ['JavaScript', 'Python'],
        templateId: 'professional'
      };

      const mockCV = {
        studentId: 100,
        showPersonalInfo: false,
        showAcademicPerformance: true,
        showAttendance: true,
        showECA: true,
        showSports: true,
        showCertificates: true,
        showAwards: true,
        showTeacherRemarks: true,
        skills: '["JavaScript", "Python"]',
        hobbies: '[]',
        careerGoals: '',
        personalStatement: '',
        templateId: 'professional',
        schoolBrandingEnabled: true,
        getSkills: function() { return JSON.parse(this.skills); },
        getHobbies: function() { return JSON.parse(this.hobbies); },
        save: jest.fn().mockResolvedValue(undefined)
      };

      (cvService.updateCustomization as jest.Mock).mockResolvedValue(mockCV);

      await cvController.updateCV(mockRequest as Request, mockResponse as Response);

      expect(cvService.updateCustomization).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 100,
          showPersonalInfo: false,
          skills: ['JavaScript', 'Python'],
          templateId: 'professional'
        })
      );
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'CV customization updated successfully'
        })
      );
    });

    it('should return 400 for invalid student ID', async () => {
      mockRequest.params = { studentId: 'abc' };
      mockRequest.body = { showPersonalInfo: true };

      await cvController.updateCV(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
    });
  });

  describe('getCVData', () => {
    it('should return compiled CV data', async () => {
      mockRequest.params = { studentId: '100' };

      const mockCVData = {
        studentId: 100,
        generatedAt: new Date(),
        verificationUrl: 'http://localhost:3000/api/v1/cv/verify/100',
        personalInfo: {
          studentId: 100,
          studentCode: 'STU001',
          fullNameEn: 'John Doe',
          dateOfBirthBS: '2060-05-15',
          gender: 'male',
          addressEn: 'Kathmandu'
        },
        academicPerformance: {
          academicYears: [],
          overallGPA: 3.5,
          totalSubjects: 5,
          averageGrade: 'A-'
        },
        attendance: {
          overallPercentage: 90,
          totalDays: 200,
          presentDays: 180,
          absentDays: 10,
          lateDays: 10,
          excusedDays: 0,
          yearWise: []
        },
        customFields: {
          skills: ['JavaScript'],
          hobbies: ['Reading'],
          careerGoals: 'Software Engineer',
          personalStatement: 'Passionate'
        }
      };

      (cvService.compileCVData as jest.Mock).mockResolvedValue(mockCVData);

      await cvController.getCVData(mockRequest as Request, mockResponse as Response);

      expect(cvService.compileCVData).toHaveBeenCalledWith(100);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            studentId: 100,
            personalInfo: expect.any(Object),
            academicPerformance: expect.any(Object)
          })
        })
      );
    });
  });

  describe('generateCVPDF', () => {
    it('should generate PDF successfully', async () => {
      mockRequest.params = { studentId: '100' };
      mockRequest.query = { template: 'professional', branding: 'true' };

      const mockPDF = Buffer.from('PDF content');
      (cvService.generateCVPDF as jest.Mock).mockResolvedValue(mockPDF);

      await cvController.generateCVPDF(mockRequest as Request, mockResponse as Response);

      expect(cvService.generateCVPDF).toHaveBeenCalledWith(100, {
        templateId: 'professional',
        schoolBrandingEnabled: true
      });
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename=cv_100.pdf');
      expect(responseSend).toHaveBeenCalledWith(mockPDF);
    });

    it('should use default template when not specified', async () => {
      mockRequest.params = { studentId: '100' };
      mockRequest.query = {};

      const mockPDF = Buffer.from('PDF content');
      (cvService.generateCVPDF as jest.Mock).mockResolvedValue(mockPDF);

      await cvController.generateCVPDF(mockRequest as Request, mockResponse as Response);

      expect(cvService.generateCVPDF).toHaveBeenCalledWith(100, {
        templateId: undefined,
        schoolBrandingEnabled: undefined
      });
    });
  });

  describe('verifyCV', () => {
    it('should return valid verification for existing CV', async () => {
      mockRequest.params = { studentId: '100' };

      (cvService.verifyCV as jest.Mock).mockResolvedValue({
        valid: true,
        studentId: 100,
        studentName: 'John Doe',
        lastGeneratedAt: new Date(),
        message: 'CV is valid and authentic'
      });

      await cvController.verifyCV(mockRequest as Request, mockResponse as Response);

      expect(cvService.verifyCV).toHaveBeenCalledWith(100);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            valid: true,
            studentName: 'John Doe'
          })
        })
      );
    });

    it('should return invalid for non-existent CV', async () => {
      mockRequest.params = { studentId: '999' };

      (cvService.verifyCV as jest.Mock).mockResolvedValue({
        valid: false,
        studentId: 999,
        message: 'CV not found for this student'
      });

      await cvController.verifyCV(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            valid: false
          })
        })
      );
    });
  });

  describe('saveCVPDF', () => {
    it('should save PDF and return file path', async () => {
      mockRequest.params = { studentId: '100' };
      mockRequest.body = { templateId: 'modern', schoolBrandingEnabled: true };

      (cvService.saveCVPDF as jest.Mock).mockResolvedValue('/uploads/cv/cv_100_123456.pdf');

      await cvController.saveCVPDF(mockRequest as Request, mockResponse as Response);

      expect(cvService.saveCVPDF).toHaveBeenCalledWith(100, {
        templateId: 'modern',
        schoolBrandingEnabled: true
      });
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            filePath: '/uploads/cv/cv_100_123456.pdf'
          }),
          message: 'CV saved successfully'
        })
      );
    });
  });
});