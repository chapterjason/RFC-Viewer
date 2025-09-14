import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
    threads: false,
    coverage: {
      provider: 'v8',
    },
  },
  esbuild: {
    target: 'esnext',
  },
});
