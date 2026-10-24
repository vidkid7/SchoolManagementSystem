import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import { StudentDocuments } from './StudentDocuments';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

const backendDocument = {
  id: 501,
  filename: 'birth_certificate-unique.pdf',
  url: '/uploads/documents/students/780001/birth_certificate/birth_certificate-unique.pdf',
  fileUrl: '/api/v1/students/780001/documents/files/birth_certificate/birth_certificate-unique.pdf',
  category: 'birth_certificate',
  isExpired: false,
  isExpiringSoon: false,
};

describe('StudentDocuments', () => {
  beforeEach(() => {
    jest.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url.endsWith('/statistics')) {
        return { data: { data: { total: 1, active: 1, expired: 0, expiringSoon: 0 } } } as never;
      }
      if (url.endsWith('/documents/501')) {
        return { data: { data: { ...backendDocument, mimeType: 'application/pdf', size: 2048 } } } as never;
      }
      if (url.includes('/documents/files/')) return { data: new Blob(['pdf'], { type: 'application/pdf' }) } as never;
      return { data: { data: [backendDocument] } } as never;
    });
    jest.mocked(apiClient.post).mockResolvedValue({ data: { data: [] } } as never);
    jest.mocked(apiClient.delete).mockResolvedValue({ data: { data: { deleted: true } } } as never);
  });

  it('maps the backend document fields for display and file opening', async () => {
    const popup = { opener: window, location: { href: 'about:blank' }, close: jest.fn() } as unknown as Window;
    const open = jest.spyOn(window, 'open').mockImplementation(() => popup);
    const originalCreateObjectURL = URL.createObjectURL;
    const createObjectUrl = jest.fn(() => 'blob:qa-student-document');
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectUrl });
    try {
      render(<ThemeProvider theme={createTheme()}><StudentDocuments studentId={780001} /></ThemeProvider>);

      expect(await screen.findByText('birth_certificate-unique.pdf')).toBeInTheDocument();
      const documentRow = screen.getByRole('row', { name: /birth_certificate-unique\.pdf/ });
      expect(within(documentRow).getAllByText('-')).toHaveLength(2);
      await userEvent.click(screen.getByTitle('documents.view'));
      await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith(backendDocument.fileUrl, { responseType: 'blob' }));
      expect(open).toHaveBeenCalledWith('about:blank', '_blank');
      expect(popup.location.href).toBe('blob:qa-student-document');

      await userEvent.click(screen.getByTitle('documents.viewDetails'));
      expect(await screen.findByText('application/pdf')).toBeInTheDocument();
      expect(screen.getByText('2 KB')).toBeInTheDocument();
      expect(screen.getByText('students.createdAt:')).toBeInTheDocument();
    } finally {
      open.mockRestore();
      if (originalCreateObjectURL) {
        Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: originalCreateObjectURL });
      } else {
        Reflect.deleteProperty(URL, 'createObjectURL');
      }
    }
  });

  it('allows keyboard selection of the expiring-soon filter', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider theme={createTheme()}><StudentDocuments studentId={780001} /></ThemeProvider>);

    const expiringFilter = await screen.findByRole('button', { name: /documents.expiringSoon/ });
    expiringFilter.focus();
    await user.keyboard('{Enter}');

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/api/v1/students/780001/documents/expiring-soon'));
    await waitFor(() => expect(screen.getByRole('button', { name: /documents.expiringSoon/ })).toHaveAttribute('aria-pressed', 'true'));
  });

  it('sends a selected document through the documented multipart upload field', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider theme={createTheme()}><StudentDocuments studentId={780001} /></ThemeProvider>);
    await screen.findByText('birth_certificate-unique.pdf');

    await user.click(screen.getByRole('button', { name: 'documents.uploadDocument' }));
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['pdf'], 'passport.pdf', { type: 'application/pdf' })] } });
    await user.clear(screen.getByRole('textbox', { name: 'documents.documentName' }));
    await user.type(screen.getByRole('textbox', { name: 'documents.documentName' }), 'Passport');
    await user.click(screen.getByRole('button', { name: 'common.upload' }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith(
      '/api/v1/students/780001/documents',
      expect.any(FormData),
      expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } }),
    ));
    const formData = jest.mocked(apiClient.post).mock.calls[0][1] as FormData;
    expect(formData.get('name')).toBe('Passport');
    expect(formData.get('category')).toBe('birth_certificate');
    expect(formData.get('documents')).toBeInstanceOf(File);
  });
});
