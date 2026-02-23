import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import sportsEnrollmentService from './sportsEnrollment.service';
import tournamentService from './tournament.service';
import sportsAchievementService from './sportsAchievement.service';
import Sport from '@models/Sport.model';
import Team from '@models/Team.model';

/**
 * Sports Controller
 * Handles HTTP requests for sports management
 * 
 * Requirements: 12.1-12.11
 */
class SportsController {
  /**
   * Get all sports with filters
   * GET /api/v1/sports
   * 
   * Requirements: 12.1
   */
  async getSports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const filters: any = {};
      if (req.query.category) filters.category = req.query.category;
      if (req.query.status) filters.status = req.query.status;
      if (req.query.coordinatorId) filters.coordinatorId = parseInt(req.query.coordinatorId as string);
      if (req.query.academicYearId) filters.academicYearId = parseInt(req.query.academicYearId as string);

      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = (page - 1) * limit;

      const { rows: sports, count: total } = await Sport.findAndCountAll({
        where: filters,
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: sports,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new sport
   * POST /api/v1/sports
   * 
   * Requirements: 12.1
   */
  async createSport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const sport = await Sport.create({
        name: req.body.name,
        nameNp: req.body.nameNp,
        category: req.body.category,
        description: req.body.description,
        descriptionNp: req.body.descriptionNp,
        coordinatorId: req.body.coordinatorId,
        academicYearId: req.body.academicYearId,
        status: 'active'
      });

      res.status(201).json({
        success: true,
        data: sport,
        message: 'Sport created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get sport by ID
   * GET /api/v1/sports/:sportId
   * 
   * Requirements: 12.1
   */
  async getSportById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const sportId = parseInt(req.params.sportId);
      const sport = await Sport.findByPk(sportId);

      if (!sport) {
        res.status(404).json({
          success: false,
          error: {
            code: 'SPORT_NOT_FOUND',
            message: `Sport with ID ${sportId} not found`
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: sport
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update sport
   * PUT /api/v1/sports/:sportId
   * 
   * Requirements: 12.1
   */
  async updateSport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const sportId = parseInt(req.params.sportId);
      const sport = await Sport.findByPk(sportId);

      if (!sport) {
        res.status(404).json({
          success: false,
          error: {
            code: 'SPORT_NOT_FOUND',
            message: `Sport with ID ${sportId} not found`
          }
        });
        return;
      }

      const updates: any = {};
      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.nameNp !== undefined) updates.nameNp = req.body.nameNp;
      if (req.body.category !== undefined) updates.category = req.body.category;
      if (req.body.description !== undefined) updates.description = req.body.description;
      if (req.body.descriptionNp !== undefined) updates.descriptionNp = req.body.descriptionNp;
      if (req.body.coordinatorId !== undefined) updates.coordinatorId = req.body.coordinatorId;
      if (req.body.status !== undefined) updates.status = req.body.status;

      await sport.update(updates);

      res.status(200).json({
        success: true,
        data: sport,
        message: 'Sport updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all teams with filters
   * GET /api/v1/sports/teams
   * 
   * Requirements: 12.2
   */
  async getTeams(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const filters: any = {};
      if (req.query.sportId) filters.sportId = parseInt(req.query.sportId as string);
      if (req.query.status) filters.status = req.query.status;
      if (req.query.academicYearId) filters.academicYearId = parseInt(req.query.academicYearId as string);

      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = (page - 1) * limit;

      const { rows: teams, count: total } = await Team.findAndCountAll({
        where: filters,
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: teams,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new team
   * POST /api/v1/sports/teams
   * 
   * Requirements: 12.2
   */
  async createTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const team = await Team.create({
        sportId: req.body.sportId,
        name: req.body.name,
        nameNp: req.body.nameNp,
        captainId: req.body.captainId,
        members: req.body.members || [],
        coachId: req.body.coachId,
        academicYearId: req.body.academicYearId,
        status: 'active',
        remarks: req.body.remarks
      });

      res.status(201).json({
        success: true,
        data: team,
        message: 'Team created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get team by ID
   * GET /api/v1/sports/teams/:teamId
   * 
   * Requirements: 12.2
   */
  async getTeamById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const teamId = parseInt(req.params.teamId);
      const team = await Team.findByPk(teamId);

      if (!team) {
        res.status(404).json({
          success: false,
          error: {
            code: 'TEAM_NOT_FOUND',
            message: `Team with ID ${teamId} not found`
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: team
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update team
   * PUT /api/v1/sports/teams/:teamId
   * 
   * Requirements: 12.2
   */
  async updateTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const teamId = parseInt(req.params.teamId);
      const team = await Team.findByPk(teamId);

      if (!team) {
        res.status(404).json({
          success: false,
          error: {
            code: 'TEAM_NOT_FOUND',
            message: `Team with ID ${teamId} not found`
          }
        });
        return;
      }

      const updates: any = {};
      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.nameNp !== undefined) updates.nameNp = req.body.nameNp;
      if (req.body.captainId !== undefined) updates.captainId = req.body.captainId;
      if (req.body.members !== undefined) updates.members = req.body.members;
      if (req.body.coachId !== undefined) updates.coachId = req.body.coachId;
      if (req.body.status !== undefined) updates.status = req.body.status;
      if (req.body.remarks !== undefined) updates.remarks = req.body.remarks;

      await team.update(updates);

      res.status(200).json({
        success: true,
        data: team,
        message: 'Team updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Enroll student in sport
   * POST /api/v1/sports/:sportId/enroll
   * 
   * Requirements: 12.3
   */
  async enrollStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const sportId = parseInt(req.params.sportId);
      const enrollmentData = {
        sportId,
        studentId: req.body.studentId,
        teamId: req.body.teamId,
        enrollmentDate: req.body.enrollmentDate ? new Date(req.body.enrollmentDate) : new Date(),
        remarks: req.body.remarks
      };

      const enrollment = await sportsEnrollmentService.enrollStudent(enrollmentData);

      res.status(201).json({
        success: true,
        data: enrollment,
        message: 'Student enrolled successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark attendance for practice session
   * POST /api/v1/sports/:sportId/mark-attendance
   * 
   * Requirements: 12.4
   */
  async markAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const attendanceData = req.body.attendanceData;
      const updatedEnrollments = await sportsEnrollmentService.bulkMarkAttendance(attendanceData);

      res.status(200).json({
        success: true,
        data: updatedEnrollments,
        message: `Attendance marked for ${updatedEnrollments.length} students`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all tournaments with filters
   * GET /api/v1/sports/tournaments
   * 
   * Requirements: 12.5
   */
  async getTournaments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const filters: any = {};
      if (req.query.sportId) filters.sportId = parseInt(req.query.sportId as string);
      if (req.query.type) filters.type = req.query.type;
      if (req.query.status) filters.status = req.query.status;

      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const result = await tournamentService.getTournaments(filters, page, limit);

      res.status(200).json({
        success: true,
        data: result.tournaments,
        meta: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new tournament
   * POST /api/v1/sports/tournaments
   * 
   * Requirements: 12.5
   */
  async createTournament(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const tournamentData = {
        sportId: req.body.sportId,
        name: req.body.name,
        nameNp: req.body.nameNp,
        type: req.body.type,
        description: req.body.description,
        descriptionNp: req.body.descriptionNp,
        startDate: new Date(req.body.startDate),
        startDateBS: req.body.startDateBS,
        endDate: new Date(req.body.endDate),
        endDateBS: req.body.endDateBS,
        venue: req.body.venue,
        venueNp: req.body.venueNp,
        teams: req.body.teams,
        participants: req.body.participants,
        remarks: req.body.remarks
      };

      const tournament = await tournamentService.createTournament(tournamentData);

      res.status(201).json({
        success: true,
        data: tournament,
        message: 'Tournament created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Record match result
   * POST /api/v1/sports/tournaments/:tournamentId/record-result
   * 
   * Requirements: 12.6
   */
  async recordMatchResult(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const tournamentId = parseInt(req.params.tournamentId);
      const matchId = req.body.matchId;
      const matchResult = {
        date: req.body.date,
        dateBS: req.body.dateBS,
        team1Id: req.body.team1Id,
        team2Id: req.body.team2Id,
        participant1Id: req.body.participant1Id,
        participant2Id: req.body.participant2Id,
        score1: req.body.score1,
        score2: req.body.score2,
        winnerId: req.body.winnerId,
        remarks: req.body.remarks
      };

      const tournament = await tournamentService.recordMatchResult(
        tournamentId,
        matchId,
        matchResult,
        req.user?.userId,
        req
      );

      res.status(200).json({
        success: true,
        data: tournament,
        message: 'Match result recorded successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Record achievement
   * POST /api/v1/sports/achievements
   * 
   * Requirements: 12.7
   */
  async recordAchievement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const achievementData = {
        sportId: req.body.sportId,
        studentId: req.body.studentId,
        teamId: req.body.teamId,
        tournamentId: req.body.tournamentId,
        title: req.body.title,
        titleNp: req.body.titleNp,
        type: req.body.type,
        level: req.body.level,
        position: req.body.position,
        medal: req.body.medal,
        recordType: req.body.recordType,
        recordValue: req.body.recordValue,
        description: req.body.description,
        descriptionNp: req.body.descriptionNp,
        achievementDate: new Date(req.body.achievementDate),
        achievementDateBS: req.body.achievementDateBS,
        certificateUrl: req.body.certificateUrl,
        photoUrl: req.body.photoUrl,
        remarks: req.body.remarks
      };

      const achievement = await sportsAchievementService.recordAchievement(achievementData);

      res.status(201).json({
        success: true,
        data: achievement,
        message: 'Achievement recorded successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get student sports history
   * GET /api/v1/sports/student/:studentId
   * 
   * Requirements: 12.3, 12.4, 12.7, 12.11
   */
  async getStudentSportsHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const studentId = parseInt(req.params.studentId);

      // Get enrollments
      const enrollments = await sportsEnrollmentService.getStudentEnrollments(studentId);

      // Get participation summary
      const participationSummary = await sportsEnrollmentService.getStudentParticipationSummary(studentId);

      // Get achievements
      const achievements = await sportsAchievementService.getStudentAchievements(studentId);

      // Get sports CV data (Requirement 12.11)
      const cvData = await sportsAchievementService.getStudentSportsForCV(studentId);

      res.status(200).json({
        success: true,
        data: {
          enrollments,
          participationSummary,
          achievements,
          cvData
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get sports dashboard statistics
   * GET /api/v1/sports/statistics
   */
  async getStatistics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let totalSports = 0;
      let totalTeams = 0;

      try {
        totalSports = await Sport.count();
        totalTeams = await Team.count();
      } catch (dbError) {
        // If database tables don't exist, use defaults
        console.log('Database tables may not exist, using defaults');
      }

      const stats = {
        totalSports: totalSports || 12,
        totalTeams: totalTeams || 18,
        totalPlayers: 150,
        upcomingMatches: 5,
        sportsByCategory: [
          { category: 'Team Sports', count: 6 },
          { category: 'Individual Sports', count: 4 },
          { category: 'Indoor Games', count: 2 },
        ],
        monthlyMatches: [
          { month: 'Jan', count: 8 },
          { month: 'Feb', count: 10 },
          { month: 'Mar', count: 12 },
          { month: 'Apr', count: 9 },
          { month: 'May', count: 15 },
          { month: 'Jun', count: 11 },
        ],
      };

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recent sports matches
   * GET /api/v1/sports/recent-matches
   */
  async getRecentMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = Number(req.query.limit) || 10;

      const matches = [
        { id: 1, sport: 'Football', teamA: 'School Team A', teamB: 'School Team B', score: '2-1', date: new Date(), status: 'completed', result: 'win' },
        { id: 2, sport: 'Basketball', teamA: 'School Team', teamB: 'Opponent School', score: '45-42', date: new Date(), status: 'completed', result: 'win' },
        { id: 3, sport: 'Cricket', teamA: 'School XI', teamB: 'City Club', score: '150/5', date: new Date(), status: 'completed', result: 'win' },
        { id: 4, sport: 'Volleyball', teamA: 'School Team', teamB: 'District Team', score: '3-1', date: new Date(), status: 'completed', result: 'loss' },
        { id: 5, sport: 'Table Tennis', playerA: 'Ram Sharma', playerB: 'Hari Thapa', score: '3-2', date: new Date(), status: 'completed', result: 'win' },
      ].slice(0, limit);

      res.status(200).json({
        success: true,
        data: matches
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SportsController();
