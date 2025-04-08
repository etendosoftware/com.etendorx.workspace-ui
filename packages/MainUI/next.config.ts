import { NextConfig } from 'next';

const DEBUG_MODE = process.env.DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  reactStrictMode: DEBUG_MODE,
  cleanDistDir: false,
  output: 'standalone',
  excludeDefaultMomentLocales: true,
  compiler: {
    removeConsole: !DEBUG_MODE,
  },
  compress: !DEBUG_MODE,
  webpack(config) {
    // config.optimization = {
    //   ...config.optimization,
    //   minimize: !DEBUG_MODE,
    // };

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

    // if (config.optimization?.minimizer) {
    //   config.optimization.minimizer.forEach(
    //     (plugin: { options?: { terserOptions?: { compress?: { [key: string]: unknown } } } }) => {
    //       if (plugin.options && plugin.options.terserOptions) {
    //         plugin.options.terserOptions.compress = {
    //           ...plugin.options.terserOptions.compress,
    //           drop_console: !DEBUG_MODE,
    //         };
    //       }
    //     },
    //   );
    // }

    return config;
  },
};

export default nextConfig;
