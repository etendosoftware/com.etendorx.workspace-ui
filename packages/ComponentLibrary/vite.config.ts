import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path, { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    svgr({
      include: '**/*.svg',
      svgrOptions: {
        icon: true,
        ref: true,
        svgo: false,
        titleProp: true,
      },
    }),
    dts({
      include: ['src'],
      exclude: ['src/**/*.test.tsx', 'src/**/*.stories.tsx'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ComponentLibrary',
      fileName: format => `index.${format}.js`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        '@mui/material',
        '@mui/icons-material',
        '@emotion/react',
        '@emotion/styled',
        '@mui/lab',
        '@mui/x-data-grid-pro',
        'material-react-table',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@mui/material': 'Material',
          '@emotion/react': 'EmotionReact',
          '@emotion/styled': 'EmotionStyled',
        },
      },
    },
  },
  resolve: {
    alias: {
      '@workspaceui/storybook': path.resolve(__dirname, '../storybook/src'),
      '@workspaceui/etendohookbinder': path.resolve(__dirname, '../EtendoHookBinder/src'),
      '@workspaceui/componentlibrary': path.resolve(__dirname, '../ComponentLibrary/src'),
    },
  },
});
