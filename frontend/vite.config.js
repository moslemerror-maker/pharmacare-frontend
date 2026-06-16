import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // In development: proxy /api to local backend (default port 3001)
  // In production builds: VITE_API_URL env var is baked in at build time
  const apiTarget = env.VITE_API_TARGET || 'http://localhost:3001';

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    build: { outDir: 'dist' },
  };
});
