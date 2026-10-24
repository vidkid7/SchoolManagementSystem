import { render, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { StudentForm } from './StudentForm';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => jest.fn() }));
jest.mock('../../hooks/useNepaliNumbers', () => ({ useNepaliNumbers: () => ({ formatNumber: (value: number) => String(value) }) }));

jest.mock('../../services/apiClient', () => {
  const client = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() };
  return { __esModule: true, apiClient: client, default: client };
});

describe('StudentForm privacy', () => {
  it('does not print fetched student fields to the browser console', async () => {
    jest.clearAllMocks();
    jest.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (url === '/academic/classes') return { data: { data: [] } } as never;
      if (url.endsWith('/siblings')) return { data: { data: [] } } as never;
      return {
        data: {
          data: {
            firstNameEn: 'Synthetic',
            lastNameEn: 'QA Student',
            studentId: 'QA-001',
            gender: 'female',
          },
        },
      } as never;
    });
    const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    try {
      render(
        <ThemeProvider theme={createTheme()}>
          <MemoryRouter initialEntries={['/KMC/students/12/edit']}>
            <Routes>
              <Route path="/KMC/students/:id/edit" element={<StudentForm />} />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>,
      );

      await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/api/v1/students/12'));
      expect(consoleLog).not.toHaveBeenCalled();
    } finally {
      consoleLog.mockRestore();
    }
  });
});
