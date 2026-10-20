import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { BulkAdd } from './BulkAdd';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { number?: number }) =>
      key === 'students.removeStudent'
        ? `Remove student ${options?.number}`
        : key === 'bulkImport.invalidFile'
          ? 'Please select a valid Excel or CSV file (.xlsx, .xls, or .csv)'
          : key,
  }),
}));

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

describe('BulkAdd', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gives each student row delete control a distinct accessible name', () => {
    render(
      <MemoryRouter initialEntries={['/KMC/students/bulk-add']}>
        <Routes>
          <Route path="/:municipalitySlug/students/bulk-add" element={<BulkAdd />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'students.addAnother' }));

    expect(screen.getByRole('button', { name: 'Remove student 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove student 2' })).toBeInTheDocument();
  });

  it('clears manual-entry validation feedback when switching to Excel import', () => {
    render(
      <MemoryRouter initialEntries={['/KMC/students/bulk-add']}>
        <Routes>
          <Route path="/:municipalitySlug/students/bulk-add" element={<BulkAdd />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'students.saveAll' }));
    expect(screen.getByRole('alert')).toHaveTextContent('students.fillRequiredFields');

    fireEvent.click(screen.getByRole('tab', { name: 'students.importFromExcel' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('rejects unsupported file types before calling the parse API', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/KMC/students/bulk-add']}>
        <Routes>
          <Route path="/:municipalitySlug/students/bulk-add" element={<BulkAdd />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'students.importFromExcel' }));
    const input = container.querySelector('input[type="file"]');
    expect(input).not.toBeNull();
    fireEvent.change(input!, {
      target: { files: [new File(['invalid'], 'invalid.txt', { type: 'text/plain' })] },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Please select a valid Excel or CSV file');
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
