import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
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
      '@workspaceui/storybook': path.resolve(__dirname, '../storybook/src'),
      '@workspaceui/etendohookbinder': path.resolve(__dirname, '../EtendoHookBinder/src'),
      '@workspaceui/componentlibrary': path.resolve(__dirname, '../ComponentLibrary/src'),
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: ['@workspaceui/storybook'],
      treeshake: 'safest',
    },
    cssMinify: true,
    minify: true,
    outDir: path.resolve(__dirname, '../../src/main/resources/static'),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
    },
  },
  // optimizeDeps: {
  //   esbuildOptions: {
  //     charset: 'utf8',
  //   },
  // },
});
