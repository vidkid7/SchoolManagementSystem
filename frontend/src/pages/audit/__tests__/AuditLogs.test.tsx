import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AuditLogs from '../AuditLogs';
import apiClient from '../../../services/apiClient';

jest.mock('react-i18next', () => {
  const translations: Record<string, string> = {
      'audit.title': 'Audit Logs',
      'audit.subtitle': 'Review system activity',
      'audit.refresh': 'Refresh',
      'audit.export': 'Export',
      'audit.rotateLogs': 'Rotate Logs',
      'audit.totalLogs': 'Total Logs',
      'audit.creates': 'Creates',
      'audit.updates': 'Updates',
      'audit.deletes': 'Deletes',
      'audit.restores': 'Restores',
      'audit.filters': 'Filters',
      'audit.search': 'Search',
      'audit.searchPlaceholder': 'Search audit logs',
      'audit.userId': 'User ID',
      'audit.entityType': 'Entity Type',
      'audit.entityId': 'Entity ID',
      'audit.action': 'Action',
      'audit.allActions': 'All Actions',
      'audit.startDate': 'Start Date',
      'audit.endDate': 'End Date',
      'audit.ipAddress': 'IP Address',
      'audit.applyFilters': 'Apply Filters',
      'audit.clearFilters': 'Clear Filters',
      'audit.id': 'ID',
      'audit.timestamp': 'Timestamp',
      'audit.entity': 'Entity',
      'audit.changedFields': 'Changed Fields',
      'audit.details': 'Details',
      'audit.noLogsFound': 'No audit logs found',
      'audit.system': 'System',
      'audit.oldValue': 'Old Value',
      'audit.newValue': 'New Value',
      'audit.userAgent': 'User Agent',
      'audit.failedToFetch': 'Unable to load audit logs',
      'audit.rotateConfirm': 'Rotate old audit logs?',
      'audit.failedToExport': 'Unable to export audit logs',
      'audit.export': 'Export',
      'audit.failedToRotate': 'Unable to rotate audit logs',
  };
  const translate = (key: string, values?: Record<string, unknown>) =>
    translations[key] ?? (values ? `${key} ${JSON.stringify(values)}` : key);
  return { useTranslation: () => ({ t: translate }) };
});

jest.mock('../../../services/apiClient');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const sampleLog = {
  auditLogId: 44,
  userId: 7,
  entityType: 'Student',
  entityId: 91,
  entityUuid: 'student-uuid-91',
  action: 'update' as const,
  oldValue: { status: 'pending' },
  newValue: { status: 'active' },
  changedFields: ['status'],
  ipAddress: '192.0.2.10',
  userAgent: 'QA Browser',
  metadata: null,
  timestamp: '2026-10-22T10:00:00.000Z',
};

const renderPage = () => render(
  <ThemeProvider theme={createTheme()}>
    <AuditLogs />
  </ThemeProvider>
);

const logsResponse = (data = [sampleLog], total = data.length) => ({
  data: { data, pagination: { total } },
});

beforeEach(() => {
  jest.clearAllMocks();
  mockedApiClient.get.mockImplementation((async (url: string) => {
    if (url === '/api/v1/audit/stats') {
      return { data: { data: { totalLogs: 1, logsByAction: { create: 0, update: 1, delete: 0, restore: 0 } } } } as never;
    }
    if (url === '/api/v1/audit/logs') return logsResponse() as never;
    if (url === '/api/v1/audit/export') return { data: [sampleLog] } as never;
    throw new Error(`Unexpected GET ${url}`);
  }) as typeof mockedApiClient.get);
});

describe('AuditLogs', () => {
  it('loads summary and displays audit entries with expandable change details', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Audit Logs' })).toBeInTheDocument();
    await waitFor(() => expect(document.body.textContent).toContain('Student #student-uuid-91'));
    expect(document.body.textContent).toContain('44');
    fireEvent.click(screen.getByRole('button', { name: 'Details' }));
    await waitFor(() => expect(document.body.textContent).toContain('Old Value:'));
    expect(document.body.textContent).toContain('New Value:');
    expect(document.body.textContent).toContain('"status": "active"');
  });

  it('shows an explicit empty state when the audit API has no rows', async () => {
    mockedApiClient.get.mockImplementation((async (url: string) => {
      if (url === '/api/v1/audit/stats') return { data: { data: {} } } as never;
      if (url === '/api/v1/audit/logs') return logsResponse([], 0) as never;
      throw new Error(`Unexpected GET ${url}`);
    }) as typeof mockedApiClient.get);

    renderPage();
    expect(await screen.findByText('No audit logs found')).toBeInTheDocument();
  });

  it('applies search criteria to the list request', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'Audit Logs' });
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
    fireEvent.change(await screen.findByRole('textbox', { name: 'Search' }), { target: { value: 'student-uuid-91' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply Filters' }));

    await waitFor(() => expect(mockedApiClient.get).toHaveBeenCalledWith('/api/v1/audit/logs', {
      params: { page: 1, limit: 20, search: 'student-uuid-91' },
    }));
  });

  it('opens audit date filters on direct year selection', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Filters' }));
    fireEvent.click(await screen.findByLabelText('Start Date'));

    expect(await screen.findByRole('button', { name: /year view is open/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: String(new Date().getFullYear()) })).toBeInTheDocument();
  });

  it('requests the next page when the table pagination control is used', async () => {
    mockedApiClient.get.mockImplementation((async (url: string) => {
      if (url === '/api/v1/audit/stats') return { data: { data: {} } } as never;
      if (url === '/api/v1/audit/logs') return logsResponse([sampleLog], 25) as never;
      throw new Error(`Unexpected GET ${url}`);
    }) as typeof mockedApiClient.get);

    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('1–20 of 25'));
    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }));

    await waitFor(() => expect(mockedApiClient.get).toHaveBeenCalledWith('/api/v1/audit/logs', {
      params: { page: 2, limit: 20 },
    }));
  });

  it('clears applied filters and reloads the unfiltered first page', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'Audit Logs' });
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
    fireEvent.change(await screen.findByRole('textbox', { name: 'Search' }), { target: { value: 'student-uuid-91' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply Filters' }));
    await waitFor(() => expect(mockedApiClient.get).toHaveBeenCalledWith('/api/v1/audit/logs', expect.objectContaining({
      params: { page: 1, limit: 20, search: 'student-uuid-91' },
    })));

    fireEvent.click(screen.getByRole('button', { name: 'Clear Filters' }));
    await waitFor(() => expect(mockedApiClient.get.mock.calls.some(([url, config]) =>
      url === '/api/v1/audit/logs' && JSON.stringify(config?.params) === JSON.stringify({ page: 1, limit: 20 })
    )).toBe(true));
  });

  it('shows server errors and supports refresh without writing data', async () => {
    mockedApiClient.get.mockImplementation((async (url: string) => {
      if (url === '/api/v1/audit/stats') return { data: { data: {} } } as never;
      return Promise.reject({ response: { data: { error: { message: 'Audit service unavailable' } } } });
    }) as typeof mockedApiClient.get);

    renderPage();
    await screen.findByRole('heading', { name: 'Audit Logs' });
    await waitFor(() => expect(mockedApiClient.get).toHaveBeenCalledWith('/api/v1/audit/logs', {
      params: { page: 1, limit: 20 },
    }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Audit service unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(mockedApiClient.get).toHaveBeenCalledWith('/api/v1/audit/logs', {
      params: { page: 1, limit: 20 },
    }));
    expect(mockedApiClient.post).not.toHaveBeenCalled();
  });

  it('exports the currently loaded audit entries and does not rotate without confirmation', async () => {
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const createObjectURL = jest.fn(() => 'blob:qa-audit');
    const revokeObjectURL = jest.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    renderPage();
    await waitFor(() => expect(document.body.textContent).toContain('Student #student-uuid-91'));

    fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Search' }), { target: { value: 'student-uuid-91' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'IP Address' }), { target: { value: '192.0.2.10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply Filters' }));
    await waitFor(() => expect(mockedApiClient.get).toHaveBeenCalledWith('/api/v1/audit/logs', {
      params: { page: 1, limit: 20, ipAddress: '192.0.2.10', search: 'student-uuid-91' },
    }));

    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    await waitFor(() => expect(mockedApiClient.get).toHaveBeenCalledWith('/api/v1/audit/export', {
      params: { ipAddress: '192.0.2.10', search: 'student-uuid-91' },
    }));
    expect(clickSpy).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Rotate Logs' }));
    expect(confirmSpy).toHaveBeenCalledWith('Rotate old audit logs?');
    expect(mockedApiClient.post).not.toHaveBeenCalled();
    expect(createObjectURL).toHaveBeenCalled();
    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith('blob:qa-audit'));
  });
});
