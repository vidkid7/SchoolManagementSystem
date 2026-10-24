import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import api from '../../config/api';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import { AdmissionList } from './AdmissionList';

jest.mock('../../config/api', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: jest.fn() }));
const mockTranslate = jest.fn((key: string) => key);
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: mockTranslate }) }));

const navigateMock = jest.fn();
const admissions = [
  {
    admissionId: 101,
    temporaryId: 'ADM-101',
    firstNameEn: 'Asha',
    middleNameEn: 'Maya',
    lastNameEn: 'Sharma',
    applyingForClass: 5,
    status: 'inquiry',
    inquiryDate: '2026-10-15T00:00:00.000Z',
    phone: '9800000001',
    email: 'asha@example.test',
  },
  {
    admissionId: 102,
    temporaryId: 'ADM-102',
    firstNameEn: 'Ravi',
    lastNameEn: 'Thapa',
    applyingForClass: 7,
    status: 'applied',
    inquiryDate: '2026-10-16T00:00:00.000Z',
    phone: '9800000002',
  },
];

const renderPage = (initialEntry = '/admissions') => render(
  <ThemeProvider theme={createTheme()}>
    <MemoryRouter initialEntries={[initialEntry]}>
      <AdmissionList />
    </MemoryRouter>
  </ThemeProvider>,
);

describe('AdmissionList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useSlugNavigate).mockReturnValue(navigateMock);
    jest.mocked(api.get).mockResolvedValue({ data: { data: admissions } } as Awaited<ReturnType<typeof api.get>>);
  });

  it('loads admissions, searches locally, and routes the inquiry action', async () => {
    renderPage();
    expect(await screen.findByText('ADM-101')).toBeInTheDocument();
    expect(screen.getByText('Asha Maya Sharma')).toBeInTheDocument();
    expect(screen.getByText('asha@example.test')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/admissions', { params: {} });

    fireEvent.change(screen.getByRole('textbox', { name: 'admissions.search' }), { target: { value: '  asha   maya ' } });
    expect(screen.getByText('ADM-101')).toBeInTheDocument();
    expect(screen.queryByText('ADM-102')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'admissions.actions ADM-101' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'admissions.convertToApplication' }));
    expect(navigateMock).toHaveBeenCalledWith('/admissions/101?action=convert');
  });

  it('loads query filters and refetches when status and class change', async () => {
    renderPage('/admissions?status=inquiry');
    expect(await screen.findByText('ADM-101')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/admissions', { params: { status: 'inquiry' } });

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'admissions.class' }));
    fireEvent.click(await screen.findByRole('option', { name: 'common.class 7' }));
    await waitFor(() => expect(api.get).toHaveBeenLastCalledWith('/admissions', { params: { status: 'inquiry', applyingForClass: 7 } }));

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'admissions.status' }));
    fireEvent.click(await screen.findByRole('option', { name: 'admissions.applied' }));
    await waitFor(() => expect(api.get).toHaveBeenLastCalledWith('/admissions', { params: { status: 'applied', applyingForClass: 7 } }));
  });

  it('shows a fetch error and offers a new inquiry route', async () => {
    jest.mocked(api.get).mockRejectedValueOnce(new Error('network down'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('admissions.failedToLoadList');
    fireEvent.click(screen.getByRole('button', { name: 'admissions.newInquiry' }));
    expect(navigateMock).toHaveBeenCalledWith('/admissions/new');
    expect(within(screen.getByRole('table')).getByText('admissions.noAdmissionsFound')).toBeInTheDocument();
  });
});
