import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { store } from '../store';
import enTranslations from '../i18n/locales/en/translation.json';
import neTranslations from '../i18n/locales/ne/translation.json';
import { Login } from './Login';

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
    expect(screen.getByRole('button', { name: /password/i })).toBeInTheDocument();
    expect(screen.getByText('Smart Analytics')).toBeInTheDocument();
    expect(screen.getByText('Easy Management')).toBeInTheDocument();
    expect(screen.getByText('Secure')).toBeInTheDocument();
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
  });
});
