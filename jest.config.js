/** @type {import('jest').Config} */
export default {
  preset: "ts-jest",
  testEnvironment: "jsdom",

  projects: ["<rootDir>/packages/MainUI", "<rootDir>/packages/api-client", "<rootDir>/packages/ComponentLibrary"],

  collectCoverage: false, // Only collect when --coverage flag is used

  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(gif|ttf|eot|svg|png|jpg|jpeg)$": "<rootDir>/__mocks__/fileMock.js",
    "^@workspaceui/api-client(.*)$": "<rootDir>/packages/api-client/src$1",
    "^@workspaceui/componentlibrary(.*)$": "<rootDir>/packages/ComponentLibrary/src$1",
    "^@workspaceui/mainui(.*)$": "<rootDir>/packages/MainUI$1",
    "^@/(.*)$": "<rootDir>/packages/MainUI/$1",
  },

  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/dist/", "<rootDir>/build/", "<rootDir>/.next/"],

  collectCoverageFrom: [
    "packages/ComponentLibrary/src/**/*.{ts,tsx}",
    "packages/MainUI/src/**/*.{ts,tsx}",
    "packages/MainUI/components/**/*.{ts,tsx}",
    "packages/MainUI/hooks/**/*.{ts,tsx}",
    "packages/MainUI/contexts/**/*.{ts,tsx}",
    "packages/MainUI/utils/**/*.{ts,tsx}",
    "packages/api-client/src/**/*.{ts,tsx}",
    "!packages/*/src/**/*.d.ts",
    "!packages/*/src/**/*.stories.{ts,tsx}",
    "!packages/*/src/**/*.test.{ts,tsx}",
    "!packages/*/src/**/__tests__/**",
    "!packages/*/src/**/index.{ts,tsx}",
    "!packages/*/src/**/types.{ts,tsx}",
    "!packages/*/src/**/constants.{ts,tsx}",
    "!**/node_modules/**",
    "!**/dist/**",
    "!**/.next/**",
  ],

  coverageDirectory: "<rootDir>/coverage",

  coverageReporters: ["text", "lcov", "html", "text-summary"],

  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },

  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },

  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],

  testTimeout: 10000,
};
