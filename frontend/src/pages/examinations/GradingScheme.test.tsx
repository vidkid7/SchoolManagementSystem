import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import { GradingScheme } from './GradingScheme';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn().mockResolvedValue({ data: { data: [] } }), put: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

describe('GradingScheme accessibility', () => {
  it('keeps the dialog heading order and gives the description field a stable id', async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <GradingScheme />
      </ThemeProvider>,
    );

    await screen.findByRole('heading', { name: 'examinations.gradingSchemeConfiguration' });
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/system-settings/grading-schemes'));
    fireEvent.click(screen.getByRole('button', { name: 'examinations.addGrade' }));

    const dialog = screen.getByRole('dialog');
    const definitions = within(dialog).getByRole('heading', { name: 'examinations.gradeDefinitions' });
    const description = within(dialog).getByRole('textbox', { name: 'common.description' });

    expect(definitions.tagName).toBe('H3');
    expect(description).toHaveAttribute('id', 'grading-scheme-description');
    expect(description).toHaveAttribute('name', 'description');
  });
});
