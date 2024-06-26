import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@mui/material']
  },
  build: {
    rollupOptions: {
      external: ['@mui/material']
    }
  }
});
