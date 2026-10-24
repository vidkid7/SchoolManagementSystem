import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import { ECADashboard } from './ECADashboard';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: jest.fn() }));
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const mockedApi = jest.mocked(apiClient);
const mockedNavigate = jest.mocked(useSlugNavigate);

const renderDashboard = () => render(
  <ThemeProvider theme={createTheme()}><ECADashboard /></ThemeProvider>,
);

describe('ECADashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedNavigate.mockReturnValue(jest.fn() as never);
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url === '/eca/statistics') return { data: { data: { totalECAs: 4, activeECAs: 3, totalStudents: 20, upcomingEvents: 2 } } } as never;
      if (url === '/eca/recent-activities?limit=5') return { data: { data: [] } } as never;
      throw new Error(`Unexpected GET ${url}`);
    });
  });

  it('renders API statistics and exposes metric navigation as buttons', async () => {
    const navigate = jest.fn();
    mockedNavigate.mockReturnValue(navigate);
    renderDashboard();

    const totalEcas = await screen.findByRole('button', { name: 'eca.totalEcas: 4' });
    expect(screen.getByRole('button', { name: 'eca.activeEcas: 3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'eca.enrolledStudents: 20' })).toBeInTheDocument();
    fireEvent.click(totalEcas);
    expect(navigate).toHaveBeenCalledWith('/eca/list');
  });

  it('shows backend event and achievement names with a valid date', async () => {
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url === '/eca/statistics') return { data: { data: { totalECAs: 1 } } } as never;
      return { data: { data: [
        { id: 'event-1', type: 'event', ecaName: 'Basketball', event: 'Final match', date: '2026-10-20' },
        { id: 'achievement-1', type: 'achievement', ecaName: 'Science Club', achievement: 'Regional award', date: null },
      ] } } as never;
    });
    renderDashboard();

    expect(await screen.findByText('Final match')).toBeInTheDocument();
    expect(screen.getByText('Regional award')).toBeInTheDocument();
    expect(screen.getByText(new Date('2026-10-20').toLocaleDateString())).toBeInTheDocument();
    expect(screen.queryByText('Invalid Date')).not.toBeInTheDocument();
  });

  it('falls back to zero metrics and an empty activity state on API errors', async () => {
    mockedApi.get.mockRejectedValue(new Error('unavailable'));
    renderDashboard();

    expect(await screen.findByRole('button', { name: 'eca.totalEcas: 0' })).toBeInTheDocument();
    expect(screen.getByText('eca.noRecentActivities')).toBeInTheDocument();
  });
});
