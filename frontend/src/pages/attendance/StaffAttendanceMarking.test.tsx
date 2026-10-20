import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import { StaffAttendanceMarking } from './StaffAttendanceMarking';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({ data: { data: [{
      staffId: 10,
      firstNameEn: 'QA',
      lastNameEn: 'Staff',
      designation: 'Teacher',
      department: 'academic',
    }] } }),
    post: jest.fn(),
  },
}));

jest.mock('../../components/YearSelectableDatePicker/YearSelectableDatePicker', () => ({
  YearSelectableDateField: ({ label }: { label: string }) => <input aria-label={label} />,
}));

describe('StaffAttendanceMarking accessibility', () => {
  it('names the department filter and each staff status selector', async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <StaffAttendanceMarking />
      </ThemeProvider>,
    );

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/staff', {
      params: { status: 'active' },
    }));

    expect(screen.getByRole('combobox', { name: 'attendance.department' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'QA Staff common.status' })).toBeInTheDocument();
  });
});
