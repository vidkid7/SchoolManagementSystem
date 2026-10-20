import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import apiClient from '../../services/apiClient';
import { Categories } from './Categories';

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, params?: { max?: number }) => params ? `${key}:${params.max}` : key }),
}));

describe('Categories validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [] } });
  });

  it('rejects a blank category name without sending a create request', async () => {
    render(<Categories />);
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/library/categories'));
    fireEvent.click(screen.getByRole('button', { name: 'library.addCategory' }));
    fireEvent.click(screen.getByRole('button', { name: 'library.create' }));

    expect(await screen.findAllByText('validation.required')).toHaveLength(1);
    expect(apiClient.post).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'library.cancel' }));
    expect(screen.queryByText('validation.required')).not.toBeInTheDocument();
  });

  it('rejects overlong category fields without sending a create request', async () => {
    render(<Categories />);
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/library/categories'));
    fireEvent.click(screen.getByRole('button', { name: 'library.addCategory' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'library.categoryName' }), { target: { value: 'x'.repeat(101) } });
    fireEvent.change(screen.getByRole('textbox', { name: 'library.description' }), { target: { value: 'y'.repeat(256) } });
    fireEvent.click(screen.getByRole('button', { name: 'library.create' }));

    expect(await screen.findAllByText('validation.maxLength:100')).toHaveLength(1);
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
