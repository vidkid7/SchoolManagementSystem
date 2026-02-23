/**
 * ECA Controller Unit Tests
 * 
 * Tests controller methods with mocked services
 * 
 * Requirements: 11.1-11.10
 */

import { Request, Response, NextFunction } from 'express';
import ecaController from '../eca.controller';
import ecaEnrollmentService from '../ecaEnrollment.service';
import ecaEventService from '../ecaEvent.service';
import ecaCertificateService from '../ecaCertificate.service';
import ECA from '@models/ECA.model';
import ECAAchievement from '@models/ECAAchievement.model';

// Mock the services and models
jest.mock('../ecaEnrollment.service');
jest.mock('../ecaEvent.service');
jest.mock('../ecaCertificate.service');
jest.mock('@models/ECA.model');
jest.mock('@models/ECAAchievement.model');

describe('ECA Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      params: {},
      query: {},
      body: {},
      user: { userId: 1, role: 'eca_coordinator' } as any
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('getECAs', () => {
    it('should return all ECAs with pagination', async () => {
      const mockECAs = [
        { ecaId: 1, name: 'Debate Club', category: 'club' },
        { ecaId: 2, name: 'Music Club', category: 'cultural' }
      ];

      (ECA.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: mockECAs,
        count: 2
      });

      mockRequest.query = { page: '1', limit: '20' };

      await ecaController.getECAs(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockECAs,
        meta: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1
        }
      });
    });

    it('should handle errors', async () => {
      (ECA.findAndCountAll as jest.Mock).mockRejectedValue(new Error('Database error'));

      await ecaController.getECAs(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('createECA', () => {
    it('should create a new ECA', async () => {
      const newECA = {
        ecaId: 1,
        name: 'Science Club',
        category: 'club',
        coordinatorId: 1,
        academicYearId: 1,
        currentEnrollment: 0,
        status: 'active'
      };

      (ECA.create as jest.Mock).mockResolvedValue(newECA);

      mockRequest.body = {
        name: 'Science Club',
        category: 'club',
        coordinatorId: 1,
        academicYearId: 1
      };

      await ecaController.createECA(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: newECA,
        message: 'ECA created successfully'
      });
    });
  });

  describe('enrollStudent', () => {
    it('should enroll student in ECA', async () => {
      const mockEnrollment = {
        enrollmentId: 1,
        ecaId: 1,
        studentId: 100,
        status: 'active'
      };

      (ecaEnrollmentService.enrollStudent as jest.Mock).mockResolvedValue(mockEnrollment);

      mockRequest.params = { ecaId: '1' };
      mockRequest.body = { studentId: 100 };

      await ecaController.enrollStudent(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockEnrollment,
        message: 'Student enrolled successfully'
      });
    });

    it('should handle enrollment errors', async () => {
      (ecaEnrollmentService.enrollStudent as jest.Mock).mockRejectedValue(
        new Error('ECA has reached its capacity')
      );

      mockRequest.params = { ecaId: '1' };
      mockRequest.body = { studentId: 100 };

      await ecaController.enrollStudent(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('markAttendance', () => {
    it('should mark attendance for multiple students', async () => {
      const mockUpdatedEnrollments = [
        { enrollmentId: 1, attendanceCount: 5 },
        { enrollmentId: 2, attendanceCount: 6 }
      ];

      (ecaEnrollmentService.bulkMarkAttendance as jest.Mock).mockResolvedValue(mockUpdatedEnrollments);

      mockRequest.body = {
        attendanceData: [
          { enrollmentId: 1, present: true },
          { enrollmentId: 2, present: true }
        ]
      };

      await ecaController.markAttendance(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedEnrollments,
        message: 'Attendance marked for 2 students'
      });
    });
  });

  describe('createEvent', () => {
    it('should create event and notify students', async () => {
      const mockEvent = {
        eventId: 1,
        ecaId: 1,
        name: 'Debate Competition',
        type: 'competition',
        eventDate: new Date('2025-03-15')
      };

      (ecaEventService.createEvent as jest.Mock).mockResolvedValue(mockEvent);
      (ecaEventService.notifyEnrolledStudents as jest.Mock).mockResolvedValue([100, 101]);

      mockRequest.body = {
        ecaId: 1,
        name: 'Debate Competition',
        type: 'competition',
        eventDate: '2025-03-15'
      };

      await ecaController.createEvent(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ecaEventService.notifyEnrolledStudents).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockEvent,
        message: 'Event created successfully'
      });
    });
  });

  describe('recordAchievement', () => {
    it('should record student achievement', async () => {
      const mockAchievement = {
        achievementId: 1,
        ecaId: 1,
        studentId: 100,
        title: 'First Place',
        type: 'position',
        level: 'district'
      };

      (ECAAchievement.create as jest.Mock).mockResolvedValue(mockAchievement);

      mockRequest.params = { ecaId: '1' };
      mockRequest.body = {
        studentId: 100,
        title: 'First Place',
        type: 'position',
        level: 'district',
        achievementDate: '2025-03-15'
      };

      await ecaController.recordAchievement(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockAchievement,
        message: 'Achievement recorded successfully'
      });
    });
  });

  describe('getStudentECAHistory', () => {
    it('should return complete student ECA history', async () => {
      const mockEnrollments = [{ enrollmentId: 1, ecaId: 1, studentId: 100 }];
      const mockParticipationSummary = {
        totalEnrollments: 1,
        activeEnrollments: 1,
        averageAttendance: 85
      };
      const mockAchievements = [{ achievementId: 1, title: 'First Place' }];
      const mockCVData = {
        studentId: 100,
        participations: [],
        achievements: [],
        summary: { totalECAs: 1, totalAchievements: 1 }
      };

      (ecaEnrollmentService.getStudentEnrollments as jest.Mock).mockResolvedValue(mockEnrollments);
      (ecaEnrollmentService.getStudentParticipationSummary as jest.Mock).mockResolvedValue(mockParticipationSummary);
      (ECAAchievement.findAll as jest.Mock).mockResolvedValue(mockAchievements);
      (ecaCertificateService.getStudentECAForCV as jest.Mock).mockResolvedValue(mockCVData);

      mockRequest.params = { studentId: '100' };

      await ecaController.getStudentECAHistory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          enrollments: mockEnrollments,
          participationSummary: mockParticipationSummary,
          achievements: mockAchievements,
          cvData: mockCVData
        }
      });
    });
  });
});
