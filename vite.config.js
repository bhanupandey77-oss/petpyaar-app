import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  define: { __BUILD_MS__: JSON.stringify(Date.now()) },
  build: { outDir: 'dist', chunkSizeWarningLimit: 2000 },
});
