/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at  
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

const { mergeConfig } = require('vite');

/** @type {import('@storybook/react-vite').StorybookConfig} */
module.exports = {
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
      build: {
        rollupOptions: {
          output: {
            manualChunks: (id) => {
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
