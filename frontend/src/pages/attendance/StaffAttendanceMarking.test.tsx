import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import { StaffAttendanceMarking } from './StaffAttendanceMarking';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('../../components/YearSelectableDatePicker/YearSelectableDatePicker', () => ({
  YearSelectableDateField: ({ label, value }: { label: string; value: string }) => (
    <input aria-label={label} value={value} readOnly />
  ),
}));

describe('StaffAttendanceMarking', () => {
  beforeEach(() => {
    jest.mocked(apiClient.get).mockResolvedValue({
      data: {
        data: [{
          staffId: 12,
          firstNameEn: 'QA',
          lastNameEn: 'Staff',
          designation: 'Teacher',
          department: 'academic',
        }],
      },
    } as any);
  });

  it('offers the departments returned by the staff API and filters using the exact stored value', async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <StaffAttendanceMarking />
      </ThemeProvider>,
    );

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith(
      '/staff',
      { params: { status: 'active' } },
    ));
    expect(await screen.findByText('QA Staff')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'attendance.department' }));
    fireEvent.click(await screen.findByRole('option', { name: 'academic' }));

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith(
      '/staff',
      { params: { status: 'active', department: 'academic' } },
    ));
  });
});
