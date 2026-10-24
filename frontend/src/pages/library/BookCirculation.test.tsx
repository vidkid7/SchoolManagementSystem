import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { BookCirculation } from './BookCirculation';

const mockT = (key: string) => key;

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: mockT }) }));
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));

const circulation = {
  circulationId: 44,
  bookTitle: 'QA Circulation Book',
  accessionNumber: 'QA-BOOK-44',
  memberName: 'Test Student',
  memberType: 'student',
  issueDate: '2026-10-01',
  dueDate: '2026-10-30',
  status: 'issued',
};

const renderBookCirculation = () => render(
  <MemoryRouter>
    <ThemeProvider theme={createTheme()}>
      <BookCirculation />
    </ThemeProvider>
  </MemoryRouter>,
);

describe('BookCirculation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiClient.get).mockResolvedValue({
      data: { data: [circulation], meta: { total: 1 } },
    } as never);
    jest.mocked(apiClient.post).mockResolvedValue({ data: { success: true } } as never);
  });

  it('renders the issued circulation row loaded from the API', async () => {
    const warnings: string[] = [];
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation((message) => warnings.push(String(message)));
    renderBookCirculation();

    expect(await screen.findByText('QA Circulation Book')).toBeInTheDocument();
    expect(screen.getByText('QA-BOOK-44')).toBeInTheDocument();
    expect(screen.getByText('Test Student')).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith('/library/circulation', {
      params: { status: 'issued', page: 1, limit: 20 },
    });
    expect(warnings.some((message) => message.includes('out-of-range value'))).toBe(false);
    consoleWarn.mockRestore();
  });

  it('shows a load error instead of claiming the circulation list is empty', async () => {
    jest.mocked(apiClient.get).mockRejectedValue(new Error('service unavailable'));
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    renderBookCirculation();

    expect(await screen.findByRole('alert')).toHaveTextContent('library.failedToLoadCirculation');
    expect(screen.getByText('library.circulationUnavailable')).toBeInTheDocument();
    expect(screen.queryByText('library.noIssuedBooks')).not.toBeInTheDocument();
    consoleError.mockRestore();
  });

  it('returns the selected book using its circulation ID and displayed fine amount', async () => {
    const user = userEvent.setup();
    renderBookCirculation();

    await screen.findByText('QA Circulation Book');
    await user.click(screen.getByRole('button', { name: 'library.return' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('QA Circulation Book');
    await user.click(screen.getByRole('button', { name: 'library.confirmReturn' }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/library/return/44', { fineAmount: 0 }));
  });

  it('does not send an issue request without a selected book and student', async () => {
    const user = userEvent.setup();
    renderBookCirculation();

    await user.click(await screen.findByRole('button', { name: 'library.issueBook' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'library.issueBook' })).toBeDisabled();

    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
