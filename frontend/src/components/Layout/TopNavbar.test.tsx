import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelector } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { TopNavbar } from './TopNavbar';
import apiClient from '../../services/apiClient';

const mockNavigate = jest.fn();

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
  useDispatch: () => jest.fn(),
}));

jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => mockNavigate }));
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));
jest.mock('../common/OfflineIndicator', () => ({ OfflineIndicator: () => null }));
jest.mock('../common/LiteModeIndicator', () => ({ LiteModeIndicator: () => null }));
jest.mock('../ThemeToggle', () => ({ ThemeToggle: () => null }));
jest.mock('../AccessibilitySettings', () => ({ AccessibilitySettings: () => null }));
jest.mock('../LanguageSwitcher', () => ({ LanguageSwitcher: () => null }));
jest.mock('../NotificationBell/NotificationBell', () => ({ NotificationBell: () => null }));

describe('TopNavbar global search', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    jest.mocked(useSelector).mockReturnValue({
      user: { firstName: 'QA', username: 'qa-admin', role: 'School_Admin' },
    } as never);
    jest.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url.includes('/students?')) {
        return { data: { data: [{ studentId: 123, studentCode: 'QA-123', firstNameEn: 'Codex', lastNameEn: 'Student' }] } } as never;
      }
      return { data: { data: [] } } as never;
    });
  });

  it('searches students and navigates to the selected student', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter><ThemeProvider theme={createTheme()}><TopNavbar sidebarWidth={260} onMobileMenu={jest.fn()} /></ThemeProvider></MemoryRouter>,
    );

    await user.type(screen.getByRole('combobox', { name: 'Search modules, students, invoices' }), 'Codex');
    const result = await screen.findByRole('option', { name: /Codex Student/ });
    await user.click(result);

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('/students?')));
    expect(mockNavigate).toHaveBeenCalledWith('/students/123');
  });
});
