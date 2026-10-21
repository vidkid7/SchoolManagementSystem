import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { ClassTeacherView } from './ClassTeacherView';

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => jest.fn() }));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

describe('ClassTeacherView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockImplementation((path: string) => {
      if (path === '/api/v1/academic/years') {
        return Promise.resolve({ data: { data: [{ academicYearId: 11, isCurrent: true }] } });
      }
      if (path === '/api/v1/academic/classes') {
        return Promise.resolve({ data: { data: [{ classId: 1, gradeLevel: 1, section: 'K' }] } });
      }
      if (path === '/api/v1/staff/class/1/teacher?academicYearId=11') {
        return Promise.resolve({ data: { data: null } });
      }
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });
  });

  it('keeps the no-class-teacher empty-state heading sequential after the page title', async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter initialEntries={['/KMC/academic/classes/1/teacher']}>
          <Routes>
            <Route
              path='/:municipalitySlug/academic/classes/:classId/teacher'
              element={<ClassTeacherView />}
            />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'staff.form.classTeacher - Grade 1 - K', level: 4 })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'staff.classTeacherView.noClassTeacherAssigned', level: 5 })).toBeInTheDocument();
  });
});
