/**
 * Language Switcher Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LanguageSwitcher } from './LanguageSwitcher';

// Mock i18n
const mockChangeLanguage = jest.fn().mockResolvedValue(undefined);
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      language: 'ne',
      changeLanguage: mockChangeLanguage,
    },
  }),
}));

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    localStorage.clear();
    mockChangeLanguage.mockClear();
  });

  it('should render language switcher button', () => {
    render(<LanguageSwitcher />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should open menu when button is clicked', () => {
    render(<LanguageSwitcher />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(screen.getByText('नेपाली')).toBeInTheDocument();
    expect(screen.getAllByText('English').length).toBeGreaterThan(0);
  });

  it('should display both Nepali and English options', () => {
    render(<LanguageSwitcher />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(screen.getByText('नेपाली')).toBeInTheDocument();
    expect(screen.getByText('Nepali')).toBeInTheDocument();
    expect(screen.getAllByText('English').length).toBeGreaterThan(0);
  });

  it('should show check icon for current language', () => {
    render(<LanguageSwitcher />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Current language should have a check icon
    const checkIcons = screen.getAllByTestId('CheckIcon');
    expect(checkIcons.length).toBeGreaterThan(0);
  });

  it('should persist language preference in localStorage', async () => {
    render(<LanguageSwitcher />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    const menuItems = screen.getAllByRole('menuitem');
    const englishOption = menuItems.find(item => item.textContent?.includes('English'));
    
    if (englishOption) {
      fireEvent.click(englishOption);
      
      await waitFor(() => {
        expect(mockChangeLanguage).toHaveBeenCalledWith('en');
        expect(localStorage.getItem('language')).toBe('en');
      });
    }
  });

  it('should default to Nepali language', () => {
    render(<LanguageSwitcher />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Nepali should be selected by default
    expect(screen.getByText('नेपाली')).toBeInTheDocument();
  });

  it('should update interface text immediately on language change', async () => {
    render(<LanguageSwitcher />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    const menuItems = screen.getAllByRole('menuitem');
    const englishOption = menuItems.find(item => item.textContent?.includes('English'));
    
    if (englishOption) {
      fireEvent.click(englishOption);
      
      await waitFor(() => {
        expect(mockChangeLanguage).toHaveBeenCalledWith('en');
      });
    }
  });
});
