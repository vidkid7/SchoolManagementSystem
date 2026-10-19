import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import apiClient from '../../services/apiClient';
import { CertificateVerification } from './CertificateVerification';

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('CertificateVerification', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows a required-field error without calling the API for an empty number', () => {
    render(<CertificateVerification />);
    fireEvent.click(screen.getByRole('button', { name: 'certificates.verifyAction' }));

    expect(screen.getByText('certificates.certificateNumberRequired')).toBeInTheDocument();
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('rejects invalid formats locally and normalizes valid formats before lookup', async () => {
    render(<CertificateVerification />);
    const input = screen.getByRole('textbox', { name: 'certificates.enterCertificateNumber' });
    fireEvent.change(input, { target: { value: 'not-a-certificate-number' } });
    fireEvent.click(screen.getByRole('button', { name: 'certificates.verifyAction' }));

    expect(screen.getByText('certificates.invalidCertificateNumberFormat')).toBeInTheDocument();
    expect(apiClient.get).not.toHaveBeenCalled();

    (apiClient.get as jest.Mock).mockRejectedValue({ response: { status: 404 } });
    fireEvent.change(input, { target: { value: 'cert-char-2026-1234' } });
    fireEvent.click(screen.getByRole('button', { name: 'certificates.verifyAction' }));

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/api/v1/certificates/verify/CERT-CHAR-2026-1234'));
    expect(await screen.findByText('certificates.certificateNotFound')).toBeInTheDocument();
  });
});
