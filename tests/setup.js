import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Restore DOM, storage, and spies so each test starts from an independent browser state.
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});
