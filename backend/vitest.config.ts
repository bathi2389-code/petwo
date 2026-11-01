import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@petco/shared': path.resolve(__dirname, '../shared/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    env: {
      NODE_ENV: 'test',
    },
    include: [
      'src/**/*.test.ts',
      '../shared/**/*.test.ts',
      'backend/src/**/*.test.ts',
      'shared/**/*.test.ts',
      'tests/**/*.test.ts',
      '../tests/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
