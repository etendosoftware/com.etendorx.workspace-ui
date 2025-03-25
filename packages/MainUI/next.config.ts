import type { NextConfig } from 'next';

const DEBUG_MODE = process.env.DEBUG_MODE === 'true';

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
  cleanDistDir: true,
  bundlePagesRouterDependencies: true,
  output: 'standalone',
  compiler: {
    // Disable console.log removal
    removeConsole: !DEBUG_MODE,
  },
  compress: !DEBUG_MODE,
  webpack(config) {
    // Disable code minification in development mode
    config.optimization = {
      ...config.optimization,
      minimize: !DEBUG_MODE,
    };

    // Add support for SVGs
    config.module.rules.push({
      test: /\.svg$/,
      issuer: /\.[jt]sx?$/,
      oneOf: [
        {
          resourceQuery: /url/, // *.svg?url
          type: 'asset/resource',
          generator: {
            filename: 'static/media/[name].[hash][ext]',
          },
        },
        {
          loader: '@svgr/webpack',
          options: { icon: true },
        },
      ],
    });

    // Disable console.log removal
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

export default nextConfig;
