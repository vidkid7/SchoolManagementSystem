import { render, screen, waitFor } from '@testing-library/react';
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
  YearSelectableDateField: ({ label }: { label: string }) => <input aria-label={label} />,
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
});
