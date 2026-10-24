import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import TransportPortal from './TransportPortal';

const mockT = (key: string) => key;

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: mockT }) }));
jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({
    auth: { user: { username: 'qa', role: 'Transport_Manager' }, accessToken: 'qa-token' },
  }),
}));
jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => jest.fn() }));
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

const renderTransportPortal = () => render(
  <ThemeProvider theme={createTheme()}>
    <TransportPortal />
  </ThemeProvider>,
);

describe('TransportPortal required field validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiClient.get).mockImplementation((url) => {
      const data = url.endsWith('/dashboard')
        ? { summary: { totalStudents: 0, activeStudents: 0, role: 'Transport_Manager' } }
        : url.endsWith('/students') ? { students: [] }
          : url.endsWith('/routes') ? { routes: [] }
            : url.endsWith('/vehicles') ? { vehicles: [] }
              : url.endsWith('/pickup-points') ? { pickupPoints: [] }
                : url.endsWith('/drivers') ? { drivers: [] }
                  : url.endsWith('/maintenance') ? { records: [] }
                    : null;
      return Promise.resolve({ data: { data } } as never);
    });
    jest.mocked(apiClient.post).mockResolvedValue({ data: { data: {} } } as never);
  });

  it('blocks blank vehicle, pickup point, driver, and maintenance submissions', async () => {
    const user = userEvent.setup();
    renderTransportPortal();
    await screen.findByRole('heading', { name: 'portal.transportManagement' });

    const cases = [
      { tab: 'transport.vehicles', add: 'transport.addVehicle', dialog: 'transport.addNewVehicle', error: 'transport.vehicleRequiredFields' },
      { tab: 'transport.pickupPoints', add: 'transport.addPickupPoint', dialog: 'transport.addPickupPointTitle', error: 'transport.pickupRequiredFields' },
      { tab: 'transport.drivers', add: 'transport.addDriver', dialog: 'transport.addNewDriver', error: 'transport.driverRequiredFields' },
      { tab: 'transport.maintenance', add: 'transport.addRecord', dialog: 'transport.addMaintenanceRecord', error: 'transport.maintenanceVehicleRequired' },
    ];

    for (const item of cases) {
      await user.click(screen.getByRole('tab', { name: item.tab }));
      await user.click(screen.getByRole('button', { name: item.add }));
      await screen.findByRole('heading', { name: item.dialog });
      await user.click(screen.getByRole('button', { name: 'common.create' }));
      expect(await screen.findByText(item.error)).toBeInTheDocument();
      expect(apiClient.post).not.toHaveBeenCalled();
      await user.click(screen.getByRole('button', { name: 'common.cancel' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    }
  });
});
