import { mergeConfig } from 'vite';
import path from 'path';
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-links',
    '@storybook/addon-interactions',
    '@chromatic-com/storybook',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (config) => {
    return mergeConfig(config, {
      define: {
        'process.env': JSON.stringify({
          NODE_ENV: 'development',
          NEXT_PUBLIC_CACHE_DURATION: process.env.NEXT_PUBLIC_CACHE_DURATION || '3600000',
          NEXT_PUBLIC_AUTH_HEADER_NAME: process.env.NEXT_PUBLIC_AUTH_HEADER_NAME || 'Authorization',
        }),
        global: 'globalThis',
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '../../MainUI'),
          '@workspaceui/componentlibrary': path.resolve(__dirname, '../../ComponentLibrary'),
          '@workspaceui/api-client': path.resolve(__dirname, '../../api-client'),
          'next/navigation': path.resolve(__dirname, '../__mocks__/next-navigation.js'),
          'next/router': path.resolve(__dirname, '../__mocks__/next-navigation.js'),
        },
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: (id: string) => {
              if (id.includes('node_modules')) {
                if (id.includes('react')) return 'vendor-react';
                if (id.includes('@storybook')) return 'vendor-storybook';
                return 'vendors';
              }
              if (id.includes('.stories.')) return 'stories';
              if (id.includes('.svg')) return 'assets';
            },
          },
        },
        minify: 'esbuild',
        sourcemap: false,
        chunkSizeWarningLimit: 2000,
        target: 'esnext',
        treeshake: true,
        external: ['@emotion/react', '@emotion/styled'],
      },
      optimizeDeps: {
        include: ['react', 'react-dom'],
      },
    });
  },
};

export default config;
