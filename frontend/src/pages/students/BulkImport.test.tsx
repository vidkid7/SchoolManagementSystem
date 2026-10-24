import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { apiClient } from '../../services/apiClient';
import { BulkImport } from './BulkImport';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

jest.mock('../../hooks/useSlugNavigate', () => ({
  useSlugNavigate: () => jest.fn(),
}));

jest.mock('../../hooks/useNepaliNumbers', () => ({
  useNepaliNumbers: () => ({ formatNumber: (value: number | string) => String(value) }),
}));

jest.mock('../../services/apiClient', () => ({ apiClient: { get: jest.fn(), post: jest.fn() } }));

const renderPage = () => render(
  <ThemeProvider theme={createTheme()}>
    <BulkImport />
  </ThemeProvider>,
);

const validFile = () => new File(
  ['spreadsheet-content'],
  'students.xlsx',
  { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
);

describe('BulkImport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiClient.get).mockResolvedValue({ data: new Blob(['template']) } as Awaited<ReturnType<typeof apiClient.get>>);
    jest.mocked(apiClient.post).mockResolvedValue({
      data: {
        success: true,
        data: {
          totalRows: 2,
          successCount: 1,
          errorCount: 1,
          skippedCount: 0,
          errors: [{ row: 3, field: 'email', message: 'Invalid email address' }],
        },
      },
    } as Awaited<ReturnType<typeof apiClient.post>>);
  });

  it('rejects unsupported files and prevents their upload', async () => {
    const { container } = renderPage();
    const input = container.querySelector('#file-upload') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['not excel'], 'students.txt', { type: 'text/plain' })] } });

    expect(await screen.findByText('bulkImport.invalidFile')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'bulkImport.upload' })).toBeDisabled();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('uploads a valid spreadsheet and displays counts and row errors from the backend response', async () => {
    const { container } = renderPage();
    const input = container.querySelector('#file-upload') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [validFile()] } });
    expect(await screen.findByText('students.xlsx')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'bulkImport.upload' }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith(
      '/api/v1/students/bulk-import',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    ));
    expect(await screen.findByText('bulkImport.success: 1')).toBeInTheDocument();
    expect(screen.getByText('bulkImport.failed: 1')).toBeInTheDocument();
    expect(screen.getByText('email: Invalid email address')).toBeInTheDocument();
  });

  it('downloads the student import template as a blob', async () => {
    const createObjectURL = jest.fn(() => 'blob:test-template');
    Object.defineProperty(window.URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'bulkImport.downloadTemplate' }));

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/api/v1/students/import-template', { responseType: 'blob' }));
    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    createObjectURL.mockRestore();
    click.mockRestore();
  });
});
