/**
 * Lite Mode Indicator Tests
 * 
 * Tests for lite mode indicator component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { LiteModeIndicator } from '../LiteModeIndicator';
import liteModeReducer from '../../../store/slices/liteModeSlice';

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      liteMode: liteModeReducer,
    },
    preloadedState: {
      liteMode: {
        enabled: false,
        autoDetect: true,
        disableAnimations: true,
        reduceImageQuality: true,
        limitConcurrentRequests: true,
        isSlowConnection: false,
        effectiveConnectionType: 'unknown',
        ...initialState,
      },
    },
  });
};

describe('LiteModeIndicator', () => {
  it('should render lite mode indicator button', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <LiteModeIndicator />
      </Provider>
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should open menu when clicked', async () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <LiteModeIndicator />
      </Provider>
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Network Status')).toBeInTheDocument();
      expect(screen.getByText('Lite Mode')).toBeInTheDocument();
    });
  });

  it('should display network status', async () => {
    const store = createMockStore({
      effectiveConnectionType: '4g',
      isSlowConnection: false,
    });
    
    render(
      <Provider store={store}>
        <LiteModeIndicator />
      </Provider>
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('4G')).toBeInTheDocument();
    });
  });

  it('should show slow connection warning', async () => {
    const store = createMockStore({
      effectiveConnectionType: '2g',
      isSlowConnection: true,
    });
    
    render(
      <Provider store={store}>
        <LiteModeIndicator />
      </Provider>
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('2G')).toBeInTheDocument();
    });
  });

  it('should toggle lite mode when switch is clicked', async () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <LiteModeIndicator />
      </Provider>
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      const liteModeSwitch = screen.getByRole('checkbox', { name: /enable lite mode/i });
      expect(liteModeSwitch).not.toBeChecked();
      
      fireEvent.click(liteModeSwitch);
      
      expect(liteModeSwitch).toBeChecked();
    });
  });

  it('should toggle auto-detect when switch is clicked', async () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <LiteModeIndicator />
      </Provider>
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      const autoDetectSwitch = screen.getByRole('checkbox', { name: /auto-detect/i });
      expect(autoDetectSwitch).toBeChecked();
      
      fireEvent.click(autoDetectSwitch);
      
      expect(autoDetectSwitch).not.toBeChecked();
    });
  });

  it('should show lite mode active message when enabled', async () => {
    const store = createMockStore({
      enabled: true,
    });
    
    render(
      <Provider store={store}>
        <LiteModeIndicator />
      </Provider>
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/lite mode is active/i)).toBeInTheDocument();
      expect(screen.getByText(/animations disabled/i)).toBeInTheDocument();
      expect(screen.getByText(/images compressed/i)).toBeInTheDocument();
      expect(screen.getByText(/limited concurrent requests/i)).toBeInTheDocument();
    });
  });
});
