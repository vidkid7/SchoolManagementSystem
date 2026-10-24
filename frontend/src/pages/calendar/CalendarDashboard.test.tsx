import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import apiClient from '../../services/apiClient';
import { CalendarDashboard } from './CalendarDashboard';

jest.mock('../../services/apiClient', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => navigateMock }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

const navigateMock = jest.fn();
const stats = {
  totalEvents: 8,
  upcomingEvents: 3,
  holidaysThisMonth: 2,
  eventsThisWeek: 1,
  eventsByCategory: { academic: 4, exam: 2 },
  upcomingEventsList: [{
    eventId: 71,
    title: 'Science Fair',
    category: 'academic',
    startDate: '2026-11-15T00:00:00.000Z',
    startDateBS: '2083-07-29',
    isHoliday: false,
  }],
  upcomingHolidays: [{
    eventId: 72,
    title: 'Founders Day',
    startDate: '2026-11-20T00:00:00.000Z',
    startDateBS: '2083-08-04',
    isNepalGovernmentHoliday: true,
  }],
};

const renderPage = () => render(
  <ThemeProvider theme={createTheme()}>
    <CalendarDashboard />
  </ThemeProvider>,
);

describe('CalendarDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiClient.get).mockResolvedValue({ data: { data: stats } } as Awaited<ReturnType<typeof apiClient.get>>);
  });

  it('loads and displays calendar statistics, events, holidays, and navigation actions', async () => {
    renderPage();
    expect(await screen.findByText('Science Fair')).toBeInTheDocument();
    expect(screen.getByText('Founders Day')).toBeInTheDocument();
    expect(screen.getByText('calendar.totalEvents').parentElement).toHaveTextContent('8');
    expect(screen.getAllByText('calendar.upcomingEvents')[0].parentElement).toHaveTextContent('3');
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/calendar/events/stats');

    fireEvent.click(screen.getByText('Science Fair'));
    expect(navigateMock).toHaveBeenCalledWith('/calendar?date=2026-11-15T00:00:00.000Z');
    fireEvent.click(screen.getByRole('button', { name: 'calendar.createEvent' }));
    expect(navigateMock).toHaveBeenCalledWith('/calendar?action=create');
    fireEvent.click(screen.getByRole('button', { name: 'calendar.viewHolidays' }));
    expect(navigateMock).toHaveBeenCalledWith('/calendar?filter=holiday');
  });

  it('shows a recoverable stats error and retries the request', async () => {
    jest.mocked(apiClient.get)
      .mockRejectedValueOnce(new Error('Calendar API unavailable'))
      .mockResolvedValueOnce({ data: { data: stats } } as Awaited<ReturnType<typeof apiClient.get>>);
    renderPage();

    expect(await screen.findByText('Calendar API unavailable')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'calendar.retry' }));
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Science Fair')).toBeInTheDocument();
  });
});
