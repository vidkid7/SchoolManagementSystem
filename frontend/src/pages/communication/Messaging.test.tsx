import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Messaging } from './Messaging';
import { communicationApi } from '../../services/api/communication';
import { userApi } from '../../services/api/user';

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) =>
    selector({ auth: { user: { userId: 1, role: 'School_Admin' } } }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

jest.mock('../../services/api/communication', () => ({
  communicationApi: {
    getConversations: jest.fn(),
    getGroupConversations: jest.fn(),
  },
}));

jest.mock('../../services/api/user', () => ({
  userApi: { getUsers: jest.fn() },
}));

jest.mock('../../services/socket', () => ({
  socketService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(() => jest.fn()),
  },
}));

describe('Messaging empty states', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (communicationApi.getConversations as jest.Mock).mockResolvedValue({ conversations: [] });
    (communicationApi.getGroupConversations as jest.Mock).mockResolvedValue({ groupConversations: [] });
    (userApi.getUsers as jest.Mock).mockResolvedValue({ users: [] });
  });

  it('explains when Chats and Groups lists are empty', async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <Messaging />
      </ThemeProvider>,
    );

    await waitFor(() => expect(communicationApi.getConversations).toHaveBeenCalled());
    expect(await screen.findByRole('status')).toHaveTextContent('communication.noConversationsFound');

    fireEvent.click(screen.getByRole('tab', { name: 'communication.groups' }));
    expect(await screen.findByRole('status')).toHaveTextContent('communication.noGroupsFound');
  });

  it('does not log participant or group records while loading lists', async () => {
    const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    (communicationApi.getConversations as jest.Mock).mockResolvedValue({
      conversations: [{ id: 10, participant1Id: 1, participant2Id: 2, unreadCount: 0 }],
    });
    (communicationApi.getGroupConversations as jest.Mock).mockResolvedValue({
      groupConversations: [{ id: 20, name: 'Synthetic QA Group', members: [], unreadCount: 0 }],
    });
    (userApi.getUsers as jest.Mock).mockResolvedValue({
      users: [
        { userId: 1, firstName: 'Current', lastName: 'User', role: 'School_Admin' },
        { userId: 2, firstName: 'Synthetic', lastName: 'QA Participant', role: 'Teacher' },
      ],
    });

    try {
      render(
        <ThemeProvider theme={createTheme()}>
          <Messaging />
        </ThemeProvider>,
      );

      expect(await screen.findByText('Synthetic QA Participant')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('tab', { name: 'communication.groups' }));
      expect(await screen.findByText('Synthetic QA Group')).toBeInTheDocument();
      expect(consoleLog).not.toHaveBeenCalled();
    } finally {
      consoleLog.mockRestore();
    }
  });
});
