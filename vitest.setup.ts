import '@testing-library/jest-dom/vitest';

// Global ResizeObserver mock for headless testing
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
}
