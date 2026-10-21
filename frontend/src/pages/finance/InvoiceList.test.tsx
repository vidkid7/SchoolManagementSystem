import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import { InvoiceList } from './InvoiceList';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => jest.fn() }));

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn().mockResolvedValue({ data: { data: [], total: 0 } }), post: jest.fn() },
}));

describe('InvoiceList accessibility', () => {
  it('gives the payment status filter an accessible name', async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <InvoiceList />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'finance.paymentStatus' })).toBeInTheDocument();
    });
  });

  it('debounces invoice searches and queries only the final value', async () => {
    jest.useFakeTimers();
    try {
      render(
        <ThemeProvider theme={createTheme()}>
          <InvoiceList />
        </ThemeProvider>,
      );

      await act(async () => {
        await Promise.resolve();
      });
      const get = jest.mocked(apiClient.get);
      const initialRequestCount = get.mock.calls.length;
      expect(initialRequestCount).toBeGreaterThan(0);

      const search = screen.getByRole('textbox', { name: 'common.search' });
      fireEvent.change(search, { target: { value: 'QA' } });
      fireEvent.change(search, { target: { value: 'QA invoice' } });
      expect(get).toHaveBeenCalledTimes(initialRequestCount);

      await act(async () => {
        jest.advanceTimersByTime(350);
      });

      await waitFor(() => expect(get).toHaveBeenCalledTimes(initialRequestCount + 1));
      expect(get.mock.calls.at(-1)?.[0]).toContain('search=QA+invoice');
    } finally {
      jest.useRealTimers();
    }
  });
});
