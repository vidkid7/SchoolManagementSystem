/**
 * ECA Event Service Tests
 * 
 * Tests for ECA event service business logic
 * 
 * Requirements: 11.5, 11.6, 11.7, 11.10
 */

import ecaEventService from '../ecaEvent.service';
import ecaEventRepository from '../ecaEvent.repository';
import ECA from '@models/ECA.model';
import ECAEvent from '@models/ECAEvent.model';
import ECAEnrollment from '@models/ECAEnrollment.model';
import { sequelize } from '@config/database';

describe('ECAEventService', () => {
  let testEcaId: number;
  let testEventId: number;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create test ECA
    const eca = await ECA.create({
      name: 'Test Debate Club',
      category: 'club',
      coordinatorId: 1,
      academicYearId: 1,
      currentEnrollment: 0,
      status: 'active'
    });
    testEcaId = eca.ecaId;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  afterEach(async () => {
    await ECAEvent.destroy({ where: {}, force: true });
    await ECAEnrollment.destroy({ where: {}, force: true });
  });

  describe('createEvent', () => {
    it('should create event with valid data', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const eventData = {
        ecaId: testEcaId,
        name: 'Inter-School Debate Competition',
        type: 'competition' as const,
        description: 'Annual debate competition',
        eventDate: futureDate,
        venue: 'School Auditorium'
      };

      const event = await ecaEventService.createEvent(eventData);

      expect(event).toBeDefined();
      expect(event.name).toBe(eventData.name);
      expect(event.type).toBe(eventData.type);
      expect(event.venue).toBe(eventData.venue);
      expect(event.status).toBe('scheduled');
    });

    it('should create event with Nepali fields', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const eventData = {
        ecaId: testEcaId,
        name: 'Cultural Performance',
        nameNp: 'सांस्कृतिक कार्यक्रम',
        type: 'performance' as const,
        eventDate: futureDate,
        eventDateBS: '2082-01-15',
        venue: 'Main Hall',
        venueNp: 'मुख्य हल'
      };

      const event = await ecaEventService.createEvent(eventData);

      expect(event.nameNp).toBe(eventData.nameNp);
      expect(event.eventDateBS).toBe(eventData.eventDateBS);
      expect(event.venueNp).toBe(eventData.venueNp);
    });

    it('should throw error for non-existent ECA', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const eventData = {
        ecaId: 99999,
        name: 'Test Event',
        type: 'competition' as const,
        eventDate: futureDate
      };

      await expect(ecaEventService.createEvent(eventData)).rejects.toThrow(
        'ECA with ID 99999 not found'
      );
    });

    it('should throw error for past event date', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);

      const eventData = {
        ecaId: testEcaId,
        name: 'Test Event',
        type: 'competition' as const,
        eventDate: pastDate
      };

      await expect(ecaEventService.createEvent(eventData)).rejects.toThrow(
        'Event date cannot be in the past'
      );
    });
  });

  describe('notifyEnrolledStudents', () => {
    beforeEach(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const event = await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Test Event',
        type: 'competition',
        eventDate: futureDate,
        status: 'scheduled'
      });
      testEventId = event.eventId;

      // Create enrollments
      await ECAEnrollment.create({
        ecaId: testEcaId,
        studentId: 1,
        enrollmentDate: new Date(),
        status: 'active',
        attendanceCount: 0,
        totalSessions: 0
      });

      await ECAEnrollment.create({
        ecaId: testEcaId,
        studentId: 2,
        enrollmentDate: new Date(),
        status: 'active',
        attendanceCount: 0,
        totalSessions: 0
      });

      await ECAEnrollment.create({
        ecaId: testEcaId,
        studentId: 3,
        enrollmentDate: new Date(),
        status: 'withdrawn',
        attendanceCount: 0,
        totalSessions: 0
      });
    });

    it('should return student IDs of enrolled students', async () => {
      const studentIds = await ecaEventService.notifyEnrolledStudents(
        testEventId
      );

      expect(studentIds).toHaveLength(2);
      expect(studentIds).toContain(1);
      expect(studentIds).toContain(2);
      expect(studentIds).not.toContain(3); // Withdrawn student
    });

    it('should return empty array if no enrolled students', async () => {
      // Remove all enrollments
      await ECAEnrollment.destroy({ where: {}, force: true });

      const studentIds = await ecaEventService.notifyEnrolledStudents(
        testEventId
      );

      expect(studentIds).toEqual([]);
    });

    it('should throw error for non-existent event', async () => {
      await expect(
        ecaEventService.notifyEnrolledStudents(99999)
      ).rejects.toThrow('Event with ID 99999 not found');
    });
  });

  describe('addParticipants', () => {
    beforeEach(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const event = await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Test Event',
        type: 'competition',
        eventDate: futureDate,
        status: 'scheduled',
        participants: []
      });
      testEventId = event.eventId;
    });

    it('should add multiple participants to event', async () => {
      const studentIds = [1, 2, 3, 4, 5];

      const event = await ecaEventService.addParticipants(
        testEventId,
        studentIds
      );

      expect(event.participants).toEqual(studentIds);
      expect(event.getParticipantCount()).toBe(5);
    });

    it('should handle empty participant list', async () => {
      const event = await ecaEventService.addParticipants(testEventId, []);

      expect(event.participants).toEqual([]);
      expect(event.getParticipantCount()).toBe(0);
    });

    it('should throw error for non-existent event', async () => {
      await expect(
        ecaEventService.addParticipants(99999, [1, 2, 3])
      ).rejects.toThrow('Event with ID 99999 not found');
    });
  });

  describe('removeParticipant', () => {
    beforeEach(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const event = await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Test Event',
        type: 'competition',
        eventDate: futureDate,
        status: 'scheduled',
        participants: [1, 2, 3, 4, 5]
      });
      testEventId = event.eventId;
    });

    it('should remove participant from event', async () => {
      const event = await ecaEventService.removeParticipant(testEventId, 3);

      expect(event.participants).toEqual([1, 2, 4, 5]);
      expect(event.getParticipantCount()).toBe(4);
    });

    it('should throw error for non-existent event', async () => {
      await expect(
        ecaEventService.removeParticipant(99999, 1)
      ).rejects.toThrow('Event with ID 99999 not found');
    });
  });

  describe('uploadPhotos', () => {
    beforeEach(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const event = await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Test Event',
        type: 'competition',
        eventDate: futureDate,
        status: 'scheduled',
        photos: []
      });
      testEventId = event.eventId;
    });

    it('should upload multiple photos to event', async () => {
      const photoUrls = [
        '/uploads/events/photo1.jpg',
        '/uploads/events/photo2.jpg',
        '/uploads/events/photo3.jpg'
      ];

      const event = await ecaEventService.uploadPhotos(testEventId, photoUrls);

      expect(event.photos).toEqual(photoUrls);
      expect(event.photos?.length).toBe(3);
    });

    it('should handle empty photo list', async () => {
      const event = await ecaEventService.uploadPhotos(testEventId, []);

      expect(event.photos).toEqual([]);
    });

    it('should throw error for non-existent event', async () => {
      await expect(
        ecaEventService.uploadPhotos(99999, ['/uploads/photo.jpg'])
      ).rejects.toThrow('Event with ID 99999 not found');
    });
  });

  describe('uploadVideos', () => {
    beforeEach(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const event = await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Test Event',
        type: 'competition',
        eventDate: futureDate,
        status: 'scheduled',
        videos: []
      });
      testEventId = event.eventId;
    });

    it('should upload multiple videos to event', async () => {
      const videoUrls = [
        '/uploads/events/video1.mp4',
        '/uploads/events/video2.mp4'
      ];

      const event = await ecaEventService.uploadVideos(testEventId, videoUrls);

      expect(event.videos).toEqual(videoUrls);
      expect(event.videos?.length).toBe(2);
    });

    it('should handle empty video list', async () => {
      const event = await ecaEventService.uploadVideos(testEventId, []);

      expect(event.videos).toEqual([]);
    });

    it('should throw error for non-existent event', async () => {
      await expect(
        ecaEventService.uploadVideos(99999, ['/uploads/video.mp4'])
      ).rejects.toThrow('Event with ID 99999 not found');
    });
  });

  describe('updateEvent', () => {
    beforeEach(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const event = await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Test Event',
        type: 'competition',
        eventDate: futureDate,
        venue: 'Old Venue',
        status: 'scheduled'
      });
      testEventId = event.eventId;
    });

    it('should update event details', async () => {
      const updateData = {
        name: 'Updated Event Name',
        venue: 'New Venue',
        description: 'Updated description'
      };

      const event = await ecaEventService.updateEvent(testEventId, updateData);

      expect(event.name).toBe(updateData.name);
      expect(event.venue).toBe(updateData.venue);
      expect(event.description).toBe(updateData.description);
    });

    it('should update event date to future date', async () => {
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 20);

      const event = await ecaEventService.updateEvent(testEventId, {
        eventDate: newDate
      });

      expect(event.eventDate.toDateString()).toBe(newDate.toDateString());
    });

    it('should throw error for past event date', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);

      await expect(
        ecaEventService.updateEvent(testEventId, { eventDate: pastDate })
      ).rejects.toThrow('Event date cannot be in the past');
    });

    it('should throw error for non-existent event', async () => {
      await expect(
        ecaEventService.updateEvent(99999, { name: 'Updated' })
      ).rejects.toThrow('Event with ID 99999 not found');
    });
  });

  describe('updateEventStatus', () => {
    beforeEach(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const event = await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Test Event',
        type: 'competition',
        eventDate: futureDate,
        status: 'scheduled'
      });
      testEventId = event.eventId;
    });

    it('should update event status from scheduled to ongoing', async () => {
      const event = await ecaEventService.updateEventStatus(
        testEventId,
        'ongoing'
      );

      expect(event.status).toBe('ongoing');
    });

    it('should update event status from ongoing to completed', async () => {
      await ecaEventService.updateEventStatus(testEventId, 'ongoing');
      const event = await ecaEventService.updateEventStatus(
        testEventId,
        'completed'
      );

      expect(event.status).toBe('completed');
    });

    it('should throw error when changing status of completed event', async () => {
      await ecaEventService.updateEventStatus(testEventId, 'completed');

      await expect(
        ecaEventService.updateEventStatus(testEventId, 'scheduled')
      ).rejects.toThrow('Cannot change status of a completed event');
    });

    it('should throw error when changing status of cancelled event', async () => {
      await ecaEventService.updateEventStatus(testEventId, 'cancelled');

      await expect(
        ecaEventService.updateEventStatus(testEventId, 'scheduled')
      ).rejects.toThrow('Cannot change status of a cancelled event');
    });

    it('should throw error for non-existent event', async () => {
      await expect(
        ecaEventService.updateEventStatus(99999, 'completed')
      ).rejects.toThrow('Event with ID 99999 not found');
    });
  });

  describe('getEventById', () => {
    beforeEach(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const event = await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Test Event',
        type: 'competition',
        eventDate: futureDate,
        status: 'scheduled'
      });
      testEventId = event.eventId;
    });

    it('should get event by ID', async () => {
      const event = await ecaEventService.getEventById(testEventId);

      expect(event).toBeDefined();
      expect(event?.eventId).toBe(testEventId);
      expect(event?.name).toBe('Test Event');
    });

    it('should return null for non-existent event', async () => {
      const event = await ecaEventService.getEventById(99999);

      expect(event).toBeNull();
    });
  });

  describe('getEcaEvents', () => {
    beforeEach(async () => {
      const futureDate1 = new Date();
      futureDate1.setDate(futureDate1.getDate() + 10);

      const futureDate2 = new Date();
      futureDate2.setDate(futureDate2.getDate() + 20);

      await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Event 1',
        type: 'competition',
        eventDate: futureDate1,
        status: 'scheduled'
      });

      await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Event 2',
        type: 'performance',
        eventDate: futureDate2,
        status: 'completed'
      });
    });

    it('should get all events for an ECA', async () => {
      const events = await ecaEventService.getEcaEvents(testEcaId);

      expect(events).toHaveLength(2);
      expect(events.every(e => e.ecaId === testEcaId)).toBe(true);
    });

    it('should filter events by status', async () => {
      const events = await ecaEventService.getEcaEvents(
        testEcaId,
        'scheduled'
      );

      expect(events).toHaveLength(1);
      expect(events[0].status).toBe('scheduled');
    });
  });

  describe('deleteEvent', () => {
    beforeEach(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const event = await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Test Event',
        type: 'competition',
        eventDate: futureDate,
        status: 'scheduled'
      });
      testEventId = event.eventId;
    });

    it('should delete scheduled event', async () => {
      const deleted = await ecaEventService.deleteEvent(testEventId);

      expect(deleted).toBe(true);

      const event = await ecaEventService.getEventById(testEventId);
      expect(event).toBeNull();
    });

    it('should throw error when deleting completed event', async () => {
      await ecaEventService.updateEventStatus(testEventId, 'completed');

      await expect(ecaEventService.deleteEvent(testEventId)).rejects.toThrow(
        'Cannot delete a completed event'
      );
    });

    it('should throw error for non-existent event', async () => {
      await expect(ecaEventService.deleteEvent(99999)).rejects.toThrow(
        'Event with ID 99999 not found'
      );
    });
  });

  describe('getEventStats', () => {
    beforeEach(async () => {
      const futureDate1 = new Date();
      futureDate1.setDate(futureDate1.getDate() + 10);

      const futureDate2 = new Date();
      futureDate2.setDate(futureDate2.getDate() + 20);

      const futureDate3 = new Date();
      futureDate3.setDate(futureDate3.getDate() + 30);

      await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Event 1',
        type: 'competition',
        eventDate: futureDate1,
        status: 'scheduled',
        participants: [1, 2, 3]
      });

      await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Event 2',
        type: 'performance',
        eventDate: futureDate2,
        status: 'completed',
        participants: [1, 2, 3, 4, 5]
      });

      await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Event 3',
        type: 'exhibition',
        eventDate: futureDate3,
        status: 'cancelled',
        participants: []
      });
    });

    it('should calculate event statistics', async () => {
      const stats = await ecaEventService.getEventStats(testEcaId);

      expect(stats.total).toBe(3);
      expect(stats.scheduled).toBe(1);
      expect(stats.completed).toBe(1);
      expect(stats.cancelled).toBe(1);
      expect(stats.totalParticipants).toBe(8);
      expect(stats.averageParticipants).toBeCloseTo(2.67, 1);
    });
  });
});
