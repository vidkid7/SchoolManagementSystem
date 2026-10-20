import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import { PaymentGateways } from './PaymentGateways';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { name?: string }) => {
      if (key === 'finance.enableGateway') return `Enable ${options?.name}`;
      if (key === 'finance.gatewayTestMode') return `Test mode for ${options?.name}`;
      return key;
    },
  }),
}));

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

describe('PaymentGateways accessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiClient.get).mockImplementation((url) => {
      if (url === '/finance/payment-gateways/config') {
        return Promise.resolve({ data: { data: {
          esewa: { name: 'eSewa', enabled: false, merchantId: '', secretKey: '', testMode: true },
          khalti: { name: 'Khalti', enabled: false, merchantId: '', secretKey: '', testMode: true },
          imepay: { name: 'IME Pay', enabled: false, merchantId: '', secretKey: '', testMode: true },
        } } } as unknown as Awaited<ReturnType<typeof apiClient.get>>);
      }
      if (url === '/finance/payment-gateways/transactions?limit=10') {
        return Promise.resolve({ data: { data: [] } } as unknown as Awaited<ReturnType<typeof apiClient.get>>);
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
  });

  it('gives each gateway and test-mode switch a distinct accessible name', async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <PaymentGateways />
      </ThemeProvider>,
    );

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/finance/payment-gateways/config'));

    expect(await screen.findByRole('checkbox', { name: 'Enable eSewa' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Test mode for eSewa' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Enable Khalti' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Enable IME Pay' })).toBeInTheDocument();
  });
});
