import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserManagement } from '../UserManagement';
import apiClient from '../../../services/apiClient';

jest.mock('../../../services/apiClient');
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      'userManagement.title': 'User Management',
      'userManagement.subtitle': 'Manage user accounts, roles, and permissions',
      'userManagement.actionsFor': 'Actions for qaTeacher',
      'userManagement.totalUsers': 'Total Users',
      'userManagement.activeUsers': 'Active Users',
      'userManagement.inactiveUsers': 'Inactive Users',
      'userManagement.suspended': 'Suspended',
      'userManagement.addUser': 'Add User',
      'userManagement.user': 'User',
      'userManagement.email': 'Email',
      'userManagement.role': 'Role',
      'userManagement.status': 'Status',
      'userManagement.lastLogin': 'Last Login',
      'userManagement.created': 'Created',
      'common.search': 'Search',
      'common.loading': 'Loading...',
      'userManagement.never': 'Never',
    }[key] ?? key),
  }),
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const testUser = {
  userId: 88,
  username: 'qaTeacher',
  email: 'qa.teacher@example.com',
  firstName: 'QA',
  lastName: 'Teacher',
  role: 'Subject_Teacher',
  roleName: 'Subject Teacher',
  status: 'active' as const,
  createdAt: '2026-10-21T00:00:00.000Z',
};

describe('UserManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApiClient.get.mockImplementation((url) => {
      if (url.startsWith('/api/v1/users?')) {
        return Promise.resolve({ data: { data: [testUser], meta: { total: 1 } } });
      }
      if (url === '/api/v1/users/stats') {
        return Promise.resolve({ data: { data: { total: 1, active: 1, inactive: 0, suspended: 0 } } });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
  });

  it('debounces search requests and exposes a name for row actions', async () => {
    const user = userEvent.setup();
    render(<UserManagement />);

    await waitFor(() => expect(mockedApiClient.get).toHaveBeenCalled());
    
    expect(await screen.findByText('@qaTeacher')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actions for qaTeacher' })).toBeInTheDocument();
    expect(screen.getByText('active').closest('.MuiChip-root')).toHaveStyle({
      backgroundColor: 'rgb(22, 101, 52)',
      color: 'rgb(255, 255, 255)',
    });

    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'QA Teacher');

    await waitFor(() => {
      const listRequests = mockedApiClient.get.mock.calls
        .map(([url]) => url)
        .filter((url) => url.startsWith('/api/v1/users?'));
      expect(listRequests).toHaveLength(2);
      expect(listRequests[1]).toContain('search=QA+Teacher');
    });

    expect(mockedApiClient.get.mock.calls.filter(([url]) => url === '/api/v1/users/stats')).toHaveLength(1);
    expect(await screen.findByText('@qaTeacher')).toBeInTheDocument();
  });

  it('labels role and status selectors in filters and the user form', async () => {
    const user = userEvent.setup();
    render(<UserManagement />);

    await screen.findByText('@qaTeacher');
    expect(screen.getAllByRole('combobox', { name: 'Role' })).toHaveLength(1);
    expect(screen.getAllByRole('combobox', { name: 'Status' })).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Add User' }));
    expect(screen.getByRole('combobox', { name: 'Role' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Status' })).toBeInTheDocument();
  });

  it('gives the user table loading indicator an accessible name', async () => {
    let resolveUsers!: (value: { data: { data: typeof testUser[]; meta: { total: number } } }) => void;
    mockedApiClient.get.mockImplementation((url) => {
      if (url.startsWith('/api/v1/users?')) {
        return new Promise((resolve) => { resolveUsers = resolve; });
      }
      return Promise.resolve({ data: { data: { total: 1, active: 1, inactive: 0, suspended: 0 } } });
    });

    render(<UserManagement />);

    expect(screen.getByRole('progressbar', { name: 'Loading...' })).toBeInTheDocument();
    await act(async () => {
      resolveUsers({ data: { data: [testUser], meta: { total: 1 } } });
    });
    expect(await screen.findByText('@qaTeacher')).toBeInTheDocument();
  });

  it('restores focus to the Add User trigger after the dialog closes', async () => {
    const user = userEvent.setup();
    render(<UserManagement />);

    const trigger = await screen.findByRole('button', { name: 'Add User' });
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'userManagement.cancel' }));

    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});
