import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import RefundManagement from './RefundManagement';
import apiClient from '../../services/apiClient';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      'finance.processRefund': 'Process a Refund',
      'finance.paymentId': 'Payment ID',
      'finance.enterPaymentIdToRefund': 'Enter the payment ID to refund',
      'finance.paymentIdRequired': 'Payment ID is required',
      'finance.paymentIdMustBePositiveInteger': 'Enter a positive whole-number payment ID',
      'finance.reason': 'Reason',
      'finance.refundReasonRequired': 'Select a refund reason',
      'finance.remarks': 'Remarks',
      'finance.additionalRefundDetails': 'Additional details about the refund',
      'finance.duplicatePayment': 'Duplicate payment',
      'finance.overpayment': 'Overpayment',
      'finance.studentWithdrawal': 'Student withdrawal',
      'finance.feeWaiver': 'Fee waiver',
      'finance.other': 'Other',
      'finance.noRefunds': 'No refund requests',
      'common.cancel': 'Cancel',
    }[key] ?? key),
  }),
}));

jest.mock('../../services/apiClient');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('RefundManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApiClient.get.mockResolvedValue({ data: { data: [], meta: { total: 0 } } } as any);
  });

  it('shows required field errors and does not submit an empty refund', async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <RefundManagement />
      </ThemeProvider>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Process a Refund' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Process a Refund' }));

    expect(await within(dialog).findByText('Payment ID is required')).toBeInTheDocument();
    expect(within(dialog).getByText('Select a refund reason')).toBeInTheDocument();
    expect(mockedApiClient.post).not.toHaveBeenCalled();
  });

  it('rejects a non-positive or fractional payment ID before sending a request', async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <RefundManagement />
      </ThemeProvider>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Process a Refund' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByRole('spinbutton'), { target: { value: '1.5' } });
    fireEvent.mouseDown(within(dialog).getByRole('combobox'));
    fireEvent.click(await screen.findByRole('option', { name: 'Other' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Process a Refund' }));

    expect(await within(dialog).findByText('Enter a positive whole-number payment ID')).toBeInTheDocument();
    expect(mockedApiClient.post).not.toHaveBeenCalled();
  });
});
