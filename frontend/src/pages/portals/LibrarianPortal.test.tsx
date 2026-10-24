import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import LibrarianPortal from './LibrarianPortal';

const mockT = (key: string) => key;

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: mockT }) }));
jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({
    auth: { user: { username: 'librarian.qa', firstName: 'QA' }, accessToken: 'librarian-token' },
  }),
}));
jest.mock('react-router-dom', () => ({ useParams: () => ({ municipalitySlug: 'qa-school' }) }));
jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => jest.fn() }));
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const renderLibrarianPortal = () => render(
  <ThemeProvider theme={createTheme()}>
    <LibrarianPortal />
  </ThemeProvider>,
);

describe('LibrarianPortal read views', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiClient.get).mockImplementation((url) => {
      const data = url.endsWith('/statistics')
        ? { totalBooks: 120, booksIssued: 32, overdue: 4, reservations: 3 }
        : url.endsWith('/books?limit=50')
          ? [{ id: 7, title: 'QA Science Reader', author: 'QA Author', isbn: 'QA-ISBN-7', category: 'Science', copies: 8, availableCopies: 6, status: 'available' }]
          : url.endsWith('/fines?limit=50')
            ? [{ id: 9, studentId: 61, studentName: 'QA Student', bookTitle: 'QA Science Reader', amount: 75, status: 'pending', reason: 'Late return', date: '2026-10-22' }]
            : { username: 'librarian.qa', firstName: 'QA', lastName: 'Librarian', role: 'librarian' };
      return Promise.resolve({ data: { data } } as never);
    });
  });

  it('loads authenticated library data and renders the book and fine views', async () => {
    const user = userEvent.setup();
    renderLibrarianPortal();

    expect(await screen.findByRole('heading', { name: 'portal.librarianPortal' })).toBeInTheDocument();
    expect(screen.getAllByText('120')).toHaveLength(2);
    expect(screen.getAllByText('32')).toHaveLength(2);
    await user.click(screen.getByRole('tab', { name: 'library.books' }));
    expect(screen.getByText('QA Science Reader')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'portal.fines' }));
    expect(screen.getByText('QA Student')).toBeInTheDocument();
    expect(screen.getByText('Late return')).toBeInTheDocument();

    for (const url of [
      '/api/v1/library/statistics',
      '/api/v1/library/books?limit=50',
      '/api/v1/library/fines?limit=50',
      '/api/v1/auth/me',
    ]) {
      expect(apiClient.get).toHaveBeenCalledWith(url, { headers: { Authorization: 'Bearer librarian-token' } });
    }
  });
});
