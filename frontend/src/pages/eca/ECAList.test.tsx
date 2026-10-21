import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { ECAList } from './ECAList';

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) =>
    selector({ auth: { user: { userId: 1, role: 'School_Admin' } } }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => jest.fn() }));

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const renderPage = () => render(
  <ThemeProvider theme={createTheme()}>
    <MemoryRouter><ECAList /></MemoryRouter>
  </ThemeProvider>,
);

describe('ECAList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApiClient.get.mockImplementation(async (url: string) => {
      if (url === '/staff') {
        return { data: { data: [{ staffId: 7, firstNameEn: 'Test', lastNameEn: 'Coordinator', status: 'active' }] } } as any;
      }
      if (url === '/academic/years/current') {
        return { data: { data: { academicYearId: 8 } } } as any;
      }
      return { data: { data: [], meta: { total: 0 } } } as any;
    });
    mockedApiClient.post.mockResolvedValue({ data: { success: true } } as any);
  });

  it('clears a prior required-name error after a corrected ECA is created', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'eca.createEca' }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'eca.create' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('ECA name is required.');
    expect(mockedApiClient.post).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByRole('textbox', { name: 'eca.ecaName' }), {
      target: { value: 'Synthetic QA ECA' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'eca.create' }));

    await waitFor(() => expect(mockedApiClient.post).toHaveBeenCalledWith('/eca', expect.objectContaining({
      name: 'Synthetic QA ECA',
      coordinatorId: 7,
      academicYearId: 8,
    })));
    await waitFor(() => expect(screen.queryByText('ECA name is required.')).not.toBeInTheDocument());
    expect(await screen.findByText('eca.ecaCreatedSuccess')).toBeInTheDocument();
  });

  it('clears validation feedback when the ECA dialog is canceled', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'eca.createEca' }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'eca.create' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('ECA name is required.');
    fireEvent.click(within(dialog).getByRole('button', { name: 'eca.cancel' }));

    expect(screen.queryByText('ECA name is required.')).not.toBeInTheDocument();
  });
});
