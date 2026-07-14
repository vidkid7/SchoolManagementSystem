import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import sportsEnrollmentService from './sportsEnrollment.service';
import tournamentService from './tournament.service';
import sportsAchievementService from './sportsAchievement.service';
import Sport from '@models/Sport.model';
import Team from '@models/Team.model';
import SportsEnrollment from '@models/SportsEnrollment.model';
import SportsAchievement from '@models/SportsAchievement.model';
import Tournament from '@models/Tournament.model';

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

      const createdSport = await Sport.create({
        name: req.body.name,
        nameNp: req.body.nameNp,
        category: req.body.category,
        description: req.body.description,
        descriptionNp: req.body.descriptionNp,
        coordinatorId: req.body.coordinatorId,
        academicYearId: req.body.academicYearId,
        status: 'active'
      });
      const createdSportId = Number(createdSport.getDataValue('sportId'));
      const sport = Number.isFinite(createdSportId) && createdSportId > 0
        ? createdSport
        : await Sport.findOne({
          where: {
            name: req.body.name,
            category: req.body.category,
            coordinatorId: req.body.coordinatorId,
            academicYearId: req.body.academicYearId,
          },
          order: [['createdAt', 'DESC']],
        }) || createdSport;

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
   * Delete sport
   * DELETE /api/v1/sports/:sportId
   */
  async deleteSport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sportId = parseInt(req.params.sportId);
      const sport = await Sport.findByPk(sportId);
      if (!sport) {
        res.status(404).json({
          success: false,
          error: { code: 'SPORT_NOT_FOUND', message: `Sport with ID ${sportId} not found` },
        });
        return;
      }
      await sport.destroy();
      res.status(200).json({
        success: true,
        message: 'Sport deleted successfully',
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

      const teams = await Team.findAll({
        where: filters,
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });
      const total = teams.length;

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
   * Get enrollments for a sport
   * GET /api/v1/sports/:sportId/enrollments
   */
  async getSportEnrollments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sportId = parseInt(req.params.sportId);
      const status = (req.query.status as 'active' | 'withdrawn' | 'completed') || 'active';
      const enrollments = await sportsEnrollmentService.getSportEnrollments(sportId, status);
      res.status(200).json({
        success: true,
        data: enrollments,
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
   * Get sports achievements
   * GET /api/v1/sports/achievements
   */
  async getAchievements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = (page - 1) * limit;
      const filters: any = {};

      if (req.query.sportId) filters.sportId = parseInt(req.query.sportId as string);
      if (req.query.teamId) filters.teamId = parseInt(req.query.teamId as string);
      if (req.query.tournamentId) filters.tournamentId = parseInt(req.query.tournamentId as string);
      if (req.query.studentId) filters.studentId = parseInt(req.query.studentId as string);
      if (req.query.type) filters.type = req.query.type;
      if (req.query.level) filters.level = req.query.level;

      const achievements = await sportsAchievementService.getAchievements(filters);
      const data = achievements.slice(offset, offset + limit);

      res.status(200).json({
        success: true,
        data,
        meta: {
          page,
          limit,
          total: achievements.length,
          totalPages: Math.ceil(achievements.length / limit),
        },
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
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      const [
        totalSports,
        totalTeams,
        totalPlayers,
        upcomingMatches,
        categoryRows,
        tournaments,
      ] = await Promise.all([
        Sport.count(),
        Team.count(),
        SportsEnrollment.count({ distinct: true, col: 'studentId' }),
        Tournament.count({
          where: {
            status: { [Op.in]: ['scheduled', 'ongoing'] },
            startDate: { [Op.gte]: new Date() },
          },
        }),
        Sport.findAll({
          attributes: [
            'category',
            [Sport.sequelize!.fn('COUNT', Sport.sequelize!.col('sport_id')), 'count'],
          ],
          group: ['category'],
          raw: true,
        }) as unknown as Promise<Array<{ category: string; count: string | number }>>,
        Tournament.findAll({
          where: { startDate: { [Op.gte]: sixMonthsAgo } },
          attributes: ['startDate', 'schedule'],
          raw: true,
        }) as Promise<Array<{ startDate: string | Date; schedule?: unknown[] }>>,
      ]);

      const monthBuckets = new Map<string, number>();
      for (let i = 5; i >= 0; i -= 1) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        monthBuckets.set(date.toLocaleString('en-US', { month: 'short' }), 0);
      }

      tournaments.forEach((tournament) => {
        const date = new Date(tournament.startDate);
        if (Number.isNaN(date.getTime())) return;
        const label = date.toLocaleString('en-US', { month: 'short' });
        if (!monthBuckets.has(label)) return;
        const matchCount = Array.isArray(tournament.schedule) && tournament.schedule.length
          ? tournament.schedule.length
          : 1;
        monthBuckets.set(label, (monthBuckets.get(label) || 0) + matchCount);
      });

      const stats = {
        totalSports,
        totalTeams,
        totalPlayers,
        upcomingMatches,
        sportsByCategory: categoryRows.map((row) => ({
          category: row.category || 'Uncategorized',
          count: Number(row.count || 0),
        })),
        monthlyMatches: Array.from(monthBuckets.entries()).map(([month, count]) => ({ month, count })),
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

      const [tournaments, achievements] = await Promise.all([
        Tournament.findAll({
          order: [['startDate', 'DESC'], ['createdAt', 'DESC']],
          limit,
          raw: true,
        }) as Promise<any[]>,
        SportsAchievement.findAll({
          order: [['achievementDate', 'DESC'], ['createdAt', 'DESC']],
          limit,
          raw: true,
        }) as Promise<any[]>,
      ]);

      const sportIds = [
        ...tournaments.map((item) => item.sportId),
        ...achievements.map((item) => item.sportId),
      ].filter(Boolean);
      const sports = sportIds.length
        ? await Sport.findAll({
            where: { sportId: { [Op.in]: Array.from(new Set(sportIds)) } },
            attributes: ['sportId', 'name'],
            raw: true,
          }) as Array<{ sportId: number; name: string }>
        : [];
      const sportNameById = new Map(sports.map((sport) => [Number(sport.sportId), sport.name]));

      const tournamentRows = tournaments.flatMap((tournament) => {
        const sportName = sportNameById.get(Number(tournament.sportId)) || 'Sport';
        if (Array.isArray(tournament.schedule) && tournament.schedule.length) {
          return tournament.schedule.map((match: any, index: number) => ({
            id: match.matchId || `tournament-${tournament.tournamentId}-${index}`,
            sport: sportName,
            tournament: tournament.name,
            teamA: match.team1Id ? `Team #${match.team1Id}` : match.participant1Id ? `Participant #${match.participant1Id}` : tournament.name,
            teamB: match.team2Id ? `Team #${match.team2Id}` : match.participant2Id ? `Participant #${match.participant2Id}` : '',
            score: [match.score1, match.score2].filter(Boolean).join('-'),
            date: match.date || tournament.startDate,
            status: tournament.status,
            result: match.winnerId ? `Winner #${match.winnerId}` : tournament.status,
          }));
        }

        return [{
          id: `tournament-${tournament.tournamentId}`,
          sport: sportName,
          tournament: tournament.name,
          teamA: tournament.name,
          teamB: tournament.venue || '',
          score: '',
          date: tournament.startDate,
          status: tournament.status,
          result: tournament.status,
        }];
      });

      const achievementRows = achievements.map((achievement) => ({
        id: `achievement-${achievement.achievementId}`,
        sport: sportNameById.get(Number(achievement.sportId)) || 'Sport',
        tournament: achievement.title,
        teamA: achievement.teamId ? `Team #${achievement.teamId}` : `Student #${achievement.studentId}`,
        teamB: achievement.level,
        score: achievement.medal || achievement.position || '',
        date: achievement.achievementDate,
        status: 'completed',
        result: achievement.type,
      }));

      const matches = [...tournamentRows, ...achievementRows]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);

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
