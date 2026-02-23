/**
 * ECA Event Repository
 * Handles all database operations for ECAEvent entity
 * 
 * Features:
 * - Event creation with date, venue, participants
 * - Participant management
 * - Photo/video upload tracking
 * - Event filtering and querying
 * 
 * Requirements: 11.5, 11.6, 11.10
 */

import { Op, WhereOptions } from 'sequelize';
import ECAEvent, {
  ECAEventAttributes,
  ECAEventCreationAttributes
} from '@models/ECAEvent.model';
import ECA from '@models/ECA.model';
import { logger } from '@utils/logger';
import auditLogger from '@utils/auditLogger';
import { Request } from 'express';

class ECAEventRepository {
  /**
   * Create a new ECA event
   * @param eventData - Event creation data
   * @param userId - User ID who created the event
   * @param req - Express request object for audit logging
   * @returns Created event instance
   */
  async create(
    eventData: ECAEventCreationAttributes,
    userId?: number,
    req?: Request
  ): Promise<ECAEvent> {
    try {
      const event = await ECAEvent.create(eventData);
      logger.info('ECA event created', {
        eventId: event.eventId,
        ecaId: event.ecaId,
        name: event.name,
        eventDate: event.eventDate
      });

      // Log audit entry for create operation
      await auditLogger.logCreate(
        'eca_event',
        event.eventId,
        event.toJSON(),
        userId,
        req
      );

      return event;
    } catch (error) {
      logger.error('Error creating ECA event', { error, eventData });
      throw error;
    }
  }

  /**
   * Find event by ID
   * @param eventId - Event ID
   * @returns Event instance or null
   */
  async findById(eventId: number): Promise<ECAEvent | null> {
    try {
      return await ECAEvent.findByPk(eventId, {
        include: [
          {
            model: ECA,
            as: 'eca',
            attributes: ['ecaId', 'name', 'nameNp', 'category']
          }
        ]
      });
    } catch (error) {
      logger.error('Error finding event by ID', { error, eventId });
      throw error;
    }
  }

  /**
   * Find all events for an ECA
   * @param ecaId - ECA ID
   * @param status - Optional status filter
   * @returns Array of events
   */
  async findByEca(
    ecaId: number,
    status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
  ): Promise<ECAEvent[]> {
    try {
      const where: WhereOptions<ECAEventAttributes> = { ecaId };

      if (status) {
        where.status = status;
      }

      return await ECAEvent.findAll({
        where,
        order: [['eventDate', 'DESC']]
      });
    } catch (error) {
      logger.error('Error finding events by ECA', { error, ecaId, status });
      throw error;
    }
  }

  /**
   * Find events by date range
   * @param startDate - Start date
   * @param endDate - End date
   * @param ecaId - Optional ECA ID filter
   * @returns Array of events
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    ecaId?: number
  ): Promise<ECAEvent[]> {
    try {
      const where: WhereOptions<ECAEventAttributes> = {
        eventDate: {
          [Op.between]: [startDate, endDate]
        }
      };

      if (ecaId) {
        where.ecaId = ecaId;
      }

      return await ECAEvent.findAll({
        where,
        order: [['eventDate', 'ASC']],
        include: [
          {
            model: ECA,
            as: 'eca',
            attributes: ['ecaId', 'name', 'nameNp', 'category']
          }
        ]
      });
    } catch (error) {
      logger.error('Error finding events by date range', {
        error,
        startDate,
        endDate,
        ecaId
      });
      throw error;
    }
  }

  /**
   * Find upcoming events
   * @param limit - Maximum number of events to return
   * @param ecaId - Optional ECA ID filter
   * @returns Array of upcoming events
   */
  async findUpcoming(limit: number = 10, ecaId?: number): Promise<ECAEvent[]> {
    try {
      const where: WhereOptions<ECAEventAttributes> = {
        eventDate: {
          [Op.gte]: new Date()
        },
        status: {
          [Op.in]: ['scheduled', 'ongoing']
        }
      };

      if (ecaId) {
        where.ecaId = ecaId;
      }

      return await ECAEvent.findAll({
        where,
        order: [['eventDate', 'ASC']],
        limit,
        include: [
          {
            model: ECA,
            as: 'eca',
            attributes: ['ecaId', 'name', 'nameNp', 'category']
          }
        ]
      });
    } catch (error) {
      logger.error('Error finding upcoming events', { error, limit, ecaId });
      throw error;
    }
  }

  /**
   * Find events by participant
   * @param studentId - Student ID
   * @returns Array of events
   */
  async findByParticipant(studentId: number): Promise<ECAEvent[]> {
    try {
      // Find events where participants array contains studentId
      const events = await ECAEvent.findAll({
        include: [
          {
            model: ECA,
            as: 'eca',
            attributes: ['ecaId', 'name', 'nameNp', 'category']
          }
        ],
        order: [['eventDate', 'DESC']]
      });

      // Filter events where student is a participant
      return events.filter(event => 
        event.participants && event.participants.includes(studentId)
      );
    } catch (error) {
      logger.error('Error finding events by participant', { error, studentId });
      throw error;
    }
  }

  /**
   * Update event by ID
   * @param eventId - Event ID
   * @param updateData - Data to update
   * @param userId - User ID who updated the event
   * @param req - Express request object for audit logging
   * @returns Updated event instance or null
   */
  async update(
    eventId: number,
    updateData: Partial<ECAEventAttributes>,
    userId?: number,
    req?: Request
  ): Promise<ECAEvent | null> {
    try {
      const event = await ECAEvent.findByPk(eventId);

      if (!event) {
        return null;
      }

      // Capture old value before update for audit logging
      const oldValue = event.toJSON();

      await event.update(updateData);
      logger.info('ECA event updated', {
        eventId,
        updatedFields: Object.keys(updateData)
      });

      // Capture new value after update
      const newValue = event.toJSON();

      // Log audit entry for update operation
      await auditLogger.logUpdate(
        'eca_event',
        eventId,
        oldValue,
        newValue,
        userId,
        req
      );

      return event;
    } catch (error) {
      logger.error('Error updating ECA event', { error, eventId, updateData });
      throw error;
    }
  }

  /**
   * Add participant to event
   * @param eventId - Event ID
   * @param studentId - Student ID
   * @param userId - User ID performing the operation
   * @param req - Express request object
   * @returns Updated event instance or null
   */
  async addParticipant(
    eventId: number,
    studentId: number,
    userId?: number,
    req?: Request
  ): Promise<ECAEvent | null> {
    try {
      const event = await ECAEvent.findByPk(eventId);

      if (!event) {
        return null;
      }

      const oldValue = event.toJSON();

      event.addParticipant(studentId);
      await event.save();

      logger.info('Participant added to ECA event', {
        eventId,
        studentId,
        participantCount: event.getParticipantCount()
      });

      const newValue = event.toJSON();

      await auditLogger.logUpdate(
        'eca_event',
        eventId,
        oldValue,
        newValue,
        userId,
        req
      );

      return event;
    } catch (error) {
      logger.error('Error adding participant to event', {
        error,
        eventId,
        studentId
      });
      throw error;
    }
  }

  /**
   * Remove participant from event
   * @param eventId - Event ID
   * @param studentId - Student ID
   * @param userId - User ID performing the operation
   * @param req - Express request object
   * @returns Updated event instance or null
   */
  async removeParticipant(
    eventId: number,
    studentId: number,
    userId?: number,
    req?: Request
  ): Promise<ECAEvent | null> {
    try {
      const event = await ECAEvent.findByPk(eventId);

      if (!event) {
        return null;
      }

      const oldValue = event.toJSON();

      event.removeParticipant(studentId);
      await event.save();

      logger.info('Participant removed from ECA event', {
        eventId,
        studentId,
        participantCount: event.getParticipantCount()
      });

      const newValue = event.toJSON();

      await auditLogger.logUpdate(
        'eca_event',
        eventId,
        oldValue,
        newValue,
        userId,
        req
      );

      return event;
    } catch (error) {
      logger.error('Error removing participant from event', {
        error,
        eventId,
        studentId
      });
      throw error;
    }
  }

  /**
   * Add photo to event
   * @param eventId - Event ID
   * @param photoUrl - Photo URL
   * @param userId - User ID performing the operation
   * @param req - Express request object
   * @returns Updated event instance or null
   */
  async addPhoto(
    eventId: number,
    photoUrl: string,
    userId?: number,
    req?: Request
  ): Promise<ECAEvent | null> {
    try {
      const event = await ECAEvent.findByPk(eventId);

      if (!event) {
        return null;
      }

      const oldValue = event.toJSON();

      event.addPhoto(photoUrl);
      await event.save();

      logger.info('Photo added to ECA event', {
        eventId,
        photoUrl,
        totalPhotos: event.photos?.length || 0
      });

      const newValue = event.toJSON();

      await auditLogger.logUpdate(
        'eca_event',
        eventId,
        oldValue,
        newValue,
        userId,
        req
      );

      return event;
    } catch (error) {
      logger.error('Error adding photo to event', { error, eventId, photoUrl });
      throw error;
    }
  }

  /**
   * Add video to event
   * @param eventId - Event ID
   * @param videoUrl - Video URL
   * @param userId - User ID performing the operation
   * @param req - Express request object
   * @returns Updated event instance or null
   */
  async addVideo(
    eventId: number,
    videoUrl: string,
    userId?: number,
    req?: Request
  ): Promise<ECAEvent | null> {
    try {
      const event = await ECAEvent.findByPk(eventId);

      if (!event) {
        return null;
      }

      const oldValue = event.toJSON();

      event.addVideo(videoUrl);
      await event.save();

      logger.info('Video added to ECA event', {
        eventId,
        videoUrl,
        totalVideos: event.videos?.length || 0
      });

      const newValue = event.toJSON();

      await auditLogger.logUpdate(
        'eca_event',
        eventId,
        oldValue,
        newValue,
        userId,
        req
      );

      return event;
    } catch (error) {
      logger.error('Error adding video to event', { error, eventId, videoUrl });
      throw error;
    }
  }

  /**
   * Delete event (soft delete)
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
      const event = await ECAEvent.findByPk(eventId);

      if (!event) {
        return false;
      }

      const oldValue = event.toJSON();

      await event.destroy();
      logger.info('ECA event deleted', { eventId });

      // Log audit entry for delete operation
      await auditLogger.logDelete('eca_event', eventId, oldValue, userId, req);

      return true;
    } catch (error) {
      logger.error('Error deleting ECA event', { error, eventId });
      throw error;
    }
  }

  /**
   * Find all events with optional filters and pagination
   * @param filters - Optional filters
   * @param options - Pagination and sorting options
   * @returns Array of events and total count
   */
  async findAll(
    filters?: {
      ecaId?: number;
      type?: 'competition' | 'performance' | 'exhibition' | 'workshop' | 'other';
      status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
      eventDateFrom?: Date;
      eventDateTo?: Date;
      venue?: string;
    },
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<{ events: ECAEvent[]; total: number }> {
    try {
      const where: WhereOptions<ECAEventAttributes> = {};

      // Apply filters
      if (filters?.ecaId) {
        where.ecaId = filters.ecaId;
      }

      if (filters?.type) {
        where.type = filters.type;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.venue) {
        where.venue = { [Op.like]: `%${filters.venue}%` };
      }

      // Date range filter
      if (filters?.eventDateFrom || filters?.eventDateTo) {
        const dateFilter: Record<symbol, Date> = {};
        if (filters.eventDateFrom) {
          dateFilter[Op.gte] = filters.eventDateFrom;
        }
        if (filters.eventDateTo) {
          dateFilter[Op.lte] = filters.eventDateTo;
        }
        where.eventDate = dateFilter;
      }

      // Set pagination defaults (default 20, max 100)
      const limit = Math.min(options?.limit || 20, 100);
      const offset = options?.offset || 0;
      const orderBy = options?.orderBy || 'eventDate';
      const orderDirection = options?.orderDirection || 'DESC';

      // Execute query with parameterized filters
      const { rows: events, count: total } = await ECAEvent.findAndCountAll({
        where,
        limit,
        offset,
        order: [[orderBy, orderDirection]],
        include: [
          {
            model: ECA,
            as: 'eca',
            attributes: ['ecaId', 'name', 'nameNp', 'category']
          }
        ]
      });

      return { events, total };
    } catch (error) {
      logger.error('Error finding all ECA events', { error, filters, options });
      throw error;
    }
  }

  /**
   * Get events with pagination metadata
   * @param filters - Optional filters
   * @param page - Page number (1-indexed)
   * @param limit - Items per page (default 20, max 100)
   * @returns Events with pagination metadata
   */
  async findWithPagination(
    filters?: {
      ecaId?: number;
      type?: 'competition' | 'performance' | 'exhibition' | 'workshop' | 'other';
      status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
    },
    page: number = 1,
    limit: number = 20
  ): Promise<{
    events: ECAEvent[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      // Ensure limit doesn't exceed max
      const safeLimit = Math.min(limit, 100);
      const offset = (page - 1) * safeLimit;

      const { events, total } = await this.findAll(filters, {
        limit: safeLimit,
        offset
      });

      return {
        events,
        pagination: {
          page,
          limit: safeLimit,
          total,
          totalPages: Math.ceil(total / safeLimit)
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
   * Get event statistics for an ECA
   * @param ecaId - ECA ID
   * @returns Event statistics
   */
  async getEventStats(ecaId: number): Promise<{
    total: number;
    scheduled: number;
    ongoing: number;
    completed: number;
    cancelled: number;
    totalParticipants: number;
    averageParticipants: number;
  }> {
    try {
      const [total, scheduled, ongoing, completed, cancelled, events] =
        await Promise.all([
          ECAEvent.count({ where: { ecaId } }),
          ECAEvent.count({ where: { ecaId, status: 'scheduled' } }),
          ECAEvent.count({ where: { ecaId, status: 'ongoing' } }),
          ECAEvent.count({ where: { ecaId, status: 'completed' } }),
          ECAEvent.count({ where: { ecaId, status: 'cancelled' } }),
          ECAEvent.findAll({ where: { ecaId } })
        ]);

      // Calculate participant statistics
      let totalParticipants = 0;
      for (const event of events) {
        totalParticipants += event.getParticipantCount();
      }

      const averageParticipants =
        total > 0 ? Math.round((totalParticipants / total) * 100) / 100 : 0;

      return {
        total,
        scheduled,
        ongoing,
        completed,
        cancelled,
        totalParticipants,
        averageParticipants
      };
    } catch (error) {
      logger.error('Error getting event stats', { error, ecaId });
      throw error;
    }
  }
}

export default new ECAEventRepository();
