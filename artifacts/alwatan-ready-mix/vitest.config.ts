import path from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Separate from Vite's serving config: no PORT, BASE_PATH, Clerk or DB needed.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
    dedupe: ['react', 'react-dom'],
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.tsx'],
    setupFiles: ['tests/setup.ts'],
    clearMocks: true,
    // Keep CI resource usage bounded when the storage/browser suite also runs.
    maxWorkers: 1,
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
