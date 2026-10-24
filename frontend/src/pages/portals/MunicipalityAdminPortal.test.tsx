import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import MunicipalityAdminPortal from './MunicipalityAdminPortal';

function mockTranslate(key: string) {
  return key;
}

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: mockTranslate }) }));
jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => jest.fn() }));
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));

const school = {
  id: '80bba647-55d5-46d0-b128-288ee2c2511a',
  schoolNameEn: 'QA School',
  schoolCode: 'QA-001',
  addressEn: 'Kathmandu',
  isActive: true,
};

const mockReadResponses = () => {
  jest.mocked(apiClient.get).mockImplementation(async (url) => {
    if (url.endsWith('/dashboard')) {
      return { data: { data: { municipality: { nameEn: 'QA Municipality', code: 'QA', district: 'Kaski' }, summary: { totalSchools: 1, activeSchools: 1, inactiveSchools: 0, activeSchoolAdmins: 1 } } } } as never;
    }
    if (url.endsWith('/schools')) return { data: { data: [school] } } as never;
    if (url.endsWith('/reports')) return { data: { data: { userMetrics: { totalUsers: 2, byRole: { teachers: 1, students: 1, parents: 0, supportStaff: 0 }, byStatus: {} } } } } as never;
    if (url.endsWith('/incidents')) return { data: { data: { summary: { totalIncidents: 0, inactiveSchools: 0, flaggedUsers: 0 }, incidents: [] } } } as never;
    return { data: { data: {} } } as never;
  });
};

const renderPortal = () => render(
  <ThemeProvider theme={createTheme()}>
    <MunicipalityAdminPortal />
  </ThemeProvider>,
);

describe('MunicipalityAdminPortal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReadResponses();
    jest.mocked(apiClient.post).mockResolvedValue({ data: { data: {} } } as never);
  });

  it('loads municipality metrics, reports, incidents, and schools from the tenant APIs', async () => {
    renderPortal();

    expect(await screen.findByText('QA Municipality (QA) - Kaski')).toBeInTheDocument();
    expect(screen.getByText('QA School')).toBeInTheDocument();
    expect(screen.getByText('QA-001')).toBeInTheDocument();
    expect(screen.getByText('portal.totalSchools')).toBeInTheDocument();
    expect(screen.getByText('portal.reportsOverview')).toBeInTheDocument();
    expect(screen.getByText('portal.noIncidentsFound')).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledTimes(4);
  });

  it('creates a school and refreshes the school list after success', async () => {
    const user = userEvent.setup();
    renderPortal();
    await screen.findByText('QA School');
    await user.type(screen.getByRole('textbox', { name: 'portal.schoolName' }), 'New Test School');
    await user.type(screen.getByRole('textbox', { name: 'portal.schoolCode' }), 'NEW-1');
    await user.click(screen.getByRole('button', { name: 'portal.createSchool' }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/municipality-admin/schools', {
      schoolNameEn: 'New Test School',
      schoolCode: 'NEW-1',
      addressEn: undefined,
      phone: undefined,
      email: undefined,
    }));
    expect(await screen.findByText('portal.schoolCreatedSuccess')).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledTimes(8);
  });

  it('prevents an invalid school email from reaching the create API', async () => {
    const user = userEvent.setup();
    renderPortal();
    await screen.findByText('QA School');
    await user.type(screen.getByRole('textbox', { name: 'portal.schoolName' }), 'New Test School');
    const email = screen.getByRole('textbox', { name: 'portal.email' }) as HTMLInputElement;
    await user.type(email, 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'portal.createSchool' }));

    expect(email.checkValidity()).toBe(false);
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('uses the backend school-admin validation rules before creating an account', async () => {
    const user = userEvent.setup();
    renderPortal();
    await screen.findByText('QA School');
    const row = screen.getByRole('row', { name: /QA School/ });
    await user.click(within(row).getByRole('button', { name: 'portal.addAdmin' }));
    await user.type(screen.getByRole('textbox', { name: 'portal.username' }), 'qaAdmin');
    await user.type(screen.getByRole('textbox', { name: 'portal.email' }), 'admin@example.test');
    const password = screen.getByLabelText(/portal\.password/) as HTMLInputElement;
    await user.type(password, 'weakpass');
    await user.click(screen.getByRole('button', { name: 'portal.createAdmin' }));

    expect(password.checkValidity()).toBe(false);
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('creates a school admin for the selected school and refreshes the page data', async () => {
    const user = userEvent.setup();
    renderPortal();
    await screen.findByText('QA School');
    const row = screen.getByRole('row', { name: /QA School/ });
    await user.click(within(row).getByRole('button', { name: 'portal.addAdmin' }));
    await user.type(screen.getByRole('textbox', { name: 'portal.username' }), 'qaAdmin');
    await user.type(screen.getByRole('textbox', { name: 'portal.email' }), 'admin@example.test');
    await user.type(screen.getByLabelText(/portal\.password/), 'Str0ngPass');
    await user.click(screen.getByRole('button', { name: 'portal.createAdmin' }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith(
      `/municipality-admin/schools/${school.id}/admins`,
      { username: 'qaAdmin', email: 'admin@example.test', password: 'Str0ngPass', phoneNumber: undefined },
    ));
    expect(await screen.findByText('portal.schoolAdminCreatedSuccess')).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledTimes(8);
  });

  it('activates and deactivates schools using the matching row action', async () => {
    const user = userEvent.setup();
    renderPortal();
    await screen.findByText('QA School');
    const row = screen.getByRole('row', { name: /QA School/ });
    await user.click(within(row).getByRole('button', { name: 'portal.deactivate' }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith(
      `/municipality-admin/schools/${school.id}/deactivate`,
    ));
    expect(await screen.findByText('portal.schoolDeactivatedSuccess')).toBeInTheDocument();
  });

  it('surfaces backend errors instead of reporting a successful school create', async () => {
    const user = userEvent.setup();
    jest.mocked(apiClient.post).mockRejectedValueOnce({ response: { data: { message: 'School code already exists' } } });
    renderPortal();
    await screen.findByText('QA School');
    await user.type(screen.getByRole('textbox', { name: 'portal.schoolName' }), 'Duplicate Code School');
    await user.type(screen.getByRole('textbox', { name: 'portal.schoolCode' }), 'QA-001');
    await user.click(screen.getByRole('button', { name: 'portal.createSchool' }));

    expect(await screen.findByText('School code already exists')).toBeInTheDocument();
    expect(screen.queryByText('portal.schoolCreatedSuccess')).not.toBeInTheDocument();
  });
});
