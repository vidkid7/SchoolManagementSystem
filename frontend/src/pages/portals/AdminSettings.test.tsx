import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import AdminSettings from './AdminSettings';
import apiClient from '../../services/apiClient';

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

jest.mock('react-i18next', () => {
  const t = (key: string) => key;
  return { useTranslation: () => ({ t }) };
});

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('AdminSettings runtime-only controls', () => {
  beforeEach(() => {
    mockedApiClient.get.mockImplementation(async (url: string) => {
      if (url.endsWith('/config/school')) return { data: { data: {} } } as any;
      if (url.endsWith('/date-format')) return { data: { data: {} } } as any;
      return {
        data: {
          data: {
            portalSettings: {
              maxLoginAttempts: 7,
              sessionTimeout: 45,
              enableOfflineMode: false,
              enablePaymentGateway: false,
              backupEnabled: false,
              backupSchedule: 'weekly',
              backupRetention: 14,
            },
          },
        },
      } as any;
    });
    mockedApiClient.put.mockResolvedValue({ data: { success: true } } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('disables informational controls and omits them from saved settings', async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <AdminSettings />
      </ThemeProvider>,
    );

    const securityTab = await screen.findByRole('tab', { name: 'adminSettings.tabs.security' });
    fireEvent.click(securityTab);
    expect(screen.getByRole('spinbutton', { name: 'adminSettings.security.maxLoginAttempts' })).toBeDisabled();
    expect(screen.getByRole('spinbutton', { name: 'adminSettings.security.sessionTimeout' })).toBeDisabled();
    expect(screen.getByText('adminSettings.security.managedNotice')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'adminSettings.tabs.backup' }));
    expect(await screen.findByText('adminSettings.backup.managedNotice')).toBeVisible();
    expect(screen.getByRole('spinbutton', { name: 'adminSettings.backup.retention' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'adminSettings.backup.enableAutomated' })).toBeDisabled();

    fireEvent.click(screen.getByRole('tab', { name: 'adminSettings.tabs.features' }));
    expect(await screen.findByText('adminSettings.features.managedNotice')).toBeVisible();
    expect(screen.getByRole('checkbox', { name: 'adminSettings.features.offlineMode' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'adminSettings.features.paymentGateway' })).toBeDisabled();

    fireEvent.click(screen.getAllByRole('button', { name: 'adminSettings.saveAll' }).at(-1)!);
    await waitFor(() => expect(mockedApiClient.put).toHaveBeenCalledTimes(3));

    const communicationCall = mockedApiClient.put.mock.calls.find(([url]) =>
      url === '/api/v1/communication/settings',
    );
    expect(communicationCall).toBeDefined();
    expect(communicationCall![1].portalSettings).not.toHaveProperty('maxLoginAttempts');
    expect(communicationCall![1].portalSettings).not.toHaveProperty('sessionTimeout');
    expect(communicationCall![1].portalSettings).not.toHaveProperty('enableOfflineMode');
    expect(communicationCall![1].portalSettings).not.toHaveProperty('enablePaymentGateway');
    expect(communicationCall![1].portalSettings).not.toHaveProperty('backupEnabled');
    expect(communicationCall![1].portalSettings).not.toHaveProperty('backupSchedule');
    expect(communicationCall![1].portalSettings).not.toHaveProperty('backupRetention');
  });
});
