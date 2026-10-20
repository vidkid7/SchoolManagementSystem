import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { LibraryManagement } from './LibraryManagement';

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

function renderLibraryManagement() {
  return render(
    <MemoryRouter initialEntries={['/KMC/library/management']}>
      <Routes>
        <Route path="/:municipalitySlug/library/management" element={<LibraryManagement />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LibraryManagement book issue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/students') {
        return Promise.resolve({ data: { data: [{ studentId: 630001, studentCode: 'SCH001-2026-0234', firstNameEn: 'QA', lastNameEn: 'Student' }] } });
      }
      if (url.startsWith('/library/books')) {
        return Promise.resolve({ data: { data: { books: [{ bookId: 1, accessionNumber: 'QA-CODEX-20261012-001', title: 'QA Test Book', author: 'QA', copies: 1, availableCopies: 1 }], total: 1 } } });
      }
      return Promise.resolve({ data: { data: { circulations: [], total: 0 } } });
    });
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { success: true } });
  });

  it('looks up test records and sends their numeric IDs using the backend contract', async () => {
    renderLibraryManagement();
    expect(await screen.findByText('QA-CODEX-20261012-001')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'library.issueBook' }));

    fireEvent.change(screen.getByRole('combobox', { name: 'library.studentId' }), {
      target: { value: 'SCH001-2026-0234' },
    });
    expect(await screen.findByRole('option', { name: /SCH001-2026-0234/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('option', { name: /SCH001-2026-0234/ }));

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'library.bookAccessionNumber' }));
    expect(await screen.findByRole('option', { name: /QA-CODEX-20261012-001/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('option', { name: /QA-CODEX-20261012-001/ }));
    const issueButtons = screen.getAllByRole('button', { name: 'library.issueBook' });
    fireEvent.click(issueButtons[issueButtons.length - 1]);

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/library/issue', {
      studentId: 630001,
      bookId: 1,
    }));
  });
});
