import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import apiClient from '../../services/apiClient';
import { TemplateManagement } from './TemplateManagement';

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('TemplateManagement template creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [] } });
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { success: true } });
  });

  it('keeps validation feedback visible in the create dialog and skips the API', async () => {
    render(<TemplateManagement />);
    fireEvent.click(await screen.findByRole('button', { name: 'certificates.createTemplate' }));
    fireEvent.click(screen.getByRole('button', { name: 'common.create' }));

    expect(within(screen.getByRole('dialog')).getByText('certificates.templateFormRequired')).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('derives template variables from the default HTML before creating', async () => {
    render(<TemplateManagement />);
    fireEvent.click(await screen.findByRole('button', { name: 'certificates.createTemplate' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'certificates.templateName' }), {
      target: { value: 'QA Default Character Template' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.create' }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    const [path, payload] = (apiClient.post as jest.Mock).mock.calls[0];
    expect(path).toBe('/api/v1/certificate-templates');
    expect(payload.variables).toEqual([
      'school_name', 'school_address', 'student_name', 'parent_name', 'course_name', 'academic_year', 'issue_date',
    ]);
  });
});
