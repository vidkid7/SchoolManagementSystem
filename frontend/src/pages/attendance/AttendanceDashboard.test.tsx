import { fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { AttendanceDashboard } from './AttendanceDashboard';

jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => navigateMock }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const navigateMock = jest.fn();

const renderPage = () => render(
  <ThemeProvider theme={createTheme()}>
    <AttendanceDashboard />
  </ThemeProvider>,
);

describe('AttendanceDashboard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('exposes overview navigation cards as named keyboard-operable buttons', () => {
    renderPage();

    expect(screen.getByRole('tab', { name: 'common.overview' })).toHaveAttribute('aria-controls', 'attendance-overview-panel');
    expect(screen.getByRole('tabpanel', { name: 'common.overview' })).toBeInTheDocument();
    const leaveCard = screen.getByRole('button', { name: /attendance\.leaveApplications/ });
    expect(leaveCard).toHaveTextContent('attendance.leaveApplicationsDesc');
    fireEvent.click(leaveCard);
    expect(navigateMock).toHaveBeenCalledWith('/attendance/leave');
  });

  it('shows the actions panel and routes quick actions', () => {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: 'common.actions' }));

    const panel = screen.getByRole('tabpanel', { name: 'common.actions' });
    expect(panel).toBeVisible();
    fireEvent.click(within(panel).getByRole('button', { name: 'attendance.viewReports' }));
    expect(navigateMock).toHaveBeenCalledWith('/attendance/reports');
  });
});
