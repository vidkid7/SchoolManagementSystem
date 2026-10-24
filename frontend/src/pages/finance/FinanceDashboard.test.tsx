import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import { FinanceDashboard } from './FinanceDashboard';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: jest.fn() }));
jest.mock('../../services/apiClient', () => ({ __esModule: true, default: { get: jest.fn() } }));

const mockedApi = jest.mocked(apiClient);
const mockedNavigate = jest.mocked(useSlugNavigate);
const renderDashboard = () => render(<ThemeProvider theme={createTheme()}><FinanceDashboard /></ThemeProvider>);

describe('FinanceDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedNavigate.mockReturnValue(jest.fn() as never);
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url === '/finance/summary') return { data: { data: { totalRevenue: 45000, totalOutstanding: 8000 } } } as never;
      if (url === '/finance/statistics') return { data: { data: { totalCollection: 36000, pendingFees: 8000, overdueInvoices: 2, totalInvoices: 5, paidInvoices: 2, partialInvoices: 1 } } } as never;
      if (url.startsWith('/finance/reports/collection?')) return { data: { data: { totalAmount: 1500 } } } as never;
      if (url === '/finance/recent-transactions?limit=5') return { data: { data: [{ id: 7, type: 'payment', studentName: 'QA Student', amount: 1500, date: '2026-10-22', status: 'completed' }] } } as never;
      throw new Error(`Unexpected GET ${url}`);
    });
  });

  it('maps summary/statistics/collection responses to the finance metrics', async () => {
    renderDashboard();

    expect(await screen.findByRole('button', { name: 'finance.totalRevenue: NPR 45,000' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'finance.pendingAmount: NPR 8,000' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'finance.collectedToday: NPR 1,500' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'finance.overdueInvoices: 2' })).toBeInTheDocument();
    expect(screen.getByText('finance.partialLabel').parentElement).toHaveTextContent('1');
    expect(screen.getByText('QA Student')).toBeInTheDocument();
    expect(mockedApi.get).toHaveBeenCalledWith(expect.stringMatching(/^\/finance\/reports\/collection\?startDate=\d{4}-\d{2}-\d{2}&endDate=\d{4}-\d{2}-\d{2}$/));
  });

  it('navigates from a keyboard-accessible metric card', async () => {
    const navigate = jest.fn();
    mockedNavigate.mockReturnValue(navigate);
    renderDashboard();

    fireEvent.click(await screen.findByRole('button', { name: 'finance.overdueInvoices: 2' }));
    expect(navigate).toHaveBeenCalledWith('/finance/invoices?status=overdue');
  });

  it('shows an error and safe zero/empty state when dashboard requests fail', async () => {
    mockedApi.get.mockRejectedValue(new Error('service unavailable'));
    renderDashboard();

    expect(await screen.findByRole('alert')).toHaveTextContent('Some finance dashboard data could not be loaded');
    expect(screen.getByRole('button', { name: 'finance.overdueInvoices: 0' })).toBeInTheDocument();
    expect(screen.getByText('finance.noRecentTransactions')).toBeInTheDocument();
  });
});
