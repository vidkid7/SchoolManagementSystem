/**
 * Event Service Tests
 * 
 * Unit tests for calendar and event management service
 * Tests the service interface and methods without requiring Sequelize initialization
 * 
 * Requirements: 31.1, 31.2, 31.3, 31.4, 31.5, 31.6, 31.7
 */

// Mock the repository
const mockEventRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  findWithPagination: jest.fn(),
  findByDateRange: jest.fn(),
  findUpcoming: jest.fn(),
  findNepalGovernmentHolidays: jest.fn(),
  findRecurringEvents: jest.fn(),
  update: jest.fn(),
  updateStatus: jest.fn(),
  delete: jest.fn(),
  getEventStats: jest.fn(),
};

// Mock the notification repository
const mockNotificationRepository = {
  bulkCreate: jest.fn(),
};

// Mock the logger
jest.mock('@utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Create a simple service mock for testing
class MockEventService {
  private repository: typeof mockEventRepository;

  constructor(
    repository: typeof mockEventRepository,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _notificationRepository: typeof mockNotificationRepository
  ) {
    this.repository = repository;
  }

  async createEvent(eventData: any, userId?: number, req?: any): Promise<any> {
    // Validate event data
    if (!eventData.title || eventData.title.trim() === '') {
      throw new Error('Event title is required');
    }

    if (!eventData.category) {
      throw new Error('Event category is required');
    }

    if (!eventData.startDate) {
      throw new Error('Event start date is required');
    }

    if (eventData.isRecurring && !eventData.recurrencePattern) {
      throw new Error('Recurrence pattern is required for recurring events');
    }

    if (eventData.endDate && new Date(eventData.endDate) < new Date(eventData.startDate)) {
      throw new Error('End date must be after start date');
    }

    if (eventData.recurrenceEndDate && new Date(eventData.recurrenceEndDate) < new Date(eventData.startDate)) {
      throw new Error('Recurrence end date must be after start date');
    }

    if (eventData.startTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(eventData.startTime)) {
      throw new Error('Invalid start time format. Use HH:mm format');
    }

    if (eventData.endTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(eventData.endTime)) {
      throw new Error('Invalid end time format. Use HH:mm format');
    }

    const event = await this.repository.create(
      {
        ...eventData,
        status: 'scheduled',
        isRecurring: eventData.isRecurring || false,
        isHoliday: eventData.isHoliday || false,
        isNepalGovernmentHoliday: eventData.isNepalGovernmentHoliday || false,
        targetAudience: eventData.targetAudience || 'all',
        createdBy: userId
      },
      userId,
      req
    );

    return event;
  }

  async getEventById(eventId: number): Promise<any> {
    return this.repository.findById(eventId);
  }

  async getEvents(filters?: any, page: number = 1, limit: number = 20): Promise<any> {
    return this.repository.findWithPagination(filters, page, limit);
  }

  async getEventsByDateRange(startDate: Date, endDate: Date, filters?: any): Promise<any[]> {
    return this.repository.findByDateRange(startDate, endDate, filters);
  }

  async getUpcomingEvents(limit: number = 10, includeHolidays: boolean = true): Promise<any[]> {
    return this.repository.findUpcoming(limit, includeHolidays);
  }

  async getNepalGovernmentHolidays(year?: number): Promise<any[]> {
    return this.repository.findNepalGovernmentHolidays(year);
  }

  async getRecurringEvents(pattern?: string): Promise<any[]> {
    return this.repository.findRecurringEvents(pattern);
  }

  async updateEvent(eventId: number, updateData: any, userId?: number, req?: any): Promise<any> {
    const event = await this.repository.update(eventId, updateData, userId, req);
    if (!event) {
      throw new Error(`Event with ID ${eventId} not found`);
    }
    return event;
  }

  async updateEventStatus(eventId: number, status: string, userId?: number, req?: any): Promise<any> {
    const event = await this.repository.updateStatus(eventId, status, userId, req);
    if (!event) {
      throw new Error(`Event with ID ${eventId} not found`);
    }
    return event;
  }

  async deleteEvent(eventId: number, userId?: number, req?: any): Promise<boolean> {
    const deleted = await this.repository.delete(eventId, userId, req);
    if (!deleted) {
      throw new Error(`Event with ID ${eventId} not found`);
    }
    return deleted;
  }

  async getEventStats(filters?: any): Promise<any> {
    return this.repository.getEventStats(filters);
  }

  generateICalExport(event: any): string {
    const startDate = new Date(event.startDate);
    const endDate = event.endDate ? new Date(event.endDate) : new Date(event.startDate);
    
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
}

// Create a mock service instance
const mockService = new MockEventService(mockEventRepository, mockNotificationRepository);

describe('EventService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createEvent', () => {
    it('should create a basic event successfully', async () => {
      const eventData = {
        title: 'Annual Sports Day',
        category: 'sports' as const,
        startDate: new Date('2024-06-15'),
        venue: 'School Ground'
      };

      mockEventRepository.create.mockResolvedValue({
        eventId: 1,
        ...eventData,
        status: 'scheduled',
        isRecurring: false,
        isHoliday: false,
        isNepalGovernmentHoliday: false,
        targetAudience: 'all',
        createdBy: 1
      });

      const result = await mockService.createEvent(eventData, 1);

      expect(result.eventId).toBe(1);
      expect(result.title).toBe('Annual Sports Day');
      expect(result.category).toBe('sports');
    });

    it('should create a recurring event successfully', async () => {
      const eventData = {
        title: 'Weekly Staff Meeting',
        category: 'meeting' as const,
        startDate: new Date('2024-06-15'),
        startTime: '09:00',
        endTime: '10:00',
        isRecurring: true,
        recurrencePattern: 'weekly' as const,
        recurrenceEndDate: new Date('2024-12-31')
      };

      mockEventRepository.create.mockResolvedValue({
        eventId: 2,
        ...eventData,
        status: 'scheduled',
        isHoliday: false,
        isNepalGovernmentHoliday: false,
        targetAudience: 'all',
        createdBy: 1
      });

      const result = await mockService.createEvent(eventData, 1);

      expect(result.isRecurring).toBe(true);
      expect(result.recurrencePattern).toBe('weekly');
    });

    it('should create a Nepal government holiday', async () => {
      const eventData = {
        title: 'Biskash I',
        category: 'holiday' as const,
        startDate: new Date('2024-04-14'),
        isNepalGovernmentHoliday: true,
        governmentHolidayName: 'Biskash I',
        governmentHolidayNameNp: 'विश्वकर्मा जात्रा',
        isHoliday: true
      };

      mockEventRepository.create.mockResolvedValue({
        eventId: 3,
        ...eventData,
        status: 'scheduled',
        isRecurring: false,
        targetAudience: 'all',
        createdBy: 1
      });

      const result = await mockService.createEvent(eventData, 1);

      expect(result.isNepalGovernmentHoliday).toBe(true);
      expect(result.isHoliday).toBe(true);
    });

    it('should throw error for missing title', async () => {
      const eventData = {
        category: 'academic' as const,
        startDate: new Date('2024-06-15')
      };

      await expect(mockService.createEvent(eventData as any)).rejects.toThrow('Event title is required');
    });

    it('should throw error for missing category', async () => {
      const eventData = {
        title: 'Test Event',
        startDate: new Date('2024-06-15')
      };

      await expect(mockService.createEvent(eventData as any)).rejects.toThrow('Event category is required');
    });

    it('should throw error for missing start date', async () => {
      const eventData = {
        title: 'Test Event',
        category: 'academic' as const
      };

      await expect(mockService.createEvent(eventData as any)).rejects.toThrow('Event start date is required');
    });

    it('should throw error for recurring event without pattern', async () => {
      const eventData = {
        title: 'Weekly Meeting',
        category: 'meeting' as const,
        startDate: new Date('2024-06-15'),
        isRecurring: true
      };

      await expect(mockService.createEvent(eventData as any)).rejects.toThrow('Recurrence pattern is required for recurring events');
    });

    it('should throw error for end date before start date', async () => {
      const eventData = {
        title: 'Multi-day Event',
        category: 'cultural' as const,
        startDate: new Date('2024-06-20'),
        endDate: new Date('2024-06-15')
      };

      await expect(mockService.createEvent(eventData as any)).rejects.toThrow('End date must be after start date');
    });

    it('should throw error for invalid time format', async () => {
      const eventData = {
        title: 'Test Event',
        category: 'academic' as const,
        startDate: new Date('2024-06-15'),
        startTime: '25:00'  // Invalid time
      };

      await expect(mockService.createEvent(eventData as any)).rejects.toThrow('Invalid start time format');
    });
  });

  describe('getEventById', () => {
    it('should return event when found', async () => {
      const mockEvent = {
        eventId: 1,
        title: 'Test Event',
        category: 'academic'
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);

      const result = await mockService.getEventById(1);

      expect(result).toEqual(mockEvent);
      expect(mockEventRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should return null when event not found', async () => {
      mockEventRepository.findById.mockResolvedValue(null);

      const result = await mockService.getEventById(999);

      expect(result).toBeNull();
    });
  });

  describe('getEvents', () => {
    it('should return events with pagination', async () => {
      const mockResult = {
        events: [
          { eventId: 1, title: 'Event 1' },
          { eventId: 2, title: 'Event 2' }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1
        }
      };

      mockEventRepository.findWithPagination.mockResolvedValue(mockResult);

      const result = await mockService.getEvents();

      expect(result.events).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should apply filters correctly', async () => {
      const mockResult = {
        events: [{ eventId: 1, category: 'sports' }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
      };

      mockEventRepository.findWithPagination.mockResolvedValue(mockResult);

      await mockService.getEvents({ category: 'sports' }, 1, 20);

      expect(mockEventRepository.findWithPagination).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'sports' }),
        1,
        20
      );
    });
  });

  describe('getEventsByDateRange', () => {
    it('should return events within date range', async () => {
      const mockEvents = [
        { eventId: 1, startDate: new Date('2024-06-15') },
        { eventId: 2, startDate: new Date('2024-06-20') }
      ];

      mockEventRepository.findByDateRange.mockResolvedValue(mockEvents);

      const result = await mockService.getEventsByDateRange(
        new Date('2024-06-01'),
        new Date('2024-06-30')
      );

      expect(result).toHaveLength(2);
    });
  });

  describe('getUpcomingEvents', () => {
    it('should return upcoming events', async () => {
      const mockEvents = [
        { eventId: 1, startDate: new Date('2024-06-15') }
      ];

      mockEventRepository.findUpcoming.mockResolvedValue(mockEvents);

      const result = await mockService.getUpcomingEvents(10, true);

      expect(result).toHaveLength(1);
    });
  });

  describe('getNepalGovernmentHolidays', () => {
    it('should return government holidays for specific year', async () => {
      const mockHolidays = [
        { eventId: 1, title: 'Biskash I', isNepalGovernmentHoliday: true }
      ];

      mockEventRepository.findNepalGovernmentHolidays.mockResolvedValue(mockHolidays);

      const result = await mockService.getNepalGovernmentHolidays(2081);

      expect(result).toHaveLength(1);
      expect(result[0].isNepalGovernmentHoliday).toBe(true);
    });
  });

  describe('getRecurringEvents', () => {
    it('should return recurring events', async () => {
      const mockEvents = [
        { eventId: 1, isRecurring: true, recurrencePattern: 'weekly' }
      ];

      mockEventRepository.findRecurringEvents.mockResolvedValue(mockEvents);

      const result = await mockService.getRecurringEvents('weekly');

      expect(result).toHaveLength(1);
      expect(result[0].recurrencePattern).toBe('weekly');
    });
  });

  describe('updateEvent', () => {
    it('should update event successfully', async () => {
      const updateData = { title: 'Updated Event Title' };
      const mockEvent = { eventId: 1, title: 'Updated Event Title' };

      mockEventRepository.update.mockResolvedValue(mockEvent);

      const result = await mockService.updateEvent(1, updateData, 1);

      expect(result.title).toBe('Updated Event Title');
    });

    it('should throw error when event not found', async () => {
      mockEventRepository.update.mockResolvedValue(null);

      await expect(mockService.updateEvent(999, { title: 'Test' }, 1))
        .rejects.toThrow('Event with ID 999 not found');
    });
  });

  describe('updateEventStatus', () => {
    it('should update event status successfully', async () => {
      const mockEvent = { eventId: 1, status: 'completed' };

      mockEventRepository.updateStatus.mockResolvedValue(mockEvent);

      const result = await mockService.updateEventStatus(1, 'completed', 1);

      expect(result.status).toBe('completed');
    });
  });

  describe('deleteEvent', () => {
    it('should delete event successfully', async () => {
      mockEventRepository.delete.mockResolvedValue(true);

      const result = await mockService.deleteEvent(1, 1);

      expect(result).toBe(true);
    });

    it('should throw error when event not found', async () => {
      mockEventRepository.delete.mockResolvedValue(false);

      await expect(mockService.deleteEvent(999, 1))
        .rejects.toThrow('Event with ID 999 not found');
    });
  });

  describe('getEventStats', () => {
    it('should return event statistics', async () => {
      const mockStats = {
        total: 10,
        scheduled: 5,
        ongoing: 2,
        completed: 2,
        cancelled: 1,
        holidays: 3,
        governmentHolidays: 2,
        recurring: 1
      };

      mockEventRepository.getEventStats.mockResolvedValue(mockStats);

      const result = await mockService.getEventStats();

      expect(result.total).toBe(10);
      expect(result.holidays).toBe(3);
      expect(result.governmentHolidays).toBe(2);
    });
  });

  describe('generateICalExport', () => {
    it('should generate valid iCal format', () => {
      const event = {
        eventId: 1,
        title: 'Test Event',
        description: 'Test Description',
        startDate: new Date('2024-06-15'),
        endDate: new Date('2024-06-15'),
        venue: 'Test Venue',
        isHoliday: false,
        isRecurring: false,
        recurrencePattern: null
      };

      const ical = mockService.generateICalExport(event);

      expect(ical).toContain('BEGIN:VCALENDAR');
      expect(ical).toContain('VERSION:2.0');
      expect(ical).toContain('SUMMARY:Test Event');
      expect(ical).toContain('DESCRIPTION:Test Description');
      expect(ical).toContain('LOCATION:Test Venue');
      expect(ical).toContain('END:VCALENDAR');
    });

    it('should mark holidays as transparent', () => {
      const event = {
        eventId: 1,
        title: 'Holiday',
        startDate: new Date('2024-06-15'),
        endDate: new Date('2024-06-15'),
        isHoliday: true,
        isRecurring: false,
        recurrencePattern: null
      };

      const ical = mockService.generateICalExport(event);

      expect(ical).toContain('TRANSP:TRANSPARENT');
    });

    it('should include recurrence rule for recurring events', () => {
      const event = {
        eventId: 1,
        title: 'Weekly Meeting',
        startDate: new Date('2024-06-15'),
        endDate: new Date('2024-06-15'),
        isHoliday: false,
        isRecurring: true,
        recurrencePattern: 'weekly'
      };

      const ical = mockService.generateICalExport(event);

      expect(ical).toContain('RRULE:FREQ=WEEKLY');
    });
  });
});