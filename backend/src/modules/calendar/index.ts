/**
 * Calendar Module
 * 
 * Calendar and event management for the School Management System
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

export { default as eventRoutes } from './event.routes';
export { default as eventRepository } from './event.repository';
export { default as eventService } from './event.service';
export { default as eventController } from './event.controller';
export * from './event.validation';
export { EventInput } from './event.service';
export { EventFilters, EventPaginationOptions, PaginatedEvents } from './event.repository';
export { default as Event, initEvent } from '@models/Event.model';