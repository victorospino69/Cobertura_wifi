import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@wifi-planner/shared-types': path.resolve(__dirname, '../../packages/shared-types/src/index.ts'),
      '@wifi-planner/geometry': path.resolve(__dirname, '../../packages/geometry/src/index.ts'),
      '@wifi-planner/materials-db': path.resolve(__dirname, '../../packages/materials-db/src/index.ts'),
      '@wifi-planner/physics-core': path.resolve(__dirname, '../../packages/physics-core/src/index.ts')
    }
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  }
});
