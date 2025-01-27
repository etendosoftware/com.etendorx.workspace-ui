import type { NextConfig } from 'next';

const DEBUG_MODE = process.env.DEBUG_MODE === "true";

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
  reactStrictMode: true,
  cleanDistDir: true,
  bundlePagesRouterDependencies: true,
  output: 'standalone',
  compress: !DEBUG_MODE,
  webpack(config) {
    config.optimization = {
      ...config.optimization,
      minimize: !DEBUG_MODE,
    },

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

    return config;
  },
};

export default nextConfig;
