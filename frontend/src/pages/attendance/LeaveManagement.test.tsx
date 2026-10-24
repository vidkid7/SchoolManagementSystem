import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import apiClient from '../../services/apiClient';
import { LeaveManagement } from './LeaveManagement';

jest.mock('../../services/apiClient', () => ({ __esModule: true, default: { get: jest.fn(), put: jest.fn() } }));
jest.mock('react-redux', () => ({ useSelector: () => 'School_Admin' }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const leaves = [{
  id: 81,
  studentId: 26,
  studentName: 'Nima Sherpa',
  leaveType: 'Sick leave',
  startDate: '2026-10-25T00:00:00.000Z',
  endDate: '2026-10-26T00:00:00.000Z',
  reason: 'Medical appointment',
  status: 'pending' as const,
  appliedDate: '2026-10-21T00:00:00.000Z',
}];

const renderPage = () => render(
  <ThemeProvider theme={createTheme()}>
    <LeaveManagement />
  </ThemeProvider>,
);

describe('LeaveManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiClient.get).mockResolvedValue({ data: { data: leaves } } as Awaited<ReturnType<typeof apiClient.get>>);
    jest.mocked(apiClient.put).mockResolvedValue({ data: { success: true } } as Awaited<ReturnType<typeof apiClient.put>>);
  });

  it('loads pending requests, provides accessible row actions, and approves with remarks', async () => {
    renderPage();
    expect(await screen.findByText('Nima Sherpa')).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith('/attendance/leave/pending', { params: { status: 'pending' } });
    expect(screen.getByRole('tabpanel', { name: 'common.pending' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'common.view' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'attendance.approveLeave' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'attendance.remarksOptional' }), { target: { value: 'Reviewed' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'attendance.approveLeave' }));

    await waitFor(() => expect(apiClient.put).toHaveBeenCalledWith('/attendance/leave/81/approve', { status: 'approved', remarks: 'Reviewed' }));
    expect(await screen.findByText('attendance.leaveActionSuccess')).toBeInTheDocument();
  });

  it('keeps action errors visible inside the open dialog and associates status tabs with panels', async () => {
    jest.mocked(apiClient.put).mockRejectedValueOnce({ response: { data: { message: 'Leave update rejected' } } });
    renderPage();
    await screen.findByText('Nima Sherpa');
    fireEvent.click(screen.getByRole('tab', { name: 'attendance.approveLeave' }));
    await waitFor(() => expect(apiClient.get).toHaveBeenLastCalledWith('/attendance/leave/pending', { params: { status: 'approved' } }));
    expect(screen.getByRole('tab', { name: 'attendance.approveLeave' })).toHaveAttribute('aria-controls', 'leave-approved-panel');

    fireEvent.click(screen.getByRole('button', { name: 'attendance.approveLeave' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'attendance.approveLeave' }));
    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent('Leave update rejected');
  });
});
