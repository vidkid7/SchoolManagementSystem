import express from 'express';
import request from 'supertest';
import { errorHandler } from '@middleware/errorHandler';
import { notificationService } from '../notification.service';

jest.mock('@middleware/auth', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { userId: 22, username: 'qa-user', role: 'Student' } as express.Request['user'];
    next();
  },
}));

jest.mock('../notification.service', () => ({
  notificationService: {
    getUserNotifications: jest.fn(),
    getUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    deleteNotification: jest.fn(),
  },
}));

import notificationRoutes from '../notification.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/notifications', notificationRoutes);
app.use(errorHandler);

const mockedService = jest.mocked(notificationService);

describe('notification routes validation and ownership scope', () => {
  beforeEach(() => jest.clearAllMocks());

  it('passes validated list filters and pagination to the current user service call', async () => {
    mockedService.getUserNotifications.mockResolvedValue({ notifications: [], total: 0, page: 2, limit: 50, totalPages: 0 });
    const response = await request(app).get(
      '/api/v1/notifications?category=exam&type=warning&isRead=false&startDate=2026-01-01&endDate=2026-12-31&page=2&limit=50'
    );

    expect(response.status).toBe(200);
    expect(mockedService.getUserNotifications).toHaveBeenCalledWith(22, {
      category: 'exam',
      type: 'warning',
      isRead: false,
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T00:00:00.000Z'),
    }, { page: 2, limit: 50 });
  });

  it.each([
    ['category', '?category=not-a-category'],
    ['type', '?type=urgent'],
    ['read state', '?isRead=maybe'],
    ['page', '?page=0'],
    ['page number', '?page=not-a-number'],
    ['page size', '?limit=101'],
    ['date', '?startDate=not-a-date'],
    ['reversed date range', '?startDate=2026-12-31&endDate=2026-01-01'],
  ])('rejects an invalid %s before calling the service', async (_label, query) => {
    const response = await request(app).get(`/api/v1/notifications${query}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
    expect(mockedService.getUserNotifications).not.toHaveBeenCalled();
  });

  it('validates category filters on unread-count and mark-all-as-read', async () => {
    mockedService.getUnreadCount.mockResolvedValue(3);
    mockedService.markAllAsRead.mockResolvedValue(3);

    const count = await request(app).get('/api/v1/notifications/unread-count?category=fee');
    const markAll = await request(app).put('/api/v1/notifications/read-all?category=fee');
    const invalidCount = await request(app).get('/api/v1/notifications/unread-count?category=unknown');

    expect(count.status).toBe(200);
    expect(mockedService.getUnreadCount).toHaveBeenCalledWith(22, 'fee');
    expect(markAll.status).toBe(200);
    expect(mockedService.markAllAsRead).toHaveBeenCalledWith(22, 'fee');
    expect(invalidCount.status).toBe(400);
    expect(mockedService.getUnreadCount).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['read', 'put', '/api/v1/notifications/not-an-id/read'],
    ['delete', 'delete', '/api/v1/notifications/0'],
  ])('rejects an invalid notification ID before the %s operation', async (_label, method, path) => {
    const response = await request(app)[method as 'put' | 'delete'](path);

    expect(response.status).toBe(400);
    expect(mockedService.markAsRead).not.toHaveBeenCalled();
    expect(mockedService.deleteNotification).not.toHaveBeenCalled();
  });

  it('uses the authenticated user ID for read and delete operations', async () => {
    mockedService.markAsRead.mockResolvedValue({ notificationId: 7, userId: 22, isRead: true } as never);
    mockedService.deleteNotification.mockResolvedValue(true);

    const read = await request(app).put('/api/v1/notifications/7/read');
    const deleted = await request(app).delete('/api/v1/notifications/7');

    expect(read.status).toBe(200);
    expect(mockedService.markAsRead).toHaveBeenCalledWith(7, 22);
    expect(deleted.status).toBe(200);
    expect(mockedService.deleteNotification).toHaveBeenCalledWith(7, 22);
  });
});
