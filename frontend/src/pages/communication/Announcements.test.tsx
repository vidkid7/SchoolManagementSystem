import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { Announcements } from './Announcements';
import { communicationApi } from '../../services/api/communication';

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) =>
    selector({ auth: { user: { userId: 1, role: 'School_Admin' } } }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

jest.mock('../../services/api/communication', () => ({
  communicationApi: {
    getAnnouncements: jest.fn(),
    createAnnouncement: jest.fn(),
    updateAnnouncement: jest.fn(),
    deleteAnnouncement: jest.fn(),
  },
}));

describe('Announcements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (communicationApi.getAnnouncements as jest.Mock).mockResolvedValue({ announcements: [] });
  });

  it('names audience and priority selects and blocks an empty announcement', async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <Announcements />
      </ThemeProvider>,
    );

    const createButton = await screen.findByRole('button', { name: 'communication.createAnnouncement' });
    act(() => createButton.focus());
    fireEvent.click(createButton);
    const dialog = await screen.findByRole('dialog');
    expect(createButton).not.toHaveFocus();

    expect(within(dialog).getByRole('combobox', { name: 'communication.targetAudience' })).toBeInTheDocument();
    expect(within(dialog).getByRole('combobox', { name: 'communication.priority' })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'common.save' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('validation.required');
    expect(communicationApi.createAnnouncement).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole('button', { name: 'common.cancel' }));
    await waitFor(() => expect(createButton).toHaveFocus());
  });
});
