/**
 * ECA Event Repository Tests
 * 
 * Tests for ECA event repository database operations
 * 
 * Requirements: 11.5, 11.6, 11.10
 */

import ecaEventRepository from '../ecaEvent.repository';
import ECAEvent from '@models/ECAEvent.model';
import ECA from '@models/ECA.model';
import { sequelize } from '@config/database';

describe('ECAEventRepository', () => {
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
    // Clean up events after each test
    await ECAEvent.destroy({ where: {}, force: true });
  });

  describe('create', () => {
    it('should create a new event with all required fields', async () => {
      const eventData = {
        ecaId: testEcaId,
        name: 'Inter-School Debate Competition',
        type: 'competition' as const,
        eventDate: new Date('2025-03-15'),
        venue: 'School Auditorium',
        status: 'scheduled' as const
      };

      const event = await ecaEventRepository.create(eventData);

      expect(event).toBeDefined();
      expect(event.eventId).toBeDefined();
      expect(event.name).toBe(eventData.name);
      expect(event.type).toBe(eventData.type);
      expect(event.ecaId).toBe(testEcaId);
      expect(event.venue).toBe(eventData.venue);
      expect(event.status).toBe('scheduled');
    });

    it('should create event with optional fields', async () => {
      const eventData = {
        ecaId: testEcaId,
        name: 'Cultural Performance',
        nameNp: 'सांस्कृतिक कार्यक्रम',
        type: 'performance' as const,
        description: 'Annual cultural performance',
        eventDate: new Date('2025-04-20'),
        eventDateBS: '2082-01-07',
        venue: 'Main Hall',
        venueNp: 'मुख्य हल',
        organizer: 'Cultural Committee',
        status: 'scheduled' as const,
        participants: [1, 2, 3],
        photos: [],
        videos: []
      };

      const event = await ecaEventRepository.create(eventData);

      expect(event.nameNp).toBe(eventData.nameNp);
      expect(event.description).toBe(eventData.description);
      expect(event.eventDateBS).toBe(eventData.eventDateBS);
      expect(event.venueNp).toBe(eventData.venueNp);
      expect(event.organizer).toBe(eventData.organizer);
      expect(event.participants).toEqual([1, 2, 3]);
    });
  });

  describe('findById', () => {
    beforeEach(async () => {
      const event = await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Test Event',
        type: 'competition',
        eventDate: new Date('2025-03-15'),
        status: 'scheduled'
      });
      testEventId = event.eventId;
    });

    it('should find event by ID', async () => {
      const event = await ecaEventRepository.findById(testEventId);

      expect(event).toBeDefined();
      expect(event?.eventId).toBe(testEventId);
      expect(event?.name).toBe('Test Event');
    });

    it('should return null for non-existent event', async () => {
      const event = await ecaEventRepository.findById(99999);

      expect(event).toBeNull();
    });
  });

  describe('findByEca', () => {
    beforeEach(async () => {
      await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Event 1',
        type: 'competition',
        eventDate: new Date('2025-03-15'),
        status: 'scheduled'
      });

      await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Event 2',
        type: 'performance',
        eventDate: new Date('2025-04-20'),
        status: 'completed'
      });
    });

    it('should find all events for an ECA', async () => {
      const events = await ecaEventRepository.findByEca(testEcaId);

      expect(events).toHaveLength(2);
      expect(events[0].ecaId).toBe(testEcaId);
      expect(events[1].ecaId).toBe(testEcaId);
    });

    it('should filter events by status', async () => {
      const events = await ecaEventRepository.findByEca(testEcaId, 'scheduled');

      expect(events).toHaveLength(1);
      expect(events[0].status).toBe('scheduled');
    });

    it('should return empty array for ECA with no events', async () => {
      const events = await ecaEventRepository.findByEca(99999);

      expect(events).toEqual([]);
    });
  });

  describe('findByDateRange', () => {
    beforeEach(async () => {
      await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Event 1',
        type: 'competition',
        eventDate: new Date('2025-03-15'),
        status: 'scheduled'
      });

      await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Event 2',
        type: 'performance',
        eventDate: new Date('2025-04-20'),
        status: 'scheduled'
      });

      await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Event 3',
        type: 'exhibition',
        eventDate: new Date('2025-05-10'),
        status: 'scheduled'
      });
    });

    it('should find events within date range', async () => {
      const startDate = new Date('2025-03-01');
      const endDate = new Date('2025-04-30');

      const events = await ecaEventRepository.findByDateRange(
        startDate,
        endDate
      );

      expect(events).toHaveLength(2);
      expect(events[0].name).toBe('Event 1');
      expect(events[1].name).toBe('Event 2');
    });

    it('should filter by ECA ID within date range', async () => {
      const startDate = new Date('2025-03-01');
      const endDate = new Date('2025-05-31');

      const events = await ecaEventRepository.findByDateRange(
        startDate,
        endDate,
        testEcaId
      );

      expect(events).toHaveLength(3);
      expect(events.every(e => e.ecaId === testEcaId)).toBe(true);
    });
  });

  describe('findUpcoming', () => {
    beforeEach(async () => {
      // Past event
      await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Past Event',
        type: 'competition',
        eventDate: new Date('2024-01-15'),
        status: 'completed'
      });

      // Future events
      const futureDate1 = new Date();
      futureDate1.setDate(futureDate1.getDate() + 5);

      const futureDate2 = new Date();
      futureDate2.setDate(futureDate2.getDate() + 10);

      await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Upcoming Event 1',
        type: 'competition',
        eventDate: futureDate1,
        status: 'scheduled'
      });

      await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Upcoming Event 2',
        type: 'performance',
        eventDate: futureDate2,
        status: 'scheduled'
      });
    });

    it('should find upcoming events', async () => {
      const events = await ecaEventRepository.findUpcoming(10);

      expect(events.length).toBeGreaterThan(0);
      expect(events.every(e => e.status !== 'completed')).toBe(true);
    });

    it('should limit number of results', async () => {
      const events = await ecaEventRepository.findUpcoming(1);

      expect(events).toHaveLength(1);
    });
  });

  describe('addParticipant', () => {
    beforeEach(async () => {
      const event = await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Test Event',
        type: 'competition',
        eventDate: new Date('2025-03-15'),
        status: 'scheduled',
        participants: []
      });
      testEventId = event.eventId;
    });

    it('should add participant to event', async () => {
      const event = await ecaEventRepository.addParticipant(testEventId, 1);

      expect(event).toBeDefined();
      expect(event?.participants).toContain(1);
      expect(event?.getParticipantCount()).toBe(1);
    });

    it('should not add duplicate participant', async () => {
      await ecaEventRepository.addParticipant(testEventId, 1);
      const event = await ecaEventRepository.addParticipant(testEventId, 1);

      expect(event?.participants).toEqual([1]);
      expect(event?.getParticipantCount()).toBe(1);
    });

    it('should add multiple participants', async () => {
      await ecaEventRepository.addParticipant(testEventId, 1);
      await ecaEventRepository.addParticipant(testEventId, 2);
      const event = await ecaEventRepository.addParticipant(testEventId, 3);

      expect(event?.participants).toEqual([1, 2, 3]);
      expect(event?.getParticipantCount()).toBe(3);
    });
  });

  describe('removeParticipant', () => {
    beforeEach(async () => {
      const event = await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Test Event',
        type: 'competition',
        eventDate: new Date('2025-03-15'),
        status: 'scheduled',
        participants: [1, 2, 3]
      });
      testEventId = event.eventId;
    });

    it('should remove participant from event', async () => {
      const event = await ecaEventRepository.removeParticipant(testEventId, 2);

      expect(event).toBeDefined();
      expect(event?.participants).toEqual([1, 3]);
      expect(event?.getParticipantCount()).toBe(2);
    });

    it('should handle removing non-existent participant', async () => {
      const event = await ecaEventRepository.removeParticipant(testEventId, 99);

      expect(event?.participants).toEqual([1, 2, 3]);
      expect(event?.getParticipantCount()).toBe(3);
    });
  });

  describe('addPhoto', () => {
    beforeEach(async () => {
      const event = await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Test Event',
        type: 'competition',
        eventDate: new Date('2025-03-15'),
        status: 'scheduled',
        photos: []
      });
      testEventId = event.eventId;
    });

    it('should add photo to event', async () => {
      const photoUrl = '/uploads/events/photo1.jpg';
      const event = await ecaEventRepository.addPhoto(testEventId, photoUrl);

      expect(event).toBeDefined();
      expect(event?.photos).toContain(photoUrl);
      expect(event?.photos?.length).toBe(1);
    });

    it('should add multiple photos', async () => {
      await ecaEventRepository.addPhoto(testEventId, '/uploads/photo1.jpg');
      await ecaEventRepository.addPhoto(testEventId, '/uploads/photo2.jpg');
      const event = await ecaEventRepository.addPhoto(
        testEventId,
        '/uploads/photo3.jpg'
      );

      expect(event?.photos?.length).toBe(3);
    });
  });

  describe('addVideo', () => {
    beforeEach(async () => {
      const event = await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Test Event',
        type: 'competition',
        eventDate: new Date('2025-03-15'),
        status: 'scheduled',
        videos: []
      });
      testEventId = event.eventId;
    });

    it('should add video to event', async () => {
      const videoUrl = '/uploads/events/video1.mp4';
      const event = await ecaEventRepository.addVideo(testEventId, videoUrl);

      expect(event).toBeDefined();
      expect(event?.videos).toContain(videoUrl);
      expect(event?.videos?.length).toBe(1);
    });

    it('should add multiple videos', async () => {
      await ecaEventRepository.addVideo(testEventId, '/uploads/video1.mp4');
      await ecaEventRepository.addVideo(testEventId, '/uploads/video2.mp4');
      const event = await ecaEventRepository.addVideo(
        testEventId,
        '/uploads/video3.mp4'
      );

      expect(event?.videos?.length).toBe(3);
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      const event = await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Test Event',
        type: 'competition',
        eventDate: new Date('2025-03-15'),
        venue: 'Old Venue',
        status: 'scheduled'
      });
      testEventId = event.eventId;
    });

    it('should update event fields', async () => {
      const updateData = {
        name: 'Updated Event Name',
        venue: 'New Venue',
        description: 'Updated description'
      };

      const event = await ecaEventRepository.update(testEventId, updateData);

      expect(event).toBeDefined();
      expect(event?.name).toBe(updateData.name);
      expect(event?.venue).toBe(updateData.venue);
      expect(event?.description).toBe(updateData.description);
    });

    it('should update event status', async () => {
      const event = await ecaEventRepository.update(testEventId, {
        status: 'completed'
      });

      expect(event?.status).toBe('completed');
    });

    it('should return null for non-existent event', async () => {
      const event = await ecaEventRepository.update(99999, {
        name: 'Updated'
      });

      expect(event).toBeNull();
    });
  });

  describe('findWithPagination', () => {
    beforeEach(async () => {
      // Create 25 events
      for (let i = 1; i <= 25; i++) {
        await ecaEventRepository.create({
          ecaId: testEcaId,
          name: `Event ${i}`,
          type: 'competition',
          eventDate: new Date(`2025-03-${i.toString().padStart(2, '0')}`),
          status: i % 2 === 0 ? 'completed' : 'scheduled'
        });
      }
    });

    it('should return paginated events', async () => {
      const result = await ecaEventRepository.findWithPagination({}, 1, 10);

      expect(result.events).toHaveLength(10);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.totalPages).toBe(3);
    });

    it('should return second page', async () => {
      const result = await ecaEventRepository.findWithPagination({}, 2, 10);

      expect(result.events).toHaveLength(10);
      expect(result.pagination.page).toBe(2);
    });

    it('should filter by status', async () => {
      const result = await ecaEventRepository.findWithPagination(
        { status: 'scheduled' },
        1,
        20
      );

      expect(result.events.every(e => e.status === 'scheduled')).toBe(true);
    });

    it('should enforce maximum limit', async () => {
      const result = await ecaEventRepository.findWithPagination({}, 1, 200);

      expect(result.pagination.limit).toBe(100);
    });
  });

  describe('getEventStats', () => {
    beforeEach(async () => {
      await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Event 1',
        type: 'competition',
        eventDate: new Date('2025-03-15'),
        status: 'scheduled',
        participants: [1, 2, 3]
      });

      await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Event 2',
        type: 'performance',
        eventDate: new Date('2025-04-20'),
        status: 'completed',
        participants: [1, 2, 3, 4, 5]
      });

      await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Event 3',
        type: 'exhibition',
        eventDate: new Date('2025-05-10'),
        status: 'cancelled',
        participants: []
      });
    });

    it('should calculate event statistics', async () => {
      const stats = await ecaEventRepository.getEventStats(testEcaId);

      expect(stats.total).toBe(3);
      expect(stats.scheduled).toBe(1);
      expect(stats.completed).toBe(1);
      expect(stats.cancelled).toBe(1);
      expect(stats.totalParticipants).toBe(8);
      expect(stats.averageParticipants).toBeCloseTo(2.67, 1);
    });

    it('should return zero stats for ECA with no events', async () => {
      const stats = await ecaEventRepository.getEventStats(99999);

      expect(stats.total).toBe(0);
      expect(stats.scheduled).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.cancelled).toBe(0);
      expect(stats.totalParticipants).toBe(0);
      expect(stats.averageParticipants).toBe(0);
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      const event = await ecaEventRepository.create({
        ecaId: testEcaId,
        name: 'Test Event',
        type: 'competition',
        eventDate: new Date('2025-03-15'),
        status: 'scheduled'
      });
      testEventId = event.eventId;
    });

    it('should delete event', async () => {
      const deleted = await ecaEventRepository.delete(testEventId);

      expect(deleted).toBe(true);

      const event = await ecaEventRepository.findById(testEventId);
      expect(event).toBeNull();
    });

    it('should return false for non-existent event', async () => {
      const deleted = await ecaEventRepository.delete(99999);

      expect(deleted).toBe(false);
    });
  });
});
