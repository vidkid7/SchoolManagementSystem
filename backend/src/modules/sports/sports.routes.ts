import { Router } from 'express';
import sportsController from './sports.controller';
import { authenticate, authorize } from '@middleware/auth';
import { UserRole } from '@models/User.model';
import {
  createSportValidation,
  updateSportValidation,
  getSportByIdValidation,
  getSportsValidation,
  createTeamValidation,
  updateTeamValidation,
  getTeamByIdValidation,
  getTeamsValidation,
  enrollStudentValidation,
  markAttendanceValidation,
  createTournamentValidation,
  getTournamentsValidation,
  recordMatchResultValidation,
  recordAchievementValidation,
  getStudentSportsHistoryValidation
} from './sports.validation';

/**
 * Sports API Routes
 * 
 * Requirements: 12.1-12.11
 */

const router = Router();

router.use(authenticate);

const readRoles = [
  UserRole.SCHOOL_ADMIN,
  UserRole.CLASS_TEACHER,
  UserRole.SUBJECT_TEACHER,
  UserRole.DEPARTMENT_HEAD,
  UserRole.SPORTS_COORDINATOR,
  UserRole.STUDENT,
  UserRole.PARENT
];

const manageRoles = [
  UserRole.SCHOOL_ADMIN,
  UserRole.SPORTS_COORDINATOR
];

/**
 * @route   GET /api/v1/sports/statistics
 * @desc    Get sports dashboard statistics
 * @access  Private (School_Admin, Sports_Coordinator, Department_Head)
 */
router.get(
  '/statistics',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.SPORTS_COORDINATOR, UserRole.DEPARTMENT_HEAD),
  sportsController.getStatistics
);

/**
 * @route   GET /api/v1/sports/recent-matches
 * @desc    Get recent sports matches
 * @access  Private (School_Admin, Sports_Coordinator, Department_Head)
 */
router.get(
  '/recent-matches',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.SPORTS_COORDINATOR, UserRole.DEPARTMENT_HEAD),
  sportsController.getRecentMatches
);

/**
 * @route   GET /api/v1/sports
 * @desc    List sports with filters and pagination
 * @access  Private (All authenticated)
 */
router.get(
  '/',
  authorize(...readRoles),
  getSportsValidation,
  sportsController.getSports
);

/**
 * @route   POST /api/v1/sports
 * @desc    Create a new sport
 * @access  Private (Sports Coordinator, Admin)
 */
router.post(
  '/',
  authorize(...manageRoles),
  createSportValidation,
  sportsController.createSport
);

/**
 * @route   GET /api/v1/sports/teams
 * @desc    Get teams with filters
 * @access  Private (All authenticated)
 */
router.get(
  '/teams',
  authorize(...readRoles),
  getTeamsValidation,
  sportsController.getTeams
);

/**
 * @route   POST /api/v1/sports/teams
 * @desc    Create a new team
 * @access  Private (Sports Coordinator, Admin)
 */
router.post(
  '/teams',
  authorize(...manageRoles),
  createTeamValidation,
  sportsController.createTeam
);

/**
 * @route   GET /api/v1/sports/teams/:teamId
 * @desc    Get team details by ID
 * @access  Private (All authenticated)
 */
router.get(
  '/teams/:teamId',
  authorize(...readRoles),
  getTeamByIdValidation,
  sportsController.getTeamById
);

/**
 * @route   PUT /api/v1/sports/teams/:teamId
 * @desc    Update team
 * @access  Private (Sports Coordinator, Admin)
 */
router.put(
  '/teams/:teamId',
  authorize(...manageRoles),
  updateTeamValidation,
  sportsController.updateTeam
);

/**
 * @route   GET /api/v1/sports/tournaments
 * @desc    Get tournaments with filters
 * @access  Private (All authenticated)
 */
router.get(
  '/tournaments',
  authorize(...readRoles),
  getTournamentsValidation,
  sportsController.getTournaments
);

/**
 * @route   POST /api/v1/sports/tournaments
 * @desc    Create a new tournament
 * @access  Private (Sports Coordinator, Admin)
 */
router.post(
  '/tournaments',
  authorize(...manageRoles),
  createTournamentValidation,
  sportsController.createTournament
);

/**
 * @route   POST /api/v1/sports/tournaments/:tournamentId/record-result
 * @desc    Record match result in tournament
 * @access  Private (Sports Coordinator, Admin)
 */
router.post(
  '/tournaments/:tournamentId/record-result',
  authorize(...manageRoles),
  recordMatchResultValidation,
  sportsController.recordMatchResult
);

/**
 * @route   POST /api/v1/sports/achievements
 * @desc    Record student achievement in sports
 * @access  Private (Sports Coordinator, Admin)
 */
router.post(
  '/achievements',
  authorize(...manageRoles),
  recordAchievementValidation,
  sportsController.recordAchievement
);

/**
 * @route   GET /api/v1/sports/student/:studentId
 * @desc    Get student sports history
 * @access  Private (All authenticated)
 */
router.get(
  '/student/:studentId',
  authorize(...readRoles),
  getStudentSportsHistoryValidation,
  sportsController.getStudentSportsHistory
);

/**
 * @route   GET /api/v1/sports/:sportId
 * @desc    Get sport details by ID
 * @access  Private (All authenticated)
 */
router.get(
  '/:sportId',
  authorize(...readRoles),
  getSportByIdValidation,
  sportsController.getSportById
);

/**
 * @route   PUT /api/v1/sports/:sportId
 * @desc    Update sport
 * @access  Private (Sports Coordinator, Admin)
 */
router.put(
  '/:sportId',
  authorize(...manageRoles),
  updateSportValidation,
  sportsController.updateSport
);

/**
 * @route   POST /api/v1/sports/:sportId/enroll
 * @desc    Enroll student in sport
 * @access  Private (Sports Coordinator, Admin)
 */
router.post(
  '/:sportId/enroll',
  authorize(...manageRoles),
  enrollStudentValidation,
  sportsController.enrollStudent
);

/**
 * @route   POST /api/v1/sports/:sportId/mark-attendance
 * @desc    Mark attendance for practice session
 * @access  Private (Sports Coordinator, Admin)
 */
router.post(
  '/:sportId/mark-attendance',
  authorize(...manageRoles),
  markAttendanceValidation,
  sportsController.markAttendance
);

export default router;
