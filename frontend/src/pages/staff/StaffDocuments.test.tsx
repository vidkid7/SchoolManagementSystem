import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import { StaffDocuments } from './StaffDocuments';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), defaults: { baseURL: 'https://api.example.test' } },
}));

const staffDocument = {
  documentId: 77,
  documentName: 'Employment contract',
  mimeType: 'application/pdf',
  documentUrl: '/uploads/documents/staff/42/contract/contract.pdf',
  category: 'contract',
  fileSize: 2048,
  version: 1,
  expiryDate: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const renderDocuments = () => render(
  <ThemeProvider theme={createTheme()}><StaffDocuments staffId={42} /></ThemeProvider>,
);

describe('StaffDocuments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url.endsWith('/statistics')) {
        return { data: { data: { totalDocuments: 1, expiredCount: 0, expiringSoonCount: 0 } } } as never;
      }
      if (url.endsWith('/documents/77')) return { data: { data: staffDocument } } as never;
      return { data: { data: [staffDocument] } } as never;
    });
    jest.mocked(apiClient.post).mockResolvedValue({ data: { data: staffDocument } } as never);
    jest.mocked(apiClient.put).mockResolvedValue({ data: { data: staffDocument } } as never);
    jest.mocked(apiClient.delete).mockResolvedValue({ data: { data: { deleted: true } } } as never);
  });

  it('shows server errors instead of disguising document loading failures as an empty list', async () => {
    jest.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url.endsWith('/statistics')) return { data: { data: {} } } as never;
      throw { response: { status: 500, data: { message: 'Document storage is unavailable' } } };
    });

    renderDocuments();

    expect(await screen.findByText('Document storage is unavailable')).toBeInTheDocument();
    expect(screen.queryByText('staff.doc.uploadToGetStarted')).not.toBeInTheDocument();
  });

  it('opens a document from its backend URL in the details dialog', async () => {
    const open = jest.spyOn(window, 'open').mockImplementation(() => null);
    try {
      renderDocuments();
      await screen.findByText('Employment contract');
      fireEvent.click(screen.getByTitle('staff.doc.viewDetails'));
      await screen.findByText('staff.doc.documentDetails');
      fireEvent.click(screen.getByRole('button', { name: 'staff.doc.openFile' }));

      await waitFor(() => expect(open).toHaveBeenCalledWith(
        'https://api.example.test/uploads/documents/staff/42/contract/contract.pdf',
        '_blank',
      ));
    } finally {
      open.mockRestore();
    }
  });

  it('supports keyboard selection of the expired documents filter', async () => {
    const user = userEvent.setup();
    renderDocuments();
    await screen.findByText('Employment contract');

    const expiredFilter = screen.getByRole('button', { name: /staff\.doc\.expired/ });
    expiredFilter.focus();
    await user.keyboard('{Enter}');

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/api/v1/staff/42/documents/expired'));
    expect(expiredFilter).toHaveAttribute('aria-pressed', 'true');
  });

  it('uploads a selected document using the backend multipart contract', async () => {
    const user = userEvent.setup();
    renderDocuments();
    await screen.findByText('Employment contract');
    await user.click(screen.getByRole('button', { name: 'staff.doc.uploadDocument' }));

    const file = new File(['document contents'], 'license.pdf', { type: 'application/pdf' });
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [file] } });
    await user.click(screen.getByRole('button', { name: 'staff.doc.upload' }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith(
      '/api/v1/staff/42/documents',
      expect.any(FormData),
      expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } }),
    ));
    const formData = jest.mocked(apiClient.post).mock.calls[0][1] as FormData;
    expect(formData.get('documentName')).toBe('license');
    expect(formData.get('category')).toBe('certificate');
    expect(formData.get('document')).toBe(file);
  });

  it('updates document metadata through the edit dialog', async () => {
    const user = userEvent.setup();
    renderDocuments();
    await screen.findByText('Employment contract');
    await user.click(screen.getByTitle('common.edit'));
    const nameField = screen.getByRole('textbox', { name: 'staff.doc.documentName' });
    await user.clear(nameField);
    await user.type(nameField, 'Updated contract');
    await user.click(screen.getByRole('button', { name: 'staff.doc.saveChanges' }));

    await waitFor(() => expect(apiClient.put).toHaveBeenCalledWith('/api/v1/staff/documents/77', {
      documentName: 'Updated contract',
      category: 'contract',
      expiryDate: null,
    }));
  });

  it('does not delete a document when confirmation is cancelled', async () => {
    const confirm = jest.spyOn(window, 'confirm').mockReturnValue(false);
    try {
      renderDocuments();
      await screen.findByText('Employment contract');
      fireEvent.click(screen.getByTitle('common.delete'));
      expect(confirm).toHaveBeenCalled();
      expect(apiClient.delete).not.toHaveBeenCalled();
    } finally {
      confirm.mockRestore();
    }
  });

  it('sends the confirmed document delete request and refreshes the list', async () => {
    const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
    try {
      renderDocuments();
      await screen.findByText('Employment contract');
      fireEvent.click(screen.getByTitle('common.delete'));

      await waitFor(() => expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/staff/documents/77'));
      await waitFor(() => expect(apiClient.get.mock.calls.filter(([url]) => url === '/api/v1/staff/42/documents')).toHaveLength(2));
    } finally {
      confirm.mockRestore();
    }
  });
});
