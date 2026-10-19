import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { CertificateManagement } from './CertificateManagement';

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const renderManagement = () => render(
  <MemoryRouter initialEntries={['/KMC/certificates/manage']}>
    <Routes>
      <Route path="/:municipalitySlug/certificates/manage" element={<CertificateManagement />} />
    </Routes>
  </MemoryRouter>,
);

describe('CertificateManagement template creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [], meta: { total: 0 } } });
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { success: true } });
  });

  it('shows validation and makes no API request when required template details are missing', async () => {
    renderManagement();
    fireEvent.click(await screen.findByRole('button', { name: 'certificates.addTemplate' }));
    fireEvent.click(screen.getByRole('button', { name: 'common.create' }));

    expect(await screen.findByText('certificates.templateFormRequired')).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('sends unique placeholders as the required variables array', async () => {
    renderManagement();
    fireEvent.click(await screen.findByRole('button', { name: 'certificates.addTemplate' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'certificates.templateName' }), {
      target: { value: 'QA Character Certificate' },
    });
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'certificates.certificateType' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Character Certificate' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'certificates.templateHtml' }), {
      target: { value: '<div>{{student_name}} - {{ student_name }}</div>' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.create' }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/api/v1/certificate-templates', {
      name: 'QA Character Certificate',
      type: 'character',
      templateHtml: '<div>{{student_name}} - {{ student_name }}</div>',
      variables: ['student_name'],
    }));
  });
});
