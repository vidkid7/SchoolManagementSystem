import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { LibraryDashboard } from './LibraryDashboard';

jest.mock('../../services/apiClient', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

function CirculationRouteProbe() {
  const location = useLocation();
  return <div>Circulation route: {location.pathname} {location.state?.openIssueDialog ? 'issue-dialog-requested' : ''}</div>;
}

describe('LibraryDashboard API field mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/library/statistics') {
        return Promise.resolve({ data: { data: {
          totalBooks: 8,
          availableBooks: 6,
          issuedBooks: 2,
          overdueBooks: 1,
          totalMembers: 4,
          collectedFines: 125,
        } } });
      }
      return Promise.resolve({ data: { data: [{
        id: 'circulation-90001',
        type: 'return',
        book: 'QA Library Test Book',
        student: 'QA Library Test Student',
        date: '2026-10-19',
      }] } });
    });
  });

  it('renders the API book, student, and collected-fines fields', async () => {
    render(
      <MemoryRouter initialEntries={['/KMC/library']}>
        <Routes>
          <Route path="/:municipalitySlug/library" element={<LibraryDashboard />} />
          <Route path="/:municipalitySlug/library/books" element={<div>Books route</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'library.libraryDashboard', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'library.recentActivities', level: 2 })).toBeInTheDocument();
    const totalBooksCard = screen.getByRole('button', { name: /library\.totalBooks/ });
    const book = await screen.findByText('QA Library Test Book');
    const activity = book.closest('li');
    expect(activity).not.toBeNull();
    expect(within(activity as HTMLElement).getByText(/QA Library Test Student/)).toBeInTheDocument();
    expect(within(activity as HTMLElement).getByText('return')).toBeInTheDocument();
    expect(screen.getByText('NPR 125')).toBeInTheDocument();
    fireEvent.click(totalBooksCard);
    expect(await screen.findByText('Books route')).toBeInTheDocument();
  });

  it('routes Issue Book to circulation with its dialog requested and Return Books to circulation', async () => {
    render(
      <MemoryRouter initialEntries={['/KMC/library']}>
        <Routes>
          <Route path="/:municipalitySlug/library" element={<LibraryDashboard />} />
          <Route path="/:municipalitySlug/library/circulation" element={<CirculationRouteProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'library.issueBook' }));
    expect(await screen.findByText(/Circulation route: \/KMC\/library\/circulation issue-dialog-requested/)).toBeInTheDocument();
  });

  it('routes Return Books to the issued circulation list', async () => {
    render(
      <MemoryRouter initialEntries={['/KMC/library']}>
        <Routes>
          <Route path="/:municipalitySlug/library" element={<LibraryDashboard />} />
          <Route path="/:municipalitySlug/library/circulation" element={<CirculationRouteProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'library.returnBooks' }));
    expect(await screen.findByText('Circulation route: /KMC/library/circulation')).toBeInTheDocument();
  });
});
