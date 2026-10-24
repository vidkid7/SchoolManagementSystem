import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AcademicYears } from './AcademicYears';
import apiClient from '../../services/apiClient';

const currentAcademicYear = {
  academicYearId: 30001,
  name: '2083-2084',
  startDateBS: '2083-04-01',
  endDateBS: '2084-03-32',
  startDateAD: '2026-07-17',
  endDateAD: '2027-07-16',
  isCurrent: true,
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../hooks/useCurrentAcademicYear', () => ({
  useCurrentAcademicYear: () => ({
    currentYear: currentAcademicYear,
    academicYears: [currentAcademicYear],
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
  YearSelectableDateField: ({ label, value, onChange }: {
    label: string;
    value?: string;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  }) => <input aria-label={label} value={value ?? ''} onChange={onChange} />,
}));

const renderPage = () => render(
  <ThemeProvider theme={createTheme()}>
    <AcademicYears />
  </ThemeProvider>,
);

beforeEach(() => {
  currentAcademicYear.startDateAD = '2026-07-17';
  currentAcademicYear.endDateAD = '2027-07-16';
  (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [] } });
  (apiClient.post as jest.Mock).mockClear();
});

describe('AcademicYears', () => {
  it('gives the back and year edit icon buttons accessible names', () => {
    renderPage();

    expect(screen.getByRole('button', { name: 'common.back academicYears.title' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'academicYears.editAcademicYear 2083-2084' })).toBeInTheDocument();
  });

  it('clears validation feedback when the year dialog is canceled', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'academicYears.addAcademicYear' }));
    fireEvent.click(screen.getByRole('button', { name: 'common.save' }));
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));

    expect(screen.queryByText('academicYears.fillAllRequiredFields')).not.toBeInTheDocument();
  });

  it('shows year validation inside the dialog and skips the invalid API request', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'academicYears.addAcademicYear' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'common.save' }));

    expect(within(dialog).getByRole('alert')).toHaveTextContent('academicYears.fillAllRequiredFields');
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('prefills Nepal DATEONLY API timestamps without shifting the displayed day', () => {
    currentAcademicYear.startDateAD = '2026-07-16T18:15:00.000Z';
    currentAcademicYear.endDateAD = '2027-07-15T18:15:00.000Z';
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'academicYears.editAcademicYear 2083-2084' }));

    expect(screen.getByRole('textbox', { name: 'academicYears.startDateAD' })).toHaveValue('2026-07-17');
    expect(screen.getByRole('textbox', { name: 'academicYears.endDateAD' })).toHaveValue('2027-07-16');
  });

  it('shows term validation inside the dialog and skips the invalid API request', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'academicYears.terms' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'academicYears.addTerm' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'academicYears.addTerm' }));
    fireEvent.click(screen.getByRole('button', { name: 'common.save' }));

    expect(screen.getByRole('alert')).toHaveTextContent('academicYears.fillAllRequiredFields');
    expect(apiClient.post).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
