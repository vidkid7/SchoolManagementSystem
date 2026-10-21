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

describe('CertificateManagement template actions', () => {
  const originalTemplate = {
    templateId: 42,
    name: 'QA Certificate Template',
    type: 'course_completion',
    isActive: true,
    createdAt: '2026-10-21T00:00:00.000Z',
    templateHtml: '<p>{{student_name}} completed {{course_name}}</p>',
    variables: ['student_name', 'course_name'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { success: true } });
    (apiClient.put as jest.Mock).mockResolvedValue({ data: { success: true } });
    (apiClient.delete as jest.Mock).mockResolvedValue({ data: { success: true } });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads a template for editing, updates it, then reads the updated name back', async () => {
    let savedTemplate = { ...originalTemplate };
    (apiClient.get as jest.Mock).mockImplementation((path: string) => {
      if (path === '/api/v1/certificate-templates/42') {
        return Promise.resolve({ data: { data: savedTemplate } });
      }
      if (path.startsWith('/api/v1/certificate-templates?')) {
        return Promise.resolve({ data: { data: [savedTemplate], meta: { total: 1 } } });
      }
      return Promise.resolve({ data: { data: [], meta: { total: 0 } } });
    });
    (apiClient.put as jest.Mock).mockImplementation((_path: string, payload: typeof savedTemplate) => {
      savedTemplate = { ...savedTemplate, ...payload };
      return Promise.resolve({ data: { data: savedTemplate } });
    });

    renderManagement();
    const editButton = await screen.findByRole('button', { name: 'certificates.editTemplate QA Certificate Template' });
    fireEvent.click(editButton);

    const nameField = await screen.findByRole('textbox', { name: 'certificates.templateName' });
    expect(nameField).toHaveValue('QA Certificate Template');
    expect(screen.getByRole('textbox', { name: 'certificates.templateHtml' })).toHaveValue(originalTemplate.templateHtml);
    fireEvent.change(nameField, { target: { value: 'QA Certificate Template Updated' } });
    fireEvent.click(screen.getByRole('button', { name: 'common.update' }));

    await waitFor(() => expect(apiClient.put).toHaveBeenCalledWith('/api/v1/certificate-templates/42', {
      name: 'QA Certificate Template Updated',
      type: 'course_completion',
      templateHtml: originalTemplate.templateHtml,
      variables: ['student_name', 'course_name'],
    }));
    expect(await screen.findByText('QA Certificate Template Updated')).toBeInTheDocument();
  });

  it('deletes a template only after confirmation and refreshes the list', async () => {
    let templates = [{ ...originalTemplate }];
    (apiClient.get as jest.Mock).mockImplementation((path: string) => {
      if (path.startsWith('/api/v1/certificate-templates?')) {
        return Promise.resolve({ data: { data: templates, meta: { total: templates.length } } });
      }
      return Promise.resolve({ data: { data: [], meta: { total: 0 } } });
    });
    (apiClient.delete as jest.Mock).mockImplementation(async () => {
      templates = [];
      return { data: { success: true } };
    });
    const confirm = jest.spyOn(window, 'confirm').mockReturnValue(false);

    renderManagement();
    const deleteButton = await screen.findByRole('button', { name: 'common.delete QA Certificate Template' });
    fireEvent.click(deleteButton);
    expect(apiClient.delete).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    fireEvent.click(deleteButton);
    await waitFor(() => expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/certificate-templates/42'));
    expect(await screen.findByText('certificates.noTemplatesFound')).toBeInTheDocument();
  });
});

describe('CertificateManagement generation student data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockImplementation((path: string) => {
      if (path === '/api/v1/students?limit=1000') {
        return Promise.resolve({ data: { data: [{ studentId: 9, studentCode: 'QA-009', firstNameEn: 'Asha', lastNameEn: 'Rai' }] } });
      }
      return Promise.resolve({ data: { data: [], meta: { total: 0 } } });
    });
  });

  it('uses the API firstNameEn and lastNameEn fields in the single-certificate form', async () => {
    renderManagement();
    fireEvent.click(await screen.findByRole('tab', { name: 'certificates.generate' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Generate Single Certificate' }));

    const studentSelect = await screen.findByRole('combobox', { name: 'certificates.student' });
    fireEvent.mouseDown(studentSelect);
    fireEvent.click(await screen.findByRole('option', { name: 'Asha Rai (QA-009)' }));

    expect(screen.getByRole('textbox', { name: 'certificates.studentName' })).toHaveValue('Asha Rai');
  });
});
