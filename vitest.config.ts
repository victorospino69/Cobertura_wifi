import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@wifi-planner/shared-types': path.resolve(__dirname, 'packages/shared-types/src/index.ts'),
      '@wifi-planner/geometry': path.resolve(__dirname, 'packages/geometry/src/index.ts'),
      '@wifi-planner/materials-db': path.resolve(__dirname, 'packages/materials-db/src/index.ts'),
      '@wifi-planner/physics-core': path.resolve(__dirname, 'packages/physics-core/src/index.ts')
    }
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/test/**/*.test.ts', 'apps/**/test/**/*.test.ts']
  }
});
