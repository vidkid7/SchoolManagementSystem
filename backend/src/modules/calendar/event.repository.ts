/**
 * Event Repository
 * 
 * Database operations for Event entity
 * 
 * Features:
 * - Event CRUD operations
 * - Event filtering and querying
 * - Recurring event support
 * - Nepal government holidays
 * 
 * Requirements: 31.1, 31.2, 31.3, 31.4, 31.5, 31.6, 31.7
 */

import { Op, WhereOptions } from 'sequelize';
import Event, { EventAttributes, EventCreationAttributes } from '@models/Event.model';
import { initEvent } from '@models/Event.model';
import sequelize from '@config/database';
import { logger } from '@utils/logger';
import auditLogger from '@utils/auditLogger';
import { Request } from 'express';

// Initialize Event model
let isInitialized = false;
function ensureInitialized() {
  if (!isInitialized) {
    initEvent(sequelize);
    isInitialized = true;
  }
}

export interface EventFilters {
  category?: 'academic' | 'sports' | 'cultural' | 'holiday' | 'exam' | 'meeting' | 'other';
  status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  targetAudience?: 'all' | 'students' | 'parents' | 'teachers' | 'staff';
  startDateFrom?: Date;
  startDateTo?: Date;
  isHoliday?: boolean;
  isNepalGovernmentHoliday?: boolean;
  isRecurring?: boolean;
  createdBy?: number;
  venue?: string;
}

export interface EventPaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface PaginatedEvents {
  events: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class EventRepository {
  /**
   * Create a new event
   * 
   * @param eventData - Event creation data
   * @param userId - User ID who created the event
   * @param req - Express request object for audit logging
   * @returns Created event instance
   */
  async create(
    eventData: EventCreationAttributes,
    userId?: number,
    req?: Request
  ): Promise<Event> {
    ensureInitialized();
    try {
      const event = await Event.create(eventData);
      
      logger.info('Event created', {
        eventId: event.eventId,
        title: event.title,
        category: event.category,
        startDate: event.startDate
      });

      // Log audit entry for create operation
      await auditLogger.logCreate(
        'event',
        event.eventId,
        event.toJSON(),
        userId,
        req
      );

      return event;
    } catch (error) {
      logger.error('Error creating event', { error, eventData });
      throw error;
    }
  }

  /**
   * Find event by ID
   * 
   * @param eventId - Event ID
   * @returns Event instance or null
   */
  async findById(eventId: number): Promise<Event | null> {
    try {
      return await Event.findByPk(eventId);
    } catch (error) {
      logger.error('Error finding event by ID', { error, eventId });
      throw error;
    }
  }

  /**
   * Find all events with optional filters and pagination
   * 
   * @param filters - Optional filters
   * @param options - Pagination and sorting options
   * @returns Array of events and total count
   */
  async findAll(
    filters?: EventFilters,
    options?: EventPaginationOptions
  ): Promise<{ events: Event[]; total: number }> {
    try {
      const where: WhereOptions<EventAttributes> = {};

      // Apply filters
      if (filters?.category) {
        where.category = filters.category;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.targetAudience) {
        where.targetAudience = filters.targetAudience;
      }

      if (filters?.isHoliday !== undefined) {
        where.isHoliday = filters.isHoliday;
      }

      if (filters?.isNepalGovernmentHoliday !== undefined) {
        where.isNepalGovernmentHoliday = filters.isNepalGovernmentHoliday;
      }

      if (filters?.isRecurring !== undefined) {
        where.isRecurring = filters.isRecurring;
      }

      if (filters?.createdBy) {
        where.createdBy = filters.createdBy;
      }

      if (filters?.venue) {
        where.venue = { [Op.like]: `%${filters.venue}%` };
      }

      // Date range filter
      if (filters?.startDateFrom || filters?.startDateTo) {
        const dateFilter: Record<symbol, Date> = {};
        if (filters.startDateFrom) {
          dateFilter[Op.gte] = filters.startDateFrom;
        }
        if (filters.startDateTo) {
          dateFilter[Op.lte] = filters.startDateTo;
        }
        where.startDate = dateFilter;
      }

      // Set pagination defaults
      const limit = Math.min(options?.limit || 20, 100);
      const offset = options?.page ? (options.page - 1) * limit : 0;
      const orderBy = options?.orderBy || 'startDate';
      const orderDirection = options?.orderDirection || 'ASC';

      // Execute query
      const { rows: events, count: total } = await Event.findAndCountAll({
        where,
        limit,
        offset,
        order: [[orderBy, orderDirection]],
        paranoid: true,  // Exclude soft-deleted records
      });

      return { events, total };
    } catch (error) {
      logger.error('Error finding all events', { error, filters, options });
      throw error;
    }
  }

  /**
   * Get events with pagination metadata
   * 
   * @param filters - Optional filters
   * @param page - Page number (1-indexed)
   * @param limit - Items per page (default 20, max 100)
   * @returns Events with pagination metadata
   */
  async findWithPagination(
    filters?: EventFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedEvents> {
    try {
      const { events, total } = await this.findAll(filters, { page, limit });

      return {
        events,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error finding events with pagination', {
        error,
        filters,
        page,
        limit
      });
      throw error;
    }
  }

  /**
   * Find events by date range
   * 
   * @param startDate - Start date
   * @param endDate - End date
   * @param filters - Optional additional filters
   * @returns Array of events
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    filters?: {
      category?: string;
      targetAudience?: string;
      isHoliday?: boolean;
      isNepalGovernmentHoliday?: boolean;
    }
  ): Promise<Event[]> {
    ensureInitialized();
    try {
      const dateRangeCondition = {
        [Op.or]: [
          // Events that start within the range
          {
            startDate: {
              [Op.between]: [startDate, endDate]
            }
          },
          // Events that end after the start date and start before the end date (spanning events)
          {
            [Op.and]: [
              { endDate: { [Op.ne]: null as any } },
              { startDate: { [Op.lt]: endDate } },
              { endDate: { [Op.gt]: startDate } }
            ]
          }
        ]
      };

      const where: WhereOptions<EventAttributes> = {
        [Op.and]: [dateRangeCondition]
      };

      // Apply additional filters
      if (filters?.category) {
        (where[Op.and] as any[]).push({ category: filters.category });
      }

      if (filters?.targetAudience) {
        (where[Op.and] as any[]).push({ targetAudience: filters.targetAudience });
      }

      if (filters?.isHoliday !== undefined) {
        (where[Op.and] as any[]).push({ isHoliday: filters.isHoliday });
      }

      if (filters?.isNepalGovernmentHoliday !== undefined) {
        (where[Op.and] as any[]).push({ isNepalGovernmentHoliday: filters.isNepalGovernmentHoliday });
      }

      return await Event.findAll({
        where,
        order: [['startDate', 'ASC'], ['startTime', 'ASC']]
      });
    } catch (error) {
      logger.error('Error finding events by date range', {
        error,
        startDate,
        endDate,
        filters
      });
      throw error;
    }
  }

  /**
   * Find upcoming events
   * 
   * @param limit - Maximum number of events to return
   * @param includeHolidays - Whether to include holidays
   * @returns Array of upcoming events
   */
  async findUpcoming(
    limit: number = 10,
    includeHolidays: boolean = true
  ): Promise<Event[]> {
    try {
      const where: WhereOptions<EventAttributes> = {
        startDate: {
          [Op.gte]: new Date()
        },
        status: {
          [Op.in]: ['scheduled', 'ongoing']
        }
      };

      if (!includeHolidays) {
        where.isHoliday = false;
        where.isNepalGovernmentHoliday = false;
      }

      return await Event.findAll({
        where,
        order: [['startDate', 'ASC'], ['startTime', 'ASC']],
        limit
      });
    } catch (error) {
      logger.error('Error finding upcoming events', { error, limit, includeHolidays });
      throw error;
    }
  }

  /**
   * Find all Nepal government holidays
   * 
   * @param year - Optional year filter
   * @returns Array of government holidays
   */
  async findNepalGovernmentHolidays(year?: number): Promise<Event[]> {
    try {
      const where: WhereOptions<EventAttributes> = {
        isNepalGovernmentHoliday: true
      };

      if (year) {
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31);
        where.startDate = {
          [Op.between]: [startOfYear, endOfYear]
        };
      }

      return await Event.findAll({
        where,
        order: [['startDate', 'ASC']]
      });
    } catch (error) {
      logger.error('Error finding Nepal government holidays', { error, year });
      throw error;
    }
  }

  /**
   * Find recurring events
   * 
   * @param pattern - Optional pattern filter
   * @returns Array of recurring events
   */
  async findRecurringEvents(
    pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  ): Promise<Event[]> {
    try {
      const where: WhereOptions<EventAttributes> = {
        isRecurring: true
      };

      if (pattern) {
        where.recurrencePattern = pattern;
      }

      return await Event.findAll({
        where,
        order: [['startDate', 'ASC']]
      });
    } catch (error) {
      logger.error('Error finding recurring events', { error, pattern });
      throw error;
    }
  }

  /**
   * Update event by ID
   * 
   * @param eventId - Event ID
   * @param updateData - Data to update
   * @param userId - User ID who updated the event
   * @param req - Express request object for audit logging
   * @returns Updated event instance or null
   */
  async update(
    eventId: number,
    updateData: Partial<EventAttributes>,
    userId?: number,
    req?: Request
  ): Promise<Event | null> {
    try {
      const event = await Event.findByPk(eventId, { paranoid: false });

      if (!event) {
        return null;
      }

      // Capture old value before update for audit logging
      const oldValue = event.toJSON();

      await event.update(updateData);
      logger.info('Event updated', {
        eventId,
        updatedFields: Object.keys(updateData)
      });

      // Capture new value after update
      const newValue = event.toJSON();

      // Log audit entry for update operation
      await auditLogger.logUpdate(
        'event',
        eventId,
        oldValue,
        newValue,
        userId,
        req
      );

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
   * @returns Updated event instance or null
   */
  async updateStatus(
    eventId: number,
    status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled',
    userId?: number,
    req?: Request
  ): Promise<Event | null> {
    return this.update(eventId, { status }, userId, req);
  }

  /**
   * Delete event (soft delete)
   * 
   * @param eventId - Event ID
   * @param userId - User ID who deleted the event
   * @param req - Express request object for audit logging
   * @returns True if deleted, false otherwise
   */
  async delete(
    eventId: number,
    userId?: number,
    req?: Request
  ): Promise<boolean> {
    try {
      const event = await Event.findByPk(eventId, { paranoid: false });

      if (!event) {
        return false;
      }

      const oldValue = event.toJSON();

      await event.destroy();
      logger.info('Event deleted', { eventId });

      // Log audit entry for delete operation
      await auditLogger.logDelete('event', eventId, oldValue, userId, req);

      return true;
    } catch (error) {
      logger.error('Error deleting event', { error, eventId });
      throw error;
    }
  }

  /**
   * Hard delete event (permanent)
   * 
   * @param eventId - Event ID
   * @returns True if deleted, false otherwise
   */
  async hardDelete(eventId: number): Promise<boolean> {
    try {
      const deleted = await Event.destroy({
        where: { eventId },
        force: true
      });
      return deleted > 0;
    } catch (error) {
      logger.error('Error hard deleting event', { error, eventId });
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
      const where: WhereOptions<EventAttributes> = {};

      if (filters?.startDateFrom || filters?.startDateTo) {
        const dateFilter: Record<symbol, Date> = {};
        if (filters.startDateFrom) {
          dateFilter[Op.gte] = filters.startDateFrom;
        }
        if (filters.startDateTo) {
          dateFilter[Op.lte] = filters.startDateTo;
        }
        where.startDate = dateFilter;
      }

      if (filters?.category) {
        where.category = filters.category as any;
      }

      const [total, scheduled, ongoing, completed, cancelled, holidays, governmentHolidays, recurring] =
        await Promise.all([
          Event.count({ where }),
          Event.count({ where: { ...where, status: 'scheduled' } }),
          Event.count({ where: { ...where, status: 'ongoing' } }),
          Event.count({ where: { ...where, status: 'completed' } }),
          Event.count({ where: { ...where, status: 'cancelled' } }),
          Event.count({ where: { ...where, isHoliday: true } }),
          Event.count({ where: { ...where, isNepalGovernmentHoliday: true } }),
          Event.count({ where: { ...where, isRecurring: true } }),
        ]);

      return {
        total,
        scheduled,
        ongoing,
        completed,
        cancelled,
        holidays,
        governmentHolidays,
        recurring
      };
    } catch (error) {
      logger.error('Error getting event stats', { error, filters });
      throw error;
    }
  }

  /**
   * Restore soft-deleted event
   * 
   * @param eventId - Event ID
   * @returns Restored event instance or null
   */
  async restore(eventId: number): Promise<Event | null> {
    try {
      const event = await Event.findByPk(eventId, { paranoid: false });
      if (!event) return null;

      await event.restore();
      logger.info('Event restored', { eventId });

      return event;
    } catch (error) {
      logger.error('Error restoring event', { error, eventId });
      throw error;
    }
  }
}

export default new EventRepository();