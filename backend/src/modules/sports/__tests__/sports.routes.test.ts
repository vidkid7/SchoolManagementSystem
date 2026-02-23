/**
 * Sports Routes Integration Tests
 * 
 * Tests all Sports API endpoints with validation and business logic
 * 
 * Requirements: 12.1-12.11
 */

import request from 'supertest';
import express, { Express } from 'express';
import sportsRoutes from '../sports.routes';
import Sport from '@models/Sport.model';
import Team from '@models/Team.model';

// Mock the models
jest.mock('@models/Sport.model');
jest.mock('@models/Team.model');
jest.mock('@models/Tournament.model');
jest.mock('@models/SportsAchievement.model');
jest.mock('@models/SportsEnrollment.model');

// Mock the services
jest.mock('../sportsEnrollment.service');
jest.mock('../tournament.service');
jest.mock('../sportsAchievement.service');

import sportsEnrollmentService from '../sportsEnrollment.service';
import tournamentService from '../tournament.service';
import sportsAchievementService from '../sportsAchievement.service';

describe('Sports Routes', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware
    app.use((req: any, _res, next) => {
      req.user = { userId: 1, role: 'sports_coordinator' };
      next();
    });
    
    app.use('/api/v1/sports', sportsRoutes);
    
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

  describe('GET /api/v1/sports', () => {
    it('should get all sports with pagination', async () => {
      const mockSports = [
        {
          sportId: 1,
          name: 'Football',
          category: 'team',
          coordinatorId: 1,
          academicYearId: 1,
          status: 'active'
        },
        {
          sportId: 2,
          name: 'Athletics',
          category: 'individual',
          coordinatorId: 1,
          academicYearId: 1,
          status: 'active'
        }
      ];

      (Sport.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: mockSports,
        count: 2
      });

      const response = await request(app)
        .get('/api/v1/sports')
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

    it('should filter sports by category', async () => {
      const mockSports = [
        {
          sportId: 1,
          name: 'Football',
          category: 'team',
          coordinatorId: 1,
          academicYearId: 1,
          status: 'active'
        }
      ];

      (Sport.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: mockSports,
        count: 1
      });

      const response = await request(app)
        .get('/api/v1/sports')
        .query({ category: 'team' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category).toBe('team');
    });
  });

  describe('POST /api/v1/sports', () => {
    it('should create a new sport', async () => {
      const newSport = {
        name: 'Basketball',
        nameNp: 'बास्केटबल',
        category: 'team',
        description: 'Team basketball sport',
        coordinatorId: 1,
        academicYearId: 1
      };

      const createdSport = {
        sportId: 1,
        ...newSport,
        status: 'active'
      };

      (Sport.create as jest.Mock).mockResolvedValue(createdSport);

      const response = await request(app)
        .post('/api/v1/sports')
        .send(newSport);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Basketball');
      expect(response.body.message).toBe('Sport created successfully');
    });

    it('should return validation error for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/sports')
        .send({
          name: 'Basketball'
          // Missing category, coordinatorId, academicYearId
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return validation error for invalid category', async () => {
      const response = await request(app)
        .post('/api/v1/sports')
        .send({
          name: 'Basketball',
          category: 'invalid_category',
          coordinatorId: 1,
          academicYearId: 1
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/sports/:sportId', () => {
    it('should get sport by ID', async () => {
      const mockSport = {
        sportId: 1,
        name: 'Football',
        category: 'team',
        coordinatorId: 1,
        academicYearId: 1,
        status: 'active'
      };

      (Sport.findByPk as jest.Mock).mockResolvedValue(mockSport);

      const response = await request(app)
        .get('/api/v1/sports/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sportId).toBe(1);
    });

    it('should return 404 for non-existent sport', async () => {
      (Sport.findByPk as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/sports/999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SPORT_NOT_FOUND');
    });
  });

  describe('PUT /api/v1/sports/:sportId', () => {
    it('should update sport', async () => {
      const mockSport = {
        sportId: 1,
        name: 'Football',
        category: 'team',
        status: 'active',
        update: jest.fn().mockResolvedValue(true)
      };

      (Sport.findByPk as jest.Mock).mockResolvedValue(mockSport);

      const response = await request(app)
        .put('/api/v1/sports/1')
        .send({ name: 'Soccer', status: 'inactive' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockSport.update).toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/sports/teams', () => {
    it('should get all teams with pagination', async () => {
      const mockTeams = [
        {
          teamId: 1,
          sportId: 1,
          name: 'Team A',
          captainId: 1,
          members: [1, 2, 3],
          status: 'active'
        }
      ];

      (Team.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: mockTeams,
        count: 1
      });

      const response = await request(app)
        .get('/api/v1/sports/teams');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('POST /api/v1/sports/teams', () => {
    it('should create a new team', async () => {
      const newTeam = {
        sportId: 1,
        name: 'Team A',
        nameNp: 'टोली ए',
        captainId: 1,
        members: [1, 2, 3],
        coachId: 1,
        academicYearId: 1
      };

      const createdTeam = {
        teamId: 1,
        ...newTeam,
        status: 'active'
      };

      (Team.create as jest.Mock).mockResolvedValue(createdTeam);

      const response = await request(app)
        .post('/api/v1/sports/teams')
        .send(newTeam);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Team A');
    });
  });

  describe('POST /api/v1/sports/:sportId/enroll', () => {
    it('should enroll student in sport', async () => {
      const enrollmentData = {
        studentId: 1,
        teamId: 1,
        enrollmentDate: '2024-01-15'
      };

      const mockEnrollment = {
        enrollmentId: 1,
        sportId: 1,
        studentId: 1,
        teamId: 1,
        status: 'active'
      };

      (sportsEnrollmentService.enrollStudent as jest.Mock).mockResolvedValue(mockEnrollment);

      const response = await request(app)
        .post('/api/v1/sports/1/enroll')
        .send(enrollmentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Student enrolled successfully');
    });
  });

  describe('POST /api/v1/sports/:sportId/mark-attendance', () => {
    it('should mark attendance for practice session', async () => {
      const attendanceData = {
        attendanceData: [
          { enrollmentId: 1, present: true },
          { enrollmentId: 2, present: false }
        ]
      };

      const mockUpdatedEnrollments = [
        { enrollmentId: 1, attendanceCount: 10 },
        { enrollmentId: 2, attendanceCount: 8 }
      ];

      (sportsEnrollmentService.bulkMarkAttendance as jest.Mock).mockResolvedValue(mockUpdatedEnrollments);

      const response = await request(app)
        .post('/api/v1/sports/1/mark-attendance')
        .send(attendanceData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Attendance marked for 2 students');
    });
  });

  describe('GET /api/v1/sports/tournaments', () => {
    it('should get all tournaments with pagination', async () => {
      const mockTournaments = [
        {
          tournamentId: 1,
          sportId: 1,
          name: 'Inter-School Football Championship',
          type: 'inter_school',
          status: 'scheduled'
        }
      ];

      const mockResult = {
        tournaments: mockTournaments,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1
        }
      };

      (tournamentService.getTournaments as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/v1/sports/tournaments');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('POST /api/v1/sports/tournaments', () => {
    it('should create a new tournament', async () => {
      const newTournament = {
        sportId: 1,
        name: 'Inter-School Football Championship',
        type: 'inter_school',
        startDate: '2024-03-01',
        endDate: '2024-03-15',
        venue: 'School Ground'
      };

      const createdTournament = {
        tournamentId: 1,
        ...newTournament,
        status: 'scheduled'
      };

      (tournamentService.createTournament as jest.Mock).mockResolvedValue(createdTournament);

      const response = await request(app)
        .post('/api/v1/sports/tournaments')
        .send(newTournament);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Tournament created successfully');
    });
  });

  describe('POST /api/v1/sports/tournaments/:tournamentId/record-result', () => {
    it('should record match result', async () => {
      const matchResult = {
        matchId: 'match-1',
        date: '2024-03-05',
        team1Id: 1,
        team2Id: 2,
        score1: '3',
        score2: '1',
        winnerId: 1
      };

      const updatedTournament = {
        tournamentId: 1,
        schedule: [matchResult]
      };

      (tournamentService.recordMatchResult as jest.Mock).mockResolvedValue(updatedTournament);

      const response = await request(app)
        .post('/api/v1/sports/tournaments/1/record-result')
        .send(matchResult);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Match result recorded successfully');
    });
  });

  describe('POST /api/v1/sports/achievements', () => {
    it('should record achievement', async () => {
      const achievementData = {
        sportId: 1,
        studentId: 1,
        tournamentId: 1,
        title: 'Gold Medal',
        type: 'medal',
        level: 'district',
        medal: 'gold',
        achievementDate: '2024-03-15'
      };

      const createdAchievement = {
        achievementId: 1,
        ...achievementData
      };

      (sportsAchievementService.recordAchievement as jest.Mock).mockResolvedValue(createdAchievement);

      const response = await request(app)
        .post('/api/v1/sports/achievements')
        .send(achievementData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Achievement recorded successfully');
    });
  });

  describe('GET /api/v1/sports/student/:studentId', () => {
    it('should get student sports history', async () => {
      const mockEnrollments = [
        { enrollmentId: 1, sportId: 1, status: 'active' }
      ];

      const mockParticipationSummary = {
        totalSports: 2,
        activeSports: 1,
        totalAttendance: 85
      };

      const mockAchievements = [
        { achievementId: 1, title: 'Gold Medal', level: 'district' }
      ];

      const mockCVData = {
        sports: ['Football', 'Athletics'],
        achievements: ['Gold Medal - District Level']
      };

      (sportsEnrollmentService.getStudentEnrollments as jest.Mock).mockResolvedValue(mockEnrollments);
      (sportsEnrollmentService.getStudentParticipationSummary as jest.Mock).mockResolvedValue(mockParticipationSummary);
      (sportsAchievementService.getStudentAchievements as jest.Mock).mockResolvedValue(mockAchievements);
      (sportsAchievementService.getStudentSportsForCV as jest.Mock).mockResolvedValue(mockCVData);

      const response = await request(app)
        .get('/api/v1/sports/student/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('enrollments');
      expect(response.body.data).toHaveProperty('participationSummary');
      expect(response.body.data).toHaveProperty('achievements');
      expect(response.body.data).toHaveProperty('cvData');
    });
  });
});
