import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { BookCatalog } from './BookCatalog';

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

function renderBookCatalog(initialAddDialogOpen = false) {
  return render(
    <MemoryRouter initialEntries={['/KMC/library/books']}>
      <Routes>
        <Route path="/:municipalitySlug/library/books" element={<BookCatalog initialAddDialogOpen={initialAddDialogOpen} />} />
      </Routes>
    </MemoryRouter>,
  );
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => { resolve = resolvePromise; });
  return { promise, resolve };
}

const bookRequests = () => (apiClient.get as jest.Mock).mock.calls.filter(([url]) => url === '/library/books');

describe('BookCatalog search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debounces search input before calling the books API', async () => {
    (apiClient.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/library/categories') return Promise.resolve({ data: { data: [] } });
      return Promise.resolve({ data: { data: { books: [], total: 0 } } });
    });
    renderBookCatalog();

    await waitFor(() => expect(bookRequests()).toHaveLength(1));
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: 'QA-20261019-001' } });

    await act(async () => new Promise((resolve) => setTimeout(resolve, 100)));
    expect(bookRequests()).toHaveLength(1);

    await waitFor(() => expect(bookRequests()).toHaveLength(2));
    expect(bookRequests()[1][1].params.search).toBe('QA-20261019-001');
  });

  it('ignores an earlier response that arrives after a newer search result', async () => {
    const initialResponse = deferred<{ data: { data: { books: any[]; total: number } } }>();
    (apiClient.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/library/categories') return Promise.resolve({ data: { data: [] } });
      if (bookRequests().length === 1) {
        return initialResponse.promise;
      }
      return Promise.resolve({ data: { data: { books: [], total: 0 } } });
    });
    renderBookCatalog();
    await waitFor(() => expect(bookRequests()).toHaveLength(1));

    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: 'QA-20261019-001' } });
    await waitFor(() => expect(bookRequests()).toHaveLength(2));
    await waitFor(() => expect(screen.getByText('library.noBooksFound')).toBeInTheDocument());
    expect(screen.queryByText('library.noBooksFoundAdd')).not.toBeInTheDocument();

    await act(async () => {
      initialResponse.resolve({
        data: {
          data: {
            books: [{ bookId: 2, accessionNumber: 'QA-20261019-002', title: 'Stale search result', author: 'QA', category: 'Textbook', copies: 1, availableCopies: 1 }],
            total: 1,
          },
        },
      });
      await initialResponse.promise;
    });

    expect(screen.queryByText('Stale search result')).not.toBeInTheDocument();
    expect(screen.getByText('library.noBooksFound')).toBeInTheDocument();
  });
});

describe('BookCatalog form validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/library/categories') return Promise.resolve({ data: { data: [{ categoryId: 1, name: 'Fiction' }] } });
      return Promise.resolve({ data: { data: { books: [], total: 0 } } });
    });
  });

  it('shows field errors and does not send an invalid empty book to the API', async () => {
    renderBookCatalog(true);

    fireEvent.click(screen.getByRole('button', { name: 'library.addBook' }));

    expect(await screen.findAllByText('validation.required')).toHaveLength(4);
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
