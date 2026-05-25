import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: { '/api': { target: 'https://web-production-36db0.up.railway.app', changeOrigin: true } },
  },
  build: { outDir: 'dist' },
});
