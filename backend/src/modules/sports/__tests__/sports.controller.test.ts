/**
 * Sports Controller Unit Tests
 * 
 * Tests controller methods for sports management
 * 
 * Requirements: 12.1-12.11
 */

import { Request, Response, NextFunction } from 'express';
import sportsController from '../sports.controller';
import Sport from '@models/Sport.model';
import Team from '@models/Team.model';
import sportsEnrollmentService from '../sportsEnrollment.service';
import tournamentService from '../tournament.service';
import sportsAchievementService from '../sportsAchievement.service';

// Mock the models and services
jest.mock('@models/Sport.model');
jest.mock('@models/Team.model');
jest.mock('@models/Tournament.model');
jest.mock('@models/SportsAchievement.model');
jest.mock('../sportsEnrollment.service');
jest.mock('../tournament.service');
jest.mock('../sportsAchievement.service');

describe('Sports Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      query: {},
      params: {},
      body: {},
      user: { userId: 1, role: 'sports_coordinator' } as any
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('getSports', () => {
    it('should get all sports with pagination', async () => {
      const mockSports = [
        { sportId: 1, name: 'Football', category: 'team' },
        { sportId: 2, name: 'Athletics', category: 'individual' }
      ];

      (Sport.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: mockSports,
        count: 2
      });

      mockRequest.query = { page: '1', limit: '20' };

      await sportsController.getSports(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockSports,
        meta: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1
        }
      });
    });

    it('should filter sports by category', async () => {
      const mockSports = [
        { sportId: 1, name: 'Football', category: 'team' }
      ];

      (Sport.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: mockSports,
        count: 1
      });

      mockRequest.query = { category: 'team' };

      await sportsController.getSports(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(Sport.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { category: 'team' }
        })
      );
    });
  });

  describe('createSport', () => {
    it('should create a new sport', async () => {
      const newSport = {
        name: 'Basketball',
        category: 'team',
        coordinatorId: 1,
        academicYearId: 1
      };

      const createdSport = {
        sportId: 1,
        ...newSport,
        status: 'active'
      };

      (Sport.create as jest.Mock).mockResolvedValue(createdSport);

      mockRequest.body = newSport;

      await sportsController.createSport(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: createdSport,
        message: 'Sport created successfully'
      });
    });
  });

  describe('getSportById', () => {
    it('should get sport by ID', async () => {
      const mockSport = {
        sportId: 1,
        name: 'Football',
        category: 'team'
      };

      (Sport.findByPk as jest.Mock).mockResolvedValue(mockSport);

      mockRequest.params = { sportId: '1' };

      await sportsController.getSportById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockSport
      });
    });

    it('should return 404 for non-existent sport', async () => {
      (Sport.findByPk as jest.Mock).mockResolvedValue(null);

      mockRequest.params = { sportId: '999' };

      await sportsController.getSportById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SPORT_NOT_FOUND',
          message: 'Sport with ID 999 not found'
        }
      });
    });
  });

  describe('updateSport', () => {
    it('should update sport', async () => {
      const mockSport = {
        sportId: 1,
        name: 'Football',
        update: jest.fn().mockResolvedValue(true)
      };

      (Sport.findByPk as jest.Mock).mockResolvedValue(mockSport);

      mockRequest.params = { sportId: '1' };
      mockRequest.body = { name: 'Soccer', status: 'inactive' };

      await sportsController.updateSport(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockSport.update).toHaveBeenCalledWith({
        name: 'Soccer',
        status: 'inactive'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('enrollStudent', () => {
    it('should enroll student in sport', async () => {
      const enrollmentData = {
        studentId: 1,
        teamId: 1
      };

      const mockEnrollment = {
        enrollmentId: 1,
        sportId: 1,
        studentId: 1,
        status: 'active'
      };

      (sportsEnrollmentService.enrollStudent as jest.Mock).mockResolvedValue(mockEnrollment);

      mockRequest.params = { sportId: '1' };
      mockRequest.body = enrollmentData;

      await sportsController.enrollStudent(
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
  });

  describe('markAttendance', () => {
    it('should mark attendance for practice session', async () => {
      const attendanceData = [
        { enrollmentId: 1, present: true },
        { enrollmentId: 2, present: false }
      ];

      const mockUpdatedEnrollments = [
        { enrollmentId: 1, attendanceCount: 10 },
        { enrollmentId: 2, attendanceCount: 8 }
      ];

      (sportsEnrollmentService.bulkMarkAttendance as jest.Mock).mockResolvedValue(mockUpdatedEnrollments);

      mockRequest.params = { sportId: '1' };
      mockRequest.body = { attendanceData };

      await sportsController.markAttendance(
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

  describe('createTournament', () => {
    it('should create a new tournament', async () => {
      const tournamentData = {
        sportId: 1,
        name: 'Inter-School Championship',
        type: 'inter_school',
        startDate: '2024-03-01',
        endDate: '2024-03-15'
      };

      const createdTournament = {
        tournamentId: 1,
        ...tournamentData,
        status: 'scheduled'
      };

      (tournamentService.createTournament as jest.Mock).mockResolvedValue(createdTournament);

      mockRequest.body = tournamentData;

      await sportsController.createTournament(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: createdTournament,
        message: 'Tournament created successfully'
      });
    });
  });

  describe('recordMatchResult', () => {
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

      mockRequest.params = { tournamentId: '1' };
      mockRequest.body = matchResult;

      await sportsController.recordMatchResult(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: updatedTournament,
        message: 'Match result recorded successfully'
      });
    });
  });

  describe('recordAchievement', () => {
    it('should record achievement', async () => {
      const achievementData = {
        sportId: 1,
        studentId: 1,
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

      mockRequest.body = achievementData;

      await sportsController.recordAchievement(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: createdAchievement,
        message: 'Achievement recorded successfully'
      });
    });
  });

  describe('getStudentSportsHistory', () => {
    it('should get student sports history', async () => {
      const mockEnrollments = [
        { enrollmentId: 1, sportId: 1, status: 'active' }
      ];

      const mockParticipationSummary = {
        totalSports: 2,
        activeSports: 1
      };

      const mockAchievements = [
        { achievementId: 1, title: 'Gold Medal' }
      ];

      const mockCVData = {
        sports: ['Football'],
        achievements: ['Gold Medal']
      };

      (sportsEnrollmentService.getStudentEnrollments as jest.Mock).mockResolvedValue(mockEnrollments);
      (sportsEnrollmentService.getStudentParticipationSummary as jest.Mock).mockResolvedValue(mockParticipationSummary);
      (sportsAchievementService.getStudentAchievements as jest.Mock).mockResolvedValue(mockAchievements);
      (sportsAchievementService.getStudentSportsForCV as jest.Mock).mockResolvedValue(mockCVData);

      mockRequest.params = { studentId: '1' };

      await sportsController.getStudentSportsHistory(
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

  describe('getTeams', () => {
    it('should get all teams with pagination', async () => {
      const mockTeams = [
        { teamId: 1, name: 'Team A', sportId: 1 }
      ];

      (Team.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: mockTeams,
        count: 1
      });

      mockRequest.query = { page: '1', limit: '20' };

      await sportsController.getTeams(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockTeams,
        meta: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1
        }
      });
    });
  });

  describe('createTeam', () => {
    it('should create a new team', async () => {
      const newTeam = {
        sportId: 1,
        name: 'Team A',
        captainId: 1,
        members: [1, 2, 3],
        academicYearId: 1
      };

      const createdTeam = {
        teamId: 1,
        ...newTeam,
        status: 'active'
      };

      (Team.create as jest.Mock).mockResolvedValue(createdTeam);

      mockRequest.body = newTeam;

      await sportsController.createTeam(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: createdTeam,
        message: 'Team created successfully'
      });
    });
  });
});
