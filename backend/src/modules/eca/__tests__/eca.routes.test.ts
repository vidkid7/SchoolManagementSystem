/**
 * ECA Routes Integration Tests
 * 
 * Tests all ECA API endpoints with validation and business logic
 * 
 * Requirements: 11.1-11.10
 */

import request from 'supertest';
import express, { Express } from 'express';
import ecaRoutes from '../eca.routes';
import ECA from '@models/ECA.model';
import ECAAchievement from '@models/ECAAchievement.model';

// Mock the models
jest.mock('@models/ECA.model');
jest.mock('@models/ECAEnrollment.model');
jest.mock('@models/ECAEvent.model');
jest.mock('@models/ECAAchievement.model');

// Mock the services
jest.mock('../ecaEnrollment.service');
jest.mock('../ecaEvent.service');
jest.mock('../ecaCertificate.service');

import ecaEnrollmentService from '../ecaEnrollment.service';
import ecaEventService from '../ecaEvent.service';
import ecaCertificateService from '../ecaCertificate.service';

describe('ECA Routes', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware
    app.use((req: any, _res, next) => {
      req.user = { userId: 1, role: 'eca_coordinator' };
      next();
    });
    
    app.use('/api/v1/eca', ecaRoutes);
    
    // Error handler
    app.use((err: any, _req: any, res: any, _next: any) => {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: err.message
        }
      });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/eca', () => {
    it('should get all ECAs with pagination', async () => {
      const mockECAs = [
        {
          ecaId: 1,
          name: 'Debate Club',
          category: 'club',
          coordinatorId: 1,
          academicYearId: 1,
          currentEnrollment: 15,
          capacity: 30,
          status: 'active'
        },
        {
          ecaId: 2,
          name: 'Music Club',
          category: 'cultural',
          coordinatorId: 2,
          academicYearId: 1,
          currentEnrollment: 20,
          capacity: 25,
          status: 'active'
        }
      ];

      (ECA.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: mockECAs,
        count: 2
      });

      const response = await request(app)
        .get('/api/v1/eca')
        .query({ page: 1, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1
      });
    });

    it('should filter ECAs by category', async () => {
      const mockECAs = [
        {
          ecaId: 1,
          name: 'Debate Club',
          category: 'club',
          coordinatorId: 1,
          academicYearId: 1,
          status: 'active'
        }
      ];

      (ECA.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: mockECAs,
        count: 1
      });

      const response = await request(app)
        .get('/api/v1/eca')
        .query({ category: 'club' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category).toBe('club');
    });
  });

  describe('POST /api/v1/eca', () => {
    it('should create a new ECA', async () => {
      const newECA = {
        name: 'Science Club',
        category: 'club',
        subcategory: 'STEM',
        description: 'Science and technology club',
        coordinatorId: 1,
        schedule: 'Every Friday 3-5 PM',
        capacity: 30,
        academicYearId: 1
      };

      const createdECA = {
        ecaId: 1,
        ...newECA,
        currentEnrollment: 0,
        status: 'active'
      };

      (ECA.create as jest.Mock).mockResolvedValue(createdECA);

      const response = await request(app)
        .post('/api/v1/eca')
        .send(newECA);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Science Club');
      expect(response.body.message).toBe('ECA created successfully');
    });

    it('should return validation error for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/eca')
        .send({
          name: 'Test Club'
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return validation error for invalid category', async () => {
      const response = await request(app)
        .post('/api/v1/eca')
        .send({
          name: 'Test Club',
          category: 'invalid_category',
          coordinatorId: 1,
          academicYearId: 1
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/eca/:ecaId', () => {
    it('should get ECA by ID', async () => {
      const mockECA = {
        ecaId: 1,
        name: 'Debate Club',
        category: 'club',
        coordinatorId: 1,
        academicYearId: 1,
        status: 'active'
      };

      (ECA.findByPk as jest.Mock).mockResolvedValue(mockECA);

      const response = await request(app)
        .get('/api/v1/eca/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.ecaId).toBe(1);
    });

    it('should return 404 for non-existent ECA', async () => {
      (ECA.findByPk as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/eca/999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ECA_NOT_FOUND');
    });
  });

  describe('PUT /api/v1/eca/:ecaId', () => {
    it('should update ECA', async () => {
      const mockECA = {
        ecaId: 1,
        name: 'Debate Club',
        category: 'club',
        coordinatorId: 1,
        academicYearId: 1,
        status: 'active',
        update: jest.fn().mockResolvedValue(true)
      };

      (ECA.findByPk as jest.Mock).mockResolvedValue(mockECA);

      const response = await request(app)
        .put('/api/v1/eca/1')
        .send({
          name: 'Advanced Debate Club',
          capacity: 40
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockECA.update).toHaveBeenCalled();
    });

    it('should return 404 when updating non-existent ECA', async () => {
      (ECA.findByPk as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/v1/eca/999')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/eca/:ecaId', () => {
    it('should delete ECA', async () => {
      const mockECA = {
        ecaId: 1,
        name: 'Debate Club',
        destroy: jest.fn().mockResolvedValue(true)
      };

      (ECA.findByPk as jest.Mock).mockResolvedValue(mockECA);

      const response = await request(app)
        .delete('/api/v1/eca/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockECA.destroy).toHaveBeenCalled();
    });

    it('should return 404 when deleting non-existent ECA', async () => {
      (ECA.findByPk as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/v1/eca/999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/eca/:ecaId/enroll', () => {
    it('should enroll student in ECA', async () => {
      const mockEnrollment = {
        enrollmentId: 1,
        ecaId: 1,
        studentId: 100,
        enrollmentDate: new Date(),
        status: 'active',
        attendanceCount: 0,
        totalSessions: 0
      };

      (ecaEnrollmentService.enrollStudent as jest.Mock).mockResolvedValue(mockEnrollment);

      const response = await request(app)
        .post('/api/v1/eca/1/enroll')
        .send({
          studentId: 100,
          remarks: 'Interested in debate'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.studentId).toBe(100);
      expect(response.body.message).toBe('Student enrolled successfully');
    });

    it('should return validation error for missing studentId', async () => {
      const response = await request(app)
        .post('/api/v1/eca/1/enroll')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle enrollment errors (capacity full)', async () => {
      (ecaEnrollmentService.enrollStudent as jest.Mock).mockRejectedValue(
        new Error('ECA has reached its capacity')
      );

      const response = await request(app)
        .post('/api/v1/eca/1/enroll')
        .send({ studentId: 100 });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/eca/:ecaId/mark-attendance', () => {
    it('should mark attendance for multiple students', async () => {
      const mockUpdatedEnrollments = [
        {
          enrollmentId: 1,
          ecaId: 1,
          studentId: 100,
          attendanceCount: 5,
          totalSessions: 6
        },
        {
          enrollmentId: 2,
          ecaId: 1,
          studentId: 101,
          attendanceCount: 6,
          totalSessions: 6
        }
      ];

      (ecaEnrollmentService.bulkMarkAttendance as jest.Mock).mockResolvedValue(mockUpdatedEnrollments);

      const response = await request(app)
        .post('/api/v1/eca/1/mark-attendance')
        .send({
          attendanceData: [
            { enrollmentId: 1, present: true },
            { enrollmentId: 2, present: true }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.message).toContain('2 students');
    });

    it('should return validation error for invalid attendance data', async () => {
      const response = await request(app)
        .post('/api/v1/eca/1/mark-attendance')
        .send({
          attendanceData: []
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/eca/events', () => {
    it('should create ECA event and notify students', async () => {
      const mockEvent = {
        eventId: 1,
        ecaId: 1,
        name: 'Inter-School Debate Competition',
        type: 'competition',
        eventDate: new Date('2025-03-15'),
        venue: 'School Auditorium',
        status: 'scheduled'
      };

      (ecaEventService.createEvent as jest.Mock).mockResolvedValue(mockEvent);
      (ecaEventService.notifyEnrolledStudents as jest.Mock).mockResolvedValue([100, 101, 102]);

      const response = await request(app)
        .post('/api/v1/eca/events')
        .send({
          ecaId: 1,
          name: 'Inter-School Debate Competition',
          type: 'competition',
          eventDate: '2025-03-15',
          venue: 'School Auditorium'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Inter-School Debate Competition');
      expect(ecaEventService.notifyEnrolledStudents).toHaveBeenCalledWith(1);
    });

    it('should return validation error for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/eca/events')
        .send({
          name: 'Test Event'
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/eca/events', () => {
    it('should get all events with pagination', async () => {
      const mockEvents = [
        {
          eventId: 1,
          ecaId: 1,
          name: 'Debate Competition',
          type: 'competition',
          eventDate: new Date('2025-03-15'),
          status: 'scheduled'
        },
        {
          eventId: 2,
          ecaId: 2,
          name: 'Music Concert',
          type: 'performance',
          eventDate: new Date('2025-04-20'),
          status: 'scheduled'
        }
      ];

      (ecaEventService.getEvents as jest.Mock).mockResolvedValue({
        events: mockEvents,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1
        }
      });

      const response = await request(app)
        .get('/api/v1/eca/events')
        .query({ page: 1, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter events by ECA ID', async () => {
      const mockEvents = [
        {
          eventId: 1,
          ecaId: 1,
          name: 'Debate Competition',
          type: 'competition',
          eventDate: new Date('2025-03-15'),
          status: 'scheduled'
        }
      ];

      (ecaEventService.getEvents as jest.Mock).mockResolvedValue({
        events: mockEvents,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1
        }
      });

      const response = await request(app)
        .get('/api/v1/eca/events')
        .query({ ecaId: 1 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].ecaId).toBe(1);
    });
  });

  describe('POST /api/v1/eca/:ecaId/record-achievement', () => {
    it('should record student achievement', async () => {
      const mockAchievement = {
        achievementId: 1,
        ecaId: 1,
        studentId: 100,
        title: 'First Place - Inter-School Debate',
        type: 'position',
        level: 'district',
        position: '1st',
        achievementDate: new Date('2025-03-15')
      };

      (ECAAchievement.create as jest.Mock).mockResolvedValue(mockAchievement);

      const response = await request(app)
        .post('/api/v1/eca/1/record-achievement')
        .send({
          studentId: 100,
          title: 'First Place - Inter-School Debate',
          type: 'position',
          level: 'district',
          position: '1st',
          achievementDate: '2025-03-15'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('First Place - Inter-School Debate');
      expect(response.body.message).toBe('Achievement recorded successfully');
    });

    it('should return validation error for invalid achievement type', async () => {
      const response = await request(app)
        .post('/api/v1/eca/1/record-achievement')
        .send({
          studentId: 100,
          title: 'Test Achievement',
          type: 'invalid_type',
          level: 'school',
          achievementDate: '2025-03-15'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return validation error for invalid achievement level', async () => {
      const response = await request(app)
        .post('/api/v1/eca/1/record-achievement')
        .send({
          studentId: 100,
          title: 'Test Achievement',
          type: 'award',
          level: 'invalid_level',
          achievementDate: '2025-03-15'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/eca/student/:studentId', () => {
    it('should get complete student ECA history', async () => {
      const mockEnrollments = [
        {
          enrollmentId: 1,
          ecaId: 1,
          studentId: 100,
          status: 'active',
          attendanceCount: 8,
          totalSessions: 10
        }
      ];

      const mockParticipationSummary = {
        totalEnrollments: 2,
        activeEnrollments: 1,
        completedEnrollments: 1,
        averageAttendance: 85,
        ecas: [
          {
            ecaId: 1,
            ecaName: 'Debate Club',
            status: 'active',
            attendancePercentage: 80
          }
        ]
      };

      const mockAchievements = [
        {
          achievementId: 1,
          ecaId: 1,
          studentId: 100,
          title: 'First Place',
          type: 'position',
          level: 'district'
        }
      ];

      const mockCVData = {
        studentId: 100,
        participations: [],
        achievements: [],
        summary: {
          totalECAs: 2,
          totalAchievements: 1,
          highLevelAchievements: 0,
          averageAttendance: 85
        }
      };

      (ecaEnrollmentService.getStudentEnrollments as jest.Mock).mockResolvedValue(mockEnrollments);
      (ecaEnrollmentService.getStudentParticipationSummary as jest.Mock).mockResolvedValue(mockParticipationSummary);
      (ECAAchievement.findAll as jest.Mock).mockResolvedValue(mockAchievements);
      (ecaCertificateService.getStudentECAForCV as jest.Mock).mockResolvedValue(mockCVData);

      const response = await request(app)
        .get('/api/v1/eca/student/100');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('enrollments');
      expect(response.body.data).toHaveProperty('participationSummary');
      expect(response.body.data).toHaveProperty('achievements');
      expect(response.body.data).toHaveProperty('cvData');
      expect(response.body.data.enrollments).toHaveLength(1);
      expect(response.body.data.achievements).toHaveLength(1);
    });

    it('should return validation error for invalid student ID', async () => {
      const response = await request(app)
        .get('/api/v1/eca/student/invalid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
