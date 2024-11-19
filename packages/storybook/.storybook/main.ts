import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';

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
  viteFinal: async config => {
    return mergeConfig(config, {
      build: {
        rollupOptions: {
          output: {
            manualChunks: id => {
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
