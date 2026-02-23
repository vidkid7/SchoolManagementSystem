/**
 * Accessibility Context Tests
 * 
 * Tests for accessibility features
 * Requirements: 34.5, 34.6, 34.7
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccessibilityProvider, useAccessibility } from '../AccessibilityContext';

// Test component that uses the accessibility context
const TestComponent = () => {
  const {
    fontSize,
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    keyboardNavigationEnabled,
    setKeyboardNavigationEnabled,
    highContrastMode,
    setHighContrastMode,
  } = useAccessibility();

  return (
    <div>
      <div data-testid="font-size">{fontSize}</div>
      <button onClick={() => setFontSize('small')}>Set Small</button>
      <button onClick={() => setFontSize('normal')}>Set Normal</button>
      <button onClick={() => setFontSize('large')}>Set Large</button>
      <button onClick={increaseFontSize}>Increase</button>
      <button onClick={decreaseFontSize}>Decrease</button>
      <button onClick={resetFontSize}>Reset</button>
      <div data-testid="keyboard-nav">{String(keyboardNavigationEnabled)}</div>
      <button onClick={() => setKeyboardNavigationEnabled(!keyboardNavigationEnabled)}>
        Toggle Keyboard Nav
      </button>
      <div data-testid="high-contrast">{String(highContrastMode)}</div>
      <button onClick={() => setHighContrastMode(!highContrastMode)}>
        Toggle High Contrast
      </button>
    </div>
  );
};

describe('AccessibilityContext', () => {
  let localStorageMock: { [key: string]: string } = {};

  beforeEach(() => {
    localStorageMock = {};
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => localStorageMock[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          localStorageMock[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete localStorageMock[key];
        }),
        clear: jest.fn(() => {
          localStorageMock = {};
        }),
      },
      writable: true,
    });
  });

  describe('Font Size Management (Requirement 34.7)', () => {
    it('should default to normal font size', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      expect(screen.getByTestId('font-size')).toHaveTextContent('normal');
    });

    it('should allow setting font size to small', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      fireEvent.click(screen.getByText('Set Small'));
      expect(screen.getByTestId('font-size')).toHaveTextContent('small');
    });

    it('should allow setting font size to large', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      fireEvent.click(screen.getByText('Set Large'));
      expect(screen.getByTestId('font-size')).toHaveTextContent('large');
    });

    it('should increase font size', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      fireEvent.click(screen.getByText('Increase'));
      expect(screen.getByTestId('font-size')).toHaveTextContent('large');
    });

    it('should decrease font size', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      fireEvent.click(screen.getByText('Decrease'));
      expect(screen.getByTestId('font-size')).toHaveTextContent('small');
    });

    it('should not increase beyond large', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      fireEvent.click(screen.getByText('Set Large'));
      fireEvent.click(screen.getByText('Increase'));
      expect(screen.getByTestId('font-size')).toHaveTextContent('large');
    });

    it('should not decrease beyond small', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      fireEvent.click(screen.getByText('Set Small'));
      fireEvent.click(screen.getByText('Decrease'));
      expect(screen.getByTestId('font-size')).toHaveTextContent('small');
    });

    it('should reset font size to normal', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      fireEvent.click(screen.getByText('Set Large'));
      fireEvent.click(screen.getByText('Reset'));
      expect(screen.getByTestId('font-size')).toHaveTextContent('normal');
    });

    it('should persist font size to localStorage', async () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      fireEvent.click(screen.getByText('Set Large'));

      await waitFor(() => {
        expect(localStorageMock['sms_font_size']).toBe('large');
      });
    });

    it('should load font size from localStorage', () => {
      localStorageMock['sms_font_size'] = 'large';

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      expect(screen.getByTestId('font-size')).toHaveTextContent('large');
    });

    it('should apply font size to document root', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      fireEvent.click(screen.getByText('Set Large'));

      expect(document.documentElement.style.fontSize).toBe('18px');
    });
  });

  describe('Keyboard Navigation (Requirement 34.5)', () => {
    it('should default to keyboard navigation disabled', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      expect(screen.getByTestId('keyboard-nav')).toHaveTextContent('false');
    });

    it('should allow enabling keyboard navigation', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      fireEvent.click(screen.getByText('Toggle Keyboard Nav'));
      expect(screen.getByTestId('keyboard-nav')).toHaveTextContent('true');
    });

    it('should persist keyboard navigation setting to localStorage', async () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      fireEvent.click(screen.getByText('Toggle Keyboard Nav'));

      await waitFor(() => {
        expect(localStorageMock['sms_keyboard_navigation']).toBe('true');
      });
    });

    it('should load keyboard navigation setting from localStorage', () => {
      localStorageMock['sms_keyboard_navigation'] = 'true';

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      expect(screen.getByTestId('keyboard-nav')).toHaveTextContent('true');
    });
  });

  describe('High Contrast Mode (Requirement 34.6)', () => {
    it('should default to high contrast mode disabled', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      expect(screen.getByTestId('high-contrast')).toHaveTextContent('false');
    });

    it('should allow enabling high contrast mode', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      fireEvent.click(screen.getByText('Toggle High Contrast'));
      expect(screen.getByTestId('high-contrast')).toHaveTextContent('true');
    });

    it('should persist high contrast mode to localStorage', async () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      fireEvent.click(screen.getByText('Toggle High Contrast'));

      await waitFor(() => {
        expect(localStorageMock['sms_high_contrast']).toBe('true');
      });
    });

    it('should load high contrast mode from localStorage', () => {
      localStorageMock['sms_high_contrast'] = 'true';

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      expect(screen.getByTestId('high-contrast')).toHaveTextContent('true');
    });

    it('should apply high-contrast class to document root', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      fireEvent.click(screen.getByText('Toggle High Contrast'));

      expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
    });

    it('should remove high-contrast class when disabled', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      fireEvent.click(screen.getByText('Toggle High Contrast'));
      fireEvent.click(screen.getByText('Toggle High Contrast'));

      expect(document.documentElement.classList.contains('high-contrast')).toBe(false);
    });
  });
});
