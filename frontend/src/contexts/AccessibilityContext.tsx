/**
 * Accessibility Context and Provider
 * 
 * Provides accessibility features including font size adjustment and keyboard navigation
 * Requirements: 34.4, 34.5, 34.6, 34.7
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export type FontSize = 'small' | 'normal' | 'large';

interface AccessibilityContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
  keyboardNavigationEnabled: boolean;
  setKeyboardNavigationEnabled: (enabled: boolean) => void;
  highContrastMode: boolean;
  setHighContrastMode: (enabled: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

const FONT_SIZE_KEY = 'sms_font_size';
const KEYBOARD_NAV_KEY = 'sms_keyboard_navigation';
const HIGH_CONTRAST_KEY = 'sms_high_contrast';

const fontSizeOrder: FontSize[] = ['small', 'normal', 'large'];

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  // Load saved preferences from localStorage (Requirement 34.7)
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    const saved = localStorage.getItem(FONT_SIZE_KEY);
    if (saved === 'small' || saved === 'normal' || saved === 'large') {
      return saved;
    }
    return 'normal';
  });

  const [keyboardNavigationEnabled, setKeyboardNavigationEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem(KEYBOARD_NAV_KEY);
    return saved === 'true';
  });

  const [highContrastMode, setHighContrastModeState] = useState<boolean>(() => {
    const saved = localStorage.getItem(HIGH_CONTRAST_KEY);
    return saved === 'true';
  });

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem(FONT_SIZE_KEY, fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem(KEYBOARD_NAV_KEY, String(keyboardNavigationEnabled));
  }, [keyboardNavigationEnabled]);

  useEffect(() => {
    localStorage.setItem(HIGH_CONTRAST_KEY, String(highContrastMode));
  }, [highContrastMode]);

  // Apply font size to document root
  useEffect(() => {
    const root = document.documentElement;
    const fontSizeMap = {
      small: '14px',
      normal: '16px',
      large: '18px',
    };
    root.style.fontSize = fontSizeMap[fontSize];
  }, [fontSize]);

  // Apply high contrast mode class
  useEffect(() => {
    const root = document.documentElement;
    if (highContrastMode) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [highContrastMode]);

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
  };

  const increaseFontSize = () => {
    const currentIndex = fontSizeOrder.indexOf(fontSize);
    if (currentIndex < fontSizeOrder.length - 1) {
      setFontSizeState(fontSizeOrder[currentIndex + 1]);
    }
  };

  const decreaseFontSize = () => {
    const currentIndex = fontSizeOrder.indexOf(fontSize);
    if (currentIndex > 0) {
      setFontSizeState(fontSizeOrder[currentIndex - 1]);
    }
  };

  const resetFontSize = () => {
    setFontSizeState('normal');
  };

  const setKeyboardNavigationEnabled = (enabled: boolean) => {
    setKeyboardNavigationEnabledState(enabled);
  };

  const setHighContrastMode = (enabled: boolean) => {
    setHighContrastModeState(enabled);
  };

  // Global keyboard shortcuts (Requirement 34.5)
  useEffect(() => {
    if (!keyboardNavigationEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Plus: Increase font size
      if ((event.ctrlKey || event.metaKey) && event.key === '+') {
        event.preventDefault();
        increaseFontSize();
      }
      // Ctrl/Cmd + Minus: Decrease font size
      if ((event.ctrlKey || event.metaKey) && event.key === '-') {
        event.preventDefault();
        decreaseFontSize();
      }
      // Ctrl/Cmd + 0: Reset font size
      if ((event.ctrlKey || event.metaKey) && event.key === '0') {
        event.preventDefault();
        resetFontSize();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyboardNavigationEnabled, fontSize]);

  const contextValue: AccessibilityContextType = {
    fontSize,
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    keyboardNavigationEnabled,
    setKeyboardNavigationEnabled,
    highContrastMode,
    setHighContrastMode,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};
