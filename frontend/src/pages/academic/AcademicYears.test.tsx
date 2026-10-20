import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AcademicYears } from './AcademicYears';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../hooks/useCurrentAcademicYear', () => ({
  useCurrentAcademicYear: () => ({
    currentYear: null,
    academicYears: [],
    loading: false,
    error: null,
  }),
}));

jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => jest.fn() }));

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));

jest.mock('../../components/YearSelectableDatePicker/YearSelectableDatePicker', () => ({
  YearSelectableDateField: ({ label }: { label: string }) => <input aria-label={label} />,
}));

const renderPage = () => render(
  <ThemeProvider theme={createTheme()}>
    <AcademicYears />
  </ThemeProvider>,
);

describe('AcademicYears', () => {
  it('clears validation feedback when the year dialog is canceled', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'academicYears.addAcademicYear' }));
    fireEvent.click(screen.getByRole('button', { name: 'common.save' }));
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));

    expect(screen.queryByText('academicYears.fillAllRequiredFields')).not.toBeInTheDocument();
  });
});
