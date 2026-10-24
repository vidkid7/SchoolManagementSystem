import { fireEvent, render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import authReducer from '../../store/slices/authSlice';
import api from '../../config/api';
import { ResetPassword } from './ResetPassword';

jest.mock('../../config/api', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

const renderResetPassword = (initialEntry: string) => {
  const store = configureStore({ reducer: { auth: authReducer } });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <ResetPassword />
      </MemoryRouter>
    </Provider>,
  );
};

describe('ResetPassword', () => {
  it('provides a main landmark and a request-new-link recovery path when the token is missing', () => {
    renderResetPassword('/reset-password');

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Missing reset token');
    expect(screen.getByRole('link', { name: /request new link/i })).toHaveAttribute('href', '/forgot-password');
  });

  it('labels both password fields, provides autocomplete hints, and names the visibility toggle', () => {
    renderResetPassword('/reset-password?token=local-test-token');

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Set new password', level: 1 })).toBeInTheDocument();

    const newPassword = screen.getByLabelText(/New password/);
    const confirmPassword = screen.getByLabelText(/Confirm new password/);
    expect(newPassword).toHaveAttribute('id', 'reset-password-new-password');
    expect(newPassword).toHaveAttribute('name', 'newPassword');
    expect(newPassword).toHaveAttribute('autocomplete', 'new-password');
    expect(confirmPassword).toHaveAttribute('id', 'reset-password-confirm-password');
    expect(confirmPassword).toHaveAttribute('name', 'confirmNewPassword');
    expect(confirmPassword).toHaveAttribute('autocomplete', 'new-password');

    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute('aria-pressed', 'true');
    expect(newPassword).toHaveAttribute('type', 'text');
    expect(confirmPassword).toHaveAttribute('type', 'text');

    fireEvent.change(newPassword, { target: { value: 'First-password-123!' } });
    fireEvent.change(confirmPassword, { target: { value: 'Different-password-123!' } });
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeDisabled();

    fireEvent.change(confirmPassword, { target: { value: 'First-password-123!' } });
    expect(screen.queryByText('Passwords do not match')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeEnabled();
  });

  it('requires the server password policy before enabling reset, even when fields match', () => {
    renderResetPassword('/reset-password?token=local-test-token');

    fireEvent.change(screen.getByLabelText(/New password/), { target: { value: 'abcdefgh' } });
    fireEvent.change(screen.getByLabelText(/Confirm new password/), { target: { value: 'abcdefgh' } });

    expect(screen.getByText('Use 8–128 characters with an uppercase letter, a lowercase letter, and a number.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/New password/), { target: { value: 'GoodPass123' } });
    fireEvent.change(screen.getByLabelText(/Confirm new password/), { target: { value: 'GoodPass123' } });
    expect(screen.queryByText('Use 8–128 characters with an uppercase letter, a lowercase letter, and a number.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeEnabled();
  });

  it.each([
    ['network failure', new Error('ECONNREFUSED')],
    ['server failure', { response: { status: 503, data: { message: 'Sensitive database details' } } }],
  ])('shows a safe retry message after a %s', async (_failureType, failure) => {
    jest.mocked(api.post).mockRejectedValueOnce(failure);
    renderResetPassword('/reset-password?token=local-test-token');

    fireEvent.change(screen.getByLabelText(/New password/), { target: { value: 'GoodPass123' } });
    fireEvent.change(screen.getByLabelText(/Confirm new password/), { target: { value: 'GoodPass123' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Password reset is temporarily unavailable. Please try again.');
    expect(screen.queryByText('Sensitive database details')).not.toBeInTheDocument();
  });
});
