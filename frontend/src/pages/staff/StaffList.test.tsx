import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { StaffList } from './StaffList';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), delete: jest.fn() },
}));

const staffRecord = {
  staffId: 690001,
  staffCode: 'QA-STAFF-001',
  firstNameEn: 'QA',
  lastNameEn: 'Teacher',
  position: 'teacher',
  department: 'academic',
  category: 'teaching',
  status: 'active' as const,
  phone: '9800000000',
  email: 'qa@example.test',
};

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="current-location">{location.pathname}</output>;
}

function renderStaffList() {
  return render(
    <ThemeProvider theme={createTheme()}>
      <MemoryRouter initialEntries={['/KMC/staff']}>
        <Routes>
          <Route path="/:municipalitySlug/staff/*" element={<><StaffList /><LocationProbe /></>} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('StaffList', () => {
  let confirmSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    (apiClient.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/v1/staff/statistics') {
        return Promise.resolve({ data: { data: { total: 25, byStatus: { active: 17, inactive: 5, on_leave: 3 } } } });
      }
      return Promise.resolve({ data: { data: [staffRecord], meta: { total: 25 } } });
    });
    (apiClient.delete as jest.Mock).mockResolvedValue({ data: { success: true } });
  });

  afterEach(() => confirmSpy.mockRestore());

  it('shows aggregate status totals rather than counts from the current table page', async () => {
    renderStaffList();

    expect(await screen.findByText('QA Teacher')).toBeInTheDocument();
    expect(screen.getByText('17')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/staff/statistics');
  });

  it('resets to the first page when search filters are applied', async () => {
    renderStaffList();

    await screen.findByText('QA Teacher');
    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
    await waitFor(() => expect((apiClient.get as jest.Mock).mock.calls.some(([url]) => String(url).includes('page=2'))).toBe(true));

    fireEvent.change(screen.getByRole('textbox', { name: 'staff.search' }), { target: { value: 'Morgan' } });

    await waitFor(() => expect((apiClient.get as jest.Mock).mock.calls.some(([url]) => String(url).includes('page=1') && String(url).includes('search=Morgan'))).toBe(true), { timeout: 2000 });
    expect(screen.getByTestId('current-location')).toHaveTextContent('/KMC/staff');
  });

  it('sends the selected position filter to the staff API', async () => {
    renderStaffList();

    await screen.findByText('QA Teacher');
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'staff.position' }));
    fireEvent.click(await screen.findByRole('option', { name: 'staff.positions.teacher' }));

    await waitFor(() => expect((apiClient.get as jest.Mock).mock.calls.some(([url]) => String(url).includes('position=teacher'))).toBe(true));
  });

  it('offers and applies staff positions beyond the original six filters', async () => {
    renderStaffList();

    await screen.findByText('QA Teacher');
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'staff.position' }));
    fireEvent.click(await screen.findByRole('option', { name: 'staff.positions.classTeacher' }));

    await waitFor(() => expect((apiClient.get as jest.Mock).mock.calls.some(([url]) => String(url).includes('position=class_teacher'))).toBe(true));
  });

  it('navigates to staff details using the active municipality slug', async () => {
    renderStaffList();

    await screen.findByText('QA Teacher');
    fireEvent.click(screen.getByTitle('staff.viewDetails'));

    expect(screen.getByTestId('current-location')).toHaveTextContent('/KMC/staff/690001');
  });

  it('deletes only after confirmation and refreshes the list and aggregate totals', async () => {
    renderStaffList();

    await screen.findByText('QA Teacher');
    fireEvent.click(screen.getByTitle('common.delete'));
    expect(apiClient.delete).not.toHaveBeenCalled();

    confirmSpy.mockReturnValue(true);
    fireEvent.click(screen.getByTitle('common.delete'));
    await waitFor(() => expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/staff/690001'));
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(4));
  });
});
