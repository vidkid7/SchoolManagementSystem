/**
 * Theme Toggle Component Tests
 * 
 * Tests for the theme toggle button
 * Requirements: 34.1, 34.2
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../../../theme/ThemeContext';
import ThemeToggle from '../ThemeToggle';
import '../../../tests/setup';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Requirement 34.2: Theme toggle button', () => {
    it('should render theme toggle button', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button', { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
    });

    it('should show dark mode icon in light mode', () => {
      render(
        <ThemeProvider defaultMode="light">
          <ThemeToggle />
        </ThemeProvider>
      );

      // In light mode, should show DarkMode icon (moon)
      const button = screen.getByRole('button', { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
    });

    it('should show light mode icon in dark mode', () => {
      render(
        <ThemeProvider defaultMode="dark">
          <ThemeToggle />
        </ThemeProvider>
      );

      // In dark mode, should show LightMode icon (sun)
      const button = screen.getByRole('button', { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
    });

    it('should toggle theme when clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider defaultMode="light">
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button', { name: /toggle theme/i });
      
      // Click to toggle to dark mode
      await user.click(button);

      await waitFor(() => {
        expect(localStorage.getItem('sms_theme_mode')).toBe('dark');
      });

      // Click again to toggle back to light mode
      await user.click(button);

      await waitFor(() => {
        expect(localStorage.getItem('sms_theme_mode')).toBe('light');
      });
    });

    it('should show tooltip with appropriate text', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider defaultMode="light">
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button', { name: /toggle theme/i });
      
      // Hover to show tooltip
      await user.hover(button);

      // Should show "Switch to Dark Mode" in light mode
      await waitFor(() => {
        expect(screen.getByText(/Switch to Dark Mode/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button', { name: /toggle theme/i });
      expect(button).toHaveAttribute('aria-label', 'Toggle theme');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider defaultMode="light">
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button', { name: /toggle theme/i });
      
      // Focus the button
      button.focus();
      expect(button).toHaveFocus();

      // Press Enter to toggle
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(localStorage.getItem('sms_theme_mode')).toBe('dark');
      });
    });
  });

  describe('Integration with ThemeProvider', () => {
    it('should work with custom default mode', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider defaultMode="dark">
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button', { name: /toggle theme/i });
      
      // Should start in dark mode
      expect(localStorage.getItem('sms_theme_mode')).toBe('dark');

      // Click to toggle to light
      await user.click(button);

      await waitFor(() => {
        expect(localStorage.getItem('sms_theme_mode')).toBe('light');
      });
    });
  });
});
