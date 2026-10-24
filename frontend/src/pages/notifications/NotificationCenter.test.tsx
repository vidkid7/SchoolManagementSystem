import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import { NotificationCenter } from './NotificationCenter';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));

jest.mock('../../components/YearSelectableDatePicker/YearSelectableDatePicker', () => ({
  YearSelectableDateTimeField: ({ label, value, onChange }: {
    label: string;
    value?: string;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  }) => <input aria-label={label} value={value ?? ''} onChange={onChange} />,
}));

const renderPage = () => render(
  <ThemeProvider theme={createTheme()}>
    <NotificationCenter />
  </ThemeProvider>,
);

describe('NotificationCenter bulk SMS', () => {
  let confirmSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [] } });
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { success: true } });
  });

  afterEach(() => confirmSpy.mockRestore());

  it('asks for confirmation and does not send when the user cancels', async () => {
    renderPage();

    const sendBulkButton = await screen.findByRole('button', { name: 'notifications.sendBulkToAll' });
    expect(sendBulkButton).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox', { name: 'notifications.message' }), {
      target: { value: 'School will be closed tomorrow.' },
    });
    expect(sendBulkButton).toBeEnabled();
    fireEvent.click(sendBulkButton);

    expect(confirmSpy).toHaveBeenCalledWith('notifications.confirmBulkSms');
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('sends bulk SMS to the configured roles only after confirmation', async () => {
    confirmSpy.mockReturnValue(true);
    renderPage();

    const sendBulkButton = await screen.findByRole('button', { name: 'notifications.sendBulkToAll' });
    fireEvent.change(screen.getByRole('textbox', { name: 'notifications.message' }), {
      target: { value: 'School will be closed tomorrow.' },
    });
    fireEvent.click(sendBulkButton);

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith(
      '/api/v1/communication/sms/bulk',
      {
        message: 'School will be closed tomorrow.',
        targetRoles: ['student', 'parent', 'staff'],
        scheduleTime: undefined,
      },
    ));
  });

  it('shows the provider-unavailable response instead of a false success message', async () => {
    confirmSpy.mockReturnValue(true);
    (apiClient.post as jest.Mock).mockRejectedValueOnce({
      response: {
        data: {
          error: { message: 'Bulk SMS delivery is not configured' },
        },
      },
    });
    renderPage();

    const messageField = await screen.findByRole('textbox', { name: 'notifications.message' });
    fireEvent.change(messageField, { target: { value: 'School will be closed tomorrow.' } });
    fireEvent.click(screen.getByRole('button', { name: 'notifications.sendBulkToAll' }));

    expect(await screen.findByText('Bulk SMS delivery is not configured')).toBeInTheDocument();
    expect(screen.queryByText('notifications.bulkSmsSentSuccess')).not.toBeInTheDocument();
    expect(messageField).toHaveValue('School will be closed tomorrow.');
  });

  it('treats an HTTP 207 partial SMS response as an error and keeps the message available', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      status: 207,
      data: {
        success: false,
        error: { message: 'Some SMS messages could not be delivered' },
        data: { successfulDeliveries: 1, failedDeliveries: 1 },
      },
    });
    renderPage();

    const recipientField = await screen.findByRole('textbox', { name: 'notifications.recipients' });
    const messageField = await screen.findByRole('textbox', { name: 'notifications.message' });
    fireEvent.change(recipientField, { target: { value: '9800000000, 9800000001' } });
    fireEvent.change(messageField, { target: { value: 'School will be closed tomorrow.' } });
    fireEvent.click(screen.getByRole('button', { name: 'notifications.sendSms' }));

    expect(await screen.findByText('Some SMS messages could not be delivered')).toBeInTheDocument();
    expect(screen.queryByText('notifications.smsSentSuccess')).not.toBeInTheDocument();
    expect(recipientField).toHaveValue('9800000000, 9800000001');
    expect(messageField).toHaveValue('School will be closed tomorrow.');
  });
});
