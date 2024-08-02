import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [
    react(),
    svgr({
      include: '**/*.svg',
      svgrOptions: {
        icon: true,
      },
    }),
  ],
  optimizeDeps: {
    include: [
      '@mui/material',
      '@mui/material/styles',
      '@emotion/react',
      '@emotion/styled',
    ],
  },
  build: {
    rollupOptions: {
      external: ['@mui/material'],
    },
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
});
