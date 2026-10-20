import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import { Payments } from './Payments';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('Payments form validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiClient.get).mockResolvedValue({ data: { data: [], meta: { total: 0 } } } as unknown as Awaited<ReturnType<typeof apiClient.get>>);
  });

  const renderPayments = () => render(
    <ThemeProvider theme={createTheme()}>
      <Payments />
    </ThemeProvider>,
  );

  const openRecordPayment = async () => {
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/finance/payments', expect.any(Object)));
    fireEvent.click(screen.getByRole('button', { name: 'finance.recordPayment' }));
  };

  it('rejects a blank invoice before sending a payment request', async () => {
    renderPayments();
    await openRecordPayment();
    const submitButtons = screen.getAllByRole('button', { name: 'finance.recordPayment' });
    fireEvent.click(submitButtons[submitButtons.length - 1]);

    expect(screen.getAllByText('validation.required').length).toBeGreaterThan(0);
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('rejects a zero or negative amount before sending a payment request', async () => {
    renderPayments();
    await openRecordPayment();
    fireEvent.change(screen.getByRole('spinbutton', { name: 'finance.invoiceId' }), { target: { value: '123' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'finance.amount' }), { target: { value: '0' } });
    const submitButtons = screen.getAllByRole('button', { name: 'finance.recordPayment' });
    fireEvent.click(submitButtons[submitButtons.length - 1]);

    expect(screen.getAllByText('finance.invalidAmount').length).toBeGreaterThan(0);
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('clears validation feedback when the payment dialog is canceled', async () => {
    renderPayments();
    await openRecordPayment();
    fireEvent.change(screen.getByRole('spinbutton', { name: 'finance.invoiceId' }), { target: { value: '123' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'finance.amount' }), { target: { value: '0' } });
    const submitButtons = screen.getAllByRole('button', { name: 'finance.recordPayment' });
    fireEvent.click(submitButtons[submitButtons.length - 1]);

    expect(screen.getAllByText('finance.invalidAmount').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));

    expect(screen.queryByText('finance.invalidAmount')).not.toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('restores focus to the launch button after the dialog closes', async () => {
    renderPayments();
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/finance/payments', expect.any(Object)));
    const launchButton = screen.getByRole('button', { name: 'finance.recordPayment' });
    act(() => launchButton.focus());
    fireEvent.click(launchButton);

    expect(screen.getByRole('dialog', { name: 'finance.recordPayment' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));

    await waitFor(() => expect(launchButton).toHaveFocus());
  });

  it('explains the invoice ID field and constrains the numeric inputs', async () => {
    renderPayments();
    await openRecordPayment();

    expect(screen.getByRole('spinbutton', { name: 'finance.invoiceId' })).toHaveAttribute('min', '1');
    expect(screen.getByRole('spinbutton', { name: 'finance.invoiceId' })).toHaveAttribute('step', '1');
    expect(screen.getByText('finance.enterInvoiceId')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: 'finance.amount' })).toHaveAttribute('min', '0.01');
    expect(screen.getByRole('spinbutton', { name: 'finance.amount' })).toHaveAttribute('step', '0.01');
  });

  it('names the payment method and page-size select inputs without breaking accessible labels', async () => {
    renderPayments();
    await openRecordPayment();

    expect(screen.getByRole('combobox', { name: 'finance.paymentMethod' })).toBeInTheDocument();
    expect(document.getElementById('payment-method-label')).not.toHaveAttribute('for');
    const selectInputNames = [...document.querySelectorAll<HTMLInputElement>('input.MuiSelect-nativeInput')]
      .map((input) => input.name);
    expect(selectInputNames).toEqual(expect.arrayContaining(['rowsPerPage', 'paymentMethod']));
  });
});
