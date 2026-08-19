import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Polyfill ResizeObserver for jsdom (not available natively)
global.ResizeObserver = class ResizeObserver {
  private callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;

afterEach(() => {
  cleanup();
});
