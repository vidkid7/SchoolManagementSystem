import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import apiClient from '../../services/apiClient';
import { GradeEntry } from './GradeEntry';

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('GradeEntry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [] } });
  });

  it('gives each grade filter an accessible name and stable form field name', async () => {
    const { container } = render(
      <ThemeProvider theme={createTheme()}>
        <GradeEntry />
      </ThemeProvider>,
    );

    expect(await screen.findByRole('combobox', { name: 'examinations.exam' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'common.class' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'common.section' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'common.subject' })).toBeInTheDocument();
    expect(container.querySelector('input[name="examId"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="classId"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="section"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="subjectId"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="gradeImportFile"]')).toHaveAttribute('id', 'grade-entry-import-file');
  });
});
