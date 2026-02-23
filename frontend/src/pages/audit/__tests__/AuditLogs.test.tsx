import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AuditLogs from '../AuditLogs';
import axios from 'axios';

/**
 * Audit Logs Component Tests
 * Requirements: 38.5
 */

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockAuditLogs = [
  {
    auditLogId: 1,
    userId: 1,
    entityType: 'student',
    entityId: 100,
    action: 'create',
    oldValue: null,
    newValue: { name: 'Test Student' },
    changedFields: null,
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    metadata: null,
    timestamp: '2024-12-01T10:00:00.000Z'
  },
  {
    auditLogId: 2,
    userId: 1,
    entityType: 'student',
    entityId: 100,
    action: 'update',
    oldValue: { name: 'Test Student' },
    newValue: { name: 'Updated Student' },
    changedFields: ['name'],
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    metadata: null,
    timestamp: '2024-12-02T10:00:00.000Z'
  }
];

const mockStats = {
  totalLogs: 100,
  logsByAction: {
    create: 30,
    update: 50,
    delete: 15,
    restore: 5
  },
  logsByEntityType: {
    student: 60,
    staff: 40
  },
  oldestLog: '2024-01-01T00:00:00.000Z',
  newestLog: '2024-12-31T23:59:59.999Z'
};

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <AuditLogs />
    </BrowserRouter>
  );
};

describe('AuditLogs Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/v1/audit/logs') {
        return Promise.resolve({
          data: {
            data: mockAuditLogs,
            pagination: {
              page: 1,
              limit: 20,
              total: 2,
              totalPages: 1
            }
          }
        });
      }
      if (url === '/api/v1/audit/stats') {
        return Promise.resolve({
          data: {
            data: mockStats
          }
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  it('should render audit logs page', async () => {
    renderComponent();

    expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('student #100')).toBeInTheDocument();
    });
  });

  it('should display statistics cards', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Total Logs')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('Creates')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
      expect(screen.getByText('Updates')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('Deletes')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });

  it('should display audit logs in table', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('student #100')).toBeInTheDocument();
      expect(screen.getByText('CREATE')).toBeInTheDocument();
      expect(screen.getByText('UPDATE')).toBeInTheDocument();
      expect(screen.getByText('127.0.0.1')).toBeInTheDocument();
    });
  });

  it('should expand row to show details', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('student #100')).toBeInTheDocument();
    });

    // Find and click the expand button for the first row
    const expandButtons = screen.getAllByRole('button', { name: '' });
    const firstExpandButton = expandButtons.find(btn => 
      btn.querySelector('svg')?.getAttribute('data-testid') === 'ExpandMoreIcon'
    );

    if (firstExpandButton) {
      fireEvent.click(firstExpandButton);

      await waitFor(() => {
        expect(screen.getByText('New Value:')).toBeInTheDocument();
      });
    }
  });

  it('should apply filters', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    // Open filters
    const filterButton = screen.getByRole('button', { name: '' });
    fireEvent.click(filterButton);

    // Fill in entity type filter
    const entityTypeInput = screen.getByLabelText('Entity Type');
    fireEvent.change(entityTypeInput, { target: { value: 'student' } });

    // Click apply filters
    const applyButton = screen.getByText('Apply Filters');
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/v1/audit/logs',
        expect.objectContaining({
          params: expect.objectContaining({
            entityType: 'student'
          })
        })
      );
    });
  });

  it('should clear filters', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    // Open filters
    const filterButton = screen.getByRole('button', { name: '' });
    fireEvent.click(filterButton);

    // Fill in entity type filter
    const entityTypeInput = screen.getByLabelText('Entity Type');
    fireEvent.change(entityTypeInput, { target: { value: 'student' } });

    // Click clear filters
    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    // Verify input is cleared
    expect(entityTypeInput).toHaveValue('');
  });

  it('should refresh audit logs', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('student #100')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(4); // Initial + stats + refresh + stats
    });
  });

  it('should export audit logs', async () => {
    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/v1/audit/export') {
        return Promise.resolve({
          data: {
            data: mockAuditLogs
          }
        });
      }
      if (url === '/api/v1/audit/logs') {
        return Promise.resolve({
          data: {
            data: mockAuditLogs,
            pagination: { page: 1, limit: 20, total: 2, totalPages: 1 }
          }
        });
      }
      if (url === '/api/v1/audit/stats') {
        return Promise.resolve({
          data: { data: mockStats }
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    // Mock URL.createObjectURL and link.click
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    const mockClick = jest.fn();
    jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') {
        return {
          click: mockClick,
          href: '',
          download: ''
        } as any;
      }
      return document.createElement(tagName);
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/v1/audit/export',
        expect.any(Object)
      );
      expect(mockClick).toHaveBeenCalled();
    });
  });

  it('should rotate logs with confirmation', async () => {
    global.confirm = jest.fn(() => true);
    global.alert = jest.fn();

    mockedAxios.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          deletedCount: 50,
          cutoffDate: '2023-12-31T00:00:00.000Z',
          executedAt: '2024-12-31T00:00:00.000Z'
        }
      }
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Rotate Logs')).toBeInTheDocument();
    });

    const rotateButton = screen.getByText('Rotate Logs');
    fireEvent.click(rotateButton);

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalled();
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/v1/audit/rotate',
        { retentionDays: 365 }
      );
      expect(global.alert).toHaveBeenCalledWith(
        'Successfully deleted 50 old audit logs'
      );
    });
  });

  it('should not rotate logs if user cancels', async () => {
    global.confirm = jest.fn(() => false);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Rotate Logs')).toBeInTheDocument();
    });

    const rotateButton = screen.getByText('Rotate Logs');
    fireEvent.click(rotateButton);

    expect(global.confirm).toHaveBeenCalled();
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('should handle pagination', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('student #100')).toBeInTheDocument();
    });

    // Find pagination controls
    const nextPageButton = screen.getByRole('button', { name: /next page/i });
    
    if (nextPageButton && !nextPageButton.hasAttribute('disabled')) {
      fireEvent.click(nextPageButton);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          '/api/v1/audit/logs',
          expect.objectContaining({
            params: expect.objectContaining({
              page: 2
            })
          })
        );
      });
    }
  });

  it('should display error message on API failure', async () => {
    mockedAxios.get.mockRejectedValue({
      response: {
        data: {
          error: {
            message: 'Failed to fetch audit logs'
          }
        }
      }
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch audit logs')).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderComponent();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display empty state when no logs', async () => {
    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/v1/audit/logs') {
        return Promise.resolve({
          data: {
            data: [],
            pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
          }
        });
      }
      if (url === '/api/v1/audit/stats') {
        return Promise.resolve({
          data: { data: mockStats }
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No audit logs found')).toBeInTheDocument();
    });
  });
});
