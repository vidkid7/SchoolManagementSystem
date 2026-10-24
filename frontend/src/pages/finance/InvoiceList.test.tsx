import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
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
      <MemoryRouter><ThemeProvider theme={createTheme()}><InvoiceList /></ThemeProvider></MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'finance.paymentStatus' })).toBeInTheDocument();
    });
  });

  it('debounces invoice searches and queries only the final value', async () => {
    jest.useFakeTimers();
    try {
      render(
        <MemoryRouter><ThemeProvider theme={createTheme()}><InvoiceList /></ThemeProvider></MemoryRouter>,
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

  it('opens invoice details in place instead of navigating to a missing route', async () => {
    jest.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        data: [{ id: 41, invoice_number: 'INV-QA-41', student_name: 'QA Student', class_name: 'Grade 4', total_amount: 1200, paid_amount: 200, balance: 1000, due_date: '2026-11-01', status: 'partial' }],
        total: 1,
      },
    } as never);

    render(<MemoryRouter><ThemeProvider theme={createTheme()}><InvoiceList /></ThemeProvider></MemoryRouter>);

    const viewButton = await screen.findByTitle('common.view');
    fireEvent.click(viewButton);
    expect(await screen.findByText('finance.invoices INV-QA-41')).toBeInTheDocument();
    expect(screen.getByText('QA Student', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'common.close' })).toBeInTheDocument();
  });

  it('labels the payment dialog as an add-payment action', async () => {
    jest.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        data: [{ id: 42, invoice_number: 'INV-QA-42', student_name: 'QA Student', class_name: 'Grade 4', total_amount: 1200, paid_amount: 200, balance: 1000, due_date: '2026-11-01', status: 'partial' }],
        total: 1,
      },
    } as never);

    render(<MemoryRouter><ThemeProvider theme={createTheme()}><InvoiceList /></ThemeProvider></MemoryRouter>);
    fireEvent.click(await screen.findByTitle('finance.addPayment'));
    expect(await screen.findByText('finance.addPayment', { selector: 'h2' })).toBeInTheDocument();
  });

  it('uses an invoice search query when opened from global search', async () => {
    render(
      <MemoryRouter initialEntries={['/KMC/finance/invoices?search=INV-QA-43']}>
        <ThemeProvider theme={createTheme()}><InvoiceList /></ThemeProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('search=INV-QA-43')));
    expect(screen.getByRole('textbox', { name: 'common.search' })).toHaveValue('INV-QA-43');
  });
});
