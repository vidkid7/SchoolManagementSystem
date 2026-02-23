import { Router } from 'express';
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

/**
 * @route   GET /api/v1/calendar/events
 * @desc    Get all events with filters and pagination
 * @access  Private (Teacher, Admin, Student, Parent)
 * @query   category, status, targetAudience, isHoliday, isNepalGovernmentHoliday, 
 *          isRecurring, startDateFrom, startDateTo, venue, page, limit
 */
router.get(
  '/events',
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
  exportPersonalCalendarValidation,
  eventController.exportPersonalCalendar
);

export default router;