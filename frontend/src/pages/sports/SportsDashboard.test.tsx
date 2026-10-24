import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import { SportsDashboard } from './SportsDashboard';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: jest.fn() }));
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

const mockedApi = jest.mocked(apiClient);
const mockedUseSlugNavigate = jest.mocked(useSlugNavigate);

const renderDashboard = () => render(
  <ThemeProvider theme={createTheme()}>
    <SportsDashboard />
  </ThemeProvider>,
);

describe('SportsDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSlugNavigate.mockReturnValue(jest.fn() as never);
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url === '/sports/statistics') {
        return { data: { data: { totalSports: 4, totalTeams: 8, totalPlayers: 37, upcomingMatches: 3 } } } as never;
      }
      if (url === '/sports/recent-matches?limit=5') {
        return { data: { data: [{ id: 42, team1: 'Falcons', team2: 'Tigers', sport: 'Football', date: '2026-10-31', result: 'Upcoming' }] } } as never;
      }
      throw new Error(`Unexpected GET ${url}`);
    });
  });

  it('loads statistics and recent matches from the sports APIs', async () => {
    renderDashboard();

    expect(await screen.findByRole('button', { name: 'sports.totalSports: 4' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'sports.totalTeams: 8' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'sports.totalPlayers: 37' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'sports.upcomingMatches: 3' })).toBeInTheDocument();
    expect(screen.getByText(/Falcons vs Tigers/)).toBeInTheDocument();
    expect(mockedApi.get).toHaveBeenCalledWith('/sports/statistics');
    expect(mockedApi.get).toHaveBeenCalledWith('/sports/recent-matches?limit=5');
  });

  it('navigates from the keyboard-accessible total teams metric', async () => {
    const navigate = jest.fn();
    mockedUseSlugNavigate.mockReturnValue(navigate);
    renderDashboard();

    fireEvent.click(await screen.findByRole('button', { name: 'sports.totalTeams: 8' }));

    expect(navigate).toHaveBeenCalledWith('/sports/management?tab=1');
  });

  it('shows zero values and the empty matches state when the APIs fail', async () => {
    mockedApi.get.mockRejectedValue(new Error('service unavailable'));
    renderDashboard();

    expect(await screen.findByRole('button', { name: 'sports.totalTeams: 0' })).toBeInTheDocument();
    expect(screen.getByText('sports.noRecentMatches')).toBeInTheDocument();
  });
});
