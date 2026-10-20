import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import '@testing-library/jest-dom';
import ReportsAnalytics, { formatEnrollmentClassLabel } from '../ReportsAnalytics';
import apiClient from '../../../services/apiClient';
import { store } from '../../../store';
import { setUser } from '../../../store/slices/authSlice';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string) => ({
      'reports.title': 'Reports & Analytics',
      'reports.enrollment': 'Enrollment',
      'reports.attendance': 'Attendance',
      'reports.feeCollection': 'Fee Collection',
      'reports.overview': 'Overview',
      'reports.examination': 'Examination',
      'reports.library': 'Library',
      'reports.ecaSports': 'ECA & Sports',
      'reports.startDate': 'Start Date',
      'reports.endDate': 'End Date',
      'reports.class': 'Class',
      'reports.applyFilters': 'Apply Filters',
      'reports.all': 'All',
      'reports.unassignedClass': 'Unassigned',
      'reports.section': 'Section',
      'reports.pdf': 'PDF',
      'reports.excel': 'Excel',
      'reports.attendanceTrend': 'Attendance Trend',
      'reports.feeCollectionVsPending': 'Fee Collection vs Pending',
      'reports.enrollmentByClass': 'Student Enrollment by Class',
      'reports.summary': 'Summary',
      'dashboard.gradeDistribution': 'Grade Distribution',
    }[key] ?? key),
  }),
}));

jest.mock('../../../services/apiClient');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const renderReports = () => render(
  <Provider store={store}>
    <ReportsAnalytics />
  </Provider>
);

describe('ReportsAnalytics', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    store.dispatch(setUser({ userId: 1, username: 'qa', email: 'qa@example.test', role: 'School_Admin' }));
    mockedApiClient.get.mockResolvedValue({ data: { success: true, data: {} } } as any);
  });

  it('should render reports analytics page', async () => {
    renderReports();
    expect(await screen.findByRole('heading', { name: 'Reports & Analytics' })).toBeInTheDocument();
  });

  it('should render all tabs', async () => {
    renderReports();
    await screen.findByRole('heading', { name: 'Reports & Analytics' });
    for (const name of ['Enrollment', 'Attendance', 'Fee Collection', 'Examination', 'Library', 'ECA & Sports']) {
      expect(screen.getByRole('tab', { name: new RegExp(name) })).toBeInTheDocument();
    }
  });

  it('should render filter inputs', async () => {
    renderReports();
    await screen.findByLabelText('Start Date');
    expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
    expect(screen.getByLabelText('End Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Class')).toBeInTheDocument();
    expect(screen.getByLabelText('Section')).toBeInTheDocument();
  });

  it('loads configured class sections and applies the selected class and section to report requests', async () => {
    mockedApiClient.get.mockImplementation(((url: string) => Promise.resolve({
      data: url === '/academic/classes'
        ? { success: true, data: [{ classId: 1, gradeLevel: 1, section: 'K' }] }
        : { success: true, data: {} },
    })) as any);

    renderReports();
    await screen.findByRole('heading', { name: 'Reports & Analytics' });
    await waitFor(() => expect(mockedApiClient.get).toHaveBeenCalledWith('/academic/classes'));
    mockedApiClient.get.mockClear();

    fireEvent.mouseDown(screen.getByLabelText('Class'));
    fireEvent.click(await screen.findByRole('option', { name: 'Class 1 - K' }));
    fireEvent.mouseDown(screen.getByLabelText('Section'));
    fireEvent.click(await screen.findByRole('option', { name: 'K' }));
    fireEvent.click(screen.getByRole('button', { name: /Apply Filters/i }));

    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/v1/reports/enrollment', {
        params: { classId: 1, section: 'K' },
      });
      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/v1/reports/attendance', {
        params: expect.objectContaining({ classId: 1, section: 'K' }),
      });
      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/v1/reports/fee-collection', {
        params: expect.objectContaining({ classId: 1, section: 'K' }),
      });
      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/v1/reports/examination', {
        params: { classId: 1 },
      });
    });
  });

  it('should update filters when inputs change', async () => {
    renderReports();
    await screen.findByLabelText('Start Date');
    
    const startDateInput = screen.getByLabelText('Start Date') as HTMLInputElement;
    fireEvent.click(startDateInput);
    fireEvent.click(await screen.findByRole('radio', { name: '2024' }));
    await waitFor(() => expect(startDateInput.value).toMatch(/2024/));

    const endDateInput = screen.getByLabelText('End Date') as HTMLInputElement;
    fireEvent.click(endDateInput);
    fireEvent.click(await screen.findByRole('radio', { name: '2024' }));
    await waitFor(() => expect(endDateInput.value).toMatch(/2024/));
  }, 15000);

  it('should switch between tabs', async () => {
    renderReports();
    const enrollmentTab = await screen.findByRole('tab', { name: /Enrollment/ });
    fireEvent.click(enrollmentTab);
    
    const attendanceTab = screen.getByRole('tab', { name: /Attendance/ });
    fireEvent.click(attendanceTab);
    expect(screen.getByText('Attendance Trend')).toBeInTheDocument();

    const feeTab = screen.getByRole('tab', { name: /Fee Collection/ });
    fireEvent.click(feeTab);
    expect(screen.getByRole('heading', { name: 'Fee Collection Overview' })).toBeInTheDocument();
  });

  it('should render export buttons', async () => {
    renderReports();
    await screen.findByRole('tab', { name: /Enrollment/ });
    const exportButtons = screen.getAllByRole('button').filter((button) => /PDF|Excel/.test(button.textContent ?? ''));
    expect(exportButtons.length).toBeGreaterThan(0);
  });

  it('should handle PDF export', async () => {
    const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
    mockedApiClient.get.mockResolvedValue({ data: mockBlob, headers: { 'content-type': 'application/pdf' } } as any);

    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    renderReports();
    fireEvent.click((await screen.findAllByRole('button', { name: /PDF/ }))[0]);

    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenCalledWith(
        '/api/v1/reports/export/pdf/enrollment',
        expect.any(Object)
      );
    });
  });

  it('should handle Excel export', async () => {
    const mockBlob = new Blob(['excel content'], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    mockedApiClient.get.mockResolvedValue({ data: mockBlob, headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } } as any);

    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    renderReports();
    fireEvent.click((await screen.findAllByRole('button', { name: /Excel/ }))[0]);

    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenCalledWith(
        '/api/v1/reports/export/excel/enrollment',
        expect.any(Object)
      );
    });
  });

  it('should handle export errors gracefully', async () => {
    mockedApiClient.get.mockRejectedValue(new Error('Export failed'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    renderReports();
    fireEvent.click((await screen.findAllByRole('button', { name: /PDF/ }))[0]);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Export failed:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('should render charts in enrollment tab', async () => {
    renderReports();
    await screen.findByRole('tab', { name: /Enrollment/ });
    expect(screen.getByRole('heading', { name: 'Student Enrollment by Class' })).toBeInTheDocument();
  });

  it('labels students without a class as unassigned in the enrollment chart', () => {
    const translate = (key: string) => ({
      'reports.class': 'Class',
      'reports.unassignedClass': 'Unassigned',
    }[key] ?? key);

    expect(formatEnrollmentClassLabel(null, translate)).toBe('Unassigned');
    expect(formatEnrollmentClassLabel(4, translate)).toBe('Class 4');
  });

  it('should render charts in examination tab', async () => {
    renderReports();
    await screen.findByRole('tab', { name: /Enrollment/ });
    const examTab = screen.getByRole('tab', { name: /Examination/ });
    fireEvent.click(examTab);
    
    expect(screen.getByRole('heading', { name: 'Grade Distribution' })).toBeInTheDocument();
  });
});
