jest.unmock('./config');

import i18n from './config';

describe('document language accessibility metadata', () => {
  afterAll(async () => {
    await i18n.changeLanguage('en');
  });

  it('keeps the root lang attribute synchronized with the active UI language', async () => {
    await i18n.changeLanguage('ne');
    expect(document.documentElement.lang).toBe('ne');

    await i18n.changeLanguage('en');
    expect(document.documentElement.lang).toBe('en');
  });
});
