import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import { ExamList } from './ExamList';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => jest.fn() }));

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn().mockResolvedValue({ data: { data: [] } }), delete: jest.fn() },
}));

describe('ExamList accessibility', () => {
  it('associates labels and form names with status, exam type, and class filters', async () => {
    const { container } = render(
      <ThemeProvider theme={createTheme()}>
        <ExamList />
      </ThemeProvider>,
    );

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/examinations', { params: {} }));

    expect(screen.getByRole('combobox', { name: 'common.status' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'examinations.examType' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'common.class' })).toBeInTheDocument();
    expect(container.querySelector('input[name="statusFilter"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="typeFilter"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="classFilter"]')).toBeInTheDocument();
  });
});
