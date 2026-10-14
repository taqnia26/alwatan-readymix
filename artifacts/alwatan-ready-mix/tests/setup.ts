import { afterEach, vi } from 'vitest';
import { cleanup, configure } from '@testing-library/react';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});
configure({ asyncUtilTimeout: 10_000 });

// Layout-only browser APIs absent in jsdom. The form, dialog, routing,
// React Query hooks, draft provider and public renderer remain real.
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Element.prototype.scrollIntoView = () => {};
Element.prototype.hasPointerCapture = () => false;
Element.prototype.setPointerCapture = () => {};
Element.prototype.releasePointerCapture = () => {};
