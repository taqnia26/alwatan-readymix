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
    testTimeout: 15_000,
  },
});
