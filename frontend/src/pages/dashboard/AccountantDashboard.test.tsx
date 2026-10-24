import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import AccountantDashboard from './AccountantDashboard';

let mockAuthState = { user: { firstName: 'QA', username: 'qa-accountant' }, accessToken: 'qa-token' };

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: { auth: typeof mockAuthState }) => unknown) => selector({ auth: mockAuthState }),
}));
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));
jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => jest.fn() }));

const mockedApi = jest.mocked(apiClient);

const renderDashboard = () => render(
  <MemoryRouter>
    <ThemeProvider theme={createTheme()}>
      <AccountantDashboard />
    </ThemeProvider>
  </MemoryRouter>,
);

describe('AccountantDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState = { user: { firstName: 'QA', username: 'qa-accountant' }, accessToken: 'qa-token' };
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url === '/finance/statistics') return { data: { data: { totalCollection: 1200, pendingFees: 300, totalInvoices: 4, paidInvoices: 2, overdueInvoices: 1, collectionRate: 50 } } } as never;
      if (url === '/finance/recent-transactions?limit=10') return { data: { data: [] } } as never;
      if (url === '/finance/invoices?status=overdue&limit=5') return { data: { data: [] } } as never;
      throw new Error(`Unexpected GET ${url}`);
    });
  });

  it('renders recent transaction dates and stable API row ids', async () => {
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url === '/finance/statistics') return { data: { data: { totalCollection: 1200 } } } as never;
      if (url === '/finance/recent-transactions?limit=10') return {
        data: { data: [{ id: 19, receiptNumber: 'RCPT-19', studentName: 'QA Student', amount: 1250, paymentMethod: 'cash', date: '2026-10-20', status: 'completed' }] },
      } as never;
      return { data: { data: [] } } as never;
    });

    renderDashboard();

    expect(await screen.findByText('RCPT-19')).toBeInTheDocument();
    expect(screen.getByText(new Date('2026-10-20').toLocaleDateString())).toBeInTheDocument();
  });

  it('reports when one of the dashboard requests fails', async () => {
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url === '/finance/statistics') throw new Error('unavailable');
      return { data: { data: [] } } as never;
    });

    renderDashboard();

    expect(await screen.findByRole('alert')).toHaveTextContent('Some finance dashboard data could not be loaded');
    expect(screen.getByText('No transactions yet')).toBeInTheDocument();
  });

  it('leaves loading state and explains when the auth token is missing', async () => {
    mockAuthState = { user: { firstName: 'QA', username: 'qa-accountant' }, accessToken: '' };

    renderDashboard();

    expect(await screen.findByRole('alert')).toHaveTextContent('Authentication required to load finance data');
    expect(mockedApi.get).not.toHaveBeenCalled();
  });
});
