import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { apiClient } from '../../services/apiClient';
import { StudentDetail } from './StudentDetail';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ municipalitySlug: 'KMC', id: '720001' }),
}));

jest.mock('../../hooks/useSlugNavigate', () => ({
  useSlugNavigate: () => jest.fn(),
}));

jest.mock('../../hooks/useNepaliNumbers', () => ({
  useNepaliNumbers: () => ({ formatNumber: (value: number | string) => String(value) }),
}));

jest.mock('../../services/apiClient', () => ({
  apiClient: { get: jest.fn() },
}));

jest.mock('./StudentDocuments', () => () => null);
jest.mock('./StudentLibrary', () => () => null);
jest.mock('./PromoteTransferDialogs', () => ({ PromoteDialog: () => null, TransferDialog: () => null }));

describe('StudentDetail', () => {
  beforeEach(() => {
    jest.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (url === '/api/v1/students/720001') {
        return {
          data: {
            data: {
              id: 720001,
              studentCode: 'SCH001-2026-0237',
              firstNameEn: 'Codex QA Student',
              status: 'active',
              admissionDate: '2026-10-20T00:00:00.000Z',
            },
          },
        } as Awaited<ReturnType<typeof apiClient.get>>;
      }

      return { data: { data: {} } } as Awaited<ReturnType<typeof apiClient.get>>;
    });
  });

  it('shows admission date as a calendar date rather than a raw ISO timestamp', async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <StudentDetail />
      </ThemeProvider>,
    );

    await screen.findByRole('heading', { name: 'Codex QA Student' });
    fireEvent.click(screen.getByRole('tab', { name: 'students.academicInfo' }));

    await waitFor(() => {
      expect(screen.getByText('2026-10-20')).toBeInTheDocument();
    });
    expect(screen.queryByText('2026-10-20T00:00:00.000Z')).not.toBeInTheDocument();
  });
});
