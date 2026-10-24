import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { useSelector } from 'react-redux';
import Profile from './Profile';

const navigateMock = jest.fn();
jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => navigateMock }));
jest.mock('react-redux', () => ({ useSelector: jest.fn() }));

const adminUser = {
  username: 'vidkid',
  firstName: 'Dhiraj',
  lastName: 'Thapa',
  email: 'dhiraj@example.test',
  role: 'School_Admin',
  municipalityName: 'Kathmandu',
  municipalityCode: 'KMC',
};

const renderPage = () => render(
  <ThemeProvider theme={createTheme()}>
    <Profile />
  </ThemeProvider>,
);

describe('Profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows account identity and provides password and admin navigation', () => {
    jest.mocked(useSelector).mockImplementation((selector: (state: unknown) => unknown) => selector({ auth: { user: adminUser } }));
    renderPage();

    expect(screen.getByRole('heading', { name: 'Dhiraj Thapa' })).toBeInTheDocument();
    expect(screen.getByText('dhiraj@example.test')).toBeInTheDocument();
    expect(screen.getByText('Kathmandu')).toBeInTheDocument();
    expect(screen.getByText('KMC')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Change Password' }));
    expect(navigateMock).toHaveBeenCalledWith('/change-password');
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(navigateMock).toHaveBeenCalledWith('/settings');
    fireEvent.click(screen.getByRole('button', { name: 'Manage users' }));
    expect(navigateMock).toHaveBeenCalledWith('/users');
  });

  it('shows limited account actions for a non-admin and falls back to username', () => {
    jest.mocked(useSelector).mockImplementation((selector: (state: unknown) => unknown) => selector({
      auth: { user: { username: 'teacher1', role: 'Class_Teacher', email: 'teacher@example.test' } },
    }));
    renderPage();

    expect(screen.getByRole('heading', { name: 'teacher1' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Change Password' })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Settings' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Manage users' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
    expect(navigateMock).toHaveBeenCalledWith('/change-password');
  });
});
