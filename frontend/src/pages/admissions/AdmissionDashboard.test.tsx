import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import api from '../../config/api';
import { AdmissionDashboard } from './AdmissionDashboard';

jest.mock('../../config/api', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => navigateMock }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const navigateMock = jest.fn();
const renderPage = () => render(
  <ThemeProvider theme={createTheme()}>
    <AdmissionDashboard />
  </ThemeProvider>,
);

describe('AdmissionDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(api.get).mockResolvedValue({ data: { data: { byStatus: { inquiry: 12, applied: 3, admitted: 2, enrolled: 1 } } } } as Awaited<ReturnType<typeof api.get>>);
  });

  it('loads admission statistics and routes inquiry/list actions', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'admissions.dashboardTitle' })).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/admissions/reports');
    expect(screen.getByText('admissions.totalInquiries').parentElement).toHaveTextContent('12');
    expect(screen.getByText('admissions.applications').parentElement).toHaveTextContent('6');

    fireEvent.click(screen.getByRole('button', { name: 'admissions.newInquiry' }));
    expect(navigateMock).toHaveBeenLastCalledWith('/admissions/new');
    fireEvent.click(screen.getByRole('button', { name: 'admissions.viewApplications' }));
    expect(navigateMock).toHaveBeenLastCalledWith('/admissions/list?status=applied');
  });

  it('shows a safe error and retries a failed statistics request', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.mocked(api.get)
      .mockRejectedValueOnce(new Error('sensitive upstream details'))
      .mockResolvedValueOnce({ data: { data: { byStatus: { inquiry: 1 } } } } as Awaited<ReturnType<typeof api.get>>);
    renderPage();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('admissions.failedToLoadStats');
    expect(alert).not.toHaveTextContent('sensitive upstream details');
    expect(consoleError).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'common.retry' }));
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole('heading', { name: 'admissions.dashboardTitle' })).toBeInTheDocument();
    consoleError.mockRestore();
  });
});
