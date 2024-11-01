import type { NextConfig } from 'next';

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
  // reactStrictMode: false,
  webpack(config) {
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
