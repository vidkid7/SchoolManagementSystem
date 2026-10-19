import { fireEvent, render, screen } from '@testing-library/react';
import { ChangePassword } from './ChangePassword';

jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
  useSelector: (selector: (state: { auth: { isLoading: boolean; error: null } }) => unknown) =>
    selector({ auth: { isLoading: false, error: null } }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('ChangePassword accessibility', () => {
  it('names the password visibility control and updates it when toggled', () => {
    render(<ChangePassword />);

    const currentPassword = screen.getByLabelText(/Current password/);
    expect(currentPassword).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: 'auth.showPassword' }));
    expect(currentPassword).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'auth.hidePassword' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'auth.hidePassword' }));
    expect(currentPassword).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'auth.showPassword' })).toBeInTheDocument();
  });
});
