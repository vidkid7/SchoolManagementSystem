import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import HostelPortal from './HostelPortal';

const mockT = (key: string) => key;

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: mockT }) }));
jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({
    auth: {
      user: { username: 'hostel-qa', firstName: 'Hostel QA', role: 'Hostel' },
      accessToken: 'test-token',
    },
  }),
}));
jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => jest.fn() }));
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

const renderHostelPortal = () => render(
  <ThemeProvider theme={createTheme()}>
    <HostelPortal />
  </ThemeProvider>,
);

describe('HostelPortal room management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiClient.get).mockImplementation((url) => {
      const data = url.endsWith('/dashboard')
        ? { summary: { totalStudents: 0, activeStudents: 0, role: 'hostel' }, quickLinks: [] }
        : url.endsWith('/profile')
          ? null
          : url.endsWith('/rooms')
            ? { rooms: [] }
            : url.endsWith('/residents')
              ? { students: [] }
              : url.endsWith('/discipline')
                ? { records: [] }
                : url.endsWith('/visitors')
                  ? { visitors: [] }
                  : url.endsWith('/leaves')
                    ? { leaves: [] }
                    : url.endsWith('/incidents')
                      ? { incidents: [] }
                      : url.endsWith('/mess-menu')
                        ? { menus: [] }
                        : { items: [] };
      return Promise.resolve({ data: { data } } as never);
    });
    jest.mocked(apiClient.post).mockResolvedValue({ data: { success: true } } as never);
  });

  it('blocks room creation when the required room number is blank', async () => {
    const user = userEvent.setup();
    renderHostelPortal();

    await user.click(await screen.findByRole('button', { name: 'hostel.addRoom' }));
    await user.click(screen.getByRole('button', { name: 'common.create' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('hostel.roomNumberRequired');
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('trims and submits a valid room number', async () => {
    const user = userEvent.setup();
    renderHostelPortal();

    await user.click(await screen.findByRole('button', { name: 'hostel.addRoom' }));
    await user.type(screen.getByRole('textbox', { name: 'hostel.roomNumber' }), '  Room 12  ');
    await user.click(screen.getByRole('button', { name: 'common.create' }));

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/v1/hostel/rooms',
      expect.objectContaining({ roomNumber: 'Room 12' }),
      { headers: { Authorization: 'Bearer test-token' } },
    );
  });
});
