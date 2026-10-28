import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist', chunkSizeWarningLimit: 2000, rollupOptions: { input: { main: 'index.html', aitest: 'aitest.html' } } },
});
