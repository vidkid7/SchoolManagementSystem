/**
 * Event Service
 * 
 * Business logic for calendar and event management
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

import eventRepository, { EventFilters } from './event.repository';
import { NotificationCreationAttributes } from '@models/Notification.model';
import { notificationRepository } from '@modules/notifications/notification.repository';
import Student from '@models/Student.model';
import Staff from '@models/Staff.model';
import User from '@models/User.model';
import { logger } from '@utils/logger';
import { Request } from 'express';

export interface EventInput {
  title: string;
  titleNp?: string;
  description?: string;
  descriptionNp?: string;
  category: 'academic' | 'sports' | 'cultural' | 'holiday' | 'exam' | 'meeting' | 'other';
  startDate: Date;
  startDateBS?: string;
  endDate?: Date;
  endDateBS?: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  venueNp?: string;
  isRecurring?: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceEndDate?: Date;
  targetAudience?: 'all' | 'students' | 'parents' | 'teachers' | 'staff';
  targetClasses?: number[];
  isHoliday?: boolean;
  isNepalGovernmentHoliday?: boolean;
  governmentHolidayName?: string;
  governmentHolidayNameNp?: string;
  color?: string;
}

class EventService {
  /**
   * Create a new event
   * Requirement 31.3: Allow School_Admin to create events with date, time, location
   * 
   * @param eventData - Event data
   * @param userId - User ID creating the event
   * @param req - Express request object
   * @returns Created event
   * @throws Error if validation fails
   */
  async createEvent(
    eventData: EventInput,
    userId?: number,
    req?: Request
  ): Promise<any> {
    try {
      // 1. Validate event data
      this.validateEventData(eventData);

      // 2. Set default values
      const eventCreateData: any = {
        ...eventData,
        status: 'scheduled',
        isRecurring: eventData.isRecurring || false,
        isHoliday: eventData.isHoliday || false,
        isNepalGovernmentHoliday: eventData.isNepalGovernmentHoliday || false,
        targetAudience: eventData.targetAudience || 'all',
        createdBy: userId
      };

      // 3. Create event
      const event = await eventRepository.create(
        eventCreateData,
        userId,
        req
      );

      logger.info('Event created successfully', {
        eventId: event.eventId,
        title: event.title,
        category: event.category,
        startDate: event.startDate
      });

      // 4. Send notifications to relevant users (Requirement 31.5)
      if (event.status === 'scheduled') {
        await this.notifyRelevantUsers(event);
      }

      return event;
    } catch (error) {
      logger.error('Error creating event', { error, eventData });
      throw error;
    }
  }

  /**
   * Validate event data
   * 
   * @param eventData - Event data to validate
   * @throws Error if validation fails
   */
  private validateEventData(eventData: EventInput): void {
    // Validate required fields
    if (!eventData.title || eventData.title.trim() === '') {
      throw new Error('Event title is required');
    }

    if (!eventData.category) {
      throw new Error('Event category is required');
    }

    if (!eventData.startDate) {
      throw new Error('Event start date is required');
    }

    // Validate recurring event data
    if (eventData.isRecurring && !eventData.recurrencePattern) {
      throw new Error('Recurrence pattern is required for recurring events');
    }

    // Validate end date is after start date
    if (eventData.endDate && new Date(eventData.endDate) < new Date(eventData.startDate)) {
      throw new Error('End date must be after start date');
    }

    // Validate recurrence end date
    if (eventData.recurrenceEndDate && new Date(eventData.recurrenceEndDate) < new Date(eventData.startDate)) {
      throw new Error('Recurrence end date must be after start date');
    }

    // Validate time format
    if (eventData.startTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(eventData.startTime)) {
      throw new Error('Invalid start time format. Use HH:mm format');
    }

    if (eventData.endTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(eventData.endTime)) {
      throw new Error('Invalid end time format. Use HH:mm format');
    }
  }

  /**
   * Notify relevant users when event is created
   * Requirement 31.5: Notify relevant users when events are created
   * 
   * @param event - Event to notify about
   * @returns Number of notifications sent
   */
  async notifyRelevantUsers(event: any): Promise<number> {
    try {
      const userIds: number[] = [];

      // Get user IDs based on target audience
      switch (event.targetAudience) {
        case 'all':
          // Get all active users
          const allUsers = await User.findAll({
            where: { status: 'active' },
            attributes: ['userId']
          });
          userIds.push(...allUsers.map(u => u.userId));
          break;

        case 'students':
          // Get all active students
          const students = await Student.findAll({
            where: { status: 'active' },
            attributes: ['userId']
          });
          userIds.push(...students.filter(s => s.userId).map(s => s.userId!));
          break;

        case 'parents':
          // Get parents (users with parent role)
          const parents = await User.findAll({
            where: { role: 'parent', status: 'active' },
            attributes: ['userId']
          });
          userIds.push(...parents.map(p => p.userId));
          break;

        case 'teachers':
          // Get teachers (users with teacher roles)
          const teachers = await User.findAll({
            where: {
              role: { [Symbol.for('sequelize.or')]: ['subject_teacher', 'class_teacher'] },
              status: 'active'
            },
            attributes: ['userId']
          });
          userIds.push(...teachers.map(t => t.userId));
          break;

        case 'staff':
          // Get all staff
          const staff = await Staff.findAll({
            where: { status: 'active' },
            attributes: ['userId']
          });
          userIds.push(...staff.filter(s => s.userId).map(s => s.userId!));
          break;
      }

      if (userIds.length === 0) {
        logger.info('No users to notify for event', { eventId: event.eventId });
        return 0;
      }

      // Create notifications
      const notifications: NotificationCreationAttributes[] = userIds.map(userId => ({
        userId,
        type: 'info',
        category: 'announcement',
        title: `New Event: ${event.title}`,
        message: this.formatNotificationMessage(event),
        data: {
          eventId: event.eventId,
          category: event.category,
          startDate: event.startDate,
          startTime: event.startTime,
          venue: event.venue
        },
        isRead: false
      }));

      await notificationRepository.bulkCreate(notifications);

      logger.info('Notifications sent for event', {
        eventId: event.eventId,
        notificationCount: notifications.length
      });

      return notifications.length;
    } catch (error) {
      logger.error('Error notifying relevant users', { error, eventId: event.eventId });
      throw error;
    }
  }

  /**
   * Format notification message for event
   * 
   * @param event - Event to format message for
   * @returns Formatted notification message
   */
  private formatNotificationMessage(event: any): string {
    let message = `A new event "${event.title}" has been scheduled.`;
    
    if (event.startDate) {
      const dateStr = new Date(event.startDate).toLocaleDateString();
      message += `\nDate: ${dateStr}`;
    }
    
    if (event.startTime) {
      message += `\nTime: ${event.startTime}`;
      if (event.endTime) {
        message += ` - ${event.endTime}`;
      }
    }
    
    if (event.venue) {
      message += `\nVenue: ${event.venue}`;
    }
    
    if (event.targetAudience && event.targetAudience !== 'all') {
      message += `\n\nTarget: ${event.targetAudience}`;
    }

    return message;
  }

  /**
   * Get event by ID
   * 
   * @param eventId - Event ID
   * @returns Event or null
   */
  async getEventById(eventId: number): Promise<any> {
    try {
      return await eventRepository.findById(eventId);
    } catch (error) {
      logger.error('Error getting event by ID', { error, eventId });
      throw error;
    }
  }

  /**
   * Get events with filters and pagination
   * 
   * @param filters - Optional filters
   * @param page - Page number
   * @param limit - Items per page
   * @returns Events with pagination metadata
   */
  async getEvents(
    filters?: EventFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    events: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      return await eventRepository.findWithPagination(filters, page, limit);
    } catch (error) {
      logger.error('Error getting events', { error, filters, page, limit });
      throw error;
    }
  }

  /**
   * Get events by date range
   * 
   * @param startDate - Start date
   * @param endDate - End date
   * @param filters - Optional additional filters
   * @returns Array of events
   */
  async getEventsByDateRange(
    startDate: Date,
    endDate: Date,
    filters?: {
      category?: string;
      targetAudience?: string;
      isHoliday?: boolean;
      isNepalGovernmentHoliday?: boolean;
    }
  ): Promise<any[]> {
    try {
      return await eventRepository.findByDateRange(startDate, endDate, filters);
    } catch (error) {
      logger.error('Error getting events by date range', {
        error,
        startDate,
        endDate,
        filters
      });
      throw error;
    }
  }

  /**
   * Get upcoming events
   * 
   * @param limit - Maximum number of events
   * @param includeHolidays - Whether to include holidays
   * @returns Array of upcoming events
   */
  async getUpcomingEvents(
    limit: number = 10,
    includeHolidays: boolean = true
  ): Promise<any[]> {
    try {
      return await eventRepository.findUpcoming(limit, includeHolidays);
    } catch (error) {
      logger.error('Error getting upcoming events', { error, limit, includeHolidays });
      throw error;
    }
  }

  /**
   * Get Nepal government holidays
   * 
   * @param year - Optional year filter
   * @returns Array of government holidays
   */
  async getNepalGovernmentHolidays(year?: number): Promise<any[]> {
    try {
      return await eventRepository.findNepalGovernmentHolidays(year);
    } catch (error) {
      logger.error('Error getting Nepal government holidays', { error, year });
      throw error;
    }
  }

  /**
   * Get recurring events
   * 
   * @param pattern - Optional pattern filter
   * @returns Array of recurring events
   */
  async getRecurringEvents(
    pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  ): Promise<any[]> {
    try {
      return await eventRepository.findRecurringEvents(pattern);
    } catch (error) {
      logger.error('Error getting recurring events', { error, pattern });
      throw error;
    }
  }

  /**
   * Update event
   * 
   * @param eventId - Event ID
   * @param updateData - Data to update
   * @param userId - User ID performing the operation
   * @param req - Express request object
   * @returns Updated event
   * @throws Error if event not found
   */
  async updateEvent(
    eventId: number,
    updateData: Partial<EventInput>,
    userId?: number,
    req?: Request
  ): Promise<any> {
    try {
      // Validate update data
      if (updateData.startDate || updateData.endDate || updateData.recurrenceEndDate) {
        this.validateEventData({
          title: 'temp',  // Placeholder, won't be used in update
          category: updateData.category || 'other',
          startDate: updateData.startDate || new Date(),
          ...updateData
        } as EventInput);
      }

      const event = await eventRepository.update(eventId, updateData, userId, req);

      if (!event) {
        throw new Error(`Event with ID ${eventId} not found`);
      }

      logger.info('Event updated successfully', {
        eventId,
        updatedFields: Object.keys(updateData)
      });

      return event;
    } catch (error) {
      logger.error('Error updating event', { error, eventId, updateData });
      throw error;
    }
  }

  /**
   * Update event status
   * 
   * @param eventId - Event ID
   * @param status - New status
   * @param userId - User ID performing the operation
   * @param req - Express request object
   * @returns Updated event
   */
  async updateEventStatus(
    eventId: number,
    status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled',
    userId?: number,
    req?: Request
  ): Promise<any> {
    try {
      const event = await eventRepository.updateStatus(eventId, status, userId, req);

      if (!event) {
        throw new Error(`Event with ID ${eventId} not found`);
      }

      logger.info('Event status updated', {
        eventId,
        status
      });

      return event;
    } catch (error) {
      logger.error('Error updating event status', { error, eventId, status });
      throw error;
    }
  }

  /**
   * Delete event
   * 
   * @param eventId - Event ID
   * @param userId - User ID performing the operation
   * @param req - Express request object
   * @returns True if deleted
   * @throws Error if event not found
   */
  async deleteEvent(
    eventId: number,
    userId?: number,
    req?: Request
  ): Promise<boolean> {
    try {
      const deleted = await eventRepository.delete(eventId, userId, req);

      if (!deleted) {
        throw new Error(`Event with ID ${eventId} not found`);
      }

      logger.info('Event deleted successfully', { eventId });

      return deleted;
    } catch (error) {
      logger.error('Error deleting event', { error, eventId });
      throw error;
    }
  }

  /**
   * Get event statistics
   * 
   * @param filters - Optional filters
   * @returns Event statistics
   */
  async getEventStats(
    filters?: {
      startDateFrom?: Date;
      startDateTo?: Date;
      category?: string;
    }
  ): Promise<{
    total: number;
    scheduled: number;
    ongoing: number;
    completed: number;
    cancelled: number;
    holidays: number;
    governmentHolidays: number;
    recurring: number;
  }> {
    try {
      return await eventRepository.getEventStats(filters);
    } catch (error) {
      logger.error('Error getting event stats', { error, filters });
      throw error;
    }
  }

  /**
   * Generate personal calendar export (iCal format)
   * Requirement 31.7: Allow users to add events to personal calendar
   * 
   * @param event - Event to export
   * @returns iCal formatted string
   */
  generateICalExport(event: any): string {
    const startDate = new Date(event.startDate);
    const endDate = event.endDate ? new Date(event.endDate) : new Date(event.startDate);
    
    // Format date for iCal (YYYYMMDDTHHMMSSZ)
    const formatICalDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const uid = `event-${event.eventId}@school-management-system`;

    let ical = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//School Management System//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatICalDate(startDate)}`,
      `DTEND:${formatICalDate(endDate)}`,
      `SUMMARY:${event.title}`,
    ];

    if (event.description) {
      ical.push(`DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`);
    }

    if (event.venue) {
      ical.push(`LOCATION:${event.venue}`);
    }

    if (event.isHoliday) {
      ical.push('TRANSP:TRANSPARENT');
    }

    if (event.recurrencePattern) {
      const rruleMap: Record<string, string> = {
        daily: 'FREQ=DAILY',
        weekly: 'FREQ=WEEKLY',
        monthly: 'FREQ=MONTHLY',
        yearly: 'FREQ=YEARLY'
      };
      ical.push(`RRULE:${rruleMap[event.recurrencePattern]}`);
    }

    ical.push('END:VEVENT');
    ical.push('END:VCALENDAR');

    return ical.join('\r\n');
  }

  /**
   * Get events for personal calendar export
   * 
   * @param startDate - Start date
   * @param endDate - End date
   * @param targetAudience - Target audience filter
   * @returns iCal formatted string
   */
  async getPersonalCalendarExport(
    startDate: Date,
    endDate: Date,
    targetAudience: 'student' | 'parent' | 'teacher' | 'staff'
  ): Promise<string> {
    try {
      // Map user role to event target audience
      const audienceMap: Record<string, string> = {
        'student': 'students',
        'parent': 'parents',
        'teacher': 'teachers',
        'staff': 'staff'
      };

      const events = await this.getEventsByDateRange(startDate, endDate, {
        targetAudience: audienceMap[targetAudience] || 'all'
      });

      // Generate iCal for all events
      const calendarEvents = events.map(event => this.generateICalExport(event));
      const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      let ical = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//School Management System//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:School Calendar - ${targetAudience.charAt(0).toUpperCase() + targetAudience.slice(1)}`,
        `DTSTAMP:${now}`
      ];

      for (const eventIcal of calendarEvents) {
        // Extract VEVENT from each event's iCal
        const veventMatch = eventIcal.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/);
        if (veventMatch) {
          ical.push(veventMatch[0]);
        }
      }

      ical.push('END:VCALENDAR');

      return ical.join('\r\n');
    } catch (error) {
      logger.error('Error generating personal calendar export', {
        error,
        startDate,
        endDate,
        targetAudience
      });
      throw error;
    }
  }
}

export default new EventService();