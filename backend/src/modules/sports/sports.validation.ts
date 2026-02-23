import { body, param, query } from 'express-validator';

/**
 * Sports Validation Rules
 * 
 * Requirements: 12.1-12.11
 */

/**
 * Validation for creating a sport
 */
export const createSportValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Sport name is required')
    .isLength({ max: 200 })
    .withMessage('Sport name must not exceed 200 characters'),

  body('nameNp')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Nepali name must not exceed 200 characters'),

  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['individual', 'team', 'traditional'])
    .withMessage('Invalid category. Must be individual, team, or traditional'),

  body('description')
    .optional()
    .trim(),

  body('descriptionNp')
    .optional()
    .trim(),

  body('coordinatorId')
    .notEmpty()
    .withMessage('Coordinator ID is required')
    .isInt({ min: 1 })
    .withMessage('Coordinator ID must be a positive integer'),

  body('academicYearId')
    .notEmpty()
    .withMessage('Academic year ID is required')
    .isInt({ min: 1 })
    .withMessage('Academic year ID must be a positive integer')
];

/**
 * Validation for updating a sport
 */
export const updateSportValidation = [
  param('sportId')
    .notEmpty()
    .withMessage('Sport ID is required')
    .isInt({ min: 1 })
    .withMessage('Sport ID must be a positive integer'),

  body('name')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Sport name must not exceed 200 characters'),

  body('nameNp')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Nepali name must not exceed 200 characters'),

  body('category')
    .optional()
    .isIn(['individual', 'team', 'traditional'])
    .withMessage('Invalid category'),

  body('description')
    .optional()
    .trim(),

  body('descriptionNp')
    .optional()
    .trim(),

  body('coordinatorId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Coordinator ID must be a positive integer'),

  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Invalid status')
];

/**
 * Validation for getting sport by ID
 */
export const getSportByIdValidation = [
  param('sportId')
    .notEmpty()
    .withMessage('Sport ID is required')
    .isInt({ min: 1 })
    .withMessage('Sport ID must be a positive integer')
];

/**
 * Validation for getting sports with filters
 */
export const getSportsValidation = [
  query('category')
    .optional()
    .isIn(['individual', 'team', 'traditional'])
    .withMessage('Invalid category'),

  query('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Invalid status'),

  query('coordinatorId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Coordinator ID must be a positive integer'),

  query('academicYearId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Academic year ID must be a positive integer'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

/**
 * Validation for creating a team
 */
export const createTeamValidation = [
  body('sportId')
    .notEmpty()
    .withMessage('Sport ID is required')
    .isInt({ min: 1 })
    .withMessage('Sport ID must be a positive integer'),

  body('name')
    .trim()
    .notEmpty()
    .withMessage('Team name is required')
    .isLength({ max: 200 })
    .withMessage('Team name must not exceed 200 characters'),

  body('nameNp')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Nepali name must not exceed 200 characters'),

  body('captainId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Captain ID must be a positive integer'),

  body('members')
    .optional()
    .isArray()
    .withMessage('Members must be an array'),

  body('members.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Each member ID must be a positive integer'),

  body('coachId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Coach ID must be a positive integer'),

  body('academicYearId')
    .notEmpty()
    .withMessage('Academic year ID is required')
    .isInt({ min: 1 })
    .withMessage('Academic year ID must be a positive integer'),

  body('remarks')
    .optional()
    .trim()
];

/**
 * Validation for updating a team
 */
export const updateTeamValidation = [
  param('teamId')
    .notEmpty()
    .withMessage('Team ID is required')
    .isInt({ min: 1 })
    .withMessage('Team ID must be a positive integer'),

  body('name')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Team name must not exceed 200 characters'),

  body('nameNp')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Nepali name must not exceed 200 characters'),

  body('captainId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Captain ID must be a positive integer'),

  body('members')
    .optional()
    .isArray()
    .withMessage('Members must be an array'),

  body('members.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Each member ID must be a positive integer'),

  body('coachId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Coach ID must be a positive integer'),

  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Invalid status'),

  body('remarks')
    .optional()
    .trim()
];

/**
 * Validation for getting team by ID
 */
export const getTeamByIdValidation = [
  param('teamId')
    .notEmpty()
    .withMessage('Team ID is required')
    .isInt({ min: 1 })
    .withMessage('Team ID must be a positive integer')
];

/**
 * Validation for getting teams with filters
 */
export const getTeamsValidation = [
  query('sportId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Sport ID must be a positive integer'),

  query('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Invalid status'),

  query('academicYearId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Academic year ID must be a positive integer'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

/**
 * Validation for enrolling a student
 */
export const enrollStudentValidation = [
  param('sportId')
    .notEmpty()
    .withMessage('Sport ID is required')
    .isInt({ min: 1 })
    .withMessage('Sport ID must be a positive integer'),

  body('studentId')
    .notEmpty()
    .withMessage('Student ID is required')
    .isInt({ min: 1 })
    .withMessage('Student ID must be a positive integer'),

  body('teamId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Team ID must be a positive integer'),

  body('enrollmentDate')
    .optional()
    .isISO8601()
    .withMessage('Enrollment date must be a valid date'),

  body('remarks')
    .optional()
    .trim()
];

/**
 * Validation for marking attendance
 */
export const markAttendanceValidation = [
  param('sportId')
    .notEmpty()
    .withMessage('Sport ID is required')
    .isInt({ min: 1 })
    .withMessage('Sport ID must be a positive integer'),

  body('attendanceData')
    .isArray({ min: 1 })
    .withMessage('Attendance data must be a non-empty array'),

  body('attendanceData.*.enrollmentId')
    .notEmpty()
    .withMessage('Enrollment ID is required')
    .isInt({ min: 1 })
    .withMessage('Enrollment ID must be a positive integer'),

  body('attendanceData.*.present')
    .notEmpty()
    .withMessage('Present status is required')
    .isBoolean()
    .withMessage('Present must be a boolean')
];

/**
 * Validation for creating a tournament
 */
export const createTournamentValidation = [
  body('sportId')
    .notEmpty()
    .withMessage('Sport ID is required')
    .isInt({ min: 1 })
    .withMessage('Sport ID must be a positive integer'),

  body('name')
    .trim()
    .notEmpty()
    .withMessage('Tournament name is required')
    .isLength({ max: 255 })
    .withMessage('Tournament name must not exceed 255 characters'),

  body('nameNp')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Nepali name must not exceed 255 characters'),

  body('type')
    .notEmpty()
    .withMessage('Tournament type is required')
    .isIn(['inter_school', 'intra_school', 'district', 'regional', 'national'])
    .withMessage('Invalid tournament type'),

  body('description')
    .optional()
    .trim(),

  body('descriptionNp')
    .optional()
    .trim(),

  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date'),

  body('startDateBS')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('BS date must not exceed 10 characters'),

  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid date'),

  body('endDateBS')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('BS date must not exceed 10 characters'),

  body('venue')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Venue must not exceed 255 characters'),

  body('venueNp')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Nepali venue must not exceed 255 characters'),

  body('teams')
    .optional()
    .isArray()
    .withMessage('Teams must be an array'),

  body('teams.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Each team ID must be a positive integer'),

  body('participants')
    .optional()
    .isArray()
    .withMessage('Participants must be an array'),

  body('participants.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Each participant ID must be a positive integer'),

  body('remarks')
    .optional()
    .trim()
];

/**
 * Validation for getting tournament by ID
 */
export const getTournamentByIdValidation = [
  param('tournamentId')
    .notEmpty()
    .withMessage('Tournament ID is required')
    .isInt({ min: 1 })
    .withMessage('Tournament ID must be a positive integer')
];

/**
 * Validation for getting tournaments with filters
 */
export const getTournamentsValidation = [
  query('sportId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Sport ID must be a positive integer'),

  query('type')
    .optional()
    .isIn(['inter_school', 'intra_school', 'district', 'regional', 'national'])
    .withMessage('Invalid tournament type'),

  query('status')
    .optional()
    .isIn(['scheduled', 'ongoing', 'completed', 'cancelled'])
    .withMessage('Invalid status'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

/**
 * Validation for recording match result
 */
export const recordMatchResultValidation = [
  param('tournamentId')
    .notEmpty()
    .withMessage('Tournament ID is required')
    .isInt({ min: 1 })
    .withMessage('Tournament ID must be a positive integer'),

  body('matchId')
    .trim()
    .notEmpty()
    .withMessage('Match ID is required'),

  body('date')
    .notEmpty()
    .withMessage('Match date is required')
    .isISO8601()
    .withMessage('Match date must be a valid date'),

  body('dateBS')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('BS date must not exceed 10 characters'),

  body('team1Id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Team 1 ID must be a positive integer'),

  body('team2Id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Team 2 ID must be a positive integer'),

  body('participant1Id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Participant 1 ID must be a positive integer'),

  body('participant2Id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Participant 2 ID must be a positive integer'),

  body('score1')
    .optional()
    .trim(),

  body('score2')
    .optional()
    .trim(),

  body('winnerId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Winner ID must be a positive integer'),

  body('remarks')
    .optional()
    .trim()
];

/**
 * Validation for recording achievement
 */
export const recordAchievementValidation = [
  body('sportId')
    .notEmpty()
    .withMessage('Sport ID is required')
    .isInt({ min: 1 })
    .withMessage('Sport ID must be a positive integer'),

  body('studentId')
    .notEmpty()
    .withMessage('Student ID is required')
    .isInt({ min: 1 })
    .withMessage('Student ID must be a positive integer'),

  body('teamId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Team ID must be a positive integer'),

  body('tournamentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Tournament ID must be a positive integer'),

  body('title')
    .trim()
    .notEmpty()
    .withMessage('Achievement title is required')
    .isLength({ max: 255 })
    .withMessage('Title must not exceed 255 characters'),

  body('titleNp')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Nepali title must not exceed 255 characters'),

  body('type')
    .notEmpty()
    .withMessage('Achievement type is required')
    .isIn(['medal', 'trophy', 'certificate', 'rank', 'record', 'recognition'])
    .withMessage('Invalid achievement type'),

  body('level')
    .notEmpty()
    .withMessage('Achievement level is required')
    .isIn(['school', 'inter_school', 'district', 'regional', 'national', 'international'])
    .withMessage('Invalid achievement level'),

  body('position')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Position must not exceed 50 characters'),

  body('medal')
    .optional()
    .isIn(['gold', 'silver', 'bronze'])
    .withMessage('Invalid medal type'),

  body('recordType')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Record type must not exceed 100 characters'),

  body('recordValue')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Record value must not exceed 100 characters'),

  body('description')
    .optional()
    .trim(),

  body('descriptionNp')
    .optional()
    .trim(),

  body('achievementDate')
    .notEmpty()
    .withMessage('Achievement date is required')
    .isISO8601()
    .withMessage('Achievement date must be a valid date'),

  body('achievementDateBS')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('BS date must not exceed 10 characters'),

  body('certificateUrl')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Certificate URL must not exceed 500 characters'),

  body('photoUrl')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Photo URL must not exceed 500 characters'),

  body('remarks')
    .optional()
    .trim()
];

/**
 * Validation for getting student sports history
 */
export const getStudentSportsHistoryValidation = [
  param('studentId')
    .notEmpty()
    .withMessage('Student ID is required')
    .isInt({ min: 1 })
    .withMessage('Student ID must be a positive integer')
];
