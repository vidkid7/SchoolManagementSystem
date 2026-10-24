import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import apiClient from '../../services/apiClient';
import { AttendanceSettings } from './AttendanceSettings';

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const renderPage = () => render(
  <ThemeProvider theme={createTheme()}>
    <AttendanceSettings />
  </ThemeProvider>,
);

describe('AttendanceSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiClient.get).mockResolvedValue({
      data: { data: { id: 'default', minimumAttendancePercentage: 75, correctionWindowHours: 24, allowTeacherCorrection: true } },
    } as Awaited<ReturnType<typeof apiClient.get>>);
    jest.mocked(apiClient.post).mockResolvedValue({ data: { success: true } } as Awaited<ReturnType<typeof apiClient.post>>);
    jest.mocked(apiClient.put).mockResolvedValue({ data: { success: true } } as Awaited<ReturnType<typeof apiClient.put>>);
  });

  it('creates a persisted rule when the server returned its unsaved default sentinel', async () => {
    renderPage();
    const percentage = await screen.findByRole('spinbutton', { name: 'attendance.minimumAttendancePercentage' });
    fireEvent.change(percentage, { target: { value: '80' } });
    fireEvent.click(screen.getByRole('button', { name: 'attendance.saveSettings' }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/config/attendance-rules', expect.objectContaining({
      minimumAttendancePercentage: 80,
    })));
    expect(apiClient.put).not.toHaveBeenCalled();
  });

  it('updates an existing rule and shows the saved state', async () => {
    jest.mocked(apiClient.get).mockResolvedValue({
      data: { data: { id: 81, minimumAttendancePercentage: 72, correctionWindowHours: 12, allowTeacherCorrection: false } },
    } as Awaited<ReturnType<typeof apiClient.get>>);
    renderPage();
    const percentage = await screen.findByRole('spinbutton', { name: 'attendance.minimumAttendancePercentage' });
    fireEvent.change(percentage, { target: { value: '78' } });
    fireEvent.click(screen.getByRole('button', { name: 'attendance.saveSettings' }));

    await waitFor(() => expect(apiClient.put).toHaveBeenCalledWith('/config/attendance-rules/81', expect.objectContaining({
      minimumAttendancePercentage: 78,
    })));
    expect(await screen.findByRole('alert')).toHaveTextContent('attendance.settingsSavedSuccess');
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
