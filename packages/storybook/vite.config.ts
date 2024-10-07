import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

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
      '@workspaceui/etendohookbinder': path.resolve(__dirname, '../EtendoHookBinder/src'),
      '@workspaceui/componentlibrary': path.resolve(__dirname, '../ComponentLibrary/src'),
    },
  },
});
