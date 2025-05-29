import analyzer from '@next/bundle-analyzer';
import type { NextConfig } from 'next';

const DEBUG_MODE = process.env.DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development';
const ANALYZE = process.env.ANALYZE === 'true';

const nextConfig: NextConfig = {
  transpilePackages: ['@mui/material', '@mui/system', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
  modularizeImports: {
    '@mui/material': {
      transform: '@mui/material/{{member}}',
    },
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
  },
  reactStrictMode: false,
  cleanDistDir: false,
  output: 'standalone',
  compiler: {
    removeConsole: !DEBUG_MODE,
  },
  compress: !DEBUG_MODE,
  webpack(config) {
    config.optimization = {
      ...config.optimization,
      minimize: !DEBUG_MODE,
    };

    const fileLoaderRule = config.module.rules.find((rule: { test: { toString: () => string | string[] } }) =>
      rule.test?.toString().includes('svg'),
    );

    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/i;
    }

    config.module.rules.push(
      {
        test: /\.svg$/i,
        resourceQuery: /url/,
        type: 'asset/resource',
        generator: {
          filename: 'static/media/[name].[hash][ext]',
        },
      },
      {
        test: /\.svg$/i,
        resourceQuery: { not: [/url/] },
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              icon: true,
            },
          },
        ],
      },
    );

    if (config.optimization?.minimizer) {
      for (const plugin of config.optimization.minimizer) {
        if (plugin.options?.terserOptions) {
          plugin.options.terserOptions.compress = {
            ...plugin.options.terserOptions.compress,
            drop_console: !DEBUG_MODE,
          };
        }
      }
    }

    return config;
  },
};

export default analyzer({ enabled: ANALYZE, logLevel: 'info', openAnalyzer: ANALYZE })(nextConfig);
