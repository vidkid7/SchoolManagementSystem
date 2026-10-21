import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { StudentFeeSearch } from './StudentFeeSearch';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ municipalitySlug: 'KMC' }),
}));

jest.mock('../../hooks/useSlugNavigate', () => ({
  useSlugNavigate: () => jest.fn(),
}));

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

describe('StudentFeeSearch', () => {
  it('gives the fee status selector its visible label as an accessible name', () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <StudentFeeSearch />
      </ThemeProvider>,
    );

    expect(screen.getByRole('combobox', { name: 'finance.feeStatus' })).toBeInTheDocument();
  });
});
