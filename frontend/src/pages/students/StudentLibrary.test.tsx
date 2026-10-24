import { render, screen, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import StudentLibrary from './StudentLibrary';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));
jest.mock('../../hooks/useNepaliNumbers', () => ({
  useNepaliNumbers: () => ({ formatNumber: (value: number | string) => String(value) }),
}));
jest.mock('framer-motion', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  const animationProps = new Set(['initial', 'animate', 'exit', 'whileHover', 'whileTap', 'transition', 'variants']);
  return {
    motion: {
      create: (Component: React.ElementType) => (props: Record<string, unknown>) => {
        const cleanProps = Object.fromEntries(Object.entries(props).filter(([key]) => !animationProps.has(key)));
        return React.createElement(Component, cleanProps);
      },
    },
  };
});

const renderLibrary = (studentId = 780001) => render(
  <ThemeProvider theme={createTheme()}><StudentLibrary studentId={studentId} /></ThemeProvider>,
);

describe('StudentLibrary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads and renders the backend circulation contract and statistics', async () => {
    jest.mocked(apiClient.get).mockResolvedValue({ data: { data: {
      records: [{
        id: 91,
        bookTitle: 'The Local QA Book',
        bookCode: 'QA-BOOK-91',
        author: 'QA Author',
        borrowDate: '2026-10-01T00:00:00.000Z',
        dueDate: '2026-10-15T00:00:00.000Z',
        status: 'overdue',
        fine: 35,
      }],
      stats: { totalBorrowed: 1, currentlyBorrowed: 0, returned: 0, overdue: 1, totalFines: 35 },
    } } } as never);

    renderLibrary();

    expect(await screen.findByText('The Local QA Book')).toBeInTheDocument();
    expect(screen.getByText('QA-BOOK-91')).toBeInTheDocument();
    expect(screen.getAllByText('रू 35')).toHaveLength(2);
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/students/780001/library');
    const row = screen.getByRole('row', { name: /The Local QA Book/ });
    expect(within(row).getByText('QA Author')).toBeInTheDocument();
    expect(within(row).getByText('library.overdue')).toBeInTheDocument();
  });

  it('shows the empty state for an empty backend result', async () => {
    jest.mocked(apiClient.get).mockResolvedValue({ data: { data: { records: [], stats: {
      totalBorrowed: 0, currentlyBorrowed: 0, returned: 0, overdue: 0, totalFines: 0,
    } } } } as never);

    renderLibrary();

    expect(await screen.findByText('library.noRecords')).toBeInTheDocument();
  });

  it('shows an error state when the request fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.mocked(apiClient.get).mockRejectedValue(new Error('offline'));

    try {
      renderLibrary();

      expect(await screen.findByText('messages.error')).toBeInTheDocument();
      expect(screen.getByText('library.noRecords')).toBeInTheDocument();
    } finally {
      consoleError.mockRestore();
    }
  });
});
