import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import { FinancialReports } from './FinancialReports';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const originalTimeZone = process.env.TZ;

describe('Financial report quick ranges', () => {
  beforeAll(() => {
    process.env.TZ = 'Asia/Kathmandu';
  });

  afterAll(() => {
    if (originalTimeZone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimeZone;
  });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-20T06:00:00.000Z'));
    jest.clearAllMocks();
    jest.mocked(apiClient.get).mockResolvedValue({ data: { data: {} } } as unknown as Awaited<ReturnType<typeof apiClient.get>>);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderReports = () => render(
    <ThemeProvider theme={createTheme()}>
      <FinancialReports />
    </ThemeProvider>,
  );

  it.each([
    ['today', 'finance.todayCollection', '2026-10-20'],
    ['week', 'finance.thisWeek', '2026-10-13'],
    ['month', 'finance.thisMonth', '2026-10-01'],
    ['year', 'finance.thisYear', '2026-01-01'],
  ])('sends the %s quick-report range using local dates', async (_period, buttonName, expectedStart) => {
    renderReports();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: buttonName }));
    });

    expect(apiClient.get).toHaveBeenCalledWith('/finance/reports', {
      params: { type: 'revenue', startDate: expectedStart, endDate: '2026-10-20' },
    });
  });

  it('labels the CSV export accurately and downloads a CSV file', async () => {
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const createObjectURL = jest.fn(() => 'blob:financial-report');
    const revokeObjectURL = jest.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });

    let downloadedFilename = '';
    const anchorClick = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      downloadedFilename = this.download;
    });

    try {
      jest.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: { data: {} } } as unknown as Awaited<ReturnType<typeof apiClient.get>>)
        .mockResolvedValueOnce({
          data: { data: { summary: { totalRevenue: 0 } } },
        } as unknown as Awaited<ReturnType<typeof apiClient.get>>);
      renderReports();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'common.generate' }));
      });

      fireEvent.click(screen.getByRole('button', { name: 'finance.downloadCSV' }));

      expect(createObjectURL).toHaveBeenCalledWith(expect.objectContaining({ type: 'text/csv' }));
      expect(anchorClick).toHaveBeenCalledTimes(1);
      expect(downloadedFilename).toMatch(/^financial_report_revenue_\d+\.csv$/);
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:financial-report');
    } finally {
      anchorClick.mockRestore();
      Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: originalCreateObjectURL });
      Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: originalRevokeObjectURL });
    }
  });
});
