import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';
import { fetchDashboardData } from '../../../services/dashboardService';
import { store } from '../../../store';
import { setUser } from '../../../store/slices/authSlice';

jest.mock('../../../services/dashboardService', () => ({
  fetchDashboardData: jest.fn(),
}));

const mockedFetchDashboardData = fetchDashboardData as jest.MockedFunction<typeof fetchDashboardData>;
const dashboardData = {
  summary: { totalStudents: 250, totalStaff: 30, attendanceRate: 85, feeCollectionRate: 75 },
  charts: {
    enrollmentTrend: [{ label: 'Jan', value: 200 }],
    attendanceTrend: [{ label: 'Jan', value: 85 }],
    genderDistribution: [],
    feeStatus: [],
  },
  recentActivities: [],
};

function renderDashboard() {
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </Provider>
  );
}

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    store.dispatch(setUser({ userId: 1, username: 'qa', email: 'qa@example.test', role: 'School_Admin' }));
    mockedFetchDashboardData.mockResolvedValue(dashboardData);
  });

  it('renders the school admin command center and live metrics', async () => {
    renderDashboard();

    expect(await screen.findByText('School Overview')).toBeInTheDocument();
    expect(screen.getAllByText('Students').length).toBeGreaterThan(0);
    expect(screen.getAllByText('250').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Staff').length).toBeGreaterThan(0);
    expect(screen.getAllByText('30').length).toBeGreaterThan(0);
    expect(screen.getAllByText('85%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('75%').length).toBeGreaterThan(0);
  });

  it('shows the loading skeleton while dashboard data is pending', () => {
    mockedFetchDashboardData.mockReturnValue(new Promise(() => {}));
    const { container } = renderDashboard();
    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
  });

  it('shows a recoverable error when dashboard data fails', async () => {
    mockedFetchDashboardData.mockRejectedValueOnce(new Error('API unavailable'));
    renderDashboard();

    expect(await screen.findByText('API unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('retries loading when Retry is selected', async () => {
    mockedFetchDashboardData.mockRejectedValueOnce(new Error('API unavailable'));
    renderDashboard();
    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('School Overview')).toBeInTheDocument();
    expect(mockedFetchDashboardData).toHaveBeenCalledTimes(2);
  });
});
