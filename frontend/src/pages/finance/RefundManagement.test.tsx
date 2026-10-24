import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import { RefundManagement } from './RefundManagement';

const mockT = (key: string) => key;
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: mockT }) }));
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const renderRefunds = () => render(<ThemeProvider theme={createTheme()}><RefundManagement /></ThemeProvider>);

describe('RefundManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiClient.get).mockResolvedValue({ data: { data: [], meta: { total: 0 } } } as never);
    jest.mocked(apiClient.post).mockResolvedValue({ data: { success: true } } as never);
  });

  it('opens a printable refund receipt from the selected row', async () => {
    jest.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        data: [{
          refundId: 8,
          paymentId: 42,
          receiptNumber: 'RCP-QA-42',
          studentName: 'QA Student',
          amount: 2500,
          reason: 'duplicate_payment',
          status: 'processed',
          requestedDate: '2026-10-20',
          processedDate: '2026-10-21',
        }],
        meta: { total: 1 },
      },
    } as never);
    const doc = { open: jest.fn(), write: jest.fn(), close: jest.fn() };
    const popup = { opener: window, document: doc } as unknown as Window;
    const open = jest.spyOn(window, 'open').mockReturnValue(popup);

    try {
      renderRefunds();
      fireEvent.click(await screen.findByRole('button', { name: 'finance.viewReceipt' }));

      expect(open).toHaveBeenCalledWith('', '_blank');
      expect(doc.write).toHaveBeenCalledWith(expect.stringContaining('<h1>finance.refundReceipt</h1>'));
      expect(doc.write).toHaveBeenCalledWith(expect.stringContaining('RCP-QA-42'));
      expect(doc.write).toHaveBeenCalledWith(expect.stringContaining('2026'));
      expect(doc.close).toHaveBeenCalledTimes(1);
    } finally {
      open.mockRestore();
    }
  });

  it('requires a positive whole-number payment ID and a reason before submitting', async () => {
    renderRefunds();
    fireEvent.click(screen.getByRole('button', { name: 'finance.processRefund' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'finance.processRefund' }).at(-1)!);

    await waitFor(() => expect(apiClient.post).not.toHaveBeenCalled());
    expect(screen.getByText('finance.paymentIdRequired')).toBeInTheDocument();
    expect(screen.getByText('finance.refundReasonRequired')).toBeInTheDocument();
  });

  it('shows an error when refund history cannot be loaded', async () => {
    jest.mocked(apiClient.get).mockRejectedValueOnce({ response: { data: { message: 'Refunds unavailable' } } });
    renderRefunds();

    expect(await screen.findByRole('alert')).toHaveTextContent('Refunds unavailable');
  });

  it('does not submit a refund when the user cancels confirmation', async () => {
    const confirm = jest.spyOn(window, 'confirm').mockReturnValue(false);
    try {
      renderRefunds();
      fireEvent.click(screen.getByRole('button', { name: 'finance.processRefund' }));
      fireEvent.change(await screen.findByRole('spinbutton'), { target: { value: '42' } });
      fireEvent.mouseDown(screen.getByRole('combobox', { name: 'finance.reason' }));
      fireEvent.click(await screen.findByRole('option', { name: 'finance.duplicatePayment' }));
      fireEvent.click(screen.getAllByRole('button', { name: 'finance.processRefund' }).at(-1)!);

      expect(confirm).toHaveBeenCalledWith('finance.confirmRefund');
      expect(apiClient.post).not.toHaveBeenCalled();
    } finally {
      confirm.mockRestore();
    }
  });
});
