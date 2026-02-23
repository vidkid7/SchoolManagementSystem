import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import eventService from './event.service';

/**
 * Event Controller
 * 
 * Handles HTTP requests for calendar and event management
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
class EventController {
  /**
   * Create a new event
   * POST /api/v1/calendar/events
   * 
   * Requirements: 31.3, 31.4, 31.5
   */
  async createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const eventData = {
        title: req.body.title,
        titleNp: req.body.titleNp,
        description: req.body.description,
        descriptionNp: req.body.descriptionNp,
        category: req.body.category,
        startDate: new Date(req.body.startDate),
        startDateBS: req.body.startDateBS,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        endDateBS: req.body.endDateBS,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        venue: req.body.venue,
        venueNp: req.body.venueNp,
        isRecurring: req.body.isRecurring,
        recurrencePattern: req.body.recurrencePattern,
        recurrenceEndDate: req.body.recurrenceEndDate ? new Date(req.body.recurrenceEndDate) : undefined,
        targetAudience: req.body.targetAudience,
        targetClasses: req.body.targetClasses,
        isHoliday: req.body.isHoliday,
        isNepalGovernmentHoliday: req.body.isNepalGovernmentHoliday,
        governmentHolidayName: req.body.governmentHolidayName,
        governmentHolidayNameNp: req.body.governmentHolidayNameNp,
        color: req.body.color
      };

      const event = await eventService.createEvent(
        eventData,
        req.user?.userId,
        req
      );

      res.status(201).json({
        success: true,
        data: event,
        message: 'Event created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all events with filters and pagination
   * GET /api/v1/calendar/events
   * 
   * Requirements: 31.1, 31.2
   */
  async getEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: any = {};
      
      if (req.query.category) filters.category = req.query.category;
      if (req.query.status) filters.status = req.query.status;
      if (req.query.targetAudience) filters.targetAudience = req.query.targetAudience;
      if (req.query.isHoliday) filters.isHoliday = req.query.isHoliday === 'true';
      if (req.query.isNepalGovernmentHoliday) filters.isNepalGovernmentHoliday = req.query.isNepalGovernmentHoliday === 'true';
      if (req.query.isRecurring) filters.isRecurring = req.query.isRecurring === 'true';
      if (req.query.venue) filters.venue = req.query.venue as string;

      // Date range filters
      if (req.query.startDateFrom) {
        filters.startDateFrom = new Date(req.query.startDateFrom as string);
      }
      if (req.query.startDateTo) {
        filters.startDateTo = new Date(req.query.startDateTo as string);
      }

      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const result = await eventService.getEvents(filters, page, limit);

      res.status(200).json({
        success: true,
        data: result.events,
        meta: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get event by ID
   * GET /api/v1/calendar/events/:eventId
   * 
   * Requirements: 31.1
   */
  async getEventById(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const eventId = parseInt(req.params.eventId);
      const event = await eventService.getEventById(eventId);

      if (!event) {
        res.status(404).json({
          success: false,
          error: {
            code: 'EVENT_NOT_FOUND',
            message: `Event with ID ${eventId} not found`
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: event
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get events by date range
   * GET /api/v1/calendar/events/range
   * 
   * Requirements: 31.1, 31.2
   */
  async getEventsByDateRange(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);

      const filters: any = {};
      if (req.query.category) filters.category = req.query.category;
      if (req.query.targetAudience) filters.targetAudience = req.query.targetAudience;
      if (req.query.isHoliday) filters.isHoliday = req.query.isHoliday === 'true';
      if (req.query.isNepalGovernmentHoliday) filters.isNepalGovernmentHoliday = req.query.isNepalGovernmentHoliday === 'true';

      const events = await eventService.getEventsByDateRange(startDate, endDate, filters);

      res.status(200).json({
        success: true,
        data: events
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get upcoming events
   * GET /api/v1/calendar/events/upcoming
   * 
   * Requirements: 31.1
   */
  async getUpcomingEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const includeHolidays = req.query.includeHolidays !== 'false';

      const events = await eventService.getUpcomingEvents(limit, includeHolidays);

      res.status(200).json({
        success: true,
        data: events
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Nepal government holidays
   * GET /api/v1/calendar/holidays
   * 
   * Requirements: 31.2
   */
  async getNepalGovernmentHolidays(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;

      const holidays = await eventService.getNepalGovernmentHolidays(year);

      res.status(200).json({
        success: true,
        data: holidays
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recurring events
   * GET /api/v1/calendar/events/recurring
   * 
   * Requirements: 31.6
   */
  async getRecurringEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pattern = req.query.pattern as 'daily' | 'weekly' | 'monthly' | 'yearly' | undefined;

      const events = await eventService.getRecurringEvents(pattern);

      res.status(200).json({
        success: true,
        data: events
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update event
   * PUT /api/v1/calendar/events/:eventId
   * 
   * Requirements: 31.3
   */
  async updateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const eventId = parseInt(req.params.eventId);

      const updateData: any = {};
      if (req.body.title !== undefined) updateData.title = req.body.title;
      if (req.body.titleNp !== undefined) updateData.titleNp = req.body.titleNp;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.descriptionNp !== undefined) updateData.descriptionNp = req.body.descriptionNp;
      if (req.body.category !== undefined) updateData.category = req.body.category;
      if (req.body.startDate !== undefined) updateData.startDate = new Date(req.body.startDate);
      if (req.body.startDateBS !== undefined) updateData.startDateBS = req.body.startDateBS;
      if (req.body.endDate !== undefined) updateData.endDate = new Date(req.body.endDate);
      if (req.body.endDateBS !== undefined) updateData.endDateBS = req.body.endDateBS;
      if (req.body.startTime !== undefined) updateData.startTime = req.body.startTime;
      if (req.body.endTime !== undefined) updateData.endTime = req.body.endTime;
      if (req.body.venue !== undefined) updateData.venue = req.body.venue;
      if (req.body.venueNp !== undefined) updateData.venueNp = req.body.venueNp;
      if (req.body.isRecurring !== undefined) updateData.isRecurring = req.body.isRecurring;
      if (req.body.recurrencePattern !== undefined) updateData.recurrencePattern = req.body.recurrencePattern;
      if (req.body.recurrenceEndDate !== undefined) updateData.recurrenceEndDate = new Date(req.body.recurrenceEndDate);
      if (req.body.targetAudience !== undefined) updateData.targetAudience = req.body.targetAudience;
      if (req.body.targetClasses !== undefined) updateData.targetClasses = req.body.targetClasses;
      if (req.body.isHoliday !== undefined) updateData.isHoliday = req.body.isHoliday;
      if (req.body.isNepalGovernmentHoliday !== undefined) updateData.isNepalGovernmentHoliday = req.body.isNepalGovernmentHoliday;
      if (req.body.governmentHolidayName !== undefined) updateData.governmentHolidayName = req.body.governmentHolidayName;
      if (req.body.governmentHolidayNameNp !== undefined) updateData.governmentHolidayNameNp = req.body.governmentHolidayNameNp;
      if (req.body.color !== undefined) updateData.color = req.body.color;

      const event = await eventService.updateEvent(
        eventId,
        updateData,
        req.user?.userId,
        req
      );

      res.status(200).json({
        success: true,
        data: event,
        message: 'Event updated successfully'
      });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'EVENT_NOT_FOUND',
            message: (error as Error).message
          }
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Update event status
   * PATCH /api/v1/calendar/events/:eventId/status
   * 
   * Requirements: 31.3
   */
  async updateEventStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const eventId = parseInt(req.params.eventId);
      const status = req.body.status;

      const event = await eventService.updateEventStatus(
        eventId,
        status,
        req.user?.userId,
        req
      );

      res.status(200).json({
        success: true,
        data: event,
        message: 'Event status updated successfully'
      });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'EVENT_NOT_FOUND',
            message: (error as Error).message
          }
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Delete event
   * DELETE /api/v1/calendar/events/:eventId
   * 
   * Requirements: 31.3
   */
  async deleteEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const eventId = parseInt(req.params.eventId);

      await eventService.deleteEvent(eventId, req.user?.userId, req);

      res.status(200).json({
        success: true,
        message: 'Event deleted successfully'
      });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'EVENT_NOT_FOUND',
            message: (error as Error).message
          }
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Get event statistics
   * GET /api/v1/calendar/events/stats
   * 
   * Requirements: 31.1
   */
  async getEventStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: any = {};
      
      if (req.query.startDateFrom) {
        filters.startDateFrom = new Date(req.query.startDateFrom as string);
      }
      if (req.query.startDateTo) {
        filters.startDateTo = new Date(req.query.startDateTo as string);
      }
      if (req.query.category) filters.category = req.query.category;

      const stats = await eventService.getEventStats(filters);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export personal calendar (iCal format)
   * GET /api/v1/calendar/export
   * 
   * Requirements: 31.7
   */
  async exportPersonalCalendar(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);
      const targetAudience = req.query.targetAudience as 'student' | 'parent' | 'teacher' | 'staff';

      const icalContent = await eventService.getPersonalCalendarExport(
        startDate,
        endDate,
        targetAudience
      );

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="school-calendar-${targetAudience}.ics"`);
      
      res.send(icalContent);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export single event to iCal
   * GET /api/v1/calendar/events/:eventId/export
   * 
   * Requirements: 31.7
   */
  async exportEventToICal(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const eventId = parseInt(req.params.eventId);
      const event = await eventService.getEventById(eventId);

      if (!event) {
        res.status(404).json({
          success: false,
          error: {
            code: 'EVENT_NOT_FOUND',
            message: `Event with ID ${eventId} not found`
          }
        });
        return;
      }

      const icalContent = eventService.generateICalExport(event);

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="event-${eventId}.ics"`);
      
      res.send(icalContent);
    } catch (error) {
      next(error);
    }
  }
}

export default new EventController();