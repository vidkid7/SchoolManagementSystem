import { Router } from 'express';
import { authenticate, authorize } from '@middleware/auth';
import { UserRole } from '@models/User.model';
import eventController from './event.controller';
import {
  createEventValidation,
  updateEventValidation,
  getEventByIdValidation,
  deleteEventValidation,
  updateEventStatusValidation,
  getEventsValidation,
  getEventsByDateRangeValidation,
  getUpcomingEventsValidation,
  getNepalGovernmentHolidaysValidation,
  getRecurringEventsValidation,
  exportPersonalCalendarValidation,
  exportEventToICalValidation,
  getEventStatsValidation
} from './event.validation';

/**
 * Calendar and Event Management API Routes
 * 
 * Features:
 * - Event CRUD operations
 * - Event notifications
 * - Recurring event support
 * - Nepal government holidays
 * - Personal calendar integration
 * 
 * Requirements: 31.1, 31.2, 31.3, 31.4, 31.5, 31.6, 31.7
 */

const router = Router();
router.use(authenticate);
const eventReaders = [UserRole.SCHOOL_ADMIN, UserRole.CLASS_TEACHER, UserRole.SUBJECT_TEACHER, UserRole.STUDENT, UserRole.PARENT];
const eventEditors = [UserRole.SCHOOL_ADMIN, UserRole.ECA_COORDINATOR, UserRole.SPORTS_COORDINATOR];

/**
 * @route   GET /api/v1/calendar/events
 * @desc    Get all events with filters and pagination
 * @access  Private (Teacher, Admin, Student, Parent)
 * @query   category, status, targetAudience, isHoliday, isNepalGovernmentHoliday, 
 *          isRecurring, startDateFrom, startDateTo, venue, page, limit
 */
router.get(
  '/events',
  authorize(...eventReaders),
  getEventsValidation,
  eventController.getEvents
);

/**
 * @route   POST /api/v1/calendar/events
 * @desc    Create a new event
 * @access  Private (School Admin, ECA Coordinator, Sports Coordinator)
 */
router.post(
  '/events',
  authorize(...eventEditors),
  createEventValidation,
  eventController.createEvent
);

/**
 * @route   GET /api/v1/calendar/events/range
 * @desc    Get events by date range
 * @access  Private (Teacher, Admin, Student, Parent)
 * @query   startDate, endDate, category, targetAudience, isHoliday, isNepalGovernmentHoliday
 */
router.get(
  '/events/range',
  authorize(...eventReaders),
  getEventsByDateRangeValidation,
  eventController.getEventsByDateRange
);

/**
 * @route   GET /api/v1/calendar/events/upcoming
 * @desc    Get upcoming events
 * @access  Private (Teacher, Admin, Student, Parent)
 * @query   limit, includeHolidays
 */
router.get(
  '/events/upcoming',
  authorize(...eventReaders),
  getUpcomingEventsValidation,
  eventController.getUpcomingEvents
);

/**
 * @route   GET /api/v1/calendar/events/recurring
 * @desc    Get recurring events
 * @access  Private (Teacher, Admin)
 * @query   pattern
 */
router.get(
  '/events/recurring',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.CLASS_TEACHER),
  getRecurringEventsValidation,
  eventController.getRecurringEvents
);

/**
 * @route   GET /api/v1/calendar/events/stats
 * @desc    Get event statistics
 * @access  Private (Admin)
 * @query   startDateFrom, startDateTo, category
 */
router.get(
  '/events/stats',
  authorize(UserRole.SCHOOL_ADMIN),
  getEventStatsValidation,
  eventController.getEventStats
);

/**
 * @route   GET /api/v1/calendar/events/:eventId
 * @desc    Get event by ID
 * @access  Private (Teacher, Admin, Student, Parent)
 */
router.get(
  '/events/:eventId',
  authorize(...eventReaders),
  getEventByIdValidation,
  eventController.getEventById
);

/**
 * @route   PUT /api/v1/calendar/events/:eventId
 * @desc    Update event
 * @access  Private (School Admin, ECA Coordinator, Sports Coordinator)
 */
router.put(
  '/events/:eventId',
  authorize(...eventEditors),
  updateEventValidation,
  eventController.updateEvent
);

/**
 * @route   PATCH /api/v1/calendar/events/:eventId/status
 * @desc    Update event status
 * @access  Private (School Admin)
 */
router.patch(
  '/events/:eventId/status',
  authorize(UserRole.SCHOOL_ADMIN),
  updateEventStatusValidation,
  eventController.updateEventStatus
);

/**
 * @route   DELETE /api/v1/calendar/events/:eventId
 * @desc    Delete event
 * @access  Private (School Admin)
 */
router.delete(
  '/events/:eventId',
  authorize(UserRole.SCHOOL_ADMIN),
  deleteEventValidation,
  eventController.deleteEvent
);

/**
 * @route   GET /api/v1/calendar/events/:eventId/export
 * @desc    Export single event to iCal format
 * @access  Private (Teacher, Admin, Student, Parent)
 */
router.get(
  '/events/:eventId/export',
  authorize(...eventReaders),
  exportEventToICalValidation,
  eventController.exportEventToICal
);

/**
 * @route   GET /api/v1/calendar/holidays
 * @desc    Get Nepal government holidays
 * @access  Private (Teacher, Admin, Student, Parent)
 * @query   year
 */
router.get(
  '/holidays',
  authorize(...eventReaders),
  getNepalGovernmentHolidaysValidation,
  eventController.getNepalGovernmentHolidays
);

/**
 * @route   GET /api/v1/calendar/export
 * @desc    Export personal calendar (iCal format)
 * @access  Private (Student, Parent, Teacher, Staff)
 * @query   startDate, endDate, targetAudience
 */
router.get(
  '/export',
  authorize(...eventReaders),
  exportPersonalCalendarValidation,
  eventController.exportPersonalCalendar
);

export default router;
