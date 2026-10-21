import { render, screen } from '@testing-library/react';
import { ArchiveManagement } from './ArchiveManagement';
import apiClient from '../../services/apiClient';

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('ArchiveManagement responsive header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [] } });
  });

  it('wraps the title and archive actions so they remain reachable on narrow screens', async () => {
    render(<ArchiveManagement />);

    const header = screen.getByRole('heading', { name: 'archive.title' }).closest('.MuiPaper-root');
    const headerRow = header?.firstElementChild as HTMLElement;
    const actionGroup = headerRow.lastElementChild as HTMLElement;

    expect(await screen.findByText('archive.noArchives')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'archive.cleanupButton' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'archive.archiveButton' })).toBeInTheDocument();
    expect(getComputedStyle(headerRow).flexWrap).toBe('wrap');
    expect(getComputedStyle(actionGroup).flexWrap).toBe('wrap');
  });
});
