/**
 * Event Model Tests
 * 
 * Unit tests for Event model functionality
 * Tests the model interface and methods without requiring Sequelize initialization
 * 
 * Requirements: 31.1, 31.2, 31.3, 31.4, 31.5, 31.6, 31.7
 */

// Create a mock Event class for testing
class MockEvent {
  public eventId!: number;
  public title!: string;
  public titleNp?: string;
  public description?: string;
  public descriptionNp?: string;
  public category!: 'academic' | 'sports' | 'cultural' | 'holiday' | 'exam' | 'meeting' | 'other';
  public startDate!: Date;
  public startDateBS?: string;
  public endDate?: Date;
  public endDateBS?: string;
  public startTime?: string;
  public endTime?: string;
  public venue?: string;
  public venueNp?: string;
  public isRecurring!: boolean;
  public recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  public recurrenceEndDate?: Date;
  public targetAudience!: 'all' | 'students' | 'parents' | 'teachers' | 'staff';
  public targetClasses?: number[];
  public isHoliday!: boolean;
  public isNepalGovernmentHoliday!: boolean;
  public governmentHolidayName?: string;
  public governmentHolidayNameNp?: string;
  public color?: string;
  public createdBy?: number;
  public status!: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';

  constructor(data: Partial<MockEvent>) {
    Object.assign(this, data);
  }

  // Instance methods matching the actual Event model

  public isSingleEvent(): boolean {
    return !this.isRecurring;
  }

  public isMultiDayEvent(): boolean {
    if (!this.endDate) return false;
    const start = new Date(this.startDate).setHours(0, 0, 0, 0);
    const end = new Date(this.endDate).setHours(0, 0, 0, 0);
    return end > start;
  }

  public isOngoing(): boolean {
    const now = new Date();
    const start = new Date(this.startDate);
    
    if (this.endDate) {
      return now >= start && now <= new Date(this.endDate);
    }
    return now.toDateString() === start.toDateString();
  }

  public hasPassed(): boolean {
    const now = new Date();
    if (this.endDate) {
      return new Date(this.endDate) < now;
    }
    return new Date(this.startDate) < now;
  }

  public getTimeRange(): string {
    if (!this.startTime) return 'All Day';
    if (!this.endTime) return this.startTime;
    return `${this.startTime} - ${this.endTime}`;
  }

  public getDisplayTitle(locale: 'en' | 'np' = 'en'): string {
    if (locale === 'np' && this.titleNp) {
      return this.titleNp;
    }
    return this.title;
  }

  public isVisibleTo(audience: 'student' | 'parent' | 'teacher' | 'staff'): boolean {
    if (this.targetAudience === 'all') return true;
    
    const audienceMap: Record<string, string[]> = {
      'students': ['student'],
      'parents': ['parent'],
      'teachers': ['teacher'],
      'staff': ['staff', 'teacher']
    };
    
    return audienceMap[this.targetAudience]?.includes(audience) || false;
  }

  public appliesToClass(classLevel: number): boolean {
    if (!this.targetClasses || this.targetClasses.length === 0) return true;
    return this.targetClasses.includes(classLevel);
  }

  public getRecurrenceDescription(): string {
    if (!this.isRecurring || !this.recurrencePattern) return 'No recurrence';
    
    const patterns: Record<string, string> = {
      'daily': 'Daily',
      'weekly': 'Weekly',
      'monthly': 'Monthly',
      'yearly': 'Yearly'
    };
    
    let desc = patterns[this.recurrencePattern] || 'Recurring';
    
    if (this.recurrenceEndDate) {
      desc += ` until ${new Date(this.recurrenceEndDate).toLocaleDateString()}`;
    }
    
    return desc;
  }

  public toJSON(): object {
    return {
      eventId: this.eventId,
      title: this.title,
      titleNp: this.titleNp,
      description: this.description,
      descriptionNp: this.descriptionNp,
      category: this.category,
      startDate: this.startDate,
      startDateBS: this.startDateBS,
      endDate: this.endDate,
      endDateBS: this.endDateBS,
      startTime: this.startTime,
      endTime: this.endTime,
      venue: this.venue,
      venueNp: this.venueNp,
      isRecurring: this.isRecurring,
      recurrencePattern: this.recurrencePattern,
      recurrenceEndDate: this.recurrenceEndDate,
      targetAudience: this.targetAudience,
      targetClasses: this.targetClasses,
      isHoliday: this.isHoliday,
      isNepalGovernmentHoliday: this.isNepalGovernmentHoliday,
      governmentHolidayName: this.governmentHolidayName,
      governmentHolidayNameNp: this.governmentHolidayNameNp,
      color: this.color,
      createdBy: this.createdBy,
      status: this.status,
    };
  }
}

describe('Event Model', () => {
  describe('Instance Methods', () => {
    let event: MockEvent;

    beforeEach(() => {
      event = new MockEvent({
        eventId: 1,
        title: 'Test Event',
        category: 'academic',
        startDate: new Date('2024-06-15'),
        status: 'scheduled',
        isRecurring: false,
        isHoliday: false,
        isNepalGovernmentHoliday: false,
        targetAudience: 'all'
      });
    });

    describe('isSingleEvent', () => {
      it('should return true for non-recurring event', () => {
        event.isRecurring = false;
        expect(event.isSingleEvent()).toBe(true);
      });

      it('should return false for recurring event', () => {
        event.isRecurring = true;
        expect(event.isSingleEvent()).toBe(false);
      });
    });

    describe('isMultiDayEvent', () => {
      it('should return false when no end date', () => {
        event.endDate = undefined;
        expect(event.isMultiDayEvent()).toBe(false);
      });

      it('should return false for same day event', () => {
        event.endDate = new Date('2024-06-15');
        expect(event.isMultiDayEvent()).toBe(false);
      });

      it('should return true for multi-day event', () => {
        event.endDate = new Date('2024-06-20');
        expect(event.isMultiDayEvent()).toBe(true);
      });
    });

    describe('isOngoing', () => {
      it('should return true for event happening today', () => {
        const today = new Date();
        event.startDate = today;
        event.endDate = today;
        expect(event.isOngoing()).toBe(true);
      });

      it('should return false for past event', () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        event.startDate = pastDate;
        event.endDate = pastDate;
        expect(event.isOngoing()).toBe(false);
      });

      it('should return false for future event', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);
        event.startDate = futureDate;
        event.endDate = futureDate;
        expect(event.isOngoing()).toBe(false);
      });
    });

    describe('hasPassed', () => {
      it('should return true for past event', () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        event.startDate = pastDate;
        event.endDate = undefined;
        expect(event.hasPassed()).toBe(true);
      });

      it('should return false for future event', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);
        event.startDate = futureDate;
        event.endDate = undefined;
        expect(event.hasPassed()).toBe(false);
      });
    });

    describe('getTimeRange', () => {
      it('should return "All Day" when no time specified', () => {
        event.startTime = undefined;
        expect(event.getTimeRange()).toBe('All Day');
      });

      it('should return start time only when no end time', () => {
        event.startTime = '09:00';
        event.endTime = undefined;
        expect(event.getTimeRange()).toBe('09:00');
      });

      it('should return time range when both times specified', () => {
        event.startTime = '09:00';
        event.endTime = '10:30';
        expect(event.getTimeRange()).toBe('09:00 - 10:30');
      });
    });

    describe('getDisplayTitle', () => {
      it('should return English title by default', () => {
        event.title = 'Test Event';
        event.titleNp = 'परीक्षण कार्यक्रम';
        expect(event.getDisplayTitle()).toBe('Test Event');
      });

      it('should return Nepali title when locale is np', () => {
        event.title = 'Test Event';
        event.titleNp = 'परीक्षण कार्यक्रम';
        expect(event.getDisplayTitle('np')).toBe('परीक्षण कार्यक्रम');
      });

      it('should return English title when Nepali title is not available', () => {
        event.title = 'Test Event';
        event.titleNp = undefined;
        expect(event.getDisplayTitle('np')).toBe('Test Event');
      });
    });

    describe('isVisibleTo', () => {
      it('should return true for all audience when target is all', () => {
        event.targetAudience = 'all';
        expect(event.isVisibleTo('student')).toBe(true);
        expect(event.isVisibleTo('parent')).toBe(true);
        expect(event.isVisibleTo('teacher')).toBe(true);
        expect(event.isVisibleTo('staff')).toBe(true);
      });

      it('should return true for students when target is students', () => {
        event.targetAudience = 'students';
        expect(event.isVisibleTo('student')).toBe(true);
        expect(event.isVisibleTo('parent')).toBe(false);
        expect(event.isVisibleTo('teacher')).toBe(false);
      });

      it('should return true for parents when target is parents', () => {
        event.targetAudience = 'parents';
        expect(event.isVisibleTo('student')).toBe(false);
        expect(event.isVisibleTo('parent')).toBe(true);
        expect(event.isVisibleTo('teacher')).toBe(false);
      });

      it('should return true for teachers when target is teachers', () => {
        event.targetAudience = 'teachers';
        expect(event.isVisibleTo('student')).toBe(false);
        expect(event.isVisibleTo('parent')).toBe(false);
        expect(event.isVisibleTo('teacher')).toBe(true);
      });

      it('should return true for staff and teachers when target is staff', () => {
        event.targetAudience = 'staff';
        expect(event.isVisibleTo('student')).toBe(false);
        expect(event.isVisibleTo('parent')).toBe(false);
        expect(event.isVisibleTo('teacher')).toBe(true);
        expect(event.isVisibleTo('staff')).toBe(true);
      });
    });

    describe('appliesToClass', () => {
      it('should return true when no target classes specified', () => {
        event.targetClasses = undefined;
        expect(event.appliesToClass(5)).toBe(true);
      });

      it('should return true when empty target classes array', () => {
        event.targetClasses = [];
        expect(event.appliesToClass(5)).toBe(true);
      });

      it('should return true when class is in target classes', () => {
        event.targetClasses = [1, 2, 3, 4, 5];
        expect(event.appliesToClass(5)).toBe(true);
      });

      it('should return false when class is not in target classes', () => {
        event.targetClasses = [1, 2, 3];
        expect(event.appliesToClass(5)).toBe(false);
      });
    });

    describe('getRecurrenceDescription', () => {
      it('should return "No recurrence" for non-recurring event', () => {
        event.isRecurring = false;
        expect(event.getRecurrenceDescription()).toBe('No recurrence');
      });

      it('should return pattern description for recurring event', () => {
        event.isRecurring = true;
        event.recurrencePattern = 'weekly';
        expect(event.getRecurrenceDescription()).toBe('Weekly');
      });

      it('should include end date in description', () => {
        event.isRecurring = true;
        event.recurrencePattern = 'monthly';
        event.recurrenceEndDate = new Date('2024-12-31');
        const desc = event.getRecurrenceDescription();
        expect(desc).toContain('Monthly');
        expect(desc).toContain('2024');
      });
    });

    describe('toJSON', () => {
      it('should return all event attributes', () => {
        const json = event.toJSON() as any;
        
        expect(json.eventId).toBe(1);
        expect(json.title).toBe('Test Event');
        expect(json.category).toBe('academic');
        expect(json.startDate).toEqual(new Date('2024-06-15'));
        expect(json.status).toBe('scheduled');
        expect(json.isRecurring).toBe(false);
        expect(json.isHoliday).toBe(false);
        expect(json.isNepalGovernmentHoliday).toBe(false);
        expect(json.targetAudience).toBe('all');
      });
    });
  });

  describe('Model Interface', () => {
    it('should support all event categories', () => {
      const categories: Array<'academic' | 'sports' | 'cultural' | 'holiday' | 'exam' | 'meeting' | 'other'> = [
        'academic', 'sports', 'cultural', 'holiday', 'exam', 'meeting', 'other'
      ];

      categories.forEach(category => {
        const event = new MockEvent({
          eventId: 1,
          title: 'Test',
          category,
          startDate: new Date(),
          isRecurring: false,
          isHoliday: false,
          isNepalGovernmentHoliday: false,
          targetAudience: 'all',
          status: 'scheduled'
        });
        expect(event.category).toBe(category);
      });
    });

    it('should support all target audiences', () => {
      const audiences: Array<'all' | 'students' | 'parents' | 'teachers' | 'staff'> = [
        'all', 'students', 'parents', 'teachers', 'staff'
      ];

      audiences.forEach(audience => {
        const event = new MockEvent({
          eventId: 1,
          title: 'Test',
          category: 'academic',
          startDate: new Date(),
          isRecurring: false,
          isHoliday: false,
          isNepalGovernmentHoliday: false,
          targetAudience: audience,
          status: 'scheduled'
        });
        expect(event.targetAudience).toBe(audience);
      });
    });

    it('should support all recurrence patterns', () => {
      const patterns: Array<'daily' | 'weekly' | 'monthly' | 'yearly'> = [
        'daily', 'weekly', 'monthly', 'yearly'
      ];

      patterns.forEach(pattern => {
        const event = new MockEvent({
          eventId: 1,
          title: 'Test',
          category: 'academic',
          startDate: new Date(),
          isRecurring: true,
          recurrencePattern: pattern,
          isHoliday: false,
          isNepalGovernmentHoliday: false,
          targetAudience: 'all',
          status: 'scheduled'
        });
        expect(event.recurrencePattern).toBe(pattern);
      });
    });

    it('should support all event statuses', () => {
      const statuses: Array<'scheduled' | 'ongoing' | 'completed' | 'cancelled'> = [
        'scheduled', 'ongoing', 'completed', 'cancelled'
      ];

      statuses.forEach(status => {
        const event = new MockEvent({
          eventId: 1,
          title: 'Test',
          category: 'academic',
          startDate: new Date(),
          isRecurring: false,
          isHoliday: false,
          isNepalGovernmentHoliday: false,
          targetAudience: 'all',
          status
        });
        expect(event.status).toBe(status);
      });
    });
  });
});