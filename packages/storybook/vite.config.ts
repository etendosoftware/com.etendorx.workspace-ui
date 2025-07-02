import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
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
  resolve: {
    alias: {
      '@workspaceui/api-client': path.resolve(__dirname, '../api-client'),
      '@workspaceui/componentlibrary': path.resolve(__dirname, '../ComponentLibrary'),
    },
  },
});
