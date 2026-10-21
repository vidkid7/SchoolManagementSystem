import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ClassSubjects } from './ClassSubjects';
import apiClient from '../../services/apiClient';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({ auth: { user: { role: 'School_Admin' } } }),
}));
jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => jest.fn() }));
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

const renderPage = () => render(
  <ThemeProvider theme={createTheme()}>
    <ClassSubjects />
  </ThemeProvider>,
);

beforeEach(() => {
  (apiClient.get as jest.Mock).mockImplementation((url: string) => {
    if (url === '/academic/classes') return Promise.resolve({ data: [{ classId: 1, gradeLevel: 1, section: 'K' }] });
    if (url === '/academic/subjects') return Promise.resolve({ data: [{ subjectId: 1, code: 'QA-101', nameEn: 'QA Subject', nameNp: 'परीक्षण', type: 'compulsory' }] });
    if (url === '/staff?role=subject_teacher') return Promise.resolve({ data: [] });
    if (url === '/academic/classes/1/subjects') return Promise.resolve({ data: [] });
    return Promise.reject(new Error(`Unexpected GET ${url}`));
  });
  (apiClient.post as jest.Mock).mockClear();
});

describe('ClassSubjects', () => {
  it('names the class selector and back button, and keeps the empty-state heading sequence', async () => {
    const { container } = renderPage();

    expect(screen.getByRole('button', { name: 'common.back classSubjects.title' })).toBeInTheDocument();
    expect(await screen.findByRole('combobox', { name: 'classSubjects.selectClass' })).toBeInTheDocument();
    expect(container.querySelector('input[name="classId"]')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'classSubjects.selectClassPrompt', level: 5 })).toBeInTheDocument();
  });

  it('opens and cancels assignment without writing data', async () => {
    renderPage();
    const classSelector = await screen.findByRole('combobox', { name: 'classSubjects.selectClass' });
    fireEvent.mouseDown(classSelector);
    fireEvent.click(await screen.findByRole('option', { name: 'classSubjects.classLabel 1 - classSubjects.sectionLabel K' }));

    fireEvent.click(await screen.findByRole('button', { name: 'classSubjects.assignSubject' }));
    const subjectSelector = await screen.findByRole('combobox', { name: 'classSubjects.subject' });
    fireEvent.mouseDown(subjectSelector);
    fireEvent.click(await screen.findByRole('option', { name: /QA-101 - QA Subject/ }));

    expect(screen.getByRole('button', { name: 'classSubjects.assignSubject' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
