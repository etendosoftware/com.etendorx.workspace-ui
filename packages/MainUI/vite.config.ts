import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({
      include: '**/*.svg',
    }),
  ],
});
  plugins: [react()],
  server: {
    proxy: {
      '/sws/view': 'http://localhost:8092'
    }
  },
  build: {
    outDir: '../../src/main/resources/static',
    rollupOptions: {
      external: ['@mui/material']
    }
  }
})
