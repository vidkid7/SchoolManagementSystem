import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import { apiClient } from '../../services/apiClient';
import EnhancedStudentPortal from './EnhancedStudentPortal';

function mockTranslate(key: string, options?: { name?: string; code?: string }) {
  if (options?.name) return `${key}:${options.name}`;
  if (options?.code) return `${key}:${options.code}`;
  return key;
}

const mockNavigate = jest.fn();

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: mockTranslate }) }));
jest.mock('react-redux', () => ({ useSelector: jest.fn() }));
jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => mockNavigate }));
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  apiClient: { get: jest.fn() },
  resolveApiAssetUrl: (url: string) => `https://api.example.test${url}`,
}));

const studentAuth = { user: { userId: 501, username: 'student-qa', firstName: 'QA' }, accessToken: 'student-token' };

const mockApiResponses = () => {
  jest.mocked(apiClient.get).mockImplementation(async (url) => {
    if (url.endsWith('/attendance/summary')) return { data: { data: { percentage: 96, present: 24, absent: 1, late: 0, total: 25 } } } as never;
    if (url.endsWith('/grades')) return { data: { data: { grades: [{ subject: 'Mathematics', grade: 'A', gpa: 4, marks: 95, totalMarks: 100 }] } } } as never;
    if (url.endsWith('/fees/summary')) return { data: { data: { total: 1000, paid: 600, pending: 400 } } } as never;
    if (url.endsWith('/profile')) return { data: { data: { studentId: 42, studentCode: 'QA-42', firstName: 'QA' } } } as never;
    if (url.endsWith('/timetable')) return { data: { data: { entries: [{ day: 'Monday', period: 1, subject: 'Mathematics', startTime: '09:00', endTime: '09:45', teacher: 'Teacher QA', room: 'A1' }] } } } as never;
    if (url.endsWith('/assignments')) return { data: { data: { assignments: [{ id: 1, title: 'Algebra', subject: 'Mathematics', dueDate: '2026-11-01', status: 'pending', totalMarks: 20 }] } } } as never;
    if (url.endsWith('/certificates')) return { data: { data: { certificates: [{ id: 2, name: 'Character Certificate', pdfUrl: '/uploads/character.pdf', issueDate: '2026-10-01' }] } } } as never;
    if (url.endsWith('/library')) return { data: { data: { books: [{ id: 3, title: 'Science Book', status: 'borrowed', borrowDate: '2026-10-01', dueDate: '2026-10-30' }] } } } as never;
    if (url.endsWith('/eca')) return { data: { data: { activities: [{ id: 4, name: 'Chess Club', status: 'active' }] } } } as never;
    if (url.endsWith('/history')) return { data: { data: { history: [{ id: 5, academicYear: '2082', className: '10', result: 'Passed' }] } } } as never;
    if (url.endsWith('/remarks')) return { data: { data: { remarks: [{ id: 6, remark: 'Great progress', teacherName: 'Teacher QA', date: '2026-10-01' }] } } } as never;
    if (url.includes('/finance/payments/student/')) return { data: { data: [{ paymentId: 7, receiptNumber: 'RCPT-7', amount: 600, paymentDate: '2026-10-05', paymentMethod: 'cash', status: 'completed' }] } } as never;
    if (url.endsWith('/cv/42/download')) return { data: new Blob(['sample pdf'], { type: 'application/pdf' }) } as never;
    return { data: { data: [] } } as never;
  });
};

const renderPortal = () => render(
  <ThemeProvider theme={createTheme()}>
    <EnhancedStudentPortal />
  </ThemeProvider>,
);

describe('EnhancedStudentPortal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockReset();
    jest.mocked(useSelector).mockImplementation((selector) => selector({ auth: studentAuth } as never));
    mockApiResponses();
  });

  it('loads student summary, grades, fees, profile, timetable, and assignments', async () => {
    renderPortal();

    expect(await screen.findByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('96%')).toBeInTheDocument();
    expect(screen.getAllByText('4.00')).toHaveLength(2);
    expect(screen.getByText('portal.studentCode:QA-42')).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledTimes(6);
  });

  it('reports partial dashboard failures instead of presenting missing data as a clean empty state', async () => {
    jest.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url.endsWith('/grades')) throw new Error('grade service unavailable');
      if (url.endsWith('/profile')) return { data: { data: { studentId: 42 } } } as never;
      return { data: { data: {} } } as never;
    });
    renderPortal();

    expect(await screen.findByRole('alert')).toHaveTextContent('portal.failedToLoadData');
  });

  it('refreshes the student summary from the API', async () => {
    const user = userEvent.setup();
    renderPortal();
    await screen.findByText('Mathematics');

    await user.click(screen.getByRole('button', { name: 'portal.refreshData' }));

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(12));
  });

  it('loads each lazy student tab and exposes the selected tab panel accessibly', async () => {
    const user = userEvent.setup();
    renderPortal();
    await screen.findByText('Mathematics');

    const certificateTab = screen.getByRole('tab', { name: 'portal.certificates' });
    expect(certificateTab).toHaveAttribute('aria-controls', 'student-portal-tabpanel-5');
    await user.click(certificateTab);
    expect(await screen.findByText('Character Certificate')).toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'student-portal-tab-5');
    await user.click(screen.getByRole('button', { name: 'common.view' }));
    expect(mockNavigate).toHaveBeenCalledWith('/my-certificates');
    const open = jest.spyOn(window, 'open').mockReturnValue(null);
    await user.click(screen.getByRole('button', { name: 'portal.downloadCertificate' }));
    expect(open).toHaveBeenCalledWith('https://api.example.test/uploads/character.pdf', '_blank', 'noopener,noreferrer');
    open.mockRestore();

    await user.click(screen.getByRole('tab', { name: 'portal.library' }));
    expect(await screen.findByText('Science Book')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'portal.ecaAndSports' }));
    expect(await screen.findByText('Chess Club')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'portal.history' }));
    expect(await screen.findByText(/2082/)).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'common.remarks' }));
    expect(await screen.findByText('Great progress')).toBeInTheDocument();
  });

  it('downloads the CV through the authenticated student-specific PDF endpoint', async () => {
    const user = userEvent.setup();
    const createObjectURL = jest.fn(() => 'blob:cv-download');
    const revokeObjectURL = jest.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    renderPortal();
    await screen.findByText('Mathematics');
    await user.click(screen.getByRole('button', { name: 'portal.downloadCV' }));

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/api/v1/cv/42/download', { responseType: 'blob' }));
    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    click.mockRestore();
  });

  it('loads payment history and prints a receipt from a selected payment', async () => {
    const user = userEvent.setup();
    const receiptDocument = { open: jest.fn(), write: jest.fn(), close: jest.fn() };
    const receiptWindow = { opener: window, document: receiptDocument } as unknown as Window;
    const open = jest.spyOn(window, 'open').mockReturnValue(receiptWindow);
    renderPortal();
    await screen.findByText('Mathematics');
    await user.click(screen.getByRole('tab', { name: 'portal.fees' }));
    await user.click(screen.getByRole('button', { name: 'portal.viewPaymentHistory' }));

    expect(await screen.findByText(/RCPT-7/)).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/finance/payments/student/42');
    await user.click(screen.getByRole('button', { name: 'portal.downloadReceipt' }));
    expect(open).toHaveBeenCalledWith('', '_blank');
    expect(receiptDocument.write).toHaveBeenCalledWith(expect.stringContaining('RCPT-7'));
    open.mockRestore();
  });

  it('reports a failed lazy section request and does not present it as a valid empty result', async () => {
    const user = userEvent.setup();
    jest.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url.endsWith('/profile')) return { data: { data: { studentId: 42 } } } as never;
      if (url.endsWith('/certificates')) throw new Error('certificate service unavailable');
      return { data: { data: {} } } as never;
    });
    renderPortal();
    await screen.findByRole('tab', { name: 'portal.certificates' });

    await user.click(screen.getByRole('tab', { name: 'portal.certificates' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('portal.failedToLoadData');
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/students/42/certificates');
    expect(apiClient.get).toHaveBeenCalledTimes(7);
  });

  it('reports payment history request failures while allowing the dialog to close', async () => {
    const user = userEvent.setup();
    jest.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url.includes('/finance/payments/student/')) throw new Error('payment history unavailable');
      if (url.endsWith('/profile')) return { data: { data: { studentId: 42 } } } as never;
      return { data: { data: {} } } as never;
    });
    renderPortal();
    await screen.findByRole('tab', { name: 'portal.fees' });
    await user.click(screen.getByRole('tab', { name: 'portal.fees' }));
    await user.click(screen.getByRole('button', { name: 'portal.viewPaymentHistory' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('portal.failedToLoadData');
    expect(screen.queryByText('portal.noPaymentHistory')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'common.close' }));
    await waitFor(() => expect(screen.queryByText('portal.paymentHistoryTitle')).not.toBeInTheDocument());
  });

  it('does not offer a dead online-payment action without a student payment API', async () => {
    const user = userEvent.setup();
    renderPortal();
    await screen.findByText('Mathematics');
    await user.click(screen.getByRole('tab', { name: 'portal.fees' }));

    expect(screen.getByRole('button', { name: 'portal.payOnline' })).toBeDisabled();
    expect(screen.getByText('portal.payOnlineUnavailable')).toBeInTheDocument();
  });
});
