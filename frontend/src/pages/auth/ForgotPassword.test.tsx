import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import authReducer from '../../store/slices/authSlice';
import { ForgotPassword } from './ForgotPassword';

describe('ForgotPassword', () => {
  it('clears an auth error left by a previous route', () => {
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: {
        auth: {
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Login failed',
        },
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Forgot password', level: 1 })).toBeInTheDocument();
  });

  it('requires an email before submitting the reset request', () => {
    const store = configureStore({ reducer: { auth: authReducer } });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByRole('textbox', { name: /email/i })).toBeRequired();
    expect(screen.getByRole('textbox', { name: /email/i })).toHaveAttribute('id', 'forgot-password-email');
    expect(screen.getByRole('textbox', { name: /email/i })).toHaveAttribute('name', 'email');
    expect(screen.getByRole('textbox', { name: /email/i })).toHaveAttribute('autocomplete', 'email');
    expect(screen.getByRole('button', { name: /send reset link/i }).closest('form')).toHaveAttribute('method', 'post');
  });
});
