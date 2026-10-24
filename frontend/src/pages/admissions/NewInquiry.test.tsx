import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import api from '../../config/api';
import { NewInquiry } from './NewInquiry';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../config/api', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

jest.mock('../../hooks/useSlugNavigate', () => ({
  useSlugNavigate: () => jest.fn(),
}));

describe('NewInquiry error logging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not log the student payload included in a failed request error', async () => {
    const syntheticRequestError = Object.assign(new Error('Request failed'), {
      config: { data: JSON.stringify({ firstNameEn: 'Codex QA Synthetic', guardianPhone: '5550100' }) },
      response: { data: { message: 'Synthetic validation failure' } },
    });
    jest.mocked(api.post).mockRejectedValue(syntheticRequestError);
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const { container } = render(
        <ThemeProvider theme={createTheme()}>
          <NewInquiry />
        </ThemeProvider>,
      );

      fireEvent.change(screen.getByRole('textbox', { name: /admissions\.firstNameEnglish/ }), {
        target: { value: 'Codex QA Synthetic' },
      });
      fireEvent.change(screen.getByRole('textbox', { name: /admissions\.lastNameEnglish/ }), {
        target: { value: 'Privacy Test' },
      });
      await act(async () => {
        fireEvent.submit(container.querySelector('form')!);
      });

      await waitFor(() => expect(screen.getByText('Synthetic validation failure')).toBeInTheDocument());
      expect(api.post).toHaveBeenCalledWith('/admissions/inquiry', expect.objectContaining({
        firstNameEn: 'Codex QA Synthetic',
        lastNameEn: 'Privacy Test',
      }));
      expect(errorLog).toHaveBeenCalledWith('Failed to create admission inquiry.');
      expect(errorLog).not.toHaveBeenCalledWith(expect.anything(), syntheticRequestError);
    } finally {
      errorLog.mockRestore();
    }
  });
});
