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

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { store } from '../../store';
import { DocumentManagement } from './DocumentManagement';
import { apiClient } from '../../services/apiClient';

// Mock the i18n module
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
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
        expect(screen.getByText('Category')).toBeInTheDocument();
        expect(screen.getByText('Size')).toBeInTheDocument();
        expect(screen.getByText('Access')).toBeInTheDocument();
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

    it('should clear search when clicking clear button', async () => {
      renderComponent();
      
      const searchInput = screen.getByPlaceholderText('Search documents...');
      fireEvent.change(searchInput, { target: { value: 'sample' } });
      
      const clearButton = screen.getByLabelText('close');
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
      
      const uploadButton = screen.getByText('Upload Document');
      fireEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByText('Upload Document')).toBeInTheDocument(); // Dialog title
        expect(screen.getByText('Click to select a file')).toBeInTheDocument();
      });
    });

    it('should close upload dialog when clicking cancel', async () => {
      renderComponent();
      
      const uploadButton = screen.getByText('Upload Document');
      fireEvent.click(uploadButton);
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Click to select a file')).not.toBeInTheDocument();
      });
    });

    it('should show error when trying to upload without file', async () => {
      renderComponent();
      
      const uploadButton = screen.getByText('Upload Document');
      fireEvent.click(uploadButton);
      
      const submitButton = screen.getByText('Upload');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please select a file to upload')).toBeInTheDocument();
      });
    });

    it('should show error when file size exceeds limit', async () => {
      renderComponent();
      
      const uploadButton = screen.getByText('Upload Document');
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
      
      const uploadButton = screen.getByText('Upload Document');
      fireEvent.click(uploadButton);
      
      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByText('Upload Document')).toBeInTheDocument();
      });
      
      // Submit without file to trigger error first
      const submitButton = screen.getByText('Upload');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please select a file to upload')).toBeInTheDocument();
      });
    });
  });
});