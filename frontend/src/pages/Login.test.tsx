import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { store } from '../store';
import { Login } from './Login';

describe('Login accessibility', () => {
  it('exposes the login form as the main landmark and names the password visibility control', () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /password/i })).toBeInTheDocument();
  });
});
