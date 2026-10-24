import { notificationRepository } from '../notification.repository';
import { socketService } from '@services/socket.service';
import { notificationService } from '../notification.service';

jest.mock('../notification.repository', () => ({
  notificationRepository: {
    create: jest.fn(),
    bulkCreate: jest.fn(),
    findByUser: jest.fn(),
    getUnreadCount: jest.fn(),
    findById: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    delete: jest.fn(),
    deleteExpired: jest.fn(),
    deleteOldNotifications: jest.fn(),
  },
}));

jest.mock('@services/socket.service', () => ({
  socketService: { emitNotification: jest.fn() },
}));

const mockedRepository = jest.mocked(notificationRepository);
const mockedSocket = jest.mocked(socketService);

describe('NotificationService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('persists a user notification before emitting its socket event', async () => {
    const record = { userId: 22, toJSON: jest.fn(() => ({ notificationId: 4, userId: 22 })) };
    mockedRepository.create.mockResolvedValue(record as never);

    const result = await notificationService.send(22, 'info', 'general', 'Title', 'Message');

    expect(mockedRepository.create).toHaveBeenCalledWith({
      userId: 22, type: 'info', category: 'general', title: 'Title', message: 'Message',
      data: undefined, expiresAt: undefined,
    });
    expect(mockedSocket.emitNotification).toHaveBeenCalledWith(22, { notificationId: 4, userId: 22 });
    expect(result).toBe(record);
  });

  it('bulk-creates once and emits each created notification to its owner', async () => {
    const first = { userId: 22, toJSON: () => ({ notificationId: 1 }) };
    const second = { userId: 23, toJSON: () => ({ notificationId: 2 }) };
    mockedRepository.bulkCreate.mockResolvedValue([first, second] as never);

    const result = await notificationService.sendToMany([22, 23], 'warning', 'attendance', 'Title', 'Message');

    expect(mockedRepository.bulkCreate).toHaveBeenCalledWith([
      { userId: 22, type: 'warning', category: 'attendance', title: 'Title', message: 'Message', data: undefined },
      { userId: 23, type: 'warning', category: 'attendance', title: 'Title', message: 'Message', data: undefined },
    ]);
    expect(mockedSocket.emitNotification).toHaveBeenNthCalledWith(1, 22, { notificationId: 1 });
    expect(mockedSocket.emitNotification).toHaveBeenNthCalledWith(2, 23, { notificationId: 2 });
    expect(result).toEqual([first, second]);
  });

  it('forces notification list queries to the authenticated user', async () => {
    const result = { notifications: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    mockedRepository.findByUser.mockResolvedValue(result);

    await expect(notificationService.getUserNotifications(22, { category: 'exam' }, { page: 2 })).resolves.toBe(result);
    expect(mockedRepository.findByUser).toHaveBeenCalledWith({ category: 'exam', userId: 22 }, { page: 2 });
  });

  it('checks notification ownership before marking a notification read', async () => {
    const record = { notificationId: 7, userId: 22 };
    const updated = { ...record, isRead: true };
    mockedRepository.findById.mockResolvedValue(record as never);
    mockedRepository.markAsRead.mockResolvedValue(updated as never);

    await expect(notificationService.markAsRead(7, 22)).resolves.toBe(updated);
    expect(mockedRepository.markAsRead).toHaveBeenCalledWith(7);

    await expect(notificationService.markAsRead(7, 99)).rejects.toMatchObject({ statusCode: 403 });
    expect(mockedRepository.markAsRead).toHaveBeenCalledTimes(1);
  });

  it('returns null for a missing notification without trying to mark it read', async () => {
    mockedRepository.findById.mockResolvedValue(null);

    await expect(notificationService.markAsRead(404, 22)).resolves.toBeNull();
    expect(mockedRepository.markAsRead).not.toHaveBeenCalled();
  });

  it('checks notification ownership before deleting it', async () => {
    mockedRepository.findById.mockResolvedValue({ notificationId: 7, userId: 22 } as never);
    mockedRepository.delete.mockResolvedValue(true);

    await expect(notificationService.deleteNotification(7, 22)).resolves.toBe(true);
    expect(mockedRepository.delete).toHaveBeenCalledWith(7);

    await expect(notificationService.deleteNotification(7, 99)).rejects.toMatchObject({ statusCode: 403 });
    expect(mockedRepository.delete).toHaveBeenCalledTimes(1);
  });

  it('returns false when deleting a notification that does not exist', async () => {
    mockedRepository.findById.mockResolvedValue(null);

    await expect(notificationService.deleteNotification(404, 22)).resolves.toBe(false);
    expect(mockedRepository.delete).not.toHaveBeenCalled();
  });

  it('runs expiration and 90-day cleanup operations', async () => {
    mockedRepository.deleteExpired.mockResolvedValue(2);
    mockedRepository.deleteOldNotifications.mockResolvedValue(3);

    await notificationService.cleanup();

    expect(mockedRepository.deleteExpired).toHaveBeenCalledTimes(1);
    expect(mockedRepository.deleteOldNotifications).toHaveBeenCalledWith(90);
  });
});
