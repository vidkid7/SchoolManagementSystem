import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { apiClient } from '../../services/apiClient';
import { StudentList } from './StudentList';

const mockNavigate = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ municipalitySlug: 'KMC' }),
}));

jest.mock('../../hooks/useSlugNavigate', () => ({
  useSlugNavigate: () => mockNavigate,
}));

jest.mock('../../hooks/useNepaliNumbers', () => ({
  useNepaliNumbers: () => ({
    formatNumber: (value: number | string) => String(value),
    formatWithSeparators: (value: number | string) => String(value),
  }),
}));

jest.mock('../../services/apiClient', () => ({
  apiClient: { get: jest.fn() },
}));

const student = {
  studentId: 42,
  studentCode: 'SCH001-2026-0042',
  firstNameEn: 'Asha',
  lastNameEn: 'Sharma',
  status: 'active',
  class: { classId: 2, gradeLevel: 2, section: 'B' },
};

const renderPage = () => render(
  <ThemeProvider theme={createTheme()}>
    <StudentList />
  </ThemeProvider>,
);

describe('StudentList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (url === '/academic/classes') {
        return { data: { data: [{ section: 'B' }] } } as Awaited<ReturnType<typeof apiClient.get>>;
      }
      if (url.includes('/search/fuzzy')) {
        return { data: { data: [{ student, score: 0.9, matchType: 'fuzzy', matchedField: 'name' }] } } as Awaited<ReturnType<typeof apiClient.get>>;
      }
      return { data: { data: [student], meta: { total: 45 } } } as Awaited<ReturnType<typeof apiClient.get>>;
    });
  });

  it('loads students with the first page, shows results, and navigates to the student actions', async () => {
    renderPage();

    expect(await screen.findByText('Asha Sharma')).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/students?page=1&limit=20');
    expect(screen.getByText('45')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('common.view'));
    expect(mockNavigate).toHaveBeenCalledWith('/students/42');
  });

  it('returns to page one when a status filter changes from a later page', async () => {
    renderPage();
    await screen.findByText('Asha Sharma');
    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/api/v1/students?page=2&limit=20'));

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'students.status' }));
    fireEvent.click(await screen.findByRole('option', { name: 'userManagement.suspended' }));

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/api/v1/students?page=1&limit=20&status=suspended'));
  });

  it('uses the fuzzy-search endpoint and shows match confidence for a search term', async () => {
    renderPage();
    await screen.findByText('Asha Sharma');
    fireEvent.change(screen.getByLabelText('common.search'), { target: { value: 'Asa' } });
    fireEvent.click(screen.getByRole('button', { name: 'students.fuzzySearch AI' }));

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith(
      '/api/v1/students/search/fuzzy?query=Asa&threshold=0.4&limit=50',
    ), { timeout: 1500 });
    expect(await screen.findByText('FUZZY')).toBeInTheDocument();
  });

  it('shows a retryable error instead of stale or empty results when loading students fails', async () => {
    let shouldFail = true;
    jest.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (url === '/academic/classes') {
        return { data: { data: [] } } as Awaited<ReturnType<typeof apiClient.get>>;
      }
      if (shouldFail) {
        shouldFail = false;
        throw new Error('API unavailable');
      }
      return { data: { data: [student], meta: { total: 1 } } } as Awaited<ReturnType<typeof apiClient.get>>;
    });

    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('academic.failedToLoad');
    expect(screen.queryByText('Asha Sharma')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'common.retry' }));

    expect(await screen.findByText('Asha Sharma')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
