import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '../Dashboard';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Dashboard', () => {
  const mockDashboardData = {
    summary: {
      totalStudents: 250,
      totalStaff: 30,
      attendanceRate: 85,
      feeCollectionRate: 75,
    },
    charts: {
      enrollmentTrend: [
        { label: 'Jan', value: 200 },
        { label: 'Feb', value: 220 },
        { label: 'Mar', value: 250 },
      ],
      attendanceTrend: [
        { label: 'Jan', value: 82 },
        { label: 'Feb', value: 85 },
        { label: 'Mar', value: 88 },
      ],
      feeCollection: [
        { label: 'Jan', value: 500000 },
        { label: 'Feb', value: 550000 },
        { label: 'Mar', value: 600000 },
      ],
      examPerformance: [
        { label: 'Term 1', value: 3.2 },
        { label: 'Term 2', value: 3.4 },
        { label: 'Term 3', value: 3.5 },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dashboard title', async () => {
    mockedAxios.get.mockResolvedValue({ data: { data: mockDashboardData } });

    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('should display loading state initially', () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {}));

    render(<Dashboard />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should fetch and display dashboard data', async () => {
    mockedAxios.get.mockResolvedValue({ data: { data: mockDashboardData } });

    render(<Dashboard />);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/reports/dashboard');
    });

    await waitFor(() => {
      expect(screen.getByText('Total Students')).toBeInTheDocument();
      expect(screen.getByText('250')).toBeInTheDocument();
      expect(screen.getByText('Total Staff')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
    });
  });

  it('should display all summary cards', async () => {
    mockedAxios.get.mockResolvedValue({ data: { data: mockDashboardData } });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Total Students')).toBeInTheDocument();
      expect(screen.getByText('Total Staff')).toBeInTheDocument();
      expect(screen.getByText('Attendance Rate')).toBeInTheDocument();
      expect(screen.getByText('Fee Collection')).toBeInTheDocument();
    });
  });

  it('should display attendance rate as percentage', async () => {
    mockedAxios.get.mockResolvedValue({ data: { data: mockDashboardData } });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('85%')).toBeInTheDocument();
    });
  });

  it('should display fee collection rate as percentage', async () => {
    mockedAxios.get.mockResolvedValue({ data: { data: mockDashboardData } });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  it('should render all chart titles', async () => {
    mockedAxios.get.mockResolvedValue({ data: { data: mockDashboardData } });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Enrollment Trend')).toBeInTheDocument();
      expect(screen.getByText('Attendance Trend')).toBeInTheDocument();
      expect(screen.getByText('Fee Collection')).toBeInTheDocument();
      expect(screen.getByText('Exam Performance')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockedAxios.get.mockRejectedValue(new Error('API Error'));

    render(<Dashboard />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch dashboard data:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('should display zero values when no data is available', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        data: {
          summary: {
            totalStudents: 0,
            totalStaff: 0,
            attendanceRate: 0,
            feeCollectionRate: 0,
          },
          charts: {
            enrollmentTrend: [],
            attendanceTrend: [],
            feeCollection: [],
            examPerformance: [],
          },
        },
      },
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });
});
