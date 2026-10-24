import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import { Payments } from './Payments';

const mockT = (key: string) => key;
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: mockT }) }));
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const renderPayments = () => render(<ThemeProvider theme={createTheme()}><Payments /></ThemeProvider>);

describe('Payments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiClient.get).mockResolvedValue({ data: { data: [], meta: { total: 0 } } } as never);
    jest.mocked(apiClient.post).mockResolvedValue({ data: { success: true } } as never);
  });

  it('opens a printable payment receipt using the selected payment data', async () => {
    jest.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        data: [{
          paymentId: 42,
          invoiceId: 12,
          invoiceNumber: 'INV-QA-42',
          studentId: 7,
          studentName: '<QA Student>',
          amount: 2500,
          paymentMethod: 'cash',
          transactionId: 'TX-QA-42',
          paymentDate: '2026-10-20',
          status: 'completed',
        }],
        meta: { total: 1 },
      },
    } as never);
    const doc = { open: jest.fn(), write: jest.fn(), close: jest.fn() };
    const popup = { opener: window, document: doc } as unknown as Window;
    const open = jest.spyOn(window, 'open').mockReturnValue(popup);

    try {
      renderPayments();
      fireEvent.click(await screen.findByTitle('common.download'));

      expect(open).toHaveBeenCalledWith('', '_blank');
      expect(popup.opener).toBeNull();
      expect(doc.open).toHaveBeenCalledTimes(1);
      expect(doc.write).toHaveBeenCalledWith(expect.stringContaining('<h1>finance.paymentReceipt</h1>'));
      expect(doc.write).toHaveBeenCalledWith(expect.stringContaining('&lt;QA Student&gt;'));
      expect(doc.write).toHaveBeenCalledWith(expect.stringContaining('TX-QA-42'));
      expect(doc.close).toHaveBeenCalledTimes(1);
    } finally {
      open.mockRestore();
    }
  });

  it('does not submit an incomplete payment form', async () => {
    renderPayments();
    fireEvent.click(screen.getByRole('button', { name: 'finance.recordPayment' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'finance.recordPayment' }).at(-1)!);

    await waitFor(() => expect(apiClient.post).not.toHaveBeenCalled());
    expect(screen.getByRole('alert')).toHaveTextContent('validation.required');
  });

  it('shows an error when payment history cannot be loaded', async () => {
    jest.mocked(apiClient.get).mockRejectedValueOnce({ response: { data: { message: 'Payments unavailable' } } });
    renderPayments();

    expect(await screen.findByRole('alert')).toHaveTextContent('Payments unavailable');
  });
});
