import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  output: 'export',
  distDir: './dist',

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/i,
      type: 'asset/resource',
      generator: {
        filename: 'static/fonts/[name][ext]',
      },
    });

    return config;
  },

  experimental: {
    outputFileTracingRoot: undefined,
  },

  transpilePackages: ['@workspaceui/storybook', '@workspaceui/etendohookbinder', '@workspaceui/componentlibrary'],
};

nextConfig.resolve = {
  alias: {
    '@workspaceui/storybook': path.resolve(__dirname, '../storybook/src'),
    '@workspaceui/etendohookbinder': path.resolve(__dirname, '../EtendoHookBinder/src'),
    '@workspaceui/componentlibrary': path.resolve(__dirname, '../ComponentLibrary/src'),
  },
};

export default nextConfig;
