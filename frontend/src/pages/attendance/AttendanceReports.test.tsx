import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import { AttendanceReports } from './AttendanceReports';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn().mockResolvedValue({ data: { data: [] } }) },
}));

jest.mock('../../components/YearSelectableDatePicker/YearSelectableDatePicker', () => ({
  YearSelectableDateField: ({ label, value, onChange }: {
    label: string;
    value: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  }) => <input aria-label={label} value={value} onChange={onChange} />,
}));

describe('AttendanceReports accessibility', () => {
  it('associates labels with report type, class, and section filters', async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <AttendanceReports />
      </ThemeProvider>,
    );

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/academic/classes'));

    expect(screen.getByRole('combobox', { name: 'common.reportType' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'common.class (common.optional)' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'common.section (common.optional)' })).toBeInTheDocument();
  });

  it('waits for Generate before showing an empty report result', async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <AttendanceReports />
      </ThemeProvider>,
    );

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/academic/classes'));
    fireEvent.change(screen.getByRole('textbox', { name: 'common.startDate' }), {
      target: { value: '2025-01-01' },
    });

    expect(screen.queryByText('common.noRecordsFound')).not.toBeInTheDocument();
    expect(screen.getByText('common.generateReport')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'common.generate' }));

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith(
      '/attendance/student/report',
      expect.objectContaining({ params: expect.objectContaining({ dateFrom: expect.any(String) }) }),
    ));
    expect(await screen.findByText('common.noRecordsFound')).toBeInTheDocument();
  });
});
