import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import apiClient from '../../services/apiClient';
import SportsCoordinatorPortal from './SportsCoordinatorPortal';

function mockTranslate(key: string) {
  return key;
}

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: mockTranslate }) }));
jest.mock('react-redux', () => ({ useSelector: jest.fn() }));
jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => jest.fn() }));
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const authState = {
  user: { username: 'sports-qa', firstName: 'QA', lastName: 'Coordinator', email: 'sports@example.test' },
  accessToken: 'sports-qa-token',
};

const mockApiResponses = () => {
  jest.mocked(apiClient.get).mockImplementation(async (url) => {
    if (url.endsWith('/statistics')) return { data: { data: { activeSports: 3, totalAthletes: 24, upcomingEvents: 2, achievements: 5 } } } as never;
    if (url.includes('/teams')) return { data: { data: [{ id: 1, name: 'QA Tigers', sport: 'Football', coach: 'Coach QA', memberCount: 12, status: 'active' }] } } as never;
    if (url.includes('/tournaments')) return { data: { data: [{ id: 2, name: 'QA Cup', sport: 'Football', startDate: '2026-11-01', endDate: '2026-11-02', venue: 'Main Ground', status: 'upcoming', participants: 4 }] } } as never;
    if (url.includes('/achievements')) return { data: { data: [{ id: 3, title: 'QA Medal', sport: 'Athletics', student: 'QA Student', date: '2026-10-01', category: 'Gold' }] } } as never;
    if (url.includes('/auth/me')) return { data: { data: { username: 'sports-qa', firstName: 'QA', lastName: 'Coordinator', role: 'SPORTS_COORDINATOR' } } } as never;
    return { data: { data: [{ id: 4, name: 'Football', category: 'Team', status: 'active', enrolledCount: 24 }] } } as never;
  });
};

const renderPortal = () => render(
  <ThemeProvider theme={createTheme()}>
    <SportsCoordinatorPortal />
  </ThemeProvider>,
);

describe('SportsCoordinatorPortal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useSelector).mockImplementation((selector) => selector({ auth: authState } as never));
    mockApiResponses();
  });

  it('loads sports dashboard data and authenticates each API request', async () => {
    renderPortal();

    expect(await screen.findByText('portal.sportsCoordinatorPortal')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('Football')).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledTimes(6);
    for (const [, config] of jest.mocked(apiClient.get).mock.calls) {
      expect(config).toEqual({ headers: { Authorization: 'Bearer sports-qa-token' } });
    }
  });

  it('shows a partial-load error while retaining data from successful endpoints', async () => {
    jest.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url.includes('/teams')) throw new Error('network unavailable');
      return { data: { data: [] } } as never;
    });
    renderPortal();

    expect(await screen.findByRole('alert')).toHaveTextContent('portal.failedToLoadData');
    expect(screen.getByText('portal.noSportsData')).toBeInTheDocument();
  });

  it('connects each tab to an accessible tab panel and displays its dataset', async () => {
    const user = userEvent.setup();
    renderPortal();
    await screen.findByText('Football');

    const sportsTab = screen.getByRole('tab', { name: 'portal.sports' });
    expect(sportsTab).toHaveAttribute('aria-controls', 'sports-tabpanel-1');
    await user.click(sportsTab);
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'sports-tab-1');
    expect(screen.getByText('portal.enrolled')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'portal.teams' }));
    expect(screen.getByText('QA Tigers')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'portal.tournaments' }));
    expect(screen.getByText('QA Cup')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'portal.achievementsCount' }));
    expect(screen.getByText('QA Medal')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'portal.profileAndLinks' }));
    expect(screen.getByText('sports@example.test')).toBeInTheDocument();
  });

  it('leaves the loading state and reports missing authentication instead of spinning forever', async () => {
    jest.mocked(useSelector).mockImplementation((selector) => selector({ auth: { ...authState, accessToken: null } } as never));
    renderPortal();

    expect(await screen.findByRole('alert')).toHaveTextContent('portal.failedToLoadData');
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
    expect(apiClient.get).not.toHaveBeenCalled();
  });
});
