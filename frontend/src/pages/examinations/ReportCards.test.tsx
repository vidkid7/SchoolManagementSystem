import { fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { ReportCards } from './ReportCards';

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => jest.fn() }));

jest.mock('../../hooks/useCurrentAcademicYear', () => ({
  useCurrentAcademicYear: () => ({
    currentYear: { academicYearId: 30001, name: '2083-2084' },
    academicYears: [{ academicYearId: 30001, name: '2083-2084' }],
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

describe('ReportCards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockImplementation((path: string) => {
      if (path === '/academic/classes') return Promise.resolve({ data: { data: [{ classId: 1, gradeLevel: 1, section: 'K' }] } });
      if (path === '/academic/terms') return Promise.resolve({ data: { data: [] } });
      return Promise.resolve({ data: { data: [] } });
    });
  });

  it('labels every filter and loads configured terms instead of offering fixed dummy terms', async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter initialEntries={['/KMC/examinations/reports']}>
          <Routes>
            <Route path='/:municipalitySlug/examinations/reports' element={<ReportCards />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    );

    expect(await screen.findByRole('combobox', { name: 'academic.academicYear' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'examinations.term' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'common.class' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'common.section (common.optional)' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'students.student' })).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith('/academic/terms', { params: { academicYearId: '30001' } });

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'examinations.term' }));
    const termOptions = await screen.findByRole('listbox');
    expect(within(termOptions).getByRole('option', { name: 'examinations.noTermsConfigured' })).toHaveAttribute('aria-disabled', 'true');
    expect(within(termOptions).queryByRole('option', { name: 'examinations.firstTerm' })).not.toBeInTheDocument();
  });
});
