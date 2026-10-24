import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import apiClient from '../../services/apiClient';
import { UserManagement } from './UserManagement';

jest.mock('../../services/apiClient', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() } }));
jest.mock('react-i18next', () => {
  const translate = (key: string) => key;
  return { useTranslation: () => ({ t: translate }) };
});

const users = [{
  userId: 6,
  username: 'teacher6',
  email: 'teacher6@example.test',
  firstName: 'Mina',
  lastName: 'Rai',
  role: 'Class_Teacher',
  roleName: 'Class Teacher',
  status: 'active' as const,
  createdAt: '2026-10-20T00:00:00.000Z',
}];

const renderPage = () => render(
  <ThemeProvider theme={createTheme()}>
    <UserManagement />
  </ThemeProvider>,
);

describe('UserManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiClient.get).mockImplementation(async (url) => (
      url === '/api/v1/users/stats'
        ? { data: { data: { total: 1, active: 1, inactive: 0, suspended: 0 } } }
        : { data: { data: users, meta: { total: 1 } } }
    ) as Awaited<ReturnType<typeof apiClient.get>>);
    jest.mocked(apiClient.post).mockResolvedValue({ data: { success: true } } as Awaited<ReturnType<typeof apiClient.post>>);
  });

  it('loads users and builds a least-privilege create request with required fields', async () => {
    renderPage();
    expect(await screen.findByText('@teacher6')).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/users?page=1&limit=10');

    fireEvent.click(screen.getByRole('button', { name: 'userManagement.addUser' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'userManagement.firstName' }), { target: { value: 'Tara' } });
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'userManagement.username' }), { target: { value: 'tara7' } });
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'common.email' }), { target: { value: 'tara7@example.test' } });
    const passwordInput = dialog.querySelector<HTMLInputElement>('input[type="password"]');
    expect(passwordInput).not.toBeNull();
    fireEvent.change(passwordInput as HTMLInputElement, { target: { value: 'StrongPass123' } });
    fireEvent.mouseDown(within(dialog).getByRole('combobox', { name: 'userManagement.role' }));
    expect(screen.queryByRole('option', { name: /School Admin|Municipality Admin/i })).not.toBeInTheDocument();
    fireEvent.click(await screen.findByRole('option', { name: 'Class Teacher' }));

    const createButton = within(dialog).getByRole('button', { name: 'userManagement.create' });
    expect(createButton).toBeDisabled();
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'userManagement.lastName' }), { target: { value: 'Shah' } });
    expect(createButton).toBeEnabled();
    fireEvent.click(createButton);

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/api/v1/users', expect.objectContaining({
      username: 'tara7',
      email: 'tara7@example.test',
      firstName: 'Tara',
      lastName: 'Shah',
      password: 'StrongPass123',
      roleId: 'Class_Teacher',
      status: 'active',
    })));
    expect(await screen.findByText('userManagement.createSuccess')).toBeInTheDocument();
  });

  it('requires explicit confirmation before deleting a user', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    renderPage();
    await screen.findByText('@teacher6');
    fireEvent.click(screen.getByRole('button', { name: 'userManagement.actionsFor' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'userManagement.delete' }));

    expect(confirmSpy).toHaveBeenCalledWith('userManagement.confirmDelete');
    expect(apiClient.delete).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
