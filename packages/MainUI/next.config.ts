import { NextConfig } from 'next';

const DEBUG_MODE = process.env.DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development';

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

    // Grab the existing rule that handles SVG imports
    const fileLoaderRule = config.module.rules.find((rule: { test: { test: (arg0: string) => boolean } }) =>
      rule.test?.test?.('.svg'),
    );

    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      // Convert all other *.svg imports to React components
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] }, // exclude if *.svg?url
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              icon: true,
              expandProps: false,
            },
          },
        ],
      },
    );

    // Modify the file loader rule to ignore *.svg, since we have it handled now.
    fileLoaderRule.exclude = /\.svg$/i;

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
