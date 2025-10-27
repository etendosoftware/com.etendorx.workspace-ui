/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at  
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

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
    "^remark-gfm$": "<rootDir>/__mocks__/remark-gfm.js",
    "^react-markdown$": "<rootDir>/__mocks__/ReactMarkdownMock.tsx",
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

  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/dist/", "<rootDir>/__tests__/test-utils.tsx"],

  transformIgnorePatterns: [
    "node_modules/(?!(react-markdown|remark-.*|unist-.*|unified|bail|is-plain-obj|trough|vfile|vfile-message|micromark|micromark-.*|mdast-.*|character-entities|decode-named-character-reference|property-information|hast-.*|html-void-elements|space-separated-tokens|comma-separated-tokens|zwitch|longest-streak|ccount|escape-string-regexp|markdown-table)/)"
  ],
};
