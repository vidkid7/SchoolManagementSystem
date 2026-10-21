import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';
import { useNotifications } from '../../hooks/useNotifications';

jest.mock('../../hooks/useNotifications', () => ({
  useNotifications: jest.fn(),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;

describe('NotificationBell accessible name', () => {
  beforeEach(() => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      unreadCount: 0,
      loading: false,
      hasMore: false,
      fetchMore: jest.fn(),
      markRead: jest.fn(),
      markAllRead: jest.fn(),
      deleteNotification: jest.fn(),
    });
  });

  it.each([
    [0, 'Notifications 0'],
    [5, 'Notifications 5'],
    [120, 'Notifications 99+'],
  ])('includes the visible unread count in the accessible name', (unreadCount, accessibleName) => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      unreadCount,
      loading: false,
      hasMore: false,
      fetchMore: jest.fn(),
      markRead: jest.fn(),
      markAllRead: jest.fn(),
      deleteNotification: jest.fn(),
    });

    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: accessibleName })).toBeInTheDocument();
  });
});
