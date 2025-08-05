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
    "^@workspaceui/api-client(.*)$": "<rootDir>/../api-client$1",
    "\\.svg$": "<rootDir>/__mocks__/svgMock.js",
    "^@workspaceui/componentlibrary(.*)$": "<rootDir>/../ComponentLibrary$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(gif|ttf|eot|png|jpg|jpeg)$": "<rootDir>/__mocks__/fileMock.js",
    "^react-markdown$": "<rootDir>/__mocks__/ReactMarkdownMock.tsx",
    "\\.svg\\?url$": "<rootDir>/__mocks__/fileMock.js",
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

  transformIgnorePatterns: [
    "node_modules/(?!(react-markdown|remark-.*|unist-.*|unified|bail|is-plain-obj|trough|vfile|vfile-message|micromark|micromark-.*|mdast-.*|character-entities|decode-named-character-reference|property-information|hast-.*|html-void-elements|space-separated-tokens|comma-separated-tokens|zwitch|longest-streak|ccount|escape-string-regexp|markdown-table)/)"
  ],

  testEnvironmentOptions: {
    url: "http://localhost:3000",
  },
};
