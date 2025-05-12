import { NextConfig } from 'next';
import analyzer from '@next/bundle-analyzer';

const DEBUG_MODE = process.env.DEBUG_MODE === 'true';
const ANALYZE = process.env.ANALYZE === 'true';

const nextConfig: NextConfig = {
  // transpilePackages: ['@mui/material', '@mui/system', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
  // modularizeImports: {
  //   '@mui/material': {
  //     transform: '@mui/material/{{member}}',
  //   },
  //   '@mui/icons-material': {
  //     transform: '@mui/icons-material/{{member}}',
  //   },
  // },
  reactStrictMode: true,
  cleanDistDir: false,
  output: 'standalone',
  compiler: {
    removeConsole: !DEBUG_MODE,
  },
  experimental: {
    optimizePackageImports: ['@mui/icons-material', 'material-react-table'],
  },
  compress: !DEBUG_MODE,
  webpack(config) {
    config.optimization = {
      ...config.optimization,
      minimize: !DEBUG_MODE,
    };

    const fileLoaderRule = config.module.rules.find(
      (rule: { test: { toString: () => string | string[] } }) => rule.test && rule.test.toString().includes('svg'),
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
      config.optimization.minimizer.forEach(
        (plugin: { options?: { terserOptions?: { compress?: { [key: string]: unknown } } } }) => {
          if (plugin.options && plugin.options.terserOptions) {
            plugin.options.terserOptions.compress = {
              ...plugin.options.terserOptions.compress,
              drop_console: !DEBUG_MODE,
            };
          }
        },
      );
    }

    return config;
  },
};

export default analyzer({ enabled: ANALYZE, logLevel: 'info', openAnalyzer: ANALYZE })(nextConfig);
