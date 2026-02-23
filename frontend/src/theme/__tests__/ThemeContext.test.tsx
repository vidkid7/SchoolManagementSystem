/**
 * Theme Context Tests
 * 
 * Tests for theme management functionality
 * Requirements: 34.1, 34.2, 34.3
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from '../ThemeContext';

// Test component that uses the theme context
const TestComponent = () => {
  const { mode, toggleMode, setMode } = useTheme();
  
  return (
    <div>
      <div data-testid="current-mode">{mode}</div>
      <button onClick={toggleMode} data-testid="toggle-button">
        Toggle Theme
      </button>
      <button onClick={() => setMode('light')} data-testid="set-light-button">
        Set Light
      </button>
      <button onClick={() => setMode('dark')} data-testid="set-dark-button">
        Set Dark
      </button>
    </div>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Requirement 34.1: Support light and dark themes', () => {
    it('should default to light mode', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('current-mode')).toHaveTextContent('light');
    });

    it('should support dark mode', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('set-dark-button'));

      await waitFor(() => {
        expect(screen.getByTestId('current-mode')).toHaveTextContent('dark');
      });
    });

    it('should allow setting mode explicitly', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Set to dark
      await user.click(screen.getByTestId('set-dark-button'));
      await waitFor(() => {
        expect(screen.getByTestId('current-mode')).toHaveTextContent('dark');
      });

      // Set back to light
      await user.click(screen.getByTestId('set-light-button'));
      await waitFor(() => {
        expect(screen.getByTestId('current-mode')).toHaveTextContent('light');
      });
    });
  });

  describe('Requirement 34.2: Theme toggle functionality', () => {
    it('should toggle between light and dark modes', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Initial state is light
      expect(screen.getByTestId('current-mode')).toHaveTextContent('light');

      // Toggle to dark
      await user.click(screen.getByTestId('toggle-button'));
      await waitFor(() => {
        expect(screen.getByTestId('current-mode')).toHaveTextContent('dark');
      });

      // Toggle back to light
      await user.click(screen.getByTestId('toggle-button'));
      await waitFor(() => {
        expect(screen.getByTestId('current-mode')).toHaveTextContent('light');
      });
    });
  });

  describe('Requirement 34.3: Remember theme preference', () => {
    it('should save theme preference to localStorage', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Toggle to dark mode
      await user.click(screen.getByTestId('toggle-button'));

      await waitFor(() => {
        expect(screen.getByTestId('current-mode')).toHaveTextContent('dark');
      }, { timeout: 3000 });

      // Give localStorage time to update
      await waitFor(() => {
        expect(localStorage.getItem('sms_theme_mode')).toBe('dark');
      }, { timeout: 3000 });
    });

    it('should load saved theme preference from localStorage', () => {
      // Set saved preference before rendering
      localStorage.setItem('sms_theme_mode', 'dark');

      const { unmount } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Should load dark mode from localStorage
      expect(screen.getByTestId('current-mode')).toHaveTextContent('dark');
      
      unmount();
    });

    it('should persist theme changes across re-renders', async () => {
      const user = userEvent.setup();
      
      const { unmount } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Toggle to dark
      await user.click(screen.getByTestId('toggle-button'));
      await waitFor(() => {
        expect(screen.getByTestId('current-mode')).toHaveTextContent('dark');
      }, { timeout: 3000 });

      // Wait for localStorage to update
      await waitFor(() => {
        expect(localStorage.getItem('sms_theme_mode')).toBe('dark');
      }, { timeout: 3000 });

      // Unmount and remount
      unmount();
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Should still be dark
      expect(screen.getByTestId('current-mode')).toHaveTextContent('dark');
    });
  });

  describe('Custom colors', () => {
    it('should support custom primary and secondary colors', () => {
      const TestColorComponent = () => {
        const { primaryColor, secondaryColor } = useTheme();
        return (
          <div>
            <div data-testid="primary-color">{primaryColor}</div>
            <div data-testid="secondary-color">{secondaryColor}</div>
          </div>
        );
      };

      render(
        <ThemeProvider
          defaultPrimaryColor="#ff0000"
          defaultSecondaryColor="#00ff00"
        >
          <TestColorComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('primary-color')).toHaveTextContent('#ff0000');
      expect(screen.getByTestId('secondary-color')).toHaveTextContent('#00ff00');
    });

    it('should save custom colors to localStorage', async () => {
      const TestColorComponent = () => {
        const { setPrimaryColor, setSecondaryColor } = useTheme();
        return (
          <div>
            <button onClick={() => setPrimaryColor('#123456')} data-testid="set-primary">
              Set Primary
            </button>
            <button onClick={() => setSecondaryColor('#abcdef')} data-testid="set-secondary">
              Set Secondary
            </button>
          </div>
        );
      };

      const user = userEvent.setup();
      
      render(
        <ThemeProvider>
          <TestColorComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('set-primary'));
      await user.click(screen.getByTestId('set-secondary'));

      await waitFor(() => {
        expect(localStorage.getItem('sms_primary_color')).toBe('#123456');
        expect(localStorage.getItem('sms_secondary_color')).toBe('#abcdef');
      }, { timeout: 3000 });
    });
  });

  describe('Error handling', () => {
    it('should throw error when useTheme is used outside ThemeProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useTheme must be used within ThemeProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('System preference detection', () => {
    it('should respect system dark mode preference when no saved preference exists', () => {
      // Mock matchMedia to return dark mode preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('current-mode')).toHaveTextContent('dark');
    });
  });
});
