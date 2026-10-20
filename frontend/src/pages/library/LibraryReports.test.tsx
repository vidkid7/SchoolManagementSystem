import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import apiClient from '../../services/apiClient';
import { getQuickReportDateRange } from './LibraryReports';

jest.mock('../../services/apiClient', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe('library quick report ranges', () => {
  const today = new Date(2026, 9, 20, 0, 0, 0);

  it('uses the current date for today without UTC date shifting', () => {
    expect(getQuickReportDateRange('today', today)).toEqual({
      startDate: '2026-10-20',
      endDate: '2026-10-20',
    });
  });

  it('uses the current Monday through today for this week', () => {
    expect(getQuickReportDateRange('week', today)).toEqual({
      startDate: '2026-10-19',
      endDate: '2026-10-20',
    });
  });

  it('uses the first day of the current month', () => {
    expect(getQuickReportDateRange('month', today)).toEqual({
      startDate: '2026-10-01',
      endDate: '2026-10-20',
    });
  });

  it('uses January 1 for this year', () => {
    expect(getQuickReportDateRange('year', today)).toEqual({
      startDate: '2026-01-01',
      endDate: '2026-10-20',
    });
  });

  it('rejects unsupported periods', () => {
    expect(() => getQuickReportDateRange('last-week', today)).toThrow('Unsupported quick report period');
  });
});

describe('library report print preview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: {} } });
    Object.defineProperty(window.URL, 'createObjectURL', { configurable: true, value: jest.fn(() => 'blob:library-report') });
    Object.defineProperty(window.URL, 'revokeObjectURL', { configurable: true, value: jest.fn() });
    jest.spyOn(window, 'open').mockReturnValue({
      location: { href: '' },
      focus: jest.fn(),
      close: jest.fn(),
    } as unknown as Window);
  });

  afterEach(() => jest.restoreAllMocks());

  it('fetches the selected report and opens its PDF in a new tab', async () => {
    const { LibraryReports } = await import('./LibraryReports');
    render(<LibraryReports />);
    fireEvent.click(screen.getByRole('button', { name: 'library.todayActivity' }));
    fireEvent.click(screen.getByRole('button', { name: 'reports.print' }));

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/library/reports', {
        params: { type: 'circulation', startDate: expect.any(String), endDate: expect.any(String) },
        responseType: 'blob',
      });
      expect(window.open).toHaveBeenCalledWith('', '_blank');
    });
    expect(await screen.findByText('library.printPreviewOpened')).toBeInTheDocument();
  });
});
