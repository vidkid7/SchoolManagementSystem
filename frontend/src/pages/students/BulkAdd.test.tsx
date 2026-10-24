import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { BulkAdd } from './BulkAdd';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string | number>) =>
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

  it('accepts a CSV file and exposes the file selector as a native button', () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { data: [] } });
    const { container } = render(
      <MemoryRouter initialEntries={['/KMC/students/bulk-add']}>
        <Routes>
          <Route path="/:municipalitySlug/students/bulk-add" element={<BulkAdd />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'students.importFromExcel' }));

    const selectFileButton = screen.getByRole('button', { name: 'students.selectFile' });
    expect(selectFileButton.tagName).toBe('BUTTON');
    expect(screen.getByRole('heading', { name: 'students.uploadExcelFile', level: 5 })).toBeInTheDocument();

    const input = container.querySelector('input[type="file"]');
    fireEvent.change(input!, {
      target: { files: [new File(['firstName,lastName'], 'students.csv', { type: 'text/csv' })] },
    });

    return waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/students/parse-excel',
        expect.any(FormData),
        expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } }),
      );
      expect(apiClient.post).not.toHaveBeenCalledWith('/students/bulk-create', expect.anything());
      expect(screen.getByText('students.csv')).toBeInTheDocument();
    });
  });

  it('submits the original Excel file to the validated import endpoint and displays row errors', async () => {
    const previewRows = [{ firstNameEn: 'QA', lastNameEn: 'Student', dateOfBirth: '2010-01-01' }];
    (apiClient.post as jest.Mock)
      .mockResolvedValueOnce({ data: { data: previewRows } })
      .mockRejectedValueOnce({
        response: {
          data: {
            data: {
              successCount: 0,
              errorCount: 1,
              errors: [{ row: 2, field: 'fatherPhone', message: 'Required value is missing' }],
            },
          },
        },
      });
    const { container } = render(
      <MemoryRouter initialEntries={['/KMC/students/bulk-add']}>
        <Routes>
          <Route path="/:municipalitySlug/students/bulk-add" element={<BulkAdd />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'students.importFromExcel' }));
    const file = new File(['student rows'], 'students.csv', { type: 'text/csv' });
    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: { files: [file] },
    });
    await screen.findByText('students.csv');

    fireEvent.click(screen.getByRole('button', { name: 'students.importStudents' }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenLastCalledWith(
        '/students/bulk-import',
        expect.any(FormData),
        expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } }),
      );
      const failureAlert = screen.getAllByRole('alert').find((alert) =>
        alert.textContent?.includes('students.bulkAddPartial'),
      );
      expect(failureAlert).toHaveTextContent('students.bulkAddRowError');
    });

    const submittedFile = (apiClient.post as jest.Mock).mock.calls[1][1].get('file');
    expect(submittedFile).toBe(file);
    expect(apiClient.post).not.toHaveBeenCalledWith('/students/bulk-create', expect.anything());
  });
});
