import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationBell } from '../../components/NotificationBell/NotificationBell';
import { UserNotifications } from './UserNotifications';

jest.mock('../../hooks/useNotifications', () => ({
  useNotifications: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const notification = {
  notificationId: 42,
  clientKey: 'notification-42',
  type: 'info' as const,
  category: 'announcement' as const,
  title: 'Test announcement notification',
  message: 'A test announcement was published.',
  isRead: false,
  createdAt: '2026-10-19T10:00:00.000Z',
};

const markRead = jest.fn();
const deleteNotification = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useNotifications as jest.Mock).mockReturnValue({
    notifications: [notification],
    unreadCount: 1,
    loading: false,
    hasMore: false,
    fetchMore: jest.fn(),
    markRead,
    markAllRead: jest.fn(),
    deleteNotification,
    refetch: jest.fn(),
  });
});

describe('notification action accessibility', () => {
  it('names the per-notification actions in the full page list', () => {
    render(<UserNotifications />);

    expect(screen.getByRole('combobox', { name: 'notifications.categoryFilter' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'notifications.markRead' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'notifications.deleteNotification' })).toBeInTheDocument();
    expect(markRead).not.toHaveBeenCalled();
    expect(deleteNotification).not.toHaveBeenCalled();
  });

  it('names the delete action in the notification popover', () => {
    render(
      <MemoryRouter initialEntries={['/KMC']}>
        <Routes>
          <Route path="/:municipalitySlug" element={<NotificationBell />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Notifications 1' }));

    expect(screen.getByRole('button', { name: 'notifications.deleteNotification' })).toBeInTheDocument();
    expect(deleteNotification).not.toHaveBeenCalled();
  });
});
