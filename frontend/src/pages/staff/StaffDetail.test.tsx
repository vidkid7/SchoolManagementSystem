import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { StaffDetail } from './StaffDetail';

const mockNavigate = jest.fn();
const mockTranslate = (key: string) => key;
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), delete: jest.fn() },
}));
jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => mockNavigate }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: mockTranslate, i18n: { language: 'en' } }) }));
jest.mock('./StaffDocuments', () => ({ __esModule: true, default: ({ staffId }: { staffId: number }) => <div>Documents for {staffId}</div> }));

const teacher = {
  staffId: 5,
  staffCode: 'STF-005',
  firstNameEn: 'Ada',
  middleNameEn: 'M',
  lastNameEn: 'Staff',
  position: 'teacher',
  department: 'science',
  status: 'active',
  phone: '9800000000',
  email: 'ada@example.test',
  addressEn: '1 Main Street, Kathmandu, Bagmati',
  emergencyContact: 'Grace: 9811111111',
  joinDate: '2020-01-01T00:00:00.000Z',
};

const renderPage = () => render(
  <ThemeProvider theme={createTheme()}>
    <MemoryRouter initialEntries={['/school/staff/5']}>
      <Routes><Route path='/:municipalitySlug/staff/:id' element={<StaffDetail />} /></Routes>
    </MemoryRouter>
  </ThemeProvider>,
);

describe('StaffDetail', () => {
  afterEach(() => jest.restoreAllMocks());

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiClient.get).mockResolvedValue({ data: { data: teacher } } as never);
    jest.mocked(apiClient.delete).mockResolvedValue({ data: { success: true } } as never);
  });

  it('loads staff details, parsed contact fields, and linked documents', async () => {
    renderPage();
    expect(await screen.findAllByText('Ada M Staff')).toHaveLength(2);
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/staff/5');
    expect(screen.getByText('1 Main Street, Kathmandu, Bagmati')).toBeInTheDocument();
    expect(screen.getByText('9800000000')).toBeInTheDocument();
    expect(screen.getByText('Documents for 5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'common.back' })).toBeInTheDocument();
  });

  it('shows teacher assignments only for teacher staff and opens the assignments route', async () => {
    renderPage();
    await screen.findAllByText('Ada M Staff');
    fireEvent.click(screen.getByRole('tab', { name: 'staff.form.assignments' }));
    fireEvent.click(screen.getByRole('button', { name: 'staff.manageAssignments' }));
    expect(mockNavigate).toHaveBeenCalledWith('/staff/5/assignments');
  });

  it('does not show teacher assignment navigation for non-teaching staff', async () => {
    jest.mocked(apiClient.get).mockResolvedValue({ data: { data: { ...teacher, position: 'office_staff' } } } as never);
    renderPage();
    await screen.findAllByText('Ada M Staff');
    expect(screen.queryByRole('tab', { name: 'staff.form.assignments' })).not.toBeInTheDocument();
  });

  it('shows an actionable error when staff details fail to load', async () => {
    jest.mocked(apiClient.get).mockRejectedValue(new Error('offline'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('staff.failedToLoad');
    expect(screen.getByRole('button', { name: 'common.back' })).toBeInTheDocument();
  });

  it('keeps deletion cancelled when the user declines confirmation', async () => {
    const confirm = jest.spyOn(window, 'confirm').mockReturnValue(false);
    renderPage();
    await screen.findAllByText('Ada M Staff');
    fireEvent.click(screen.getByRole('button', { name: 'common.delete' }));
    expect(confirm).toHaveBeenCalledWith('staff.confirmDeleteStaff');
    expect(apiClient.delete).not.toHaveBeenCalled();
    confirm.mockRestore();
  });

  it('deletes after confirmation and navigates back to the staff list', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    renderPage();
    await screen.findAllByText('Ada M Staff');
    fireEvent.click(screen.getByRole('button', { name: 'common.delete' }));
    await waitFor(() => expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/staff/5'));
    expect(mockNavigate).toHaveBeenCalledWith('/staff');
  });

  it('surfaces a failed delete and keeps the user on the detail error state', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    jest.mocked(apiClient.delete).mockRejectedValue(new Error('offline'));
    renderPage();
    await screen.findAllByText('Ada M Staff');
    fireEvent.click(screen.getByRole('button', { name: 'common.delete' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('staff.failedToDelete');
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
