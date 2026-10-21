import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { SubjectTeachersView } from './SubjectTeachersView';

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => jest.fn() }));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

describe('SubjectTeachersView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockImplementation((path: string) => {
      if (path === '/api/v1/academic/years') {
        return Promise.resolve({ data: { data: [{ academicYearId: 11, isCurrent: true }] } });
      }
      if (path === '/api/v1/academic/classes') {
        return Promise.resolve({ data: { data: [{ classId: 1, gradeLevel: 1, section: 'K' }] } });
      }
      if (path === '/api/v1/academic/subjects') {
        return Promise.resolve({ data: { data: [{ subjectId: 1, nameEn: 'Science' }] } });
      }
      if (path === '/api/v1/staff/class/1/subject/1/teachers?academicYearId=11') {
        return Promise.resolve({ data: { data: [] } });
      }
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });
  });

  it('keeps the empty-state heading order sequential without turning the metric into a heading', async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter initialEntries={['/KMC/academic/classes/1/subjects/1/teachers']}>
          <Routes>
            <Route
              path='/:municipalitySlug/academic/classes/:classId/subjects/:subjectId/teachers'
              element={<SubjectTeachersView />}
            />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Science Teachers - Grade 1 - K', level: 4 })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'No Teachers Assigned', level: 5 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '0' })).not.toBeInTheDocument();
  });
});
