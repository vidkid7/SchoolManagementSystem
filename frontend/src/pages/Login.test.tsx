import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import api from '../config/api';
import { store } from '../store';
import { clearError } from '../store/slices/authSlice';
import enTranslations from '../i18n/locales/en/translation.json';
import neTranslations from '../i18n/locales/ne/translation.json';
import { Login } from './Login';

jest.mock('../config/api', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

const createTestI18n = async (language: 'en' | 'ne') => {
  const testI18n = createInstance();
  await testI18n.init({
    lng: language,
    fallbackLng: 'en',
    resources: {
      en: { translation: enTranslations },
      ne: { translation: neTranslations },
    },
    interpolation: { escapeValue: false },
  });
  return testI18n;
};

describe('Login accessibility', () => {
  it('exposes the login form as the main landmark and names the password visibility control', async () => {
    const testI18n = await createTestI18n('en');
    render(
      <I18nextProvider i18n={testI18n}>
        <Provider store={store}>
          <MemoryRouter>
            <Login />
          </MemoryRouter>
        </Provider>
      </I18nextProvider>,
    );

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'School Management System' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Welcome Back' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /password/i })).toBeInTheDocument();
    expect(screen.getByText('Smart Analytics')).toBeInTheDocument();
    expect(screen.getByText('Easy Management')).toBeInTheDocument();
    expect(screen.getByText('Secure')).toBeInTheDocument();
  });

  it('shows a localized, sanitized message when the sign-in service returns a server error', async () => {
    const post = jest.mocked(api.post).mockRejectedValueOnce({
      response: { status: 503, data: { message: 'Internal database details' } },
    });
    const testI18n = await createTestI18n('en');
    store.dispatch(clearError());

    const { unmount } = render(
      <I18nextProvider i18n={testI18n}>
        <Provider store={store}>
          <MemoryRouter>
            <Login />
          </MemoryRouter>
        </Provider>
      </I18nextProvider>,
    );

    const username = document.getElementById('username');
    const password = document.getElementById('password');
    if (!username || !password) throw new Error('Login fields are missing');
    fireEvent.change(username, { target: { value: 'qa-user' } });
    fireEvent.change(password, { target: { value: 'temporary-test-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByText('The sign-in service is temporarily unavailable. Please try again.')).toBeInTheDocument();
    expect(screen.queryByText('Internal database details')).not.toBeInTheDocument();
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(post).toHaveBeenCalledWith('/auth/login', { username: 'qa-user', password: 'temporary-test-password' });

    unmount();
    store.dispatch(clearError());
    post.mockReset();
  });

  it('toggles password visibility and updates the accessible control name', async () => {
    const testI18n = await createTestI18n('en');
    render(
      <I18nextProvider i18n={testI18n}>
        <Provider store={store}>
          <MemoryRouter>
            <Login />
          </MemoryRouter>
        </Provider>
      </I18nextProvider>,
    );

    const password = document.getElementById('password');
    expect(password).not.toBeNull();
    expect(document.querySelector('label[for="password"]')).toHaveTextContent('Password');
    expect(password).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(password).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument();
  });

  it('renders the login feature highlights in Nepali when Nepali is selected', async () => {
    const testI18n = await createTestI18n('ne');

    render(
      <I18nextProvider i18n={testI18n}>
        <Provider store={store}>
          <MemoryRouter>
            <Login />
          </MemoryRouter>
        </Provider>
      </I18nextProvider>,
    );

    expect(await screen.findByText('स्मार्ट विश्लेषण')).toBeInTheDocument();
    expect(screen.getByText('सजिलो व्यवस्थापन')).toBeInTheDocument();
    expect(screen.getByText('सुरक्षित')).toBeInTheDocument();
    expect(screen.getByText('नेपाल विद्यालय व्यवस्थापन प्रणाली').tagName).toBe('P');
    expect(screen.getByRole('link', { name: 'पासवर्ड बिर्सनुभयो?' })).toBeInTheDocument();
  });
});
