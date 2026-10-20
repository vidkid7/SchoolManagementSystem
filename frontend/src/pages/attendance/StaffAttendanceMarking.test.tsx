import type { ChangeEvent } from 'react';
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
  YearSelectableDateField: ({ label, value, onChange }: { label: string; value: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) => (
    <input aria-label={label} value={value} onChange={onChange} />
  ),
}));

describe('StaffAttendanceMarking', () => {
  beforeEach(() => {
    jest.mocked(apiClient.get).mockImplementation(async (url: any) => {
      if (url === '/staff') return { data: { data: [{
          staffId: 12,
          firstNameEn: 'QA',
          lastNameEn: 'Staff',
          designation: 'Teacher',
          department: 'academic',
        }] } } as any;
      if (url === '/attendance/staff/report') return { data: { data: { records: [] } } } as any;
      return { data: { data: [] } } as any;
    });
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
    expect(apiClient.get).toHaveBeenCalledWith('/attendance/staff/report', expect.objectContaining({
      params: expect.objectContaining({ dateFrom: expect.any(String), dateTo: expect.any(String), limit: 1000 }),
    }));
  });

  it('loads persisted status and remarks for the selected date', async () => {
    jest.mocked(apiClient.get).mockImplementation(async (url: any) => {
      if (url === '/staff') return { data: { data: [{
        staffId: 12,
        firstNameEn: 'QA',
        lastNameEn: 'Staff',
        designation: 'Teacher',
        department: 'academic',
      }] } } as any;
      if (url === '/attendance/staff/report') return { data: { data: { records: [{
        staffId: 12,
        status: 'late',
        remarks: 'Already saved',
      }] } } } as any;
      return { data: { data: [] } } as any;
    });

    render(
      <ThemeProvider theme={createTheme()}>
        <StaffAttendanceMarking />
      </ThemeProvider>,
    );

    expect(await screen.findByRole('combobox', { name: 'QA Staff common.status' })).toHaveTextContent('attendance.late');
    expect(screen.getByPlaceholderText('attendance.addRemarks')).toHaveValue('Already saved');
  });

  it('reloads attendance when the selected date changes', async () => {
    jest.mocked(apiClient.get).mockImplementation(async (url: any, config: any) => {
      if (url === '/staff') return { data: { data: [{
        staffId: 12,
        firstNameEn: 'QA',
        lastNameEn: 'Staff',
        designation: 'Teacher',
        department: 'academic',
      }] } } as any;
      if (url === '/attendance/staff/report') {
        const isRecordedDate = config?.params?.dateFrom !== '2001-02-03';
        return { data: { data: { records: isRecordedDate ? [{ staffId: 12, status: 'late', remarks: 'Saved on that date' }] : [] } } } as any;
      }
      return { data: { data: [] } } as any;
    });

    render(
      <ThemeProvider theme={createTheme()}>
        <StaffAttendanceMarking />
      </ThemeProvider>,
    );

    expect(await screen.findByRole('combobox', { name: 'QA Staff common.status' })).toHaveTextContent('attendance.late');
    fireEvent.change(screen.getByRole('textbox', { name: 'attendance.date' }), { target: { value: '2001-02-03' } });

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/attendance/staff/report', {
      params: { dateFrom: '2001-02-03', dateTo: '2001-02-03', limit: 1000 },
    }));
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'QA Staff common.status' })).toHaveTextContent('attendance.present'));
    expect(screen.getByPlaceholderText('attendance.addRemarks')).toHaveValue('');
  });
});
