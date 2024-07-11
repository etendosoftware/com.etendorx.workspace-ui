import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [react(), svgr()],
  optimizeDeps: {
    include: ['@mui/material'],
  },
  build: {
    rollupOptions: {
      external: ['@mui/material'],
    },
  },
});
