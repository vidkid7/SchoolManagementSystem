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
    expect(currentPassword).toHaveAttribute('autocomplete', 'current-password');
    expect(screen.getByLabelText(/New password/)).toHaveAttribute('autocomplete', 'new-password');
    expect(screen.getByLabelText(/Confirm new password/)).toHaveAttribute('autocomplete', 'new-password');

    fireEvent.click(screen.getByRole('button', { name: 'auth.showPassword' }));
    expect(currentPassword).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'auth.hidePassword' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'auth.hidePassword' }));
    expect(currentPassword).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'auth.showPassword' })).toBeInTheDocument();
  });

  it('blocks a weak new password with the backend policy shown inline', () => {
    render(<ChangePassword />);

    fireEvent.change(screen.getByLabelText(/^New password/), { target: { value: 'weakpass' } });
    fireEvent.change(screen.getByLabelText(/^Confirm new password/), { target: { value: 'weakpass' } });

    expect(screen.getByText('Use 8–128 characters with an uppercase letter, a lowercase letter, and a number.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Change password' })).toBeDisabled();
  });

  it('enables password change only when the policy is met and values match', () => {
    render(<ChangePassword />);
    const submit = screen.getByRole('button', { name: 'Change password' });

    fireEvent.change(screen.getByLabelText(/^New password/), { target: { value: 'ValidPass1' } });
    fireEvent.change(screen.getByLabelText(/^Confirm new password/), { target: { value: 'DifferentPass1' } });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/^Confirm new password/), { target: { value: 'ValidPass1' } });
    expect(submit).toBeEnabled();
  });
});
