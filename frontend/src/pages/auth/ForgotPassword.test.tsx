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
  });
});
