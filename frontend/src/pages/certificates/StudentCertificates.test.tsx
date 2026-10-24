import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import { StudentCertificates } from './StudentCertificates';

jest.mock('react-i18next', () => {
  const translate = (key: string) => key;
  return { useTranslation: () => ({ t: translate }) };
});

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), defaults: { baseURL: 'https://api.school.test/api/v1' } },
  resolveApiAssetUrl: (path: string) => new URL(path, 'https://api.school.test').toString(),
}));

const activeCertificate = {
  certificateId: 51001,
  certificateNumber: 'CERT-QA-51001',
  type: 'character',
  templateName: 'Character Certificate',
  issuedDate: '2026-01-15',
  issuedDateBS: '2082-10-02',
  status: 'active' as const,
  pdfUrl: '/uploads/certificates/CERT-QA-51001.pdf',
};

const revokedCertificate = {
  ...activeCertificate,
  certificateId: 51002,
  certificateNumber: 'CERT-QA-51002',
  status: 'revoked' as const,
  pdfUrl: '/api/v1/certificates/51002/pdf',
};

const renderPage = () => render(
  <ThemeProvider theme={createTheme()}>
    <StudentCertificates />
  </ThemeProvider>,
);

describe('StudentCertificates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.removeItem('studentId');
    (apiClient.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/v1/students/me/profile') {
        return Promise.resolve({ data: { data: { studentId: 5100 } } });
      }
      if (url === '/api/v1/certificates/student/5100') {
        return Promise.resolve({ data: { data: [activeCertificate, revokedCertificate] } });
      }
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
  });

  it('loads the signed-in student’s certificates using their profile ID and filters revoked records', async () => {
    localStorage.setItem('studentId', '1');
    renderPage();

    expect(await screen.findByText('CERT-QA-51001')).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/api/v1/students/me/profile');
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/api/v1/certificates/student/5100');
    expect(screen.queryByText('CERT-QA-51002')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /certificates.revoked/ }));
    expect(await screen.findByText('CERT-QA-51002')).toBeInTheDocument();
  });

  it('shows certificate details and safely opens active certificate PDFs', async () => {
    const openSpy = jest.spyOn(window, 'open').mockReturnValue(null);
    renderPage();

    await screen.findByText('CERT-QA-51001');
    fireEvent.click(screen.getByRole('button', { name: 'certificates.viewDetails' }));
    const dialog = screen.getByRole('dialog', { name: 'certificates.certificateDetailTitle' });
    expect(within(dialog).getByText('2082-10-02')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'certificates.downloadPdf' }));

    expect(openSpy).toHaveBeenCalledWith('https://api.school.test/uploads/certificates/CERT-QA-51001.pdf', '_blank', 'noopener,noreferrer');
    expect(await screen.queryByRole('dialog')).not.toBeInTheDocument();
    openSpy.mockRestore();
  });

  it('does not fall back to a guessed student ID if the profile has no linked student', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: { studentId: null } } });
    renderPage();

    expect(await screen.findByText('certificates.noCertAvailable')).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/students/me/profile');
  });

  it('reports profile or certificate API failures in the page alert', async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error('offline'));
    renderPage();

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('certificates.noCertificates'));
  });
});
