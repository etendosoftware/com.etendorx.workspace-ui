/** @type {import('jest').Config} */
export default {
  displayName: "ComponentLibrary",
  preset: "ts-jest",
  testEnvironment: "jsdom",

  rootDir: ".",

  testMatch: ["<rootDir>/__tests__/**/*.{ts,tsx}", "<rootDir>/src/**/*.{test,spec}.{ts,tsx}"],

  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  moduleNameMapper: {
    "^@workspaceui/api-client(.*)$": "<rootDir>/../api-client/src$1",
    "^@workspaceui/mainui(.*)$": "<rootDir>/../MainUI$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(gif|ttf|eot|svg|png|jpg|jpeg)$": "<rootDir>/__mocks__/fileMock.js",
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

  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{ts,tsx}",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/__tests__/**",
    "!src/**/types.{ts,tsx}",
    "!src/**/index.{ts,tsx}",
    "!src/**/constants.{ts,tsx}",
    "!**/node_modules/**",
  ],

  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/dist/"],
};
