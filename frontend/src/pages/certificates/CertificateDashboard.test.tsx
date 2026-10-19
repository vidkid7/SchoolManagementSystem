import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { CertificateDashboard } from './CertificateDashboard';

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('CertificateDashboard', () => {
  it('keeps certificate dashboard section headings at level five', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: { data: { total: 0, active: 0, revoked: 0, thisMonth: 0, byType: {}, recent: [] } },
    });

    render(
      <MemoryRouter initialEntries={['/KMC/certificates']}>
        <Routes>
          <Route path="/:municipalitySlug/certificates" element={<CertificateDashboard />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'certificates.byType', level: 5 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'certificates.recentCertificates', level: 5 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'certificates.quickActions', level: 5 })).toBeInTheDocument();
  });
});
