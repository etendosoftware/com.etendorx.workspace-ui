const config = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-onboarding',
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@chromatic-com/storybook',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async config => {
    if (config.plugins) {
      config.plugins = [...config.plugins];
    }

    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          '@workspaceui/componentlibrary': '/home/santi/fresh/com.etendorx.workspace-ui/packages/ComponentLibrary',
          '@workspaceui/etendohookbinder': '/home/santi/fresh/com.etendorx.workspace-ui/packages/EtendoHookBinder',
          '@workspaceui/mainui': '/home/santi/fresh/com.etendorx.workspace-ui/packages/MainUI',
        },
      },
      define: {
        'process.env': {
          NODE_ENV: JSON.stringify('development'),
          VITE_API_BASE_URL: JSON.stringify('http://localhost:8080/etendo'),
          VITE_CACHE_DURATION: JSON.stringify('3600000'),
          VITE_AUTH_HEADER_NAME: JSON.stringify('Authorization'),
        },
      },
    };
  },
};

export default config;
