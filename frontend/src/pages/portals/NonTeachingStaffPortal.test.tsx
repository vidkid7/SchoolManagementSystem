import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import NonTeachingStaffPortal from './NonTeachingStaffPortal';

function mockTranslate(key: string) { return key; }
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: mockTranslate }) }));
jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({
    auth: { user: { username: 'staff-qa', firstName: 'QA', lastName: 'Staff', email: 'qa@example.test' }, accessToken: 'qa-token' },
  }),
}));
jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => jest.fn() }));
jest.mock('../../components/YearSelectableDatePicker/YearSelectableDatePicker', () => {
  return {
    YearSelectableDateField: ({ label, value, onChange }: { label: string; value: string; onChange: (event: { target: { value: string } }) => void }) =>
      React.createElement('input', { type: 'date', 'aria-label': label, value, onChange }),
  };
});
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));

const task = { id: 7, title: 'Prepare meeting room', description: 'Set the chairs', priority: 'medium', status: 'pending', dueDate: null, assignedBy: 3 };
const schedule = { id: 2, date: '2026-10-26', day: 'Monday', startTime: '08:30', endTime: '16:30', location: 'Library', duties: 'Inventory' };
const renderPortal = () => render(<ThemeProvider theme={createTheme()}><NonTeachingStaffPortal /></ThemeProvider>);

describe('NonTeachingStaffPortal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url.endsWith('/dashboard')) return { data: { data: { profile: {}, role: 'NON_TEACHING_STAFF', quickLinks: [] } } } as never;
      if (url.endsWith('/profile')) return { data: { data: { username: 'staff-qa', email: 'qa@example.test' } } } as never;
      if (url.endsWith('/tasks')) return { data: { data: { tasks: [task] } } } as never;
      if (url.endsWith('/schedule')) return { data: { data: { schedule: [schedule] } } } as never;
      if (url.endsWith('/leave')) return { data: { data: { leaves: [], balance: null } } } as never;
      return { data: { data: {} } } as never;
    });
    jest.mocked(apiClient.post).mockResolvedValue({ data: { data: { id: 8, status: 'pending' } } } as never);
    jest.mocked(apiClient.put).mockResolvedValue({ data: { data: { ...task, status: 'in_progress' } } } as never);
  });

  it('updates a task status through the staff task endpoint', async () => {
    renderPortal();
    await screen.findByText('Prepare meeting room');

    const statusSelect = screen.getByRole('combobox', { name: 'portal.updateStatus: Prepare meeting room' });
    fireEvent.mouseDown(statusSelect);
    fireEvent.click(await screen.findByRole('option', { name: 'common.inProgress' }));

    await waitFor(() => expect(apiClient.put).toHaveBeenCalledWith(
      '/api/v1/non-teaching-staff/tasks/7',
      { status: 'in_progress' },
      { headers: { Authorization: 'Bearer qa-token' } },
    ));
  });

  it('renders the saved weekly schedule contract', async () => {
    renderPortal();
    await screen.findByText('Prepare meeting room');
    await userEvent.setup().click(screen.getByRole('tab', { name: 'portal.mySchedule' }));
    expect(await screen.findByText('Inventory')).toBeInTheDocument();
    expect(screen.getByText('08:30')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  it('loads and submits leave requests through the staff-scoped API', async () => {
    const user = userEvent.setup();
    renderPortal();
    await screen.findByText('Prepare meeting room');
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/non-teaching-staff/leave', { headers: { Authorization: 'Bearer qa-token' } });

    await user.click(screen.getByRole('tab', { name: 'portal.leaveManagement' }));
    await user.click(screen.getByRole('button', { name: 'portal.requestLeave' }));
    fireEvent.change(screen.getByLabelText('common.startDate'), { target: { value: '2026-10-25' } });
    fireEvent.change(screen.getByLabelText('common.endDate'), { target: { value: '2026-10-26' } });
    await user.type(screen.getByRole('textbox', { name: 'portal.reason' }), 'Medical appointment');
    await user.click(screen.getByRole('button', { name: 'portal.submitLeave' }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith(
      '/api/v1/non-teaching-staff/leave',
      { leaveType: 'casual', startDate: '2026-10-25', endDate: '2026-10-26', reason: 'Medical appointment' },
      { headers: { Authorization: 'Bearer qa-token' } },
    ));
  });

  it('blocks leave requests whose end date is earlier than the start date', async () => {
    const user = userEvent.setup();
    renderPortal();
    await screen.findByText('Prepare meeting room');
    await user.click(screen.getByRole('tab', { name: 'portal.leaveManagement' }));
    await user.click(screen.getByRole('button', { name: 'portal.requestLeave' }));
    fireEvent.change(screen.getByLabelText('common.startDate'), { target: { value: '2026-10-26' } });
    fireEvent.change(screen.getByLabelText('common.endDate'), { target: { value: '2026-10-25' } });
    await user.type(screen.getByRole('textbox', { name: 'portal.reason' }), 'Medical appointment');
    await user.click(screen.getByRole('button', { name: 'portal.submitLeave' }));

    expect(await screen.findByText('portal.leaveEndBeforeStart')).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
