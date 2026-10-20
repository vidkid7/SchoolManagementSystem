/**
 * Document Management Page Unit Tests
 * Requirements: 27.1, 27.5, 27.6
 */

// Mock the apiClient module before any imports
jest.mock('../../services/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { store } from '../../store';
import { DocumentManagement } from './DocumentManagement';
import { apiClient } from '../../services/apiClient';

// Mock the i18n module
jest.mock('react-i18next', () => ({
  useTranslation: () => {
    const translations = require('../../i18n/locales/en/translation.json');
    return {
      t: (key: string) => key.split('.').reduce((value: any, part: string) => value?.[part], translations) ?? key,
    };
  },
}));

// Mock window.URL.createObjectURL
global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();

// Create a test theme
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
});

// Mock document data
const mockDocuments = [
  {
    documentId: 1,
    documentNumber: 'DOC-001',
    name: 'Sample Document',
    originalName: 'sample.pdf',
    description: 'A sample document',
    category: 'academic',
    mimeType: 'application/pdf',
    size: 1024000,
    version: 1,
    uploadedBy: 1,
    uploadedByName: 'Admin User',
    accessLevel: 'private',
    tags: ['test', 'sample'],
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    documentId: 2,
    documentNumber: 'DOC-002',
    name: 'Image Document',
    originalName: 'image.jpg',
    description: 'A sample image',
    category: 'administrative',
    mimeType: 'image/jpeg',
    size: 2048000,
    version: 1,
    uploadedBy: 2,
    uploadedByName: 'Teacher User',
    accessLevel: 'restricted',
    tags: [],
    status: 'active',
    createdAt: '2024-01-16T11:00:00Z',
    updatedAt: '2024-01-16T11:00:00Z',
  },
];

const renderComponent = () => {
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <DocumentManagement />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
};

describe('DocumentManagement Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation - return documents
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: {
        success: true,
        data: mockDocuments,
        meta: { total: 2 },
      },
    });
  });

  describe('Initial Rendering', () => {
    it('should render the page title', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Document Management')).toBeInTheDocument();
      });
    });

    it('should render the upload button', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Upload Document')).toBeInTheDocument();
      });
    });

    it('should render the search input', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search documents...')).toBeInTheDocument();
      });
    });

    it('should render filter dropdowns', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByLabelText('Category')).toBeInTheDocument();
        expect(screen.getByLabelText('Status')).toBeInTheDocument();
        expect(screen.getByLabelText('Access Level')).toBeInTheDocument();
      });
    });

    it('should display document table headers', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(within(screen.getByRole('table')).getByRole('columnheader', { name: 'Category' })).toBeInTheDocument();
        expect(screen.getByText('Size')).toBeInTheDocument();
        expect(within(screen.getByRole('table')).getByRole('columnheader', { name: 'Access Level' })).toBeInTheDocument();
        expect(screen.getByText('Uploaded By')).toBeInTheDocument();
        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });
    });
  });

  describe('Document List', () => {
    it('should display documents when loaded', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Sample Document')).toBeInTheDocument();
        expect(screen.getByText('Image Document')).toBeInTheDocument();
      });
    });

    it('should update document metadata from the row actions menu', async () => {
      const documents = mockDocuments.map((document) => ({ ...document }));
      (apiClient.get as jest.Mock).mockImplementation(() => Promise.resolve({
        data: { success: true, data: documents, meta: { total: documents.length } },
      }));
      (apiClient.put as jest.Mock).mockImplementation(async (_url: string, changes: Partial<typeof documents[number]>) => {
        documents[0] = { ...documents[0], ...changes };
        return { data: { success: true, data: documents[0] } };
      });

      renderComponent();
      const row = await screen.findByRole('row', { name: /Sample Document/ });
      fireEvent.click(within(row).getByRole('button', { name: 'Actions' }));
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Edit' }));

      const dialog = await screen.findByRole('dialog', { name: 'Edit Document' });
      fireEvent.change(within(dialog).getByRole('textbox', { name: 'Document Name' }), {
        target: { value: 'Updated Sample Document' },
      });
      fireEvent.change(within(dialog).getByRole('textbox', { name: 'Description' }), {
        target: { value: 'Updated document details' },
      });
      fireEvent.click(within(dialog).getByRole('button', { name: 'Save Changes' }));

      await waitFor(() => {
        expect(apiClient.put).toHaveBeenCalledWith('/documents/1', expect.objectContaining({
          name: 'Updated Sample Document',
          description: 'Updated document details',
        }));
        expect(screen.getByText('Updated Sample Document')).toBeInTheDocument();
      });
    });

    it('should move focus into Version History without hiding the focused trigger', async () => {
      (apiClient.get as jest.Mock).mockImplementation((url: string) => {
        if (url === '/documents/1/versions') {
          return Promise.resolve({ data: { success: true, data: [{
            version: 1,
            name: 'Sample Document',
            size: 1024000,
            createdAt: '2024-01-15T10:00:00Z',
          }] } });
        }
        return Promise.resolve({ data: { success: true, data: mockDocuments, meta: { total: 2 } } });
      });

      renderComponent();
      const row = await screen.findByRole('row', { name: /Sample Document/ });
      const actions = within(row).getByRole('button', { name: 'Actions' });
      fireEvent.click(actions);
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Version History' }));
      const blurSpy = jest.spyOn(HTMLElement.prototype, 'blur');
      const blurCallsAfterMenuClose = blurSpy.mock.calls.length;

      await screen.findByRole('dialog', { name: /Version History/ });
      await waitFor(() => expect(blurSpy.mock.calls.length).toBeGreaterThan(blurCallsAfterMenuClose));
      blurSpy.mockRestore();
    });

    it('should fetch and render an authenticated PDF preview and release it on close', async () => {
      const previewBlob = new Blob(['%PDF-1.4 synthetic QA preview'], { type: 'application/pdf' });
      (global.URL.createObjectURL as jest.Mock).mockReturnValue('blob:qa-preview');
      (apiClient.get as jest.Mock).mockImplementation((url: string) => {
        if (url === '/documents/1/preview') return Promise.resolve({ data: previewBlob });
        return Promise.resolve({
          data: { success: true, data: mockDocuments, meta: { total: 2 } },
        });
      });

      renderComponent();
      fireEvent.click(await screen.findByText('Sample Document'));

      expect(await screen.findByTitle('Sample Document')).toHaveAttribute('src', 'blob:qa-preview');
      expect(apiClient.get).toHaveBeenCalledWith('/documents/1/preview', { responseType: 'blob' });

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      await waitFor(() => expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:qa-preview'));
    });

    it('should show loading state initially', async () => {
      (apiClient.get as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          data: { success: true, data: mockDocuments, meta: { total: 2 } }
        }), 100))
      );
      
      renderComponent();
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });

    it('should show empty state when no documents', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: {
          success: true,
          data: [],
          meta: { total: 0 },
        },
      });
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('No documents found')).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filtering', () => {
    it('should update search filter when typing', async () => {
      renderComponent();
      
      const searchInput = screen.getByPlaceholderText('Search documents...');
      fireEvent.change(searchInput, { target: { value: 'sample' } });
      
      await waitFor(() => {
        expect(searchInput).toHaveValue('sample');
      });
    });

    it('debounces document search requests until typing pauses', async () => {
      renderComponent();

      await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(1));
      (apiClient.get as jest.Mock).mockClear();

      const searchInput = screen.getByPlaceholderText('Search documents...');
      fireEvent.change(searchInput, { target: { value: 'Q' } });
      fireEvent.change(searchInput, { target: { value: 'QA' } });
      fireEvent.change(searchInput, { target: { value: 'QA Audit' } });

      expect(apiClient.get).not.toHaveBeenCalled();

      await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(1), { timeout: 2000 });
      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('search=QA+Audit'));
    });

    it('should clear search when clicking clear button', async () => {
      renderComponent();
      
      const searchInput = screen.getByPlaceholderText('Search documents...');
      fireEvent.change(searchInput, { target: { value: 'sample' } });
      
      const clearButton = screen.getByRole('button', { name: 'Clear' });
      fireEvent.click(clearButton);
      
      await waitFor(() => {
        expect(searchInput).toHaveValue('');
      });
    });

    it('should update category filter when selecting', async () => {
      renderComponent();
      
      const categorySelect = screen.getByLabelText('Category');
      fireEvent.mouseDown(categorySelect);
      
      await waitFor(() => {
        expect(screen.getByText('Academic')).toBeInTheDocument();
      });
    });

    it('should clear all filters when clicking clear filters button', async () => {
      renderComponent();
      
      const searchInput = screen.getByPlaceholderText('Search documents...');
      fireEvent.change(searchInput, { target: { value: 'sample' } });
      
      const clearFiltersButton = screen.getByText('Clear Filters');
      fireEvent.click(clearFiltersButton);
      
      await waitFor(() => {
        expect(searchInput).toHaveValue('');
      });
    });
  });

  describe('Upload Functionality', () => {
    it('should open upload dialog when clicking upload button', async () => {
      renderComponent();
      
      const uploadButton = screen.getByRole('button', { name: 'Upload Document' });
      fireEvent.click(uploadButton);
      
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByRole('heading', { name: 'Upload Document' })).toBeInTheDocument();
        expect(within(dialog).getByRole('button', { name: 'Click to select a file' })).toBeInTheDocument();
      });
    });

    it('should open the file picker from the keyboard-accessible control', () => {
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: 'Upload Document' }));

      const picker = screen.getByRole('button', { name: 'Click to select a file' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = jest.spyOn(fileInput, 'click').mockImplementation(() => {});

      fireEvent.keyDown(picker, { key: 'Enter' });

      expect(clickSpy).toHaveBeenCalledTimes(1);
    });

    it('should close upload dialog when clicking cancel', async () => {
      renderComponent();
      
      const uploadButton = screen.getByRole('button', { name: 'Upload Document' });
      fireEvent.click(uploadButton);
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should show error when trying to upload without file', async () => {
      renderComponent();
      
      const uploadButton = screen.getByRole('button', { name: 'Upload Document' });
      fireEvent.click(uploadButton);
      
      expect(screen.getByRole('button', { name: 'Upload', exact: true })).toBeDisabled();
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it('should show error when file size exceeds limit', async () => {
      renderComponent();
      
      const uploadButton = screen.getByRole('button', { name: 'Upload Document' });
      fireEvent.click(uploadButton);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const largeFile = new File(['content'], 'large.pdf', { type: 'application/pdf' });
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 }); // 11MB
      fireEvent.change(fileInput, { target: { files: [largeFile] } });
      
      await waitFor(() => {
        expect(screen.getByText('File size exceeds maximum limit of 10MB')).toBeInTheDocument();
      });
    });
  });

  describe('API Error Handling', () => {
    it('should handle API error gracefully', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue({
        response: { data: { error: { message: 'Failed to load documents' } } },
      });
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load documents')).toBeInTheDocument();
      });
    });

    it('should show success message after upload', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({
        data: { success: true, message: 'Document uploaded successfully' },
      });
      
      renderComponent();
      
      const uploadButton = screen.getByRole('button', { name: 'Upload Document' });
      fireEvent.click(uploadButton);
      
      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test content'], 'test-document.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [file] } });
      fireEvent.click(screen.getByRole('button', { name: 'Upload', exact: true }));
      
      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith(
          '/documents',
          expect.any(FormData),
          expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } }),
        );
        expect(screen.getByText('Document uploaded successfully')).toBeInTheDocument();
      });
    });
  });
});
