/** @type {import('jest').Config} */
export default {
  displayName: "MainUI",
  preset: "ts-jest",
  testEnvironment: "jsdom",

  rootDir: ".",

  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.{ts,tsx}",
    "<rootDir>/src/**/*.{test,spec}.{ts,tsx}",
    "<rootDir>/**/__tests__/**/*.{ts,tsx}",
    "<rootDir>/**/*.{test,spec}.{ts,tsx}",
  ],

  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@workspaceui/api-client/src/(.*)$": "<rootDir>/../api-client/src/$1",
    "^@workspaceui/api-client(.*)$": "<rootDir>/../api-client/src$1",
    "^@workspaceui/componentlibrary/src/assets/.*\\.svg\\?url$": "<rootDir>/__mocks__/svgUrlMock.js",
    "^@workspaceui/componentlibrary/src/assets/.*\\.svg$": "<rootDir>/__mocks__/svgMock.js",
    "^@workspaceui/componentlibrary/src/(.*)$": "<rootDir>/../ComponentLibrary/src/$1",
    "^@workspaceui/componentlibrary(.*)$": "<rootDir>/../ComponentLibrary/src$1",
    "^react-markdown$": "<rootDir>/__mocks__/react-markdown.js",
    "\\.svg\\?url$": "<rootDir>/__mocks__/svgUrlMock.js",
    "\\.svg$": "<rootDir>/__mocks__/svgMock.js",
    "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/cssMock.js",
    "\\.(gif|ttf|eot|png|jpg|jpeg)$": "<rootDir>/__mocks__/fileMock.js",
  },

  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          jsx: "react-jsx",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },

  transformIgnorePatterns: [
    "node_modules/(?!(@workspaceui)/)"
  ],

  collectCoverageFrom: [
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "contexts/**/*.{ts,tsx}",
    "hooks/**/*.{ts,tsx}",
    "utils/**/*.{ts,tsx}",
    "screens/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/*.stories.{ts,tsx}",
    "!**/*.test.{ts,tsx}",
    "!**/__tests__/**",
    "!**/types.{ts,tsx}",
    "!**/constants.{ts,tsx}",
    "!**/node_modules/**",
  ],

  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/dist/", "<rootDir>/.next/", "<rootDir>/out/"],

  testEnvironmentOptions: {
    url: "http://localhost:3000",
  },

  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  globals: {
    'ts-jest': {
      useESM: true
    }
  },
};
