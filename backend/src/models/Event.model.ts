/**
 * Event Model
 * 
 * Implements school event entity for calendar and event management
 * 
 * Features:
 * - Event details (title, description, date, time, location)
 * - Event categories (academic, sports, cultural, holiday)
 * - Recurring event support (weekly, monthly)
 * - BS and AD date support
 * - Target audience (all, students, parents, teachers, staff)
 * 
 * Requirements: 31.1, 31.2, 31.3, 31.4, 31.5, 31.6, 31.7
 */

import { DataTypes, Model, Optional } from 'sequelize';

export interface EventAttributes {
  eventId: number;
  title: string;
  titleNp?: string;
  description?: string;
  descriptionNp?: string;
  category: 'academic' | 'sports' | 'cultural' | 'holiday' | 'exam' | 'meeting' | 'other';
  startDate: Date;
  startDateBS?: string;
  endDate?: Date;
  endDateBS?: string;
  startTime?: string;        // HH:mm format
  endTime?: string;          // HH:mm format
  venue?: string;
  venueNp?: string;
  isRecurring: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceEndDate?: Date;
  targetAudience: 'all' | 'students' | 'parents' | 'teachers' | 'staff';
  targetClasses?: number[];  // Class levels (e.g., [1, 2, 3] for Classes 1-3)
  isHoliday: boolean;        // If true, marks as holiday
  isNepalGovernmentHoliday: boolean;  // If true, this is an official government holiday
  governmentHolidayName?: string;     // Official name of government holiday
  governmentHolidayNameNp?: string;   // Nepali name of government holiday
  color?: string;            // Calendar display color
  createdBy?: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EventCreationAttributes extends Optional<EventAttributes, 'eventId' | 'isRecurring' | 'isHoliday' | 'isNepalGovernmentHoliday' | 'status'> {}

export class Event
  extends Model<EventAttributes, EventCreationAttributes>
  implements EventAttributes
{
  declare eventId: number;
  declare title: string;
  declare titleNp?: string;
  declare description?: string;
  declare descriptionNp?: string;
  declare category: 'academic' | 'sports' | 'cultural' | 'holiday' | 'exam' | 'meeting' | 'other';
  declare startDate: Date;
  declare startDateBS?: string;
  declare endDate?: Date;
  declare endDateBS?: string;
  declare startTime?: string;
  declare endTime?: string;
  declare venue?: string;
  declare venueNp?: string;
  declare isRecurring: boolean;
  declare recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  declare recurrenceEndDate?: Date;
  declare targetAudience: 'all' | 'students' | 'parents' | 'teachers' | 'staff';
  declare targetClasses?: number[];
  declare isHoliday: boolean;
  declare isNepalGovernmentHoliday: boolean;
  declare governmentHolidayName?: string;
  declare governmentHolidayNameNp?: string;
  declare color?: string;
  declare createdBy?: number;
  declare status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Instance methods

  /**
   * Check if event is a single occurrence (not recurring)
   */
  public isSingleEvent(): boolean {
    return !this.isRecurring;
  }

  /**
   * Check if event spans multiple days
   */
  public isMultiDayEvent(): boolean {
    if (!this.endDate) return false;
    const start = new Date(this.startDate).setHours(0, 0, 0, 0);
    const end = new Date(this.endDate).setHours(0, 0, 0, 0);
    return end > start;
  }

  /**
   * Check if event is currently happening
   */
  public isOngoing(): boolean {
    const now = new Date();
    const start = new Date(this.startDate);
    
    if (this.endDate) {
      return now >= start && now <= new Date(this.endDate);
    }
    return now.toDateString() === start.toDateString();
  }

  /**
   * Check if event has passed
   */
  public hasPassed(): boolean {
    const now = new Date();
    if (this.endDate) {
      return new Date(this.endDate) < now;
    }
    return new Date(this.startDate) < now;
  }

  /**
   * Get formatted time range
   */
  public getTimeRange(): string {
    if (!this.startTime) return 'All Day';
    if (!this.endTime) return this.startTime;
    return `${this.startTime} - ${this.endTime}`;
  }

  /**
   * Get display title (prefer Nepali if available)
   */
  public getDisplayTitle(locale: 'en' | 'np' = 'en'): string {
    if (locale === 'np' && this.titleNp) {
      return this.titleNp;
    }
    return this.title;
  }

  /**
   * Check if event is visible to specific audience
   */
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

  /**
   * Check if event applies to specific class
   */
  public appliesToClass(classLevel: number): boolean {
    if (!this.targetClasses || this.targetClasses.length === 0) return true;
    return this.targetClasses.includes(classLevel);
  }

  /**
   * Get recurrence description
   */
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
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export function initEvent(sequelize: any): typeof Event {
  Event.init(
    {
      eventId: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      titleNp: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      descriptionNp: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      category: {
        type: DataTypes.ENUM('academic', 'sports', 'cultural', 'holiday', 'exam', 'meeting', 'other'),
        allowNull: false,
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      startDateBS: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: 'start_date_bs',
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      endDateBS: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: 'end_date_bs',
      },
      startTime: {
        type: DataTypes.STRING(5),  // HH:mm format
        allowNull: true,
      },
      endTime: {
        type: DataTypes.STRING(5),  // HH:mm format
        allowNull: true,
      },
      venue: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      venueNp: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      isRecurring: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      recurrencePattern: {
        type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'yearly'),
        allowNull: true,
      },
      recurrenceEndDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      targetAudience: {
        type: DataTypes.ENUM('all', 'students', 'parents', 'teachers', 'staff'),
        allowNull: false,
        defaultValue: 'all',
      },
      targetClasses: {
        type: DataTypes.JSON,  // Array of class levels
        allowNull: true,
      },
      isHoliday: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isNepalGovernmentHoliday: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      governmentHolidayName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      governmentHolidayNameNp: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      color: {
        type: DataTypes.STRING(7),  // Hex color code
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_id',
        },
      },
      status: {
        type: DataTypes.ENUM('scheduled', 'ongoing', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'scheduled',
      },
    },
    {
      sequelize,
      tableName: 'events',
      timestamps: true,
      indexes: [
        {
          name: 'idx_events_start_date',
          fields: ['start_date'],
        },
        {
          name: 'idx_events_category',
          fields: ['category'],
        },
        {
          name: 'idx_events_target_audience',
          fields: ['target_audience'],
        },
        {
          name: 'idx_events_status',
          fields: ['status'],
        },
        {
          name: 'idx_events_is_holiday',
          fields: ['is_holiday'],
        },
        {
          name: 'idx_events_is_nepal_government_holiday',
          fields: ['is_nepal_government_holiday'],
        },
        {
          name: 'idx_events_is_recurring',
          fields: ['is_recurring'],
        },
        {
          name: 'idx_events_created_by',
          fields: ['created_by'],
        },
      ],
    }
  );

  return Event;
}

export default Event;
