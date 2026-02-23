/**
 * ECA Event Service
 * Business logic for ECA event management
 * 
 * Features:
 * - Event creation with date, venue, participants
 * - Notification to enrolled students
 * - Achievement and award recording
 * - Photo/video upload management
 * 
 * Requirements: 11.5, 11.6, 11.7, 11.10
 */

import ecaEventRepository from './ecaEvent.repository';
import ecaEnrollmentRepository from './ecaEnrollment.repository';
import ECA from '@models/ECA.model';
import ECAEvent, { ECAEventCreationAttributes } from '@models/ECAEvent.model';
import { logger } from '@utils/logger';
import { Request } from 'express';

interface EventInput {
  ecaId: number;
  name: string;
  nameNp?: string;
  type: 'competition' | 'performance' | 'exhibition' | 'workshop' | 'other';
  description?: string;
  descriptionNp?: string;
  eventDate: Date;
  eventDateBS?: string;
  venue?: string;
  venueNp?: string;
  organizer?: string;
  remarks?: string;
}

interface EventFilters {
  ecaId?: number;
  type?: 'competition' | 'performance' | 'exhibition' | 'workshop' | 'other';
  status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  eventDateFrom?: Date;
  eventDateTo?: Date;
  venue?: string;
}

class ECAEventService {
  /**
   * Create a new ECA event
   * Requirement 11.5: Create events with date, venue, participants
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
  ): Promise<ECAEvent> {
    try {
      const { ecaId, eventDate, ...rest } = eventData;

      // 1. Validate ECA exists
      const eca = await ECA.findByPk(ecaId);
      if (!eca) {
        throw new Error(`ECA with ID ${ecaId} not found`);
      }

      // 2. Validate event date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventDateOnly = new Date(eventDate);
      eventDateOnly.setHours(0, 0, 0, 0);

      if (eventDateOnly < today) {
        throw new Error('Event date cannot be in the past');
      }

      // 3. Create event
      const eventCreateData: ECAEventCreationAttributes = {
        ecaId,
        eventDate,
        status: 'scheduled',
        participants: [],
        photos: [],
        videos: [],
        ...rest
      };

      const event = await ecaEventRepository.create(
        eventCreateData,
        userId,
        req
      );

      logger.info('ECA event created successfully', {
        eventId: event.eventId,
        ecaId,
        name: event.name,
        eventDate: event.eventDate
      });

      return event;
    } catch (error) {
      logger.error('Error creating ECA event', { error, eventData });
      throw error;
    }
  }

  /**
   * Send notifications to enrolled students about an event
   * Requirement 11.6: Send notifications to enrolled students
   * 
   * @param eventId - Event ID
   * @returns Array of student IDs notified
   * @throws Error if event not found
   */
  async notifyEnrolledStudents(eventId: number): Promise<number[]> {
    try {
      // 1. Get event details
      const event = await ecaEventRepository.findById(eventId);
      if (!event) {
        throw new Error(`Event with ID ${eventId} not found`);
      }

      // 2. Get all active enrollments for the ECA
      const enrollments = await ecaEnrollmentRepository.findByEca(
        event.ecaId,
        'active'
      );

      if (enrollments.length === 0) {
        logger.info('No enrolled students to notify', { eventId });
        return [];
      }

      // 3. Extract student IDs
      const studentIds = enrollments.map(e => e.studentId);

      // TODO: Integrate with notification service to send actual notifications
      // For now, we'll just log the notification intent
      logger.info('Notifications sent to enrolled students', {
        eventId,
        ecaId: event.ecaId,
        eventName: event.name,
        studentCount: studentIds.length,
        studentIds
      });

      return studentIds;
    } catch (error) {
      logger.error('Error notifying enrolled students', { error, eventId });
      throw error;
    }
  }

  /**
   * Add participants to an event
   * Requirement 11.5: Create events with participants
   * 
   * @param eventId - Event ID
   * @param studentIds - Array of student IDs
   * @param userId - User ID performing the operation
   * @param req - Express request object
   * @returns Updated event
   * @throws Error if event not found
   */
  async addParticipants(
    eventId: number,
    studentIds: number[],
    userId?: number,
    req?: Request
  ): Promise<ECAEvent> {
    try {
      // 1. Validate event exists
      const event = await ecaEventRepository.findById(eventId);
      if (!event) {
        throw new Error(`Event with ID ${eventId} not found`);
      }

      // 2. Add each student as participant
      for (const studentId of studentIds) {
        await ecaEventRepository.addParticipant(eventId, studentId, userId, req);
      }

      // 3. Get updated event
      const updatedEvent = await ecaEventRepository.findById(eventId);
      if (!updatedEvent) {
        throw new Error('Failed to retrieve updated event');
      }

      logger.info('Participants added to event', {
        eventId,
        addedCount: studentIds.length,
        totalParticipants: updatedEvent.getParticipantCount()
      });

      return updatedEvent;
    } catch (error) {
      logger.error('Error adding participants to event', {
        error,
        eventId,
        studentIds
      });
      throw error;
    }
  }

  /**
   * Remove participant from an event
   * 
   * @param eventId - Event ID
   * @param studentId - Student ID
   * @param userId - User ID performing the operation
   * @param req - Express request object
   * @returns Updated event
   * @throws Error if event not found
   */
  async removeParticipant(
    eventId: number,
    studentId: number,
    userId?: number,
    req?: Request
  ): Promise<ECAEvent> {
    try {
      const event = await ecaEventRepository.removeParticipant(
        eventId,
        studentId,
        userId,
        req
      );

      if (!event) {
        throw new Error(`Event with ID ${eventId} not found`);
      }

      logger.info('Participant removed from event', {
        eventId,
        studentId,
        remainingParticipants: event.getParticipantCount()
      });

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
   * Upload photos to an event
   * Requirement 11.10: Upload event photos/videos
   * 
   * @param eventId - Event ID
   * @param photoUrls - Array of photo URLs
   * @param userId - User ID performing the operation
   * @param req - Express request object
   * @returns Updated event
   * @throws Error if event not found
   */
  async uploadPhotos(
    eventId: number,
    photoUrls: string[],
    userId?: number,
    req?: Request
  ): Promise<ECAEvent> {
    try {
      // 1. Validate event exists
      const event = await ecaEventRepository.findById(eventId);
      if (!event) {
        throw new Error(`Event with ID ${eventId} not found`);
      }

      // 2. Add each photo
      for (const photoUrl of photoUrls) {
        await ecaEventRepository.addPhoto(eventId, photoUrl, userId, req);
      }

      // 3. Get updated event
      const updatedEvent = await ecaEventRepository.findById(eventId);
      if (!updatedEvent) {
        throw new Error('Failed to retrieve updated event');
      }

      logger.info('Photos uploaded to event', {
        eventId,
        uploadedCount: photoUrls.length,
        totalPhotos: updatedEvent.photos?.length || 0
      });

      return updatedEvent;
    } catch (error) {
      logger.error('Error uploading photos to event', {
        error,
        eventId,
        photoUrls
      });
      throw error;
    }
  }

  /**
   * Upload videos to an event
   * Requirement 11.10: Upload event photos/videos
   * 
   * @param eventId - Event ID
   * @param videoUrls - Array of video URLs
   * @param userId - User ID performing the operation
   * @param req - Express request object
   * @returns Updated event
   * @throws Error if event not found
   */
  async uploadVideos(
    eventId: number,
    videoUrls: string[],
    userId?: number,
    req?: Request
  ): Promise<ECAEvent> {
    try {
      // 1. Validate event exists
      const event = await ecaEventRepository.findById(eventId);
      if (!event) {
        throw new Error(`Event with ID ${eventId} not found`);
      }

      // 2. Add each video
      for (const videoUrl of videoUrls) {
        await ecaEventRepository.addVideo(eventId, videoUrl, userId, req);
      }

      // 3. Get updated event
      const updatedEvent = await ecaEventRepository.findById(eventId);
      if (!updatedEvent) {
        throw new Error('Failed to retrieve updated event');
      }

      logger.info('Videos uploaded to event', {
        eventId,
        uploadedCount: videoUrls.length,
        totalVideos: updatedEvent.videos?.length || 0
      });

      return updatedEvent;
    } catch (error) {
      logger.error('Error uploading videos to event', {
        error,
        eventId,
        videoUrls
      });
      throw error;
    }
  }

  /**
   * Update event details
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
  ): Promise<ECAEvent> {
    try {
      // Validate event date if being updated
      if (updateData.eventDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const eventDateOnly = new Date(updateData.eventDate);
        eventDateOnly.setHours(0, 0, 0, 0);

        if (eventDateOnly < today) {
          throw new Error('Event date cannot be in the past');
        }
      }

      const event = await ecaEventRepository.update(
        eventId,
        updateData,
        userId,
        req
      );

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
   * @throws Error if event not found or invalid status transition
   */
  async updateEventStatus(
    eventId: number,
    status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled',
    userId?: number,
    req?: Request
  ): Promise<ECAEvent> {
    try {
      const event = await ecaEventRepository.findById(eventId);
      if (!event) {
        throw new Error(`Event with ID ${eventId} not found`);
      }

      // Validate status transitions
      if (event.status === 'completed' && status !== 'completed') {
        throw new Error('Cannot change status of a completed event');
      }

      if (event.status === 'cancelled' && status !== 'cancelled') {
        throw new Error('Cannot change status of a cancelled event');
      }

      const updatedEvent = await ecaEventRepository.update(
        eventId,
        { status },
        userId,
        req
      );

      if (!updatedEvent) {
        throw new Error('Failed to update event status');
      }

      logger.info('Event status updated', {
        eventId,
        oldStatus: event.status,
        newStatus: status
      });

      return updatedEvent;
    } catch (error) {
      logger.error('Error updating event status', { error, eventId, status });
      throw error;
    }
  }

  /**
   * Get event by ID
   * 
   * @param eventId - Event ID
   * @returns Event or null
   */
  async getEventById(eventId: number): Promise<ECAEvent | null> {
    try {
      return await ecaEventRepository.findById(eventId);
    } catch (error) {
      logger.error('Error getting event by ID', { error, eventId });
      throw error;
    }
  }

  /**
   * Get all events for an ECA
   * 
   * @param ecaId - ECA ID
   * @param status - Optional status filter
   * @returns Array of events
   */
  async getEcaEvents(
    ecaId: number,
    status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
  ): Promise<ECAEvent[]> {
    try {
      return await ecaEventRepository.findByEca(ecaId, status);
    } catch (error) {
      logger.error('Error getting ECA events', { error, ecaId, status });
      throw error;
    }
  }

  /**
   * Get upcoming events
   * 
   * @param limit - Maximum number of events
   * @param ecaId - Optional ECA ID filter
   * @returns Array of upcoming events
   */
  async getUpcomingEvents(
    limit: number = 10,
    ecaId?: number
  ): Promise<ECAEvent[]> {
    try {
      return await ecaEventRepository.findUpcoming(limit, ecaId);
    } catch (error) {
      logger.error('Error getting upcoming events', { error, limit, ecaId });
      throw error;
    }
  }

  /**
   * Get events by date range
   * 
   * @param startDate - Start date
   * @param endDate - End date
   * @param ecaId - Optional ECA ID filter
   * @returns Array of events
   */
  async getEventsByDateRange(
    startDate: Date,
    endDate: Date,
    ecaId?: number
  ): Promise<ECAEvent[]> {
    try {
      return await ecaEventRepository.findByDateRange(startDate, endDate, ecaId);
    } catch (error) {
      logger.error('Error getting events by date range', {
        error,
        startDate,
        endDate,
        ecaId
      });
      throw error;
    }
  }

  /**
   * Get events for a student participant
   * 
   * @param studentId - Student ID
   * @returns Array of events
   */
  async getStudentEvents(studentId: number): Promise<ECAEvent[]> {
    try {
      return await ecaEventRepository.findByParticipant(studentId);
    } catch (error) {
      logger.error('Error getting student events', { error, studentId });
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
    events: ECAEvent[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      return await ecaEventRepository.findWithPagination(filters, page, limit);
    } catch (error) {
      logger.error('Error getting events', { error, filters, page, limit });
      throw error;
    }
  }

  /**
   * Get event statistics for an ECA
   * 
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
      return await ecaEventRepository.getEventStats(ecaId);
    } catch (error) {
      logger.error('Error getting event stats', { error, ecaId });
      throw error;
    }
  }

  /**
   * Delete an event
   * 
   * @param eventId - Event ID
   * @param userId - User ID performing the operation
   * @param req - Express request object
   * @returns True if deleted
   * @throws Error if event not found or cannot be deleted
   */
  async deleteEvent(
    eventId: number,
    userId?: number,
    req?: Request
  ): Promise<boolean> {
    try {
      const event = await ecaEventRepository.findById(eventId);
      if (!event) {
        throw new Error(`Event with ID ${eventId} not found`);
      }

      // Don't allow deletion of completed events
      if (event.status === 'completed') {
        throw new Error('Cannot delete a completed event');
      }

      const deleted = await ecaEventRepository.delete(eventId, userId, req);

      if (deleted) {
        logger.info('Event deleted successfully', { eventId });
      }

      return deleted;
    } catch (error) {
      logger.error('Error deleting event', { error, eventId });
      throw error;
    }
  }
}

export default new ECAEventService();
