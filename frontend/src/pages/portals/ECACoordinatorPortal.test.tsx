import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import ECACoordinatorPortal from './ECACoordinatorPortal';

const mockT = (key: string) => key;

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: mockT }) }));
jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({
    auth: { user: { username: 'eca.qa', firstName: 'QA' }, accessToken: 'eca-token' },
  }),
}));
jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => jest.fn() }));
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const renderECACoordinatorPortal = () => render(
  <ThemeProvider theme={createTheme()}>
    <ECACoordinatorPortal />
  </ThemeProvider>,
);

describe('ECACoordinatorPortal dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiClient.get).mockImplementation((url) => {
      const data = url.endsWith('/statistics')
        ? { activeActivities: 5, enrolledStudents: 42, upcomingEvents: 2, achievements: 7 }
        : url.endsWith('/eca?limit=50')
          ? [{ id: 4, name: 'QA Chess Club', category: 'Arts', status: 'active', enrolledCount: 12 }]
          : url.endsWith('/eca/events?limit=50')
            ? [{ id: 8, title: 'QA Chess Meetup', date: '2026-10-29', status: 'upcoming' }]
            : url.endsWith('/eca/achievements?limit=50')
              ? [{ id: 9, title: 'QA Chess Award', student: 'QA Student', date: '2026-10-20' }]
              : { username: 'eca.qa', firstName: 'QA', lastName: 'Coordinator', role: 'eca_coordinator' };
      return Promise.resolve({ data: { data } } as never);
    });
  });

  it('runs its data loader and renders activity, event, and achievement tabs', async () => {
    const user = userEvent.setup();
    renderECACoordinatorPortal();

    expect(await screen.findByRole('heading', { name: 'portal.ecaCoordinatorPortal' })).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('QA Chess Club')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'portal.activities' }));
    expect(screen.getByText('QA Chess Club')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'portal.events' }));
    expect(screen.getByText('QA Chess Meetup')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'portal.achievementsCount' }));
    expect(screen.getByText('QA Chess Award')).toBeInTheDocument();

    for (const url of [
      '/api/v1/eca/statistics',
      '/api/v1/eca?limit=50',
      '/api/v1/eca/events?limit=50',
      '/api/v1/eca/achievements?limit=50',
      '/api/v1/auth/me',
    ]) {
      expect(apiClient.get).toHaveBeenCalledWith(url, { headers: { Authorization: 'Bearer eca-token' } });
    }
  });
});
