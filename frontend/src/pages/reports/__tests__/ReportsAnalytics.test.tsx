import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReportsAnalytics from '../ReportsAnalytics';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ReportsAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render reports analytics page', () => {
    render(<ReportsAnalytics />);
    expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
  });

  it('should render all tabs', () => {
    render(<ReportsAnalytics />);
    expect(screen.getByText('Enrollment')).toBeInTheDocument();
    expect(screen.getByText('Attendance')).toBeInTheDocument();
    expect(screen.getByText('Fee Collection')).toBeInTheDocument();
    expect(screen.getByText('Examination')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.getByText('ECA & Sports')).toBeInTheDocument();
  });

  it('should render filter inputs', () => {
    render(<ReportsAnalytics />);
    expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
    expect(screen.getByLabelText('End Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Class')).toBeInTheDocument();
    expect(screen.getByLabelText('Section')).toBeInTheDocument();
  });

  it('should update filters when inputs change', () => {
    render(<ReportsAnalytics />);
    
    const startDateInput = screen.getByLabelText('Start Date') as HTMLInputElement;
    fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
    expect(startDateInput.value).toBe('2024-01-01');

    const endDateInput = screen.getByLabelText('End Date') as HTMLInputElement;
    fireEvent.change(endDateInput, { target: { value: '2024-01-31' } });
    expect(endDateInput.value).toBe('2024-01-31');
  });

  it('should switch between tabs', () => {
    render(<ReportsAnalytics />);
    
    const attendanceTab = screen.getByText('Attendance');
    fireEvent.click(attendanceTab);
    expect(screen.getByText('Attendance Trend')).toBeInTheDocument();

    const feeTab = screen.getByText('Fee Collection');
    fireEvent.click(feeTab);
    expect(screen.getByText('Fee Collection vs Pending')).toBeInTheDocument();
  });

  it('should render export buttons', () => {
    render(<ReportsAnalytics />);
    const exportButtons = screen.getAllByText(/Export PDF|Export Excel/);
    expect(exportButtons.length).toBeGreaterThan(0);
  });

  it('should handle PDF export', async () => {
    const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
    mockedAxios.get.mockResolvedValue({ data: mockBlob });

    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    
    // Mock document.createElement and appendChild
    const mockLink = {
      href: '',
      setAttribute: jest.fn(),
      click: jest.fn(),
      remove: jest.fn(),
    };
    jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);

    render(<ReportsAnalytics />);
    
    const exportPdfButtons = screen.getAllByText('Export PDF');
    fireEvent.click(exportPdfButtons[0]);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/v1/reports/export/pdf/enrollment',
        expect.any(Object)
      );
    });
  });

  it('should handle Excel export', async () => {
    const mockBlob = new Blob(['excel content'], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    mockedAxios.get.mockResolvedValue({ data: mockBlob });

    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    
    const mockLink = {
      href: '',
      setAttribute: jest.fn(),
      click: jest.fn(),
      remove: jest.fn(),
    };
    jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);

    render(<ReportsAnalytics />);
    
    const exportExcelButtons = screen.getAllByText('Export Excel');
    fireEvent.click(exportExcelButtons[0]);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/v1/reports/export/excel/enrollment',
        expect.any(Object)
      );
    });
  });

  it('should handle export errors gracefully', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Export failed'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<ReportsAnalytics />);
    
    const exportPdfButtons = screen.getAllByText('Export PDF');
    fireEvent.click(exportPdfButtons[0]);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Export failed:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('should render charts in enrollment tab', () => {
    render(<ReportsAnalytics />);
    expect(screen.getByText('Student Enrollment by Class')).toBeInTheDocument();
    expect(screen.getByText('Summary')).toBeInTheDocument();
  });

  it('should render charts in examination tab', () => {
    render(<ReportsAnalytics />);
    
    const examTab = screen.getByText('Examination');
    fireEvent.click(examTab);
    
    expect(screen.getByText('Grade Distribution')).toBeInTheDocument();
    expect(screen.getByText('Performance Summary')).toBeInTheDocument();
  });
});
