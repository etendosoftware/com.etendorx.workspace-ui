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
    "^react-markdown$": "<rootDir>/__mocks__/react-markdown.js",
    'react-markdown': '<rootDir>/node_modules/react-markdown/react-markdown.min.js',
    '\\.svg\\?url$': '<rootDir>/__mocks__/fileMock.js',
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

  transformIgnorePatterns: [
    "node_modules/(?!(react-markdown|remark-.*|unist-.*|unified|bail|is-plain-obj|trough|vfile|vfile-message|micromark|micromark-.*|mdast-.*|character-entities|decode-named-character-reference|property-information|hast-.*|html-void-elements|space-separated-tokens|comma-separated-tokens|zwitch|longest-streak|ccount|escape-string-regexp|markdown-table)/)"
  ],
};
